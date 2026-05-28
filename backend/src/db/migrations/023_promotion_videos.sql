-- ── Promotion Videos ─────────────────────────────────────────────────────────
-- Admin-managed videos pinned at the top of user dashboards.
-- Each has a visibility tier (noshow / free / starter / pro).
-- Per-user opt-outs let the admin hide a video for a specific subscriber.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS promotion_videos (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id    UUID        NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  visibility  TEXT        NOT NULL DEFAULT 'noshow'
              CHECK (visibility IN ('noshow', 'free', 'starter', 'pro')),
  sort_order  INT         NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- A video can only be a promotion video once
CREATE UNIQUE INDEX IF NOT EXISTS promotion_videos_video_id_key ON promotion_videos(video_id);

-- Per-user admin-controlled opt-outs
-- Row present  → admin has hidden this promotion video for this user
-- Row absent   → user sees the video (subject to visibility tier check)
CREATE TABLE IF NOT EXISTS promotion_video_hidden (
  user_id              UUID        NOT NULL REFERENCES users(id)            ON DELETE CASCADE,
  promotion_video_id   UUID        NOT NULL REFERENCES promotion_videos(id) ON DELETE CASCADE,
  hidden_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, promotion_video_id)
);
