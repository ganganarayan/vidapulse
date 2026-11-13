-- 060_platform_settings.sql
--
-- Platform keys and secrets managed from inside the app (super admin) instead
-- of Railway env vars: Razorpay keys + webhook secret, Google OAuth, platform
-- Meta pixel, JWT signing secret, inbound webhook secret.
--
-- The app is the only source for these keys. On first boot any existing env
-- var is copied in once (services/platformSettings.js), then env is ignored.

CREATE TABLE IF NOT EXISTS platform_settings (
  key        TEXT        PRIMARY KEY,
  value      TEXT        NOT NULL,
  updated_by UUID        REFERENCES users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
