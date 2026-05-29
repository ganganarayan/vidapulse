'use strict';

/**
 * User routes — /api/user/*
 *
 * Module 6 endpoints: presence heartbeat, in-app notifications, preferences.
 *
 *   POST /api/user/heartbeat            — set is_online=TRUE, update last_seen_at
 *   GET  /api/user/notifications        — unread in_app_notifications (limit 20)
 *   PUT  /api/user/notifications/:id/read — mark one notification read
 *   PUT  /api/user/notifications/read-all — mark all unread notifications read
 *   PUT  /api/user/preferences          — update user preferences (insight_emails_enabled etc.)
 */

const express      = require('express');
const { z }        = require('zod');
const router       = express.Router();
const { pool }     = require('../config/database');
const logger       = require('../config/logger');
const { requireAuth }        = require('../middleware/requireAuth');
const { planGate }           = require('../middleware/planGate');

// ─────────────────────────────────────────────────────────────────────────
// GET /api/user/me
//
// Returns the authenticated user's full profile.
// Called by the frontend AuthProvider on app load to hydrate user context.
//
// Includes: plan details, video count, onboarding state, preferences.
// Uses req.user.id from requireAuth (fresh DB lookup already done).
// ─────────────────────────────────────────────────────────────────────────

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT
          u.id,
          u.email,
          u.name,
          u.role,
          u.onboarding_completed,
          u.wow_moment_seen,
          u.first_video_id,
          u.created_at,
          u.plan_expires_at,
          u.plan_enrolled_at,
          u.razorpay_subscription_id,
          p.name          AS plan,
          p.video_limit,
          p.display_name  AS plan_display_name,
          (
            SELECT COUNT(*)
            FROM   videos v
            WHERE  v.user_id   = u.id
              AND  v.is_active = TRUE
          )               AS video_count,
          up.theme,
          up.timezone,
          up.email_notifications,
          up.insight_emails_enabled
       FROM   users u
       LEFT   JOIN plans           p  ON p.id  = u.plan_id
       LEFT   JOIN user_preferences up ON up.user_id = u.id
       WHERE  u.id = $1`,
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const u = rows[0];
    return res.json({
      user: {
        id                  : u.id,
        email               : u.email,
        name                : u.name,
        role                : u.role,
        plan                : u.plan,
        plan_display_name   : u.plan_display_name,
        video_limit         : u.video_limit,
        video_count         : parseInt(u.video_count, 10),
        onboarding_completed: u.onboarding_completed,
        wow_moment_seen          : u.wow_moment_seen,
        first_video_id           : u.first_video_id,
        created_at               : u.created_at,
        plan_expires_at          : u.plan_expires_at    ?? null,
        plan_enrolled_at         : u.plan_enrolled_at   ?? null,
        razorpay_subscription_id : u.razorpay_subscription_id ?? null,
        preferences              : {
          theme                  : u.theme,
          timezone               : u.timezone,
          email_notifications    : u.email_notifications,
          insight_emails_enabled : u.insight_emails_enabled,
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────
// POST /api/user/heartbeat
//
// Called by the frontend every 30 seconds while the user has a tab open.
// MUST respond in < 50ms — DB update is fire-and-forget (non-blocking).
//
// Sets: users.is_online = TRUE, last_seen_at = NOW(), last_seen_screen
// The online_cleanup job (every 3 min) clears is_online for idle users.
//
// Body (optional): { screen: 'dashboard' | 'video_analytics' | 'settings' | ... }
// ─────────────────────────────────────────────────────────────────────────

router.post('/heartbeat', requireAuth, (req, res) => {
  // Respond immediately — DO NOT await the DB update
  res.json({ ok: true });

  // Fire-and-forget presence update
  const screen = typeof req.body?.screen === 'string'
    ? req.body.screen.slice(0, 100)
    : null;

  pool.query(
    `UPDATE users
     SET is_online        = TRUE,
         last_seen_at     = NOW(),
         last_seen_screen = $1,
         updated_at       = NOW()
     WHERE id = $2`,
    [screen, req.user.id]
  ).catch(err => logger.error(`[user/heartbeat] DB update failed for user ${req.user.id}: ${err.message}`));
});

// ─────────────────────────────────────────────────────────────────────────
// GET /api/user/notifications
//
// Returns up to 20 unread in_app_notifications for the authenticated user,
// newest first. The frontend notification bell polls this every 30 seconds.
//
// Response:
//   {
//     notifications: [ { id, video_id, insight_type, template_key, headline,
//                         dashboard_url, teaser_variable_1, teaser_variable_2,
//                         created_at } ],
//     unread_count: number
//   }
// ─────────────────────────────────────────────────────────────────────────

router.get('/notifications', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT id,
              video_id,
              insight_type,
              template_key,
              headline,
              dashboard_url,
              teaser_variable_1,
              teaser_variable_2,
              created_at
       FROM   in_app_notifications
       WHERE  user_id  = $1
         AND  is_read  = FALSE
       ORDER  BY created_at DESC
       LIMIT  20`,
      [req.user.id]
    );

    return res.json({
      notifications: rows,
      unread_count : rows.length,
    });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────
// PUT /api/user/notifications/:id/read
//
// Marks a single notification as read. The frontend calls this when the user
// clicks a notification in the slide-out panel.
// Silently succeeds even if the notification doesn't belong to the user
// (no information leak — 200 either way).
// ─────────────────────────────────────────────────────────────────────────

router.put('/notifications/:id/read', requireAuth, async (req, res, next) => {
  try {
    const notifId = parseInt(req.params.id, 10);
    if (isNaN(notifId)) {
      return res.status(400).json({ error: 'Invalid notification ID' });
    }

    await pool.query(
      `UPDATE in_app_notifications
       SET is_read = TRUE, read_at = NOW()
       WHERE id = $1 AND user_id = $2`,
      [notifId, req.user.id]
    );

    return res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────
// PUT /api/user/notifications/read-all
//
// Marks ALL unread notifications for the user as read.
// Called when the user opens the notification panel.
// ─────────────────────────────────────────────────────────────────────────

router.put('/notifications/read-all', requireAuth, async (req, res, next) => {
  try {
    const { rowCount } = await pool.query(
      `UPDATE in_app_notifications
       SET is_read = TRUE, read_at = NOW()
       WHERE user_id = $1 AND is_read = FALSE`,
      [req.user.id]
    );

    return res.json({ ok: true, marked_read: rowCount });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────
// PUT /api/user/preferences
//
// Updates user preferences. Currently supports:
//   insight_emails_enabled — toggle whether divineleads sends insight emails
//   theme                  — 'dark' | 'light'
//   timezone               — IANA timezone string
//   email_notifications    — boolean (general notification toggle)
//
// Only fields present in the request body are updated (partial update).
// Returns the full updated preferences object.
// ─────────────────────────────────────────────────────────────────────────

const preferencesSchema = z.object({
  insight_emails_enabled: z.boolean().optional(),
  theme                 : z.enum(['dark', 'light']).optional(),
  timezone              : z.string().max(100).optional(),
  email_notifications   : z.boolean().optional(),
}).strict();

router.put('/preferences', requireAuth, async (req, res, next) => {
  try {
    const parseResult = preferencesSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error  : 'Validation failed',
        fields : parseResult.error.flatten().fieldErrors,
      });
    }

    const updates = parseResult.data;
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        error  : 'No fields to update',
        message: 'Provide at least one preference field',
      });
    }

    // Build dynamic SET clause — only update fields provided
    const setClauses = [];
    const values     = [];
    let   paramIdx   = 1;

    if (typeof updates.insight_emails_enabled !== 'undefined') {
      setClauses.push(`insight_emails_enabled = $${paramIdx++}`);
      values.push(updates.insight_emails_enabled);
    }
    if (typeof updates.theme !== 'undefined') {
      setClauses.push(`theme = $${paramIdx++}`);
      values.push(updates.theme);
    }
    if (typeof updates.timezone !== 'undefined') {
      setClauses.push(`timezone = $${paramIdx++}`);
      values.push(updates.timezone);
    }
    if (typeof updates.email_notifications !== 'undefined') {
      setClauses.push(`email_notifications = $${paramIdx++}`);
      values.push(updates.email_notifications);
    }

    setClauses.push(`updated_at = NOW()`);
    values.push(req.user.id);  // for WHERE user_id = $N

    await pool.query(
      `UPDATE user_preferences
       SET ${setClauses.join(', ')}
       WHERE user_id = $${paramIdx}`,
      values
    );

    // Return full updated preferences
    const { rows: [prefs] } = await pool.query(
      `SELECT insight_emails_enabled,
              theme,
              timezone,
              email_notifications
       FROM   user_preferences
       WHERE  user_id = $1`,
      [req.user.id]
    );

    logger.debug(`[user/preferences] Updated for user ${req.user.id}: ${JSON.stringify(updates)}`);
    return res.json({ preferences: prefs });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────
// GET /api/user/overview
//
// Aggregate stats across all of the authenticated user's active videos.
// Four engagement metrics computed from analytics_sessions:
//   total_views    — all page/session loads (including non-players)
//   unique_views   — distinct viewers (any visit)
//   total_viewers  — sessions where the video was actually played
//   unique_viewers — distinct viewers who played
// Used by the Overview dashboard page.
// ─────────────────────────────────────────────────────────────────────────

router.get('/overview', requireAuth, async (req, res, next) => {
  try {
    // Total active video count
    const { rows: [vidRow] } = await pool.query(
      `SELECT COUNT(*) AS total_videos
       FROM   videos
       WHERE  user_id = $1 AND is_active = TRUE`,
      [req.user.id]
    );

    // Session-level engagement aggregates across all of the user's active videos
    const { rows: [agg] } = await pool.query(
      `SELECT
         COUNT(s.id)                                                       AS total_views,
         COUNT(DISTINCT s.viewer_id)                                       AS unique_views,
         COUNT(s.id)    FILTER (WHERE s.play_count > 0)                   AS total_viewers,
         COUNT(DISTINCT s.viewer_id) FILTER (WHERE s.play_count > 0)      AS unique_viewers,
         COALESCE(SUM(s.total_watch_seconds), 0)                           AS total_watch_seconds
       FROM   analytics_sessions s
       JOIN   videos v ON s.video_id = v.id
       WHERE  v.user_id = $1 AND v.is_active = TRUE`,
      [req.user.id]
    );

    // Top 5 videos by play sessions (most engaged)
    const { rows: topVideos } = await pool.query(
      `SELECT v.id,
              v.title,
              v.thumbnail_url,
              v.source_type,
              COALESCE(vstats.total_plays, 0)         AS total_plays,
              COALESCE(vstats.unique_viewers, 0)       AS unique_viewers,
              COALESCE(vstats.avg_watch_pct, 0)        AS avg_watch_pct
       FROM   videos v
       LEFT JOIN LATERAL (
         SELECT
           COUNT(*) FILTER (WHERE play_count > 0)                   AS total_plays,
           COUNT(DISTINCT viewer_id) FILTER (WHERE play_count > 0)  AS unique_viewers,
           ROUND(
             (AVG(max_watch_pct) FILTER (WHERE play_count > 0))::numeric, 1
           )                                                         AS avg_watch_pct
         FROM analytics_sessions
         WHERE video_id = v.id
       ) vstats ON TRUE
       WHERE  v.user_id = $1 AND v.is_active = TRUE
       ORDER  BY vstats.total_plays DESC NULLS LAST
       LIMIT  5`,
      [req.user.id]
    );

    return res.json({
      total_videos        : parseInt(vidRow.total_videos,    10),
      total_views         : parseInt(agg.total_views,        10),
      unique_views        : parseInt(agg.unique_views,       10),
      total_viewers       : parseInt(agg.total_viewers,      10),
      unique_viewers      : parseInt(agg.unique_viewers,     10),
      total_watch_seconds : parseFloat(agg.total_watch_seconds),
      top_videos          : topVideos,
    });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────
// GET /api/user/events
//
// Returns the 200 most-recent analytics events across all of the
// authenticated user's videos.
// ─────────────────────────────────────────────────────────────────────────

router.get('/events', requireAuth, planGate('events'), async (req, res, next) => {
  const limit  = Math.min(parseInt(req.query.limit  || '200', 10), 500);
  const offset = parseInt(req.query.offset || '0', 10);
  try {
    const { rows } = await pool.query(
      `SELECT ae.id,
              ae.event_type,
              ae.occurred_at,
              ae.session_id,
              ae.video_position,
              v.title AS video_title,
              v.id    AS video_id
       FROM   analytics_events ae
       LEFT   JOIN analytics_sessions s ON ae.session_id = s.id
       JOIN   videos v                  ON ae.video_id   = v.id
       WHERE  v.user_id  = $1
       ORDER  BY ae.occurred_at DESC
       LIMIT  $2 OFFSET $3`,
      [req.user.id, limit, offset]
    );
    return res.json({ events: rows });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────
// GET /api/user/funnel?video_id=<uuid>
//
// Returns 4-step funnel counts derived from analytics_sessions.
// If video_id is supplied only that video's sessions are counted.
// Also returns the user's video list for the selector dropdown.
// ─────────────────────────────────────────────────────────────────────────

router.get('/funnel', requireAuth, planGate('events'), async (req, res, next) => {
  const { video_id } = req.query;
  try {
    const params      = [req.user.id];
    const videoClause = video_id ? 'AND s.video_id = $2' : '';
    if (video_id) params.push(video_id);

    const { rows: [s] } = await pool.query(
      `SELECT
         COUNT(*)                                       AS page_loads,
         COUNT(*) FILTER (WHERE s.play_count > 0)      AS started,
         COUNT(*) FILTER (WHERE s.max_watch_pct >= 50) AS reached_50,
         COUNT(*) FILTER (WHERE s.reached_end = TRUE)  AS completed
       FROM   analytics_sessions s
       JOIN   videos v ON s.video_id = v.id
       WHERE  v.user_id = $1 ${videoClause}`,
      params
    );

    const { rows: videos } = await pool.query(
      `SELECT id, title
       FROM   videos
       WHERE  user_id = $1 AND is_active = TRUE
       ORDER  BY created_at DESC`,
      [req.user.id]
    );

    const pl = parseInt(s.page_loads, 10);
    const pct = (n) => (pl ? Math.round(parseInt(n, 10) / pl * 100) : 0);

    return res.json({
      steps: [
        { label: 'Landed on Page',  count: pl,                       pct: 100 },
        { label: 'Started Video',   count: parseInt(s.started,   10), pct: pct(s.started)   },
        { label: 'Reached 50%',     count: parseInt(s.reached_50, 10), pct: pct(s.reached_50) },
        { label: 'Completed Video', count: parseInt(s.completed, 10), pct: pct(s.completed) },
      ],
      videos,
    });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────
// GET /api/user/alert-prefs
// PUT /api/user/alert-prefs
//
// Stores and retrieves the user's alert notification toggle preferences.
// ─────────────────────────────────────────────────────────────────────────

const ALERT_DEFAULTS = {
  traffic_spike   : false,
  sudden_dropoff  : false,
  viral_moment    : false,
  new_domain_embed: false,
  weekly_digest   : false,
  begins_to_watch : false,
  completes_video : false,
  watches_90_pct  : false,
  cta_click       : false,
};

router.get('/alert-prefs', requireAuth, planGate('alerts'), async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT COALESCE(alert_prefs, '{}') AS alert_prefs
       FROM   user_preferences
       WHERE  user_id = $1`,
      [req.user.id]
    );
    const prefs = { ...ALERT_DEFAULTS, ...(rows[0]?.alert_prefs ?? {}) };
    return res.json({ prefs });
  } catch (err) {
    next(err);
  }
});

router.put('/alert-prefs', requireAuth, planGate('alerts'), async (req, res, next) => {
  try {
    const { prefs } = req.body ?? {};
    if (!prefs || typeof prefs !== 'object' || Array.isArray(prefs)) {
      return res.status(400).json({ error: 'prefs object required' });
    }
    const safe = Object.fromEntries(
      Object.entries(prefs).filter(([k]) => Object.hasOwn(ALERT_DEFAULTS, k))
    );
    await pool.query(
      `UPDATE user_preferences
       SET    alert_prefs = COALESCE(alert_prefs, '{}') || $1::jsonb
       WHERE  user_id = $2`,
      [JSON.stringify(safe), req.user.id]
    );
    const merged = { ...ALERT_DEFAULTS, ...safe };
    return res.json({ ok: true, prefs: merged });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────
// GET /api/user/audience
//
// Unified audience overview across all of the user's active videos.
//
// Returns:
//   stats.unique_viewers  — distinct viewers (any session)
//   stats.countries       — distinct non-null country_codes
//   stats.device_types    — distinct device types (excluding 'unknown')
//   viewers               — most-recent session per viewer, sorted by last_seen DESC
//                           (empty array for free plan users — gated flag set true)
//   gated                 — true when viewer list is gated behind Starter upgrade
//
// Plan gate: stats are visible to all plans.
//            Viewer list is Starter+ only.
// ─────────────────────────────────────────────────────────────────────────

router.get('/audience', requireAuth, async (req, res, next) => {
  try {
    const isPaid = ['starter', 'pro', 'admin_lifetime'].includes(req.user.plan);

    // Aggregate stats (all plans)
    const { rows: [stats] } = await pool.query(
      `SELECT
         COUNT(DISTINCT s.viewer_id)                                                AS unique_viewers,
         COUNT(DISTINCT s.country_code) FILTER (WHERE s.country_code IS NOT NULL)  AS countries,
         COUNT(DISTINCT s.device_type)
           FILTER (WHERE s.device_type IS NOT NULL
                     AND  s.device_type <> 'unknown')                              AS device_types
       FROM analytics_sessions s
       JOIN videos v ON s.video_id = v.id
       WHERE v.user_id = $1 AND v.is_active = TRUE`,
      [req.user.id]
    );

    const statResult = {
      unique_viewers: parseInt(stats.unique_viewers, 10) || 0,
      countries     : parseInt(stats.countries,      10) || 0,
      device_types  : parseInt(stats.device_types,   10) || 0,
    };

    // Free plan — return stats only, viewer list gated
    if (!isPaid) {
      return res.json({ stats: statResult, viewers: [], gated: true });
    }

    // Recent viewers: most recent session per unique viewer (Starter+)
    const { rows: viewerRows } = await pool.query(
      `SELECT
         sub.viewer_id,
         sub.cookie_id,
         sub.country_name,
         sub.country_code,
         sub.device_type,
         sub.video_title,
         sub.video_id,
         sub.watch_seconds,
         sub.last_seen
       FROM (
         SELECT DISTINCT ON (s.viewer_id)
           s.viewer_id,
           vr.cookie_id,
           s.country_name,
           s.country_code,
           s.device_type,
           v.title               AS video_title,
           v.id                  AS video_id,
           s.total_watch_seconds AS watch_seconds,
           s.started_at          AS last_seen
         FROM analytics_sessions s
         JOIN viewers vr ON vr.id = s.viewer_id
         JOIN videos   v ON v.id  = s.video_id
         WHERE v.user_id = $1 AND v.is_active = TRUE
         ORDER BY s.viewer_id, s.started_at DESC
       ) sub
       ORDER BY sub.last_seen DESC
       LIMIT 100`,
      [req.user.id]
    );

    const viewers = viewerRows.map((row, idx) => ({
      viewer_id   : row.viewer_id,
      short_id    : (row.cookie_id ?? row.viewer_id).slice(0, 8).toUpperCase(),
      country_name: row.country_name ?? null,
      country_code: row.country_code ?? null,
      device_type : row.device_type  ?? 'unknown',
      video_title : row.video_title,
      video_id    : row.video_id,
      watch_seconds: parseFloat(row.watch_seconds) || 0,
      last_seen   : row.last_seen,
    }));

    return res.json({ stats: statResult, viewers, gated: false });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
