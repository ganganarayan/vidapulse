'use strict';

/**
 * Purge service — the single, shared "destroy a user's data, keep the logs"
 * routine, used by both the admin manual purge and the automatic 180-day
 * post-deactivation purge job.
 *
 * Keeps (unlinked, never deleted): all logs (webhook, contact, outbound,
 * impersonation audit), payments, subscription history, behavioral events,
 * and cta_click_logs (with Clicker ID). Deletes the user + their video-analytics
 * data + config via ON DELETE CASCADE.
 *
 * Also writes a purged_accounts row so a returning user (same email) is
 * recognized after their users row is gone.
 *
 * Callers MUST pre-validate eligibility (non-admin; deactivated). This function
 * re-asserts role <> 'admin' in SQL as a final guard but trusts the caller for
 * the deactivated check.
 */

const { pool } = require('../config/database');

/**
 * @param {string[]} ids            user ids to purge
 * @param {string}   reasonFallback reason recorded when the user row has no
 *                                  deactivated_reason (e.g. 'deactivated_180d').
 * @returns {Promise<number>} number of accounts actually purged
 */
async function purgeUsers(ids, reasonFallback = 'manual') {
  if (!Array.isArray(ids) || ids.length === 0) return 0;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Log the purge BEFORE deleting (so a returning user is recognized).
    await client.query(
      `INSERT INTO purged_accounts (email, name, reason, original_created_at)
       SELECT email, name, COALESCE(deactivated_reason, $2), created_at
         FROM users
        WHERE id = ANY($1::uuid[]) AND role <> 'admin'`,
      [ids, reasonFallback]
    );

    // 2. Preserve keep-list logs by unlinking the user pointer before delete,
    //    so the cascade can't reach them.
    await client.query(`UPDATE behavioral_events SET user_id = NULL WHERE user_id = ANY($1::uuid[])`, [ids]);
    await client.query(`UPDATE webhook_logs SET result_user_id = NULL WHERE result_user_id = ANY($1::uuid[])`, [ids]);
    await client.query(`DELETE FROM admin_impersonation_sessions WHERE target_user_id = ANY($1::uuid[]) OR admin_user_id = ANY($1::uuid[])`, [ids]);

    // 3. Delete the users — owned/video-analytics data cascades; SET-NULL logs
    //    (payments, subscriptions, cta_click_logs, contact/outbound webhook
    //    logs, impersonation audit) survive automatically.
    const del = await client.query(
      `DELETE FROM users WHERE id = ANY($1::uuid[]) AND role <> 'admin'`,
      [ids]
    );

    await client.query('COMMIT');
    return del.rowCount;
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { purgeUsers };
