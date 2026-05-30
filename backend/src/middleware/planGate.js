'use strict';

/**
 * Plan Gate Middleware — Step 7
 *
 * Two middleware factories that enforce plan-based feature limits.
 * Both require requireAuth to have already run (req.user must be set).
 *
 * ── planGate(featureName) ─────────────────────────────────────────────────
 *   Usage:  router.get('/heatmap', requireAuth, planGate('heatmap'), handler)
 *
 *   Checks whether req.user.plan grants access to featureName.
 *   If access is denied:
 *     - Emits a behavioral event (non-blocking fire-and-forget)
 *     - Returns structured 403 with upgrade_url
 *
 * ── videoLimitGate ────────────────────────────────────────────────────────
 *   Usage:  router.post('/videos', requireAuth, videoLimitGate, handler)
 *
 *   Checks whether the user has reached their plan's video upload limit.
 *   Free: 1 video · Starter: 10 videos · Pro: unlimited
 *   Emits free_limit_hit if the limit is reached.
 *
 * ── Structured 403 response ───────────────────────────────────────────────
 *   {
 *     error        : 'plan_limit',
 *     feature      : 'heatmap',
 *     required_plan: 'pro',
 *     current_plan : 'free',
 *     upgrade_url  : 'https://app.vidapulse.io/upgrade'
 *   }
 */

const env              = require('../config/env');
const { pool }         = require('../config/database');
const logger           = require('../config/logger');
const { emitEvent }    = require('../services/behavioralEventService');

// ── Plan hierarchy ────────────────────────────────────────────────────────
// Higher rank = more access. admin_lifetime has unlimited access.
const PLAN_RANK = {
  free          : 0,
  starter       : 1,
  pro           : 2,
  admin_lifetime: 99,
};

// ── Feature → minimum required plan ──────────────────────────────────────
// null  = available on all plans (no gate)
// 'starter' = requires starter or above
// 'pro'     = requires pro or above
//
// Matches the feature keys in the plans.features JSONB column (migration 004).
const FEATURE_PLAN_REQUIREMENTS = {
  // ── Free tier features (always accessible) ────────────────────────────
  total_plays         : null,
  play_rate           : null,
  unique_visitors     : null,
  domain_tracking     : null,
  embed_code          : null,

  // ── Starter+ features ─────────────────────────────────────────────────
  geography           : 'starter',
  device_breakdown    : 'starter',
  avg_time_watched    : 'starter',

  // ── Pro-only features ─────────────────────────────────────────────────
  heatmap             : 'pro',
  viewer_level        : 'pro',
  audience_segmentation: 'pro',
  conversion_tracking  : 'pro',
  events               : 'pro',
  reports              : 'pro',
  alerts               : 'pro',
};

// ── Video limits per plan ─────────────────────────────────────────────────
// Must match plans.video_limit column values seeded in migration 004.
// null = unlimited
const VIDEO_LIMIT = {
  free          : 1,
  starter       : 10,
  pro           : null,
  admin_lifetime: null,
};

// ─────────────────────────────────────────────────────────────────────────
// planGate(featureName)
//
// Middleware factory. Returns an Express middleware that:
//   1. Passes admin_lifetime through unconditionally
//   2. Resolves the minimum required plan for featureName
//   3. Compares PLAN_RANK to decide access
//   4. On deny: emits behavioral event + returns 403
//
// Unknown feature names (not in FEATURE_PLAN_REQUIREMENTS) are treated as
// free — i.e. no gate. This is intentionally permissive so a typo in a
// feature name never accidentally blocks legitimate users.
// ─────────────────────────────────────────────────────────────────────────

function planGate(featureName) {
  // Validate at definition time (not runtime) so misconfigurations surface
  // during startup / code review, not in production traffic.
  if (!(featureName in FEATURE_PLAN_REQUIREMENTS)) {
    logger.warn(`[planGate] Unknown feature name: "${featureName}" — gate will be a no-op`);
  }

  return function planGateMiddleware(req, res, next) {
    // admin_lifetime — unrestricted access, skip all checks
    if (req.user.plan === 'admin_lifetime') return next();

    const requiredPlan = FEATURE_PLAN_REQUIREMENTS[featureName] ?? null;

    // Feature is available on all plans (or unknown) — pass through
    if (!requiredPlan) return next();

    const userRank     = PLAN_RANK[req.user.plan]  ?? 0;
    const requiredRank = PLAN_RANK[requiredPlan]    ?? 99;

    // Access granted
    if (userRank >= requiredRank) return next();

    // Access denied — emit behavioral event (fire-and-forget, never throws)
    const eventKey = requiredPlan === 'pro' ? 'pro_feature_attempted' : 'free_limit_hit';
    emitEvent(req.user.id, eventKey, null, {
      feature      : featureName,
      required_plan: requiredPlan,
    });

    logger.debug(
      `[planGate] Denied — user ${req.user.id} (${req.user.plan}) tried ${featureName} (requires ${requiredPlan})`
    );

    return res.status(403).json({
      error        : 'plan_limit',
      feature      : featureName,
      required_plan: requiredPlan,
      current_plan : req.user.plan,
      upgrade_url  : `${env.APP_URL}/upgrade`,
    });
  };
}

// ─────────────────────────────────────────────────────────────────────────
// videoLimitGate
//
// Single middleware (not a factory) — attach directly to upload/create routes.
// Counts the user's current active videos and blocks if they've hit the cap.
//
// The count query is intentionally lightweight: COUNT(*) on an indexed
// WHERE clause (user_id + is_active). Runs only on upload/create requests,
// not on read requests.
// ─────────────────────────────────────────────────────────────────────────

async function videoLimitGate(req, res, next) {
  try {
    // admin_lifetime and pro have no video cap
    if (req.user.plan === 'admin_lifetime' || req.user.plan === 'pro') {
      return next();
    }

    const limit = VIDEO_LIMIT[req.user.plan];

    // Null limit = unlimited (safety net for any future plan)
    if (limit === null || limit === undefined) return next();

    const { rows } = await pool.query(
      `SELECT COUNT(*) AS video_count
       FROM   videos
       WHERE  user_id  = $1
         AND  is_active = TRUE`,
      [req.user.id]
    );

    const currentCount = parseInt(rows[0].video_count, 10);

    // Under the limit — allow
    if (currentCount < limit) return next();

    // At or over the limit — emit event + deny
    emitEvent(req.user.id, 'free_limit_hit', null, {
      feature      : 'video_upload',
      required_plan: req.user.plan === 'free' ? 'starter' : 'pro',
      video_count  : currentCount,
      video_limit  : limit,
    });

    logger.debug(
      `[videoLimitGate] Denied — user ${req.user.id} (${req.user.plan}) at limit (${currentCount}/${limit})`
    );

    return res.status(403).json({
      error        : 'plan_limit',
      feature      : 'video_upload',
      required_plan: req.user.plan === 'free' ? 'starter' : 'pro',
      current_plan : req.user.plan,
      current_count: currentCount,
      video_limit  : limit,
      upgrade_url  : `${env.APP_URL}/upgrade`,
    });

  } catch (err) {
    // Never block an upload due to a gate check failure — log and pass through
    logger.error(`[videoLimitGate] DB error for user ${req.user.id}: ${err.message}`);
    next();
  }
}

module.exports = { planGate, videoLimitGate, PLAN_RANK, FEATURE_PLAN_REQUIREMENTS };
