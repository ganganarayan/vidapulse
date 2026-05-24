'use strict';

/**
 * Scheduled Jobs — Step 6
 *
 * All background jobs that run on fixed intervals.
 * Started from src/index.js after DB + migrations are confirmed ready.
 *
 * ── Jobs ─────────────────────────────────────────────────────────────────
 *
 *   online_cleanup       every 3 min  — sets is_online = FALSE for idle users
 *                                       (users whose last_seen_at > 3 min ago)
 *
 *   insight_batch        every 15 min — runs insight engine + story engine
 *                                       on all pending/stale videos
 *                                       (re-entrance guarded — skips if still running)
 *
 *   no_video_after_48hrs every hour   — emits event for users who signed up
 *                                       > 48 hours ago but have added no video
 *                                       (weekly cap in emitEvent: fires max 1×/7 days)
 *
 *   no_return_after_wow  every hour   — emits event for users who saw the wow
 *                                       moment but haven't logged in for 72 hours
 *                                       and haven't converted to paid
 *                                       (weekly cap in emitEvent: fires max 1×/7 days)
 *
 * ── Startup stagger ──────────────────────────────────────────────────────
 *   online_cleanup  : immediate (runs the moment start() is called)
 *   insight_batch   : 2 min after start (avoids stampede with webhookSender)
 *   hourly jobs     : 5 min after start
 *
 * ── Never throws ─────────────────────────────────────────────────────────
 *   Each job catches its own errors. One job failing never stops the others.
 */

const { pool }          = require('../config/database');
const logger            = require('../config/logger');
const { emitEvent }     = require('./behavioralEventService');
const insightEngine     = require('./insightEngine');
const viewerStoryEngine = require('./viewerStoryEngine');

// ── Intervals ─────────────────────────────────────────────────────────────
const ONLINE_CLEANUP_MS    = 3  * 60_000;   // 3 minutes
const INSIGHT_BATCH_MS     = 15 * 60_000;   // 15 minutes
const HOURLY_JOBS_MS       = 60 * 60_000;   // 1 hour
const DAILY_STATS_MS       = 24 * 60 * 60_000; // 24 hours

// Startup delays — stagger jobs to avoid hitting the DB all at once
const INSIGHT_BATCH_DELAY  = 2  * 60_000;   // insight starts 2 min after server ready
const HOURLY_JOBS_DELAY    = 5  * 60_000;   // hourly jobs start 5 min after server ready
const DAILY_STATS_DELAY    = 10 * 60_000;   // daily stats backfill starts 10 min after server ready

// Thresholds for behavioral event jobs
const NO_VIDEO_HOURS       = 48;            // user must have signed up 48+ hrs ago
const NO_RETURN_HOURS      = 72;            // 3 days after wow moment without return

// ── Runtime state ─────────────────────────────────────────────────────────
const _timers              = [];
let   _isRunning           = false;
let   _insightBatchRunning = false;         // re-entrance guard

// ─────────────────────────────────────────────────────────────────────────
// LIFECYCLE
// ─────────────────────────────────────────────────────────────────────────

function start() {
  if (_isRunning) return;
  _isRunning = true;

  // ── online_cleanup: runs immediately on start, then every 3 min ──────
  _run(_jobOnlineCleanup);
  _timers.push(setInterval(() => _run(_jobOnlineCleanup), ONLINE_CLEANUP_MS));

  // ── insight_batch: starts after 2 min delay ───────────────────────────
  _timers.push(setTimeout(() => {
    _run(_jobInsightBatch);
    _timers.push(setInterval(() => _run(_jobInsightBatch), INSIGHT_BATCH_MS));
  }, INSIGHT_BATCH_DELAY));

  // ── hourly jobs: starts after 5 min delay ─────────────────────────────
  _timers.push(setTimeout(() => {
    _run(_jobHourly);
    _timers.push(setInterval(() => _run(_jobHourly), HOURLY_JOBS_MS));
  }, HOURLY_JOBS_DELAY));

  // ── daily stats backfill: starts after 10 min delay ───────────────────
  _timers.push(setTimeout(() => {
    _run(_jobDailyStatsBackfill);
    _timers.push(setInterval(() => _run(_jobDailyStatsBackfill), DAILY_STATS_MS));
  }, DAILY_STATS_DELAY));

  logger.info('[scheduledJobs] Started — online_cleanup(3m) · insight_batch(15m) · hourly(1h) · daily_stats(24h)');
}

function stop() {
  _timers.forEach(t => { clearInterval(t); clearTimeout(t); });
  _timers.length = 0;
  _isRunning     = false;
  logger.info('[scheduledJobs] Stopped');
}

/** Fire-and-forget wrapper so a job error never crashes the interval loop */
function _run(fn) {
  fn().catch(err => logger.error(`[scheduledJobs] Unhandled error in ${fn.name}: ${err.message}`));
}

// ─────────────────────────────────────────────────────────────────────────
// JOB: online_cleanup
//
// Sets is_online = FALSE for any user whose last_seen_at is older than the
// 3-minute window. The heartbeat endpoint (POST /api/user/heartbeat) sets
// is_online = TRUE and refreshes last_seen_at on every frontend ping.
// The dispatch worker reads is_online before deciding whether to email.
// ─────────────────────────────────────────────────────────────────────────

async function _jobOnlineCleanup() {
  const { rowCount } = await pool.query(
    `UPDATE users
     SET    is_online  = FALSE,
            updated_at = NOW()
     WHERE  is_online  = TRUE
       AND  last_seen_at < NOW() - INTERVAL '3 minutes'`
  );

  if (rowCount > 0) {
    logger.debug(`[scheduledJobs] online_cleanup — marked ${rowCount} user(s) offline`);
  }
}

// ─────────────────────────────────────────────────────────────────────────
// JOB: insight_batch
//
// Runs the insight engine then the story engine on all videos that need it.
// Re-entrance guarded: if the previous run is still in progress (e.g. many
// videos queued), the next interval tick skips rather than overlapping.
// ─────────────────────────────────────────────────────────────────────────

async function _jobInsightBatch() {
  if (_insightBatchRunning) {
    logger.debug('[scheduledJobs] insight_batch still running — skipping this tick');
    return;
  }

  _insightBatchRunning = true;
  const t0 = Date.now();

  try {
    logger.debug('[scheduledJobs] insight_batch starting');

    // Insight engine first — story engine requires insight_status = 'complete'
    await insightEngine.runPendingVideos({ staleDays: 1 });
    await viewerStoryEngine.runPendingVideos({ staleDays: 1 });

    logger.debug(`[scheduledJobs] insight_batch complete in ${Date.now() - t0}ms`);
  } finally {
    _insightBatchRunning = false;
  }
}

// ─────────────────────────────────────────────────────────────────────────
// JOB: hourly — runs both behavioral nudge jobs in sequence
// ─────────────────────────────────────────────────────────────────────────

async function _jobHourly() {
  await _jobNoVideoAfter48hrs();
  await _jobNoReturnAfterWow();
}

// ─────────────────────────────────────────────────────────────────────────
// JOB: no_video_after_48hrs
//
// Finds users who signed up more than 48 hours ago and have never added a
// video. Emits 'no_video_after_48hrs' via emitEvent, which enforces the
// WEEKLY_CAP (won't fire again for the same user within 7 days).
//
// Intent: prompts divineleads to send a "you haven't added your first video"
// email, giving the user a nudge to experience the product.
// ─────────────────────────────────────────────────────────────────────────

async function _jobNoVideoAfter48hrs() {
  const { rows: users } = await pool.query(
    `SELECT u.id
     FROM   users u
     WHERE  u.is_active   = TRUE
       AND  u.created_at  < NOW() - ($1 || ' hours')::INTERVAL
       AND  u.first_video_id IS NULL
       AND  NOT EXISTS (
         SELECT 1
         FROM   videos v
         WHERE  v.user_id  = u.id
           AND  v.is_active = TRUE
       )`,
    [NO_VIDEO_HOURS]
  );

  if (users.length === 0) return;
  logger.info(`[scheduledJobs] no_video_after_48hrs — ${users.length} eligible user(s)`);

  for (const { id } of users) {
    await emitEvent(id, 'no_video_after_48hrs');
    // emitEvent checks WEEKLY_CAP_EVENTS — skips silently if fired within 7 days
  }
}

// ─────────────────────────────────────────────────────────────────────────
// JOB: no_return_after_wow
//
// Finds users who:
//   • have seen the wow moment (wow_moment_seen = TRUE)
//   • haven't logged in for 72 hours (3 days)
//   • haven't converted to paid (no converted_to_paid in behavioral_events)
//
// Emits 'no_return_after_wow' — prompts divineleads to send a re-engagement
// email showing the user what they're missing by not returning.
// WEEKLY_CAP prevents spamming (once per 7 days per user).
// ─────────────────────────────────────────────────────────────────────────

async function _jobNoReturnAfterWow() {
  const { rows: users } = await pool.query(
    `SELECT u.id
     FROM   users u
     WHERE  u.is_active       = TRUE
       AND  u.wow_moment_seen = TRUE
       AND  (
         u.last_seen_at IS NULL
         OR u.last_seen_at < NOW() - ($1 || ' hours')::INTERVAL
       )
       AND  NOT EXISTS (
         SELECT 1
         FROM   behavioral_events be
         WHERE  be.user_id   = u.id
           AND  be.event_key = 'converted_to_paid'
       )`,
    [NO_RETURN_HOURS]
  );

  if (users.length === 0) return;
  logger.info(`[scheduledJobs] no_return_after_wow — ${users.length} eligible user(s)`);

  for (const { id } of users) {
    await emitEvent(id, 'no_return_after_wow');
  }
}

// ─────────────────────────────────────────────────────────────────────────
// JOB: daily_stats_backfill
//
// Runs once on startup (after 10 min) then every 24 hours.
// Backfills analytics_daily_stats for YESTERDAY (the previous UTC day) for
// every video that had at least one session on that date.
//
// The /ping handler already upserts TODAY's row in real-time. This job
// handles two edge cases:
//   1. Sessions that started before midnight but whose 'end' ping arrived
//      after midnight (ended_at is on the new day but started_at is yesterday).
//   2. Any video whose real-time upsert was missed (server restart, crash).
//
// Uses a single bulk INSERT … SELECT … ON CONFLICT to process all videos
// at once — far cheaper than one query per video.
// ─────────────────────────────────────────────────────────────────────────

async function _jobDailyStatsBackfill() {
  const yesterday = new Date();
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const dateStr = yesterday.toISOString().slice(0, 10); // 'YYYY-MM-DD'

  const { rowCount } = await pool.query(
    `INSERT INTO analytics_daily_stats
       (video_id, stat_date,
        total_plays, unique_viewers, total_watch_seconds,
        avg_watch_pct, completed_views, play_rate)
     SELECT
       video_id,
       $1::date,
       SUM(CASE WHEN play_count > 0 THEN 1 ELSE 0 END),
       COUNT(DISTINCT viewer_id),
       COALESCE(SUM(total_watch_seconds), 0)::BIGINT,
       COALESCE(AVG(max_watch_pct)::numeric(5,2), 0),
       SUM(CASE WHEN reached_end THEN 1 ELSE 0 END),
       CASE WHEN COUNT(*) > 0
         THEN ROUND(
           SUM(CASE WHEN play_count > 0 THEN 1.0 ELSE 0 END)
           / COUNT(*) * 100, 2)
         ELSE 0
       END
     FROM analytics_sessions
     WHERE started_at >= $1::date
       AND started_at <  $1::date + INTERVAL '1 day'
     GROUP BY video_id
     ON CONFLICT (video_id, stat_date) DO UPDATE SET
       total_plays         = EXCLUDED.total_plays,
       unique_viewers      = EXCLUDED.unique_viewers,
       total_watch_seconds = EXCLUDED.total_watch_seconds,
       avg_watch_pct       = EXCLUDED.avg_watch_pct,
       completed_views     = EXCLUDED.completed_views,
       play_rate           = EXCLUDED.play_rate,
       updated_at          = NOW()`,
    [dateStr]
  );

  logger.info(`[scheduledJobs] daily_stats_backfill — ${rowCount} video(s) updated for ${dateStr}`);
}

/**
 * Returns the current status of background jobs managed by this module.
 * Called by GET /api/health — reads in-memory flags, no DB query.
 *
 *   heartbeat_checker — online_cleanup job (marks idle users offline every 3 min)
 *   insight_engine    — insight + story engine batch job (runs every 15 min)
 */
function getStatus() {
  return {
    heartbeat_checker: _isRunning ? 'running' : 'stopped',
    insight_engine   : _isRunning ? 'running' : 'stopped',
  };
}

module.exports = { start, stop, getStatus };
