-- Migration 028: Add archive_limit to plans
-- free=1, starter=5, pro=10, admin_lifetime=NULL (unlimited)

ALTER TABLE plans ADD COLUMN IF NOT EXISTS archive_limit INTEGER;

UPDATE plans SET archive_limit = 1  WHERE name = 'free';
UPDATE plans SET archive_limit = 5  WHERE name = 'starter';
UPDATE plans SET archive_limit = 10 WHERE name = 'pro';
-- admin_lifetime stays NULL (unlimited)
