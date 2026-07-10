-- Migration 047: add show_time to video_player_settings
-- Displays elapsed / total time in the player WITHOUT a scrubbable seek bar.

ALTER TABLE video_player_settings
  ADD COLUMN IF NOT EXISTS show_time BOOLEAN NOT NULL DEFAULT FALSE;
