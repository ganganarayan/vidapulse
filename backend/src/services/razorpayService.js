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
 * Plans created here (USD):
 *   starter — $29/month  (2900 cents)
 *   pro     — $79/month  (7900 cents)   — displayed as "Growth"
 *
 * All network calls use the built-in https module (no extra SDK dependency).
 * Errors are thrown as plain Error objects — callers should handle them.
 */

const https   = require('https');
const { pool }= require('../config/database');
const env     = require('../config/env');
const logger  = require('../config/logger');

// Plan definitions — amounts in the smallest currency unit (USD cents).
const PLAN_CURRENCY = 'USD';
const PLAN_DEFS = {
  starter     : { amount: 2900, displayName: 'VidaPulse Starter' },
  pro         : { amount: 7900, displayName: 'VidaPulse Growth'  },
  // Founding-member price for Growth — first 100 payers lock $59/mo for life.
  // The user's VidaPulse plan stays 'pro'; only the Razorpay plan (price) differs.
  pro_founding: { amount: 5900, displayName: 'VidaPulse Growth (Founding)' },
  // Super-admin billing tests: real Razorpay subscriptions in INR at a distinct
  // small amount per plan (Starter Rs 1.10, Growth Rs 1.20) so each plan is
  // recognisable on the statement. They renew monthly until cancelled. Only
  // the admin billing-test endpoints ever use these.
  starter_test: { amount: 110, currency: 'INR', displayName: 'VidaPulse Starter (Rs 1.10 test)' },
  pro_test    : { amount: 120, currency: 'INR', displayName: 'VidaPulse Growth (Rs 1.20 test)'  },
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

  // 1. Check env var override (admin-provided plan ID). Only the standard
  //    starter/pro plans have env overrides — 'pro_founding' always resolves
  //    via the DB cache / API so it is never accidentally mapped to the $79 plan.
  const envPlanId = planKey === 'starter' ? env.RAZORPAY_PLAN_ID_STARTER
                  : planKey === 'pro'     ? env.RAZORPAY_PLAN_ID_PRO
                  : null;

  if (envPlanId) {
    logger.debug(`[razorpay] Using env-configured plan ID ${envPlanId} for ${planKey}`);
    return envPlanId;
  }

  // 2. Check DB cache
  const { rows } = await pool.query(
    `SELECT razorpay_plan_id, amount_paise FROM razorpay_plans WHERE plan_name = $1`,
    [planKey]
  );
  // Test plans: a cached plan at a different amount is stale (the test price
  // changed), so fall through and create one at the current amount.
  const staleTest = planKey.endsWith('_test') && rows.length > 0 && Number(rows[0].amount_paise) !== def.amount;
  if (rows.length > 0 && !staleTest) {
    logger.debug(`[razorpay] Found cached plan ID ${rows[0].razorpay_plan_id} for ${planKey}`);
    return rows[0].razorpay_plan_id;
  }

  // 3. Create via API
  logger.info(`[razorpay] Creating Razorpay plan for ${planKey} ($${def.amount / 100}/mo)`);
  const plan = await _razorpayRequest('POST', '/v1/plans', {
    period  : 'monthly',
    interval: 1,
    item    : {
      name    : def.displayName,
      amount  : def.amount,
      currency: def.currency || PLAN_CURRENCY,
    },
  });

  const planId = plan.id;

  // Store in DB so we don't recreate on next call
  await pool.query(
    `INSERT INTO razorpay_plans (plan_name, razorpay_plan_id, amount_paise)
     VALUES ($1, $2, $3)
     ON CONFLICT (plan_name) DO UPDATE SET razorpay_plan_id = EXCLUDED.razorpay_plan_id,
                                           amount_paise     = EXCLUDED.amount_paise`,
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
async function createSubscription(user, planKey, returnUrl, options = {}) {
  // Founding members get the $59 'pro_founding' Razorpay plan while keeping
  // their VidaPulse plan key = 'pro'. Because a Razorpay subscription is bound
  // to its plan, every renewal stays $59 — that IS the lifetime price lock.
  // options.test → the Rs 1 '<plan>_test' Razorpay plan (super-admin billing
  // tests). options.persist === false → do not write the subscription onto the
  // user row yet; the caller does that once the payment is verified.
  const test          = options.test === true;
  const founding      = !test && options.founding === true && planKey === 'pro';
  const razorpayPlan  = test ? `${planKey}_test` : (founding ? 'pro_founding' : planKey);

  const [customerId, planId] = await Promise.all([
    getOrCreateCustomer(user),
    getOrCreatePlan(razorpayPlan),
  ]);

  logger.info(
    `[razorpay] Creating subscription for user ${user.id} — ` +
    `plan=${planKey}${founding ? ' (founding $59)' : ''} customer=${customerId} razorpay_plan=${planId}`
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
      user_id : user.id,
      plan    : planKey,               // always the VidaPulse plan key ('pro')
      ...(founding ? { founding: '1' } : {}),
      ...(test ? { test: '1' } : {}),
    },
  });

  const subscriptionId = subscription.id;
  const paymentUrl     = subscription.short_url;

  // Store subscription ID on the user so we can cancel/check it later
  if (options.persist !== false) await pool.query(
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

/**
 * Fetch a Razorpay payment entity — used to record accurate amount/currency/
 * method when activating a plan from the client checkout callback.
 */
async function fetchPayment(paymentId) {
  return _razorpayRequest('GET', `/v1/payments/${paymentId}`);
}

/**
 * Move a subscription to another plan WITHOUT charging now: the change takes
 * effect at the end of the current cycle, and every renewal after that bills
 * the new plan's amount. Razorpay only allows this for card-paid subscriptions.
 */
async function switchSubscriptionPlan(subscriptionId, razorpayPlanKey) {
  const planId = await getOrCreatePlan(razorpayPlanKey);
  logger.info(`[razorpay] Switching subscription ${subscriptionId} to ${razorpayPlanKey} (${planId}) at cycle end`);
  return _razorpayRequest('PATCH', `/v1/subscriptions/${subscriptionId}`, {
    plan_id           : planId,
    schedule_change_at: 'cycle_end',
    customer_notify   : 0,
  });
}

/** Map a Razorpay plan_id back to the VidaPulse plan key ('starter' | 'pro'), or null. */
async function planKeyForRazorpayPlan(razorpayPlanId) {
  if (!razorpayPlanId) return null;
  if (env.RAZORPAY_PLAN_ID_STARTER && razorpayPlanId === env.RAZORPAY_PLAN_ID_STARTER) return 'starter';
  if (env.RAZORPAY_PLAN_ID_PRO     && razorpayPlanId === env.RAZORPAY_PLAN_ID_PRO)     return 'pro';
  const { rows } = await pool.query(
    `SELECT plan_name FROM razorpay_plans WHERE razorpay_plan_id = $1 LIMIT 1`, [razorpayPlanId]
  );
  const name = rows[0]?.plan_name;
  if (!name) return null;
  const base = name.replace(/_(test|founding)$/, '');
  return ['starter', 'pro'].includes(base) ? base : null;
}

/** Fetch a Razorpay subscription entity (status, plan_id, notes). */
async function fetchSubscription(subscriptionId) {
  return _razorpayRequest('GET', `/v1/subscriptions/${subscriptionId}`);
}

module.exports = {
  getOrCreateCustomer,
  getOrCreatePlan,
  createSubscription,
  cancelSubscription,
  fetchPayment,
  fetchSubscription,
  switchSubscriptionPlan,
  planKeyForRazorpayPlan,
  TEST_AMOUNT_PAISE: { starter: PLAN_DEFS.starter_test.amount, pro: PLAN_DEFS.pro_test.amount },
};
