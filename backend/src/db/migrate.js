'use strict';

/**
 * Database migration runner.
 *
 * How it works:
 *   1. Creates a `_migrations` tracking table if it doesn't exist.
 *   2. Reads all *.sql files from src/db/migrations/ sorted by filename.
 *   3. Skips files already recorded in `_migrations`.
 *   4. Applies each new file inside a transaction — if a migration fails,
 *      it rolls back and exits with error (no partial state).
 *   5. Records the filename in `_migrations` after successful apply.
 *
 * Run manually:   node src/db/migrate.js
 * Check status:   node src/db/migrate.js --status
 * Called on boot: runMigrations() is called from src/index.js
 *
 * Naming convention for migration files: NNN_description.sql
 *   e.g. 001_initial_schema.sql, 002_add_indexes.sql
 */

const fs     = require('fs');
const path   = require('path');
const { pool } = require('../config/database');
const logger   = require('../config/logger');

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

/**
 * Ensures the migrations tracking table exists.
 * This is idempotent — safe to call on every startup.
 */
async function ensureMigrationsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id          SERIAL PRIMARY KEY,
      filename    VARCHAR(255) UNIQUE NOT NULL,
      applied_at  TIMESTAMPTZ         NOT NULL DEFAULT NOW()
    )
  `);
}

/**
 * Returns the set of already-applied migration filenames.
 */
async function getAppliedMigrations(client) {
  const { rows } = await client.query(
    'SELECT filename FROM _migrations ORDER BY filename'
  );
  return new Set(rows.map(r => r.filename));
}

/**
 * Returns all .sql migration filenames from the migrations/ directory,
 * sorted ascending (so 001 runs before 002, etc.).
 */
function getMigrationFiles() {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    logger.warn('[migrate] migrations/ directory not found — nothing to apply');
    return [];
  }
  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort();
}

/**
 * Applies all pending migrations in order.
 * Called automatically on server startup.
 *
 * @throws {Error} If any migration fails (after rolling back that migration).
 */
async function runMigrations() {
  const client = await pool.connect();
  try {
    await ensureMigrationsTable(client);
    const applied  = await getAppliedMigrations(client);
    const files    = getMigrationFiles();
    const pending  = files.filter(f => !applied.has(f));

    if (pending.length === 0) {
      logger.info('[migrate] ✓ Database is up to date — no pending migrations');
      return;
    }

    logger.info(`[migrate] Found ${pending.length} pending migration(s)`);

    for (const filename of pending) {
      const filePath = path.join(MIGRATIONS_DIR, filename);
      const sql = fs.readFileSync(filePath, 'utf8');

      logger.info(`[migrate] Applying: ${filename}`);

      // Wrap each migration in its own transaction.
      // If it fails, we roll back just that migration and throw.
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query(
          'INSERT INTO _migrations (filename) VALUES ($1)',
          [filename]
        );
        await client.query('COMMIT');
        logger.info(`[migrate] ✓ Applied: ${filename}`);
      } catch (err) {
        await client.query('ROLLBACK');
        logger.error(`[migrate] ✗ Failed on: ${filename}`);
        logger.error(`[migrate]   Error: ${err.message}`);
        // Include the SQL position hint if available (helps find the bad line)
        if (err.position) {
          const snippet = sql.substring(Math.max(0, err.position - 60), err.position + 60);
          logger.error(`[migrate]   Near: ...${snippet}...`);
        }
        throw new Error(`Migration "${filename}" failed: ${err.message}`);
      }
    }

    logger.info(`[migrate] ✓ All ${pending.length} migration(s) applied successfully`);
  } finally {
    client.release();
  }
}

/**
 * Prints migration status to stdout (for --status flag).
 */
async function showStatus() {
  const client = await pool.connect();
  try {
    await ensureMigrationsTable(client);
    const applied = await getAppliedMigrations(client);
    const files   = getMigrationFiles();

    console.log('\n Migration Status\n' + '─'.repeat(50));
    if (files.length === 0) {
      console.log('  No migration files found in migrations/');
    } else {
      files.forEach(f => {
        const status = applied.has(f) ? '✓ applied' : '○ pending';
        console.log(`  ${status}  ${f}`);
      });
    }
    console.log('─'.repeat(50) + '\n');
  } finally {
    client.release();
  }
}

// Allow running directly from CLI
if (require.main === module) {
  const isStatus = process.argv.includes('--status');
  const action   = isStatus ? showStatus : runMigrations;

  // We need env loaded before connecting to DB
  require('dotenv').config();

  action()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('\n[migrate] FATAL:', err.message, '\n');
      process.exit(1);
    });
}

module.exports = { runMigrations };
