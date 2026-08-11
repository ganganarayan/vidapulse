-- Migration 048: wake_log — records external "wake" pings to the app.
-- Hit GET /api/wake (from a bookmark, phone shortcut, or uptime tool) to wake
-- a sleeping Railway instance; each hit is logged here for the admin Wake page.

CREATE TABLE IF NOT EXISTS wake_log (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source     VARCHAR(100),
  ip         VARCHAR(64),
  user_agent TEXT,
  note       TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wake_log_created ON wake_log(created_at DESC);
