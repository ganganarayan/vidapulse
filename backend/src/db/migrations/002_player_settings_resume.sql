-- Migration 002 — Add resume_playback to video_player_settings
-- Allows per-video toggle: viewers resume where they left off

ALTER TABLE video_player_settings
  ADD COLUMN IF NOT EXISTS resume_playback BOOLEAN DEFAULT FALSE;

-- Also add show_controls as a convenience alias column
ALTER TABLE video_player_settings
  ADD COLUMN IF NOT EXISTS show_controls BOOLEAN DEFAULT TRUE;
