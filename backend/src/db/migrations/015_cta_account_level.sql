-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 015 — CTA links: account-level ownership + relax NOT NULL
-- ═══════════════════════════════════════════════════════════════════════════
--
-- CTA tracking links are now owned by a user (not a video).
-- video_id becomes optional — new links created from the Analytics →
-- CTA Tracking page have no video context.
--
-- analytics_events.video_id is also relaxed to nullable so that
-- cta_click events from account-level links can be recorded without
-- a video_id.

-- 1. Allow NULL video_id in analytics_events
ALTER TABLE analytics_events
  ALTER COLUMN video_id DROP NOT NULL;

-- 2. Add user_id column to video_cta_links (nullable during backfill)
ALTER TABLE video_cta_links
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;

-- 3. Backfill user_id from the owning video's user
UPDATE video_cta_links c
SET    user_id = v.user_id
FROM   videos v
WHERE  c.video_id = v.id
  AND  c.user_id IS NULL;

-- 4. Make video_id nullable (account-level links have no video)
ALTER TABLE video_cta_links
  ALTER COLUMN video_id DROP NOT NULL;

-- 5. Index on user_id for fast per-user list queries
CREATE INDEX IF NOT EXISTS idx_video_cta_links_user_id ON video_cta_links(user_id);
