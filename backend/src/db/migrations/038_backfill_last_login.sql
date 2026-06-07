-- Migration 038: Backfill last_login_at for direct-signup users
--
-- Direct /register signups were logged in at account creation but the code
-- never recorded last_login_at, so they showed "Never" in Admin → Users even
-- after using the app. The code is now fixed going forward; this backfills
-- existing affected rows using created_at (their effective first login).
--
-- Scope: only password accounts that were never recorded as logged in.
-- Magic-link users who never consumed their link (password_set = FALSE,
-- last_login_at NULL) are intentionally left as "Never".

UPDATE users
   SET last_login_at = created_at
 WHERE last_login_at IS NULL
   AND password_set = TRUE;
