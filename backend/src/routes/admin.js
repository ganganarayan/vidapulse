'use strict';

/**
 * Admin routes — /api/admin/*
 *
 * Security model:
 *   - All routes require requireAuth (valid JWT, active user in DB)
 *   - All routes except /impersonate/end additionally require requireAdmin
 *     (role = 'admin' only — NOT plan-based, and impersonation JWTs are blocked)
 *   - /impersonate/end requires requireImpersonating
 *     (must have an active impersonation JWT)
 *
 * Routes:
 *   GET   /api/admin/webhook-settings         — webhook config + governor + queue stats
 *   PATCH /api/admin/webhook-settings         — update webhook config
 *   POST  /api/admin/webhook-settings/test    — fire test webhook
 *   GET   /api/admin/onboarding-health        — funnel metrics + recent users
 *   GET   /api/admin/users                    — paginated subscriber list
 *   POST  /api/admin/impersonate/:userId       — start impersonation session → returns JWT
 *   POST  /api/admin/impersonate/end           — end active impersonation session
 *   GET   /api/admin/impersonation-log         — paginated impersonation audit log
 */

const express         = require('express');
const { z }           = require('zod');
const jwt             = require('jsonwebtoken');
const { v4: uuidv4 }  = require('uuid');
const router          = express.Router();
const { pool }        = require('../config/database');
const env             = require('../config/env');
const logger          = require('../config/logger');
const { requireAuth, requireAdmin } = require('../middleware/requireAuth');
const { testWebhook } = require('../services/webhookSender');
const {
  resendQueuedWebhooks,
  resendFailedWebhooks,
  retryWebhookEntry,
  discardWebhookEntry,
  unpauseWebhook,
  getContactWebhookStatus,
} = require('../services/contactWebhookSender');

const {
  getAdminPromotionVideos,
  createPromotionVideo,
  updateVisibility,
  reorderPromotionVideos,
  deletePromotionVideo,
  setUserPromoHidden,
  getUserPromoHiddenIds,
} = require('../services/promotionService');

// ─────────────────────────────────────────────────────────────────────────────
// requireImpersonating guard
// Assumes requireAuth has already run. Allows only active impersonation JWTs.
// ─────────────────────────────────────────────────────────────────────────────

function requireImpersonating(req, res, next) {
  if (req.user.impersonated !== true || !req.user.session_token) {
    return res.status(403).json({
      error  : 'Forbidden',
      message: 'This endpoint requires an active impersonation session',
    });
  }
  next();
}

// ─────────────────────────────────────────────────────────────────────────────
// Action logging helper
//
// Appends a structured action entry to admin_impersonation_log.actions_taken.
// Fire-and-forget — never awaited by callers so it never blocks a response.
// ─────────────────────────────────────────────────────────────────────────────

async function _logAction(sessionToken, action, meta = {}) {
  try {
    const entry = JSON.stringify({
      action,
      meta,
      ts: new Date().toISOString(),
    });
    await pool.query(
      `UPDATE admin_impersonation_log
       SET    actions_taken = actions_taken || $1::jsonb
       WHERE  session_token = $2`,
      [`[${entry}]`, sessionToken]
    );
  } catch (err) {
    // Non-fatal — log and continue. The impersonation session itself is unaffected.
    logger.error(`[_logAction] Failed to append action for token ${sessionToken}: ${err.message}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/admin/impersonate/end
//
// Called with an active impersonation JWT (Bearer header).
// Marks the session as ended in the DB, then issues a fresh admin JWT
// and sets it as an httpOnly cookie so the admin is seamlessly restored.
//
// This route is intentionally placed BEFORE the router.use(requireAdmin)
// block below — it must be accessible with an impersonation JWT.
// ─────────────────────────────────────────────────────────────────────────────

router.post('/impersonate/end', requireAuth, requireImpersonating, async (req, res, next) => {
  const { session_token, impersonated_by } = req.user;

  try {
    // Mark the impersonation session as ended
    const { rowCount } = await pool.query(
      `UPDATE admin_impersonation_log
       SET    ended_at       = NOW(),
              ended_normally = TRUE
       WHERE  session_token = $1
         AND  ended_at IS NULL`,
      [session_token]
    );

    if (rowCount === 0) {
      // Already ended (e.g. double-click of the Exit button) — still succeed gracefully
      logger.warn(`[impersonate/end] Session ${session_token} was already ended`);
    }

    // Re-load the admin user so we can issue a fresh JWT
    const { rows } = await pool.query(
      `SELECT u.id, u.email, u.name, u.role, p.name AS plan
       FROM   users u
       LEFT JOIN plans p ON p.id = u.plan_id
       WHERE  u.id = $1 AND u.is_active = TRUE`,
      [impersonated_by]
    );

    const adminUser = rows[0];
    if (!adminUser) {
      // Extremely unlikely — admin was deactivated during the impersonation session
      return res.status(401).json({
        error  : 'Unauthorized',
        message: 'Admin account no longer active — please log in',
      });
    }

    // Issue a fresh admin JWT (normal, not impersonation)
    const freshToken = jwt.sign(
      { sub: adminUser.id },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN }
    );

    res.cookie('vp_token', freshToken, {
      httpOnly: true,
      secure  : env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge  : 7 * 24 * 60 * 60 * 1000, // 7 days in ms
    });

    logger.info(`[impersonate/end] Admin ${adminUser.email} ended impersonation session ${session_token}`);

    return res.json({
      ok      : true,
      message : 'Impersonation session ended',
      redirect: '/admin/users',
    });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// All routes below this line require requireAdmin
// (role = 'admin' + impersonation JWTs blocked)
// ─────────────────────────────────────────────────────────────────────────────

router.use(requireAuth, requireAdmin);

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/webhook-settings
// ─────────────────────────────────────────────────────────────────────────────

router.get('/webhook-settings', async (req, res, next) => {
  try {
    const [{ rows: [settings] }, { rows: [governor] }] = await Promise.all([
      pool.query(`SELECT * FROM webhook_settings LIMIT 1`),
      pool.query(`SELECT * FROM webhook_governor LIMIT 1`),
    ]);

    const { rows: [qdRow] } = await pool.query(
      `SELECT COUNT(*)::int AS queue_depth
       FROM   behavioral_events
       WHERE  processed = FALSE`
    );

    const { rows: [sentRow] } = await pool.query(
      `SELECT COUNT(*)::int AS fires_this_hour
       FROM   webhook_outbound_log
       WHERE  status            = 'sent'
         AND  last_attempted_at > NOW() - INTERVAL '1 hour'`
    );

    const { rows: [nextRow] } = await pool.query(
      `SELECT COALESCE(scheduled_for, created_at) AS next_fire_at
       FROM   behavioral_events
       WHERE  processed = FALSE
       ORDER  BY COALESCE(scheduled_for, created_at) ASC
       LIMIT  1`
    );

    return res.json({
      settings      : settings ?? {},
      governor      : governor ?? {},
      queue_depth   : qdRow?.queue_depth    ?? 0,
      fires_this_hour: sentRow?.fires_this_hour ?? 0,
      next_fire_at  : nextRow?.next_fire_at ?? null,
    });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/admin/webhook-settings
// ─────────────────────────────────────────────────────────────────────────────

// SSRF guard: reject webhook URLs that point to internal/cloud-metadata addresses.
// An admin-compromised attacker could otherwise route server-side fetches to
// AWS metadata (169.254.169.254), Railway internals, or localhost.
function _isInternalHost(urlStr) {
  try {
    const { hostname } = new URL(urlStr);
    const h = hostname.toLowerCase();

    // Reject loopback, link-local, and RFC-1918 private ranges
    if (h === 'localhost') return true;
    if (h.startsWith('127.'))           return true;  // 127.x.x.x loopback
    if (h === '0.0.0.0')               return true;
    if (h.startsWith('10.'))            return true;  // 10.x.x.x private
    if (h.startsWith('192.168.'))       return true;  // 192.168.x.x private
    if (h.startsWith('169.254.'))       return true;  // 169.254.x.x link-local / cloud metadata
    if (h === '::1')                    return true;  // IPv6 loopback
    if (h === '[::1]')                  return true;

    // 172.16.0.0–172.31.255.255 private range
    const m = h.match(/^172\.(\d+)\./);
    if (m) {
      const second = parseInt(m[1], 10);
      if (second >= 16 && second <= 31) return true;
    }

    return false;
  } catch {
    return true; // if URL parsing fails, treat as internal (block it)
  }
}

const _urlFieldSchema = z.string()
  .url('Must be a valid URL')
  .max(2000)
  .refine(u => u.startsWith('https://'), { message: 'Must use HTTPS' })
  .refine(u => !_isInternalHost(u),      { message: 'Must point to a public external host' })
  .nullable()
  .optional();

const updateSettingsSchema = z.object({
  webhook_url              : _urlFieldSchema,
  notification_webhook_url : _urlFieldSchema,
  razorpay_starter_url     : _urlFieldSchema,
  razorpay_pro_url         : _urlFieldSchema,
  webhook_secret           : z.string().max(200).nullable().optional(),
  api_token                : z.string().max(500).nullable().optional(),
  is_active                : z.boolean().optional(),
  notes                    : z.string().max(2000).nullable().optional(),
  hourly_cap               : z.number().int().min(1).max(1000).optional(),
  is_paused                : z.boolean().optional(),
}).strict();

router.patch('/webhook-settings', async (req, res, next) => {
  try {
    const parsed = updateSettingsSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error : 'Validation failed',
        fields: parsed.error.flatten().fieldErrors,
      });
    }

    const { hourly_cap, is_paused, ...settingsFields } = parsed.data;

    const settingsClauses = [];
    const settingsVals    = [];
    let   p               = 1;

    if (settingsFields.webhook_url              !== undefined) { settingsClauses.push(`webhook_url              = $${p++}`); settingsVals.push(settingsFields.webhook_url);              }
    if (settingsFields.notification_webhook_url !== undefined) { settingsClauses.push(`notification_webhook_url = $${p++}`); settingsVals.push(settingsFields.notification_webhook_url); }
    if (settingsFields.razorpay_starter_url     !== undefined) { settingsClauses.push(`razorpay_starter_url     = $${p++}`); settingsVals.push(settingsFields.razorpay_starter_url);     }
    if (settingsFields.razorpay_pro_url         !== undefined) { settingsClauses.push(`razorpay_pro_url         = $${p++}`); settingsVals.push(settingsFields.razorpay_pro_url);         }
    if (settingsFields.webhook_secret           !== undefined) { settingsClauses.push(`webhook_secret           = $${p++}`); settingsVals.push(settingsFields.webhook_secret);           }
    if (settingsFields.api_token                !== undefined) { settingsClauses.push(`api_token                = $${p++}`); settingsVals.push(settingsFields.api_token);                }
    if (settingsFields.is_active                !== undefined) { settingsClauses.push(`is_active                = $${p++}`); settingsVals.push(settingsFields.is_active);                }
    if (settingsFields.notes                    !== undefined) { settingsClauses.push(`notes                    = $${p++}`); settingsVals.push(settingsFields.notes);                    }

    if (settingsClauses.length > 0) {
      settingsClauses.push(`updated_at = NOW()`);
      await pool.query(
        `UPDATE webhook_settings SET ${settingsClauses.join(', ')}`,
        settingsVals
      );
    }

    const govClauses = [];
    const govVals    = [];
    let   gp         = 1;

    if (hourly_cap !== undefined) { govClauses.push(`hourly_cap = $${gp++}`); govVals.push(hourly_cap); }
    if (is_paused  !== undefined) { govClauses.push(`is_paused  = $${gp++}`); govVals.push(is_paused);  }

    if (govClauses.length > 0) {
      govClauses.push(`updated_at = NOW()`);
      await pool.query(
        `UPDATE webhook_governor SET ${govClauses.join(', ')}`,
        govVals
      );
    }

    logger.info(`[admin] Webhook settings updated by user ${req.user.id}`);
    return res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/admin/webhook-settings/test
// ─────────────────────────────────────────────────────────────────────────────

router.post('/webhook-settings/test', async (req, res, next) => {
  try {
    const result = await testWebhook();
    logger.info(`[admin] Webhook test fired by user ${req.user.id} → ${result.ok ? 'OK' : 'FAILED'} (${result.statusCode})`);
    return res.json(result);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/onboarding-health
// ─────────────────────────────────────────────────────────────────────────────

router.get('/onboarding-health', async (req, res, next) => {
  try {
    const [funnelRes, timingRes, recentRes, planBreakdownRes] = await Promise.all([

      // Admin-role accounts are excluded from all onboarding metrics so they
      // don't pollute conversion data with internal test/setup activity.
      pool.query(`
        SELECT
          COUNT(*)::int                                                  AS total_users,
          COUNT(*) FILTER (WHERE video_added         = TRUE)::int       AS added_video,
          COUNT(*) FILTER (WHERE wow_moment_seen     = TRUE)::int       AS saw_wow_moment,
          COUNT(*) FILTER (WHERE free_limit_hit      = TRUE)::int       AS hit_free_limit,
          COUNT(*) FILTER (WHERE pro_feature_attempted = TRUE)::int     AS attempted_pro,
          COUNT(*) FILTER (WHERE converted_to_paid_at IS NOT NULL)::int AS converted,
          ROUND(AVG(limit_hit_count) FILTER (WHERE limit_hit_count > 0), 1)
                                                                        AS avg_limit_hits
        FROM onboarding_state os
        JOIN users u ON u.id = os.user_id
        WHERE u.role != 'admin'
      `),

      pool.query(`
        SELECT
          ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (
            ORDER BY hours_signup_to_first_video
          )::numeric, 1) AS median_signup_to_video,

          ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (
            ORDER BY hours_signup_to_wow_moment
          )::numeric, 1) AS median_signup_to_wow,

          ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (
            ORDER BY hours_wow_to_paid
          )::numeric, 1) AS median_wow_to_paid,

          ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (
            ORDER BY hours_limit_hit_to_paid
          )::numeric, 1) AS median_limit_to_paid
        FROM onboarding_state os
        JOIN users u ON u.id = os.user_id
        WHERE u.role != 'admin'
      `),

      pool.query(`
        SELECT
          os.user_id,
          u.email,
          u.name,
          p.name              AS plan,
          p.display_name      AS plan_display_name,
          os.current_step,
          os.limit_hit_count,
          os.video_added,
          os.wow_moment_seen,
          os.free_limit_hit,
          os.converted_to_paid_at,
          os.updated_at
        FROM onboarding_state os
        JOIN users u ON u.id       = os.user_id
        JOIN plans p ON p.id       = u.plan_id
        WHERE  u.role != 'admin'
        ORDER BY os.updated_at DESC
        LIMIT 25
      `),

      pool.query(`
        SELECT p.name AS plan, COUNT(u.id)::int AS user_count
        FROM   users u
        JOIN   plans p ON p.id = u.plan_id
        WHERE  u.is_active = TRUE
          AND  u.role != 'admin'
        GROUP  BY p.name
        ORDER  BY user_count DESC
      `),
    ]);

    const funnel = funnelRes.rows[0];
    const timing = timingRes.rows[0];
    const total  = funnel.total_users || 0;
    const pct    = n => total > 0 ? Math.round((parseInt(n || 0, 10) / total) * 100) : 0;

    return res.json({
      funnel: {
        total_users  : total,
        added_video  : { count: parseInt(funnel.added_video,    10), pct: pct(funnel.added_video)    },
        saw_wow      : { count: parseInt(funnel.saw_wow_moment, 10), pct: pct(funnel.saw_wow_moment) },
        hit_limit    : { count: parseInt(funnel.hit_free_limit, 10), pct: pct(funnel.hit_free_limit) },
        attempted_pro: { count: parseInt(funnel.attempted_pro,  10), pct: pct(funnel.attempted_pro)  },
        converted    : { count: parseInt(funnel.converted,      10), pct: pct(funnel.converted)      },
        avg_limit_hits: parseFloat(funnel.avg_limit_hits ?? 0),
      },
      timing: {
        median_signup_to_video: timing.median_signup_to_video != null ? Number(timing.median_signup_to_video) : null,
        median_signup_to_wow  : timing.median_signup_to_wow   != null ? Number(timing.median_signup_to_wow)   : null,
        median_wow_to_paid    : timing.median_wow_to_paid     != null ? Number(timing.median_wow_to_paid)     : null,
        median_limit_to_paid  : timing.median_limit_to_paid   != null ? Number(timing.median_limit_to_paid)   : null,
      },
      plan_breakdown : planBreakdownRes.rows,
      recent_users   : recentRes.rows,
    });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/users
//
// Paginated list of all users for the "Enter Account" interface.
// Returns: id, email, name, plan, plan_display_name, role, is_active,
//          video_count, joined (created_at), last_seen_at
//
// Query params:
//   page    — 1-based page number (default 1)
//   limit   — rows per page (default 25, max 100)
//   search  — optional partial match on email or name
// ─────────────────────────────────────────────────────────────────────────────

router.get('/users', async (req, res, next) => {
  try {
    const page   = Math.max(1, parseInt(req.query.page  ?? '1',  10) || 1);
    const limit  = Math.min(100, Math.max(1, parseInt(req.query.limit ?? '25', 10) || 25));
    const search = (req.query.search ?? '').trim();
    const offset = (page - 1) * limit;

    const params  = [];
    let   whereClause = `WHERE u.role != 'admin'`; // Never list admin accounts

    if (search) {
      params.push(`%${search}%`);
      whereClause += ` AND (u.email ILIKE $${params.length} OR u.name ILIKE $${params.length})`;
    }

    // Count total (for pagination metadata)
    const { rows: [countRow] } = await pool.query(
      `SELECT COUNT(u.id)::int AS total
       FROM users u
       ${whereClause}`,
      params
    );

    // Fetch page
    const dataParams = [...params, limit, offset];
    const { rows } = await pool.query(
      `SELECT
         u.id,
         u.email,
         u.name,
         p.name         AS plan,
         p.display_name AS plan_display_name,
         u.role,
         u.is_active,
         u.created_at,
         u.last_seen_at,
         COALESCE(vc.video_count, 0)::int AS video_count
       FROM users u
       LEFT JOIN plans p ON p.id = u.plan_id
       LEFT JOIN (
         SELECT user_id, COUNT(*)::int AS video_count
         FROM   videos
         WHERE  is_active = TRUE
         GROUP  BY user_id
       ) vc ON vc.user_id = u.id
       ${whereClause}
       ORDER BY u.created_at DESC
       LIMIT $${dataParams.length - 1}
       OFFSET $${dataParams.length}`,
      dataParams
    );

    const total      = countRow?.total ?? 0;
    const totalPages = Math.ceil(total / limit);

    return res.json({
      users: rows,
      pagination: {
        page,
        limit,
        total,
        total_pages: totalPages,
        has_next    : page < totalPages,
        has_prev    : page > 1,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/admin/impersonate/:userId
//
// Starts an impersonation session. Returns a short-lived JWT (2 hours) that
// the frontend stores in sessionStorage and sends as Authorization: Bearer.
//
// Security checks (non-negotiable):
//   1. Only role = 'admin' can call this (requireAdmin already enforces this)
//   2. Cannot impersonate another admin account
//   3. Target user must exist and be active
// ─────────────────────────────────────────────────────────────────────────────

const startImpersonationSchema = z.object({
  reason: z.string().trim().min(1, 'Reason is required').max(500),
}).strict();

router.post('/impersonate/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;

    // Validate reason
    const parsed = startImpersonationSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error : 'Validation failed',
        fields: parsed.error.flatten().fieldErrors,
      });
    }
    const { reason } = parsed.data;

    // Load target user
    const { rows } = await pool.query(
      `SELECT u.id, u.email, u.name, u.role, u.is_active, p.name AS plan
       FROM   users u
       LEFT JOIN plans p ON p.id = u.plan_id
       WHERE  u.id = $1`,
      [userId]
    );

    const target = rows[0];
    if (!target || !target.is_active) {
      return res.status(404).json({
        error  : 'Not found',
        message: 'User not found or has been deactivated',
      });
    }

    // Cannot impersonate another admin
    if (target.role === 'admin') {
      logger.warn(`[impersonate] Admin ${req.user.email} attempted to impersonate admin ${target.email}`);
      return res.status(403).json({
        error  : 'Forbidden',
        message: 'Cannot impersonate admin accounts',
      });
    }

    // Create a unique session token for this impersonation session
    const sessionToken = uuidv4();

    // Resolve IP address (X-Forwarded-For from Railway proxy, or direct)
    const ipAddress = (req.headers['x-forwarded-for'] ?? req.ip ?? '').split(',')[0].trim() || null;

    // Create the audit log row
    await pool.query(
      `INSERT INTO admin_impersonation_log
         (admin_user_id, target_user_id, target_user_email, session_token, reason, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [req.user.id, target.id, target.email, sessionToken, reason, ipAddress]
    );

    // Issue the impersonation JWT
    // role is forced to 'subscriber' — target's plan grants feature access,
    // but admin privileges are never carried into impersonation sessions.
    const impersonationToken = jwt.sign(
      {
        sub             : target.id,
        role            : 'subscriber',
        impersonated    : true,
        impersonated_by : req.user.id,
        session_token   : sessionToken,
      },
      env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    logger.info(`[impersonate] Admin ${req.user.email} started impersonating ${target.email} (session: ${sessionToken})`);

    return res.json({
      ok             : true,
      impersonation_token: impersonationToken,
      target_user    : {
        id   : target.id,
        email: target.email,
        name : target.name,
        plan : target.plan,
      },
      expires_in_seconds: 2 * 60 * 60,
    });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/impersonation-log
//
// Paginated audit log of all impersonation sessions.
//
// Query params:
//   page    — 1-based (default 1)
//   limit   — rows per page (default 25, max 100)
//   user_id — optional: filter by target user
// ─────────────────────────────────────────────────────────────────────────────

router.get('/impersonation-log', async (req, res, next) => {
  try {
    const page    = Math.max(1, parseInt(req.query.page   ?? '1',  10) || 1);
    const limit   = Math.min(100, Math.max(1, parseInt(req.query.limit ?? '25', 10) || 25));
    const userId  = req.query.user_id ?? null;
    const offset  = (page - 1) * limit;

    const params = [];
    let   whereClause = '';

    if (userId) {
      params.push(userId);
      whereClause = `WHERE il.target_user_id = $${params.length}`;
    }

    const { rows: [countRow] } = await pool.query(
      `SELECT COUNT(il.id)::int AS total
       FROM admin_impersonation_log il
       ${whereClause}`,
      params
    );

    const dataParams = [...params, limit, offset];
    const { rows } = await pool.query(
      `SELECT
         il.id,
         il.admin_user_id,
         il.target_user_id,
         il.target_user_email,
         il.reason,
         il.started_at,
         il.ended_at,
         il.ended_normally,
         il.ip_address,
         il.actions_taken,
         json_build_object(
           'id',    au.id,
           'email', au.email,
           'name',  au.name
         ) AS admin_user,
         json_build_object(
           'id',    tu.id,
           'email', tu.email,
           'name',  tu.name
         ) AS target_user
       FROM admin_impersonation_log il
       LEFT JOIN users au ON au.id = il.admin_user_id
       LEFT JOIN users tu ON tu.id = il.target_user_id
       ${whereClause}
       ORDER BY il.started_at DESC
       LIMIT $${dataParams.length - 1}
       OFFSET $${dataParams.length}`,
      dataParams
    );

    const total      = countRow?.total ?? 0;
    const totalPages = Math.ceil(total / limit);

    return res.json({
      log: rows,
      pagination: {
        page,
        limit,
        total,
        total_pages: totalPages,
        has_next    : page < totalPages,
        has_prev    : page > 1,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/analytics-diag
//
// Raw analytics counts — admin only, used to diagnose pipeline issues.
// Returns sessions, plays, viewer counts and the last 20 sessions.
// ─────────────────────────────────────────────────────────────────────────────

router.get('/analytics-diag', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    // ── 1. Global totals ─────────────────────────────────────────────────
    const { rows: [totals] } = await pool.query(`
      SELECT
        COUNT(*)                                          AS total_sessions,
        COALESCE(SUM(play_count), 0)                      AS total_play_events,
        COUNT(*) FILTER (WHERE play_count > 0)            AS sessions_with_play,
        COUNT(DISTINCT viewer_id)                         AS distinct_viewers
      FROM analytics_sessions
    `);

    // ── 2. Per-video summary ──────────────────────────────────────────────
    const { rows: videos } = await pool.query(`
      SELECT v.id, v.title, v.total_plays, v.unique_viewers, v.avg_watch_pct,
             COUNT(s.id)                                  AS session_rows,
             COALESCE(SUM(s.play_count), 0)               AS session_play_sum,
             COUNT(s.id) FILTER (WHERE s.play_count > 0)  AS sessions_with_play
      FROM   videos v
      LEFT JOIN analytics_sessions s ON s.video_id = v.id
      WHERE  v.is_active = TRUE
      GROUP  BY v.id, v.title, v.total_plays, v.unique_viewers, v.avg_watch_pct
      ORDER  BY v.created_at DESC
      LIMIT  20
    `);

    // ── 3. Most recent 20 sessions ────────────────────────────────────────
    const { rows: recent } = await pool.query(`
      SELECT s.id, s.video_id, s.play_count, s.max_watch_pct,
             s.total_watch_seconds, s.started_at, s.ended_at,
             s.device_type, s.page_url
      FROM   analytics_sessions s
      ORDER  BY s.started_at DESC
      LIMIT  20
    `);

    // ── 4. Viewer count ───────────────────────────────────────────────────
    const { rows: [vcount] } = await pool.query(
      `SELECT COUNT(*) AS total_viewers FROM viewers`
    );

    // ── 5. Ping-handler smoke test ────────────────────────────────────────
    // Directly run the same UPDATE the /ping endpoint runs against the
    // most recent session. If this fails or returns play_count=0 → DB bug.
    // If it works → embed JS is not sending the ping at all.
    let pingTest = { ran: false };
    if (recent.length > 0) {
      const s = recent[0];
      try {
        const { rows: [before] } = await pool.query(
          `SELECT play_count FROM analytics_sessions WHERE id = $1`, [s.id]
        );
        const { rows: [updated] } = await pool.query(
          `UPDATE analytics_sessions SET
             play_count          = play_count + 1,
             max_watch_pct       = GREATEST(max_watch_pct, 5),
             total_watch_seconds = GREATEST(total_watch_seconds, 3)
           WHERE id = $1
           RETURNING play_count`,
          [s.id]
        );
        // Roll back the test increment immediately
        await pool.query(
          `UPDATE analytics_sessions SET
             play_count          = play_count - 1,
             max_watch_pct       = $2,
             total_watch_seconds = $3
           WHERE id = $1`,
          [s.id, before.play_count === 0 ? 0 : s.max_watch_pct, s.total_watch_seconds]
        );
        pingTest = {
          ran           : true,
          session_id    : s.id,
          play_count_before: parseInt(before.play_count, 10),
          play_count_after : parseInt(updated.play_count, 10),
          db_update_works  : parseInt(updated.play_count, 10) === parseInt(before.play_count, 10) + 1,
        };
      } catch (e) {
        pingTest = { ran: true, error: e.message };
      }
    }

    return res.json({
      totals: {
        total_sessions    : parseInt(totals.total_sessions,     10),
        total_play_events : parseInt(totals.total_play_events,  10) || 0,
        sessions_with_play: parseInt(totals.sessions_with_play, 10),
        distinct_viewers  : parseInt(totals.distinct_viewers,   10),
        total_viewers_row : parseInt(vcount.total_viewers,      10),
      },
      ping_db_smoke_test: pingTest,
      videos,
      recent_sessions: recent,
    });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/contact-webhook-status
//
// Returns live pause state + queued count. Polled by the frontend every 30 s.
// ─────────────────────────────────────────────────────────────────────────────

router.get('/contact-webhook-status', async (req, res, next) => {
  try {
    const status = await getContactWebhookStatus();
    return res.json(status);
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/admin/contact-webhook/unpause
//
// Clears the pause flag without resending queued entries.
// ─────────────────────────────────────────────────────────────────────────────

router.post('/contact-webhook/unpause', async (req, res, next) => {
  try {
    await unpauseWebhook();
    logger.info(`[admin] Contact webhook unpaused by user ${req.user.id}`);
    return res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/admin/contact-webhook/resend-queued
//
// Unpauses the webhook and re-fires every queued entry in order.
// Returns { sent, failed, total, nowPaused }.
// ─────────────────────────────────────────────────────────────────────────────

router.post('/contact-webhook/resend-queued', async (req, res, next) => {
  try {
    const result = await resendQueuedWebhooks();
    logger.info(
      `[admin] Contact webhook resend by user ${req.user.id}` +
      ` — sent=${result.sent} failed=${result.failed} total=${result.total}`
    );
    return res.json(result);
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/admin/contact-webhook/resend-failed
//
// Re-fires every entry currently marked 'failed', in order.
// Does NOT auto-pause on failure — manual recovery, tries all entries.
// Returns { sent, failed, total }.
// ─────────────────────────────────────────────────────────────────────────────

router.post('/contact-webhook/resend-failed', async (req, res, next) => {
  try {
    const result = await resendFailedWebhooks();
    logger.info(
      `[admin] Contact webhook resend-failed by user ${req.user.id}` +
      ` — sent=${result.sent} failed=${result.failed} total=${result.total}`
    );
    return res.json(result);
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/admin/contact-webhook/retry-entry/:id
//
// Re-fires a single log entry by ID using current webhook settings.
// Does NOT auto-pause on failure. Returns { ok, statusCode, errorMessage }.
// ─────────────────────────────────────────────────────────────────────────────

router.post('/contact-webhook/retry-entry/:id', async (req, res, next) => {
  try {
    const result = await retryWebhookEntry(req.params.id);
    logger.info(`[admin] Retry entry id=${req.params.id} by user ${req.user.id} → ok=${result.ok}`);
    return res.json(result);
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/admin/contact-webhook/discard-entry/:id
//
// Marks a queued entry as 'discarded'. No-op for other statuses.
// Returns { ok: boolean }.
// ─────────────────────────────────────────────────────────────────────────────

router.post('/contact-webhook/discard-entry/:id', async (req, res, next) => {
  try {
    const result = await discardWebhookEntry(req.params.id);
    if (!result.ok) {
      return res.status(400).json({ ok: false, message: 'Entry not found or not queued' });
    }
    logger.info(`[admin] Discarded entry id=${req.params.id} by user ${req.user.id}`);
    return res.json(result);
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/contact-webhook-log
//
// Paginated log of every outbound contact webhook fire.
//
// Query params:
//   page    — 1-based (default 1)
//   limit   — rows per page (default 50, max 200)
//   status  — optional: 'sent' | 'failed' | 'queued' | 'discarded'
// ─────────────────────────────────────────────────────────────────────────────

router.get('/contact-webhook-log', async (req, res, next) => {
  try {
    const page   = Math.max(1, parseInt(req.query.page  ?? '1',   10) || 1);
    const limit  = Math.min(200, Math.max(1, parseInt(req.query.limit ?? '50', 10) || 50));
    const status = req.query.status ?? null;
    const offset = (page - 1) * limit;

    const params = [];
    const conditions = [];

    if (status === 'sent' || status === 'failed' || status === 'queued' || status === 'discarded') {
      params.push(status);
      conditions.push(`cwl.status = $${params.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const { rows: [countRow] } = await pool.query(
      `SELECT COUNT(cwl.id)::int AS total
       FROM contact_webhook_log cwl
       ${whereClause}`,
      params
    );

    const dataParams = [...params, limit, offset];
    const { rows } = await pool.query(
      `SELECT
         cwl.id,
         cwl.event_key,
         cwl.user_id,
         cwl.url_sent_to,
         cwl.params_sent,
         cwl.status,
         cwl.response_status,
         cwl.response_body,
         cwl.error_message,
         cwl.sent_at,
         cwl.response_at,
         u.name  AS user_name,
         u.email AS user_email
       FROM contact_webhook_log cwl
       LEFT JOIN users u ON u.id = cwl.user_id
       ${whereClause}
       ORDER BY cwl.sent_at DESC
       LIMIT $${dataParams.length - 1}
       OFFSET $${dataParams.length}`,
      dataParams
    );

    const total      = countRow?.total ?? 0;
    const totalPages = Math.ceil(total / limit);

    return res.json({
      log: rows,
      pagination: {
        page,
        limit,
        total,
        total_pages: totalPages,
        has_next    : page < totalPages,
        has_prev    : page > 1,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PROMOTION VIDEOS
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/admin/promotion-videos — list all for admin panel
router.get('/promotion-videos', async (req, res, next) => {
  try {
    const videos = await getAdminPromotionVideos();
    return res.json({ videos });
  } catch (err) { next(err); }
});

// POST /api/admin/promotion-videos — create a new promotion video
router.post('/promotion-videos', async (req, res, next) => {
  try {
    const { url, title } = req.body ?? {};
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ message: 'url is required' });
    }
    try { new URL(url); } catch {
      return res.status(400).json({ message: 'Invalid URL' });
    }
    const promo = await createPromotionVideo(req.user.id, url.trim(), title);
    logger.info(`[admin] Promotion video created by ${req.user.id}: ${promo.id}`);
    return res.status(201).json({ promo });
  } catch (err) { next(err); }
});

// PATCH /api/admin/promotion-videos/:id/visibility — change visibility tier
router.patch('/promotion-videos/:id/visibility', async (req, res, next) => {
  try {
    const { visibility } = req.body ?? {};
    const updated = await updateVisibility(req.params.id, visibility);
    if (!updated) return res.status(404).json({ message: 'Promotion video not found' });
    logger.info(`[admin] Promotion ${req.params.id} visibility → ${visibility} by ${req.user.id}`);
    return res.json({ promo: updated });
  } catch (err) {
    if (err.message === 'Invalid visibility value') {
      return res.status(400).json({ message: err.message });
    }
    next(err);
  }
});

// PATCH /api/admin/promotion-videos/reorder — bulk reorder
router.patch('/promotion-videos/reorder', async (req, res, next) => {
  try {
    const { ordered_ids } = req.body ?? {};
    if (!Array.isArray(ordered_ids)) {
      return res.status(400).json({ message: 'ordered_ids must be an array' });
    }
    await reorderPromotionVideos(ordered_ids);
    return res.json({ ok: true });
  } catch (err) { next(err); }
});

// DELETE /api/admin/promotion-videos/:id — delete promotion video
router.delete('/promotion-videos/:id', async (req, res, next) => {
  try {
    const deleted = await deletePromotionVideo(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Promotion video not found' });
    logger.info(`[admin] Promotion ${req.params.id} deleted by ${req.user.id}`);
    return res.json({ ok: true });
  } catch (err) { next(err); }
});

// GET /api/admin/users/:userId/promo-hidden — get hidden promotion IDs for a user
router.get('/users/:userId/promo-hidden', async (req, res, next) => {
  try {
    const hiddenIds = await getUserPromoHiddenIds(req.params.userId);
    return res.json({ hidden_ids: [...hiddenIds] });
  } catch (err) { next(err); }
});

// PATCH /api/admin/users/:userId/promo-hidden — set hidden state for a promo+user pair
// Body: { promotion_video_id, hidden: boolean }
router.patch('/users/:userId/promo-hidden', async (req, res, next) => {
  try {
    const { promotion_video_id, hidden } = req.body ?? {};
    if (!promotion_video_id || typeof hidden !== 'boolean') {
      return res.status(400).json({ message: 'promotion_video_id and hidden (bool) required' });
    }
    await setUserPromoHidden(req.params.userId, promotion_video_id, hidden);
    logger.info(
      `[admin] Promo ${promotion_video_id} ${hidden ? 'hidden' : 'shown'} for user ${req.params.userId} by ${req.user.id}`
    );
    return res.json({ ok: true });
  } catch (err) { next(err); }
});

// Export the action logging helper for use by other route handlers
// (e.g., video routes can call this when a video is deleted during impersonation)
module.exports = router;
module.exports._logImpersonationAction = _logAction;
