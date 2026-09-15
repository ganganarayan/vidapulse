-- Migration 056: store the assessment RESULT TOKEN separately from the cid
--
-- The embedding app (assessment/VSL) can identify a viewer two ways on the VSL
-- URL: `?t=<result-token>` (present on EVERY link — fresh completions and every
-- email/WhatsApp nurture link) and the legacy `?cid=<customer-id>`. We now keep
-- BOTH so an operator can reconcile with whichever exists:
--   customer_id  (existing, migration 055) = the cid
--   viewer_token (this migration)          = the token (?t=)
--
-- Additive + idempotent. No index (a plain in-transaction CREATE INDEX on this
-- large, live-written table can fail to take its lock — see migration 055 note).

ALTER TABLE analytics_sessions
  ADD COLUMN IF NOT EXISTS viewer_token VARCHAR(128);
