-- ============================================================
-- Migration 001 — Initial VidaPulse Schema
-- Applied automatically on first server startup via migrate.js
-- Schema approved: 2026-05-21
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE plan_name AS ENUM (
  'free', 'starter', 'pro', 'admin_lifetime'
);

CREATE TYPE video_source_type AS ENUM (
  'mp4_direct', 'hls_stream', 'youtube', 'google_drive',
  'dropbox', 'onedrive', 'amazon_s3', 'azure_blob',
  'zoom', 'loom', 'vimeo', 'playlist', 'other'
);

CREATE TYPE device_type AS ENUM (
  'desktop', 'tablet', 'mobile', 'tv', 'unknown'
);

CREATE TYPE analytics_event_type AS ENUM (
  'player_load', 'play', 'pause', 'seek', 'mute', 'unmute',
  'ended', 'replay', 'speed_change', 'fullscreen_enter', 'fullscreen_exit',
  'pip_enter', 'pip_exit', 'buffer_start', 'buffer_end', 'quality_change',
  'player_error', 'session_heartbeat', 'player_unload'
);

CREATE TYPE user_role AS ENUM ('subscriber', 'admin');

CREATE TYPE token_purpose AS ENUM ('set_password', 'reset_password');

CREATE TYPE job_status AS ENUM ('pending', 'processing', 'completed', 'failed');

CREATE TYPE business_segment AS ENUM (
  'coach', 'creator', 'product_promoter', 'digital_agency', 'b2b_sales', 'other'
);

CREATE TYPE processing_job_type AS ENUM ('initial_resolve', 'url_refresh');

CREATE TYPE funnel_trigger_type AS ENUM (
  'time_reached', 'percent_reached', 'cta_click', 'form_submit', 'video_ended'
);

CREATE TYPE alert_metric AS ENUM (
  'play_rate', 'unique_viewers', 'total_plays', 'avg_watch_pct',
  'drop_off_pct', 'new_viewer_daily'
);

CREATE TYPE alert_operator AS ENUM ('gt', 'lt', 'gte', 'lte', 'eq');

CREATE TYPE report_type AS ENUM (
  'video_summary', 'audience_overview', 'geographic_breakdown',
  'device_breakdown', 'funnel_report', 'custom'
);

-- ============================================================
-- TABLE 1: PLANS
-- ============================================================

CREATE TABLE plans (
  id                       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                     plan_name UNIQUE NOT NULL,
  display_name             VARCHAR(100) NOT NULL,
  price_inr                DECIMAL(10,2) NOT NULL DEFAULT 0,
  price_usd                DECIMAL(10,2) NOT NULL DEFAULT 0,
  billing_period           VARCHAR(20) NOT NULL DEFAULT 'monthly',
  video_limit              INTEGER,
  analytics_retention_days INTEGER,
  max_embed_domains        INTEGER DEFAULT 1,
  features                 JSONB NOT NULL DEFAULT '[]',
  is_active                BOOLEAN DEFAULT TRUE,
  created_at               TIMESTAMPTZ DEFAULT NOW(),
  updated_at               TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO plans (name, display_name, price_inr, price_usd, billing_period, video_limit, analytics_retention_days, max_embed_domains, features) VALUES
  ('free', 'Forever Free', 0, 0, 'free', 1, 90, 1,
   '["1_video","total_plays","play_rate","unique_visitors_count","domain_tracking","direct_link_embed_code","community_support"]'),
  ('starter', 'Starter', 830, 10, 'monthly', 10, 365, 10,
   '["up_to_10_videos","all_free_features","geographic_data","device_browser_breakdown","avg_time_watched","custom_player_controls","playlists","email_support"]'),
  ('pro', 'Pro', 1580, 19, 'monthly', NULL, NULL, NULL,
   '["unlimited_videos","all_starter_features","engagement_heatmaps","viewer_level_analytics","audience_segmentation","conversion_tracking","funnels","events_tracking","reports","alerts","priority_support"]'),
  ('admin_lifetime', 'Admin Lifetime', 0, 0, 'lifetime', NULL, NULL, NULL,
   '["all_features","admin_panel","unlimited_everything"]');

-- ============================================================
-- TABLE 2: USERS
-- ============================================================

CREATE TABLE users (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email                 VARCHAR(255) UNIQUE NOT NULL,
  name                  VARCHAR(255) NOT NULL,
  phone                 VARCHAR(30),
  password_hash         VARCHAR(255),
  role                  user_role NOT NULL DEFAULT 'subscriber',
  plan_id               UUID REFERENCES plans(id),
  plan_expires_at       TIMESTAMPTZ,
  business_segment      business_segment,
  business_description  TEXT,
  is_active             BOOLEAN DEFAULT TRUE,
  password_set          BOOLEAN DEFAULT FALSE,
  onboarding_done       BOOLEAN DEFAULT FALSE,
  email_verified        BOOLEAN DEFAULT FALSE,
  created_via           VARCHAR(50) DEFAULT 'webhook',
  raw_webhook_payload   JSONB,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW(),
  last_login_at         TIMESTAMPTZ
);

COMMENT ON COLUMN users.plan_expires_at IS
  'NULL = plan never expires. Active check: plan_expires_at IS NULL OR plan_expires_at > NOW()';

-- ============================================================
-- TABLE 3: USER PREFERENCES
-- ============================================================

CREATE TABLE user_preferences (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  theme                 VARCHAR(10) NOT NULL DEFAULT 'dark',
  timezone              VARCHAR(100) DEFAULT 'Asia/Kolkata',
  email_notifications   BOOLEAN DEFAULT TRUE,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE 4: AUTH TOKENS
-- ============================================================

CREATE TABLE auth_tokens (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token       VARCHAR(255) UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(48), 'hex'),
  purpose     token_purpose NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '48 hours'),
  used_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE 5: VIDEOS
-- ============================================================

CREATE TABLE videos (
  id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title                     VARCHAR(500) NOT NULL,
  description               TEXT,
  original_url              TEXT NOT NULL,
  source_type               video_source_type NOT NULL DEFAULT 'other',
  playable_url              TEXT,
  thumbnail_url             TEXT,
  duration_seconds          DECIMAL(10,3),
  file_size_bytes           BIGINT,
  analytics_note            TEXT,
  playable_url_expires_at   TIMESTAMPTZ,
  playable_url_refreshed_at TIMESTAMPTZ,
  using_iframe_fallback     BOOLEAN DEFAULT FALSE,
  processing_status         job_status DEFAULT 'pending',
  processing_error          TEXT,
  is_active                 BOOLEAN DEFAULT TRUE,
  is_archived               BOOLEAN DEFAULT FALSE,
  total_plays               INTEGER DEFAULT 0,
  unique_viewers            INTEGER DEFAULT 0,
  avg_watch_pct             DECIMAL(5,2) DEFAULT 0,
  created_at                TIMESTAMPTZ DEFAULT NOW(),
  updated_at                TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON COLUMN videos.analytics_note IS
  'Human-readable note about analytics limitations for this source type.';

-- ============================================================
-- TABLE 6: VIDEO PLAYER SETTINGS
-- ============================================================

CREATE TABLE video_player_settings (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               UUID REFERENCES users(id) ON DELETE CASCADE,
  video_id              UUID UNIQUE REFERENCES videos(id) ON DELETE CASCADE,
  show_seek_bar         BOOLEAN DEFAULT TRUE,
  show_elapsed_time     BOOLEAN DEFAULT TRUE,
  show_remaining_time   BOOLEAN DEFAULT FALSE,
  show_playback_speed   BOOLEAN DEFAULT TRUE,
  show_mute_button      BOOLEAN DEFAULT TRUE,
  show_play_pause_btn   BOOLEAN DEFAULT TRUE,
  show_fullscreen_btn   BOOLEAN DEFAULT TRUE,
  show_pip_btn          BOOLEAN DEFAULT FALSE,
  click_to_play_pause   BOOLEAN DEFAULT TRUE,
  autoplay              BOOLEAN DEFAULT TRUE,
  autoplay_muted        BOOLEAN DEFAULT TRUE,
  loop                  BOOLEAN DEFAULT FALSE,
  available_speeds      JSONB DEFAULT '[0.5, 0.75, 1, 1.5, 1.75, 2]',
  default_speed         DECIMAL(3,2) DEFAULT 1.0,
  player_theme          VARCHAR(10) DEFAULT 'dark',
  accent_color          VARCHAR(7) DEFAULT '#F59E0B',
  show_branding         BOOLEAN DEFAULT TRUE,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT chk_player_settings_single_owner CHECK (
    (video_id IS NOT NULL AND user_id IS NULL) OR
    (video_id IS NULL AND user_id IS NOT NULL)
  )
);

-- ============================================================
-- TABLE 7: PLAYLISTS + PLAYLIST_VIDEOS
-- ============================================================

CREATE TABLE playlists (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       VARCHAR(500) NOT NULL,
  description TEXT,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE playlist_videos (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  playlist_id UUID NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
  video_id    UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  position    INTEGER NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (playlist_id, video_id),
  UNIQUE (playlist_id, position)
);

-- ============================================================
-- TABLE 8: EMBED CONFIGS
-- ============================================================

CREATE TABLE embed_configs (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  video_id              UUID UNIQUE NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  embed_token           VARCHAR(64) UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  allowed_domains       JSONB DEFAULT '[]',
  custom_thumbnail_url  TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE 9: VIEWERS
-- ============================================================

CREATE TABLE viewers (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cookie_id         VARCHAR(128) UNIQUE NOT NULL,
  fingerprint_hash  VARCHAR(128),
  email             VARCHAR(255),
  name              VARCHAR(255),
  first_ip          INET,
  first_user_agent  TEXT,
  first_seen_at     TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at      TIMESTAMPTZ DEFAULT NOW(),
  total_sessions    INTEGER DEFAULT 0
);

-- ============================================================
-- TABLE 10: ANALYTICS SESSIONS
-- ============================================================

CREATE TABLE analytics_sessions (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  video_id             UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  viewer_id            UUID NOT NULL REFERENCES viewers(id),
  page_url             TEXT,
  domain               VARCHAR(255),
  referrer_url         TEXT,
  utm_source           VARCHAR(255),
  utm_medium           VARCHAR(255),
  utm_campaign         VARCHAR(255),
  utm_term             VARCHAR(255),
  utm_content          VARCHAR(255),
  device_type          device_type DEFAULT 'unknown',
  browser              VARCHAR(100),
  browser_version      VARCHAR(50),
  os                   VARCHAR(100),
  os_version           VARCHAR(50),
  user_agent           TEXT,
  screen_width         INTEGER,
  screen_height        INTEGER,
  ip_address           INET,
  country_code         CHAR(2),
  country_name         VARCHAR(100),
  region               VARCHAR(100),
  city                 VARCHAR(100),
  latitude             DECIMAL(9,6),
  longitude            DECIMAL(9,6),
  timezone             VARCHAR(100),
  started_at           TIMESTAMPTZ DEFAULT NOW(),
  ended_at             TIMESTAMPTZ,
  total_watch_seconds  DECIMAL(10,2) DEFAULT 0,
  max_watch_pct        DECIMAL(5,2) DEFAULT 0,
  avg_watch_pct        DECIMAL(5,2) DEFAULT 0,
  play_count           INTEGER DEFAULT 0,
  pause_count          INTEGER DEFAULT 0,
  seek_count           INTEGER DEFAULT 0,
  started_muted        BOOLEAN DEFAULT TRUE,
  unmuted_at_seconds   DECIMAL(10,2),
  final_playback_speed DECIMAL(3,2) DEFAULT 1.0,
  reached_end          BOOLEAN DEFAULT FALSE,
  analytics_flags      JSONB DEFAULT '{}',
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE 11: ANALYTICS EVENTS
-- ============================================================

CREATE TABLE analytics_events (
  id             BIGSERIAL PRIMARY KEY,
  session_id     UUID NOT NULL REFERENCES analytics_sessions(id) ON DELETE CASCADE,
  video_id       UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  event_type     analytics_event_type NOT NULL,
  video_position DECIMAL(10,3),
  occurred_at    TIMESTAMPTZ DEFAULT NOW(),
  metadata       JSONB DEFAULT '{}'
);

-- ============================================================
-- TABLE 12: ANALYTICS WATCH INTERVALS
-- ============================================================

CREATE TABLE analytics_watch_intervals (
  id           BIGSERIAL PRIMARY KEY,
  session_id   UUID NOT NULL REFERENCES analytics_sessions(id) ON DELETE CASCADE,
  video_id     UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  start_second DECIMAL(10,3) NOT NULL,
  end_second   DECIMAL(10,3) NOT NULL,
  watch_pass   SMALLINT DEFAULT 1,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT chk_interval_order CHECK (end_second > start_second)
);

-- ============================================================
-- TABLE 13: ANALYTICS HEATMAP AGGREGATE
-- ============================================================

CREATE TABLE analytics_heatmap_aggregate (
  video_id      UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  second_bucket INTEGER NOT NULL,
  first_watches INTEGER NOT NULL DEFAULT 0,
  replays       INTEGER NOT NULL DEFAULT 0,
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (video_id, second_bucket)
);

-- ============================================================
-- TABLE 14: ANALYTICS DAILY STATS
-- ============================================================

CREATE TABLE analytics_daily_stats (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  video_id            UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  stat_date           DATE NOT NULL,
  total_plays         INTEGER DEFAULT 0,
  unique_viewers      INTEGER DEFAULT 0,
  total_watch_seconds BIGINT DEFAULT 0,
  avg_watch_pct       DECIMAL(5,2) DEFAULT 0,
  completed_views     INTEGER DEFAULT 0,
  play_rate           DECIMAL(5,2) DEFAULT 0,
  updated_at          TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (video_id, stat_date)
);

-- ============================================================
-- TABLE 15: ALLOWED DOMAINS
-- ============================================================

CREATE TABLE allowed_domains (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  domain     VARCHAR(255) NOT NULL,
  is_active  BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, domain)
);

-- ============================================================
-- TABLE 16: VIDEO PROCESSING JOBS
-- ============================================================

CREATE TABLE video_processing_jobs (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  video_id     UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  job_type     processing_job_type NOT NULL DEFAULT 'initial_resolve',
  status       job_status DEFAULT 'pending',
  attempts     SMALLINT DEFAULT 0,
  max_attempts SMALLINT DEFAULT 3,
  last_error   TEXT,
  started_at   TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE 17: WEBHOOK LOGS
-- ============================================================

CREATE TABLE webhook_logs (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  endpoint       VARCHAR(255) NOT NULL,
  raw_payload    JSONB,
  secret_valid   BOOLEAN,
  http_status    INTEGER,
  processed      BOOLEAN DEFAULT FALSE,
  result_user_id UUID REFERENCES users(id),
  error_message  TEXT,
  ip_address     INET,
  received_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE 18: ADMIN IMPERSONATION SESSIONS
-- ============================================================

CREATE TABLE admin_impersonation_sessions (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_user_id  UUID NOT NULL REFERENCES users(id),
  target_user_id UUID NOT NULL REFERENCES users(id),
  session_token  VARCHAR(128) UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  started_at     TIMESTAMPTZ DEFAULT NOW(),
  ended_at       TIMESTAMPTZ,
  admin_ip       INET
);

-- ============================================================
-- TABLE 19: HELP DOC SECTIONS
-- ============================================================

CREATE TABLE help_doc_sections (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title        VARCHAR(255) NOT NULL,
  slug         VARCHAR(255) UNIQUE NOT NULL,
  description  TEXT,
  icon         VARCHAR(100),
  position     INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE 20: HELP DOC PAGES
-- ============================================================

CREATE TABLE help_doc_pages (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  section_id           UUID REFERENCES help_doc_sections(id) ON DELETE SET NULL,
  parent_page_id       UUID REFERENCES help_doc_pages(id) ON DELETE SET NULL,
  title                VARCHAR(500) NOT NULL,
  slug                 VARCHAR(500) UNIQUE NOT NULL,
  content              TEXT,
  tutorial_video_url   TEXT,
  tutorial_video_type  VARCHAR(50),
  position             INTEGER DEFAULT 0,
  is_published         BOOLEAN DEFAULT TRUE,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE 21: FUNNELS
-- ============================================================

CREATE TABLE funnels (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  video_id    UUID REFERENCES videos(id) ON DELETE CASCADE,
  name        VARCHAR(255) NOT NULL,
  description TEXT,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE 22: FUNNEL STEPS
-- ============================================================

CREATE TABLE funnel_steps (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  funnel_id     UUID NOT NULL REFERENCES funnels(id) ON DELETE CASCADE,
  name          VARCHAR(255) NOT NULL,
  trigger_type  funnel_trigger_type NOT NULL,
  trigger_value JSONB,
  position      SMALLINT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE 23: CONVERSION EVENTS
-- ============================================================

CREATE TABLE conversion_events (
  id             BIGSERIAL PRIMARY KEY,
  funnel_id      UUID NOT NULL REFERENCES funnels(id) ON DELETE CASCADE,
  step_id        UUID NOT NULL REFERENCES funnel_steps(id) ON DELETE CASCADE,
  session_id     UUID NOT NULL REFERENCES analytics_sessions(id) ON DELETE CASCADE,
  viewer_id      UUID NOT NULL REFERENCES viewers(id),
  video_id       UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  video_position DECIMAL(10,2),
  occurred_at    TIMESTAMPTZ DEFAULT NOW(),
  metadata       JSONB DEFAULT '{}'
);

-- ============================================================
-- TABLE 24: CTA OVERLAYS
-- ============================================================

CREATE TABLE cta_overlays (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  video_id       UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  label          VARCHAR(255) NOT NULL,
  url            TEXT NOT NULL,
  show_at_second DECIMAL(10,2) NOT NULL,
  hide_at_second DECIMAL(10,2),
  style          JSONB DEFAULT '{}',
  is_active      BOOLEAN DEFAULT TRUE,
  click_count    INTEGER DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE 25: ALERTS
-- ============================================================

CREATE TABLE alerts (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id              UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  video_id             UUID REFERENCES videos(id) ON DELETE CASCADE,
  name                 VARCHAR(255) NOT NULL,
  metric               alert_metric NOT NULL,
  operator             alert_operator NOT NULL,
  threshold            DECIMAL(12,4) NOT NULL,
  notify_email         BOOLEAN DEFAULT TRUE,
  is_active            BOOLEAN DEFAULT TRUE,
  last_triggered_at    TIMESTAMPTZ,
  last_triggered_value DECIMAL(12,4),
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE 26: ALERT NOTIFICATIONS
-- ============================================================

CREATE TABLE alert_notifications (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alert_id        UUID NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,
  triggered_value DECIMAL(12,4) NOT NULL,
  channels_used   JSONB DEFAULT '["email"]',
  sent_at         TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE 27: REPORTS
-- ============================================================

CREATE TABLE reports (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name            VARCHAR(255) NOT NULL,
  report_type     report_type NOT NULL,
  config          JSONB NOT NULL DEFAULT '{}',
  last_run_at     TIMESTAMPTZ,
  last_result_url TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_users_email            ON users(email);
CREATE INDEX idx_users_plan_id          ON users(plan_id);
CREATE INDEX idx_users_plan_expires     ON users(plan_expires_at) WHERE plan_expires_at IS NOT NULL;
CREATE INDEX idx_users_role             ON users(role);

CREATE INDEX idx_videos_user_id         ON videos(user_id);
CREATE INDEX idx_videos_source_type     ON videos(source_type);
CREATE INDEX idx_videos_active          ON videos(user_id, is_active, is_archived);
CREATE INDEX idx_videos_needs_refresh   ON videos(playable_url_expires_at) WHERE playable_url_expires_at IS NOT NULL AND is_active = TRUE;

CREATE INDEX idx_embed_token            ON embed_configs(embed_token);

CREATE INDEX idx_viewers_cookie_id      ON viewers(cookie_id);
CREATE INDEX idx_viewers_fingerprint    ON viewers(fingerprint_hash) WHERE fingerprint_hash IS NOT NULL;
CREATE INDEX idx_viewers_email          ON viewers(email) WHERE email IS NOT NULL;

CREATE INDEX idx_sessions_video_id      ON analytics_sessions(video_id);
CREATE INDEX idx_sessions_viewer_id     ON analytics_sessions(viewer_id);
CREATE INDEX idx_sessions_started_at    ON analytics_sessions(video_id, started_at DESC);
CREATE INDEX idx_sessions_domain        ON analytics_sessions(domain);
CREATE INDEX idx_sessions_country       ON analytics_sessions(country_code);
CREATE INDEX idx_sessions_utm_source    ON analytics_sessions(utm_source) WHERE utm_source IS NOT NULL;

CREATE INDEX idx_events_session_id      ON analytics_events(session_id);
CREATE INDEX idx_events_video_id        ON analytics_events(video_id, event_type);
CREATE INDEX idx_events_occurred_at     ON analytics_events(occurred_at);

CREATE INDEX idx_intervals_session_id   ON analytics_watch_intervals(session_id);
CREATE INDEX idx_intervals_video_id     ON analytics_watch_intervals(video_id);

CREATE INDEX idx_daily_stats_video_date ON analytics_daily_stats(video_id, stat_date DESC);

CREATE INDEX idx_auth_tokens_token      ON auth_tokens(token);
CREATE INDEX idx_auth_tokens_user       ON auth_tokens(user_id);
CREATE INDEX idx_auth_tokens_expires    ON auth_tokens(expires_at) WHERE used_at IS NULL;

CREATE INDEX idx_jobs_status            ON video_processing_jobs(status) WHERE status IN ('pending','processing');

CREATE INDEX idx_help_pages_section     ON help_doc_pages(section_id);
CREATE INDEX idx_help_pages_parent      ON help_doc_pages(parent_page_id) WHERE parent_page_id IS NOT NULL;

CREATE INDEX idx_playlist_videos_pl     ON playlist_videos(playlist_id, position);

CREATE INDEX idx_webhook_received_at    ON webhook_logs(received_at DESC);

CREATE INDEX idx_funnels_user_id        ON funnels(user_id);
CREATE INDEX idx_funnels_video_id       ON funnels(video_id) WHERE video_id IS NOT NULL;
CREATE INDEX idx_funnel_steps_funnel    ON funnel_steps(funnel_id, position);
CREATE INDEX idx_conversions_funnel     ON conversion_events(funnel_id, step_id);
CREATE INDEX idx_conversions_viewer     ON conversion_events(viewer_id);
CREATE INDEX idx_conversions_video      ON conversion_events(video_id, occurred_at DESC);

CREATE INDEX idx_cta_video_id           ON cta_overlays(video_id) WHERE is_active = TRUE;

CREATE INDEX idx_alerts_user_id         ON alerts(user_id);
CREATE INDEX idx_alerts_video_id        ON alerts(video_id) WHERE video_id IS NOT NULL;
CREATE INDEX idx_alerts_active          ON alerts(is_active) WHERE is_active = TRUE;

CREATE INDEX idx_reports_user_id        ON reports(user_id);

-- ============================================================
-- SEED: ADMIN USER
-- ganganarayan.rns@gmail.com — role=admin, plan=admin_lifetime
-- Password set via email on first login.
-- ============================================================

INSERT INTO users (email, name, role, plan_id, plan_expires_at, created_via, password_set)
SELECT
  'ganganarayan.rns@gmail.com',
  'Ganga Narayan Das',
  'admin',
  p.id,
  NULL,
  'admin_manual',
  FALSE
FROM plans p WHERE p.name = 'admin_lifetime';

INSERT INTO user_preferences (user_id)
SELECT id FROM users WHERE email = 'ganganarayan.rns@gmail.com';
