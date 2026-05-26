-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 014 — add show_rewind_forward to video_player_settings
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Adds a per-video toggle that controls whether the ↺10 / 10↻ skip buttons
-- are rendered in the center overlay of the embedded HTML5 video player.
--
-- Defaults to TRUE so existing embeds automatically gain the buttons unless
-- the video owner disables them in Player Settings.

ALTER TABLE video_player_settings
  ADD COLUMN IF NOT EXISTS show_rewind_forward BOOLEAN NOT NULL DEFAULT TRUE;
