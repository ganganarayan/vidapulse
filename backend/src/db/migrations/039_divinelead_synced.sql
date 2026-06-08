-- Migration 039: divinelead_synced_at — once-only guard for DivineLead push
--
-- On every NEW signup (direct email/password + Google OAuth) the server
-- submits the lead to the DivineLead opt-in form so its "Form filled"
-- automation fires (WhatsApp + email). This must fire EXACTLY ONCE per
-- account. This nullable column is claimed atomically
-- (UPDATE ... WHERE divinelead_synced_at IS NULL) so it can never fire twice
-- under retries, races, or repeated logins.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS divinelead_synced_at TIMESTAMPTZ NULL;
