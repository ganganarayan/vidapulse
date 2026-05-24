-- ============================================================
-- MIGRATION 005 — Insight Dispatch System
-- ============================================================
--
-- What this migration does:
--
-- MODIFIES:
--   behavioral_events  — add scheduled_for (dispatch timing control)
--   users              — add is_online, last_seen_at, last_seen_screen
--   user_preferences   — add insight_emails_enabled
--
-- ADDS (4 new tables):
--   in_app_notifications   — presence-aware delivery queue (bell + email dispatch)
--   insight_template_keys  — template routing table (14 seeds)
--   insight_email_counters — per-user daily email cap (2 bundled/day)
--   webhook_governor       — global hourly rate cap (25/hr) + admin pause
--
-- Architecture: Online users see the in-app notification bell.
-- Offline users get a bundled email via the dispatch worker (Step 6).
-- The dispatch worker NEVER fires if: user is online, daily cap hit,
-- hourly governor cap hit, or user has opted out.
--
-- Total tables after this migration: 39
-- ============================================================


-- ============================================================
-- SECTION 1 — behavioral_events: add scheduled_for
-- ============================================================

ALTER TABLE behavioral_events
  ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMPTZ;
  -- NULL = eligible for immediate dispatch.
  -- Dispatch worker respects: scheduled_for IS NULL OR scheduled_for <= NOW()

-- Replace the unprocessed hot-path index to include scheduled_for
DROP INDEX IF EXISTS idx_be_unprocessed;
CREATE INDEX IF NOT EXISTS idx_be_unprocessed
  ON behavioral_events(scheduled_for, created_at)
  WHERE processed = FALSE;


-- ============================================================
-- SECTION 2 — users: presence tracking columns
-- ============================================================

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS is_online        BOOLEAN     NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS last_seen_at     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_seen_screen VARCHAR(100);
  -- last_seen_screen: 'dashboard' | 'video_analytics' | 'settings' | etc.
  -- Set by POST /api/user/heartbeat (must respond < 50ms)


-- ============================================================
-- SECTION 3 — user_preferences: email opt-out
-- ============================================================

ALTER TABLE user_preferences
  ADD COLUMN IF NOT EXISTS insight_emails_enabled BOOLEAN NOT NULL DEFAULT TRUE;
  -- User can toggle via PUT /api/user/preferences
  -- Dispatch worker checks this before every fire — never emails opted-out users


-- ============================================================
-- SECTION 4 — NEW TABLE: in_app_notifications
--
-- Dual-purpose table:
--   (a) Powers the dashboard notification bell (GET /api/user/notifications)
--   (b) Serves as the dispatch worker's email queue
--
-- One row per insight per user per video.
-- dispatched_at = NULL  → not yet included in an email webhook.
-- dispatched_at = set   → this notification was bundled into a fired webhook.
-- ============================================================

CREATE TABLE IF NOT EXISTS in_app_notifications (
  id                BIGSERIAL    PRIMARY KEY,
  user_id           UUID         NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
  video_id          UUID                  REFERENCES videos(id) ON DELETE SET NULL,
  insight_type      VARCHAR(50),
    -- Matches video_insights.insight_type.
    -- NULL for milestone notifications (milestone_10, milestone_100, etc.)
  template_key      VARCHAR(50)  NOT NULL,
    -- Must exist in insight_template_keys; dispatch worker validates.
    -- Falls back to 'multiple_insights' if missing.
  headline          TEXT         NOT NULL,
    -- Short text shown in the bell panel, e.g. "New insight on Your VSL"
  dashboard_url     TEXT         NOT NULL,
    -- Deep link: https://app.vidapulse.in/dashboard/videos/:id/analytics
  teaser_variable_1 TEXT         NOT NULL DEFAULT '',
    -- Qualitative hint for email personalisation. NO numbers/percentages/timestamps.
    -- Examples: 'mobile' | 'your homepage' | 'the opening section' | 'India'
  teaser_variable_2 TEXT         NOT NULL DEFAULT '',
    -- Second qualitative hint. Examples: 'desktop' | 'email' | ''
  is_read           BOOLEAN      NOT NULL DEFAULT FALSE,
  read_at           TIMESTAMPTZ,
    -- Set via PUT /api/user/notifications/:id/read
  dispatched_at     TIMESTAMPTZ,
    -- Set by dispatch worker when this row is included in a fired webhook.
    -- NULL = still in queue.
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Bell polling: GET /api/user/notifications returns unread, limit 20
CREATE INDEX IF NOT EXISTS idx_ian_user_unread
  ON in_app_notifications(user_id, created_at DESC)
  WHERE is_read = FALSE;

-- Dispatch worker hot path: runs every 60 seconds
CREATE INDEX IF NOT EXISTS idx_ian_dispatch_pending
  ON in_app_notifications(user_id, created_at)
  WHERE dispatched_at IS NULL;


-- ============================================================
-- SECTION 5 — NEW TABLE: insight_template_keys
--
-- Routing table used by the dispatch worker to validate template_key
-- before firing. If key is missing or inactive, falls back to
-- 'multiple_insights'. Admin can deactivate a key to suppress its emails.
-- ============================================================

CREATE TABLE IF NOT EXISTS insight_template_keys (
  id           BIGSERIAL    PRIMARY KEY,
  template_key VARCHAR(50)  UNIQUE NOT NULL,
  description  TEXT,
  is_active    BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- 14 seeds (from v2 spec + Module 6 additions)
INSERT INTO insight_template_keys (template_key, description) VALUES
  ('drop_off_moment',     'The exact moment where the majority of viewers leave the video'),
  ('play_rate_low',       'Play rate below 30% — page visitors are not pressing play'),
  ('play_rate_high',      'Play rate above 70% — strong opening hook signal'),
  ('mobile_gap',          'Mobile viewers drop off significantly earlier than desktop viewers'),
  ('geography_surprise',  'Audience is heavily concentrated in one country or region'),
  ('engagement_spike',    'Viewers rewatch a specific moment in the video repeatedly'),
  ('milestone_10',        '10 unique viewers reached on this video'),
  ('milestone_20',        '20 unique viewers reached on this video'),
  ('milestone_50',        '50 unique viewers reached on this video'),
  ('milestone_100',       '100 total plays reached on this video'),
  ('dead_zone',           'A consecutive section of the video that almost nobody watches'),
  ('returning_viewers',   'Unusually high rate of repeat viewers coming back to this video'),
  ('completion_champion', 'Unusually high video completion rate'),
  ('multiple_insights',   'Fallback: 2 or more insights bundled into one email notification')
ON CONFLICT (template_key) DO NOTHING;


-- ============================================================
-- SECTION 6 — NEW TABLE: insight_email_counters
--
-- Per-user daily cap enforcement.
-- Max 2 bundled email webhooks per user per day.
-- Dispatch worker reads + increments atomically (UPDATE ... RETURNING).
-- ============================================================

CREATE TABLE IF NOT EXISTS insight_email_counters (
  id          BIGSERIAL    PRIMARY KEY,
  user_id     UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date        DATE         NOT NULL DEFAULT CURRENT_DATE,
  emails_sent INTEGER      NOT NULL DEFAULT 0,
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_iec_user_date
  ON insight_email_counters(user_id, date);


-- ============================================================
-- SECTION 7 — NEW TABLE: webhook_governor
--
-- Single-row global rate controller for insight email dispatch.
-- Dispatch worker reads this row and:
--   (a) Resets fires_this_hour + window_start if window has expired
--   (b) Refuses to fire if fires_this_hour >= hourly_cap
--   (c) Refuses to fire if is_paused = TRUE
-- Admin controls hourly_cap and is_paused from the webhook settings page.
-- ============================================================

CREATE TABLE IF NOT EXISTS webhook_governor (
  id              BIGSERIAL    PRIMARY KEY,
  window_start    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    -- Start of the current 1-hour counting window.
    -- When NOW() > window_start + 1 hour, worker resets fires_this_hour = 0.
  fires_this_hour INTEGER      NOT NULL DEFAULT 0,
    -- Incremented by dispatch worker on every successful webhook fire.
  hourly_cap      INTEGER      NOT NULL DEFAULT 25,
    -- Admin can raise/lower from webhook settings panel.
  is_paused       BOOLEAN      NOT NULL DEFAULT FALSE,
    -- TRUE = dispatch worker skips all firing (admin safety switch).
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Exactly one row, always. Safe to run multiple times.
INSERT INTO webhook_governor (window_start, fires_this_hour, hourly_cap, is_paused)
SELECT NOW(), 0, 25, FALSE
WHERE NOT EXISTS (SELECT 1 FROM webhook_governor LIMIT 1);
