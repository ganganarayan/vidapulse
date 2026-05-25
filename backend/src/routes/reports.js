'use strict';

/**
 * Reports API — /api/reports
 *
 *   GET  /api/reports/list               — list user's generated reports
 *   POST /api/reports/generate           — queue a background report (returns report_id)
 *                                          kind: 'custom' | 'viewer_journey' | 'events_log'
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
// Allowed metrics and their SQL SELECT expressions (custom reports only)
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

// Maps date_range key → extra JOIN condition for analytics_sessions
const DATE_JOIN_CONDITIONS = {
  '7_days' : `AND s.started_at >= NOW() - INTERVAL '7 days'`,
  '30_days': `AND s.started_at >= NOW() - INTERVAL '30 days'`,
  '90_days': `AND s.started_at >= NOW() - INTERVAL '90 days'`,
  'all_time': '',
};

const VALID_KINDS = ['custom', 'viewer_journey', 'events_log'];

// ─────────────────────────────────────────────────────────────────────────
// POST /api/reports/generate
//
// Queues a background report of any kind. Responds immediately with
// report_id; generation runs async.
//
// Body:
//   kind       string  'custom' (default) | 'viewer_journey' | 'events_log'
//   title      string  optional — auto-named by kind if omitted
//   metrics    array   required for kind='custom', ignored otherwise
//   date_range string  optional for custom reports (default '30_days')
// ─────────────────────────────────────────────────────────────────────────

router.post('/generate', requireAuth, async (req, res, next) => {
  const { title, metrics, date_range, kind: rawKind } = req.body ?? {};

  const kind = VALID_KINDS.includes(rawKind) ? rawKind : 'custom';

  // Validate metrics for custom reports
  let safeMetrics   = [];
  const safeDateRange = VALID_DATE_RANGES[date_range] !== undefined ? date_range : '30_days';

  if (kind === 'custom') {
    if (!metrics || !Array.isArray(metrics) || metrics.length === 0) {
      return res.status(400).json({ error: 'metrics array required' });
    }
    safeMetrics = metrics.filter(m => typeof m === 'string' && METRIC_EXPRS[m]);
    if (safeMetrics.length === 0) {
      return res.status(400).json({ error: 'no valid metrics provided', valid: Object.keys(METRIC_EXPRS) });
    }
  }

  // Default title per kind
  const defaultTitle = kind === 'viewer_journey' ? 'Viewer Journey Export'
                     : kind === 'events_log'      ? 'Events Log Export'
                     : (DATE_RANGES_LABELS[safeDateRange] ?? safeDateRange) + ' Report';
  const safeTitle = (typeof title === 'string' ? title : '').trim().slice(0, 255) || defaultTitle;

  try {
    const { rows: [report] } = await pool.query(
      `INSERT INTO user_reports (user_id, title, metrics, date_range, status, kind)
       VALUES ($1, $2, $3::jsonb, $4, 'pending', $5)
       RETURNING id`,
      [req.user.id, safeTitle, JSON.stringify(safeMetrics), safeDateRange, kind]
    );

    res.json({ report_id: report.id, status: 'pending' });

    // Background generation — response already sent
    _generateReport(report.id, req.user.id, kind, safeMetrics, safeDateRange)
      .catch(err => logger.warn(`[reports/generate] bg generation failed for ${report.id}: ${err.message}`));

  } catch (err) {
    next(err);
  }
});

// Human-readable labels for date range keys (used in auto-title)
const DATE_RANGES_LABELS = {
  '7_days' : 'Last 7 Days',
  '30_days': 'Last 30 Days',
  '90_days': 'Last 90 Days',
  'all_time': 'All Time',
};

// ─────────────────────────────────────────────────────────────────────────
// GET /api/reports/list
// Returns up to 50 of the user's most recent reports (any status, any kind).
// ─────────────────────────────────────────────────────────────────────────

router.get('/list', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, title, kind, metrics, date_range, status, row_count,
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
      `SELECT id, title, kind, status, csv_data, created_at
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
// _generateReport — background CSV generation dispatcher
//
// Marks the report as 'processing', then delegates to the appropriate
// generator based on `kind`, then marks 'completed' or 'failed'.
// ─────────────────────────────────────────────────────────────────────────

async function _generateReport(reportId, userId, kind, metrics, dateRange) {
  await pool.query(
    `UPDATE user_reports SET status = 'processing', updated_at = NOW() WHERE id = $1`,
    [reportId]
  );

  try {
    let csv, rowCount;

    if (kind === 'viewer_journey') {
      ({ csv, rowCount } = await _generateViewerJourney(userId));
    } else if (kind === 'events_log') {
      ({ csv, rowCount } = await _generateEventsLog(userId));
    } else {
      ({ csv, rowCount } = await _generateCustom(userId, metrics, dateRange));
    }

    await pool.query(
      `UPDATE user_reports
       SET status     = 'completed',
           csv_data   = $1,
           row_count  = $2,
           updated_at = NOW()
       WHERE id = $3`,
      [csv, rowCount, reportId]
    );

    logger.info(`[reports/_generate] report ${reportId} (${kind}) completed (${rowCount} rows)`);

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

// ─── Generator: Viewer Journey ─────────────────────────────────────────────

async function _generateViewerJourney(userId) {
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
    [userId]
  );

  const HEADERS = [
    'video','session_start','session_end','watch_seconds','max_watch_pct',
    'completed','play_count','device_type','browser','os','country','city',
    'page','referrer','utm_source','utm_medium','utm_campaign',
  ];
  const csv = buildCsv(HEADERS, rows);
  return { csv, rowCount: rows.length };
}

// ─── Generator: Events Log ────────────────────────────────────────────────

async function _generateEventsLog(userId) {
  const { rows } = await pool.query(
    `SELECT
       ae.occurred_at,
       ae.event_type,
       v.title                           AS video,
       ae.video_position,
       ae.session_id,
       ae.metadata->>'cta_name'          AS cta_name,
       ae.metadata->>'page_name'         AS page_name,
       ae.metadata->>'destination_url'   AS destination_url
     FROM   analytics_events ae
     LEFT   JOIN analytics_sessions s ON ae.session_id = s.id
     JOIN   videos v                  ON ae.video_id   = v.id
     WHERE  v.user_id = $1
     ORDER  BY ae.occurred_at DESC
     LIMIT  50000`,
    [userId]
  );

  const HEADERS = [
    'occurred_at','event_type','video','video_position','session_id',
    'cta_name','page_name','destination_url',
  ];
  const csv = buildCsv(HEADERS, rows);
  return { csv, rowCount: rows.length };
}

// ─── Generator: Custom metric report ─────────────────────────────────────

async function _generateCustom(userId, metrics, dateRange) {
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
  return { csv, rowCount: rows.length };
}

module.exports = router;
