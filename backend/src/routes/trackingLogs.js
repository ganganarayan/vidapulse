'use strict';

/**
 * Subscriber Tracking Activity log — /api/tracking-logs
 *
 * READ-ONLY feed of the caller's OWN viewer-plane fires (every Meta-pixel fire
 * and every tracking-webhook fire), across ALL of their videos. No actions.
 *
 * Strictly owner-scoped: getTrackingLogs is called with ownerId = req.user.id,
 * so a subscriber can only ever see their own data — never the platform plane
 * and never another user's tracking. The admin all-users view lives separately
 * under /api/admin/tracking-logs.
 *
 * Pro-gated (video_tracking feature) — same gate as the rest of tracking.
 */

const express = require('express');
const router  = express.Router();
const { requireAuth } = require('../middleware/requireAuth');
const { planGate }    = require('../middleware/planGate');
const { getTrackingLogs } = require('../tracking/trackingService');

// GET /api/tracking-logs?page=&limit=&sort=&dir=
router.get('/', requireAuth, planGate('video_tracking'), async (req, res, next) => {
  try {
    const { page, limit, sort, dir } = req.query;
    const data = await getTrackingLogs({ ownerId: req.user.id, page, limit, sort, dir });
    return res.json(data); // { log: [...], pagination: {...} }
  } catch (err) { next(err); }
});

module.exports = router;
