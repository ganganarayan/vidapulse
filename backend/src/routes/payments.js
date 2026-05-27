'use strict';

/**
 * Payments routes — /api/payments/*
 *
 * POST /api/payments/subscribe      — create a Razorpay Subscription for the user
 *   • Requires JWT auth
 *   • Creates Razorpay Customer (once per user) + Subscription
 *   • Returns { paymentUrl } — frontend redirects there
 *
 * POST /api/payments/razorpay       — webhook endpoint for Razorpay to call
 *   • No JWT auth — Razorpay calls this from their servers
 *   • Verified via HMAC-SHA256 signature if RAZORPAY_WEBHOOK_SECRET is set
 *   • Handles: payment_link.paid, payment.captured (one-time payments)
 *             subscription.charged (monthly renewal → extend plan_expires_at)
 *             subscription.halted  (payment failed → notify user)
 *             subscription.cancelled, subscription.completed (→ downgrade to free)
 *
 * Return URLs (Razorpay redirects here after payment):
 *   https://app.vidapulse.in/payment/starter
 *   https://app.vidapulse.in/payment/pro
 *
 * Razorpay webhook URL to configure in Razorpay dashboard:
 *   https://app.vidapulse.in/api/payments/razorpay
 * Events to subscribe:
 *   payment_link.paid, payment.captured,
 *   subscription.charged, subscription.halted,
 *   subscription.cancelled, subscription.completed
 */

const express = require('express');
const crypto  = require('crypto');

const router             = express.Router();
const { pool }           = require('../config/database');
const env                = require('../config/env');
const logger             = require('../config/logger');
const { emitEvent }      = require('../services/behavioralEventService');
const { requireAuth }    = require('../middleware/requireAuth');
const razorpay           = require('../services/razorpayService');

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payments/subscribe   (authenticated)
// Creates a Razorpay Subscription for the calling user and returns the
// hosted payment URL. Frontend redirects to that URL.
// ─────────────────────────────────────────────────────────────────────────────

router.post('/subscribe', requireAuth, async (req, res, next) => {
  try {
    const { plan } = req.body;

    if (!['starter', 'pro'].includes(plan)) {
      return res.status(400).json({ error: 'plan must be "starter" or "pro"' });
    }

    if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
      logger.error('[payments] Razorpay API keys not configured');
      return res.status(503).json({ error: 'Payment service not configured. Please contact support.' });
    }

    const user = req.user;

    // Block downgrade attempts (free→starter is upgrade, starter→starter is noop)
    const PLAN_ORDER = { free: 0, starter: 1, pro: 2, admin_lifetime: 3 };
    if ((PLAN_ORDER[plan] ?? 0) <= (PLAN_ORDER[user.plan] ?? 0)) {
      return res.status(400).json({ error: `You are already on the ${user.plan} plan or higher` });
    }

    const returnUrl = `${env.APP_URL}/payment/${plan}`;

    const { subscriptionId, paymentUrl } = await razorpay.createSubscription(
      { id: user.id, name: user.name, email: user.email, phone: user.phone },
      plan,
      returnUrl,
    );

    logger.info(`[payments] Subscription ${subscriptionId} created for user ${user.id} (${plan})`);

    return res.json({ paymentUrl, subscriptionId });

  } catch (err) {
    logger.error(`[payments] /subscribe error: ${err.message}`);
    // Surface Razorpay errors as 502 (upstream failed), others as 500
    const status = err.message.includes('Razorpay API') ? 502 : 500;
    return res.status(status).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/payments/billing   (authenticated)
// Returns the calling user's payment history for the Billing page.
// Rows are ordered newest-first; each includes a computed period_end_at
// (+30 days from created_at) and razorpay_invoice_id for the download link.
// ─────────────────────────────────────────────────────────────────────────────

router.get('/billing', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT
         id,
         razorpay_payment_id,
         razorpay_invoice_id,
         plan,
         amount_paise,
         currency,
         status,
         razorpay_event,
         payment_method,
         created_at,
         (created_at + INTERVAL '30 days') AS period_end_at
       FROM   payments
       WHERE  user_id = $1
       ORDER  BY created_at DESC
       LIMIT  100`,
      [req.user.id]
    );

    return res.json({
      payments: rows.map(r => ({
        id                  : r.id,
        razorpay_payment_id : r.razorpay_payment_id,
        razorpay_invoice_id : r.razorpay_invoice_id,
        plan                : r.plan,
        amount_inr          : r.amount_paise ? (r.amount_paise / 100) : null,
        currency            : r.currency,
        status              : r.status,
        event               : r.razorpay_event,
        payment_method      : r.payment_method ?? null,
        paid_at             : r.created_at,
        period_end_at       : r.period_end_at,
        // invoice_url: constructed on the frontend from razorpay_invoice_id
        // backend redirect available at GET /api/payments/billing/invoice/:paymentId
      })),
    });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/payments/billing/invoice/:paymentId   (authenticated)
// Fetches the Razorpay invoice URL for a specific payment and redirects to it.
// Security: verifies the payment belongs to the calling user before redirecting.
// ─────────────────────────────────────────────────────────────────────────────

router.get('/billing/invoice/:paymentId', requireAuth, async (req, res, next) => {
  try {
    const { paymentId } = req.params;

    // Verify ownership
    const { rows } = await pool.query(
      `SELECT razorpay_payment_id, razorpay_invoice_id
       FROM   payments
       WHERE  id = $1 AND user_id = $2
       LIMIT  1`,
      [paymentId, req.user.id]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    const { razorpay_payment_id, razorpay_invoice_id } = rows[0];

    // If we have an invoice ID, fetch the invoice URL via Razorpay API
    if (razorpay_invoice_id && env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET) {
      try {
        const rz      = require('../services/razorpayService');
        // We need to call the Razorpay API directly here
        const https   = require('https');
        const auth    = Buffer.from(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`).toString('base64');

        const invoice = await new Promise((resolve, reject) => {
          const options = {
            hostname: 'api.razorpay.com', port: 443,
            path: `/v1/invoices/${razorpay_invoice_id}`,
            method: 'GET',
            headers: { 'Authorization': `Basic ${auth}` },
          };
          const req2 = https.request(options, (r) => {
            let data = '';
            r.on('data', c => { data += c; });
            r.on('end', () => {
              try   { resolve(JSON.parse(data)); }
              catch { reject(new Error('Bad JSON from Razorpay')); }
            });
          });
          req2.on('error', reject);
          req2.setTimeout(10_000, () => { req2.destroy(); reject(new Error('Timeout')); });
          req2.end();
        });

        if (invoice?.short_url) {
          return res.redirect(302, invoice.short_url);
        }
      } catch (err) {
        logger.warn(`[payments] invoice redirect failed for ${razorpay_invoice_id}: ${err.message}`);
      }
    }

    // Fallback: redirect to Razorpay payment receipt page (public URL)
    if (razorpay_payment_id) {
      return res.redirect(302, `https://rzp.io/i/${razorpay_payment_id}`);
    }

    return res.status(404).json({ error: 'Invoice not available for this payment' });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payments/razorpay   (public — called by Razorpay servers)
// ─────────────────────────────────────────────────────────────────────────────

router.post('/razorpay', async (req, res, next) => {
  try {
    // ── 1. Signature verification ──────────────────────────────────────────
    if (env.RAZORPAY_WEBHOOK_SECRET) {
      const sig = req.headers['x-razorpay-signature'];
      if (!sig) {
        logger.warn('[payments] Razorpay webhook received without signature header');
        return res.status(400).json({ error: 'Missing x-razorpay-signature' });
      }

      const rawBody = req.rawBody;
      if (!rawBody) {
        logger.error('[payments] req.rawBody not available — check express.json verify function');
        return res.status(500).json({ error: 'Server configuration error' });
      }

      const expected = crypto
        .createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET)
        .update(rawBody)
        .digest('hex');

      let sigMatch = false;
      try {
        sigMatch = crypto.timingSafeEqual(
          Buffer.from(sig,      'hex'),
          Buffer.from(expected, 'hex')
        );
      } catch {
        sigMatch = false;
      }

      if (!sigMatch) {
        logger.warn('[payments] Razorpay webhook signature mismatch — rejected');
        return res.status(400).json({ error: 'Invalid signature' });
      }
    }

    const body      = req.body;
    const eventType = body?.event;

    // ── 2. Route to the right handler ─────────────────────────────────────
    const HANDLED_EVENTS = [
      'payment_link.paid',
      'payment.captured',
      'subscription.charged',
      'subscription.halted',
      'subscription.cancelled',
      'subscription.completed',
    ];

    if (!HANDLED_EVENTS.includes(eventType)) {
      logger.debug(`[payments] Ignoring Razorpay event: ${eventType}`);
      return res.json({ ok: true, ignored: true });
    }

    // Dispatch to the right handler
    if (eventType === 'payment_link.paid' || eventType === 'payment.captured') {
      return await _handleOneTimePayment(body, eventType, res);
    }

    if (eventType === 'subscription.charged') {
      return await _handleSubscriptionCharged(body, res);
    }

    if (eventType === 'subscription.halted') {
      return await _handleSubscriptionHalted(body, res);
    }

    if (eventType === 'subscription.cancelled' || eventType === 'subscription.completed') {
      return await _handleSubscriptionEnded(body, eventType, res);
    }

  } catch (err) {
    logger.error(`[payments] Razorpay webhook error: ${err.message}`);
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Helper: extract a clean payment_method string from a Razorpay payment entity.
// PayPal comes through as method='wallet' + wallet='paypal'.
// ─────────────────────────────────────────────────────────────────────────────

function _extractPaymentMethod(paymentEntity) {
  const method = (paymentEntity.method || '').toLowerCase();
  if (!method) return 'unknown';
  if (method === 'wallet') {
    const wallet = (paymentEntity.wallet || '').toLowerCase();
    if (wallet === 'paypal') return 'paypal';
    if (wallet) return `wallet_${wallet}`;
    return 'wallet';
  }
  return method; // 'card' | 'upi' | 'netbanking' | 'emi' | 'paylater' etc.
}

// ─────────────────────────────────────────────────────────────────────────────
// Handler: one-time payment (payment_link.paid | payment.captured)
// ─────────────────────────────────────────────────────────────────────────────

async function _handleOneTimePayment(body, eventType, res) {
  const paymentEntity = body?.payload?.payment?.entity      ?? {};
  const linkEntity    = body?.payload?.payment_link?.entity ?? {};
  const notes         = { ...(linkEntity.notes ?? {}), ...(paymentEntity.notes ?? {}) };

  const razorpayPaymentId = paymentEntity.id              || null;
  const razorpayOrderId   = paymentEntity.order_id        || null;
  const razorpayLinkId    = linkEntity.id || paymentEntity.payment_link_id || null;
  const amountPaise       = parseInt(paymentEntity.amount  || 0, 10);
  const currency          = paymentEntity.currency         || 'INR';
  const status            = paymentEntity.status           || 'captured';
  const userId            = notes.user_id ? String(notes.user_id).trim() : null;
  const planKey           = (notes.plan || '').toLowerCase().trim();
  const paymentMethod     = _extractPaymentMethod(paymentEntity);

  logger.info(
    `[payments] ${eventType} — user_id=${userId} plan=${planKey} ` +
    `payment_id=${razorpayPaymentId} amount=${amountPaise}`
  );

  if (!['starter', 'pro'].includes(planKey)) {
    // Don't log to payments table — CHECK constraint requires plan IN ('starter','pro')
    logger.warn(`[payments] ${eventType}: unknown plan "${planKey}" — not logging to payments table`);
    return res.json({ ok: true, warning: 'Unknown plan in notes' });
  }

  // Deduplication
  if (razorpayPaymentId) {
    const { rows } = await pool.query(
      `SELECT id FROM payments WHERE razorpay_payment_id = $1`, [razorpayPaymentId]
    );
    if (rows.length > 0) {
      return res.json({ ok: true, duplicate: true });
    }
  }

  await _logPayment({ userId, razorpayPaymentId, razorpayOrderId, razorpayLinkId,
    plan: planKey, amountPaise, currency, status, notes, eventType, paymentMethod });

  if (!userId) {
    return res.json({ ok: true, warning: 'notes.user_id missing' });
  }

  await _upgradePlan(userId, planKey, amountPaise, razorpayPaymentId, eventType);
  return res.json({ ok: true, upgraded: true, plan: planKey });
}

// ─────────────────────────────────────────────────────────────────────────────
// Handler: subscription.charged — monthly renewal
// ─────────────────────────────────────────────────────────────────────────────

async function _handleSubscriptionCharged(body, res) {
  const paymentEntity      = body?.payload?.payment?.entity      ?? {};
  const subscriptionEntity = body?.payload?.subscription?.entity ?? {};

  const subscriptionId    = subscriptionEntity.id || paymentEntity.subscription_id || null;
  const notes             = subscriptionEntity.notes ?? {};
  const amountPaise       = parseInt(paymentEntity.amount || 0, 10);
  const razorpayPaymentId = paymentEntity.id    || null;
  const razorpayInvoiceId = paymentEntity.invoice_id || null;
  const paymentMethod     = _extractPaymentMethod(paymentEntity);

  // User identification: prefer notes.user_id, fall back to email match
  let userId  = notes.user_id ? String(notes.user_id).trim() : null;
  const planKey = (notes.plan || '').toLowerCase().trim() || null;

  if (!userId && paymentEntity.email) {
    const { rows } = await pool.query(
      `SELECT id FROM users WHERE email = $1 AND is_active = TRUE LIMIT 1`,
      [paymentEntity.email.toLowerCase()]
    );
    userId = rows[0]?.id ?? null;
  }

  logger.info(
    `[payments] subscription.charged — subscription=${subscriptionId} ` +
    `user_id=${userId} plan=${planKey} amount=${amountPaise}`
  );

  if (!userId) {
    logger.warn('[payments] subscription.charged: cannot identify user — no notes.user_id or email match');
    return res.json({ ok: true, warning: 'user not identified' });
  }

  // Deduplication by payment ID
  if (razorpayPaymentId) {
    const { rows } = await pool.query(
      `SELECT id FROM payments WHERE razorpay_payment_id = $1`, [razorpayPaymentId]
    );
    if (rows.length > 0) {
      return res.json({ ok: true, duplicate: true });
    }
  }

  // Log the payment (only if plan is resolvable — payments table CHECK requires starter|pro)
  if (planKey && ['starter', 'pro'].includes(planKey)) {
    await _logPayment({
      userId, razorpayPaymentId, razorpayOrderId: null,
      razorpayLinkId: subscriptionId, razorpayInvoiceId,
      plan: planKey, amountPaise,
      currency: paymentEntity.currency || 'INR',
      status: 'captured', notes, eventType: 'subscription.charged', paymentMethod,
    });
  }

  // Determine the plan from the subscription if not in notes
  let resolvedPlan = planKey;
  if (!resolvedPlan || !['starter','pro'].includes(resolvedPlan)) {
    // Try to resolve from the users table current plan
    const { rows } = await pool.query(
      `SELECT p.name FROM users u JOIN plans p ON p.id = u.plan_id WHERE u.id = $1`,
      [userId]
    );
    resolvedPlan = rows[0]?.name;
  }

  if (!['starter', 'pro'].includes(resolvedPlan)) {
    logger.warn(`[payments] subscription.charged: unresolvable plan for user ${userId}`);
    return res.json({ ok: true, warning: 'plan could not be resolved' });
  }

  // Extend plan by 30 days from now (or from current expires_at if still in future)
  await pool.query(
    `UPDATE users
     SET plan_expires_at          = GREATEST(COALESCE(plan_expires_at, NOW()), NOW()) + INTERVAL '30 days',
         plan_enrolled_at         = COALESCE(plan_enrolled_at, NOW()),
         razorpay_subscription_id = COALESCE(razorpay_subscription_id, $2),
         updated_at               = NOW()
     WHERE id = $1`,
    [userId, subscriptionId]
  );

  // Also ensure the plan itself is set (in case of re-activation after expiry)
  await _upgradePlanRecord(userId, resolvedPlan);

  // Mark converted in onboarding
  await pool.query(
    `UPDATE onboarding_state
     SET converted_to_paid_at = COALESCE(converted_to_paid_at, NOW()),
         current_step         = 'converted'
     WHERE user_id = $1`,
    [userId]
  );

  emitEvent(userId, 'plan_upgraded', null, {
    old_plan           : null,
    new_plan           : resolvedPlan,
    razorpay_payment_id: razorpayPaymentId || '',
    amount_inr         : amountPaise ? (amountPaise / 100).toFixed(2) : '',
    via                : 'subscription',
  });

  logger.info(`[payments] ✓ User ${userId} plan renewed → ${resolvedPlan} (+30 days)`);
  return res.json({ ok: true, renewed: true, plan: resolvedPlan });
}

// ─────────────────────────────────────────────────────────────────────────────
// Handler: subscription.halted — payment failure, subscription suspended
// ─────────────────────────────────────────────────────────────────────────────

async function _handleSubscriptionHalted(body, res) {
  const subscriptionEntity = body?.payload?.subscription?.entity ?? {};
  const subscriptionId     = subscriptionEntity.id || null;
  const notes              = subscriptionEntity.notes ?? {};

  let userId = notes.user_id ? String(notes.user_id).trim() : null;

  if (!userId && subscriptionId) {
    const { rows } = await pool.query(
      `SELECT id FROM users WHERE razorpay_subscription_id = $1 AND is_active = TRUE LIMIT 1`,
      [subscriptionId]
    );
    userId = rows[0]?.id ?? null;
  }

  logger.warn(`[payments] subscription.halted — subscription=${subscriptionId} user_id=${userId}`);

  if (userId) {
    // Emit event so DivineLead CRM can send a payment-failed message
    emitEvent(userId, 'subscription_payment_failed', null, {
      razorpay_subscription_id: subscriptionId || '',
    });
  }

  return res.json({ ok: true, halted: true });
}

// ─────────────────────────────────────────────────────────────────────────────
// Handler: subscription.cancelled | subscription.completed
// Plan expires at the current plan_expires_at (we don't force-downgrade here —
// the daily cron job handles downgrade when plan_expires_at passes).
// ─────────────────────────────────────────────────────────────────────────────

async function _handleSubscriptionEnded(body, eventType, res) {
  const subscriptionEntity = body?.payload?.subscription?.entity ?? {};
  const subscriptionId     = subscriptionEntity.id || null;
  const notes              = subscriptionEntity.notes ?? {};

  let userId = notes.user_id ? String(notes.user_id).trim() : null;

  if (!userId && subscriptionId) {
    const { rows } = await pool.query(
      `SELECT id FROM users WHERE razorpay_subscription_id = $1 AND is_active = TRUE LIMIT 1`,
      [subscriptionId]
    );
    userId = rows[0]?.id ?? null;
  }

  logger.info(`[payments] ${eventType} — subscription=${subscriptionId} user_id=${userId}`);

  if (userId) {
    // Clear the subscription ID so it won't be charged again;
    // plan_expires_at stays as-is — user keeps access until it expires.
    // The daily cron job will downgrade them to free when it passes.
    await pool.query(
      `UPDATE users
       SET razorpay_subscription_id = NULL,
           updated_at               = NOW()
       WHERE id = $1`,
      [userId]
    );

    emitEvent(userId, 'subscription_cancelled', null, {
      razorpay_subscription_id: subscriptionId || '',
      event_type               : eventType,
    });
  }

  return res.json({ ok: true, ended: true });
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Upgrade a user's plan: set plan_id, plan_enrolled_at, plan_expires_at (+30 days).
 * Also marks onboarding as converted.
 */
async function _upgradePlan(userId, planKey, amountPaise, razorpayPaymentId, eventType) {
  const { rows: planRows } = await pool.query(
    `SELECT id, name FROM plans WHERE name = $1 AND is_active = TRUE LIMIT 1`,
    [planKey]
  );
  if (!planRows.length) {
    logger.error(`[payments] Plan "${planKey}" not found in DB`);
    return;
  }

  const { rows: userRows } = await pool.query(
    `SELECT u.id, u.email, p.name AS current_plan
     FROM users u JOIN plans p ON p.id = u.plan_id
     WHERE u.id = $1 AND u.is_active = TRUE`,
    [userId]
  );
  if (!userRows.length) {
    logger.warn(`[payments] User ${userId} not found or inactive`);
    return;
  }
  const user = userRows[0];

  await pool.query(
    `UPDATE users
     SET plan_id          = $1,
         plan_enrolled_at = COALESCE(plan_enrolled_at, NOW()),
         plan_expires_at  = NOW() + INTERVAL '30 days',
         updated_at       = NOW()
     WHERE id = $2`,
    [planRows[0].id, userId]
  );

  await pool.query(
    `UPDATE onboarding_state
     SET converted_to_paid_at = COALESCE(converted_to_paid_at, NOW()),
         current_step         = 'converted'
     WHERE user_id = $1`,
    [userId]
  );

  logger.info(
    `[payments] ✓ User ${userId} (${user.email}) upgraded ` +
    `${user.current_plan} → ${planKey} (payment ${razorpayPaymentId})`
  );

  emitEvent(userId, 'plan_upgraded', null, {
    old_plan           : user.current_plan,
    new_plan           : planKey,
    razorpay_payment_id: razorpayPaymentId || '',
    amount_inr         : amountPaise ? (amountPaise / 100).toFixed(2) : '',
  });
}

/**
 * Update plan_id only (no enrolled/expires touch).
 * Used when subscription renewal re-activates after expiry.
 */
async function _upgradePlanRecord(userId, planKey) {
  const { rows } = await pool.query(
    `SELECT id FROM plans WHERE name = $1 AND is_active = TRUE LIMIT 1`, [planKey]
  );
  if (!rows.length) return;
  await pool.query(
    `UPDATE users SET plan_id = $1, updated_at = NOW() WHERE id = $2`,
    [rows[0].id, userId]
  );
}

async function _logPayment({
  userId, razorpayPaymentId, razorpayOrderId, razorpayLinkId, razorpayInvoiceId,
  plan, amountPaise, currency, status, notes, eventType, paymentMethod,
}) {
  try {
    await pool.query(
      `INSERT INTO payments
         (user_id, razorpay_payment_id, razorpay_order_id, razorpay_link_id,
          razorpay_invoice_id, plan, amount_paise, currency, status, notes,
          razorpay_event, payment_method)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       ON CONFLICT (razorpay_payment_id) DO NOTHING`,
      [
        userId              || null,
        razorpayPaymentId   || null,
        razorpayOrderId     || null,
        razorpayLinkId      || null,
        razorpayInvoiceId   || null,
        plan,
        amountPaise         || null,
        currency,
        status,
        JSON.stringify(notes ?? {}),
        eventType           || null,
        paymentMethod       || null,
      ]
    );
  } catch (err) {
    logger.error(`[payments] _logPayment failed: ${err.message}`);
  }
}

module.exports = router;
