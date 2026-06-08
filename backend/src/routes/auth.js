'use strict';

/**
 * Auth routes — all endpoints under /api/auth
 *
 * Public (no JWT required):
 *   POST   /api/auth/bootstrap       — one-time admin setup (disabled once any admin exists)
 *   POST   /api/auth/login
 *   POST   /api/auth/set-password
 *   POST   /api/auth/forgot-password
 *   POST   /api/auth/reset-password
 *   POST   /api/auth/logout
 *   GET    /api/auth/providers          — which OAuth providers are configured
 *   GET    /api/auth/oauth/google        — start Google OAuth flow
 *   GET    /api/auth/oauth/google/callback
 *
 * Authenticated:
 *   GET    /api/auth/me                 — current user profile
 */

const express = require('express');
const crypto  = require('crypto');
const { z }   = require('zod');

const router      = express.Router();
const authService = require('../services/authService');
const oauth       = require('../config/oauth');
const env         = require('../config/env');
const logger      = require('../config/logger');
const { requireAuth } = require('../middleware/requireAuth');
const { pool }    = require('../config/database');
const { fireContactWebhook } = require('../services/contactWebhookSender');
const { emitEvent }          = require('../services/behavioralEventService');

// ── Login rate limiter ────────────────────────────────────────
// In-memory, keyed by IP.  Max 10 attempts per 15-minute window.
// Uses the same sliding-window approach as analytics.js.
// This protects against password brute-force without requiring redis.
const _loginAttempts = new Map(); // ip -> { count, resetAt }
const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const LOGIN_MAX       = 10;              // attempts per window

function _loginRateLimited(ip) {
  const now   = Date.now();
  const entry = _loginAttempts.get(ip);
  if (!entry || entry.resetAt <= now) {
    _loginAttempts.set(ip, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
    return false;
  }
  entry.count++;
  return entry.count > LOGIN_MAX;
}

// Prune stale entries every 30 minutes
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of _loginAttempts) if (v.resetAt <= now) _loginAttempts.delete(k);
}, 30 * 60 * 1000).unref();

// ── Zod schemas ───────────────────────────────────────────────

const loginSchema = z.object({
  email   : z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

const setPasswordSchema = z.object({
  token   : z.string().min(1),
  password: z.string()
    .min(8,  'Password must be at least 8 characters')
    .max(128, 'Password too long'),
});

const forgotSchema = z.object({
  email: z.string().email('Enter a valid email address'),
});

const resetSchema = z.object({
  token   : z.string().min(1),
  password: z.string()
    .min(8,  'Password must be at least 8 characters')
    .max(128, 'Password too long'),
});

// ── Lead-source helpers ───────────────────────────────────────
// UTM params captured at signup (ad → landing → app). Returns an object with
// exactly the five utm_* keys, each a trimmed string ≤300 chars or null.

const _UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];

function normalizeLeadSource(raw) {
  const out = { utm_source: null, utm_medium: null, utm_campaign: null, utm_term: null, utm_content: null };
  if (!raw || typeof raw !== 'object') return out;
  for (const k of _UTM_KEYS) {
    const v = raw[k];
    if (typeof v === 'string' && v.trim()) out[k] = v.trim().slice(0, 300);
  }
  return out;
}

// Parse the vp_ls cookie (set client-side before the OAuth redirect) into a
// normalized lead-source object. Never throws.
function leadSourceFromCookie(req) {
  try {
    const raw = req.cookies?.vp_ls;
    if (!raw) return normalizeLeadSource(null);
    return normalizeLeadSource(JSON.parse(decodeURIComponent(raw)));
  } catch {
    return normalizeLeadSource(null);
  }
}

// ─────────────────────────────────────────────────────────────
// POST /api/auth/bootstrap
//
// One-time admin account creation.
// Disabled permanently once any admin user exists in the DB.
// Secured with WEBHOOK_SECRET so it cannot be called by strangers.
//
// Body : { email, name, secret }
// Returns: { set_password_url }  — open this URL to set your password
//
// The set_password_url uses the request's own host (req.get('host'))
// so it works on any domain — Railway test URL or production domain.
// ─────────────────────────────────────────────────────────────

router.post('/bootstrap', async (req, res, next) => {
  try {
    const { email, name, secret } = req.body ?? {};

    if (!email || !secret) {
      return res.status(400).json({ error: 'email and secret are required' });
    }

    // Constant-time secret comparison to prevent timing attacks
    let secretMatch = false;
    try {
      secretMatch = crypto.timingSafeEqual(
        Buffer.from(secret.padEnd(env.WEBHOOK_SECRET.length)),
        Buffer.from(env.WEBHOOK_SECRET)
      ) && secret.length === env.WEBHOOK_SECRET.length;
    } catch { secretMatch = false; }

    if (!secretMatch) {
      return res.status(403).json({ error: 'Invalid secret' });
    }

    // Block if any admin already exists — endpoint is one-time only
    const { rows: existing } = await pool.query(
      `SELECT id FROM users WHERE role = 'admin' LIMIT 1`
    );
    if (existing.length > 0) {
      return res.status(403).json({
        error: 'Bootstrap disabled — an admin account already exists. Use /login.',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Reject if email is already registered (shouldn't happen on fresh DB)
    const { rows: emailCheck } = await pool.query(
      `SELECT id FROM users WHERE email = $1`, [normalizedEmail]
    );
    if (emailCheck.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const { rows: plans } = await client.query(
        `SELECT id FROM plans WHERE name = 'free' AND is_active = TRUE LIMIT 1`
      );
      if (!plans.length) throw new Error('Free plan not found in database');

      const { rows: [user] } = await client.query(
        `INSERT INTO users (email, name, plan_id, role, password_set, created_via)
         VALUES ($1, $2, $3, 'admin', FALSE, 'bootstrap')
         RETURNING id`,
        [normalizedEmail, (name || 'Admin').trim(), plans[0].id]
      );

      await client.query(
        `INSERT INTO user_preferences (user_id) VALUES ($1)`, [user.id]
      );
      await client.query(
        `INSERT INTO onboarding_state (user_id, signed_up_at) VALUES ($1, NOW())
         ON CONFLICT (user_id) DO NOTHING`,
        [user.id]
      );

      // set_password token — 24-hour expiry
      const token = crypto.randomBytes(48).toString('hex');
      await client.query(
        `INSERT INTO auth_tokens (user_id, token, purpose, expires_at)
         VALUES ($1, $2, 'set_password', NOW() + INTERVAL '24 hours')`,
        [user.id, token]
      );

      await client.query('COMMIT');

      // Use the request's own host so the link works on Railway AND production
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const setPasswordUrl = `${baseUrl}/set-password?token=${token}`;

      logger.info(`[auth] Bootstrap: admin account created for ${normalizedEmail}`);

      return res.status(201).json({
        message    : 'Admin account created. Open set_password_url in your browser to set your password.',
        set_password_url: setPasswordUrl,
      });

    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────────────────────────────

router.post('/login', async (req, res, next) => {
  // Rate limit: 10 attempts per IP per 15-minute window
  const clientIp = req.ip || 'unknown';
  if (_loginRateLimited(clientIp)) {
    logger.warn(`[auth/login] Rate limit hit from IP ${clientIp}`);
    return res.status(429).json({
      error  : 'Too Many Requests',
      message: 'Too many login attempts — please wait 15 minutes and try again.',
    });
  }

  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error  : 'Validation Error',
        message: parsed.error.issues[0].message,
      });
    }

    const user  = await authService.loginWithPassword(parsed.data.email, parsed.data.password);
    const token = await authService.buildJwt(user.id);

    // Set httpOnly cookie for browser-based auth (used by the frontend SPA).
    // Also return token in the body so native/mobile clients can use it directly.
    authService.setJwtCookie(res, token);

    // Webhook fires only for new signups — login events do not trigger the contact webhook.

    return res.json({
      success    : true,
      token,
      first_login: !!user.first_login,
      redirect   : '/dashboard',
    });
  } catch (err) {
    if (err.code === 'ACCOUNT_DEACTIVATED') {
      // Correct password on a deactivated account — offer self-service restore.
      const msg = err.reason === 'inactivity_180d'
        ? 'Your account was deactivated after more than 180 days of inactivity.'
        : 'Your account has been deactivated.';
      return res.status(403).json({
        error      : 'account_deactivated',
        deactivated: true,
        name       : err.userName || null,
        message    : `${msg} Would you like to restore it?`,
      });
    }
    if (err.code === 'INVALID_CREDENTIALS') {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    if (err.code === 'VALIDATION_ERROR') {
      // First-login password validation failure (too short, no number)
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/auth/restore-account
//
// Self-service restore from the login screen. Body: { email, password }.
// Re-verifies the password, reactivates the account, fires user_restored,
// and logs the user in (sets the JWT cookie).
// ─────────────────────────────────────────────────────────────

router.post('/restore-account', async (req, res, next) => {
  // Reuse the login rate limiter — same brute-force surface.
  const clientIp = req.ip || 'unknown';
  if (_loginRateLimited(clientIp)) {
    return res.status(429).json({ error: 'Too Many Requests', message: 'Too many attempts — please wait 15 minutes.' });
  }
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation Error', message: parsed.error.issues[0].message });
    }
    const user  = await authService.restoreAccount(parsed.data.email, parsed.data.password);
    const token = await authService.buildJwt(user.id);
    authService.setJwtCookie(res, token);
    return res.json({ ok: true, name: user.name, redirect: '/dashboard' });
  } catch (err) {
    if (err.code === 'INVALID_CREDENTIALS') {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    if (err.code === 'ALREADY_ACTIVE') {
      return res.status(409).json({ error: 'already_active', message: 'This account is already active. Please log in.' });
    }
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/auth/set-password
// ─────────────────────────────────────────────────────────────

router.post('/set-password', async (req, res, next) => {
  try {
    const parsed = setPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error  : 'Validation Error',
        message: parsed.error.issues[0].message,
      });
    }

    const userId = await authService.setPassword(parsed.data.token, parsed.data.password);
    const token  = await authService.buildJwt(userId);
    authService.setJwtCookie(res, token);

    return res.json({ ok: true });
  } catch (err) {
    if (['INVALID_TOKEN', 'TOKEN_USED', 'TOKEN_EXPIRED'].includes(err.code)) {
      return res.status(400).json({ error: 'Bad Request', message: err.message });
    }
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/auth/reset-token-email?token=XXX
// Returns the email associated with a valid (unexpired, unused) reset token.
// Used by the Reset Password page to pre-fill a hidden email field so all
// browsers (Safari iOS, Firefox, Edge) can associate the new password with
// the correct account and show the "Save password?" prompt.
// Safe: read-only — does NOT consume or validate the token for password use.
// ─────────────────────────────────────────────────────────────

router.get('/reset-token-email', async (req, res, next) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ error: 'token required' });

    const { rows } = await pool.query(
      `SELECT u.email, u.name
       FROM   auth_tokens t
       JOIN   users       u ON u.id = t.user_id
       WHERE  t.token      = $1
         AND  t.purpose    = 'reset_password'
         AND  t.used_at   IS NULL
         AND  t.expires_at > NOW()`,
      [token]
    );

    if (!rows.length) return res.status(404).json({ error: 'invalid or expired token' });

    return res.json({ email: rows[0].email, name: rows[0].name });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/auth/forgot-password
// ─────────────────────────────────────────────────────────────

router.post('/forgot-password', async (req, res, next) => {
  try {
    const parsed = forgotSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error  : 'Validation Error',
        message: parsed.error.issues[0].message,
      });
    }

    await authService.forgotPassword(parsed.data.email);

    // Always return success — never reveal whether the email exists
    return res.json({
      ok     : true,
      message: 'If an account exists for that email, a reset link has been sent.',
    });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/auth/reset-password
// ─────────────────────────────────────────────────────────────

router.post('/reset-password', async (req, res, next) => {
  try {
    const parsed = resetSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error  : 'Validation Error',
        message: parsed.error.issues[0].message,
      });
    }

    const userId = await authService.resetPassword(parsed.data.token, parsed.data.password);
    const token  = await authService.buildJwt(userId);
    authService.setJwtCookie(res, token);

    return res.json({ ok: true });
  } catch (err) {
    if (['INVALID_TOKEN', 'TOKEN_USED', 'TOKEN_EXPIRED'].includes(err.code)) {
      return res.status(400).json({ error: 'Bad Request', message: err.message });
    }
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/auth/logout
// ─────────────────────────────────────────────────────────────

router.post('/logout', (req, res) => {
  authService.clearJwtCookie(res);
  return res.json({ ok: true });
});

// ─────────────────────────────────────────────────────────────
// POST /api/auth/magic-link
//
// Server-to-server webhook called by the landing-page / Pabbly flow.
// Secured with WEBHOOK_SECRET (same pattern as /bootstrap).
//
// Body: { email, name, secret }
//
// Behaviour:
//   • Find-or-create user by email (idempotent — retries are safe).
//   • Invalidate any existing active magic_link tokens for that user.
//   • Mint a new single-use, 24-hour token.
//   • Fire user_signed_up + contact webhook ONLY for brand-new users.
//   • Return { user_id, email, token, login_url }.
// ─────────────────────────────────────────────────────────────

// Log a magic-link webhook row into contact_webhook_log so it shows in the
// Admin → Contact Webhook Log UI alongside every other webhook. event_key
// defaults to 'magic_link' (the outbound delivery); 'magic_link_received' marks
// the INBOUND request receipt. Both start with 'magic_link', so the
// retry/resend/failed-count machinery skips them (never re-fired).
async function _logMagicLink({ eventKey = 'magic_link', userId = null, urlSentTo, params = {}, status,
                               responseStatus = null, responseBody = null, errorMessage = null }) {
  try {
    await pool.query(
      `INSERT INTO contact_webhook_log
         (event_key, user_id, url_sent_to, params_sent,
          status, response_status, response_body, error_message, sent_at, response_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
      [eventKey, userId, urlSentTo, JSON.stringify(params), status, responseStatus, responseBody, errorMessage]
    );
  } catch (e) {
    logger.warn(`[auth/magic-link] log insert failed: ${e.message}`);
  }
}

router.post('/magic-link', async (req, res, next) => {
  try {
    const { email, name, phone, secret } = req.body ?? {};

    // Log the INBOUND receipt immediately — confirms whether we received the
    // webhook at all, regardless of what happens next.
    await _logMagicLink({
      eventKey : 'magic_link_received',
      urlSentTo: '(inbound) POST /api/auth/magic-link',
      params   : {
        contact_email: typeof email === 'string' ? email : null,
        contact_name : typeof name  === 'string' ? name  : null,
        contact_phone: typeof phone === 'string' ? phone : null,
      },
      status   : 'sent',   // shows as a received/✓ row in the log
    });

    // Constant-time secret check
    let secretOk = false;
    try {
      secretOk = crypto.timingSafeEqual(
        Buffer.from(String(secret ?? '').padEnd(env.WEBHOOK_SECRET.length)),
        Buffer.from(env.WEBHOOK_SECRET)
      ) && String(secret ?? '').length === env.WEBHOOK_SECRET.length;
    } catch { secretOk = false; }

    if (!secretOk) {
      await _logMagicLink({
        urlSentTo   : '— (rejected before delivery)',
        params      : { email: typeof email === 'string' ? email : null, name: typeof name === 'string' ? name : null },
        status      : 'failed',
        errorMessage: 'Invalid or missing secret — request rejected (403)',
      });
      return res.status(403).json({ error: 'Forbidden', message: 'Invalid secret' });
    }

    if (!email) {
      await _logMagicLink({
        urlSentTo: '— (rejected before delivery)', params: {},
        status: 'failed', errorMessage: 'email is required (400)',
      });
      return res.status(400).json({ error: 'Validation Error', message: 'email is required' });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      await _logMagicLink({
        urlSentTo: '— (rejected before delivery)', params: { email: normalizedEmail },
        status: 'failed', errorMessage: 'Invalid email address (400)',
      });
      return res.status(400).json({ error: 'Validation Error', message: 'Enter a valid email address' });
    }

    const reqName  = (name  && String(name).trim())  || '';
    const reqPhone = (phone && String(phone).trim()) || null;
    const finalName = reqName || normalizedEmail.split('@')[0];

    // Ad attribution (UTM). Accept either a lead_source object or individual
    // utm_* fields at the top level of the webhook body.
    const ls = normalizeLeadSource(req.body?.lead_source ?? {
      utm_source  : req.body?.utm_source,
      utm_medium  : req.body?.utm_medium,
      utm_campaign: req.body?.utm_campaign,
      utm_term    : req.body?.utm_term,
      utm_content : req.body?.utm_content,
    });
    const hasUtm = !!(ls.utm_source || ls.utm_medium || ls.utm_campaign || ls.utm_term || ls.utm_content);

    // Find or create user
    let userId;
    let isNew = false;
    let storedName  = null;
    let storedPhone = null;

    const { rows: existing } = await pool.query(
      `SELECT id, name, phone FROM users WHERE email = $1 LIMIT 1`, [normalizedEmail]
    );

    if (existing.length > 0) {
      userId      = existing[0].id;
      storedName  = existing[0].name;
      storedPhone = existing[0].phone;
      // Backfill phone if the CRM now supplies one and we don't have it yet.
      if (reqPhone && !storedPhone) {
        await pool.query(`UPDATE users SET phone = $1 WHERE id = $2`, [reqPhone, userId]);
        storedPhone = reqPhone;
      }
      // Backfill ad attribution — COALESCE keeps any existing (first-touch)
      // value and only fills columns that are still empty.
      if (hasUtm) {
        await pool.query(
          `UPDATE users SET
             signup_utm_source   = COALESCE(signup_utm_source,   $2),
             signup_utm_medium   = COALESCE(signup_utm_medium,   $3),
             signup_utm_campaign = COALESCE(signup_utm_campaign, $4),
             signup_utm_term     = COALESCE(signup_utm_term,     $5),
             signup_utm_content  = COALESCE(signup_utm_content,  $6)
           WHERE id = $1`,
          [userId, ls.utm_source, ls.utm_medium, ls.utm_campaign, ls.utm_term, ls.utm_content]
        );
      }
    } else {
      // Create new free subscriber (no password — passwordless entry)
      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        const { rows: plans } = await client.query(
          `SELECT id FROM plans WHERE name = 'free' AND is_active = TRUE LIMIT 1`
        );
        if (!plans.length) throw new Error('Free plan not found');

        const { rows: [newUser] } = await client.query(
          `INSERT INTO users (email, name, phone, plan_id, role, password_set, created_via,
                              signup_utm_source, signup_utm_medium, signup_utm_campaign,
                              signup_utm_term, signup_utm_content)
           VALUES ($1, $2, $3, $4, 'subscriber', FALSE, 'magic_link', $5, $6, $7, $8, $9)
           RETURNING id`,
          [normalizedEmail, finalName, reqPhone, plans[0].id,
           ls.utm_source, ls.utm_medium, ls.utm_campaign, ls.utm_term, ls.utm_content]
        );
        userId = newUser.id;
        storedPhone = reqPhone;

        await client.query(
          `INSERT INTO user_preferences (user_id) VALUES ($1) ON CONFLICT DO NOTHING`, [userId]
        );
        await client.query(
          `INSERT INTO onboarding_state (user_id, signed_up_at) VALUES ($1, NOW()) ON CONFLICT DO NOTHING`,
          [userId]
        );

        // Returning-after-purge notice
        await client.query(
          `UPDATE users u
              SET previously_purged_at = pa.purged_at, purge_notice_shown = FALSE
             FROM (SELECT purged_at FROM purged_accounts
                    WHERE LOWER(email) = LOWER($2) ORDER BY purged_at DESC LIMIT 1) pa
            WHERE u.id = $1`,
          [userId, normalizedEmail]
        );

        await client.query('COMMIT');
        isNew = true;
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }

      // Fire signup events only for genuinely new users
      emitEvent(userId, 'user_signed_up', null, {
        signup_source: 'magic_link',
        email        : normalizedEmail,
        plan         : 'free',
      });
      logger.info(`[auth/magic-link] New subscriber created: ${normalizedEmail}`);
    }

    // Invalidate any previous active magic_link tokens for this user
    await pool.query(
      `UPDATE auth_tokens SET used_at = NOW()
        WHERE user_id = $1 AND purpose = 'magic_link' AND used_at IS NULL`,
      [userId]
    );

    // Mint new single-use 24-hour token
    const token = crypto.randomBytes(48).toString('hex');
    await pool.query(
      `INSERT INTO auth_tokens (user_id, token, purpose, expires_at)
       VALUES ($1, $2, 'magic_link', NOW() + INTERVAL '24 hours')`,
      [userId, token]
    );

    const loginUrl = `${env.APP_URL}/auth?token=${token}`;

    logger.info(`[auth/magic-link] Token minted for ${normalizedEmail} (${isNew ? 'new' : 'existing'} user)`);

    // ── Fire outbound delivery webhook (non-blocking) ─────────────────────
    // The admin configures this URL in Admin → Webhook Settings → Magic Link.
    // It receives the login_url so an external automation (email/WhatsApp)
    // can deliver the link to the user. Every outcome is logged to the
    // Contact Webhook Log. Never throws — failures are logged only.
    // Hybrid: standard contact fields flat; custom fields "contact."-prefixed
    // (the CRM only maps custom fields — token/login_url/user_id — when prefixed).
    const dpName = (storedName && !reqName) ? storedName : finalName;
    const deliveryPayload = {};
    if (dpName)          deliveryPayload.contact_name  = dpName;
    if (normalizedEmail) deliveryPayload.contact_email = normalizedEmail;
    if (storedPhone)     deliveryPayload.contact_phone = storedPhone;
    deliveryPayload['contact.user_id']   = userId;
    deliveryPayload['contact.token']     = token;
    deliveryPayload['contact.login_url'] = loginUrl;

    (async () => {
      try {
        const { rows: [ws] } = await pool.query(
          `SELECT magic_link_webhook_url, api_token FROM webhook_settings LIMIT 1`
        );
        const deliveryUrl = ws?.magic_link_webhook_url;

        if (!deliveryUrl) {
          await _logMagicLink({
            userId, urlSentTo: '— (delivery URL not configured)', params: deliveryPayload,
            status: 'failed',
            errorMessage: 'Magic Link Delivery Webhook URL not set in Admin → Webhook Settings',
          });
          logger.warn('[auth/magic-link] No delivery webhook URL configured — token minted but not delivered.');
          return;
        }

        // Mirror the contact webhook transport exactly: api_token goes in the
        // URL query string (the automation authenticates on it), NOT a Bearer
        // header — and the same headers/fetch flow.
        const finalUrl = ws.api_token
          ? `${deliveryUrl}${deliveryUrl.includes('?') ? '&' : '?'}api_token=${encodeURIComponent(ws.api_token)}`
          : deliveryUrl;

        const controller = new AbortController();
        const tid = setTimeout(() => controller.abort(), 10000);
        let result;
        try {
          const resp = await fetch(finalUrl, {
            method : 'POST',
            headers: {
              'Content-Type': 'application/json',
              'User-Agent'  : 'VidaPulse-MagicLink/1.0',
              'Accept'      : 'application/json',
            },
            body  : JSON.stringify(deliveryPayload),
            signal: controller.signal,
          });
          const body = await resp.text().catch(() => '');
          result = { code: resp.status, ok: resp.ok, body };
        } finally {
          clearTimeout(tid);
        }

        await _logMagicLink({
          userId, urlSentTo: deliveryUrl, params: deliveryPayload,
          status        : result.ok ? 'sent' : 'failed',
          responseStatus: result.code,
          responseBody  : result.body ? result.body.slice(0, 4000) : null,
          errorMessage  : result.ok ? null : `Delivery endpoint returned HTTP ${result.code}`,
        });
        logger.info(`[auth/magic-link] Delivery webhook → ${deliveryUrl} — HTTP ${result.code}`);
      } catch (err) {
        await _logMagicLink({
          userId, urlSentTo: 'magic_link_webhook_url', params: deliveryPayload,
          status: 'failed', errorMessage: `Delivery failed: ${err.message}`,
        });
        logger.warn(`[auth/magic-link] Delivery webhook failed: ${err.message}`);
      }
    })();

    return res.json({
      user_id  : userId,
      email    : normalizedEmail,
      token,
      login_url: loginUrl,
    });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/auth/magic-link/consume
//
// Called by the /auth frontend page when the user clicks their link.
// Body: { token }
//
// Validates the magic_link token, burns it, sets the JWT cookie.
// Returns { ok, password_set, redirect } on success.
// Returns { ok: false, reason: 'expired' | 'invalid' } on failure.
// ─────────────────────────────────────────────────────────────

router.post('/magic-link/consume', async (req, res, next) => {
  try {
    const { token } = req.body ?? {};

    if (!token || typeof token !== 'string') {
      return res.status(400).json({ ok: false, reason: 'invalid', message: 'token is required' });
    }

    // Look up valid, unexpired, unused token
    const { rows: [row] } = await pool.query(
      `SELECT t.id, t.user_id, t.expires_at, u.password_set, u.is_active
         FROM auth_tokens t
         JOIN users u ON u.id = t.user_id
        WHERE t.token = $1 AND t.purpose = 'magic_link' AND t.used_at IS NULL
        LIMIT 1`,
      [token]
    );

    if (!row) {
      return res.status(400).json({ ok: false, reason: 'invalid', message: 'This link is invalid.' });
    }

    if (new Date(row.expires_at) < new Date()) {
      return res.status(400).json({ ok: false, reason: 'expired', message: 'This link has expired.' });
    }

    if (!row.is_active) {
      // Deactivated — burn the token and let the login page handle restore
      await pool.query(`UPDATE auth_tokens SET used_at = NOW() WHERE id = $1`, [row.id]);
      return res.status(403).json({ ok: false, reason: 'deactivated', message: 'Account deactivated.' });
    }

    // Burn the token
    await pool.query(`UPDATE auth_tokens SET used_at = NOW() WHERE id = $1`, [row.id]);

    const jwt = await authService.buildJwt(row.user_id);
    authService.setJwtCookie(res, jwt);

    logger.info(`[auth/magic-link/consume] User ${row.user_id} logged in via magic link`);

    // Record the login so admin "Last Login" reflects magic-link sign-ins.
    await pool.query(
      `UPDATE users SET previous_login_at = last_login_at, last_login_at = NOW() WHERE id = $1`,
      [row.user_id]
    );

    return res.json({
      ok          : true,
      password_set: !!row.password_set,
      redirect    : '/dashboard',
    });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/auth/register
//
// Self-signup: creates a free subscriber account and logs in.
// Body: { email, name, password }
// ─────────────────────────────────────────────────────────────

router.post('/register', async (req, res, next) => {
  try {
    const { email, name, password, phone } = req.body ?? {};

    if (!email || !password) {
      return res.status(400).json({ error: 'Validation Error', message: 'email and password are required' });
    }
    const normalizedEmail = String(email).toLowerCase().trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({ error: 'Validation Error', message: 'Enter a valid email address' });
    }
    // Name is collected later (onboarding). Until then default to the email's
    // local part so the NOT NULL column + dashboard greeting have a value.
    const finalName = (name && String(name).trim()) || normalizedEmail.split('@')[0];
    if (String(password).length < 8) {
      return res.status(400).json({ error: 'Validation Error', message: 'Password must be at least 8 characters' });
    }

    // Normalise optional phone (strip to E.164-ish or keep as-is)
    const normalizedPhone = phone ? String(phone).trim() : null;

    // Lead source — UTM params captured from the ad → landing → app signup flow.
    const ls = normalizeLeadSource(req.body?.lead_source);

    // Check duplicate
    const { rows: existing } = await pool.query(
      `SELECT id FROM users WHERE email = $1`, [normalizedEmail]
    );
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Conflict', message: 'An account with that email already exists' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const { rows: plans } = await client.query(
        `SELECT id FROM plans WHERE name = 'free' AND is_active = TRUE LIMIT 1`
      );
      if (!plans.length) throw new Error('Free plan not found');

      const hash = await require('bcryptjs').hash(password, 12);

      const { rows: [user] } = await client.query(
        `INSERT INTO users (email, name, phone, plan_id, role, password_hash, password_set, created_via,
                            last_login_at,
                            signup_utm_source, signup_utm_medium, signup_utm_campaign,
                            signup_utm_term, signup_utm_content)
         VALUES ($1, $2, $3, $4, 'subscriber', $5, TRUE, 'self_signup', NOW(), $6, $7, $8, $9, $10)
         RETURNING id`,
        [normalizedEmail, finalName, normalizedPhone, plans[0].id, hash,
         ls.utm_source, ls.utm_medium, ls.utm_campaign, ls.utm_term, ls.utm_content]
      );

      await client.query(
        `INSERT INTO user_preferences (user_id) VALUES ($1) ON CONFLICT DO NOTHING`, [user.id]
      );
      await client.query(
        `INSERT INTO onboarding_state (user_id, signed_up_at) VALUES ($1, NOW()) ON CONFLICT DO NOTHING`,
        [user.id]
      );

      // Returning-after-purge: if this email was purged before, flag the
      // one-time "your data was destroyed" notice on the new account.
      await client.query(
        `UPDATE users u
            SET previously_purged_at = pa.purged_at, purge_notice_shown = FALSE
           FROM (SELECT purged_at FROM purged_accounts
                  WHERE LOWER(email) = LOWER($2) ORDER BY purged_at DESC LIMIT 1) pa
          WHERE u.id = $1`,
        [user.id, normalizedEmail]
      );

      await client.query('COMMIT');

      const token = await authService.buildJwt(user.id);
      authService.setJwtCookie(res, token);

      // Emit user_signed_up — this is the single source of truth for new signups.
      // behavioralEventService will fire the contact webhook (event_type=user_signed_up)
      // and also queue it for Worker A (behavioral webhook). Non-blocking, never throws.
      emitEvent(user.id, 'user_signed_up', null, {
        signup_source: 'self_signup',
        email        : normalizedEmail,
        plan         : 'free',
      });

      logger.info(`[auth/register] New subscriber: ${normalizedEmail}`);
      return res.status(201).json({ ok: true });

    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────
// PATCH /api/auth/me  (requires auth)
//
// Updates the authenticated user's name and/or password.
// Body fields (all optional, at least one required):
//   name            — display name (1-200 chars)
//   new_password    — new password (min 8 chars)
//   confirm_password — must equal new_password
// ─────────────────────────────────────────────────────────────

router.patch('/me', requireAuth, async (req, res, next) => {
  try {
    const { name, new_password, confirm_password } = req.body ?? {};
    const setClauses = [];
    const params     = [];

    if (name !== undefined) {
      const trimmed = String(name).trim();
      if (!trimmed || trimmed.length > 200) {
        return res.status(400).json({
          error  : 'Validation Error',
          message: 'Name must be between 1 and 200 characters',
        });
      }
      params.push(trimmed);
      setClauses.push(`name = $${params.length}`);
    }

    if (new_password !== undefined) {
      if (!new_password || new_password.length < 8) {
        return res.status(400).json({
          error  : 'Validation Error',
          message: 'Password must be at least 8 characters',
        });
      }
      if (new_password !== confirm_password) {
        return res.status(400).json({
          error  : 'Validation Error',
          message: 'Passwords do not match',
        });
      }
      const hash = await require('bcryptjs').hash(new_password, 12);
      params.push(hash);
      setClauses.push(`password_hash = $${params.length}`);
      setClauses.push(`password_set = TRUE`);
    }

    if (!setClauses.length) {
      return res.status(400).json({
        error  : 'Validation Error',
        message: 'Nothing to update — provide name or new_password',
      });
    }

    setClauses.push('updated_at = NOW()');
    params.push(req.user.id);

    const { rows: [updated] } = await pool.query(
      `UPDATE users SET ${setClauses.join(', ')}
       WHERE id = $${params.length}
       RETURNING id, name, email`,
      params
    );

    logger.info(`[auth/me] User ${req.user.id} updated profile`);
    return res.json({ ok: true, user: updated });

  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/auth/me  (requires auth)
// ─────────────────────────────────────────────────────────────

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.email, u.name, u.phone, u.role,
              u.password_set, u.onboarding_completed,
              u.use_case, u.business_segment,
              u.created_at, u.last_login_at,
              p.name AS plan, p.display_name AS plan_display
       FROM users u
       LEFT JOIN plans p ON p.id = u.plan_id
       WHERE u.id = $1`,
      [req.user.id]
    );

    const user = result.rows[0];

    // Check which OAuth providers are linked
    const oauthResult = await pool.query(
      `SELECT provider FROM user_oauth_accounts WHERE user_id = $1`,
      [req.user.id]
    );
    const linkedProviders = oauthResult.rows.map(r => r.provider);

    return res.json({
      ...user,
      oauth: {
        google: linkedProviders.includes('google'),
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/auth/providers
// Tells the frontend which OAuth providers are configured.
// ─────────────────────────────────────────────────────────────

router.get('/providers', (req, res) => {
  res.json({
    google: !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
  });
});

// ─────────────────────────────────────────────────────────────
// GET /api/auth/email-status?email=...
//
// Lightweight lookup used by the register page when the email is prefilled
// from a CTA link. Tells the frontend whether that email already exists and
// whether it's linked to Google — so a returning Google user can be sent
// straight through OAuth to the dashboard instead of the password form.
// (Account existence is already discoverable via /register's 409 response,
// so this exposes nothing new.)
// ─────────────────────────────────────────────────────────────

router.get('/email-status', async (req, res, next) => {
  try {
    const email = String(req.query.email || '').toLowerCase().trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.json({ exists: false, google: false });
    }
    const { rows: [row] } = await pool.query(
      `SELECT u.id,
              EXISTS(SELECT 1 FROM user_oauth_accounts o
                      WHERE o.user_id = u.id AND o.provider = 'google') AS google
         FROM users u
        WHERE u.email = $1
        LIMIT 1`,
      [email]
    );
    return res.json({ exists: !!row, google: !!(row && row.google) });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────
// OAuth — Google
// ─────────────────────────────────────────────────────────────

// Convenience alias — redirect /api/auth/google → /api/auth/oauth/google
// so bookmarks, old links, or external callers that omit the /oauth/ prefix
// still work instead of hitting the 404 handler.
router.get('/google', (req, res) => res.redirect(307, '/api/auth/oauth/google'));

router.get('/oauth/google', (req, res) => {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    return res.redirect(`${_frontendUrl()}/login?error=google_not_configured`);
  }

  const state = crypto.randomBytes(16).toString('hex');
  res.cookie('vp_oauth_state', state, {
    httpOnly: true,
    secure  : env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge  : 10 * 60 * 1000, // 10-minute window to complete the flow
  });

  const loginHint = typeof req.query.login_hint === 'string' ? req.query.login_hint : undefined;
  return res.redirect(oauth.getGoogleAuthUrl(state, loginHint));
});

router.get('/oauth/google/callback', async (req, res) => {
  const frontendUrl = _frontendUrl();
  try {
    const { code, state, error } = req.query;

    if (error) {
      logger.warn(`[auth] Google OAuth cancelled: ${error}`);
      return res.redirect(`${frontendUrl}/login?error=google_cancelled`);
    }

    // Verify CSRF state cookie
    const storedState = req.cookies?.vp_oauth_state;
    if (!storedState || storedState !== state) {
      logger.warn('[auth] Google OAuth state mismatch — possible CSRF');
      return res.redirect(`${frontendUrl}/login?error=oauth_state_mismatch`);
    }
    res.clearCookie('vp_oauth_state');

    const tokens  = await oauth.exchangeGoogleCode(code);
    const profile = await oauth.getGoogleUserInfo(tokens.access_token);
    // Lead source rides along in the vp_ls cookie set on the app domain before
    // the redirect; only applied when this OAuth call creates a brand-new user.
    const leadSource = leadSourceFromCookie(req);
    const { user, isNew, isFirstLogin } = await authService.findOrCreateOAuthUser('google', profile, leadSource);
    res.clearCookie('vp_ls');
    const jwt = await authService.buildJwt(user.id);
    authService.setJwtCookie(res, jwt);

    // New OAuth users: authService.findOrCreateOAuthUser already emits
    // user_signed_up → behavioralEventService → contact webhook. No extra fire.
    // Login events do not trigger the contact webhook — signup only.

    logger.info(`[auth] Google OAuth success: ${profile.email} (${isNew ? 'new user' : 'login'})`);
    // Token in URL lets the frontend store it in localStorage for non-cookie clients.
    // The httpOnly cookie is also set so the browser SPA works without any extra JS.
    return res.redirect(`${frontendUrl}/dashboard?token=${jwt}`);

  } catch (err) {
    // Deactivated account — Google verified the identity, so offer self-service
    // restore. Mint a short-lived restore token and send it to the login screen.
    if (err.code === 'ACCOUNT_DEACTIVATED' && err.userId) {
      const restoreToken = authService.mintRestoreToken(err.userId);
      const nameParam = err.userName ? `&name=${encodeURIComponent(err.userName)}` : '';
      return res.redirect(`${frontendUrl}/login?restore_token=${restoreToken}${nameParam}`);
    }
    logger.error(`[auth] Google OAuth callback error: ${err.message}`);
    return res.redirect(`${frontendUrl}/login?error=oauth_failed`);
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/auth/restore-token
//
// OAuth restore: exchange the short-lived restore token (from the OAuth
// callback redirect) for an actual restore + login. Body: { token }.
// ─────────────────────────────────────────────────────────────

router.post('/restore-token', async (req, res, next) => {
  try {
    const { token } = req.body ?? {};
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: 'Validation Error', message: 'token is required' });
    }
    const user  = await authService.restoreWithToken(token);
    const jwt   = await authService.buildJwt(user.id);
    authService.setJwtCookie(res, jwt);
    return res.json({ ok: true, name: user.name, redirect: '/dashboard' });
  } catch (err) {
    if (err.code === 'INVALID_TOKEN') {
      return res.status(400).json({ error: 'invalid_token', message: err.message });
    }
    next(err);
  }
});

// Microsoft OAuth removed — to be added back later.

// ─────────────────────────────────────────────────────────────
// Helper
// ─────────────────────────────────────────────────────────────

function _frontendUrl() {
  // Production: same origin (app.vidapulse.io)
  // Development: Vite dev server on port 5173
  return env.NODE_ENV === 'production' ? env.APP_URL : 'http://localhost:5173';
}

module.exports = router;
