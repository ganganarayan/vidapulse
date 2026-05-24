'use strict';

/**
 * PostgreSQL connection pool (singleton).
 *
 * Uses the 'pg' library's Pool, which manages a fixed number of
 * persistent connections to Railway's PostgreSQL instance.
 *
 * All database modules import { pool } from here — never create
 * additional Pool instances.
 */

const { Pool } = require('pg');
const env    = require('./env');
const logger = require('./logger');

const pool = new Pool({
  connectionString : env.DATABASE_URL,

  // Railway's PostgreSQL requires SSL in production.
  // rejectUnauthorized:false accepts Railway's self-signed cert.
  ssl: env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false,

  // Pool sizing — Railway's Postgres allows up to 100 connections.
  // max:20 leaves comfortable headroom for concurrent deploys / admin queries.
  max                    : 20,
  idleTimeoutMillis      : 30_000, // release idle connections after 30 s
  connectionTimeoutMillis:  2_000, // fail fast if pool is exhausted (2 s)
});

// Log unexpected pool-level errors (dropped connections, etc.)
pool.on('error', (err) => {
  logger.error('[db] Unexpected pool client error:', err.message);
});

/**
 * Returns live pool statistics from pg's in-memory counters.
 * No database query — safe to call from a health check on every request.
 *
 *   pool_total   — connections currently in use + idle (grows up to max:20)
 *   pool_idle    — connections sitting idle, ready for the next query
 *   pool_waiting — requests queued because all 20 connections are busy
 */
function getPoolStats() {
  return {
    pool_total  : pool.totalCount,
    pool_idle   : pool.idleCount,
    pool_waiting: pool.waitingCount,
  };
}

/**
 * Verifies the database connection is alive.
 * Called once at server startup — throws if the DB is unreachable.
 */
async function testConnection() {
  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      'SELECT NOW() AS now, current_database() AS db, version() AS pg_version'
    );
    const { db, now, pg_version } = rows[0];
    logger.info(`[db] ✓ Connected — database: "${db}" | server time: ${now}`);
    logger.debug(`[db]   PostgreSQL version: ${pg_version.split(',')[0]}`);
  } finally {
    client.release();
  }
}

module.exports = { pool, testConnection, getPoolStats };
