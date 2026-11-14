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
 * Prices come from services/pricing.js (INR for India, USD elsewhere,
 * monthly or yearly). A Razorpay plan per (plan, currency, cycle) is created
 * on first use and cached; the owner never enters a plan ID.
 *
 * All network calls use the built-in https module (no extra SDK dependency).
 * Errors are thrown as plain Error objects; callers should handle them.
 */

const https   = require('https');
const { pool }= require('../config/database');
const env     = require('../config/env');
const logger  = require('../config/logger');
const pricing = require('./pricing');

const DISPLAY = { starter: 'VidaPulse Starter', pro: 'VidaPulse Growth', pro_founding: 'VidaPulse Growth (Founding)' };

// Super-admin billing tests: real Razorpay subscriptions in INR at a distinct
// small amount per plan (Starter Rs 1.10, Growth Rs 1.20) so each plan is
// recognisable on the statement. Monthly only. Only the admin billing-test
// endpoints ever use these.
const TEST_DEFS = {
  starter_test: { amount: 110, currency: 'INR', period: 'monthly', displayName: 'VidaPulse Starter (Rs 1.10 test)' },
  pro_test    : { amount: 120, currency: 'INR', period: 'monthly', displayName: 'VidaPulse Growth (Rs 1.20 test)'  },
};

/**
 * Plan spec for a Razorpay plan key ('starter' | 'pro' | 'pro_founding' |
 * '<plan>_test') in a currency and billing cycle. amount is in the smallest
 * unit (paise / cents). cacheName is the razorpay_plans row it is cached under.
 */
function planSpec(razorpayKey, currency, cycle) {
  if (TEST_DEFS[razorpayKey]) return { ...TEST_DEFS[razorpayKey], cacheName: razorpayKey, base: razorpayKey.split('_')[0] };
  if (!DISPLAY[razorpayKey]) throw new Error(`Unknown plan key: ${razorpayKey}`);
  const cur = pricing.normCurrency(currency);
  const cyc = pricing.normCycle(cycle);
  return {
    amount     : pricing.price(razorpayKey, cur, cyc) * 100,
    currency   : cur,
    period     : cyc,
    displayName: `${DISPLAY[razorpayKey]} (${cyc}, ${cur})`,
    cacheName  : `${razorpayKey}_${cur.toLowerCase()}_${cyc}`,
    base       : razorpayKey.split('_')[0],
  };
}

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
 * Get or create the Razorpay Plan for a plan key in a currency and cycle.
 * The amount comes from services/pricing.js; the owner never enters a plan ID.
 * A cached ID is used only after a live check against the current keys
 * (exists, same amount, currency and period); otherwise a plan is created.
 *
 * @param {'starter'|'pro'|'pro_founding'|'starter_test'|'pro_test'} razorpayKey
 * @param {{ currency?: 'USD'|'INR', cycle?: 'monthly'|'yearly' }} [opts]
 * @returns {Promise<string>} Razorpay plan ID (plan_XXXXX)
 */
async function getOrCreatePlan(razorpayKey, opts = {}) {
  const spec = planSpec(razorpayKey, opts.currency, opts.cycle);

  const { rows } = await pool.query(
    `SELECT razorpay_plan_id FROM razorpay_plans WHERE plan_name = $1`,
    [spec.cacheName]
  );
  const cached = rows[0]?.razorpay_plan_id;
  if (cached) {
    if (await _planMatches(cached, spec)) return cached;
    logger.warn(`[razorpay] Cached plan ${cached} (${spec.cacheName}) is missing on these keys or bills a different amount; creating a new one`);
  }

  // notes.vidapulse_plan makes the plan self-describing, so a charge on it
  // maps back to the VidaPulse plan without any stored ID.
  logger.info(`[razorpay] Creating Razorpay plan ${spec.cacheName} (${spec.amount / 100} ${spec.currency}/${spec.period})`);
  const plan = await _razorpayRequest('POST', '/v1/plans', {
    period  : spec.period,
    interval: 1,
    item    : { name: spec.displayName, amount: spec.amount, currency: spec.currency },
    notes   : { vidapulse_plan: razorpayKey, currency: spec.currency, cycle: spec.period },
  });

  await pool.query(
    `INSERT INTO razorpay_plans (plan_name, razorpay_plan_id, amount_paise, interval_unit)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (plan_name) DO UPDATE SET razorpay_plan_id = EXCLUDED.razorpay_plan_id,
                                           amount_paise     = EXCLUDED.amount_paise,
                                           interval_unit    = EXCLUDED.interval_unit`,
    [spec.cacheName, plan.id, spec.amount, spec.period]
  );

  logger.info(`[razorpay] Created plan ${plan.id} for ${spec.cacheName}`);
  return plan.id;
}

/** True when the plan exists on the current keys and bills spec's amount, currency and period. */
async function _planMatches(planId, spec) {
  try {
    const p = await _razorpayRequest('GET', `/v1/plans/${encodeURIComponent(planId)}`);
    return Number(p?.item?.amount) === spec.amount
        && String(p?.item?.currency || '').toUpperCase() === spec.currency
        && p?.period === spec.period && Number(p?.interval) === 1;
  } catch (e) {
    logger.warn(`[razorpay] Plan lookup ${planId} failed: ${e.message}`);
    return false;
  }
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
  // Founding members get the 'pro_founding' Razorpay plan while keeping their
  // VidaPulse plan key = 'pro'. Because a Razorpay subscription is bound to its
  // plan, every renewal stays at the founding price: that IS the lifetime lock.
  // options.currency ('USD'|'INR') and options.cycle ('monthly'|'yearly') pick
  // the price from services/pricing.js; options.meta (ip, country) is recorded
  // in the subscription notes.
  // options.test → the Rs 1 '<plan>_test' Razorpay plan (super-admin billing
  // tests). options.persist === false → do not write the subscription onto the
  // user row yet; the caller does that once the payment is verified.
  const test          = options.test === true;
  const founding      = !test && options.founding === true && planKey === 'pro';
  const razorpayPlan  = test ? `${planKey}_test` : (founding ? 'pro_founding' : planKey);
  const spec          = planSpec(razorpayPlan, options.currency, options.cycle);

  const [customerId, planId] = await Promise.all([
    getOrCreateCustomer(user),
    getOrCreatePlan(razorpayPlan, { currency: spec.currency, cycle: spec.period }),
  ]);

  logger.info(
    `[razorpay] Creating subscription for user ${user.id}: ` +
    `plan=${planKey}${founding ? ' (founding)' : ''} ${spec.amount / 100} ${spec.currency}/${spec.period} ` +
    `customer=${customerId} razorpay_plan=${planId}`
  );

  const meta = options.meta || {};
  const subscription = await _razorpayRequest('POST', '/v1/subscriptions', {
    plan_id          : planId,
    customer_id      : customerId,
    quantity         : 1,
    // About 10 years either way: effectively perpetual.
    total_count      : spec.period === 'yearly' ? 10 : 120,
    customer_notify  : 0,          // we handle comms via DivineLead CRM
    // NO callback_url / callback_method: the Razorpay Subscriptions API rejects
    // them (HTTP 400). Activation is webhook-driven (subscription.charged); the
    // client opens Razorpay Checkout in-page and returns the user to /payment/:plan.
    notes            : {
      user_id : user.id,
      plan    : planKey,               // always the VidaPulse plan key ('pro')
      amount  : String(spec.amount / 100),
      currency: spec.currency,
      cycle   : spec.period,
      ...(meta.ip      ? { ip: String(meta.ip).slice(0, 64) } : {}),
      ...(meta.country ? { country: String(meta.country) }    : {}),
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
  return { subscriptionId, paymentUrl, amount: spec.amount / 100, currency: spec.currency, cycle: spec.period };
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
 * Fetch a Razorpay payment entity: used to record accurate amount/currency/
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
async function switchSubscriptionPlan(subscriptionId, razorpayPlanKey, opts = {}) {
  const planId = await getOrCreatePlan(razorpayPlanKey, opts);
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
  const { rows } = await pool.query(
    `SELECT plan_name FROM razorpay_plans WHERE razorpay_plan_id = $1 LIMIT 1`, [razorpayPlanId]
  );
  let name = rows[0]?.plan_name;
  if (!name) {
    // Not a plan we know by ID: ask Razorpay. Plans this app creates carry
    // notes.vidapulse_plan; any other plan is recognised by what it bills.
    const p   = await _razorpayRequest('GET', `/v1/plans/${encodeURIComponent(razorpayPlanId)}`);
    const amt = Number(p?.item?.amount);
    const cur = String(p?.item?.currency || '').toUpperCase();
    name = p?.notes?.vidapulse_plan;
    if (!name) {
      outer: for (const key of Object.keys(DISPLAY)) {
        for (const c of pricing.CURRENCIES) {
          for (const cyc of pricing.CYCLES) {
            if (c === cur && pricing.price(key, c, cyc) * 100 === amt) { name = key; break outer; }
          }
        }
      }
    }
    if (!name) name = Object.keys(TEST_DEFS).find(k => TEST_DEFS[k].amount === amt && TEST_DEFS[k].currency === cur);
  }
  if (!name) return null;
  const base = String(name).split('_')[0];
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
  TEST_AMOUNT_PAISE: { starter: TEST_DEFS.starter_test.amount, pro: TEST_DEFS.pro_test.amount },
};
