'use strict';

/**
 * razorpayService.js
 *
 * Wraps the Razorpay REST API for:
 *   • Creating Customers (stored per-user to avoid duplicates)
 *   • Ensuring Plans exist (creates once, stored in razorpay_plans table)
 *   • Creating Subscriptions (returns the hosted payment URL)
 *   • Cancelling Subscriptions
 *
 * Plans created here:
 *   starter — ₹999/month  (99900 paise)
 *   pro     — ₹1,999/month (199900 paise)
 *
 * All network calls use the built-in https module (no extra SDK dependency).
 * Errors are thrown as plain Error objects — callers should handle them.
 */

const https   = require('https');
const { pool }= require('../config/database');
const env     = require('../config/env');
const logger  = require('../config/logger');

// Plan definitions — amounts in paise (1 INR = 100 paise)
const PLAN_DEFS = {
  starter: { amount: 99900,  displayName: 'VidaPulse Starter' },
  pro    : { amount: 199900, displayName: 'VidaPulse Pro'     },
};

// ─── Low-level HTTP helper ────────────────────────────────────────────────────

/**
 * Make a Razorpay API call.
 * @param {string} method  HTTP method ('GET', 'POST', etc.)
 * @param {string} path    API path (e.g. '/v1/customers')
 * @param {object} [body]  Optional JSON body
 * @returns {Promise<object>} Parsed JSON response
 * @throws {Error} On non-2xx status or network failure
 */
function _razorpayRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
      return reject(new Error('Razorpay API keys not configured (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET)'));
    }

    const payload = body ? JSON.stringify(body) : null;
    const auth    = Buffer.from(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`).toString('base64');

    const options = {
      hostname: 'api.razorpay.com',
      port    : 443,
      path,
      method,
      headers : {
        'Authorization': `Basic ${auth}`,
        'Content-Type' : 'application/json',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data',  chunk => { data += chunk; });
      res.on('end',  () => {
        try {
          const json = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(json);
          } else {
            const msg = json?.error?.description || json?.error?.code || `HTTP ${res.statusCode}`;
            reject(new Error(`Razorpay API error (${res.statusCode}): ${msg}`));
          }
        } catch {
          reject(new Error(`Razorpay API returned non-JSON (status ${res.statusCode})`));
        }
      });
    });

    req.on('error', err => reject(new Error(`Razorpay API network error: ${err.message}`)));
    req.setTimeout(15_000, () => {
      req.destroy();
      reject(new Error('Razorpay API request timed out after 15 s'));
    });

    if (payload) req.write(payload);
    req.end();
  });
}

// ─── Customer ─────────────────────────────────────────────────────────────────

/**
 * Get or create a Razorpay Customer for the given user.
 * Stores the customer ID in users.razorpay_customer_id so we never create
 * duplicate customers for the same user.
 *
 * @param {{ id: string, name: string, email: string, phone?: string }} user
 * @returns {Promise<string>} Razorpay customer ID (cust_XXXXX)
 */
async function getOrCreateCustomer(user) {
  // Check if we already have a customer ID stored
  const { rows } = await pool.query(
    `SELECT razorpay_customer_id FROM users WHERE id = $1`,
    [user.id]
  );
  const existing = rows[0]?.razorpay_customer_id;
  if (existing) {
    logger.debug(`[razorpay] Using existing customer ${existing} for user ${user.id}`);
    return existing;
  }

  // Create a new customer
  logger.info(`[razorpay] Creating customer for user ${user.id} (${user.email})`);
  const customer = await _razorpayRequest('POST', '/v1/customers', {
    name   : user.name  || user.email,
    email  : user.email,
    contact: user.phone || undefined,
    fail_existing: '0', // don't fail if email already exists — return existing
  });

  const customerId = customer.id;

  // Persist the customer ID
  await pool.query(
    `UPDATE users SET razorpay_customer_id = $1, updated_at = NOW() WHERE id = $2`,
    [customerId, user.id]
  );

  logger.info(`[razorpay] Created customer ${customerId} for user ${user.id}`);
  return customerId;
}

// ─── Plans ────────────────────────────────────────────────────────────────────

/**
 * Get or create a Razorpay Plan for the given plan key ('starter' | 'pro').
 * If RAZORPAY_PLAN_ID_STARTER / RAZORPAY_PLAN_ID_PRO env vars are set,
 * those IDs are used directly (no API call). Otherwise checks the DB first,
 * then creates via API and stores the result.
 *
 * @param {'starter'|'pro'} planKey
 * @returns {Promise<string>} Razorpay plan ID (plan_XXXXX)
 */
async function getOrCreatePlan(planKey) {
  const def = PLAN_DEFS[planKey];
  if (!def) throw new Error(`Unknown plan key: ${planKey}`);

  // 1. Check env var override (admin-provided plan ID)
  const envPlanId = planKey === 'starter'
    ? env.RAZORPAY_PLAN_ID_STARTER
    : env.RAZORPAY_PLAN_ID_PRO;

  if (envPlanId) {
    logger.debug(`[razorpay] Using env-configured plan ID ${envPlanId} for ${planKey}`);
    return envPlanId;
  }

  // 2. Check DB cache
  const { rows } = await pool.query(
    `SELECT razorpay_plan_id FROM razorpay_plans WHERE plan_name = $1`,
    [planKey]
  );
  if (rows.length > 0) {
    logger.debug(`[razorpay] Found cached plan ID ${rows[0].razorpay_plan_id} for ${planKey}`);
    return rows[0].razorpay_plan_id;
  }

  // 3. Create via API
  logger.info(`[razorpay] Creating Razorpay plan for ${planKey} (₹${def.amount / 100}/mo)`);
  const plan = await _razorpayRequest('POST', '/v1/plans', {
    period  : 'monthly',
    interval: 1,
    item    : {
      name    : def.displayName,
      amount  : def.amount,
      currency: 'INR',
    },
  });

  const planId = plan.id;

  // Store in DB so we don't recreate on next call
  await pool.query(
    `INSERT INTO razorpay_plans (plan_name, razorpay_plan_id, amount_paise)
     VALUES ($1, $2, $3)
     ON CONFLICT (plan_name) DO UPDATE SET razorpay_plan_id = EXCLUDED.razorpay_plan_id`,
    [planKey, planId, def.amount]
  );

  logger.info(`[razorpay] Created plan ${planId} for ${planKey}`);
  return planId;
}

// ─── Subscriptions ────────────────────────────────────────────────────────────

/**
 * Create a Razorpay Subscription for the user and return the hosted
 * payment URL (subscription.short_url).
 *
 * Steps:
 *   1. Get/create Razorpay Customer
 *   2. Get/create Razorpay Plan
 *   3. Create Subscription (customer + plan)
 *   4. Store subscription ID on the user row
 *   5. Return short_url for frontend redirect
 *
 * @param {{ id: string, name: string, email: string, phone?: string }} user
 * @param {'starter'|'pro'} planKey
 * @param {string} returnUrl  URL to redirect to after payment (e.g. https://app.vidapulse.io/payment/starter)
 * @returns {Promise<{ subscriptionId: string, paymentUrl: string }>}
 */
async function createSubscription(user, planKey, returnUrl) {
  const [customerId, planId] = await Promise.all([
    getOrCreateCustomer(user),
    getOrCreatePlan(planKey),
  ]);

  logger.info(
    `[razorpay] Creating subscription for user ${user.id} — ` +
    `plan=${planKey} customer=${customerId} razorpay_plan=${planId}`
  );

  const subscription = await _razorpayRequest('POST', '/v1/subscriptions', {
    plan_id          : planId,
    customer_id      : customerId,
    quantity         : 1,
    total_count      : 120,        // max 120 months (10 years) — effectively perpetual
    customer_notify  : 0,          // we handle comms via DivineLead CRM
    // NO callback_url / callback_method — the Razorpay Subscriptions API rejects
    // them (HTTP 400). Activation is webhook-driven (subscription.charged); the
    // client opens Razorpay Checkout in-page and returns the user to /payment/:plan.
    notes            : {
      user_id: user.id,
      plan   : planKey,
    },
  });

  const subscriptionId = subscription.id;
  const paymentUrl     = subscription.short_url;

  // Store subscription ID on the user so we can cancel/check it later
  await pool.query(
    `UPDATE users
     SET    razorpay_subscription_id = $1,
            updated_at               = NOW()
     WHERE  id = $2`,
    [subscriptionId, user.id]
  );

  logger.info(`[razorpay] Created subscription ${subscriptionId} for user ${user.id}`);
  return { subscriptionId, paymentUrl };
}

/**
 * Cancel a Razorpay Subscription immediately.
 * Used when a user is downgraded (plan expired, manual cancel).
 *
 * @param {string} subscriptionId  Razorpay subscription ID
 * @returns {Promise<void>}
 */
async function cancelSubscription(subscriptionId) {
  logger.info(`[razorpay] Cancelling subscription ${subscriptionId}`);
  await _razorpayRequest('POST', `/v1/subscriptions/${subscriptionId}/cancel`, {
    cancel_at_cycle_end: 0, // cancel immediately
  });
  logger.info(`[razorpay] Cancelled subscription ${subscriptionId}`);
}

module.exports = {
  getOrCreateCustomer,
  getOrCreatePlan,
  createSubscription,
  cancelSubscription,
};
