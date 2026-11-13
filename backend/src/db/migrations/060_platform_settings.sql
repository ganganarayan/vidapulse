-- 060_platform_settings.sql
--
-- Platform keys and secrets managed from inside the app (super admin) instead
-- of Railway env vars: Razorpay keys + webhook secret, Google OAuth, platform
-- Meta pixel, JWT signing secret, inbound webhook secret.
--
-- A row here WINS over the env var of the same name; with no row the env var
-- is used, so nothing changes until a value is saved in the app.

CREATE TABLE IF NOT EXISTS platform_settings (
  key        TEXT        PRIMARY KEY,
  value      TEXT        NOT NULL,
  updated_by UUID        REFERENCES users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
