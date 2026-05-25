'use strict';

/**
 * Reports API — /api/reports
 *
 *   GET  /api/reports/viewer-journey     — instant CSV download of all viewer sessions
 *   GET  /api/reports/events             — CSV download of analytics_events
 *   GET  /api/reports/list               — list user's generated reports
 *   POST /api/reports/generate           — queue a background report (returns report_id)
 *   GET  /api/reports/download/:id       — stream CSV when report is completed
 */

const express        = require('express');
const router         = express.Router();
const { pool }       = require('../config/database');
const logger         = require('../config/logger');
const { requireAuth }= require('../middleware/requireAuth');

// ─────────────────────────────────────────────────────────────────────────
// CSV helpers
// ─────────────────────────────────────────────────────────────────────────

function csvEscape(v) {
  if (v === null || v === undefined) return '';
  const s = String(v);
  return (s.includes(',') || s.includes('"') || s.includes('\n'))
    ? `"${s.replace(/"/g, '""')}"` : s;
}

function buildCsv(headers, rows) {
  return [
    headers.join(','),
    ...rows.map(r => headers.map(h => csvEscape(r[h])).join(',')),
  ].join('\n');
}

// ─────────────────────────────────────────────────────────────────────────
// GET /api/reports/viewer-journey
// Instant CSV download — every viewer session for this user's videos.
// ─────────────────────────────────────────────────────────────────────────

router.get('/viewer-journey', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT
         v.title               AS video,
         s.started_at          AS session_start,
         s.ended_at            AS session_end,
         ROUND(s.total_watch_seconds::numeric, 1) AS watch_seconds,
         ROUND(s.max_watch_pct::numeric, 1)       AS max_watch_pct,
         s.reached_end         AS completed,
         s.play_count,
         s.device_type,
         s.browser,
         s.os,
         s.country_name        AS country,
         s.city,
         s.page_url            AS page,
         s.referrer_url        AS referrer,
         s.utm_source,
         s.utm_medium,
         s.utm_campaign
       FROM   analytics_sessions s
       JOIN   videos v ON s.video_id = v.id
       WHERE  v.user_id = $1
       ORDER  BY s.started_at DESC
       LIMIT  10000`,
      [req.user.id]
    );

    const HEADERS = [
      'video','session_start','session_end','watch_seconds','max_watch_pct',
      'completed','play_count','device_type','browser','os','country','city',
      'page','referrer','utm_source','utm_medium','utm_campaign',
    ];

    const csv  = buildCsv(HEADERS, rows);
    const date = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="viewer-journey-${date}.csv"`);
    return res.send(csv);
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────
// GET /api/reports/events
// Instant CSV download — all analytics_events for this user's videos.
// ─────────────────────────────────────────────────────────────────────────

router.get('/events', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT
         ae.occurred_at,
         ae.event_type,
         v.title          AS video,
         ae.video_position,
         ae.session_id
       FROM   analytics_events ae
       LEFT   JOIN analytics_sessions s ON ae.session_id = s.id
       JOIN   videos v                  ON ae.video_id   = v.id
       WHERE  v.user_id = $1
       ORDER  BY ae.occurred_at DESC
       LIMIT  50000`,
      [req.user.id]
    );

    const HEADERS = ['occurred_at','event_type','video','video_position','session_id'];
    const csv  = buildCsv(HEADERS, rows);
    const date = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="events-${date}.csv"`);
    return res.send(csv);
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────
// Allowed metrics and their SQL SELECT expressions
// ─────────────────────────────────────────────────────────────────────────

const METRIC_EXPRS = {
  total_views     : `COUNT(s.id)                                                         AS total_views`,
  unique_views    : `COUNT(DISTINCT s.viewer_id)                                         AS unique_views`,
  total_viewers   : `COUNT(s.id) FILTER (WHERE s.play_count > 0)                        AS total_viewers`,
  unique_viewers  : `COUNT(DISTINCT s.viewer_id) FILTER (WHERE s.play_count > 0)        AS unique_viewers`,
  avg_watch_pct   : `ROUND((AVG(s.max_watch_pct) FILTER (WHERE s.play_count > 0))::numeric, 1) AS avg_watch_pct`,
  play_rate       : `ROUND(COUNT(s.id) FILTER (WHERE s.play_count > 0) * 100.0 / NULLIF(COUNT(s.id), 0), 1) AS play_rate`,
  completion_rate : `ROUND(COUNT(s.id) FILTER (WHERE s.reached_end) * 100.0 / NULLIF(COUNT(s.id) FILTER (WHERE s.play_count > 0), 0), 1) AS completion_rate`,
  total_watch_seconds: `COALESCE(SUM(s.total_watch_seconds), 0)                         AS total_watch_seconds`,
};

const VALID_DATE_RANGES = {
  '7_days' : `AND s.started_at >= NOW() - INTERVAL '7 days'`,
  '30_days': `AND s.started_at >= NOW() - INTERVAL '30 days'`,
  '90_days': `AND s.started_at >= NOW() - INTERVAL '90 days'`,
  'all_time': '',
};

// ─────────────────────────────────────────────────────────────────────────
// POST /api/reports/generate
// Creates a user_reports row, responds with the report_id, then generates
// the CSV asynchronously in the background.
// ─────────────────────────────────────────────────────────────────────────

router.post('/generate', requireAuth, async (req, res, next) => {
  const { title, metrics, date_range } = req.body ?? {};

  if (!metrics || !Array.isArray(metrics) || metrics.length === 0) {
    return res.status(400).json({ error: 'metrics array required' });
  }

  const safeTitle    = (typeof title === 'string' ? title : 'Custom Report').trim().slice(0, 255) || 'Custom Report';
  const safeDateRange = VALID_DATE_RANGES[date_range] !== undefined ? date_range : '30_days';

  // Only keep metric keys that exist in METRIC_EXPRS
  const safeMetrics = metrics.filter(m => typeof m === 'string' && METRIC_EXPRS[m]);
  if (safeMetrics.length === 0) {
    return res.status(400).json({ error: 'no valid metrics provided', valid: Object.keys(METRIC_EXPRS) });
  }

  try {
    const { rows: [report] } = await pool.query(
      `INSERT INTO user_reports (user_id, title, metrics, date_range, status)
       VALUES ($1, $2, $3::jsonb, $4, 'pending')
       RETURNING id`,
      [req.user.id, safeTitle, JSON.stringify(safeMetrics), safeDateRange]
    );

    res.json({ report_id: report.id, status: 'pending' });

    // Background generation — response already sent
    _generateReport(report.id, req.user.id, safeMetrics, safeDateRange)
      .catch(err => logger.warn(`[reports/generate] bg generation failed for ${report.id}: ${err.message}`));

  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────
// GET /api/reports/list
// Returns up to 50 of the user's most recent reports (any status).
// ─────────────────────────────────────────────────────────────────────────

router.get('/list', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, title, metrics, date_range, status, row_count,
              error_message, created_at, updated_at
       FROM   user_reports
       WHERE  user_id = $1
       ORDER  BY created_at DESC
       LIMIT  50`,
      [req.user.id]
    );
    return res.json({ reports: rows });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────
// GET /api/reports/download/:id
// Streams the CSV for a completed report.
// Returns 409 if the report is still pending/processing.
// ─────────────────────────────────────────────────────────────────────────

router.get('/download/:id', requireAuth, async (req, res, next) => {
  try {
    const { rows: [report] } = await pool.query(
      `SELECT id, title, status, csv_data, created_at
       FROM   user_reports
       WHERE  id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );

    if (!report) return res.status(404).json({ error: 'report_not_found' });
    if (report.status !== 'completed') {
      return res.status(409).json({ error: 'not_ready', status: report.status });
    }
    if (!report.csv_data) return res.status(500).json({ error: 'no_data' });

    const date     = new Date(report.created_at).toISOString().slice(0, 10);
    const filename = `${report.title.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase()}-${date}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(report.csv_data);
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────
// _generateReport — background CSV generation
// Runs after the HTTP response is sent; updates user_reports.status.
//
// Uses a LEFT JOIN with an ON-clause date filter so that videos with
// zero sessions in the selected range still appear in the output (with 0).
// ─────────────────────────────────────────────────────────────────────────

// Maps date_range key → extra JOIN condition for analytics_sessions
const DATE_JOIN_CONDITIONS = {
  '7_days' : `AND s.started_at >= NOW() - INTERVAL '7 days'`,
  '30_days': `AND s.started_at >= NOW() - INTERVAL '30 days'`,
  '90_days': `AND s.started_at >= NOW() - INTERVAL '90 days'`,
  'all_time': '',
};

async function _generateReport(reportId, userId, metrics, dateRange) {
  // Mark as processing immediately
  await pool.query(
    `UPDATE user_reports SET status = 'processing', updated_at = NOW() WHERE id = $1`,
    [reportId]
  );

  try {
    const joinDateCond = DATE_JOIN_CONDITIONS[dateRange] ?? '';
    const metricSql   = metrics.map(m => METRIC_EXPRS[m]).join(',\n         ');

    const { rows } = await pool.query(
      `SELECT
         v.title       AS video_title,
         v.source_type,
         ${metricSql}
       FROM   videos v
       LEFT   JOIN analytics_sessions s
              ON  s.video_id = v.id
              ${joinDateCond}
       WHERE  v.user_id   = $1
         AND  v.is_active = TRUE
       GROUP  BY v.id, v.title, v.source_type
       ORDER  BY v.title ASC`,
      [userId]
    );

    const headers = ['video_title', 'source_type', ...metrics];
    const csv     = buildCsv(headers, rows);

    await pool.query(
      `UPDATE user_reports
       SET status     = 'completed',
           csv_data   = $1,
           row_count  = $2,
           updated_at = NOW()
       WHERE id = $3`,
      [csv, rows.length, reportId]
    );

    logger.info(`[reports/_generate] report ${reportId} completed (${rows.length} rows)`);

  } catch (err) {
    logger.error(`[reports/_generate] report ${reportId} failed: ${err.message}`);
    await pool.query(
      `UPDATE user_reports
       SET status        = 'failed',
           error_message = $1,
           updated_at    = NOW()
       WHERE id = $2`,
      [err.message.slice(0, 500), reportId]
    ).catch(() => {});
    throw err;
  }
}

module.exports = router;
