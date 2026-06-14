-- ============================================================
-- 044_video_tracking_mapping.sql
--
-- Adds the per-video "Destination Mapping" + a lightweight fired-counter.
-- Additive + idempotent. Still no production behavior change (nothing fires
-- until the embed is wired in a later cycle; tracking disabled by default).
-- ============================================================

-- Per-video event → destination mapping (extensible: add google/linkedin/tiktok
-- keys later with NO migration). Default = the approved V1 preset.
ALTER TABLE video_tracking_settings
  ADD COLUMN IF NOT EXISTS event_mapping JSONB NOT NULL DEFAULT '{
    "vsl_view":    { "meta": "ViewContent", "webhook": true },
    "vsl_25":      { "meta": "ViewContent", "webhook": true },
    "vsl_50":      { "meta": "ViewContent", "webhook": true },
    "vsl_75":      { "meta": "ViewContent", "webhook": true },
    "vsl_100":     { "meta": "Lead",        "webhook": true },
    "cta_clicked": { "meta": "Lead",        "webhook": true }
  }'::jsonb;

-- Aggregate fired-counter per (video, event) — powers the "N fired" display.
-- Aggregate (not per-row) so high viewer volume stays cheap.
CREATE TABLE IF NOT EXISTS tracking_event_counts (
  video_id   UUID         NOT NULL,
  event_key  VARCHAR(80)  NOT NULL,
  count      BIGINT       NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  PRIMARY KEY (video_id, event_key)
);
