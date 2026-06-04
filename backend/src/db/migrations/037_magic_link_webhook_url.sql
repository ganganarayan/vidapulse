-- Migration 037: Add magic_link_webhook_url to webhook_settings
--
-- Stores the outbound URL VidaPulse POSTs to after minting a magic-link
-- token. The payload carries { user_id, email, name, token, login_url }
-- so the receiving automation can send the login link via email/WhatsApp.

ALTER TABLE webhook_settings
  ADD COLUMN IF NOT EXISTS magic_link_webhook_url TEXT;
