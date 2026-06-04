-- Migration 036: Add magic_link to the token_purpose enum
--
-- Enables the passwordless / tokenized entry flow:
--   POST /api/auth/magic-link  → find-or-create user, mint token
--   POST /api/auth/magic-link/consume → validate, log in, burn token
--
-- Only the enum extension is needed; auth_tokens already has the right columns.
-- ALTER TYPE ... ADD VALUE cannot run inside a transaction on older PG, so it
-- is intentionally a standalone statement.

ALTER TYPE token_purpose ADD VALUE IF NOT EXISTS 'magic_link';
