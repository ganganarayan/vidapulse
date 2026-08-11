-- Migration 051: path_hits — server-side hits per link (page), per day.
-- Counts EVERY page request (KB pages, homepage, embeds, app routes),
-- including non-JS crawlers the beacon misses. bot_hits splits out bots.

CREATE TABLE IF NOT EXISTS path_hits (
  path       VARCHAR(500) NOT NULL,
  day        DATE         NOT NULL,
  hits       INTEGER      NOT NULL DEFAULT 0,
  bot_hits   INTEGER      NOT NULL DEFAULT 0,
  last_seen  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  PRIMARY KEY (path, day)
);

CREATE INDEX IF NOT EXISTS idx_path_hits_last_seen ON path_hits(last_seen DESC);
