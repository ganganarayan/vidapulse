'use strict';

/**
 * videoAnalytics.js: analytics queries shared by the app routes
 * (routes/videos.js) and the internal MCP endpoint (mcp/index.js), so the
 * numbers an agent sees are computed exactly like the dashboard's.
 *
 * Every function takes the db (a pg Pool or anything with .query) first, so
 * callers and tests can pass their own.
 */

/**
 * Session aggregates for one video (used by GET /api/videos/:id).
 * played_sessions = sessions where the viewer pressed play at least once.
 */
async function getSessionStats(db, videoId) {
  const { rows: [stats] } = await db.query(
    `SELECT
       COALESCE(
         ROUND(
           COUNT(CASE WHEN play_count > 0 THEN 1 END)::numeric
           / NULLIF(COUNT(*), 0) * 100, 1
         ), 0
       )::float                                                              AS play_rate_pct,
       COUNT(CASE WHEN reached_end AND play_count > 0 THEN 1 END)::int      AS completed_views,
       COALESCE(SUM(total_watch_seconds) FILTER (WHERE play_count > 0), 0)::bigint
                                                                            AS total_watch_seconds_sum,
       COUNT(DISTINCT viewer_id) FILTER (WHERE play_count > 0)::int         AS unique_viewers_who_played,
       COUNT(*) FILTER (WHERE play_count > 0)::int                          AS played_sessions
     FROM analytics_sessions
     WHERE video_id = $1`,
    [videoId]
  );
  return stats || null;
}

/**
 * How many players' furthest point (max_watch_pct) landed in each whole
 * percent of the runtime. Input for buildRetentionCurve.
 */
async function getMaxPctCounts(db, videoId) {
  const { rows } = await db.query(
    `SELECT FLOOR(LEAST(GREATEST(max_watch_pct, 0), 100))::int AS bucket,
            COUNT(*)::int                                       AS cnt
     FROM   analytics_sessions
     WHERE  video_id = $1 AND play_count > 0
     GROUP  BY 1`,
    [videoId]
  );
  return rows;
}

/**
 * Monotonic audience-retention curve: 101 points (0 to 100% of the runtime).
 * point i = % of players whose furthest point reached at least i% of the
 * video, so it can only fall. Same curve as the dashboard heatmap.
 *
 * @returns {{second:number, pct:number}[]}
 */
function buildRetentionCurve(pctRows, totalPlayers, durationSeconds) {
  const total  = Number(totalPlayers) || 0;
  const counts = new Array(101).fill(0);
  for (const r of pctRows) {
    const b = Math.max(0, Math.min(100, Number(r.bucket) || 0));
    counts[b] += Number(r.cnt) || 0;
  }
  const curve = [];
  let cum = 0;
  for (let i = 100; i >= 0; i--) {
    cum += counts[i];
    curve[i] = {
      second: durationSeconds ? (i / 100) * durationSeconds : i,
      pct   : total > 0 ? Math.round((cum / total) * 1000) / 10 : 0,
    };
  }
  return curve;
}

/**
 * Downsample a curve to at most maxPoints, always keeping the first and the
 * last point (evenly spaced indexes in between).
 */
function downsample(points, maxPoints = 50) {
  if (points.length <= maxPoints) return points.slice();
  const out  = [];
  const step = (points.length - 1) / (maxPoints - 1);
  for (let k = 0; k < maxPoints; k++) out.push(points[Math.round(k * step)]);
  return out;
}

/**
 * The n biggest falls between neighbouring curve points: where viewers leave.
 * pct_lost = percentage points of the audience lost in that step.
 */
function topDropoffs(curve, n = 5) {
  const drops = [];
  for (let i = 1; i < curve.length; i++) {
    const lost = Math.round((curve[i - 1].pct - curve[i].pct) * 10) / 10;
    if (lost > 0) drops.push({ second: Math.round(curve[i].second * 10) / 10, pct_lost: lost });
  }
  drops.sort((a, b) => b.pct_lost - a.pct_lost || a.second - b.second);
  return drops.slice(0, n);
}

/**
 * The dashboard's embed snippet (frontend/src/lib/embed.js, default variant):
 * a plain, script-free responsive iframe.
 */
function embedSnippet(videoId, origin) {
  const src = `${origin}/embed/${videoId}`;
  return `<div style="position:relative;width:100%;max-width:560px;margin:0 auto">
  <div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden">
    <iframe src="${src}"
      style="position:absolute;top:0;left:0;width:100%;height:100%;border:0"
      allow="autoplay; fullscreen; picture-in-picture"
      referrerpolicy="unsafe-url"
      allowfullscreen title="VidaPulse video"></iframe>
  </div>
</div>`;
}

module.exports = {
  getSessionStats, getMaxPctCounts, buildRetentionCurve, downsample, topDropoffs, embedSnippet,
};
