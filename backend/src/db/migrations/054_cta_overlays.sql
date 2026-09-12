-- Migration 054: timed CTA overlays on the player
--
-- Adds two columns to video_player_settings:
--   cta_enabled  — master toggle; when off the player renders no overlay CTAs
--   cta_overlays — JSON array of timed overlay buttons, each:
--     {
--       "id":            "cta-1",           -- stable placement id (attribution key)
--       "label":         "Book a 1:1",      -- button text
--       "url":           "https://.../api/analytics/cta/link/<id>",  -- destination (a CTA tracking link)
--       "start_second":  50,                -- appears when playback crosses this second
--       "dim_after_seconds": 10,            -- fade to partial opacity N s after it appears (0 = never)
--       "x": 50, "y": 85,                   -- button CENTER as % of the player box (from drag)
--       "w": 40                             -- button width as % of the player box (from resize)
--     }
--
-- Overlay buttons are sticky by design: once shown they never hide (they only
-- dim), so a viewer still deciding 5-15 s after the prompt keeps the button.
-- Max 3 overlays per video is enforced in the API, not the schema.

ALTER TABLE video_player_settings
  ADD COLUMN IF NOT EXISTS cta_enabled  BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS cta_overlays JSONB   NOT NULL DEFAULT '[]'::jsonb;
