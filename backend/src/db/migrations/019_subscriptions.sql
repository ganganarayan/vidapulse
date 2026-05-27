-- 019_subscriptions.sql
--
-- Razorpay Subscriptions support.
--
-- Adds subscription lifecycle fields to the users table:
--   plan_enrolled_at        — when the user first paid for their current plan
--   plan_expires_at         — when the current subscription period ends
--   razorpay_customer_id    — stored after first Customer creation (no duplicates)
--   razorpay_subscription_id— active subscription ID (cleared on cancellation)
--
-- Also tracks the Razorpay Plan IDs that were created via the API so they
-- only need to be created once (stored in a simple config table).
--
-- payments table: CHECK constraint relaxed to allow 'unknown' plan values
-- that could arrive from webhooks before plan names are finalised.
-- (The existing constraint already handles starter/pro — no change needed.)

-- ── 1. Subscription fields on users ───────────────────────────────────────

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS plan_enrolled_at         TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS plan_expires_at          TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS razorpay_customer_id     TEXT,
  ADD COLUMN IF NOT EXISTS razorpay_subscription_id TEXT;

-- Index for the daily expiry cron job
CREATE INDEX IF NOT EXISTS idx_users_plan_expires_at
  ON users (plan_expires_at)
  WHERE plan_expires_at IS NOT NULL;

-- ── 2. razorpay_plans config table ─────────────────────────────────────────
-- Stores the Razorpay Plan IDs created via API so we never duplicate them.
-- name matches plans.name ('starter', 'pro').

CREATE TABLE IF NOT EXISTS razorpay_plans (
  id                BIGSERIAL   PRIMARY KEY,
  plan_name         TEXT        NOT NULL UNIQUE,   -- 'starter' | 'pro'
  razorpay_plan_id  TEXT        NOT NULL UNIQUE,   -- e.g. 'plan_XXXXXXXXXXXXXX'
  amount_paise      INTEGER     NOT NULL,           -- 99900 = ₹999
  interval_unit     TEXT        NOT NULL DEFAULT 'monthly',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Partial indexes to support fast expiry lookups
CREATE INDEX IF NOT EXISTS idx_users_sub_expiring
  ON users (plan_expires_at, plan_id)
  WHERE plan_expires_at IS NOT NULL;
