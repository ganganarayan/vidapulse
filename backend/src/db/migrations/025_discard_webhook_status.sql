-- Migration 025: Add 'discarded' to contact_webhook_log status constraint
--
-- Migration 017 added 'queued' but forgot 'discarded'.
-- The discardWebhookEntry service was silently failing because
-- PostgreSQL rejected the UPDATE with a CHECK constraint violation.

ALTER TABLE contact_webhook_log
  DROP CONSTRAINT IF EXISTS contact_webhook_log_status_check;

ALTER TABLE contact_webhook_log
  ADD CONSTRAINT contact_webhook_log_status_check
  CHECK (status IN ('sent', 'failed', 'queued', 'discarded'));

-- Index for fast discarded lookups (admin log filter)
CREATE INDEX IF NOT EXISTS idx_contact_webhook_log_discarded
  ON contact_webhook_log(status, sent_at DESC) WHERE status = 'discarded';
