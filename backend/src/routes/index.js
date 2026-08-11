'use strict';

/**
 * API route aggregator — mounts all route modules under /api.
 *
 * Mounted in src/index.js as: app.use('/api', require('./routes'))
 *
 * Routes:
 *   /api/health             → health.js
 *   /api/webhook/*          → webhook.js
 *   /api/auth/*             → auth.js
 *   /api/user/*             → user.js      (me, heartbeat, notifications, preferences)
 *   /api/upgrade            → inline (emits upgrade_page_visited event)
 *   /api/videos/*           → videos.js    (CRUD + video tracking)
 *   /api/analytics/*        → analytics.js (Module 5)
 *   /api/admin/*            → admin.js     (Steps 15–16)
 *   /api/embed/*            → embed.js     (future)
 */

const express = require('express');
const router  = express.Router();
const logger  = require('../config/logger');
const geoip   = require('geoip-lite');

const { requireAuth }  = require('../middleware/requireAuth');
const { emitEvent }    = require('../services/behavioralEventService');
const { getVisiblePromotionVideos } = require('../services/promotionService');
const { startedAt }    = require('../config/serverInfo');

/** Extract real client IP, honouring Cloudflare and reverse-proxy headers */
function getClientIp(req) {
  const cf = req.headers['cf-connecting-ip'];
  if (cf) return cf.trim();
  const xff = req.headers['x-forwarded-for'];
  if (xff) return xff.split(',')[0].trim();
  return req.ip || null;
}

/** Returns true if the request originates from India; defaults to true on lookup failure */
function isIndianUser(req) {
  const ip   = getClientIp(req);
  if (!ip) return true;
  const ipv4 = ip.replace(/^::ffff:/i, '');
  try {
    const geo = geoip.lookup(ipv4);
    return geo?.country === 'IN';
  } catch {
    return true;
  }
}

// ── Route modules ─────────────────────────────────────────
const healthRoutes    = require('./health');
const webhookRoutes   = require('./webhook');
const authRoutes      = require('./auth');
const userRoutes      = require('./user');
const videoRoutes     = require('./videos');
const analyticsRoutes = require('./analytics');
const adminRoutes     = require('./admin');
const helpRoutes      = require('./help');
const reportsRoutes   = require('./reports');
const ctaLinksRoutes  = require('./ctaLinks');
const paymentsRoutes  = require('./payments');
const trackRoutes           = require('./track');
const trackingWebhookRoutes = require('./trackingWebhooks');
const trackingLogRoutes     = require('./trackingLogs');

router.use('/health',    healthRoutes);
router.use('/webhook',   webhookRoutes);
router.use('/auth',      authRoutes);
router.use('/user',      userRoutes);
router.use('/videos',    videoRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/admin',     adminRoutes);
router.use('/help',      helpRoutes);
router.use('/reports',   reportsRoutes);
router.use('/cta-links', ctaLinksRoutes);
router.use('/payments',  paymentsRoutes);
router.use('/track',             trackRoutes);            // public viewer events (embed)
router.use('/tracking-webhooks', trackingWebhookRoutes);  // subscriber-owned CRUD
router.use('/tracking-logs',     trackingLogRoutes);      // subscriber-owned read-only log

// ── GET /api/geo ──────────────────────────────────────────────────────────
// Public (no auth). Returns the requester's ISO-3166 alpha-2 country code,
// resolved offline from their IP via geoip-lite. Used by the signup form to
// default the phone-number country code. Never throws — returns
// { country: null } on any lookup failure so the client can fall back.
router.get('/geo', (req, res) => {
  let country = null;
  try {
    const ip = getClientIp(req);
    if (ip) {
      const ipv4 = ip.replace(/^::ffff:/i, '');
      const geo  = geoip.lookup(ipv4);
      country = geo?.country || null;
    }
  } catch { country = null; }
  return res.json({ country });
});

// ── GET /api/promotion-videos ─────────────────────────────────────────────
// Returns promotion videos visible to the current user (plan-filtered, not hidden).
router.get('/promotion-videos', requireAuth, async (req, res, next) => {
  try {
    const videos = await getVisiblePromotionVideos(req.user.id, req.user.plan);
    return res.json({ videos });
  } catch (err) { next(err); }
});

// ── GET /api/upgrade ──────────────────────────────────────────────────────
// Called when the user visits the Upgrade page.
// Returns current plan, video stats, upgrade options, and Razorpay base URLs
// (stored in webhook_settings so the admin can update them without redeploy).
// NOTE: intentionally does NOT fire a webhook — page visits are not billable events.
router.get('/upgrade', requireAuth, async (req, res, next) => {
  try {
    const db = require('../config/database').pool;
    const [statsRes, settingsRes] = await Promise.all([
      db.query(
        `SELECT COUNT(*) AS video_count,
                COALESCE(SUM(total_plays), 0) AS total_plays_to_date
         FROM videos
         WHERE user_id = $1 AND is_active = TRUE`,
        [req.user.id]
      ),
      db.query(
        `SELECT razorpay_starter_url, razorpay_pro_url FROM webhook_settings LIMIT 1`
      ),
    ]);

    const stats    = statsRes.rows[0];
    const settings = settingsRes.rows[0] ?? {};

    // Determine which plans the user can still upgrade to
    const plan = req.user.plan;
    let upgrade_options;
    if (plan === 'free') {
      upgrade_options = ['starter', 'pro'];
    } else if (plan === 'starter') {
      upgrade_options = ['pro'];
    } else {
      upgrade_options = []; // pro / admin_lifetime — already at top
    }

    const env    = require('../config/env');
    const india  = isIndianUser(req);
    const currency = india ? 'INR' : 'USD';

    return res.json({
      current_plan       : plan,
      videos_count       : parseInt(stats.video_count, 10),
      total_plays_to_date: parseInt(stats.total_plays_to_date, 10),
      upgrade_options,
      currency,          // 'INR' | 'USD' — derived from request IP
      pricing: {
        starter: {
          inr: 999,  usd: 15, inr_label: '₹999',   usd_label: '$15', video_limit: 10,
          price      : india ? 999  : 15,
          price_label: india ? '₹999'   : '$15',
        },
        pro: {
          inr: 1999, usd: 29, inr_label: '₹1,999', usd_label: '$29', video_limit: 20,
          price      : india ? 1999 : 29,
          price_label: india ? '₹1,999' : '$29',
        },
      },
      // Razorpay: static payment-link URLs for INR one-time / subscription entry
      razorpay_links: {
        starter: settings.razorpay_starter_url || null,
        pro    : settings.razorpay_pro_url     || null,
      },
      razorpay_enabled: !!(env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET),
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/version ─────────────────────────────────────────────────────
// Public. Returns the server's startup timestamp.
// Frontend polls this every 60 s; when startedAt changes (new deploy →
// process restart), it calls window.location.reload(true) automatically.
router.get('/version', (_req, res) => {
  res.json({ started_at: startedAt });
});

// ── GET /api/wake ─────────────────────────────────────────────────────────
// Public wake endpoint. Hitting this URL from OUTSIDE (a bookmark, phone
// shortcut, or uptime monitor) wakes a sleeping Railway instance — the
// request itself does the waking. Every hit is logged to wake_log for the
// admin Wake page. Optional query params: ?source=bookmark&note=...
router.get('/wake', async (req, res) => {
  const awakeAt = new Date().toISOString();
  // Respond immediately (this is what wakes the container).
  res.json({ ok: true, awake_at: awakeAt, message: 'VidaPulse is awake' });

  // Log the wake (best-effort — never blocks or throws).
  try {
    const db     = require('../config/database').pool;
    const source = String(req.query.source ?? 'unknown').slice(0, 100);
    const note   = req.query.note ? String(req.query.note).slice(0, 500) : null;
    const ip     = req.headers['cf-connecting-ip']
                || (req.headers['x-forwarded-for'] || '').split(',')[0].trim()
                || req.ip || null;
    const ua     = (req.headers['user-agent'] || '').slice(0, 500) || null;
    await db.query(
      `INSERT INTO wake_log (source, ip, user_agent, note) VALUES ($1, $2, $3, $4)`,
      [source, ip, ua, note]
    );
    logger.info(`[wake] Wake ping logged — source=${source} ip=${ip}`);
  } catch (err) {
    logger.warn(`[wake] failed to log wake ping: ${err.message}`);
  }
});

// ── GET /api/pageview ─────────────────────────────────────────────────────
// Beacon endpoint. A tiny script on the landing page + KB pages fires an
// image request here on load with path/referrer/utm/device. Cross-origin
// safe (image GET, no CORS). Logs to page_views; flags bots via UA.
router.get('/pageview', (req, res) => {
  res.status(204).end(); // respond instantly — it's a fire-and-forget beacon
  try {
    const db     = require('../config/database').pool;
    const geoip  = require('geoip-lite');
    const { detectBot } = require('../services/crawlerLogger');
    const q      = req.query || {};
    const ua     = req.headers['user-agent'] || '';
    const botName = detectBot(ua);
    const ip = req.headers['cf-connecting-ip']
            || (req.headers['x-forwarded-for'] || '').split(',')[0].trim()
            || req.ip || null;
    const cc = (() => { try { return geoip.lookup(ip)?.country || null; } catch { return null; } })();
    const s = (v, n = 200) => (v == null ? null : String(v).slice(0, n));
    db.query(
      `INSERT INTO page_views
         (host, path, referrer, utm_source, utm_medium, utm_campaign, utm_term,
          utm_content, device, is_bot, bot_name, country_code, ip)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
      [
        s(q.host, 120), s(q.path, 2000), s(q.ref, 2000),
        s(q.utm_source), s(q.utm_medium), s(q.utm_campaign), s(q.utm_term), s(q.utm_content),
        s(q.dt, 20), !!botName, botName, cc, ip,
      ]
    ).catch(err => logger.debug(`[pageview] log failed: ${err.message}`));
  } catch (err) {
    logger.debug(`[pageview] handler error: ${err.message}`);
  }
});

// ── 404 handler for unknown /api/* routes ─────────────────
// Catches any request that didn't match above routes
router.use((req, res) => {
  logger.debug(`[routes] 404 — ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    error  : 'Not Found',
    message: `${req.method} ${req.originalUrl} is not a valid API endpoint`,
  });
});

module.exports = router;
