-- Migration 049: crawler_log — which bots/crawlers browse the app.
-- Aggregated per bot per day (one row = one bot for one day) so it stays
-- tiny despite constant crawler traffic. hits increments on each request.

CREATE TABLE IF NOT EXISTS crawler_log (
  bot_name   VARCHAR(80)  NOT NULL,
  day        DATE         NOT NULL,
  hits       INTEGER      NOT NULL DEFAULT 0,
  last_path  TEXT,
  last_ip    VARCHAR(64),
  last_seen  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  PRIMARY KEY (bot_name, day)
);

CREATE INDEX IF NOT EXISTS idx_crawler_log_last_seen ON crawler_log(last_seen DESC);
