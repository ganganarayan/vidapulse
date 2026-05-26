-- ============================================================
-- Migration 016 — Contact Webhook Integration
-- Adds api_token to webhook_settings and creates contact_webhook_log.
-- ============================================================

-- Add api_token field to webhook_settings (optional, for external system auth)
ALTER TABLE webhook_settings
  ADD COLUMN IF NOT EXISTS api_token TEXT;

-- Contact webhook log: records every outbound contact webhook fire
CREATE TABLE IF NOT EXISTS contact_webhook_log (
  id              BIGSERIAL PRIMARY KEY,
  event_key       VARCHAR(100)   NOT NULL,
  user_id         UUID           REFERENCES users(id) ON DELETE SET NULL,
  url_sent_to     TEXT           NOT NULL,
  params_sent     JSONB          NOT NULL DEFAULT '{}',
  status          VARCHAR(20)    NOT NULL DEFAULT 'pending'
                                 CHECK (status IN ('sent','failed')),
  response_status INT,
  response_body   TEXT,
  error_message   TEXT,
  sent_at         TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  response_at     TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_contact_webhook_log_sent_at
  ON contact_webhook_log(sent_at DESC);

CREATE INDEX IF NOT EXISTS idx_contact_webhook_log_user_id
  ON contact_webhook_log(user_id);
