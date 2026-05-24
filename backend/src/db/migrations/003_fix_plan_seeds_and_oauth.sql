-- ============================================================
-- Migration 003 — Fix Plan Seeds + Add OAuth Accounts
--
-- 1. Corrects plan feature lists to match the approved pricing page:
--    - Free:    basic plays/visitors/domain/embed only
--    - Starter: adds geographic data, device breakdown, avg time watched
--    - Pro:     engagement heatmaps, viewer analytics, audience segmentation,
--               conversion tracking, funnels, events, reports, alerts
--    (custom_player_controls and playlists removed from Starter — Pro only)
--
-- 2. Adds user_oauth_accounts table for Google and Microsoft OAuth.
--    Account creation paths:
--      a) Webhook (divineleads.guru) → creates Starter/Pro account (paid)
--      b) Google/Microsoft OAuth     → creates Free account if email is new
--      c) Google/Microsoft OAuth     → logs in if email/provider_id matches existing
--    No email/password signup form — OAuth is the only self-serve entry point.
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. Fix plan features
-- ─────────────────────────────────────────────────────────────

UPDATE plans SET
  features = '["1_video","total_plays","play_rate","unique_visitors_count","domain_tracking","direct_link_embed_code","community_support"]'
WHERE name = 'free';

UPDATE plans SET
  features = '["up_to_10_videos","all_free_features","geographic_data","device_browser_breakdown","avg_time_watched","email_support"]'
WHERE name = 'starter';

UPDATE plans SET
  features = '["unlimited_videos","all_starter_features","engagement_heatmaps","viewer_level_analytics","audience_segmentation","conversion_tracking_funnels","events_reports_alerts","custom_player_controls","priority_support"]'
WHERE name = 'pro';

-- ─────────────────────────────────────────────────────────────
-- 2. OAuth accounts table
-- Stores linked Google / Microsoft accounts for existing users.
-- One user can link both providers. Provider_id is the unique
-- identifier returned by Google or Microsoft (not the email,
-- which can change).
-- ─────────────────────────────────────────────────────────────

CREATE TABLE user_oauth_accounts (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider         VARCHAR(20)  NOT NULL,   -- 'google' | 'microsoft'
  provider_id      VARCHAR(255) NOT NULL,   -- Stable sub/oid from the provider
  provider_email   VARCHAR(255),            -- Email the provider returned (informational)
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_oauth_provider_id UNIQUE (provider, provider_id),
  CONSTRAINT chk_oauth_provider   CHECK (provider IN ('google', 'microsoft'))
);

COMMENT ON TABLE user_oauth_accounts IS
  'Links a VidaPulse user to their Google or Microsoft OAuth identity. '
  'OAuth handles both login (existing accounts) and signup (new accounts → free plan). '
  'Webhook (divineleads.guru) creates Starter/Pro accounts; OAuth creates Free accounts. '
  'provider_id is the stable sub/oid from the provider — more reliable than email for matching.';

CREATE INDEX idx_oauth_user_id ON user_oauth_accounts(user_id);
