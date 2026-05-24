-- Migration 003 — Fix video_player_settings columns
--
-- Ensures show_controls and resume_playback always exist.
-- Uses ADD COLUMN IF NOT EXISTS so it is safe to run even if
-- migration 002 already added them.
--
-- Also drops the chk_player_settings_single_owner constraint
-- which was preventing per-video UPSERTs that correctly omit user_id.

ALTER TABLE video_player_settings
  ADD COLUMN IF NOT EXISTS show_controls   BOOLEAN DEFAULT TRUE;

ALTER TABLE video_player_settings
  ADD COLUMN IF NOT EXISTS resume_playback BOOLEAN DEFAULT FALSE;

-- Drop the constraint if it exists (idempotent via DO block)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_player_settings_single_owner'
  ) THEN
    ALTER TABLE video_player_settings
      DROP CONSTRAINT chk_player_settings_single_owner;
  END IF;
END
$$;
