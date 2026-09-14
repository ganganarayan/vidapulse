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
--
-- NOTE (2026-09-14): the original version of this migration also created a
-- partial index on analytics_sessions(video_id, customer_id). The migration
-- runner wraps each file in ONE transaction, and a non-CONCURRENT CREATE INDEX
-- on the large, continuously-written prod analytics_sessions table failed to
-- take its build lock — which rolled back the WHOLE migration, so the column
-- itself never got added on prod (staging is empty, so it passed there). That
-- left the new /videos/:id/viewer-engagement query (which selects customer_id)
-- 500-ing for every video. The index is dropped here — it is an optional perf
-- index the current queries don't use (they filter by video_id, already
-- indexed by idx_sessions_video_id). If a customer_id index is ever needed, add
-- it out-of-band with CREATE INDEX CONCURRENTLY (which cannot run inside this
-- runner's transaction), never as a plain in-transaction CREATE INDEX here.

ALTER TABLE analytics_sessions
  ADD COLUMN IF NOT EXISTS customer_id VARCHAR(128);
