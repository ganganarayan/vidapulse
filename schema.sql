-- ============================================================
-- VIDAPULSE — COMPLETE PostgreSQL DATABASE SCHEMA
-- Hosted on Railway.app | Domain: app.vidapulse.in
-- Author: Claude (for review & approval before code is written)
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE plan_name AS ENUM (
  'free',
  'starter',
  'pro',
  'admin_lifetime'
);

CREATE TYPE video_source_type AS ENUM (
  'mp4_direct',     -- Direct .mp4 / .webm / .ogg / .mov / H.264 file URL
  'hls_stream',     -- .m3u8 HLS stream
  'youtube',        -- youtube.com / youtu.be  (heatmap via 1-sec getCurrentTime polling)
  'google_drive',   -- drive.google.com
  'dropbox',        -- dropbox.com
  'onedrive',       -- onedrive.live.com / 1drv.ms
  'amazon_s3',      -- s3.amazonaws.com / any S3-compatible URL
  'azure_blob',     -- blob.core.windows.net
  'zoom',           -- zoom.us recording share link  (impression only — no JS API)
  'loom',           -- loom.com share link  (play/pause/complete only via Loom SDK)
  'vimeo',          -- vimeo.com  (partial via Vimeo Player.js)
  'playlist',       -- VidaPulse internal playlist
  'other'           -- Any unrecognised URL
);

CREATE TYPE device_type AS ENUM (
  'desktop', 'tablet', 'mobile', 'tv', 'unknown'
);

CREATE TYPE analytics_event_type AS ENUM (
  'player_load',        -- Player JS loaded and ready
  'play',               -- User pressed play (or autoplay fired)
  'pause',              -- User paused
  'seek',               -- User seeked (dragged seek bar)
  'mute',               -- User muted
  'unmute',             -- User unmuted
  'ended',              -- Video reached end naturally
  'replay',             -- User replayed from beginning
  'speed_change',       -- Playback rate changed
  'fullscreen_enter',
  'fullscreen_exit',
  'pip_enter',          -- Picture-in-picture
  'pip_exit',
  'buffer_start',       -- Buffering began
  'buffer_end',         -- Buffering ended
  'quality_change',     -- HLS adaptive quality switch
  'player_error',       -- Media error
  'session_heartbeat',  -- Periodic beacon sent every 5s while playing
  'player_unload'       -- Page unload / tab closed
);

CREATE TYPE user_role AS ENUM ('subscriber', 'admin');

CREATE TYPE token_purpose AS ENUM (
  'set_password',    -- New user created via webhook — must set password
  'reset_password'   -- Forgot password flow
);

CREATE TYPE job_status AS ENUM (
  'pending', 'processing', 'completed', 'failed'
);

CREATE TYPE business_segment AS ENUM (
  'coach',            -- Life/business/wellness coaches
  'creator',          -- Content creators / educators
  'product_promoter', -- Webinar replay analytics, product demo
  'digital_agency',   -- Agencies running video funnels for clients
  'b2b_sales',        -- B2B sales demo tracking
  'other'
);

-- ============================================================
-- TABLE 1: PLANS
-- Defines all subscription tiers, limits, and features.
-- NOTE: prices below are initial values — adjust via admin panel.
--       INR prices for Razorpay, USD for Stripe.
-- ============================================================

CREATE TABLE plans (
  id                       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                     plan_name UNIQUE NOT NULL,
  display_name             VARCHAR(100) NOT NULL,

  -- Pricing
  price_inr                DECIMAL(10,2) NOT NULL DEFAULT 0,   -- ₹/month
  price_usd                DECIMAL(10,2) NOT NULL DEFAULT 0,   -- $/month
  billing_period           VARCHAR(20) NOT NULL DEFAULT 'monthly',
  -- Values: 'free' | 'monthly' | 'yearly' | 'lifetime'

  -- Limits (NULL = unlimited)
  video_limit              INTEGER,          -- Max videos the user can add
  analytics_retention_days INTEGER,          -- How many days analytics data is kept (NULL = forever)
  max_embed_domains        INTEGER DEFAULT 1,-- How many domains can embed their videos

  -- Features (used for feature gating in UI and API)
  features                 JSONB NOT NULL DEFAULT '[]',
  -- Each item is a feature key string, e.g.:
  -- "heatmap", "geography", "device_tracking", "utm_tracking",
  -- "audience_tab", "domains_tab", "custom_player", "playlists",
  -- "api_access", "priority_support"

  is_active                BOOLEAN DEFAULT TRUE,
  created_at               TIMESTAMPTZ DEFAULT NOW(),
  updated_at               TIMESTAMPTZ DEFAULT NOW()
);

-- Seed data — sourced from vidapulse.in pricing page (confirmed via screenshot 2026-05-21)
-- INR prices: approximate conversions; update if Razorpay pricing differs
INSERT INTO plans
  (name, display_name, price_inr, price_usd, billing_period,
   video_limit, analytics_retention_days, max_embed_domains, features)
VALUES
  -- ── FREE ─────────────────────────────────────────────────────────────────
  -- "Try VidaPulse with one video; forever"
  ('free', 'Forever Free', 0, 0, 'free',
   1, 90, 1,
   '["1_video",
     "total_plays",
     "play_rate",
     "unique_visitors_count",
     "domain_tracking",
     "direct_link_embed_code",
     "community_support"]'),

  -- ── STARTER ──────────────────────────────────────────────────────────────
  -- "Essential analytics + audience insights"
  ('starter', 'Starter', 830, 10, 'monthly',
   10, 365, 10,
   '["up_to_10_videos",
     "all_free_features",
     "total_plays",
     "play_rate",
     "unique_visitors_count",
     "domain_tracking",
     "direct_link_embed_code",
     "geographic_data",
     "device_browser_breakdown",
     "avg_time_watched",
     "custom_player_controls",
     "playlists",
     "email_support"]'),

  -- ── PRO ──────────────────────────────────────────────────────────────────
  -- "Full analytics suite for serious coaches, creators & educators"
  ('pro', 'Pro', 1580, 19, 'monthly',
   NULL, NULL, NULL,
   '["unlimited_videos",
     "all_starter_features",
     "total_plays",
     "play_rate",
     "unique_visitors_count",
     "domain_tracking",
     "direct_link_embed_code",
     "geographic_data",
     "device_browser_breakdown",
     "avg_time_watched",
     "custom_player_controls",
     "playlists",
     "engagement_heatmaps",
     "viewer_level_analytics",
     "audience_segmentation",
     "conversion_tracking",
     "funnels",
     "events_tracking",
     "reports",
     "alerts",
     "priority_support"]'),

  -- ── ADMIN LIFETIME ───────────────────────────────────────────────────────
  ('admin_lifetime', 'Admin Lifetime', 0, 0, 'lifetime',
   NULL, NULL, NULL,
   '["all_features","admin_panel","unlimited_everything"]');


-- ============================================================
-- TABLE 2: USERS
-- All subscribers + the admin.
-- Accounts are ONLY created via webhook (no self-signup).
-- Admin: ganganarayan.rns@gmail.com — role='admin', plan='admin_lifetime'
-- ============================================================

CREATE TABLE users (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email                 VARCHAR(255) UNIQUE NOT NULL,
  name                  VARCHAR(255) NOT NULL,
  phone                 VARCHAR(30),
  password_hash         VARCHAR(255),          -- NULL until they set password via email link

  -- Role
  role                  user_role NOT NULL DEFAULT 'subscriber',

  -- Plan (admin can override both fields at any time)
  plan_id               UUID REFERENCES plans(id),
  plan_expires_at       TIMESTAMPTZ,            -- NULL for free / lifetime / admin

  -- Business profile (filled on first-login onboarding step)
  business_segment      business_segment,
  business_description  TEXT,

  -- Account state
  is_active             BOOLEAN DEFAULT TRUE,
  password_set          BOOLEAN DEFAULT FALSE,  -- flips TRUE after first password set
  onboarding_done       BOOLEAN DEFAULT FALSE,  -- flips TRUE after profile step completed
  email_verified        BOOLEAN DEFAULT FALSE,

  -- Source / audit
  created_via           VARCHAR(50) DEFAULT 'webhook',
  -- Values: 'webhook' | 'admin_manual'
  raw_webhook_payload   JSONB,                  -- Original webhook payload kept for debugging

  -- Timestamps
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW(),
  last_login_at         TIMESTAMPTZ
);

-- Helper view: is the plan currently active?
-- (Cannot use GENERATED ALWAYS AS because NOW() is volatile)
-- Use this expression in all plan-gate queries:
--   plan_expires_at IS NULL OR plan_expires_at > NOW()
COMMENT ON COLUMN users.plan_expires_at IS
  'NULL means the plan never expires (free or lifetime). '
  'Active check: plan_expires_at IS NULL OR plan_expires_at > NOW()';


-- ============================================================
-- TABLE 3: USER PREFERENCES
-- Per-user UI settings (theme, timezone, notifications).
-- Created with defaults on first login.
-- ============================================================

CREATE TABLE user_preferences (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  theme                 VARCHAR(10) NOT NULL DEFAULT 'dark',   -- 'dark' | 'light'
  timezone              VARCHAR(100) DEFAULT 'Asia/Kolkata',
  email_notifications   BOOLEAN DEFAULT TRUE,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- TABLE 4: AUTH TOKENS
-- For "Set your password" (new users) and "Forgot password".
-- Tokens are single-use and expire.
-- ============================================================

CREATE TABLE auth_tokens (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token       VARCHAR(255) UNIQUE NOT NULL
                DEFAULT encode(gen_random_bytes(48), 'hex'),
  purpose     token_purpose NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL
                DEFAULT (NOW() + INTERVAL '48 hours'),
  used_at     TIMESTAMPTZ,                    -- NULL until consumed
  created_at  TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- TABLE 5: VIDEOS
-- One row per video added by a subscriber.
-- Isolated per user — no cross-account visibility.
-- ============================================================

CREATE TABLE videos (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- User-provided metadata
  title               VARCHAR(500) NOT NULL,
  description         TEXT,
  original_url        TEXT NOT NULL,          -- Exactly what the subscriber pasted

  -- Resolved after URL processing
  source_type         video_source_type NOT NULL DEFAULT 'other',
  playable_url        TEXT,                   -- Resolved embed/stream URL (set after processing)
  thumbnail_url       TEXT,
  duration_seconds    DECIMAL(10,3),          -- Extracted from file header or platform API
  file_size_bytes     BIGINT,                 -- NULL for streams/iframes

  -- Analytics capability note (auto-set during URL resolution)
  -- Example: "YouTube source: heatmap unavailable, seek tracking partial. See ANALYTICS_LIMITATIONS."
  analytics_note      TEXT,

  -- For sources where playable_url contains a time-limited token
  -- (Loom CDN URLs ~24h, Zoom S3 pre-signed ~6-12h)
  -- The video_processing_jobs refresh worker checks this field
  playable_url_expires_at   TIMESTAMPTZ,
  playable_url_refreshed_at TIMESTAMPTZ,
  -- If URL extraction fails for Loom/Zoom, falls back to iframe embed
  -- and this flag is set; analytics_note explains what's missing
  using_iframe_fallback     BOOLEAN DEFAULT FALSE,

  -- Processing state
  processing_status   job_status DEFAULT 'pending',
  processing_error    TEXT,

  -- Soft states
  is_active           BOOLEAN DEFAULT TRUE,
  is_archived         BOOLEAN DEFAULT FALSE,

  -- Denormalized counters (updated async after each session ends)
  -- Source of truth is analytics_sessions, but these power the video list page
  total_plays         INTEGER DEFAULT 0,
  unique_viewers      INTEGER DEFAULT 0,
  avg_watch_pct       DECIMAL(5,2) DEFAULT 0,  -- Average % of video watched

  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON COLUMN videos.analytics_note IS
  'Human-readable note about which analytics are unavailable for this source type and why.';


-- ============================================================
-- TABLE 6: VIDEO PLAYER SETTINGS
-- Two rows per video: one "user-default" row (video_id IS NULL)
-- and an optional per-video override row (video_id IS NOT NULL).
-- Per-video overrides take precedence.
-- All these settings map to toggle switches in the subscriber UI.
-- ============================================================

CREATE TABLE video_player_settings (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Exactly one of the following must be non-NULL:
  --   user_id only  → these are the user's global defaults
  --   video_id only → per-video override (user_id derived from video)
  user_id               UUID REFERENCES users(id) ON DELETE CASCADE,
  video_id              UUID UNIQUE REFERENCES videos(id) ON DELETE CASCADE,

  -- ── Controls Visibility ──
  show_seek_bar         BOOLEAN DEFAULT TRUE,
  show_elapsed_time     BOOLEAN DEFAULT TRUE,   -- "0:34" style left timestamp
  show_remaining_time   BOOLEAN DEFAULT FALSE,  -- "-3:20" style right timestamp
  show_playback_speed   BOOLEAN DEFAULT TRUE,
  show_mute_button      BOOLEAN DEFAULT TRUE,
  show_play_pause_btn   BOOLEAN DEFAULT TRUE,
  show_fullscreen_btn   BOOLEAN DEFAULT TRUE,
  show_pip_btn          BOOLEAN DEFAULT FALSE,

  -- ── Behaviour ──
  click_to_play_pause   BOOLEAN DEFAULT TRUE,
  autoplay              BOOLEAN DEFAULT TRUE,
  autoplay_muted        BOOLEAN DEFAULT TRUE,   -- browsers require muted for autoplay
  loop                  BOOLEAN DEFAULT FALSE,

  -- ── Playback Speeds ──
  available_speeds      JSONB DEFAULT '[0.5, 0.75, 1, 1.5, 1.75, 2]',
  default_speed         DECIMAL(3,2) DEFAULT 1.0,

  -- ── Appearance ──
  player_theme          VARCHAR(10) DEFAULT 'dark',    -- 'dark' | 'light'
  accent_color          VARCHAR(7) DEFAULT '#F59E0B',  -- orange brand default
  show_branding         BOOLEAN DEFAULT TRUE,          -- VidaPulse watermark

  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT chk_player_settings_single_owner
    CHECK (
      (video_id IS NOT NULL AND user_id IS NULL) OR
      (video_id IS NULL AND user_id IS NOT NULL)
    )
);


-- ============================================================
-- TABLE 7: PLAYLISTS + PLAYLIST_VIDEOS
-- Ordered collections of videos within one user's account.
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
  position    INTEGER NOT NULL,   -- 1-based display order
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (playlist_id, video_id),
  UNIQUE (playlist_id, position)
);


-- ============================================================
-- TABLE 8: EMBED CONFIGS
-- One row per video. Stores the embed token used in the
-- one-tag embed script:
--   <script src="https://app.vidapulse.in/player.js"
--           data-video="EMBED_TOKEN"></script>
-- The embed_token is public (appears in page source) but
-- cannot be used to access analytics data.
-- ============================================================

CREATE TABLE embed_configs (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  video_id              UUID UNIQUE NOT NULL REFERENCES videos(id) ON DELETE CASCADE,

  -- Public token embedded in the script tag (32-byte hex = 64 chars)
  embed_token           VARCHAR(64) UNIQUE NOT NULL
                          DEFAULT encode(gen_random_bytes(32), 'hex'),

  -- Domain allowlist: empty array [] = any domain allowed
  -- Populated by subscriber from their Dashboard → Domains tab
  allowed_domains       JSONB DEFAULT '[]',

  -- Optional custom thumbnail override for this embed
  custom_thumbnail_url  TEXT,

  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- TABLE 9: VIEWERS
-- One row per unique person who watches any embedded video.
-- Identity is a persistent first-party cookie (cookie_id).
-- fingerprint_hash is a best-effort browser fingerprint for
-- cross-device/incognito matching.
-- ============================================================

CREATE TABLE viewers (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Primary identity — UUID stored as first-party cookie in viewer's browser
  -- Set by player.js on first load; persists across sessions
  cookie_id         VARCHAR(128) UNIQUE NOT NULL,

  -- Secondary identity — canvas/audio/font fingerprint hash (best-effort)
  -- May match viewers who cleared cookies
  fingerprint_hash  VARCHAR(128),

  -- Known identity (populated if viewer is a named lead / form submission)
  email             VARCHAR(255),
  name              VARCHAR(255),

  -- Lifecycle
  first_ip          INET,
  first_user_agent  TEXT,
  first_seen_at     TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at      TIMESTAMPTZ DEFAULT NOW(),
  total_sessions    INTEGER DEFAULT 0
);


-- ============================================================
-- TABLE 10: ANALYTICS SESSIONS
-- One row per viewing session (one viewer × one video × one page visit).
-- A "session" begins when the player loads and ends when the
-- browser fires unload OR a 30-second inactivity heartbeat gap.
-- ============================================================

CREATE TABLE analytics_sessions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  video_id        UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  viewer_id       UUID NOT NULL REFERENCES viewers(id),

  -- ── Embed Context ──
  page_url        TEXT,                  -- Full URL where the embed appeared
  domain          VARCHAR(255),          -- Extracted hostname (e.g. "example.com")
  referrer_url    TEXT,                  -- HTTP Referer header from player.js request

  -- ── UTM Parameters ──
  utm_source      VARCHAR(255),
  utm_medium      VARCHAR(255),
  utm_campaign    VARCHAR(255),
  utm_term        VARCHAR(255),
  utm_content     VARCHAR(255),

  -- ── Device / Browser ──
  device_type     device_type DEFAULT 'unknown',
  browser         VARCHAR(100),
  browser_version VARCHAR(50),
  os              VARCHAR(100),
  os_version      VARCHAR(50),
  user_agent      TEXT,
  screen_width    INTEGER,
  screen_height   INTEGER,

  -- ── Geography (IP-based, free tier — city + country) ──
  -- Resolved server-side via ip-api.com or MaxMind GeoLite2
  ip_address      INET,
  country_code    CHAR(2),               -- ISO 3166-1 alpha-2
  country_name    VARCHAR(100),
  region          VARCHAR(100),
  city            VARCHAR(100),
  latitude        DECIMAL(9,6),
  longitude       DECIMAL(9,6),
  timezone        VARCHAR(100),

  -- ── Session Metrics ──
  started_at           TIMESTAMPTZ DEFAULT NOW(),
  ended_at             TIMESTAMPTZ,            -- Set on unload or timeout
  total_watch_seconds  DECIMAL(10,2) DEFAULT 0,-- Cumulative seconds of video played
  max_watch_pct        DECIMAL(5,2) DEFAULT 0, -- Furthest point reached (0–100)
  avg_watch_pct        DECIMAL(5,2) DEFAULT 0, -- Unique seconds watched / duration × 100

  -- ── Behaviour Counters ──
  play_count           INTEGER DEFAULT 0,      -- Incremented on every play event (incl. replays)
  pause_count          INTEGER DEFAULT 0,
  seek_count           INTEGER DEFAULT 0,
  started_muted        BOOLEAN DEFAULT TRUE,
  unmuted_at_seconds   DECIMAL(10,2),          -- Video position when first unmuted; NULL = stayed muted
  final_playback_speed DECIMAL(3,2) DEFAULT 1.0,
  reached_end          BOOLEAN DEFAULT FALSE,  -- TRUE if video position reached >= 95% of duration

  -- ── Analytics Capability Flag ──
  -- Mirrors videos.analytics_note for quick dashboard filtering
  -- e.g. '{"heatmap": false, "seek_tracking": "partial", "reason": "YouTube IFrame API"}'
  analytics_flags      JSONB DEFAULT '{}',

  created_at           TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- TABLE 11: ANALYTICS EVENTS (granular event log)
-- Every discrete player event. High write volume —
-- use BIGSERIAL for insert performance.
-- Partitioning by month recommended once volume > 10M rows.
-- ============================================================

CREATE TABLE analytics_events (
  id             BIGSERIAL PRIMARY KEY,
  session_id     UUID NOT NULL REFERENCES analytics_sessions(id) ON DELETE CASCADE,
  video_id       UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,  -- denorm for queries
  event_type     analytics_event_type NOT NULL,

  -- Position in the video (seconds from start) when event fired
  -- NULL for events not tied to a specific position (e.g. player_load, player_error)
  video_position DECIMAL(10,3),

  occurred_at    TIMESTAMPTZ DEFAULT NOW(),

  -- Event-specific payload
  metadata       JSONB DEFAULT '{}'
  -- seek:            {"from": 45.2, "to": 120.0}
  -- speed_change:    {"from": 1.0, "to": 1.5}
  -- quality_change:  {"from": "360p", "to": "720p"}
  -- buffer_end:      {"buffered_seconds": 3.2}
  -- player_error:    {"code": 4, "message": "MEDIA_ERR_SRC_NOT_SUPPORTED"}
  -- session_heartbeat: {"position": 47.3, "watch_seconds_delta": 5}
);


-- ============================================================
-- TABLE 12: ANALYTICS WATCH INTERVALS
-- Stores the exact playback ranges watched within each session.
-- Used to render the per-viewer heatmap row (Wistia-style).
-- watch_pass: 1 = first time through, 2 = replay of that range, etc.
-- ============================================================

CREATE TABLE analytics_watch_intervals (
  id           BIGSERIAL PRIMARY KEY,
  session_id   UUID NOT NULL REFERENCES analytics_sessions(id) ON DELETE CASCADE,
  video_id     UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,  -- denorm

  start_second DECIMAL(10,3) NOT NULL,
  end_second   DECIMAL(10,3) NOT NULL,
  watch_pass   SMALLINT DEFAULT 1,   -- 1=first watch, 2=replay, 3=re-replay

  created_at   TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT chk_interval_order CHECK (end_second > start_second)
);


-- ============================================================
-- TABLE 13: ANALYTICS HEATMAP AGGREGATE
-- Pre-computed per-second watch counts across ALL sessions for
-- a video. Updated in real-time as each session ends.
-- Powers the aggregated heatmap bar (the line graph like Wistia).
-- Avoids full table scans on analytics_watch_intervals at render time.
-- ============================================================

CREATE TABLE analytics_heatmap_aggregate (
  video_id        UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  second_bucket   INTEGER NOT NULL,           -- 0-indexed second of the video
  first_watches   INTEGER NOT NULL DEFAULT 0, -- Sessions that watched this second for the 1st time
  replays         INTEGER NOT NULL DEFAULT 0, -- Sessions that replayed this second
  updated_at      TIMESTAMPTZ DEFAULT NOW(),

  PRIMARY KEY (video_id, second_bucket)
);


-- ============================================================
-- TABLE 14: ANALYTICS DAILY STATS
-- Nightly rollup (also updated on each session end) for
-- fast dashboard queries (chart data, date-range filters).
-- ============================================================

CREATE TABLE analytics_daily_stats (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  video_id              UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  stat_date             DATE NOT NULL,

  total_plays           INTEGER DEFAULT 0,
  unique_viewers        INTEGER DEFAULT 0,
  total_watch_seconds   BIGINT DEFAULT 0,
  avg_watch_pct         DECIMAL(5,2) DEFAULT 0,
  completed_views       INTEGER DEFAULT 0,    -- Sessions where reached_end = TRUE
  play_rate             DECIMAL(5,2) DEFAULT 0,
  -- play_rate = plays / total_player_loads for the day

  updated_at            TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE (video_id, stat_date)
);


-- ============================================================
-- TABLE 15: ALLOWED DOMAINS
-- Per-user allowlist for embed domain restriction.
-- Empty = any domain can embed. Admin can override per video
-- via embed_configs.allowed_domains.
-- ============================================================

CREATE TABLE allowed_domains (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  domain      VARCHAR(255) NOT NULL,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, domain)
);


-- ============================================================
-- TABLE 16: VIDEO PROCESSING JOBS
-- Async queue for two job types:
--
-- Type 1 — initial_resolve (run once on video creation):
--   detect source type → extract playable URL (for Loom/Zoom: server-side
--   page fetch → HLS/MP4 URL extraction) → fetch duration from file header
--   or platform API → generate thumbnail → set analytics_note
--
-- Type 2 — url_refresh (recurring for Loom/Zoom):
--   Re-fetch the share page to get a fresh playable_url before
--   playable_url_expires_at. Loom: every 20h. Zoom: every 4h.
--   If extraction fails: set using_iframe_fallback=TRUE on the video.
-- ============================================================

CREATE TYPE processing_job_type AS ENUM (
  'initial_resolve',  -- First-time URL resolution
  'url_refresh'       -- Periodic refresh for time-limited URLs (Loom, Zoom)
);

CREATE TABLE video_processing_jobs (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  video_id      UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  job_type      processing_job_type NOT NULL DEFAULT 'initial_resolve',
  status        job_status DEFAULT 'pending',
  attempts      SMALLINT DEFAULT 0,
  max_attempts  SMALLINT DEFAULT 3,
  last_error    TEXT,
  started_at    TIMESTAMPTZ,
  completed_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- TABLE 17: WEBHOOK LOGS
-- Full audit log of every incoming webhook POST.
-- Kept for debugging failed account creations.
-- ============================================================

CREATE TABLE webhook_logs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  endpoint        VARCHAR(255) NOT NULL,
  raw_payload     JSONB,
  secret_valid    BOOLEAN,
  http_status     INTEGER,                    -- Our response status code
  processed       BOOLEAN DEFAULT FALSE,
  result_user_id  UUID REFERENCES users(id),  -- Set if account was created
  error_message   TEXT,
  ip_address      INET,
  received_at     TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- TABLE 18: ADMIN IMPERSONATION SESSIONS
-- Tracks every time admin logs in as a subscriber.
-- Session token is injected into the admin's JWT as a claim.
-- ============================================================

CREATE TABLE admin_impersonation_sessions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_user_id   UUID NOT NULL REFERENCES users(id),
  target_user_id  UUID NOT NULL REFERENCES users(id),
  session_token   VARCHAR(128) UNIQUE NOT NULL
                    DEFAULT encode(gen_random_bytes(32), 'hex'),
  started_at      TIMESTAMPTZ DEFAULT NOW(),
  ended_at        TIMESTAMPTZ,
  admin_ip        INET
);


-- ============================================================
-- TABLE 19: HELP DOC SECTIONS
-- Top-level categories in the help centre.
-- Displayed in sidebar order (position ASC).
-- ============================================================

CREATE TABLE help_doc_sections (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title        VARCHAR(255) NOT NULL,
  slug         VARCHAR(255) UNIQUE NOT NULL,   -- URL slug e.g. "getting-started"
  description  TEXT,
  icon         VARCHAR(100),                   -- Icon name / CSS class
  position     INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- TABLE 20: HELP DOC PAGES
-- Nested pages within sections.
-- parent_page_id allows 2-level nesting (section → page → sub-page).
-- Admin can embed video tutorials via tutorial_video_url.
-- ============================================================

CREATE TABLE help_doc_pages (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  section_id            UUID REFERENCES help_doc_sections(id) ON DELETE SET NULL,
  parent_page_id        UUID REFERENCES help_doc_pages(id) ON DELETE SET NULL,
  title                 VARCHAR(500) NOT NULL,
  slug                  VARCHAR(500) UNIQUE NOT NULL,

  -- Rich-text / Markdown content (admin edits via WYSIWYG in admin panel)
  content               TEXT,

  -- Video tutorial placeholder
  tutorial_video_url    TEXT,
  tutorial_video_type   VARCHAR(50),
  -- Values: 'youtube' | 'vidapulse' | 'loom' | 'vimeo' | 'other'

  position              INTEGER DEFAULT 0,
  is_published          BOOLEAN DEFAULT TRUE,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- TABLE 21: FUNNELS  (Pro feature — "Conversion tracking")
-- A funnel is a sequence of milestones inside a video.
-- E.g. "Watched 30% → Clicked CTA → Submitted Email"
-- ============================================================

CREATE TABLE funnels (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  video_id    UUID REFERENCES videos(id) ON DELETE CASCADE, -- NULL = applies to all user videos
  name        VARCHAR(255) NOT NULL,
  description TEXT,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE 22: FUNNEL STEPS
-- Ordered milestones within a funnel.
-- ============================================================

CREATE TYPE funnel_trigger_type AS ENUM (
  'time_reached',    -- Viewer watched up to a given second
  'percent_reached', -- Viewer watched X% of the video
  'cta_click',       -- Viewer clicked a CTA overlay button
  'form_submit',     -- Viewer submitted an email capture form
  'video_ended'      -- Viewer reached the end
);

CREATE TABLE funnel_steps (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  funnel_id        UUID NOT NULL REFERENCES funnels(id) ON DELETE CASCADE,
  name             VARCHAR(255) NOT NULL,    -- e.g. "Watched 30%", "Clicked Buy Now"
  trigger_type     funnel_trigger_type NOT NULL,
  trigger_value    JSONB,
  -- time_reached:    {"seconds": 120}
  -- percent_reached: {"percent": 30}
  -- cta_click:       {"cta_id": "uuid"}
  -- form_submit:     {"form_id": "uuid"}
  position         SMALLINT NOT NULL,        -- Step order (1-based)
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE 23: CONVERSION EVENTS
-- Recorded each time a viewer completes a funnel step.
-- Powers the funnel drop-off chart.
-- ============================================================

CREATE TABLE conversion_events (
  id            BIGSERIAL PRIMARY KEY,
  funnel_id     UUID NOT NULL REFERENCES funnels(id) ON DELETE CASCADE,
  step_id       UUID NOT NULL REFERENCES funnel_steps(id) ON DELETE CASCADE,
  session_id    UUID NOT NULL REFERENCES analytics_sessions(id) ON DELETE CASCADE,
  viewer_id     UUID NOT NULL REFERENCES viewers(id),
  video_id      UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  video_position DECIMAL(10,2),             -- Video timestamp when triggered
  occurred_at   TIMESTAMPTZ DEFAULT NOW(),
  metadata      JSONB DEFAULT '{}'
);

-- ============================================================
-- TABLE 24: CTA OVERLAYS  (in-player call-to-action buttons)
-- Shown at a specific time in the video.
-- Click events are captured as conversion_events (cta_click).
-- ============================================================

CREATE TABLE cta_overlays (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  video_id        UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  label           VARCHAR(255) NOT NULL,     -- Button text, e.g. "Buy Now"
  url             TEXT NOT NULL,             -- Where clicking takes the viewer
  show_at_second  DECIMAL(10,2) NOT NULL,    -- Show at this timestamp
  hide_at_second  DECIMAL(10,2),             -- Hide at this timestamp (NULL = show till end)
  style           JSONB DEFAULT '{}',        -- bg_color, text_color, position
  is_active       BOOLEAN DEFAULT TRUE,
  click_count     INTEGER DEFAULT 0,         -- Denormalized counter
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE 25: ALERTS
-- User-defined threshold alerts. Notified via email.
-- E.g. "Alert me when play rate drops below 50%"
-- ============================================================

CREATE TYPE alert_metric AS ENUM (
  'play_rate',
  'unique_viewers',
  'total_plays',
  'avg_watch_pct',
  'drop_off_pct',
  'new_viewer_daily'
);

CREATE TYPE alert_operator AS ENUM ('gt', 'lt', 'gte', 'lte', 'eq');

CREATE TABLE alerts (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  video_id              UUID REFERENCES videos(id) ON DELETE CASCADE, -- NULL = all videos
  name                  VARCHAR(255) NOT NULL,
  metric                alert_metric NOT NULL,
  operator              alert_operator NOT NULL,
  threshold             DECIMAL(12,4) NOT NULL,
  notify_email          BOOLEAN DEFAULT TRUE,
  is_active             BOOLEAN DEFAULT TRUE,
  last_triggered_at     TIMESTAMPTZ,
  last_triggered_value  DECIMAL(12,4),
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE 26: ALERT NOTIFICATIONS (log of sent alerts)
-- ============================================================

CREATE TABLE alert_notifications (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alert_id        UUID NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,
  triggered_value DECIMAL(12,4) NOT NULL,   -- The actual metric value that triggered it
  channels_used   JSONB DEFAULT '["email"]',
  sent_at         TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE 27: REPORTS (saved report configurations — Pro)
-- ============================================================

CREATE TYPE report_type AS ENUM (
  'video_summary',       -- One video, all metrics
  'audience_overview',   -- All viewers for a video or account
  'geographic_breakdown',
  'device_breakdown',
  'funnel_report',
  'custom'
);

CREATE TABLE reports (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name             VARCHAR(255) NOT NULL,
  report_type      report_type NOT NULL,
  config           JSONB NOT NULL DEFAULT '{}',
  -- config holds filters: date_from, date_to, video_ids[], metrics[]
  last_run_at      TIMESTAMPTZ,
  last_result_url  TEXT,    -- URL to last exported CSV/PDF (stored in Railway volume)
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- ANALYTICS CAPABILITIES BY SOURCE TYPE
-- Stored as reference — analytics_note on each video is
-- auto-populated from this matrix during URL resolution.
--
-- KEY APPROACH FOR LOOM & ZOOM:
--   Both share links are publicly accessible without auth.
--   Our server-side URL resolver fetches the share page,
--   extracts the underlying HLS/MP4 URL, stores it as
--   playable_url, and loads it in our own custom HTML5 player
--   → full analytics identical to mp4_direct / hls_stream.
--
--   Time-limited URLs are auto-refreshed by the processing
--   worker before playable_url_expires_at is reached.
-- ============================================================
/*
SOURCE TYPE    | HEATMAP           | SEEK  | EXACT POS | DURATION   | NOTES
---------------|-------------------|-------|-----------|------------|-------------------------------------------
mp4_direct     | FULL              | FULL  | FULL      | Auto       | All HTML5 video events. Includes .mov, H.264, .webm
hls_stream     | FULL              | FULL  | FULL      | Auto       | Full analytics + adaptive quality change events
google_drive   | FULL              | FULL  | FULL      | Auto       | Must be "anyone with link" public. Converted to stream URL.
dropbox        | FULL              | FULL  | FULL      | Auto       | dl=1 direct stream URL extracted
onedrive       | FULL              | FULL  | FULL      | Auto       | Direct embed URL extracted
amazon_s3      | FULL              | FULL  | FULL      | Auto       | Public object or pre-signed URL loaded directly
azure_blob     | FULL              | FULL  | FULL      | Auto       | Public blob or SAS token URL loaded directly
youtube        | APPROX ~95%       | FULL  | FULL      | Via API    | YouTube IFrame API + getCurrentTime() polled every 1s.
               |                   |       |           |            | Heatmap built from 1-sec samples. All other events exact.
               |                   |       |           |            | Custom player skin NOT available (YouTube iframe renders theirs).
loom           | FULL*             | FULL* | FULL*     | Auto*      | * Server extracts HLS URL from Loom share page.
               |                   |       |           |            | Loaded in our custom player = full analytics.
               |                   |       |           |            | playable_url_expires_at ~24h; auto-refreshed daily.
               |                   |       |           |            | Fallback: if extraction fails → iframe embed, impression only.
               |                   |       |           |            | using_iframe_fallback=TRUE + analytics_note updated on fallback.
zoom           | FULL*             | FULL* | FULL*     | Auto*      | * Server extracts MP4/HLS from Zoom recording share page.
               |                   |       |           |            | Password-in-URL links are publicly accessible without auth.
               |                   |       |           |            | playable_url_expires_at ~6-12h; auto-refreshed every 4h.
               |                   |       |           |            | Fallback: if extraction fails → iframe embed, impression only.
               |                   |       |           |            | using_iframe_fallback=TRUE + analytics_note updated on fallback.
vimeo          | NEAR-FULL ~250ms  | FULL  | FULL      | Via API    | Vimeo Player.js timeupdate fires ~4x/sec. Near-full heatmap.
other          | PARTIAL           | TRY   | TRY       | Manual     | Best-effort HTML5 <video> events if browser can play it.
*/


-- ============================================================
-- INDEXES
-- ============================================================

-- users
CREATE INDEX idx_users_email           ON users(email);
CREATE INDEX idx_users_plan_id         ON users(plan_id);
CREATE INDEX idx_users_plan_expires    ON users(plan_expires_at)
  WHERE plan_expires_at IS NOT NULL;
CREATE INDEX idx_users_role            ON users(role);

-- videos (most queries filter by user_id first)
CREATE INDEX idx_videos_user_id        ON videos(user_id);
CREATE INDEX idx_videos_source_type    ON videos(source_type);
CREATE INDEX idx_videos_active         ON videos(user_id, is_active, is_archived);

-- embed_configs — hot path (hit on every page load with embedded player)
CREATE INDEX idx_embed_token           ON embed_configs(embed_token);

-- viewers
CREATE INDEX idx_viewers_cookie_id     ON viewers(cookie_id);
CREATE INDEX idx_viewers_fingerprint   ON viewers(fingerprint_hash)
  WHERE fingerprint_hash IS NOT NULL;
CREATE INDEX idx_viewers_email         ON viewers(email) WHERE email IS NOT NULL;

-- analytics_sessions
CREATE INDEX idx_sessions_video_id     ON analytics_sessions(video_id);
CREATE INDEX idx_sessions_viewer_id    ON analytics_sessions(viewer_id);
CREATE INDEX idx_sessions_started_at   ON analytics_sessions(video_id, started_at DESC);
CREATE INDEX idx_sessions_domain       ON analytics_sessions(domain);
CREATE INDEX idx_sessions_country      ON analytics_sessions(country_code);
CREATE INDEX idx_sessions_utm_source   ON analytics_sessions(utm_source)
  WHERE utm_source IS NOT NULL;

-- analytics_events — high-volume; filter by session or video first
CREATE INDEX idx_events_session_id     ON analytics_events(session_id);
CREATE INDEX idx_events_video_id       ON analytics_events(video_id, event_type);
CREATE INDEX idx_events_occurred_at    ON analytics_events(occurred_at);

-- analytics_watch_intervals
CREATE INDEX idx_intervals_session_id  ON analytics_watch_intervals(session_id);
CREATE INDEX idx_intervals_video_id    ON analytics_watch_intervals(video_id);

-- analytics_daily_stats
CREATE INDEX idx_daily_stats_video_date ON analytics_daily_stats(video_id, stat_date DESC);

-- auth_tokens
CREATE INDEX idx_auth_tokens_token     ON auth_tokens(token);
CREATE INDEX idx_auth_tokens_user      ON auth_tokens(user_id);
CREATE INDEX idx_auth_tokens_expires   ON auth_tokens(expires_at)
  WHERE used_at IS NULL;

-- video_processing_jobs
CREATE INDEX idx_jobs_status           ON video_processing_jobs(status)
  WHERE status IN ('pending','processing');

-- help docs
CREATE INDEX idx_help_pages_section    ON help_doc_pages(section_id);
CREATE INDEX idx_help_pages_parent     ON help_doc_pages(parent_page_id)
  WHERE parent_page_id IS NOT NULL;

-- playlists
CREATE INDEX idx_playlist_videos_pl    ON playlist_videos(playlist_id, position);

-- webhook logs
CREATE INDEX idx_webhook_received_at   ON webhook_logs(received_at DESC);

-- funnels & conversions
CREATE INDEX idx_funnels_user_id       ON funnels(user_id);
CREATE INDEX idx_funnels_video_id      ON funnels(video_id) WHERE video_id IS NOT NULL;
CREATE INDEX idx_funnel_steps_funnel   ON funnel_steps(funnel_id, position);
CREATE INDEX idx_conversions_funnel    ON conversion_events(funnel_id, step_id);
CREATE INDEX idx_conversions_viewer    ON conversion_events(viewer_id);
CREATE INDEX idx_conversions_video     ON conversion_events(video_id, occurred_at DESC);

-- cta overlays
CREATE INDEX idx_cta_video_id          ON cta_overlays(video_id) WHERE is_active = TRUE;

-- alerts
CREATE INDEX idx_alerts_user_id        ON alerts(user_id);
CREATE INDEX idx_alerts_video_id       ON alerts(video_id) WHERE video_id IS NOT NULL;
CREATE INDEX idx_alerts_active         ON alerts(is_active) WHERE is_active = TRUE;

-- reports
CREATE INDEX idx_reports_user_id       ON reports(user_id);


-- ============================================================
-- ADMIN SEED
-- ganganarayan.rns@gmail.com gets role='admin' and
-- plan='admin_lifetime' with no expiry.
-- Password is set via the normal set-password email flow.
-- ============================================================

INSERT INTO users (email, name, role, plan_id, plan_expires_at, created_via, password_set)
SELECT
  'ganganarayan.rns@gmail.com',
  'Ganga Narayan Das',
  'admin',
  p.id,
  NULL,   -- never expires
  'admin_manual',
  FALSE   -- will be set via email link on first login
FROM plans p
WHERE p.name = 'admin_lifetime';

INSERT INTO user_preferences (user_id)
SELECT id FROM users WHERE email = 'ganganarayan.rns@gmail.com';
