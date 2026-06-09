-- Migration 040: Remove remaining magic-link traces
--
-- Magic-link passwordless entry was removed in f8e5a57 (routes, pages, admin UI,
-- delivery webhook). This cleans up the leftover DB traces so the contact-webhook
-- retry logic no longer needs to special-case 'magic_link%' rows.
--
-- Idempotent / safe to re-run.
--
-- Intentionally NOT removed (harmless, and lossy/unsafe to remove):
--   * token_purpose enum value 'magic_link' — PostgreSQL cannot DROP an enum
--     value without recreating the type and rewriting every dependent column;
--     it is unused and invisible, so it is left in place.
--   * users.created_via = 'magic_link' — an accurate historical record of how
--     those accounts signed up; rewriting it would falsify data. Kept.

-- 1) Drop the now-unused outbound delivery-URL column (added in migration 037).
--    No code references it any more (GET /admin/webhook-settings uses SELECT *).
ALTER TABLE webhook_settings DROP COLUMN IF EXISTS magic_link_webhook_url;

-- 2) Purge leftover single-use magic-link tokens.
DELETE FROM auth_tokens WHERE purpose = 'magic_link';

-- 3) Purge magic-link rows from the contact webhook log (both the outbound
--    'magic_link' deliveries and the inbound 'magic_link_received' receipts),
--    so the retry/resend/failed-count queries no longer need a fence for them.
DELETE FROM contact_webhook_log WHERE event_key LIKE 'magic_link%';
