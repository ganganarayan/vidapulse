-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 009 — Add alert_prefs JSONB column to user_preferences
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE user_preferences
  ADD COLUMN IF NOT EXISTS alert_prefs JSONB NOT NULL DEFAULT '{}';
