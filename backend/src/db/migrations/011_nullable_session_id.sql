-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 011 — Allow NULL session_id in analytics_events
-- ═══════════════════════════════════════════════════════════════════════════
--
-- CTA tracking links fire a cta_click event without a player session
-- (the click happens directly on the subscriber's landing page, not inside
-- the VidaPulse iframe). session_id is now optional for such events.
--
-- Existing rows are unaffected — they all have valid session_ids.

ALTER TABLE analytics_events
  ALTER COLUMN session_id DROP NOT NULL;
