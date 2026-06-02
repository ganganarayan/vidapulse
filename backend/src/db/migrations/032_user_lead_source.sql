-- 032_user_lead_source.sql
-- Capture the marketing source of each signup ("lead source") so admins can see
-- which campaign / ad set / ad each subscriber came from.
--
-- Flow: ad → vidapulse.io (?utm_*) → "Sign up" → app.vidapulse.io signup → stored here.
-- Mapping mirrors the video-owner Lead Source panel:
--   campaign = utm_campaign, ad set = utm_term, ad = utm_content.
-- All nullable — a lead with no UTM params simply leaves these blank.

ALTER TABLE users ADD COLUMN IF NOT EXISTS signup_utm_source   TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS signup_utm_medium   TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS signup_utm_campaign TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS signup_utm_term     TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS signup_utm_content  TEXT;
