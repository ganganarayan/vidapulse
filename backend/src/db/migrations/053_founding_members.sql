-- 053_founding_members.sql
--
-- Founding members: the first 100 accounts to PAY for Growth lock it at
-- $59/mo for life (vs the standard $79). A founding member is put on a Razorpay
-- subscription for the $59 'pro_founding' plan, so every renewal stays $59
-- forever — the lifetime lock is the subscription itself.
--
-- Slot accounting is DERIVED from the users table (no separate counter):
--   taken    = COUNT(*) WHERE is_founding_member = TRUE      (confirmed, paid)
--   reserved = rows with a recent founding_reserved_at, not yet confirmed
--              (a $59 subscription was created but not yet paid)
-- The public landing counter shows `taken` out of 100, and increments only
-- when someone actually pays (is_founding_member flips TRUE on activation).

ALTER TABLE users ADD COLUMN IF NOT EXISTS is_founding_member   BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS founding_reserved_at  TIMESTAMPTZ;

-- Fast counting of confirmed founding members (partial index — only TRUE rows).
CREATE INDEX IF NOT EXISTS idx_users_founding
  ON users (is_founding_member) WHERE is_founding_member = TRUE;
