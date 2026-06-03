'use strict';

const geoip = require('geoip-lite');

// ── Country ISO-2 → display name (top 60 codes) ──────────────────────────
const ISO_NAMES = {
  AF:'Afghanistan',AL:'Albania',DZ:'Algeria',AR:'Argentina',AU:'Australia',
  AT:'Austria',BD:'Bangladesh',BE:'Belgium',BR:'Brazil',CA:'Canada',
  CL:'Chile',CN:'China',CO:'Colombia',HR:'Croatia',CZ:'Czechia',
  DK:'Denmark',EG:'Egypt',FI:'Finland',FR:'France',DE:'Germany',
  GH:'Ghana',GR:'Greece',HK:'Hong Kong',HU:'Hungary',IN:'India',
  ID:'Indonesia',IQ:'Iraq',IE:'Ireland',IL:'Israel',IT:'Italy',
  JP:'Japan',JO:'Jordan',KE:'Kenya',KR:'South Korea',KW:'Kuwait',
  MY:'Malaysia',MX:'Mexico',MA:'Morocco',NL:'Netherlands',NZ:'New Zealand',
  NG:'Nigeria',NO:'Norway',PK:'Pakistan',PE:'Peru',PH:'Philippines',
  PL:'Poland',PT:'Portugal',QA:'Qatar',RO:'Romania',RU:'Russia',
  SA:'Saudi Arabia',SG:'Singapore',ZA:'South Africa',ES:'Spain',
  SE:'Sweden',CH:'Switzerland',TW:'Taiwan',TH:'Thailand',TR:'Turkey',
  UA:'Ukraine',AE:'UAE',GB:'United Kingdom',US:'United States',VN:'Vietnam',
};

/** Extract real client IP, handling Cloudflare and reverse proxies */
function getClientIp(req) {
  const cf = req.headers['cf-connecting-ip'];
  if (cf) return cf.trim();
  const xff = req.headers['x-forwarded-for'];
  if (xff) return xff.split(',')[0].trim();
  return req.ip || null;
}

const crypto = require('crypto');

const CTA_VID_COOKIE = 'vp_cta_vid';
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Read a single cookie value from the raw Cookie header (no cookie-parser dep). */
function readCookie(req, name) {
  const raw = req.headers.cookie;
  if (!raw) return null;
  for (const part of raw.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    if (part.slice(0, idx).trim() === name) {
      return decodeURIComponent(part.slice(idx + 1).trim());
    }
  }
  return null;
}

/**
 * Resolve a stable, first-party CTA viewer id for this browser.
 * Reads the vp_cta_vid cookie; mints a new UUID + sets the cookie on the
 * response when absent. Independent of the video player's viewer id.
 * Returns the id (caller stores it on the click event).
 */
function resolveCtaViewerId(req, res) {
  let id = readCookie(req, CTA_VID_COOKIE);
  if (!id || !UUID_RE.test(id)) {
    id = crypto.randomUUID();
    res.cookie(CTA_VID_COOKIE, id, {
      maxAge  : 1000 * 60 * 60 * 24 * 365 * 2, // 2 years
      httpOnly: true,
      secure  : true,
      sameSite: 'lax', // sent on top-level navigation (the click)
      path    : '/',
    });
  }
  return id;
}

/** Parse browser name from a User-Agent string */
function parseBrowser(ua) {
  if (!ua) return null;
  if (/Edg\//.test(ua))                            return 'Edge';
  if (/OPR\/|OPR\s|Opera/.test(ua))                return 'Opera';
  if (/SamsungBrowser/.test(ua))                   return 'Samsung';
  if (/YaBrowser/.test(ua))                        return 'Yandex';
  if (/UCBrowser/.test(ua))                        return 'UC Browser';
  if (/CriOS/.test(ua))                            return 'Chrome';  // Chrome iOS
  if (/FxiOS/.test(ua))                            return 'Firefox'; // Firefox iOS
  if (/Chrome\//.test(ua))                         return 'Chrome';
  if (/Firefox\//.test(ua))                        return 'Firefox';
  if (/Safari\//.test(ua) && /Version\//.test(ua)) return 'Safari';
  return 'Other';
}

/** Parse OS name from a User-Agent string */
function parseOS(ua) {
  if (!ua) return null;
  // iOS must come before macOS — iPad UA contains "Mac OS X" too on iPadOS 13+
  if (/iPhone|iPod/.test(ua))                    return 'iOS';
  if (/iPad/.test(ua))                           return 'iPadOS';
  // iPadOS 13+ reports as desktop Safari (no "iPad" in UA) — detect via macOS + touch
  // We can't detect touch server-side, so fall through to macOS for those cases
  if (/Android/.test(ua))                        return 'Android';
  if (/Windows NT/.test(ua))                     return 'Windows';
  if (/CrOS/.test(ua))                           return 'ChromeOS';
  if (/Mac OS X|Macintosh/.test(ua))             return 'macOS';
  if (/Linux/.test(ua))                          return 'Linux';
  return null;
}

/** Look up geo data from an IP address (handles IPv4-mapped IPv6) */
function lookupCountry(ip) {
  if (!ip) return { code: null, name: null, city: null, region: null, timezone: null, lat: null, lng: null };
  const ipv4 = ip.replace(/^::ffff:/i, '');
  try {
    const geo = geoip.lookup(ipv4);
    if (!geo?.country) return { code: null, name: null, city: null, region: null, timezone: null, lat: null, lng: null };
    return {
      code    : geo.country,
      name    : ISO_NAMES[geo.country] || geo.country,
      city    : geo.city     || null,
      region  : geo.region   || null,
      timezone: geo.timezone || null,
      lat     : geo.ll?.[0]  ?? null,
      lng     : geo.ll?.[1]  ?? null,
    };
  } catch {
    return { code: null, name: null, city: null, region: null, timezone: null, lat: null, lng: null };
  }
}

// ── UTM forwarding for CTA redirect links ────────────────────────────────
// When a CTA tracking link is clicked WITH utm_* query params (typically
// forwarded from a landing page), carry those params through to the
// destination URL so downstream pages/funnels keep the campaign attribution.
//
// Safety: this is a no-op unless utm_* params are actually present, and it
// only ADDS keys the destination doesn't already define (never overwrites the
// owner's own UTMs). If the destination isn't a parseable absolute URL it is
// returned unchanged — the redirect must never break because of this.
const UTM_PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];

// Params carried through the CTA redirect onto the destination. utm_* keep
// campaign attribution; `email` lets the landing opt-in / Thank-You button /
// registration email prefill the register form (e.g. /register?email=lead@x.com).
const FORWARD_PARAMS = [...UTM_PARAMS, 'email'];

function mergeUtmIntoUrl(destUrl, query) {
  if (!destUrl || !query) return destUrl;
  if (!FORWARD_PARAMS.some(k => typeof query[k] === 'string' && query[k])) return destUrl; // nothing to forward
  try {
    const u = new URL(destUrl);
    for (const k of FORWARD_PARAMS) {
      const v = query[k];
      if (typeof v === 'string' && v && !u.searchParams.has(k)) {
        u.searchParams.set(k, v.slice(0, 300));
      }
    }
    return u.toString();
  } catch {
    return destUrl; // relative/invalid URL — leave as-is
  }
}

// Extract a clean { utm_* } object from a query for analytics metadata.
function pickUtm(query) {
  const out = {};
  for (const k of UTM_PARAMS) {
    const v = query?.[k];
    out[k] = (typeof v === 'string' && v) ? v.slice(0, 300) : null;
  }
  return out;
}

/**
 * Analytics Ingestion API — public, no authentication
 *
 * Used by the VidaPulse embed tracker script that site owners paste into
 * their pages. Identified by video_id + viewer cookie (client UUID).
 *
 * Endpoints:
 *   POST /api/analytics/session  — Create a session when the player loads
 *   POST /api/analytics/ping     — Heartbeat: flush progress + heatmap data
 *
 * Design principles:
 *   - Zero auth (analytics data is not confidential; anyone can watch a video)
 *   - Respond first, do DB work after (sendBeacon from page unload)
 *   - Batch heatmap upserts (single query via UNNEST, not N queries)
 *   - All errors logged, never leaked to the tracker
 *   - CORS * (tracker runs on third-party pages)
 */

const express = require('express');
const router  = express.Router();

const { pool }      = require('../config/database');
const logger        = require('../config/logger');
const { emitEvent } = require('../services/behavioralEventService');

// ── CORS: tracker runs on any third-party domain ─────────────────────────
router.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin',  '*');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// ── Body parsing: accept both application/json AND text/plain ─────────────
// navigator.sendBeacon() can send text/plain in some environments;
// parse it as JSON so req.body is always a plain object.
router.use(express.text({ type: 'text/plain', limit: '64kb' }));
router.use((req, res, next) => {
  if (typeof req.body === 'string' && req.body.trim().startsWith('{')) {
    try { req.body = JSON.parse(req.body); } catch (_) {}
  }
  next();
});

// ── In-memory rate limiters ───────────────────────────────────────────────
// /session: max 20 new sessions per IP per minute (blocks fake-viewer inflation)
// /ping:    max 30 pings per session_id per minute (blocks replay/loop abuse)
//
// Using Maps avoids the express-rate-limit dependency; both are pruned every
// 10 minutes so memory stays bounded.

const _sessionLimiter = new Map(); // ip     -> { count, resetAt }
const _pingLimiter    = new Map(); // sessId -> { count, resetAt }
const SESSION_WINDOW_MS = 60_000;
const SESSION_MAX       = 20;
const PING_WINDOW_MS    = 60_000;
const PING_MAX          = 30;

function _checkSessionRate(ip) {
  return _checkRate(_sessionLimiter, ip, SESSION_MAX, SESSION_WINDOW_MS);
}
function _checkPingRate(sessionId) {
  return _checkRate(_pingLimiter, sessionId, PING_MAX, PING_WINDOW_MS);
}
function _checkRate(map, key, max, windowMs) {
  const now   = Date.now();
  const entry = map.get(key);
  if (!entry || entry.resetAt <= now) {
    map.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= max) return false;
  entry.count++;
  return true;
}

// Prune stale entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of _sessionLimiter) if (v.resetAt <= now) _sessionLimiter.delete(k);
  for (const [k, v] of _pingLimiter)    if (v.resetAt <= now) _pingLimiter.delete(k);
}, 10 * 60_000).unref();

// ─────────────────────────────────────────────────────────────────────────
// POST /api/analytics/session
//
// Called once when the player loads. Creates a viewer row (find-or-create
// by cookie_id) and a fresh analytics_session row.
//
// Body (all optional except video_id + viewer_cookie):
//   video_id       UUID    — the video being watched            [required]
//   viewer_cookie  string  — client-generated UUID in localStorage [required]
//   page_url       string  — full URL of the embedding page
//   referrer       string  — document.referrer
//   utm_source, utm_medium, utm_campaign, utm_term, utm_content
//   device_type    string  — 'desktop'|'tablet'|'mobile'|'unknown'
//   browser        string  — browser name
//   os             string  — OS name
//   screen_width   number
//   screen_height  number
//   user_agent     string
//
// Response: { session_id: UUID }
// ─────────────────────────────────────────────────────────────────────────

router.post('/session', async (req, res) => {
  const {
    video_id,
    viewer_cookie,
    page_url      = null,
    referrer      = null,
    utm_source    = null,
    utm_medium    = null,
    utm_campaign  = null,
    utm_term      = null,
    utm_content   = null,
    device_type   = 'unknown',
    browser       = null,
    os            = null,
    screen_width  = null,
    screen_height = null,
    user_agent    = null,
  } = req.body ?? {};

  if (!video_id || typeof video_id !== 'string') {
    return res.status(400).json({ error: 'video_id required' });
  }
  if (!viewer_cookie || typeof viewer_cookie !== 'string') {
    return res.status(400).json({ error: 'viewer_cookie required' });
  }

  // Sanitise cookie: alphanumeric + hyphens only, max 128 chars
  const cleanCookie = viewer_cookie.replace(/[^a-zA-Z0-9\-_]/g, '').slice(0, 128);
  if (cleanCookie.length < 4) {
    return res.status(400).json({ error: 'invalid viewer_cookie' });
  }

  // Rate limit by IP — prevents fake-viewer inflation via mass session creation
  const clientIp = req.ip || 'unknown';
  if (!_checkSessionRate(clientIp)) {
    logger.warn(`[analytics/session] rate limit hit from IP ${clientIp}`);
    return res.status(429).json({ error: 'too_many_requests' });
  }

  try {
    // Verify the video exists, is active, AND its owner is active. A deactivated
    // owner's videos are frozen — no new analytics are recorded until restored.
    const { rows: [video] } = await pool.query(
      `SELECT v.id
       FROM   videos v
       JOIN   users  u ON u.id = v.user_id
       WHERE  v.id = $1 AND v.is_active = TRUE AND u.is_active = TRUE`,
      [video_id]
    );
    if (!video) return res.status(404).json({ error: 'video_not_found' });

    // Extract hostname from page_url
    let domain = null;
    try { domain = new URL(page_url).hostname; } catch { /* ignore */ }

    // Find-or-create viewer by cookie_id
    const { rows: [viewer] } = await pool.query(
      `INSERT INTO viewers
         (cookie_id, first_ip, first_user_agent, first_seen_at, last_seen_at)
       VALUES ($1, $2::inet, $3, NOW(), NOW())
       ON CONFLICT (cookie_id) DO UPDATE
         SET last_seen_at   = NOW(),
             total_sessions = viewers.total_sessions + 1
       RETURNING id`,
      [
        cleanCookie,
        req.ip        || null,
        user_agent    ? user_agent.slice(0, 500) : null,
      ]
    );

    // Validate device_type against DB ENUM values
    const VALID_DEVICE = new Set(['desktop', 'tablet', 'mobile', 'tv', 'unknown']);
    const safeDevice   = VALID_DEVICE.has(device_type) ? device_type : 'unknown';

    // Auto-detect browser and OS from User-Agent if not provided by the client
    const detectedBrowser = (browser && browser.trim()) || parseBrowser(user_agent);
    const detectedOS      = (os      && os.trim())      || parseOS(user_agent);

    // Geo-IP lookup from the real client IP (handles Cloudflare proxying)
    const realIp = getClientIp(req);
    const geo    = lookupCountry(realIp);

    // Create a fresh analytics session
    const { rows: [session] } = await pool.query(
      `INSERT INTO analytics_sessions
         (video_id, viewer_id,
          page_url, domain, referrer_url,
          utm_source, utm_medium, utm_campaign, utm_term, utm_content,
          device_type, browser, os,
          screen_width, screen_height,
          user_agent, ip_address,
          country_code, country_name, city, region, timezone,
          latitude, longitude,
          started_at)
       VALUES
         ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17::inet,
          $18,$19,$20,$21,$22,$23,$24,NOW())
       RETURNING id`,
      [
        video_id,
        viewer.id,
        page_url   ? page_url.slice(0, 2000)   : null,
        domain,
        referrer   ? referrer.slice(0, 2000)   : null,
        utm_source   ? utm_source.slice(0, 255)   : null,
        utm_medium   ? utm_medium.slice(0, 255)   : null,
        utm_campaign ? utm_campaign.slice(0, 255) : null,
        utm_term     ? utm_term.slice(0, 255)     : null,
        utm_content  ? utm_content.slice(0, 255)  : null,
        safeDevice,
        detectedBrowser ? detectedBrowser.slice(0, 100) : null,
        detectedOS      ? detectedOS.slice(0, 100)      : null,
        screen_width  !== null ? (parseInt(screen_width,  10) || null) : null,
        screen_height !== null ? (parseInt(screen_height, 10) || null) : null,
        user_agent   ? user_agent.slice(0, 500)   : null,
        realIp       || null,
        geo.code     || null,
        geo.name     || null,
        geo.city     || null,
        geo.region   || null,
        geo.timezone || null,
        geo.lat      ?? null,
        geo.lng      ?? null,
      ]
    );

    res.json({ session_id: session.id });

    // Fire-and-forget: record player_load event in analytics_events
    pool.query(
      `INSERT INTO analytics_events (session_id, video_id, event_type, occurred_at)
       VALUES ($1, $2, 'player_load', NOW())`,
      [session.id, video_id]
    ).catch(err => logger.warn(`[analytics/session] player_load insert failed: ${err.message}`));

  } catch (err) {
    logger.error(`[analytics/session] ${err.message}`, { video_id });
    return res.status(500).json({ error: 'internal_error' });
  }
});

// ─────────────────────────────────────────────────────────────────────────
// POST /api/analytics/ping
//
// Heartbeat sent:
//   - on 'play' event (first play starts stats)
//   - every ~10 s while playing (progress updates)
//   - on 'pause', 'seek', 'end' events
//   - on page unload via navigator.sendBeacon
//
// Body:
//   session_id     UUID    — returned by /session             [required]
//   video_id       UUID    — cross-reference (prevents injection) [required]
//   event          string  — 'play'|'pause'|'seek'|'heartbeat'|'end'
//   max_pct        number  — highest % reached in this session (0–100)
//   watch_seconds  number  — cumulative seconds watched
//   intervals      Array   — [[startSec, endSec, watchPass?], ...]
//                            watchPass 1 = first watch, 2+ = replay
//
// Response: { ok: true }  (always, even on error — tracker must not crash)
// ─────────────────────────────────────────────────────────────────────────

router.post('/ping', async (req, res) => {
  const {
    session_id,
    video_id,
    event            = 'heartbeat',
    max_pct          = 0,
    watch_seconds    = 0,
    intervals        = [],
    duration_seconds,
    position,        // optional: current playback position in seconds
  } = req.body ?? {};

  // Always respond 200 so sendBeacon doesn't log errors in the browser
  res.json({ ok: true });

  // Diagnostic log — shows every ping and whether it has valid IDs
  logger.info(`[analytics/ping] event=${event} sid=${session_id ? session_id.slice(0,8) : 'MISSING'} vid=${video_id ? video_id.slice(0,8) : 'MISSING'} max_pct=${max_pct} secs=${watch_seconds}`);

  if (!session_id || !video_id) {
    logger.warn(`[analytics/ping] dropped — missing session_id or video_id. body=${JSON.stringify(req.body).slice(0, 200)}`);
    return;
  }

  // Rate limit per session_id — blocks replay attacks and tracker loops
  if (!_checkPingRate(session_id)) {
    logger.warn(`[analytics/ping] rate limit hit for session ${session_id}`);
    return;
  }

  // All work is async — response already sent
  try {
    // Validate session + fetch context needed for aggregation.
    // NOTE: play_count is intentionally NOT fetched here. It is read back
    // atomically from the session UPDATE below to prevent the race condition
    // where two concurrent play events both see play_count=0 and both
    // increment total_plays.
    const { rows: [ctx] } = await pool.query(
      `SELECT s.id,
              v.user_id         AS video_owner_id,
              v.duration_seconds
       FROM   analytics_sessions s
       JOIN   videos v ON v.id = s.video_id
       WHERE  s.id       = $1
         AND  s.video_id = $2`,
      [session_id, video_id]
    );
    if (!ctx) {
      logger.warn(`[analytics/ping] session not found or video mismatch — sid=${session_id.slice(0,8)} vid=${video_id.slice(0,8)}`);
      return;
    }

    // ── 0. Save video duration if the player reports it and we don't have it ─
    // The embed player sends duration_seconds on every ping once loadedmetadata
    // fires. We only write it once (WHERE duration_seconds IS NULL) so a stale
    // client value can't overwrite a correct one set later.
    const safeDuration = duration_seconds ? parseFloat(duration_seconds) : 0;
    if (safeDuration > 0 && !ctx.duration_seconds) {
      pool.query(
        `UPDATE videos SET duration_seconds = $1, updated_at = NOW()
         WHERE id = $2 AND duration_seconds IS NULL`,
        [safeDuration, video_id]
      ).catch(err => logger.warn(`[analytics/ping] failed to save duration_seconds: ${err.message}`));
    }

    const isPlay  = event === 'play';
    const isEnd   = event === 'end';
    const isPause = event === 'pause';
    const isSeek  = event === 'seek' || event === 'seeked';

    const safeMax     = Math.min(Math.max(parseFloat(max_pct)    || 0, 0), 100);
    const safeWatched = Math.max(parseFloat(watch_seconds)       || 0, 0);

    // avg_watch_pct: use watch_seconds / duration for accuracy.
    // Falls back to max_pct when duration is unknown (e.g. live streams).
    const safeAvgPct = ctx.duration_seconds && parseFloat(ctx.duration_seconds) > 0
      ? Math.min(safeWatched / parseFloat(ctx.duration_seconds) * 100, 100)
      : safeMax;

    // ── 1. Atomically update session + detect first play ────────────────────
    //
    // RETURNING play_count gives us the post-increment value. Only the request
    // that atomically moves play_count from 0 → 1 will see play_count = 1.
    // Any concurrent play event arriving in the same millisecond will see
    // play_count = 2 (or higher) and correctly skip the total_plays increment.
    const { rows: [updated] } = await pool.query(
      `UPDATE analytics_sessions SET
         max_watch_pct       = GREATEST(max_watch_pct, $1),
         total_watch_seconds = GREATEST(total_watch_seconds, $2),
         avg_watch_pct       = GREATEST(avg_watch_pct, $3),
         play_count          = play_count  + $4::int,
         pause_count         = pause_count + $5::int,
         seek_count          = seek_count  + $6::int,
         reached_end         = reached_end OR $7,
         ended_at            = CASE WHEN $7 THEN NOW() ELSE ended_at END
       WHERE id = $8
       RETURNING play_count`,
      [safeMax, safeWatched, safeAvgPct,
       isPlay  ? 1 : 0,
       isPause ? 1 : 0,
       isSeek  ? 1 : 0,
       isEnd, session_id]
    );
    if (!updated) return; // session row vanished between queries — drop

    // ── 1b. Record individual event in analytics_events (fire-and-forget) ──
    // Maps ping event names to analytics_event_type ENUM values.
    // 'end' from the embed script maps to 'ended' in the DB.
    const PING_EVENT_MAP = {
      play    : 'play',
      pause   : 'pause',
      seek    : 'seek',
      end     : 'ended',
      ended   : 'ended',
    };
    const dbEventType = PING_EVENT_MAP[event];
    if (dbEventType) {
      const safePosition = position !== null && position !== undefined
        ? (parseFloat(position) || null) : null;
      pool.query(
        `INSERT INTO analytics_events
           (session_id, video_id, event_type, video_position, occurred_at)
         VALUES ($1, $2, $3::analytics_event_type, $4, NOW())`,
        [session_id, video_id, dbEventType, safePosition]
      ).catch(err => logger.warn(`[analytics/ping] event insert failed: ${err.message}`));
    }

    // True only when this specific UPDATE moved play_count from 0 to 1
    const isFirstPlay = isPlay && updated.play_count === 1;

    // ── 2. Batch-upsert heatmap from watch intervals ────────────────────────
    if (Array.isArray(intervals) && intervals.length > 0) {
      const firstBuckets  = [];
      const replayBuckets = [];

      for (const iv of intervals) {
        if (!Array.isArray(iv) || iv.length < 2) continue;
        const start     = Math.max(0, Math.floor(parseFloat(iv[0]) || 0));
        const end       = Math.ceil(parseFloat(iv[1]) || 0);
        const watchPass = iv[2] ?? 1;

        if (end <= start) continue;
        if (end - start > 7200) {
          // Log so we know if a real video is being silently truncated
          logger.warn(`[analytics/ping] interval span ${end - start}s > 7200s — dropping`, { session_id, video_id });
          continue;
        }

        const bucket = watchPass <= 1 ? firstBuckets : replayBuckets;
        for (let sec = start; sec < end; sec++) bucket.push(sec);
      }

      if (firstBuckets.length > 0) {
        await pool.query(
          `INSERT INTO analytics_heatmap_aggregate (video_id, second_bucket, first_watches, replays)
           SELECT $1, unnest($2::int[]), 1, 0
           ON CONFLICT (video_id, second_bucket) DO UPDATE
             SET first_watches = analytics_heatmap_aggregate.first_watches + 1,
                 updated_at    = NOW()`,
          [video_id, firstBuckets]
        );
      }
      if (replayBuckets.length > 0) {
        await pool.query(
          `INSERT INTO analytics_heatmap_aggregate (video_id, second_bucket, first_watches, replays)
           SELECT $1, unnest($2::int[]), 0, 1
           ON CONFLICT (video_id, second_bucket) DO UPDATE
             SET replays    = analytics_heatmap_aggregate.replays + 1,
                 updated_at = NOW()`,
          [video_id, replayBuckets]
        );
      }
    }

    // ── 3. Increment total_plays on first play event in this session ────────
    if (isFirstPlay) {
      await pool.query(
        `UPDATE videos
         SET total_plays = total_plays + 1,
             updated_at  = NOW()
         WHERE id = $1`,
        [video_id]
      );
    }

    // ── 4. Recompute video aggregates atomically on end or first play ────────
    //
    // Single UPDATE with correlated subqueries eliminates the SELECT→UPDATE
    // race where two concurrent requests both query stale data and the second
    // write overwrites the first. PostgreSQL evaluates the subqueries inside
    // the UPDATE as part of the same statement snapshot.
    if (isEnd || isFirstPlay) {
      const { rows: [agg] } = await pool.query(
        `UPDATE videos SET
           unique_viewers = (
             SELECT COUNT(DISTINCT viewer_id)
             FROM   analytics_sessions
             WHERE  video_id = $1
               AND  play_count > 0
           ),
           avg_watch_pct = (
             SELECT COALESCE(AVG(max_watch_pct)::numeric(5,2), 0)
             FROM   analytics_sessions
             WHERE  video_id = $1
               AND  play_count > 0
           ),
           updated_at = NOW()
         WHERE id = $1
         RETURNING unique_viewers, total_plays`,
        [video_id]
      );

      // ── 5. Upsert today's daily stats ────────────────────────────────────
      //
      // Computes all daily metrics for today in a single query and upserts.
      // play_rate = sessions_with_plays / total_sessions × 100
      // (every session = one player load, so total_sessions = total_player_loads)
      await pool.query(
        `INSERT INTO analytics_daily_stats
           (video_id, stat_date,
            total_plays, unique_viewers, total_watch_seconds,
            avg_watch_pct, completed_views, play_rate)
         SELECT
           $1,
           CURRENT_DATE,
           SUM(CASE WHEN play_count > 0 THEN 1 ELSE 0 END),
           COUNT(DISTINCT viewer_id) FILTER (WHERE play_count > 0),
           COALESCE(SUM(total_watch_seconds) FILTER (WHERE play_count > 0), 0)::BIGINT,
           COALESCE(AVG(max_watch_pct) FILTER (WHERE play_count > 0)::numeric(5,2), 0),
           SUM(CASE WHEN reached_end AND play_count > 0 THEN 1 ELSE 0 END),
           CASE WHEN COUNT(*) > 0
             THEN ROUND(
               SUM(CASE WHEN play_count > 0 THEN 1.0 ELSE 0 END)
               / COUNT(*) * 100, 2)
             ELSE 0
           END
         FROM analytics_sessions
         WHERE video_id   = $1
           AND started_at >= CURRENT_DATE
           AND started_at <  CURRENT_DATE + INTERVAL '1 day'
         ON CONFLICT (video_id, stat_date) DO UPDATE SET
           total_plays         = EXCLUDED.total_plays,
           unique_viewers      = EXCLUDED.unique_viewers,
           total_watch_seconds = EXCLUDED.total_watch_seconds,
           avg_watch_pct       = EXCLUDED.avg_watch_pct,
           completed_views     = EXCLUDED.completed_views,
           play_rate           = EXCLUDED.play_rate,
           updated_at          = NOW()`,
        [video_id]
      );

      // ── 6. Check milestone events (fire-and-forget) ──────────────────────
      if (agg) {
        const playsCount   = parseInt(agg.total_plays,    10);
        const viewersCount = parseInt(agg.unique_viewers, 10);
        _maybeFireMilestones(video_id, ctx.video_owner_id, viewersCount, playsCount)
          .catch(e => logger.warn(`[analytics/ping] milestone error: ${e.message}`));
      }
    }

  } catch (err) {
    logger.error(`[analytics/ping] ${err.message}`, { session_id, video_id });
    // Response already sent — nothing to do
  }
});

// ─────────────────────────────────────────────────────────────────────────
// GET /api/analytics/cta/link/:ctaId
//
// Named CTA tracking link — looks up a video_cta_links row, records the
// click with full metadata (cta_name, page_name, destination_url), then
// 302-redirects. Only records if the video owner is on Pro/admin_lifetime.
//
// NOTE: this route MUST be registered before /cta/:videoId to prevent
// Express matching "link" as a videoId parameter.
// ─────────────────────────────────────────────────────────────────────────

router.get('/cta/link/:ctaId', async (req, res) => {
  const { ctaId } = req.params;

  // Validate UUID format
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(ctaId)) {
    return res.status(400).send('Invalid CTA link ID.');
  }

  let ctaLink;
  try {
    const { rows: [row] } = await pool.query(
      `SELECT c.id, c.cta_name, c.page_name, c.destination_url, c.video_id,
              c.user_id, p.name AS plan_name
       FROM   video_cta_links c
       JOIN   users  u ON u.id = c.user_id
       JOIN   plans  p ON p.id = u.plan_id
       LEFT JOIN videos v ON v.id = c.video_id
       WHERE  c.id = $1
         AND  (c.video_id IS NULL OR v.is_active = TRUE)`,
      [ctaId]
    );
    ctaLink = row;
  } catch (err) {
    logger.error(`[analytics/cta/link] lookup failed: ${err.message}`);
    return res.status(500).send('Internal error.');
  }

  if (!ctaLink) {
    return res.status(404).send('CTA link not found.');
  }

  // Resolve the first-party CTA viewer id (sets cookie if new) BEFORE redirect
  // so the Set-Cookie header rides on the 302 response.
  const ctaViewerId = resolveCtaViewerId(req, res);

  // Forward any inbound utm_* params (e.g. from the landing page) onto the
  // destination so the campaign attribution survives the redirect hop.
  const finalDest = mergeUtmIntoUrl(ctaLink.destination_url, req.query);

  // Redirect immediately — tracking is fire-and-forget
  res.redirect(302, finalDest);

  // Record click with full metadata (Pro/admin_lifetime plan only)
  if (ctaLink.plan_name === 'pro' || ctaLink.plan_name === 'admin_lifetime') {
    // Capture device/browser/country from the redirect request itself
    const clickIp      = getClientIp(req);
    const clickGeo     = lookupCountry(clickIp);
    const clickBrowser = parseBrowser(req.headers['user-agent']);
    const uaStr        = (req.headers['user-agent'] || '').toLowerCase();
    const clickDevice  = /mobile|android|iphone|ipad/.test(uaStr) ? 'mobile'
                       : /tablet/.test(uaStr)                      ? 'tablet'
                       : 'desktop';

    const utm = pickUtm(req.query);
    // CTA logs live in their own table, independent of the video library.
    pool.query(
      `INSERT INTO cta_click_logs
         (cta_link_id, user_id, video_id, cta_name, page_name, destination_url,
          viewer_id, device, browser, country, country_code, city,
          utm_source, utm_medium, utm_campaign, utm_term, utm_content)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
      [
        ctaId, ctaLink.user_id, ctaLink.video_id,
        ctaLink.cta_name, ctaLink.page_name || null, ctaLink.destination_url,
        ctaViewerId, clickDevice, clickBrowser,
        clickGeo.name, clickGeo.code, clickGeo.city,
        utm.utm_source, utm.utm_medium, utm.utm_campaign, utm.utm_term, utm.utm_content,
      ]
    ).catch(err => logger.warn(`[analytics/cta/link] insert failed: ${err.message}`));
  }
});

// ─────────────────────────────────────────────────────────────────────────
// GET /api/analytics/cta/:videoId
//
// CTA tracking link — no JavaScript required on the subscriber's page.
//
// The subscriber sets their CTA button's href/URL to:
//   https://app.vidapulse.io/api/analytics/cta/VIDEO_ID?to=https://their-page.com
//
// This endpoint:
//   1. Validates the video exists
//   2. Records a cta_click event (session_id = NULL — no player session)
//   3. 302-redirects the visitor to the destination URL
//
// Works everywhere: page builders, email tools, plain HTML — no JS needed.
// ─────────────────────────────────────────────────────────────────────────

router.get('/cta/:videoId', async (req, res) => {
  const { videoId } = req.params;
  const dest = req.query.to ?? '';

  // Validate destination URL — must be http:// or https://
  const safeDest = (dest.startsWith('http://') || dest.startsWith('https://'))
    ? dest.slice(0, 2000) : null;

  if (!safeDest) {
    return res.status(400).send('Missing or invalid "to" destination URL. Usage: /api/analytics/cta/VIDEO_ID?to=https://your-page.com');
  }

  // Forward any inbound utm_* params onto the destination (campaign attribution
  // survives the redirect). No-op when no utm_* params are present.
  const finalDest = mergeUtmIntoUrl(safeDest, req.query);

  // Validate videoId is UUID-shaped
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(videoId)) {
    return res.redirect(finalDest);
  }

  // Resolve the first-party CTA viewer id (sets a cookie) BEFORE the redirect
  // so the Set-Cookie header rides on the 302 — never touch res after redirect.
  const ctaViewerId  = resolveCtaViewerId(req, res);

  // Redirect first (< 50 ms) — tracking is fire-and-forget
  res.redirect(302, finalDest);

  // Background: record the click — only tracked for Pro / admin_lifetime plan owners.
  // The redirect always happens regardless of plan; only the analytics recording is gated.
  // Capture device/browser/geo for the independent CTA log.
  const clickGeo     = lookupCountry(getClientIp(req));
  const clickBrowser = parseBrowser(req.headers['user-agent']);
  const uaStr        = (req.headers['user-agent'] || '').toLowerCase();
  const clickDevice  = /mobile|android|iphone|ipad/.test(uaStr) ? 'mobile'
                     : /tablet/.test(uaStr)                      ? 'tablet'
                     : 'desktop';
  const utm          = pickUtm(req.query);

  // Record into the independent cta_click_logs table — Pro/admin owners only.
  // The owner is resolved from the video; the log keeps video_id only as an
  // informational reference (no FK), so it survives any future video purge.
  pool.query(
    `INSERT INTO cta_click_logs
       (cta_link_id, user_id, video_id, cta_name, page_name, destination_url,
        viewer_id, device, browser, country, country_code, city,
        utm_source, utm_medium, utm_campaign, utm_term, utm_content)
     SELECT NULL, v.user_id, v.id, NULL, NULL, $2,
            $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
     FROM   videos v
     JOIN   users u ON u.id = v.user_id
     JOIN   plans p ON p.id = u.plan_id
     WHERE  v.id = $1
       AND  v.is_active = TRUE
       AND  p.name IN ('pro', 'admin_lifetime')`,
    [
      videoId, safeDest, ctaViewerId, clickDevice, clickBrowser,
      clickGeo.name, clickGeo.code, clickGeo.city,
      utm.utm_source, utm.utm_medium, utm.utm_campaign, utm.utm_term, utm.utm_content,
    ]
  ).catch(err => logger.warn(`[analytics/cta] insert failed: ${err.message}`));
});

// ─────────────────────────────────────────────────────────────────────────
// POST /api/analytics/event
//
// Accepts discrete events from embed pages — currently: cta_click.
// session_id is optional; when provided the click is linked to a player
// session (postMessage approach). When absent (redirect approach), the
// event is still recorded against the video.
//
// Body:
//   video_id    UUID   — required
//   event_type  string — currently only 'cta_click'
//   session_id  UUID   — optional (from the iframe postMessage)
//   position    number — optional playback position in seconds
//
// Response: { ok: true }  (always — same as /ping)
// ─────────────────────────────────────────────────────────────────────────

router.post('/event', async (req, res) => {
  const { session_id, video_id, event_type, position } = req.body ?? {};
  res.json({ ok: true }); // always respond 200 quickly

  if (!video_id || event_type !== 'cta_click') {
    if (event_type && event_type !== 'cta_click') {
      logger.warn(`[analytics/event] unsupported event_type: ${event_type}`);
    }
    return;
  }

  try {
    const safePosition = (position !== null && position !== undefined)
      ? (parseFloat(position) || null) : null;

    if (session_id) {
      // Session-linked click: verify session belongs to this video
      await pool.query(
        `INSERT INTO analytics_events
           (session_id, video_id, event_type, video_position, occurred_at)
         SELECT $1, $2, 'cta_click', $3, NOW()
         WHERE EXISTS (
           SELECT 1 FROM analytics_sessions
           WHERE id = $1 AND video_id = $2
         )`,
        [session_id, video_id, safePosition]
      );
    } else {
      // Session-less click: verify video exists
      await pool.query(
        `INSERT INTO analytics_events
           (session_id, video_id, event_type, video_position, occurred_at)
         SELECT NULL, id, 'cta_click', $2, NOW()
         FROM   videos
         WHERE  id = $1 AND is_active = TRUE`,
        [video_id, safePosition]
      );
    }
  } catch (err) {
    logger.warn(`[analytics/event] cta_click insert failed: ${err.message}`);
  }
});

// ─────────────────────────────────────────────────────────────────────────
// _maybeFireMilestones — delegates entirely to emitEvent().
//
// emitEvent() handles all milestone deduplication via video_milestones:
//   - Viewer milestones: via VIDEO_MILESTONE_MAP in behavioralEventService
//   - Play milestones:   via 'video_plays_milestone' + plays_count payload
//
// DO NOT pre-insert into video_milestones here — that would cause emitEvent()
// to hit a unique conflict and silently skip the behavioral event insert.
// ─────────────────────────────────────────────────────────────────────────

async function _maybeFireMilestones(videoId, ownerId, uniqueViewers, totalPlays) {
  const payload = { video_id: videoId, unique_viewers: uniqueViewers, total_plays: totalPlays };

  if (uniqueViewers >= 10) {
    await emitEvent(ownerId, 'first_analytics_milestone', videoId, payload);
  }
  if (uniqueViewers >= 20) {
    await emitEvent(ownerId, 'twenty_viewers_milestone',  videoId, payload);
  }
  if (uniqueViewers >= 50) {
    await emitEvent(ownerId, 'fifty_viewers_milestone',   videoId, payload);
  }

  const { isPlayMilestone } = require('../services/behavioralEventService');
  if (isPlayMilestone(totalPlays)) {
    await emitEvent(ownerId, 'video_plays_milestone', videoId,
      { ...payload, plays_count: totalPlays });
  }
}

module.exports = router;
