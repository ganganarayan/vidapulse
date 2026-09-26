-- Migration 057: carry the assessment viewer ids onto CTA CLICKS
--
-- The video player already stores them per SESSION (migrations 055/056):
--   customer_id  = the assessing app's opaque customer id (?cid=)
--   viewer_token = the assessment RESULT TOKEN (?t= / ?r=)
--
-- A CTA click had no equivalent: cta_click_logs only held viewer_id, our own
-- first-party vp_cta_vid cookie, which is meaningless outside VidaPulse. So a
-- click could never be joined back to the person who took the assessment.
--
-- These columns close that gap. They are filled from, in priority order:
--   1. the tracking link's own query (?t= / ?r= / ?cid=) — stamped either
--      server-side by the assessing app or client-side by /cta.js
--   2. the Referer header (plain desktop clicks that kept their referrer)
-- id_source records WHICH carrier won, so thin coverage is diagnosable at a
-- glance instead of guessed at.
--
-- Additive + idempotent. No backfill is possible: clicks recorded before this
-- never carried an id, and inventing one would be worse than an honest blank.
-- No index — these are read in a per-user, time-ordered page of at most 2000
-- rows already narrowed by user_id, never searched on their own. (See the
-- migration 055 note on CREATE INDEX locks against live-written tables.)

ALTER TABLE cta_click_logs
  ADD COLUMN IF NOT EXISTS customer_id  VARCHAR(128),
  ADD COLUMN IF NOT EXISTS viewer_token VARCHAR(128),
  ADD COLUMN IF NOT EXISTS id_source    VARCHAR(16);
