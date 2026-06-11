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
