'use strict';

/**
 * Payments routes — /api/payments/*
 *
 * POST /api/payments/razorpay  — webhook endpoint for Razorpay to call
 *   • No JWT auth — Razorpay calls this from their servers
 *   • Verified via HMAC-SHA256 signature if RAZORPAY_WEBHOOK_SECRET is set
 *   • Handles: payment_link.paid, payment.captured
 *   • On success: upgrades user plan, logs payment, emits plan_upgraded event
 *
 * How it identifies the user:
 *   The frontend appends notes[user_id]=<id>&notes[plan]=<plan> to the
 *   Razorpay payment URL before redirecting. Razorpay stores these notes
 *   with the payment and includes them in the webhook payload.
 *
 * Razorpay webhook URL to configure in Razorpay dashboard:
 *   https://app.vidapulse.in/api/payments/razorpay
 * Events to subscribe:
 *   payment_link.paid, payment.captured
 */

const express = require('express');
const crypto  = require('crypto');

const router        = express.Router();
const { pool }      = require('../config/database');
const env           = require('../config/env');
const logger        = require('../config/logger');
const { emitEvent } = require('../services/behavioralEventService');

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payments/razorpay
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

      // req.rawBody is set by the verify function in express.json() in index.js
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

    // ── 2. Only process relevant events ───────────────────────────────────
    const HANDLED_EVENTS = ['payment_link.paid', 'payment.captured'];
    if (!HANDLED_EVENTS.includes(eventType)) {
      // Acknowledge unknown events so Razorpay doesn't retry
      logger.debug(`[payments] Ignoring Razorpay event: ${eventType}`);
      return res.json({ ok: true, ignored: true });
    }

    // ── 3. Extract payment data + notes ───────────────────────────────────
    const paymentEntity  = body?.payload?.payment?.entity      ?? {};
    const linkEntity     = body?.payload?.payment_link?.entity ?? {};

    // Notes can be on either the payment or the link — merge, payment wins
    const notes = { ...(linkEntity.notes ?? {}), ...(paymentEntity.notes ?? {}) };

    const razorpayPaymentId = paymentEntity.id              || null;
    const razorpayOrderId   = paymentEntity.order_id        || null;
    const razorpayLinkId    = linkEntity.id                  || paymentEntity.payment_link_id || null;
    const amountPaise       = parseInt(paymentEntity.amount  || 0, 10);
    const currency          = paymentEntity.currency         || 'INR';
    const status            = paymentEntity.status           || 'captured';

    // notes[user_id] and notes[plan] are set by the frontend when building the URL.
    // users.id is UUID (not integer) — extract as string, not parseInt.
    const userId  = notes.user_id ? String(notes.user_id).trim() : null;
    const planKey = (notes.plan   || '').toLowerCase().trim();

    logger.info(
      `[payments] Razorpay ${eventType} — user_id=${userId} plan=${planKey} ` +
      `payment_id=${razorpayPaymentId} amount=${amountPaise}`
    );

    // ── 4. Validate plan ───────────────────────────────────────────────────
    if (!['starter', 'pro'].includes(planKey)) {
      logger.warn(`[payments] Invalid plan in notes: "${planKey}" — logging but not upgrading`);
      await _logPayment({
        userId, razorpayPaymentId, razorpayOrderId, razorpayLinkId,
        plan: planKey || 'unknown', amountPaise, currency, status,
        notes, eventType,
      });
      return res.json({ ok: true, warning: 'Unknown plan in notes — payment logged, plan not changed' });
    }

    // ── 5. Deduplication — ignore if this payment_id was already processed ─
    if (razorpayPaymentId) {
      const { rows: existing } = await pool.query(
        `SELECT id FROM payments WHERE razorpay_payment_id = $1`,
        [razorpayPaymentId]
      );
      if (existing.length > 0) {
        logger.info(`[payments] Duplicate webhook for payment ${razorpayPaymentId} — skipping`);
        return res.json({ ok: true, duplicate: true });
      }
    }

    // ── 6. Log the payment (BEFORE upgrading so we have a record even on error) ─
    await _logPayment({
      userId, razorpayPaymentId, razorpayOrderId, razorpayLinkId,
      plan: planKey, amountPaise, currency, status, notes, eventType,
    });

    // ── 7. Upgrade user plan ───────────────────────────────────────────────
    if (!userId) {
      logger.warn('[payments] notes.user_id is missing — payment logged but plan NOT upgraded');
      return res.json({ ok: true, warning: 'notes.user_id missing — plan not upgraded' });
    }

    // Fetch the target plan's ID
    const { rows: planRows } = await pool.query(
      `SELECT id, name, display_name FROM plans WHERE name = $1 AND is_active = TRUE LIMIT 1`,
      [planKey]
    );
    if (!planRows.length) {
      logger.error(`[payments] Plan "${planKey}" not found in DB`);
      return res.status(200).json({ ok: true, error: `Plan "${planKey}" not found` });
    }
    const newPlan = planRows[0];

    // Fetch user to check they exist and to log current plan
    const { rows: userRows } = await pool.query(
      `SELECT u.id, u.email, p.name AS current_plan
       FROM users u JOIN plans p ON p.id = u.plan_id
       WHERE u.id = $1 AND u.is_active = TRUE`,
      [userId]
    );
    if (!userRows.length) {
      logger.warn(`[payments] User ${userId} not found or inactive — plan not upgraded`);
      return res.json({ ok: true, warning: `User ${userId} not found` });
    }
    const user = userRows[0];

    // Update plan
    await pool.query(
      `UPDATE users SET plan_id = $1, updated_at = NOW() WHERE id = $2`,
      [newPlan.id, userId]
    );

    // Mark as converted in onboarding_state
    await pool.query(
      `UPDATE onboarding_state
       SET converted_to_paid_at = COALESCE(converted_to_paid_at, NOW()),
           current_step         = 'converted'
       WHERE user_id = $1`,
      [userId]
    );

    logger.info(
      `[payments] ✓ User ${userId} (${user.email}) upgraded ` +
      `${user.current_plan} → ${planKey} via Razorpay payment ${razorpayPaymentId}`
    );

    // ── 8. Emit plan_upgraded behavioral event (fires contact webhook to CRM) ─
    emitEvent(userId, 'plan_upgraded', null, {
      old_plan          : user.current_plan,
      new_plan          : planKey,
      razorpay_payment_id: razorpayPaymentId || '',
      amount_inr        : amountPaise ? (amountPaise / 100).toFixed(2) : '',
    });

    return res.json({ ok: true, upgraded: true, plan: planKey });

  } catch (err) {
    logger.error(`[payments] Razorpay webhook error: ${err.message}`);
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Helper
// ─────────────────────────────────────────────────────────────────────────────

async function _logPayment({
  userId, razorpayPaymentId, razorpayOrderId, razorpayLinkId,
  plan, amountPaise, currency, status, notes, eventType,
}) {
  try {
    await pool.query(
      `INSERT INTO payments
         (user_id, razorpay_payment_id, razorpay_order_id, razorpay_link_id,
          plan, amount_paise, currency, status, notes, razorpay_event)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (razorpay_payment_id) DO NOTHING`,
      [
        userId            || null,
        razorpayPaymentId || null,
        razorpayOrderId   || null,
        razorpayLinkId    || null,
        plan,
        amountPaise       || null,
        currency,
        status,
        JSON.stringify(notes ?? {}),
        eventType         || null,
      ]
    );
  } catch (err) {
    logger.error(`[payments] _logPayment failed: ${err.message}`);
  }
}

module.exports = router;
