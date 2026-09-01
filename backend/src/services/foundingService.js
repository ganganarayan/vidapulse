'use strict';

/**
 * foundingService.js
 *
 * "Founding members" — the first 100 accounts to PAY for Growth lock the plan
 * at $59/mo for life (vs the standard $79). A founding upgrade is placed on the
 * Razorpay 'pro_founding' plan ($59), so renewals stay $59 forever.
 *
 * Slot accounting is derived from the users table (see migration 053):
 *   • taken    — is_founding_member = TRUE           (confirmed, paid)
 *   • reserved — a recent founding_reserved_at, not yet confirmed
 *                (a $59 subscription was created but the user hasn't paid yet)
 *
 * The public counter (landing page) shows `taken` and increments only on
 * payment. `hasSlot()` also counts live reservations so a burst of concurrent
 * subscribers can't oversell past 100.
 */

const { pool } = require('../config/database');
const logger   = require('../config/logger');

const FOUNDING_LIMIT      = 100;
const FOUNDING_PRICE_USD  = 59;
// Unpaid reservations free their slot again after this many minutes.
const RESERVE_TTL_MINUTES = 60;

/**
 * Public status for the landing counter.
 * @returns {Promise<{taken:number, remaining:number, limit:number, price_usd:number, closed:boolean}>}
 */
async function getStatus() {
  let taken = 0;
  try {
    const { rows } = await pool.query(
      `SELECT COUNT(*)::int AS taken FROM users WHERE is_founding_member = TRUE`
    );
    taken = rows[0]?.taken ?? 0;
  } catch (err) {
    logger.error(`[founding] getStatus failed: ${err.message}`);
  }
  const remaining = Math.max(0, FOUNDING_LIMIT - taken);
  return { taken, remaining, limit: FOUNDING_LIMIT, price_usd: FOUNDING_PRICE_USD, closed: remaining <= 0 };
}

/**
 * Whether a NEW founding subscription may still be offered. Counts confirmed
 * members PLUS recent unpaid reservations so concurrent subscribers cannot
 * push the paid total past the limit.
 * @returns {Promise<boolean>}
 */
async function hasSlot() {
  try {
    const { rows } = await pool.query(
      `SELECT
         (SELECT COUNT(*) FROM users WHERE is_founding_member = TRUE) AS confirmed,
         (SELECT COUNT(*) FROM users
            WHERE is_founding_member = FALSE
              AND founding_reserved_at IS NOT NULL
              AND founding_reserved_at > NOW() - ($1 || ' minutes')::interval) AS reserved`,
      [String(RESERVE_TTL_MINUTES)]
    );
    const used = (parseInt(rows[0].confirmed, 10) || 0) + (parseInt(rows[0].reserved, 10) || 0);
    return used < FOUNDING_LIMIT;
  } catch (err) {
    // On any DB error, do NOT offer founding pricing (fail closed to $79).
    logger.error(`[founding] hasSlot failed: ${err.message}`);
    return false;
  }
}

/**
 * Reserve a founding slot for a user — called when a $59 subscription is created
 * (before payment). No-op if they're already a confirmed founding member.
 */
async function reserve(userId) {
  await pool.query(
    `UPDATE users SET founding_reserved_at = NOW(), updated_at = NOW()
     WHERE id = $1 AND is_founding_member = FALSE`,
    [userId]
  );
}

/**
 * Clear a stale reservation — called when a user starts a NON-founding ($79)
 * subscription, so a later payment isn't mis-tagged as founding.
 */
async function clearReservation(userId) {
  await pool.query(
    `UPDATE users SET founding_reserved_at = NULL, updated_at = NOW()
     WHERE id = $1 AND is_founding_member = FALSE`,
    [userId]
  );
}

/**
 * Confirm a user as a founding member on paid activation. Idempotent.
 * @param {string} userId
 * @param {{force?:boolean}} [opts] force=TRUE confirms from a webhook that
 *        carries notes.founding even if the reservation was already cleared;
 *        otherwise a live reservation is required.
 * @returns {Promise<boolean>} whether this call flipped the flag
 */
async function confirm(userId, { force = false } = {}) {
  try {
    const { rowCount } = await pool.query(
      `UPDATE users
       SET is_founding_member = TRUE, founding_reserved_at = NULL, updated_at = NOW()
       WHERE id = $1 AND is_founding_member = FALSE
         AND ($2 = TRUE OR founding_reserved_at IS NOT NULL)`,
      [userId, force]
    );
    if (rowCount > 0) logger.info(`[founding] user ${userId} confirmed as founding member`);
    return rowCount > 0;
  } catch (err) {
    logger.error(`[founding] confirm failed for ${userId}: ${err.message}`);
    return false;
  }
}

module.exports = {
  getStatus, hasSlot, reserve, clearReservation, confirm,
  FOUNDING_LIMIT, FOUNDING_PRICE_USD,
};
