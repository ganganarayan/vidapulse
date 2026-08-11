-- Migration 050: page_views — human/bot page views on the landing page + KB.
-- Fed by a tiny beacon (GET /api/pageview) embedded in landing/index.html and
-- every KB page. Captures path, referrer, UTM, device, country, and bot flag
-- so we can see where real (human) traffic comes from.

CREATE TABLE IF NOT EXISTS page_views (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  host         VARCHAR(120),
  path         TEXT,
  referrer     TEXT,
  utm_source   VARCHAR(200),
  utm_medium   VARCHAR(200),
  utm_campaign VARCHAR(200),
  utm_term     VARCHAR(200),
  utm_content  VARCHAR(200),
  device       VARCHAR(20),
  is_bot       BOOLEAN NOT NULL DEFAULT FALSE,
  bot_name     VARCHAR(80),
  country_code VARCHAR(4),
  ip           VARCHAR(64),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_page_views_created    ON page_views(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_views_utm_source ON page_views(utm_source);
CREATE INDEX IF NOT EXISTS idx_page_views_human      ON page_views(is_bot, created_at DESC);
