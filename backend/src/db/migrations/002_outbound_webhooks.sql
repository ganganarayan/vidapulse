-- ============================================================
-- Migration 002 — Outbound Webhook Support
-- Enables VidaPulse to notify external CRM systems (e.g. divineleads.guru)
-- when key subscriber events occur (user created, login, plan changes).
--
-- The webhook_url column is intentionally seeded as NULL.
-- Admin fills it in from the admin panel once the divineleads.guru
-- receiving endpoint is ready.
-- ============================================================

-- ============================================================
-- TABLE: OUTBOUND_WEBHOOK_CONFIGS
-- One row per event type. Admin sets webhook_url + flips is_active=TRUE.
-- ============================================================

CREATE TABLE outbound_webhook_configs (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type   VARCHAR(64)  NOT NULL UNIQUE,
  description  TEXT,
  webhook_url  TEXT,          -- NULL until admin configures it
  is_active    BOOLEAN       NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE outbound_webhook_configs IS
  'One row per outbound event type. Set webhook_url + is_active=TRUE to enable.';

COMMENT ON COLUMN outbound_webhook_configs.webhook_url IS
  'Target URL on the CRM side (e.g. divineleads.guru). NULL = not yet configured.';

-- Seed the four events VidaPulse can fire.
-- All start with webhook_url=NULL and is_active=FALSE.
INSERT INTO outbound_webhook_configs (event_type, description) VALUES
  ('user_created',  'Fired when a new subscriber account is created via incoming webhook'),
  ('user_login',    'Fired when a subscriber successfully logs in'),
  ('plan_changed',  'Fired when a subscriber upgrades or downgrades their plan'),
  ('plan_expired',  'Fired when a subscriber plan passes its expiry date');

-- ============================================================
-- TABLE: OUTBOUND_WEBHOOK_LOGS
-- Audit trail of every outbound webhook attempt.
-- ============================================================

CREATE TABLE outbound_webhook_logs (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  config_id      UUID         REFERENCES outbound_webhook_configs(id) ON DELETE SET NULL,
  event_type     VARCHAR(64)  NOT NULL,
  target_url     TEXT         NOT NULL,
  payload        JSONB        NOT NULL,
  http_status    INTEGER,
  response_body  TEXT,
  error_message  TEXT,
  delivered      BOOLEAN      NOT NULL DEFAULT FALSE,
  duration_ms    INTEGER,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE outbound_webhook_logs IS
  'Audit trail for every outbound webhook attempt, including failures.';

CREATE INDEX idx_outbound_webhook_logs_event_type ON outbound_webhook_logs(event_type);
CREATE INDEX idx_outbound_webhook_logs_delivered   ON outbound_webhook_logs(delivered);
CREATE INDEX idx_outbound_webhook_logs_created_at  ON outbound_webhook_logs(created_at DESC);
