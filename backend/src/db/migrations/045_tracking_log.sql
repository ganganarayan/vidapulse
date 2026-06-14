-- ============================================================
-- 045_tracking_log.sql
--
-- Unified per-fire log for the viewer plane: ONE row per Meta-pixel fire and
-- ONE row per tracking-webhook fire. Read-only feed for the subscriber's
-- "Tracking Activity" page (own rows) and the admin all-users view.
-- Supersedes the delivery-only tracking_webhook_log (left in place, unused).
--
-- Additive + idempotent.
-- ============================================================

CREATE TABLE IF NOT EXISTS tracking_log (
  id              BIGSERIAL    PRIMARY KEY,
  owner_user_id   UUID,                          -- the video owner (scopes user view)
  video_id        UUID,
  kind            VARCHAR(16)  NOT NULL,          -- 'pixel' | 'webhook'
  event_key       VARCHAR(80)  NOT NULL,          -- vsl_view, vsl_50, cta_clicked, …
  meta_event      VARCHAR(64),                    -- pixel: mapped Meta event (ViewContent/Lead)
  url             TEXT,                           -- webhook: endpoint it was POSTed to
  status          VARCHAR(16)  NOT NULL,          -- pixel: 'fired' · webhook: 'sent' | 'failed'
  response_status INTEGER,                        -- webhook HTTP status
  response_body   TEXT,
  error_message   TEXT,
  payload         JSONB,                          -- what was sent (click-to-expand)
  session_id      UUID,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tracking_log_owner   ON tracking_log (owner_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tracking_log_created ON tracking_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tracking_log_video   ON tracking_log (video_id);
