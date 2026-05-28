-- Migration 026: Add plan_expires_at column to users
--
-- Paid plans (starter / pro) can have an expiry date set by admin.
-- Free plan uses NULL to mean "forever" — never shown as expired.
-- Admin Lifetime plan is also NULL (never expires).

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMPTZ DEFAULT NULL;

COMMENT ON COLUMN users.plan_expires_at IS
  'NULL = no expiry (free forever or admin lifetime). Paid plans: date when subscription expires. Admin can extend this manually.';

-- Index for future scheduled expiry jobs
CREATE INDEX IF NOT EXISTS idx_users_plan_expires_at
  ON users (plan_expires_at)
  WHERE plan_expires_at IS NOT NULL;
