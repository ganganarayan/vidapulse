'use strict';

/**
 * Webhook authentication middleware.
 *
 * Validates the x-webhook-secret header on incoming webhook requests
 * from divineleads.guru. Uses Node.js crypto.timingSafeEqual to prevent
 * timing attacks — without this, an attacker could guess the secret one
 * character at a time by measuring how long the comparison takes.
 *
 * Usage: router.post('/create-user', webhookAuth, handler)
 */

const crypto = require('crypto');
const env    = require('../config/env');
const logger = require('../config/logger');

/**
 * Express middleware that validates x-webhook-secret header.
 * Returns 401 if missing or incorrect; calls next() if valid.
 */
function webhookAuth(req, res, next) {
  const provided = req.headers['x-webhook-secret'];

  if (!provided) {
    logger.warn(`[webhookAuth] Missing x-webhook-secret header from IP: ${req.ip}`);
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Missing x-webhook-secret header',
    });
  }

  if (!timingSafeEqual(provided, env.WEBHOOK_SECRET)) {
    logger.warn(`[webhookAuth] Invalid webhook secret from IP: ${req.ip}`);
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid webhook secret',
    });
  }

  logger.debug(`[webhookAuth] Valid request from IP: ${req.ip}`);
  next();
}

/**
 * Timing-safe string comparison using Node.js built-in crypto.timingSafeEqual.
 *
 * crypto.timingSafeEqual requires both buffers to be the same length.
 * If lengths differ, we still do a fake comparison before returning false
 * so the function always takes the same wall-clock time regardless of
 * whether the lengths match. This prevents a length oracle attack.
 *
 * @param {string} a - Provided value
 * @param {string} b - Expected value (the real secret)
 * @returns {boolean}
 */
function timingSafeEqual(a, b) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);

  // Always run the comparison on equal-length buffers to avoid early exit
  const safeB = bufB.length === bufA.length
    ? bufB
    : Buffer.concat([bufB, Buffer.alloc(Math.abs(bufA.length - bufB.length))]);

  const match = crypto.timingSafeEqual(bufA, safeB.slice(0, bufA.length));

  // Length mismatch is always a fail, even if content matched up to the shorter length
  return match && bufA.length === bufB.length;
}

module.exports = { webhookAuth };
