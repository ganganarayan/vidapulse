'use strict';

/**
 * Webhook routes — /api/webhook/*
 *
 * All routes here are called by divineleads.guru, NOT by end users.
 * Every route is protected by the webhookAuth middleware.
 *
 * Current routes:
 *   POST /api/webhook/create-user  — creates a subscriber account
 *
 * Future routes (added when needed):
 *   POST /api/webhook/update-plan  — change a subscriber's plan/expiry
 *   POST /api/webhook/deactivate   — deactivate a subscriber account
 */

const express = require('express');
const { z }   = require('zod');
const router  = express.Router();

const { webhookAuth }          = require('../middleware/webhookAuth');
const { createUserFromWebhook } = require('../services/userService');
const { pool }                 = require('../config/database');
const logger                   = require('../config/logger');

// ─────────────────────────────────────────────────────────────
// Zod validation schema for the create-user webhook payload
// Matches the payload format agreed with divineleads.guru
// ─────────────────────────────────────────────────────────────

const createUserSchema = z.object({
  name : z.string().min(1, 'Name is required').max(255).trim(),
  email: z.string().email('Invalid email address').max(255),
  phone: z.string().max(30).optional().nullable(),

  // Only these three plan names are accepted from the webhook.
  // admin_lifetime is internal only and cannot be assigned via webhook.
  // Defaults to 'free' when not provided.
  plan : z.enum(['free', 'starter', 'pro'], {
    errorMap: () => ({ message: 'plan must be one of: free, starter, pro' }),
  }).optional().default('free'),

  // Optional classification fields — drive divineleads email branching
  use_case: z.enum([
    'vsl_funnel', 'webinar_replay', 'coaching_clients', 'sales_demo', 'other',
  ]).optional().nullable(),

  business_segment: z.enum([
    'coach', 'creator', 'product_promoter', 'digital_agency', 'b2b_sales', 'other',
  ]).optional().nullable(),

  // plan_expires_at: no longer used — plans don't expire in VidaPulse.
  // Accepted and silently ignored for backward compatibility with existing
  // divineleads webhook calls that may still send this field.
  plan_expires_at: z.string().optional().nullable(),
});

// ─────────────────────────────────────────────────────────────
// POST /api/webhook/create-user
// ─────────────────────────────────────────────────────────────

/**
 * Creates a subscriber account when divineleads.guru fires a webhook
 * after a successful signup on vidapulse.io.
 *
 * Flow:
 *   1. webhookAuth validates x-webhook-secret header
 *   2. Zod validates the request body shape
 *   3. userService.createUserFromWebhook() handles DB + email
 *
 * Idempotent: safe to retry — returns 200 (not 201) if user already exists.
 *
 * Example request from divineleads.guru:
 *   POST https://app.vidapulse.io/api/webhook/create-user
 *   x-webhook-secret: <WEBHOOK_SECRET>
 *   Content-Type: application/json
 *   {
 *     "name": "Priya Sharma",
 *     "email": "priya@example.com",
 *     "phone": "9876543210",
 *     "plan": "starter",
 *     "plan_expires_at": "2026-06-21"
 *   }
 */
router.post('/create-user', webhookAuth, async (req, res) => {
  const sourceIp = req.ip || req.socket?.remoteAddress || 'unknown';

  logger.info(`[webhook/create-user] Incoming request from ${sourceIp}`);
  logger.debug(`[webhook/create-user] Body: ${JSON.stringify(req.body)}`);

  // Log the inbound receipt into the unified Contact Webhook Log (visible in
  // Admin → Contact Webhook Log alongside every other webhook).
  pool.query(
    `INSERT INTO contact_webhook_log
       (event_key, user_id, url_sent_to, params_sent, status, sent_at, response_at)
     VALUES ('create_user_received', NULL, '(inbound) POST /api/webhook/create-user', $1, 'sent', NOW(), NOW())`,
    [JSON.stringify({
      contact_name : req.body?.name  ?? null,
      contact_email: req.body?.email ?? null,
      contact_phone: req.body?.phone ?? null,
    })]
  ).catch(e => logger.warn(`[webhook/create-user] unified log insert failed: ${e.message}`));

  // ── Validate payload ─────────────────────────────────────
  const parseResult = createUserSchema.safeParse(req.body);

  if (!parseResult.success) {
    const fieldErrors = parseResult.error.flatten().fieldErrors;
    logger.warn(`[webhook/create-user] Validation failed from ${sourceIp}:`, fieldErrors);

    // Log the bad request before returning
    pool.query(
      `INSERT INTO webhook_logs
         (endpoint, raw_payload, secret_valid, http_status, processed, error_message, ip_address)
       VALUES ('/api/webhook/create-user', $1, TRUE, 400, FALSE, $2, $3)`,
      [req.body, JSON.stringify(fieldErrors), sourceIp]
    ).catch(e => logger.error(`[webhook/create-user] Failed to log bad request: ${e.message}`));

    return res.status(400).json({
      error  : 'Validation failed',
      message: 'Request body did not match the expected schema',
      fields : fieldErrors,
    });
  }

  // ── Create user ──────────────────────────────────────────
  try {
    const { user, isNew } = await createUserFromWebhook(
      parseResult.data,   // validated + sanitized payload
      req.body,           // raw object stored as JSONB for debugging
      sourceIp
    );

    if (!isNew) {
      // Idempotent response: account already exists, nothing was changed
      logger.info(`[webhook/create-user] Existing user returned for: ${parseResult.data.email}`);
      return res.status(200).json({
        success : true,
        existing: true,
        user_id : user.id,
      });
    }

    logger.info(`[webhook/create-user] ✓ Created account for: ${parseResult.data.email}`);
    return res.status(200).json({
      success : true,
      user_id : user.id,
    });

  } catch (err) {
    // userService already logged the error and wrote to webhook_logs
    logger.error(`[webhook/create-user] Handler error: ${err.message}`);
    return res.status(500).json({
      error  : 'Server error',
      message: 'Failed to create account. Check webhook_logs for details.',
    });
  }
});

module.exports = router;
