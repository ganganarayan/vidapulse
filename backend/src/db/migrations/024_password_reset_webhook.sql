-- ── Password Reset Webhook URL ────────────────────────────────────────────
-- Dedicated webhook endpoint fired on every password-reset request.
-- Separate from the contact webhook so a different automation can handle
-- sending the reset email without mixing into the CRM event stream.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE webhook_settings
  ADD COLUMN IF NOT EXISTS password_reset_webhook_url TEXT;
