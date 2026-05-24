-- =============================================================================
-- Migration 006: Admin Impersonation Log
-- =============================================================================
-- Creates the append-only audit table that records every admin impersonation
-- session — who started it, who they impersonated, why, what they did, and
-- when/how it ended.
--
-- Rows are NEVER deleted or updated except for:
--   ended_at     — set when the session ends (by admin or by JWT expiry)
--   ended_normally — set to TRUE on clean exit
--   actions_taken  — JSONB array, always appended (never replaced)
--
-- Run with:  node src/db/migrate.js
-- =============================================================================

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- Table: admin_impersonation_log
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS admin_impersonation_log (
  id                BIGSERIAL     PRIMARY KEY,
  admin_user_id     UUID          REFERENCES users(id) ON DELETE SET NULL,
  target_user_id    UUID          REFERENCES users(id) ON DELETE SET NULL,
  target_user_email TEXT          NOT NULL,
  session_token     TEXT          NOT NULL UNIQUE,
  reason            TEXT,
  started_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  ended_at          TIMESTAMPTZ,
  actions_taken     JSONB         NOT NULL DEFAULT '[]'::jsonb,
  ip_address        TEXT,
  ended_normally    BOOLEAN       NOT NULL DEFAULT FALSE
);

-- Fast lookup by admin (for "sessions I started" views)
CREATE INDEX IF NOT EXISTS idx_imp_log_admin
  ON admin_impersonation_log (admin_user_id, started_at DESC);

-- Fast lookup by target (for "who accessed my account" views)
CREATE INDEX IF NOT EXISTS idx_imp_log_target
  ON admin_impersonation_log (target_user_id, started_at DESC);

-- session_token uniqueness is already enforced by UNIQUE above,
-- but a separate index makes token lookups fast (used on every ping/end call)
CREATE INDEX IF NOT EXISTS idx_imp_log_session_token
  ON admin_impersonation_log (session_token);

COMMIT;
