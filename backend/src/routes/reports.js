'use strict';

/**
 * Reports API — /api/reports
 *
 * GET /api/reports/viewer-journey  — CSV download of all viewer sessions
 */

const express        = require('express');
const router         = express.Router();
const { pool }       = require('../config/database');
const { requireAuth }= require('../middleware/requireAuth');

// ── GET /api/reports/viewer-journey ─────────────────────────────────────
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

    const esc = (v) => {
      if (v === null || v === undefined) return '';
      const s = String(v);
      return s.includes(',') || s.includes('"') || s.includes('\n')
        ? `"${s.replace(/"/g, '""')}"` : s;
    };

    const csv = [
      HEADERS.join(','),
      ...rows.map(r => HEADERS.map(h => esc(r[h])).join(',')),
    ].join('\n');

    const date = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="viewer-journey-${date}.csv"`);
    return res.send(csv);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
