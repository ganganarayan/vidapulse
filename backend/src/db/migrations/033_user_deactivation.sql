-- 033_user_deactivation.sql
-- Soft-deactivation lifecycle for users.
--
-- is_active = FALSE already blocks authenticated access (requireAuth) and login.
-- These columns record WHEN and WHY a user became deactivated so the admin
-- "Deactivated" section and the 180-day inactivity job can manage them, and so
-- the login screen can show the correct "deactivated after 180 days" message.
--
--   deactivated_at      — timestamp the account was deactivated (NULL = active)
--   deactivated_reason  — 'manual' (admin) | 'inactivity_180d' (auto job)
--
-- Additive only: rolling back the code leaves these columns unused and harmless.

ALTER TABLE users ADD COLUMN IF NOT EXISTS deactivated_at     TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS deactivated_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_users_deactivated_at
  ON users(deactivated_at) WHERE deactivated_at IS NOT NULL;
