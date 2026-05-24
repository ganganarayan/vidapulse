-- Migration 007 — Add show_volume_control to video_player_settings
--
-- Adds a toggle to show/hide the volume slider and mute button
-- in the embedded player's bottom control bar.

ALTER TABLE video_player_settings
  ADD COLUMN IF NOT EXISTS show_volume_control BOOLEAN DEFAULT TRUE;
