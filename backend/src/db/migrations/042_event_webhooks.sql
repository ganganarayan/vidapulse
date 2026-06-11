-- ============================================================
-- 042_event_webhooks.sql
--
-- Phase 2 of the unified event architecture (Assess360-aligned).
--
-- Introduces a name-keyed webhook REGISTRY that replaces the hardcoded event
-- Sets + fixed URL columns. Each row = "deliver this event to this URL".
-- UNIQUE (event_name, url) — one row per (event, endpoint), so an event can
-- fan out to multiple endpoints later WITHOUT a schema change. The emitter
-- delivers to every ACTIVE row for the event name.
--
-- Seeded from the EXISTING webhook_settings URLs so delivery is byte-identical
-- on day 1 (no CRM behaviour change). The master webhook_settings.is_active
-- toggle + api_token still apply in the sender.
--
-- Idempotent: IF NOT EXISTS + ON CONFLICT DO NOTHING.
-- ============================================================

CREATE TABLE IF NOT EXISTS event_webhooks (
  id          BIGSERIAL    PRIMARY KEY,
  event_name  VARCHAR(80)  NOT NULL,   -- = event_key (snake_case), matches contact.event_type
  url         TEXT         NOT NULL,
  secret      TEXT,                     -- reserved for future per-row HMAC signing (not applied yet)
  status      VARCHAR(16)  NOT NULL DEFAULT 'active',  -- active | inactive
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (event_name, url)
);

CREATE INDEX IF NOT EXISTS idx_event_webhooks_name_status
  ON event_webhooks (event_name, status);

-- ── Seed: CRM events → the shared contact webhook URL ──────────────────────
INSERT INTO event_webhooks (event_name, url, status)
SELECT e.ek, ws.webhook_url, 'active'
FROM   webhook_settings ws
CROSS JOIN (VALUES
  ('user_signed_up'),
  ('user_restored'),
  ('inactivity_reminder_10d'),
  ('inactivity_reminder_3d'),
  ('user_deactivated')
) AS e(ek)
WHERE  ws.webhook_url IS NOT NULL AND ws.webhook_url <> ''
ON CONFLICT (event_name, url) DO NOTHING;

-- ── Seed: per-event stage URLs (from migration 041 columns) ────────────────
INSERT INTO event_webhooks (event_name, url, status)
SELECT 'user_signed_up', signup_webhook_url, 'active'
  FROM webhook_settings WHERE signup_webhook_url IS NOT NULL AND signup_webhook_url <> ''
UNION ALL
SELECT 'user_logged_in', login_webhook_url, 'active'
  FROM webhook_settings WHERE login_webhook_url IS NOT NULL AND login_webhook_url <> ''
UNION ALL
SELECT 'first_video_added', video_added_webhook_url, 'active'
  FROM webhook_settings WHERE video_added_webhook_url IS NOT NULL AND video_added_webhook_url <> ''
UNION ALL
SELECT 'embed_generated', embed_generated_webhook_url, 'active'
  FROM webhook_settings WHERE embed_generated_webhook_url IS NOT NULL AND embed_generated_webhook_url <> ''
UNION ALL
SELECT 'tracking_activated', tracking_activated_webhook_url, 'active'
  FROM webhook_settings WHERE tracking_activated_webhook_url IS NOT NULL AND tracking_activated_webhook_url <> ''
ON CONFLICT (event_name, url) DO NOTHING;
