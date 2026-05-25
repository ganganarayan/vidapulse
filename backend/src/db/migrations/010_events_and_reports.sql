-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 010 — CTA / video_loaded event types + user_reports table
-- ═══════════════════════════════════════════════════════════════════════════

-- Extend analytics_event_type ENUM with two new values
ALTER TYPE analytics_event_type ADD VALUE IF NOT EXISTS 'video_loaded';
ALTER TYPE analytics_event_type ADD VALUE IF NOT EXISTS 'cta_click';

-- ── user_reports ─────────────────────────────────────────────────────────
-- Stores subscriber-generated analytics reports (background-generated CSV).
-- csv_data holds the finished file inline so no filesystem is required.

CREATE TABLE IF NOT EXISTS user_reports (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title         VARCHAR(255) NOT NULL,
  metrics       JSONB       NOT NULL DEFAULT '[]',
  date_range    VARCHAR(50) NOT NULL DEFAULT '30_days',
  status        job_status  NOT NULL DEFAULT 'pending',
  row_count     INTEGER,
  csv_data      TEXT,
  error_message TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_reports_user_id ON user_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_user_reports_status  ON user_reports(status);
