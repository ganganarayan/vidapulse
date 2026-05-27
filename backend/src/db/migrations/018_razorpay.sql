-- 018_razorpay.sql
--
-- Razorpay payment integration
--
-- 1. Two configurable payment page URLs stored in webhook_settings so the
--    admin can update them without redeployment.
--
-- 2. payments table: append-only audit of every successful payment event
--    received from Razorpay. Used to verify, debug, and trace plan upgrades.

-- ── 1. Razorpay payment page URLs ─────────────────────────────────────────
ALTER TABLE webhook_settings
  ADD COLUMN IF NOT EXISTS razorpay_starter_url TEXT,
  ADD COLUMN IF NOT EXISTS razorpay_pro_url     TEXT;

-- ── 2. Payments audit table ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id                   BIGSERIAL     PRIMARY KEY,
  user_id              BIGINT        REFERENCES users(id) ON DELETE SET NULL,
  razorpay_payment_id  TEXT          UNIQUE,
  razorpay_order_id    TEXT,
  razorpay_link_id     TEXT,
  plan                 TEXT          NOT NULL CHECK (plan IN ('starter','pro')),
  amount_paise         INTEGER,                        -- e.g. 99900 = ₹999
  currency             TEXT          NOT NULL DEFAULT 'INR',
  status               TEXT          NOT NULL DEFAULT 'captured',
  notes                JSONB,                          -- parsed Razorpay notes
  razorpay_event       TEXT,                           -- 'payment_link.paid' | 'payment.captured'
  created_at           TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_user_id    ON payments (user_id);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments (created_at DESC);
