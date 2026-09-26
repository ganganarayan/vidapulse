-- ============================================================
-- 058_video_capi.sql
--
-- PER-VIDEO Meta Conversions API (CAPI) credentials.
--
-- The pixel id is already per video (043). What was missing is the server-side
-- half: a CAPI access token scoped to THAT pixel/dataset, so video A can fire
-- to pixel A and video B to pixel B — different ad accounts, different tokens.
--
-- capi_test_event_code is the optional TEST####  code from Events Manager →
-- Test Events. When set, the fires show up in the Test Events tab instead of
-- (only) the live stream — used to prove the wiring, then cleared.
--
-- Nothing fires without BOTH pixel_id and capi_token, so this is a no-op for
-- every existing video: browser-pixel behaviour is unchanged until a token is
-- added.
--
-- Additive + idempotent.
-- ============================================================

ALTER TABLE video_tracking_settings
  ADD COLUMN IF NOT EXISTS capi_token           TEXT,
  ADD COLUMN IF NOT EXISTS capi_test_event_code VARCHAR(64);
