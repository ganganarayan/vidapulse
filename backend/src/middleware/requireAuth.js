'use strict';

/**
 * JWT authentication middleware.
 *
 * requireAuth — verifies the vp_token cookie (or Authorization: Bearer header),
 *   loads fresh user + plan from DB, and sets req.user.
 *
 * requireAdmin — wraps requireAuth and additionally checks role === 'admin'.
 *   Also blocks impersonation JWTs (impersonated: true) from reaching admin routes.
 *
 * Token sources (checked in order):
 *   1. Authorization: Bearer <token>  (impersonation JWT — checked first so it
 *      takes priority over the admin's cookie during an active impersonation session)
 *   2. httpOnly cookie: vp_token      (normal browser auth)
 *
 * req.user shape after successful auth:
 *   Normal session:
 *     { id, email, name, role, plan }
 *   Impersonation session (admin entered a subscriber account):
 *     { id, email, name, role, plan,
 *       impersonated: true,
 *       impersonated_by: <admin_user_id>,
 *       session_token: <string> }
 *
 *   plan is always fresh from DB — never stale from JWT.
 *   impersonated/impersonated_by/session_token come from the JWT payload only
 *   (no DB round-trip needed for these — they are immutable for the session).
 */

const jwt    = require('jsonwebtoken');
const env    = require('../config/env');
const logger = require('../config/logger');
const { pool } = require('../config/database');

// ─────────────────────────────────────────────────────────────
// requireAuth
// ─────────────────────────────────────────────────────────────

function requireAuth(req, res, next) {
  const rawToken = _extractToken(req);

  if (!rawToken) {
    return res.status(401).json({
      error  : 'Unauthorized',
      message: 'Authentication required — please log in',
    });
  }

  // Verify signature and expiry
  let payload;
  try {
    payload = jwt.verify(rawToken, env.JWT_SECRET);
  } catch (err) {
    const message = err.name === 'TokenExpiredError'
      ? 'Session expired — please log in again'
      : 'Invalid token — please log in again';
    return res.status(401).json({ error: 'Unauthorized', message });
  }

  // Load fresh user from DB so plan + role are always current
  // (if user upgrades plan mid-session, they get the new plan immediately)
  // COALESCE(p.name, 'free') guards against NULL plan_id — treats unassigned as free plan
  pool.query(
    `SELECT u.id, u.email, u.name, u.role, u.is_active,
            COALESCE(p.name::text, 'free') AS plan
     FROM users u
     LEFT JOIN plans p ON p.id = u.plan_id
     WHERE u.id = $1`,
    [payload.sub]
  )
    .then(result => {
      const user = result.rows[0];

      if (!user || !user.is_active) {
        return res.status(401).json({
          error  : 'Unauthorized',
          message: 'Account not found or has been deactivated',
        });
      }

      // Build req.user. For impersonation JWTs the JWT carries extra fields
      // that we attach here — these are immutable for the session lifetime and
      // don't need a DB round-trip.
      req.user = {
        id   : user.id,
        email: user.email,
        name : user.name,
        role : user.role,
        plan : user.plan,
      };

      // Impersonation fields — only present when admin entered a subscriber account
      if (payload.impersonated === true) {
        req.user.impersonated     = true;
        req.user.impersonated_by  = payload.impersonated_by ?? null;
        req.user.session_token    = payload.session_token   ?? null;
      }

      next();
    })
    .catch(err => {
      logger.error(`[requireAuth] DB error for user ${payload.sub}: ${err.message}`);
      next(err);
    });
}

// ─────────────────────────────────────────────────────────────
// requireAdmin
// ─────────────────────────────────────────────────────────────

/**
 * Assumes requireAuth has already run (req.user is set).
 * Checks:
 *   1. The request is NOT an impersonation session (impersonated JWTs cannot
 *      call admin routes — they get role: 'subscriber' and impersonated: true)
 *   2. The user has role === 'admin'
 *
 * Note: plan === 'admin_lifetime' alone is NOT sufficient — only role === 'admin'
 * can call impersonation endpoints. This matches the security spec.
 */
function requireAdmin(req, res, next) {
  // Impersonation JWTs are explicitly blocked from all admin-only routes
  if (req.user.impersonated === true) {
    logger.warn(`[requireAdmin] Blocked impersonation JWT for admin route: ${req.user.email}`);
    return res.status(403).json({
      error  : 'Forbidden',
      message: 'Admin routes are not accessible during impersonation',
    });
  }

  const isAdmin = req.user.role === 'admin' || req.user.plan === 'admin_lifetime';
  if (!isAdmin) {
    logger.warn(`[requireAdmin] Denied: ${req.user.email} (role=${req.user.role}, plan=${req.user.plan})`);
    return res.status(403).json({
      error  : 'Forbidden',
      message: 'Admin access required',
    });
  }

  next();
}

// ─────────────────────────────────────────────────────────────
// Token extraction helper
// ─────────────────────────────────────────────────────────────

/**
 * Token extraction order:
 *   1. Authorization: Bearer <token>  — checked first so impersonation JWTs
 *      (sent as Bearer by the frontend) take precedence over the admin's own
 *      vp_token cookie when an active impersonation session is in progress.
 *   2. httpOnly cookie: vp_token      — normal browser auth.
 */
function _extractToken(req) {
  // 1. Authorization: Bearer <token> (impersonation JWT / API clients)
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) return authHeader.slice(7);

  // 2. httpOnly cookie (standard browser session)
  if (req.cookies?.vp_token) return req.cookies.vp_token;

  return null;
}

module.exports = { requireAuth, requireAdmin };
