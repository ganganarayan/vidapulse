-- Migration 055: capture the embed `cid` (customer id) against each session
--
-- The embedding app (e.g. the assessment/VSL page) appends an opaque customer
-- id to the iframe src as a query param:
--   https://app.vidapulse.io/embed/<video-id>?cid=<customer-id>
--
-- The embed player reads that `cid` and forwards it on the session-create call.
-- We store it here so each individual viewer session can be mapped back to the
-- respondent's customer record on the embedding app's side. Opaque id only —
-- no PII crosses.
--
-- Additive + idempotent. `cid` is at most 128 chars (matches viewer_cookie).

ALTER TABLE analytics_sessions
  ADD COLUMN IF NOT EXISTS customer_id VARCHAR(128);

CREATE INDEX IF NOT EXISTS idx_sessions_customer_id
  ON analytics_sessions(video_id, customer_id)
  WHERE customer_id IS NOT NULL;
