'use strict';

/**
 * Environment variable loader and validator.
 *
 * Imported once at server startup. Validates that all required vars exist
 * and exits immediately (process.exit(1)) if any are missing — this is
 * intentional: a misconfigured deploy should fail loudly, not silently.
 *
 * All other modules should import from here instead of reading
 * process.env directly, so there is a single source of truth.
 */

// Load .env file in development (Railway injects vars directly in production)
require('dotenv').config();

const REQUIRED = [
  'DATABASE_URL',
  'WEBHOOK_SECRET',
  'JWT_SECRET',
  'APP_URL',
];

const missing = REQUIRED.filter(key => !process.env[key] || process.env[key].trim() === '');

if (missing.length > 0) {
  // Use console.error directly — logger depends on this module, so can't use it here
  console.error(`\n[env] ❌ Missing required environment variables:\n`);
  missing.forEach(key => console.error(`       ${key}`));
  console.error(`\n[env] Copy backend/.env.example to backend/.env and fill in all values.\n`);
  process.exit(1);
}

module.exports = {
  NODE_ENV    : process.env.NODE_ENV   || 'development',
  PORT        : parseInt(process.env.PORT || '3000', 10),
  APP_URL     : process.env.APP_URL.replace(/\/$/, ''), // strip trailing slash
  LOG_LEVEL   : process.env.LOG_LEVEL  || 'info',

  // Database
  DATABASE_URL: process.env.DATABASE_URL,

  // Security
  WEBHOOK_SECRET : process.env.WEBHOOK_SECRET,
  JWT_SECRET     : process.env.JWT_SECRET,
  JWT_EXPIRES_IN : process.env.JWT_EXPIRES_IN || '7d',

  // OAuth — Google login + signup (free plan self-serve entry point)
  // Add these to Railway env vars when ready. Login page works without them
  // (falls back to email/password only) but the Google button will not appear.
  GOOGLE_CLIENT_ID    : process.env.GOOGLE_CLIENT_ID     || null,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || null,
  // Microsoft OAuth reserved for future use — not active.

  // Razorpay — payment webhook signature verification.
  // Set in Railway env vars. If unset, webhook signature is not verified
  // (safe to leave blank until production payment flows are active).
  RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET || null,

  // Razorpay — API keys for creating Customers and Subscriptions.
  // Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to Railway env vars.
  // If unset, subscription creation will return a 503 (configuration error).
  RAZORPAY_KEY_ID    : process.env.RAZORPAY_KEY_ID     || null,
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || null,

  // Razorpay Plan IDs (optional — if set, these plan IDs are used directly
  // instead of auto-creating plans via API on first subscription).
  // Format: 'plan_XXXXXXXXXXXXXX'
  RAZORPAY_PLAN_ID_STARTER: process.env.RAZORPAY_PLAN_ID_STARTER || null,
  RAZORPAY_PLAN_ID_PRO    : process.env.RAZORPAY_PLAN_ID_PRO     || null,

  // Meta Pixel ID for the public embed player. The embed fires a
  // 'TrackingActivated' custom event on every play (engagement signal). Same
  // pixel as the app + landing page. Defaults to the known VidaPulse pixel;
  // set META_PIXEL_ID='' on Railway to disable embed-side pixel firing.
  META_PIXEL_ID: process.env.META_PIXEL_ID ?? '2487979631600404',

};
