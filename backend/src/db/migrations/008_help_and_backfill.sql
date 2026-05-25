-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 008 — Help/Support content table + browser backfill
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Help & Support content ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS site_help (
  id          SERIAL PRIMARY KEY,
  video_url   TEXT,                            -- tutorial video URL (YouTube/Vimeo embed)
  sections    JSONB NOT NULL DEFAULT '[]',     -- [{title, content}]
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_by  INT REFERENCES users(id) ON DELETE SET NULL
);

-- Seed with initial documentation
INSERT INTO site_help (video_url, sections)
SELECT NULL, '[
  {
    "title": "Getting Started",
    "content": "Welcome to VidaPulse! Add your first video by clicking the Videos menu and pasting any video URL (YouTube, Vimeo, HLS, or direct MP4). VidaPulse generates a unique embed code that you paste into your website pages. Once embedded, analytics start flowing automatically — no extra configuration needed."
  },
  {
    "title": "Adding a Video",
    "content": "1. Go to Videos in the left panel.\n2. Click Add Video.\n3. Paste the URL of your video (YouTube, Vimeo, Loom, HLS stream, or direct MP4).\n4. Give it a name and save.\nVidaPulse will begin tracking as soon as the first viewer watches through your embed."
  },
  {
    "title": "Embedding the Player",
    "content": "Inside any video, go to Share & Embed. Copy the iframe snippet and paste it into your website page HTML. That''s it — every play, pause, rewatch, and drop-off is tracked automatically. The player works on any website platform including WordPress, Webflow, Squarespace, and custom HTML."
  },
  {
    "title": "Reading the Engagement Heatmap",
    "content": "The Engagement Heatmap shows second-by-second viewer retention across your entire video. Green bars = high retention (viewers watching). Red bars = low retention (viewers have dropped off or skipped). Hover over any bar to see the retention percentage at that moment. The Primary Drop-off timestamp shows where most viewers leave."
  },
  {
    "title": "Understanding Metrics",
    "content": "Total Plays: how many times your video was played.\nUnique Viewers: distinct people tracked by browser.\nAvg. Watch %: average percentage of the video each viewer watched.\nCompletion Rate: percentage of sessions where the viewer reached the end.\nPlay Rate: plays per page load.\nRe-watches: plays minus unique viewers.\nWatch Time: total minutes accumulated across all sessions."
  },
  {
    "title": "Viewer Stories",
    "content": "Viewer Stories are AI-generated narratives about individual viewing sessions. They appear once 5 or more viewers have watched your video. Each story describes a viewer''s journey — where they came from, how they watched, and what they did. Use them to understand your real audience behaviour."
  },
  {
    "title": "Geography, Devices & Browsers",
    "content": "The Audience section shows where your viewers are located (Geography), what devices they use (Desktop / Mobile / Tablet), and which browsers they use. This data is collected automatically from every viewing session — no configuration needed."
  },
  {
    "title": "Plan & Billing",
    "content": "VidaPulse offers a forever-free plan with no expiry. Paid plans unlock advanced features like the full Engagement Heatmap, Viewer Stories, AI Insights, and audience segmentation. Your plan is shown in Account Settings. Upgrades take effect immediately."
  }
]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM site_help);

-- ── Backfill browser for existing sessions that have a user_agent ────────
-- Simple regex-based update for the most common browsers.
-- Runs once and only touches rows where browser IS NULL.
UPDATE analytics_sessions
SET browser =
  CASE
    WHEN user_agent ILIKE '%Edg/%'                        THEN 'Edge'
    WHEN user_agent ILIKE '%OPR/%' OR
         user_agent ILIKE '%Opera%'                       THEN 'Opera'
    WHEN user_agent ILIKE '%SamsungBrowser%'              THEN 'Samsung'
    WHEN user_agent ILIKE '%YaBrowser%'                   THEN 'Yandex'
    WHEN user_agent ILIKE '%UCBrowser%'                   THEN 'UC Browser'
    WHEN user_agent ILIKE '%CriOS%'                       THEN 'Chrome'
    WHEN user_agent ILIKE '%FxiOS%'                       THEN 'Firefox'
    WHEN user_agent ILIKE '%Chrome/%'                     THEN 'Chrome'
    WHEN user_agent ILIKE '%Firefox/%'                    THEN 'Firefox'
    WHEN user_agent ILIKE '%Safari/%'
     AND user_agent ILIKE '%Version/%'                    THEN 'Safari'
    WHEN user_agent IS NOT NULL                           THEN 'Other'
    ELSE NULL
  END
WHERE browser IS NULL AND user_agent IS NOT NULL;
