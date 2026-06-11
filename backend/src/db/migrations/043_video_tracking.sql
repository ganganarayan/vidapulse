-- ============================================================
-- 043_video_tracking.sql
--
-- VIEWER-PLANE tracking foundation (subscriber-owned video tracking).
-- Completely separate from the platform event_webhooks plane.
--
-- All additive + idempotent. Nothing references these tables until the
-- tracking service + embed are wired in later phases, and tracking is
-- DISABLED by default per video — so this migration is a no-op for existing
-- playback, analytics, and CRM delivery.
-- ============================================================

-- ── Per-video tracking config (1:1, mirrors video_player_settings) ─────────
-- pixel_id = the OWNER's Meta Pixel for this video. enabled = owner opted in.
CREATE TABLE IF NOT EXISTS video_tracking_settings (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  video_id    UUID NOT NULL UNIQUE REFERENCES videos(id) ON DELETE CASCADE,
  enabled     BOOLEAN NOT NULL DEFAULT FALSE,
  pixel_id    TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Per-USER tracking webhooks (subscriber's CRM for viewer events) ────────
-- Separate from event_webhooks (platform). UNIQUE(user_id,url) allows multiple
-- endpoints per subscriber without schema change.
CREATE TABLE IF NOT EXISTS tracking_webhooks (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  url         TEXT NOT NULL,
  status      VARCHAR(16) NOT NULL DEFAULT 'active',  -- active | inactive
  secret      TEXT,                                    -- reserved for future HMAC
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, url)
);
CREATE INDEX IF NOT EXISTS idx_tracking_webhooks_user_status
  ON tracking_webhooks (user_id, status);

-- ── Once-per-session dedup for viewer WEBHOOK delivery ─────────────────────
-- The pixel still fires every occurrence (client-side); this only gates the
-- CRM webhook. Keyed by the analytics_sessions id + event key.
CREATE TABLE IF NOT EXISTS tracking_session_events (
  session_id  UUID         NOT NULL,
  event_key   VARCHAR(80)  NOT NULL,
  fired_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  PRIMARY KEY (session_id, event_key)
);

-- ── Delivery audit for viewer-event webhooks (separate from contact_webhook_log) ──
CREATE TABLE IF NOT EXISTS tracking_webhook_log (
  id              BIGSERIAL    PRIMARY KEY,
  event_key       VARCHAR(80)  NOT NULL,
  video_id        UUID,
  owner_user_id   UUID,
  url_sent_to     TEXT,
  params_sent     JSONB,
  status          VARCHAR(16)  NOT NULL,           -- sent | failed
  response_status INTEGER,
  response_body   TEXT,
  error_message   TEXT,
  sent_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  response_at     TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_tracking_webhook_log_video
  ON tracking_webhook_log (video_id);
CREATE INDEX IF NOT EXISTS idx_tracking_webhook_log_owner
  ON tracking_webhook_log (owner_user_id, sent_at DESC);
