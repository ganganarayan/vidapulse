-- Migration 046: add updated_at to video_cta_links
-- Supports editing a link's button name / page name (PATCH /api/cta-links/:id).

ALTER TABLE video_cta_links
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
