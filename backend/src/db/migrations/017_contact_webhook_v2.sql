-- ============================================================
-- Migration 017 — Contact Webhook V2
-- Adds pause-on-failure, queued status, and notification webhook.
-- ============================================================

-- Pause control + notification webhook URL
ALTER TABLE webhook_settings
  ADD COLUMN IF NOT EXISTS notification_webhook_url  TEXT,
  ADD COLUMN IF NOT EXISTS contact_webhook_paused    BOOLEAN      NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS contact_webhook_paused_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS contact_webhook_paused_reason TEXT;

-- Add 'queued' to the status constraint
-- (entries are marked 'queued' when the webhook is paused at fire time)
ALTER TABLE contact_webhook_log
  DROP CONSTRAINT IF EXISTS contact_webhook_log_status_check;

ALTER TABLE contact_webhook_log
  ADD CONSTRAINT contact_webhook_log_status_check
  CHECK (status IN ('sent', 'failed', 'queued'));

-- Index for fast queued-count lookups
CREATE INDEX IF NOT EXISTS idx_contact_webhook_log_queued
  ON contact_webhook_log(status) WHERE status = 'queued';

-- Index for failed entries (used by the admin alert badge)
CREATE INDEX IF NOT EXISTS idx_contact_webhook_log_failed
  ON contact_webhook_log(status, sent_at DESC) WHERE status = 'failed';
