-- 028_cashfree.sql
--
-- Cashfree Subscriptions integration.
--
-- 1. Adds cashfree_customer_id / cashfree_subscription_id to users.
-- 2. cashfree_plans — config table for Cashfree plan IDs (mirrors razorpay_plans).
--    Keyed by plan_key = 'starter_INR' | 'pro_INR' | 'starter_USD' | 'pro_USD'.
-- 3. payments table — adds cashfree-specific columns and a payment_gateway
--    discriminator so Razorpay and Cashfree rows coexist cleanly.

-- ── 1. Users ──────────────────────────────────────────────────────────────────

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS cashfree_customer_id     TEXT,
  ADD COLUMN IF NOT EXISTS cashfree_subscription_id TEXT;

-- ── 2. cashfree_plans config table ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cashfree_plans (
  id                  BIGSERIAL       PRIMARY KEY,
  plan_key            TEXT            NOT NULL UNIQUE,  -- e.g. 'starter_INR'
  cashfree_plan_id    TEXT            NOT NULL UNIQUE,  -- e.g. 'vidapulse_starter_inr_monthly'
  amount              NUMERIC(10, 2)  NOT NULL,
  currency            TEXT            NOT NULL,         -- 'INR' | 'USD'
  created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- ── 3. payments table — Cashfree columns ──────────────────────────────────────

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS cashfree_payment_id      TEXT,
  ADD COLUMN IF NOT EXISTS cashfree_subscription_id TEXT,
  -- 'razorpay' (existing rows) | 'cashfree' (new rows)
  ADD COLUMN IF NOT EXISTS payment_gateway          TEXT NOT NULL DEFAULT 'razorpay';

CREATE INDEX IF NOT EXISTS idx_payments_cashfree_payment_id
  ON payments (cashfree_payment_id)
  WHERE cashfree_payment_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_payments_gateway
  ON payments (payment_gateway);
