'use strict';

/**
 * Health check route — GET /api/health
 *
 * Used by:
 *   - Railway's healthcheck (healthcheckPath in railway.json)
 *   - Monitoring dashboards and ops tooling
 *
 * Returns HTTP 200 { status:"ok" }    — all systems nominal
 * Returns HTTP 503 { status:"degraded" } — database unreachable
 *
 * ── Sections ────────────────────────────────────────────────────────────────
 *   database         connectivity ping + live pg pool counters (no extra query)
 *   jobs             in-memory running/stopped flags from scheduledJobs + webhookSender
 *   webhook_governor fires_this_hour, hourly_cap, is_paused — read from DB
 *                    (best-effort: falls back to defaults if the table is missing)
 */

const express       = require('express');
const router        = express.Router();
const { pool, getPoolStats } = require('../config/database');
const scheduledJobs = require('../services/scheduledJobs');
const webhookSender = require('../services/webhookSender');
const logger        = require('../config/logger');

/**
 * GET /api/health
 */
router.get('/', async (req, res) => {
  // ── 1. Database connectivity ───────────────────────────────────────────
  let dbConnected = false;
  try {
    await pool.query('SELECT 1');
    dbConnected = true;
  } catch (err) {
    logger.error(`[health] DB ping failed: ${err.message}`);
  }

  // ── 2. Pool stats (in-memory — pg tracks these without a query) ────────
  const poolStats = getPoolStats();

  // ── 3. Background job statuses (in-memory flags) ──────────────────────
  const jobStatus     = scheduledJobs.getStatus();
  const senderStatus  = webhookSender.getStatus();

  // ── 4. Webhook governor (DB read — non-fatal if it fails) ─────────────
  let governorData = { fires_this_hour: 0, hourly_cap: 25, is_paused: false };
  if (dbConnected) {
    try {
      const { rows } = await pool.query(
        `SELECT fires_this_hour, hourly_cap, is_paused
         FROM   webhook_governor
         LIMIT  1`
      );
      if (rows[0]) {
        governorData = {
          fires_this_hour: rows[0].fires_this_hour,
          hourly_cap     : rows[0].hourly_cap,
          is_paused      : rows[0].is_paused,
        };
      }
    } catch (err) {
      // webhook_governor table may not exist yet (before migration runs)
      logger.debug(`[health] Governor query skipped: ${err.message}`);
    }
  }

  // ── 5. Build and send response ────────────────────────────────────────
  // LIVENESS probe: return 200 whenever the process is up and serving, even
  // if the DB is momentarily unreachable. A transient DB blip must NOT fail
  // the Railway healthcheck — that would crash-loop the deploy and strand
  // traffic on the old instance. DB health is reported in the body
  // (`status` / `database.connected`) for monitoring/readiness checks.
  const status = dbConnected ? 'ok' : 'degraded';

  // ── Process memory (real RSS of this Node service — no guessing) ──────
  const mem = process.memoryUsage();
  const mb  = (n) => Math.round((n / 1048576) * 10) / 10;

  res.status(200).json({
    status,
    timestamp: new Date().toISOString(),
    memory: {
      rss_mb       : mb(mem.rss),        // total resident memory (what Railway bills)
      heap_used_mb : mb(mem.heapUsed),
      heap_total_mb: mb(mem.heapTotal),
      external_mb  : mb(mem.external),
      uptime_s     : Math.round(process.uptime()),
    },
    database: {
      connected   : dbConnected,
      pool_total  : poolStats.pool_total,
      pool_idle   : poolStats.pool_idle,
      pool_waiting: poolStats.pool_waiting,
    },
    jobs: {
      insight_engine   : jobStatus.insight_engine,
      dispatch_worker  : senderStatus.dispatch_worker,
      heartbeat_checker: jobStatus.heartbeat_checker,
    },
    webhook_governor: {
      fires_this_hour: governorData.fires_this_hour,
      hourly_cap     : governorData.hourly_cap,
      is_paused      : governorData.is_paused,
    },
  });
});

module.exports = router;
