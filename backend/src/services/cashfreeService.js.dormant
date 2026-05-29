'use strict';

/**
 * cashfreeService.js
 *
 * Wraps the Cashfree Subscriptions API v2 for:
 *   • Ensuring Plans exist (created once, cached in cashfree_plans table)
 *   • Creating Subscriptions (returns the Cashfree-hosted auth/payment URL)
 *   • Cancelling Subscriptions
 *   • Verifying incoming webhook signatures
 *
 * Plans created here (auto-created on first subscription, or pre-set via env):
 *   starter INR — ₹999 / month
 *   pro     INR — ₹1,999 / month
 *   starter USD — $15 / month
 *   pro     USD — $29 / month
 *
 * All network calls use Node's built-in https module — no extra SDK needed.
 * Errors are thrown as plain Error objects — callers should handle them.
 *
 * ── Cashfree Dashboard setup ──────────────────────────────────────────────────
 * Webhook URL:   https://app.vidapulse.in/api/payments/cashfree
 * Webhook events to enable:
 *   SUBSCRIPTION_NEW, SUBSCRIPTION_FIRST_CHARGE_SUCCESS
 *   SUBSCRIPTION_PAYMENT_SUCCESS, SUBSCRIPTION_PAYMENT_FAILED
 *   SUBSCRIPTION_CANCELLED, SUBSCRIPTION_COMPLETED
 *
 * ── Signature verification ─────────────────────────────────────────────────
 * Cashfree Subscriptions v2 computes the webhook body signature as:
 *   base64( HMAC-SHA256( subscriptionId + txTime + referenceId + txMsg + amount, secretKey ) )
 * This value is sent as the 'signature' field inside the webhook body.
 * Set CASHFREE_WEBHOOK_SECRET in Railway env vars to enable verification.
 */

const https   = require('https');
const crypto  = require('crypto');
const { pool} = require('../config/database');
const env     = require('../config/env');
const logger  = require('../config/logger');

// ─── Plan definitions ─────────────────────────────────────────────────────────

const PLAN_DEFS = {
  starter_INR: { amount: 999,  currency: 'INR', name: 'VidaPulse Starter Monthly'       },
  pro_INR    : { amount: 1999, currency: 'INR', name: 'VidaPulse Pro Monthly'            },
  starter_USD: { amount: 15,   currency: 'USD', name: 'VidaPulse Starter Monthly (USD)'  },
  pro_USD    : { amount: 29,   currency: 'USD', name: 'VidaPulse Pro Monthly (USD)'      },
};

// Plan ID overrides from env (set these if you created plans manually in Cashfree dashboard)
const ENV_PLAN_IDS = () => ({
  starter_INR: env.CASHFREE_PLAN_ID_STARTER_INR,
  pro_INR    : env.CASHFREE_PLAN_ID_PRO_INR,
  starter_USD: env.CASHFREE_PLAN_ID_STARTER_USD,
  pro_USD    : env.CASHFREE_PLAN_ID_PRO_USD,
});

// ─── HTTP base URL (sandbox vs production) ────────────────────────────────────

function _baseUrl() {
  return env.CASHFREE_ENV === 'sandbox'
    ? 'https://test.cashfree.com/api/v2/subscriptions'
    : 'https://api.cashfree.com/api/v2/subscriptions';
}

// ─── Low-level HTTP helper ────────────────────────────────────────────────────

function _request(method, path, body) {
  return new Promise((resolve, reject) => {
    if (!env.CASHFREE_APP_ID || !env.CASHFREE_SECRET_KEY) {
      return reject(new Error('Cashfree API keys not configured (CASHFREE_APP_ID / CASHFREE_SECRET_KEY)'));
    }

    const payload = body ? JSON.stringify(body) : null;
    const base    = _baseUrl();
    const url     = new URL(base + path);

    const options = {
      hostname: url.hostname,
      port    : 443,
      path    : url.pathname + url.search,
      method,
      headers : {
        'Content-Type'   : 'application/json',
        'x-client-id'    : env.CASHFREE_APP_ID,
        'x-client-secret': env.CASHFREE_SECRET_KEY,
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
            const msg = json?.message || json?.error || `HTTP ${res.statusCode}`;
            reject(new Error(`Cashfree API error (${res.statusCode}): ${msg}`));
          }
        } catch {
          reject(new Error(`Cashfree returned non-JSON (status ${res.statusCode}): ${data.slice(0, 200)}`));
        }
      });
    });

    req.on('error',   err => reject(new Error(`Cashfree network error: ${err.message}`)));
    req.setTimeout(15_000, () => {
      req.destroy();
      reject(new Error('Cashfree API request timed out after 15 s'));
    });

    if (payload) req.write(payload);
    req.end();
  });
}

// ─── Plans ────────────────────────────────────────────────────────────────────

/**
 * Get or create the Cashfree plan for the given key and currency.
 * Checks env override → DB cache → creates via API.
 *
 * @param {'starter'|'pro'} planKey
 * @param {'INR'|'USD'}     currency
 * @returns {Promise<string>} Cashfree plan ID (e.g. 'vidapulse_starter_inr_monthly')
 */
async function getOrCreatePlan(planKey, currency) {
  const defKey = `${planKey}_${currency}`;
  const def    = PLAN_DEFS[defKey];
  if (!def) throw new Error(`Unknown plan/currency combination: ${planKey} ${currency}`);

  // 1. Env override
  const envId = ENV_PLAN_IDS()[defKey];
  if (envId) {
    logger.debug(`[cashfree] Using env plan ID ${envId} for ${defKey}`);
    return envId;
  }

  // 2. DB cache
  const { rows } = await pool.query(
    `SELECT cashfree_plan_id FROM cashfree_plans WHERE plan_key = $1`,
    [defKey]
  );
  if (rows.length) {
    logger.debug(`[cashfree] Using cached plan ${rows[0].cashfree_plan_id} for ${defKey}`);
    return rows[0].cashfree_plan_id;
  }

  // 3. Create via API
  const planId = `vidapulse_${planKey}_${currency.toLowerCase()}_monthly`;
  logger.info(`[cashfree] Creating plan ${planId} — ${def.amount} ${def.currency}/mo`);

  await _request('POST', '/plans', {
    planId      : planId,
    name        : def.name,
    type        : 'PERIODIC',
    maxCycles   : 120,         // ~10 years — effectively perpetual
    amount      : def.amount,
    currency    : def.currency,
    intervals   : 1,
    intervalType: 'Month',
  });

  // Cache in DB
  await pool.query(
    `INSERT INTO cashfree_plans (plan_key, cashfree_plan_id, amount, currency)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (plan_key) DO UPDATE
       SET cashfree_plan_id = EXCLUDED.cashfree_plan_id`,
    [defKey, planId, def.amount, def.currency]
  );

  logger.info(`[cashfree] Created and cached plan ${planId} for ${defKey}`);
  return planId;
}

// ─── Subscriptions ────────────────────────────────────────────────────────────

/**
 * Create a Cashfree Subscription for the user and return the hosted payment URL.
 *
 * Steps:
 *   1. Get/create the Cashfree plan (planKey + currency)
 *   2. Create subscription with user details + tNote for webhook identification
 *   3. Store subscription ID on the user row
 *   4. Return authLink for frontend redirect
 *
 * @param {{ id: string, name: string, email: string, phone?: string }} user
 * @param {'starter'|'pro'} planKey
 * @param {'INR'|'USD'}     currency
 * @param {string}          returnUrl  e.g. https://app.vidapulse.in/payment/starter
 * @returns {Promise<{ subscriptionId: string, paymentUrl: string }>}
 */
async function createSubscription(user, planKey, currency, returnUrl) {
  const planId = await getOrCreatePlan(planKey, currency);

  // Unique ID: vp_{userId}_{plan}_{timestamp}
  const subscriptionId = `vp_${user.id}_${planKey}_${Date.now()}`;

  logger.info(
    `[cashfree] Creating subscription ${subscriptionId} for user ${user.id} ` +
    `— ${planKey} ${currency} cf_plan=${planId}`
  );

  const result = await _request('POST', '/', {
    subscriptionId,
    planId,
    customerName : user.name  || user.email,
    customerEmail: user.email,
    customerPhone: (user.phone || '').replace(/\D/g, '').slice(-10) || '0000000000',
    returnUrl,
    authAmount   : 0,                        // no auth charge — first charge = plan amount
    expiresOn    : '2035-12-31 00:00:00',    // far future — effectively perpetual
    // tNote carries user_id + plan so the webhook can identify who paid
    tNote        : JSON.stringify({ user_id: String(user.id), plan: planKey, currency }),
  });

  if (!result.authLink) {
    throw new Error(
      `Cashfree did not return authLink. Response: ${JSON.stringify(result).slice(0, 300)}`
    );
  }

  // Store the subscription ID on the user
  await pool.query(
    `UPDATE users
     SET    cashfree_subscription_id = $1,
            updated_at               = NOW()
     WHERE  id = $2`,
    [subscriptionId, user.id]
  );

  logger.info(`[cashfree] Subscription ${subscriptionId} created for user ${user.id}`);
  return { subscriptionId, paymentUrl: result.authLink };
}

// ─── Cancel ───────────────────────────────────────────────────────────────────

/**
 * Cancel a Cashfree subscription immediately.
 * @param {string} subscriptionId  Our internal subscription ID (vp_xxx_...)
 */
async function cancelSubscription(subscriptionId) {
  logger.info(`[cashfree] Cancelling subscription ${subscriptionId}`);
  await _request('POST', `/${subscriptionId}/cancel`, {});
  logger.info(`[cashfree] Cancelled subscription ${subscriptionId}`);
}

// ─── Webhook signature verification ──────────────────────────────────────────

/**
 * Verify a Cashfree webhook signature.
 *
 * Supports TWO formats automatically:
 *
 * ── Format A: 2025-01-01 (new, header-based) ──────────────────────────────
 *   Detected by presence of 'x-webhook-timestamp' header.
 *   signature = base64( HMAC-SHA256( timestamp + rawBody, secret ) )
 *   Sent in 'x-webhook-signature' header.
 *
 * ── Format B: Legacy subscription API (body-based) ────────────────────────
 *   signature = base64( HMAC-SHA256( subscriptionId+txTime+referenceId+txMsg+amount, secret ) )
 *   Sent as 'signature' field inside the JSON body.
 *
 * Returns true if valid, false if invalid, true if CASHFREE_WEBHOOK_SECRET not set.
 *
 * @param {object} body     Parsed JSON webhook body
 * @param {object} headers  HTTP request headers (req.headers)
 * @param {string} rawBody  Raw request body string (req.rawBody) — needed for Format A
 * @returns {boolean}
 */
function verifyWebhookSignature(body, headers, rawBody) {
  const secret = env.CASHFREE_WEBHOOK_SECRET;
  if (!secret) return true;  // verification disabled — accept all

  // ── Format A: 2025-01-01 header-based ────────────────────────────────────
  const timestamp = headers?.['x-webhook-timestamp'];
  const headerSig = headers?.['x-webhook-signature'];

  if (timestamp && headerSig) {
    const raw      = rawBody || JSON.stringify(body);
    const data     = timestamp + raw;
    const expected = crypto.createHmac('sha256', secret).update(data).digest('base64');
    try {
      const sigBuf = Buffer.from(headerSig, 'base64');
      const expBuf = Buffer.from(expected,  'base64');
      if (sigBuf.length !== expBuf.length) return false;
      return crypto.timingSafeEqual(sigBuf, expBuf);
    } catch {
      return false;
    }
  }

  // ── Format B: legacy body-based (older subscription API) ─────────────────
  const { subscriptionId = '', txTime = '', referenceId = '',
          txMsg = '', amount = '', signature } = body;
  if (!signature) return false;

  const data     = `${subscriptionId}${txTime}${referenceId}${txMsg}${amount}`;
  const expected = crypto.createHmac('sha256', secret).update(data).digest('base64');
  try {
    const sigBuf = Buffer.from(signature, 'base64');
    const expBuf = Buffer.from(expected,  'base64');
    if (sigBuf.length !== expBuf.length) return false;
    return crypto.timingSafeEqual(sigBuf, expBuf);
  } catch {
    return false;
  }
}

module.exports = {
  getOrCreatePlan,
  createSubscription,
  cancelSubscription,
  verifyWebhookSignature,
};
