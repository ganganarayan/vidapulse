-- 034_cta_click_logs.sql
-- CTA click tracking, fully decoupled from the video library.
--
-- CTA links are independent of videos (a landing-page button, an email link…),
-- so their click logs must NOT live in analytics_events — that table cascades
-- from videos, which means purging a user's videos would erase CTA history.
--
-- This dedicated, SELF-CONTAINED table:
--   • has NO foreign key to videos  → a video delete/purge never touches it
--   • user_id is ON DELETE SET NULL → a user purge keeps the log, just unlinks
--   • denormalizes cta_name / destination / geo → readable without any join
--
-- Additive + backfilled: existing analytics_events cta_click rows are copied in.
-- Old rows are left intact, so a code rollback still has the original data.

CREATE TABLE IF NOT EXISTS cta_click_logs (
  id              BIGSERIAL PRIMARY KEY,
  cta_link_id     UUID,                                          -- video_cta_links.id (no FK; log is self-contained)
  user_id         UUID REFERENCES users(id) ON DELETE SET NULL,  -- owner; survives purge
  video_id        UUID,                                          -- informational only, NO FK (decoupled)
  cta_name        TEXT,
  page_name       TEXT,
  destination_url TEXT,
  viewer_id       TEXT,
  device          TEXT,
  browser         TEXT,
  country         TEXT,
  country_code    TEXT,
  city            TEXT,
  utm_source      TEXT,
  utm_medium      TEXT,
  utm_campaign    TEXT,
  utm_term        TEXT,
  utm_content     TEXT,
  occurred_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cta_click_logs_user_id  ON cta_click_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_cta_click_logs_video_id ON cta_click_logs(video_id);
CREATE INDEX IF NOT EXISTS idx_cta_click_logs_link_id  ON cta_click_logs(cta_link_id);

-- ── Backfill from existing analytics_events cta_click rows ─────────────────
-- Owner resolved via the CTA link, falling back to the video's owner.
-- guard with NOT EXISTS so re-running (shouldn't happen — migrations run once)
-- can't double-insert.
INSERT INTO cta_click_logs
  (cta_link_id, user_id, video_id, cta_name, page_name, destination_url,
   viewer_id, device, browser, country, country_code, city,
   utm_source, utm_medium, utm_campaign, utm_term, utm_content, occurred_at)
SELECT
  NULLIF(e.metadata->>'cta_link_id','')::uuid,
  COALESCE(cl.user_id, v.user_id),
  e.video_id,
  e.metadata->>'cta_name',
  e.metadata->>'page_name',
  e.metadata->>'destination_url',
  e.metadata->>'viewer_id',
  e.metadata->>'device',
  e.metadata->>'browser',
  e.metadata->>'country',
  e.metadata->>'country_code',
  e.metadata->>'city',
  e.metadata->>'utm_source',
  e.metadata->>'utm_medium',
  e.metadata->>'utm_campaign',
  e.metadata->>'utm_term',
  e.metadata->>'utm_content',
  e.occurred_at
FROM analytics_events e
LEFT JOIN video_cta_links cl ON cl.id = NULLIF(e.metadata->>'cta_link_id','')::uuid
LEFT JOIN videos          v  ON v.id  = e.video_id
WHERE e.event_type = 'cta_click';
