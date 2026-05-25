-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 013 — video_cta_links table
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Each row is a named CTA tracking link attached to a specific video.
-- Tracking URL pattern: /api/analytics/cta/link/:id
--
-- Fields:
--   cta_name        — button label ("Buy Now", "Sign Up", etc.)
--   page_name       — optional page identifier ("Sales Page", "Email Funnel")
--   destination_url — where the visitor is redirected after the click
--
-- Clicks recorded in analytics_events with event_type = 'cta_click' and
-- metadata = { cta_link_id, cta_name, page_name, destination_url }

CREATE TABLE IF NOT EXISTS video_cta_links (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  video_id        UUID        NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  cta_name        VARCHAR(200) NOT NULL,
  page_name       VARCHAR(200),
  destination_url TEXT        NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_video_cta_links_video_id ON video_cta_links(video_id);
