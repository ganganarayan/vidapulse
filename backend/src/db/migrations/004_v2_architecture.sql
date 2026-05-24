-- ============================================================
-- MIGRATION 004 — VidaPulse v2 Architecture
-- Wow Moment · Behavioral Webhooks · Forever Free Plan
-- ============================================================
--
-- What this migration does (read before applying):
--
-- REMOVES:
--   users.plan_expires_at       — free plan is forever free; recurring
--                                 plans managed by Razorpay, not here
--   plans.price_inr             — USD-only pricing
--   outbound_webhook_configs    — v1 multi-URL table, replaced below
--   outbound_webhook_logs       — v1 log table, replaced below
--
-- MODIFIES:
--   users          — rename onboarding_done→onboarding_completed,
--                    business_segment ENUM→VARCHAR, add 4 new columns
--   videos         — add 6 insight/story tracking columns
--   plans          — add has_expiry, drop price_inr,
--                    reformat features JSONB array→boolean object,
--                    update seed data (USD only, no INR)
--
-- ADDS (7 new tables):
--   webhook_settings       — ONE row, ONE URL, admin pastes once
--   behavioral_events      — internal event bus for 14+ events
--   webhook_outbound_log   — full audit trail, never deleted
--   onboarding_state       — per-user milestone tracker, no trial fields
--   video_insights         — all insight text lives here (never in JSX)
--   viewer_stories         — 4 story types per video
--   video_milestones       — deduplication guard for milestone events
--
-- Total tables after this migration: 35
-- ============================================================


-- ============================================================
-- SECTION 1 — REMOVE DEPRECATED COLUMNS
-- ============================================================

-- Free plan is forever free.
-- Paid plans (Starter, Pro) are monthly recurring — Razorpay/Stripe
-- webhooks manage renewal. VidaPulse never tracks expiry.
ALTER TABLE users DROP COLUMN IF EXISTS plan_expires_at;

-- USD-only pricing — INR column no longer used.
ALTER TABLE plans DROP COLUMN IF EXISTS price_inr;


-- ============================================================
-- SECTION 2 — DROP v1 OUTBOUND WEBHOOK TABLES
-- Replaced by webhook_settings + webhook_outbound_log (Section 6+)
-- ============================================================

DROP TABLE IF EXISTS outbound_webhook_logs;
DROP TABLE IF EXISTS outbound_webhook_configs;


-- ============================================================
-- SECTION 3 — MODIFY: users table
-- ============================================================

-- 3a: Rename onboarding_done → onboarding_completed
--     Preserves any existing TRUE values for current users.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'onboarding_done'
  ) THEN
    ALTER TABLE users RENAME COLUMN onboarding_done TO onboarding_completed;
  END IF;
END
$$;

-- 3b: Change business_segment from ENUM → VARCHAR(50)
--     Relaxes the constraint so new values can be added without migrations.
--     Existing values (coach, creator, product_promoter, digital_agency,
--     b2b_sales, other) are preserved as-is.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users'
      AND column_name = 'business_segment'
      AND data_type = 'USER-DEFINED'
  ) THEN
    ALTER TABLE users
      ALTER COLUMN business_segment TYPE VARCHAR(50)
      USING business_segment::text;
  END IF;
END
$$;

-- Drop the now-unused ENUM type (safe — only users.business_segment used it)
DROP TYPE IF EXISTS business_segment;

-- 3c: Add new columns
ALTER TABLE users
  -- use_case: the user's content type, drives divineleads email branching
  -- Values: vsl_funnel | webinar_replay | coaching_clients | sales_demo | other
  ADD COLUMN IF NOT EXISTS use_case VARCHAR(40),

  -- first_video_id: set when user adds their first video (triggers behavioral event)
  ADD COLUMN IF NOT EXISTS first_video_id UUID REFERENCES videos(id) ON DELETE SET NULL,

  -- wow_moment_seen: TRUE after user first views primary insight card
  ADD COLUMN IF NOT EXISTS wow_moment_seen BOOLEAN NOT NULL DEFAULT FALSE,

  -- onboarding_completed: set TRUE when all core onboarding steps are done
  -- (only added if the rename above didn't already create it)
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE;


-- ============================================================
-- SECTION 4 — MODIFY: videos table
-- ============================================================

ALTER TABLE videos
  -- Insight engine status (set by background job)
  ADD COLUMN IF NOT EXISTS insight_status        VARCHAR(20) NOT NULL DEFAULT 'pending',
    -- pending | generating | complete | failed

  ADD COLUMN IF NOT EXISTS insight_generated_at  TIMESTAMPTZ,

  -- Cached drop-off point: written by insight engine, read by heatmap on every load.
  -- Never scan heatmap_aggregate on page load — always read this cached value.
  ADD COLUMN IF NOT EXISTS primary_drop_off_second INTEGER,
  ADD COLUMN IF NOT EXISTS primary_drop_off_pct    NUMERIC(5,2),

  -- Viewer story engine status (set by background job, runs after insight engine)
  ADD COLUMN IF NOT EXISTS story_status          VARCHAR(20) NOT NULL DEFAULT 'pending',
    -- pending | generating | complete | failed

  ADD COLUMN IF NOT EXISTS story_generated_at    TIMESTAMPTZ;


-- ============================================================
-- SECTION 5 — MODIFY: plans table
-- ============================================================

-- 5a: Add has_expiry flag
--     Free plan: FALSE (never expires).
--     Starter/Pro: FALSE in VidaPulse — renewal managed by Razorpay/Stripe.
ALTER TABLE plans
  ADD COLUMN IF NOT EXISTS has_expiry BOOLEAN NOT NULL DEFAULT FALSE;

-- 5b: Update plan seed data
--
-- IMPORTANT: features format is changing from a JSONB string array
-- (e.g. '["total_plays", "play_rate"]') to a JSONB boolean object
-- (e.g. '{"total_plays": true, "heatmap": false}').
--
-- This enables per-feature boolean gate checks in plan-gate middleware:
--   SELECT features->>'heatmap' FROM plans WHERE name = 'pro'  → 'true'
--
-- Feature gate matrix — matches pricing page exactly:
--
--   All plans (Free/Starter/Pro):
--     total_plays, play_rate, unique_visitors, domain_tracking, embed_code
--
--   Starter + Pro only:
--     geography, device_breakdown, avg_time_watched
--
--   Pro only:
--     heatmap, viewer_level, audience_segmentation,
--     conversion_tracking, events, reports, alerts
--
-- Rule: if the plan does not have a feature, no insights or behavioral
-- webhook events related to that feature are generated for that user.

UPDATE plans SET
  has_expiry  = FALSE,
  price_usd   = 0,
  video_limit = 1,
  features    = '{
    "total_plays":           true,
    "play_rate":             true,
    "unique_visitors":       true,
    "domain_tracking":       true,
    "embed_code":            true,
    "geography":             false,
    "device_breakdown":      false,
    "avg_time_watched":      false,
    "heatmap":               false,
    "viewer_level":          false,
    "audience_segmentation": false,
    "conversion_tracking":   false,
    "events":                false,
    "reports":               false,
    "alerts":                false
  }'::jsonb
WHERE name = 'free';

UPDATE plans SET
  has_expiry  = FALSE,
  price_usd   = 10,
  video_limit = 10,
  features    = '{
    "total_plays":           true,
    "play_rate":             true,
    "unique_visitors":       true,
    "domain_tracking":       true,
    "embed_code":            true,
    "geography":             true,
    "device_breakdown":      true,
    "avg_time_watched":      true,
    "heatmap":               false,
    "viewer_level":          false,
    "audience_segmentation": false,
    "conversion_tracking":   false,
    "events":                false,
    "reports":               false,
    "alerts":                false
  }'::jsonb
WHERE name = 'starter';

UPDATE plans SET
  has_expiry  = FALSE,
  price_usd   = 19,
  video_limit = NULL,   -- unlimited
  features    = '{
    "total_plays":           true,
    "play_rate":             true,
    "unique_visitors":       true,
    "domain_tracking":       true,
    "embed_code":            true,
    "geography":             true,
    "device_breakdown":      true,
    "avg_time_watched":      true,
    "heatmap":               true,
    "viewer_level":          true,
    "audience_segmentation": true,
    "conversion_tracking":   true,
    "events":                true,
    "reports":               true,
    "alerts":                true
  }'::jsonb
WHERE name = 'pro';

-- admin_lifetime: keep all features, just mark no-expiry
UPDATE plans SET
  has_expiry = FALSE
WHERE name = 'admin_lifetime';


-- ============================================================
-- SECTION 6 — NEW TABLE: webhook_settings
--
-- ONE row. ONE URL. Admin pastes the divineleads endpoint once.
-- All 14+ behavioral events fire to this single URL.
-- VidaPulse never stores per-event URLs.
-- ============================================================

CREATE TABLE IF NOT EXISTS webhook_settings (
  id               BIGSERIAL    PRIMARY KEY,
  webhook_url      TEXT,
    -- NULL until admin configures. Webhook sender skips if NULL.
  webhook_secret   TEXT,
    -- Optional HMAC-SHA256 signing key.
    -- If NULL, requests are sent unsigned (not recommended for production).
  is_active        BOOLEAN      NOT NULL DEFAULT FALSE,
    -- FALSE = webhook sender skips all events (safe default).
    -- Admin flips to TRUE after pasting URL and verifying test.
  last_tested_at   TIMESTAMPTZ,
  last_test_status VARCHAR(20),   -- 'success' | 'failed'
  last_test_error  TEXT,
  notes            TEXT,           -- free-text admin notes field
  created_at       TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- Exactly one row, always. Safe to run multiple times.
INSERT INTO webhook_settings (is_active)
SELECT FALSE
WHERE NOT EXISTS (SELECT 1 FROM webhook_settings LIMIT 1);


-- ============================================================
-- SECTION 7 — NEW TABLE: behavioral_events
--
-- Internal event bus. emitEvent() writes here first, then the
-- webhook sender polls this table every 30 seconds.
-- Never throws on write failure — errors are logged, not surfaced.
-- ============================================================

CREATE TABLE IF NOT EXISTS behavioral_events (
  id           BIGSERIAL    PRIMARY KEY,
  user_id      UUID         REFERENCES users(id)  ON DELETE CASCADE,
  event_key    VARCHAR(60)  NOT NULL,
    -- Defined event keys (14 core + auth extensions):
    --
    -- ONBOARDING / FUNNEL (one-time per user):
    --   user_signed_up          — after INSERT into users
    --   first_video_added       — after user's first video INSERT
    --   wow_moment_seen         — on first view of primary insight card
    --   first_analytics_milestone — unique viewers crosses 10
    --   twenty_viewers_milestone  — unique viewers crosses 20
    --   fifty_viewers_milestone   — unique viewers crosses 50
    --   converted_to_paid         — after Razorpay/Stripe payment confirmed
    --
    -- REPEATING (with frequency caps):
    --   no_video_after_48hrs    — hourly job, max once per 7 days
    --   no_return_after_wow     — hourly job, max once per 7 days
    --   upgrade_page_visited    — every visit to /upgrade
    --   free_limit_hit          — every time free user hits video limit
    --   pro_feature_attempted   — every time gated Pro feature is requested
    --   payment_failed          — every payment failure event
    --
    -- PER-VIDEO (once per video, not per user):
    --   video_milestone_100_plays — total plays crosses 100
    --
    -- AUTH-TRANSACTIONAL (for divineleads to send emails):
    --   password_reset_requested  — forgot-password flow; payload has reset_token
    --     (replaces Resend email — divineleads sends the reset link)
  video_id     UUID         REFERENCES videos(id) ON DELETE SET NULL,
  payload      JSONB        NOT NULL DEFAULT '{}',
  processed    BOOLEAN      NOT NULL DEFAULT FALSE,
    -- Set TRUE after webhook_sender successfully fires (or exhausts retries)
  processed_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_be_user
  ON behavioral_events(user_id);

-- Hot path: webhook sender polls this index every 30 seconds
CREATE INDEX IF NOT EXISTS idx_be_unprocessed
  ON behavioral_events(processed, created_at)
  WHERE processed = FALSE;

CREATE INDEX IF NOT EXISTS idx_be_key
  ON behavioral_events(event_key, user_id);


-- ============================================================
-- SECTION 8 — NEW TABLE: webhook_outbound_log
--
-- Full audit trail. Every attempt, response, and error is logged.
-- Never deleted. Admin can see failed/abandoned rows in settings panel.
-- ============================================================

CREATE TABLE IF NOT EXISTS webhook_outbound_log (
  id                   BIGSERIAL    PRIMARY KEY,
  behavioral_event_id  BIGINT       REFERENCES behavioral_events(id) ON DELETE SET NULL,
  user_id              UUID         REFERENCES users(id) ON DELETE SET NULL,
  event_key            VARCHAR(60)  NOT NULL,
  webhook_url_snapshot TEXT         NOT NULL,
    -- URL captured at fire time — audit trail survives URL changes
  payload              JSONB        NOT NULL,
  status               VARCHAR(20)  NOT NULL DEFAULT 'pending',
    -- pending | sent | failed | abandoned
  attempts             INTEGER      NOT NULL DEFAULT 0,
  max_attempts         INTEGER      NOT NULL DEFAULT 3,
  response_code        INTEGER,
  response_body        TEXT,
  error_message        TEXT,
  next_retry_at        TIMESTAMPTZ,
    -- Retry schedule: attempt 1 = immediate, 2 = +5 min, 3 = +30 min
    -- After 3 failures: status = 'abandoned', next_retry_at = NULL
  created_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  last_attempted_at    TIMESTAMPTZ
);

-- Hot path: webhook sender polls for pending/failed rows needing retry
CREATE INDEX IF NOT EXISTS idx_wol_status
  ON webhook_outbound_log(status, next_retry_at)
  WHERE status IN ('pending', 'failed');

CREATE INDEX IF NOT EXISTS idx_wol_user
  ON webhook_outbound_log(user_id);

CREATE INDEX IF NOT EXISTS idx_wol_event_key
  ON webhook_outbound_log(event_key);


-- ============================================================
-- SECTION 9 — NEW TABLE: onboarding_state
--
-- One row per user. Tracks all 14 behavioral milestones.
-- No trial expiry fields anywhere in this table.
-- Upgrade intent is driven by limit_hit_count, not time.
-- Updated inside transactions via emitEvent() — never from frontend.
-- ============================================================

CREATE TABLE IF NOT EXISTS onboarding_state (
  id                          BIGSERIAL    PRIMARY KEY,
  user_id                     UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  current_step                VARCHAR(60)  NOT NULL DEFAULT 'signed_up',
    -- Latest milestone reached — used for funnel display in admin panel

  -- ── Milestone timestamps (NULL = not yet reached) ──────────
  signed_up_at                TIMESTAMPTZ,
  first_video_added_at        TIMESTAMPTZ,
  first_analytics_viewed_at   TIMESTAMPTZ,
  wow_moment_seen_at          TIMESTAMPTZ,
  milestone_10_viewers_at     TIMESTAMPTZ,
  milestone_20_viewers_at     TIMESTAMPTZ,
  milestone_50_viewers_at     TIMESTAMPTZ,
  milestone_100_plays_at      TIMESTAMPTZ,
  free_limit_hit_at           TIMESTAMPTZ,
  pro_feature_attempted_at    TIMESTAMPTZ,
  upgrade_page_visited_at     TIMESTAMPTZ,
  converted_to_paid_at        TIMESTAMPTZ,

  -- ── Boolean flags (fast reads for conditions + admin queries) ──
  video_added                 BOOLEAN      NOT NULL DEFAULT FALSE,
  wow_moment_seen             BOOLEAN      NOT NULL DEFAULT FALSE,
  free_limit_hit              BOOLEAN      NOT NULL DEFAULT FALSE,
  pro_feature_attempted       BOOLEAN      NOT NULL DEFAULT FALSE,

  -- ── Upgrade intent score ────────────────────────────────────
  -- Increments on every free_limit_hit or pro_feature_attempted event.
  -- Higher score = higher upgrade urgency in admin funnel panel.
  limit_hit_count             INTEGER      NOT NULL DEFAULT 0,

  -- ── Conversion timing (hours between milestones) ───────────
  -- Populated when each downstream milestone is reached.
  -- Used in admin panel median calculations.
  hours_signup_to_first_video NUMERIC(8,2),
  hours_signup_to_wow_moment  NUMERIC(8,2),
  hours_wow_to_paid           NUMERIC(8,2),
  hours_limit_hit_to_paid     NUMERIC(8,2),

  created_at                  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  UNIQUE (user_id)
);

-- Backfill onboarding_state rows for all existing users.
-- New users get a row created by emitEvent('user_signed_up').
INSERT INTO onboarding_state (user_id, signed_up_at, current_step)
SELECT id, created_at, 'signed_up'
FROM users
ON CONFLICT (user_id) DO NOTHING;


-- ============================================================
-- SECTION 10 — NEW TABLE: video_insights
--
-- All auto-generated insight text lives here.
-- Frontend reads from DB — nothing hardcoded in React/JSX.
-- Insight engine upserts using the functional unique index below.
-- ============================================================

CREATE TABLE IF NOT EXISTS video_insights (
  id                BIGSERIAL    PRIMARY KEY,
  video_id          UUID         NOT NULL REFERENCES videos(id)  ON DELETE CASCADE,
  user_id           UUID         NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
  insight_type      VARCHAR(50)  NOT NULL,
    -- drop_off_moment | low_play_rate | strong_opener | mobile_drop
    -- engagement_spike | completion_champion | dead_zone
  severity          VARCHAR(20)  NOT NULL DEFAULT 'info',
    -- info | opportunity | warning | critical
  timestamp_seconds INTEGER,
    -- Second in the video this insight refers to (NULL for non-timestamped insights)
  headline          TEXT         NOT NULL,
  body              TEXT         NOT NULL,
  action_prompt     TEXT         NOT NULL,
  metric_value      NUMERIC,
  metric_label      VARCHAR(100),
  is_primary        BOOLEAN      NOT NULL DEFAULT FALSE,
    -- Exactly one row per video has is_primary = TRUE (the drop_off_moment insight).
    -- This is the "wow moment" card shown prominently on the dashboard.
  is_dismissed      BOOLEAN      NOT NULL DEFAULT FALSE,
    -- Set via PATCH /api/videos/:id/insights/:id/dismiss
    -- Hides the card in the UI; does not delete the row.
  generated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  data_snapshot     JSONB
    -- Raw computed numbers used to generate this insight (for audit/debug).
    -- e.g. {"drop_pct": 68, "second": 83, "viewers_before": 47}
);

-- Functional unique index supporting COALESCE in the engine's upsert:
--   ON CONFLICT (video_id, insight_type, COALESCE(timestamp_seconds, -1))
-- Allows multiple timestamped insights of the same type (e.g. multiple dead zones)
-- while treating timestamp_seconds = NULL as a single row per (video, type).
CREATE UNIQUE INDEX IF NOT EXISTS uniq_vi_video_type_second
  ON video_insights(video_id, insight_type, (COALESCE(timestamp_seconds, -1)));

CREATE INDEX IF NOT EXISTS idx_vi_video
  ON video_insights(video_id, is_primary, is_dismissed);

CREATE INDEX IF NOT EXISTS idx_vi_user
  ON video_insights(user_id);


-- ============================================================
-- SECTION 11 — NEW TABLE: viewer_stories
--
-- 4 story types per video. Generated after insight engine.
-- Upsert pattern: mark all rows is_stale=TRUE, then re-upsert.
-- ============================================================

CREATE TABLE IF NOT EXISTS viewer_stories (
  id             BIGSERIAL    PRIMARY KEY,
  video_id       UUID         NOT NULL REFERENCES videos(id)          ON DELETE CASCADE,
  story_type     VARCHAR(40)  NOT NULL,
    -- most_engaged | common_drop_pattern | source_pattern | mobile_pattern
  headline       TEXT         NOT NULL,
  detail         TEXT         NOT NULL,
  interpretation TEXT         NOT NULL,
  session_id     UUID         REFERENCES analytics_sessions(id)       ON DELETE SET NULL,
    -- Anchor session for most_engaged story type
  viewer_count   INTEGER      NOT NULL DEFAULT 1,
  is_stale       BOOLEAN      NOT NULL DEFAULT FALSE,
    -- Set TRUE before regenerating; cleared when new story is written
  generated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  UNIQUE (video_id, story_type)
);

CREATE INDEX IF NOT EXISTS idx_vs_video
  ON viewer_stories(video_id, is_stale);


-- ============================================================
-- SECTION 12 — NEW TABLE: video_milestones
--
-- Deduplication guard: prevents emitting the same milestone event
-- more than once per video. INSERT fails on duplicate (by design).
-- ============================================================

CREATE TABLE IF NOT EXISTS video_milestones (
  id            BIGSERIAL    PRIMARY KEY,
  video_id      UUID         NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  milestone_key VARCHAR(40)  NOT NULL,
    -- viewers_10 | viewers_20 | viewers_50 | plays_100
  fired_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  UNIQUE (video_id, milestone_key)
);


-- ============================================================
-- SECTION 13 — NOTES (no SQL — code changes for next steps)
-- ============================================================

-- The following are CODE changes required alongside this migration.
-- They are NOT schema changes. Do not apply them here.
-- They will be implemented as part of the build order (Steps 2–7):
--
-- 1. REMOVE Resend dependency:
--      backend/package.json: remove "resend"
--      backend/src/services/emailService.js: delete file
--      backend/src/services/authService.js: remove sendPasswordResetEmail import
--      backend/src/services/userService.js: remove sendSetPasswordEmail import
--
-- 2. UPDATE user_signed_up webhook payload to include set_password_token:
--      When userService creates a new account with password_set=FALSE,
--      generate a set_password token (48h expiry) and include it in
--      the user_signed_up behavioral event payload so divineleads can
--      send the welcome + set-password email.
--
-- 3. UPDATE forgotPassword() flow:
--      Instead of sendPasswordResetEmail(), emit a behavioral event
--      'password_reset_requested' with the reset_token in the payload.
--      divineleads sends the reset email using:
--        https://app.vidapulse.in/reset-password?token=<token>
--
-- 4. UPDATE plan-gate middleware:
--      Plan features are now JSONB objects ({"heatmap": true/false}).
--      Gate check changes from:
--        features.includes('engagement_heatmaps')
--      to:
--        features.heatmap === true
--
-- 5. UPDATE routes/auth.js:
--      Line 187: u.onboarding_done → u.onboarding_completed
--      Remove u.plan_expires_at from all SELECT queries
--
-- 6. UPGRADE MODAL (frontend — Part 9 of v2 spec):
--      Features always rendered but CSS-blurred with lock icon.
--      Clicking triggers upgrade modal (not navigation).
--      Modal reads current_plan from 403 response:
--        free   → show Starter ($10/mo) + Pro ($19/mo) options
--        starter → show Pro ($19/mo) option only
