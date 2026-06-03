-- 035_purge_lifecycle.sql
-- Account lifecycle: purge log + returning-user detection + gap reminder.
--
-- Two 180-day cycles (free accounts): 180d idle → auto-deactivate; then 180d
-- deactivated → auto-purge. Purge deletes the users row, so we log purges to a
-- standalone table to (a) recognize a returning user by email and (b) give the
-- admin a purge history. Additive only — safe to roll back.

CREATE TABLE IF NOT EXISTS purged_accounts (
  id                  BIGSERIAL PRIMARY KEY,
  email               VARCHAR(255) NOT NULL,
  name                VARCHAR(255),
  reason              TEXT,                 -- 'inactivity_180d' | 'deactivated_180d' | 'manual'
  original_created_at TIMESTAMPTZ,
  purged_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_purged_accounts_email     ON purged_accounts (LOWER(email));
CREATE INDEX IF NOT EXISTS idx_purged_accounts_purged_at ON purged_accounts (purged_at DESC);

-- Returning-after-purge one-time notice (set when a new signup matches a purged
-- email), and previous_login_at for the "returning after a gap" reminder.
ALTER TABLE users ADD COLUMN IF NOT EXISTS previously_purged_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS purge_notice_shown   BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS previous_login_at    TIMESTAMPTZ;
