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
  const status     = dbConnected ? 'ok' : 'degraded';
  const statusCode = dbConnected ?  200 :  503;

  res.status(statusCode).json({
    status,
    timestamp: new Date().toISOString(),
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
