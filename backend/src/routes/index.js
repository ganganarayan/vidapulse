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

const { requireAuth }  = require('../middleware/requireAuth');
const { emitEvent }    = require('../services/behavioralEventService');

// ── Route modules ─────────────────────────────────────────
const healthRoutes    = require('./health');
const webhookRoutes   = require('./webhook');
const authRoutes      = require('./auth');
const userRoutes      = require('./user');
const videoRoutes     = require('./videos');
const analyticsRoutes = require('./analytics');
const adminRoutes     = require('./admin');

router.use('/health',    healthRoutes);
router.use('/webhook',   webhookRoutes);
router.use('/auth',      authRoutes);
router.use('/user',      userRoutes);
router.use('/videos',    videoRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/admin',     adminRoutes);

// ── GET /api/upgrade ──────────────────────────────────────
// Called when the user visits the upgrade modal.
// Emits upgrade_page_visited behavioral event (non-blocking).
// Returns current plan + video count for the modal to display.
router.get('/upgrade', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await require('../config/database').pool.query(
      `SELECT COUNT(*) AS video_count,
              COALESCE(SUM(total_plays), 0) AS total_plays_to_date
       FROM videos
       WHERE user_id = $1 AND is_active = TRUE`,
      [req.user.id]
    );
    const stats = rows[0];

    emitEvent(req.user.id, 'upgrade_page_visited', null, {
      current_plan       : req.user.plan,
      videos_count       : parseInt(stats.video_count, 10),
      total_plays_to_date: parseInt(stats.total_plays_to_date, 10),
    });

    return res.json({
      current_plan       : req.user.plan,
      videos_count       : parseInt(stats.video_count, 10),
      total_plays_to_date: parseInt(stats.total_plays_to_date, 10),
      upgrade_options    : req.user.plan === 'free'
        ? ['starter', 'pro']
        : ['pro'],
      pricing: {
        starter: { usd: 10, video_limit: 10 },
        pro    : { usd: 19, video_limit: null },
      },
      razorpay_links: {
        starter: 'https://rzp.io/rzp/VidaPulseStarter',
        pro    : 'https://rzp.io/rzp/VidaPulsePro',
      },
    });
  } catch (err) {
    next(err);
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
