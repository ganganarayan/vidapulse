-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 012 — Add kind column to user_reports
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Distinguishes custom metric reports from fixed-format raw exports
-- so the frontend can derive the right UI state per export type.
--
-- kind values: 'custom' | 'viewer_journey' | 'events_log'

ALTER TABLE user_reports
  ADD COLUMN IF NOT EXISTS kind VARCHAR(50) NOT NULL DEFAULT 'custom';

CREATE INDEX IF NOT EXISTS idx_user_reports_user_kind
  ON user_reports(user_id, kind);
