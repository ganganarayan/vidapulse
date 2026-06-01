-- Migration 031: Add start_muted to video_player_settings
-- Controls whether the embedded player begins muted on load.
-- Defaults to TRUE (mute-by-default is the safest embed behaviour).

ALTER TABLE video_player_settings
  ADD COLUMN IF NOT EXISTS start_muted BOOLEAN NOT NULL DEFAULT TRUE;
