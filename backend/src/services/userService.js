'use strict';

/**
 * User service — creates subscriber accounts from divineleads webhook.
 *
 * createUserFromWebhook():
 *   Called when divineleads fires POST /api/webhook/create-user after
 *   a subscriber signs up or pays.
 *
 *   All DB work runs inside one transaction (user + preferences +
 *   auth_token + onboarding_state + webhook_log). If anything fails,
 *   the entire operation rolls back — no orphaned rows.
 *
 *   Idempotent: if the same email arrives twice, returns the existing
 *   user without modifying anything.
 *
 * v2 changes:
 *   - No emails sent from VidaPulse. The set_password_url is included
 *     in the user_signed_up behavioral event payload → divineleads
 *     sends the welcome email to the subscriber.
 *   - plan_expires_at removed — free plan is forever free; paid plan
 *     renewal managed by Razorpay/Stripe webhooks, not VidaPulse.
 *   - use_case and business_segment accepted from webhook payload.
 *   - Fires user_signed_up behavioral event after transaction commit.
 */

const crypto  = require('crypto');
const { pool }      = require('../config/database');
const { emitEvent } = require('./behavioralEventService');
const env     = require('../config/env');
const logger  = require('../config/logger');

// ─────────────────────────────────────────────────────────────
// createUserFromWebhook
// ─────────────────────────────────────────────────────────────

/**
 * @param {Object} payload        - Validated webhook body
 * @param {string} payload.name
 * @param {string} payload.email
 * @param {string|null} payload.phone
 * @param {string} payload.plan              - 'free' | 'starter' | 'pro'
 * @param {string|null} payload.use_case     - vsl_funnel | webinar_replay | …
 * @param {string|null} payload.business_segment - coach | creator | …
 * @param {Object} rawPayload     - Original req.body stored as JSONB
 * @param {string} sourceIp       - Requester IP for webhook log
 *
 * @returns {{ user: Object, isNew: boolean, token: string|null }}
 */
async function createUserFromWebhook(payload, rawPayload, sourceIp) {
  const {
    name,
    email,
    phone,
    plan: planName,
    use_case         = null,
    business_segment = null,
  } = payload;

  const normalizedEmail = email.toLowerCase().trim();
  logger.info(`[userService] Webhook received for: ${normalizedEmail} (plan: ${planName})`);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // ── Step 1: Idempotency check ─────────────────────────────
    const existing = await client.query(
      `SELECT id, email, password_set, created_at FROM users WHERE email = $1`,
      [normalizedEmail]
    );
    if (existing.rows.length > 0) {
      await client.query('ROLLBACK');
      logger.warn(`[userService] Idempotent: account already exists for ${normalizedEmail}`);
      return { user: existing.rows[0], isNew: false, token: null };
    }

    // ── Step 2: Look up plan ──────────────────────────────────
    const planResult = await client.query(
      `SELECT id FROM plans WHERE name = $1 AND is_active = TRUE`,
      [planName]
    );
    if (!planResult.rows.length) {
      throw new Error(`Unknown or inactive plan: "${planName}". Valid: free, starter, pro`);
    }
    const planId = planResult.rows[0].id;

    // ── Step 3: Create user ───────────────────────────────────
    const userResult = await client.query(
      `INSERT INTO users
         (email, name, phone, plan_id, created_via, raw_webhook_payload,
          use_case, business_segment)
       VALUES ($1, $2, $3, $4, 'webhook', $5, $6, $7)
       RETURNING id, email, name, plan_id, created_at`,
      [
        normalizedEmail,
        name.trim(),
        phone || null,
        planId,
        rawPayload,
        use_case,
        business_segment,
      ]
    );
    const user = userResult.rows[0];
    logger.debug(`[userService] Inserted user id: ${user.id}`);

    // ── Step 4: Default preferences + onboarding_state ───────
    await client.query(
      `INSERT INTO user_preferences (user_id) VALUES ($1)`,
      [user.id]
    );
    await client.query(
      `INSERT INTO onboarding_state (user_id, signed_up_at) VALUES ($1, NOW())
       ON CONFLICT (user_id) DO NOTHING`,
      [user.id]
    );

    // ── Step 5 & 6: Generate set-password token ───────────────
    // 48 random bytes → 96-char hex string. Expires in 48 hours.
    // This token is passed in the user_signed_up webhook payload.
    // divineleads sends the welcome email containing the set-password URL.
    const token = crypto.randomBytes(48).toString('hex');
    await client.query(
      `INSERT INTO auth_tokens (user_id, token, purpose, expires_at)
       VALUES ($1, $2, 'set_password', NOW() + INTERVAL '48 hours')`,
      [user.id, token]
    );

    // ── Step 7: Log the incoming webhook ─────────────────────
    await client.query(
      `INSERT INTO webhook_logs
         (endpoint, raw_payload, secret_valid, http_status, processed, result_user_id, ip_address)
       VALUES ('/api/webhook/create-user', $1, TRUE, 201, TRUE, $2, $3)`,
      [rawPayload, user.id, sourceIp]
    );

    // ── Step 8: Commit ────────────────────────────────────────
    await client.query('COMMIT');
    logger.info(`[userService] ✓ Created: ${normalizedEmail} (id: ${user.id})`);

    // ── Step 9: Emit user_signed_up behavioral event ──────────
    // Non-blocking — does not affect the response.
    // Payload includes set_password_url so divineleads can send the
    // welcome email to the subscriber on behalf of VidaPulse.
    const setPasswordUrl = `${env.APP_URL}/set-password?token=${token}`;
    emitEvent(user.id, 'user_signed_up', null, {
      signup_source    : 'webhook',
      plan             : planName,
      name             : user.name,
      email            : user.email,
      use_case         : use_case,
      business_segment : business_segment,
      set_password_url : setPasswordUrl,
      set_password_token: token,
      // divineleads constructs this link and emails it to the subscriber
    });

    return { user, isNew: true, token };

  } catch (err) {
    await client.query('ROLLBACK');

    // Log the failure outside the rolled-back transaction
    pool.query(
      `INSERT INTO webhook_logs
         (endpoint, raw_payload, secret_valid, http_status, processed, error_message, ip_address)
       VALUES ('/api/webhook/create-user', $1, TRUE, 500, FALSE, $2, $3)`,
      [rawPayload, err.message, sourceIp]
    ).catch(logErr => {
      logger.error(`[userService] Failed to write error log: ${logErr.message}`);
    });

    logger.error(`[userService] createUserFromWebhook failed for ${normalizedEmail}: ${err.message}`);
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { createUserFromWebhook };
