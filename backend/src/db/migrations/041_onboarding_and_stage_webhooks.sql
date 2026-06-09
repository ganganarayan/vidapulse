-- ============================================================
-- 041_onboarding_and_stage_webhooks.sql
--
-- Minimal onboarding-funnel tracking.
--
--  1. onboarding_state — add the 3 missing milestone timestamps.
--     (first_video_added_at already exists from migration 004 — REUSED,
--      not re-added.)
--
--  2. webhook_settings — add 5 per-event Divine Leads webhook URL columns,
--     one per onboarding CRM milestone, so each milestone can POST to its
--     own automation. All nullable; a blank URL means that event is not sent.
--
-- Idempotent: every ALTER uses IF NOT EXISTS, so re-running is harmless.
-- ============================================================

-- ── onboarding_state: new milestone timestamps ──────────────────────────
ALTER TABLE onboarding_state
  ADD COLUMN IF NOT EXISTS first_login_at              TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS first_embed_generated_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS first_tracking_activated_at TIMESTAMPTZ;

-- ── webhook_settings: dedicated per-event stage webhook URLs ─────────────
ALTER TABLE webhook_settings
  ADD COLUMN IF NOT EXISTS signup_webhook_url             TEXT,
  ADD COLUMN IF NOT EXISTS login_webhook_url              TEXT,
  ADD COLUMN IF NOT EXISTS video_added_webhook_url        TEXT,
  ADD COLUMN IF NOT EXISTS embed_generated_webhook_url    TEXT,
  ADD COLUMN IF NOT EXISTS tracking_activated_webhook_url TEXT;
