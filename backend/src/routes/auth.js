'use strict';

/**
 * Auth routes — all endpoints under /api/auth
 *
 * Public (no JWT required):
 *   POST   /api/auth/login
 *   POST   /api/auth/set-password
 *   POST   /api/auth/forgot-password
 *   POST   /api/auth/reset-password
 *   POST   /api/auth/logout
 *   GET    /api/auth/providers          — which OAuth providers are configured
 *   GET    /api/auth/oauth/google        — start Google OAuth flow
 *   GET    /api/auth/oauth/google/callback
 *   GET    /api/auth/oauth/microsoft
 *   GET    /api/auth/oauth/microsoft/callback
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
    authService.setJwtCookie(res, token);

    // Do NOT return the token in the body — it is set as an httpOnly cookie.
    // Returning it in the body would let JS read it and defeat the httpOnly protection.
    return res.json({ ok: true });
  } catch (err) {
    if (err.code === 'INVALID_CREDENTIALS') {
      return res.status(401).json({ error: 'Unauthorized', message: err.message });
    }
    if (err.code === 'PASSWORD_NOT_SET') {
      return res.status(401).json({ error: 'Unauthorized', message: err.message });
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
        google   : linkedProviders.includes('google'),
        microsoft: linkedProviders.includes('microsoft'),
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
    google   : !!(env.GOOGLE_CLIENT_ID    && env.GOOGLE_CLIENT_SECRET),
    microsoft: !!(env.MICROSOFT_CLIENT_ID && env.MICROSOFT_CLIENT_SECRET),
  });
});

// ─────────────────────────────────────────────────────────────
// OAuth — Google
// ─────────────────────────────────────────────────────────────

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

  return res.redirect(oauth.getGoogleAuthUrl(state));
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
    const { user } = await authService.findOrCreateOAuthUser('google', profile);
    const jwt = await authService.buildJwt(user.id);
    authService.setJwtCookie(res, jwt);

    logger.info(`[auth] Google OAuth success: ${profile.email}`);
    return res.redirect(`${frontendUrl}/dashboard`);

  } catch (err) {
    logger.error(`[auth] Google OAuth callback error: ${err.message}`);
    return res.redirect(`${frontendUrl}/login?error=oauth_failed`);
  }
});

// ─────────────────────────────────────────────────────────────
// OAuth — Microsoft
// ─────────────────────────────────────────────────────────────

router.get('/oauth/microsoft', (req, res) => {
  if (!env.MICROSOFT_CLIENT_ID || !env.MICROSOFT_CLIENT_SECRET) {
    return res.redirect(`${_frontendUrl()}/login?error=microsoft_not_configured`);
  }

  const state = crypto.randomBytes(16).toString('hex');
  res.cookie('vp_oauth_state', state, {
    httpOnly: true,
    secure  : env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge  : 10 * 60 * 1000,
  });

  return res.redirect(oauth.getMicrosoftAuthUrl(state));
});

router.get('/oauth/microsoft/callback', async (req, res) => {
  const frontendUrl = _frontendUrl();
  try {
    const { code, state, error } = req.query;

    if (error) {
      logger.warn(`[auth] Microsoft OAuth cancelled: ${error}`);
      return res.redirect(`${frontendUrl}/login?error=microsoft_cancelled`);
    }

    const storedState = req.cookies?.vp_oauth_state;
    if (!storedState || storedState !== state) {
      logger.warn('[auth] Microsoft OAuth state mismatch — possible CSRF');
      return res.redirect(`${frontendUrl}/login?error=oauth_state_mismatch`);
    }
    res.clearCookie('vp_oauth_state');

    const tokens  = await oauth.exchangeMicrosoftCode(code);
    const profile = await oauth.getMicrosoftUserInfo(tokens.access_token);
    const { user } = await authService.findOrCreateOAuthUser('microsoft', profile);
    const jwt = await authService.buildJwt(user.id);
    authService.setJwtCookie(res, jwt);

    logger.info(`[auth] Microsoft OAuth success: ${profile.email}`);
    return res.redirect(`${frontendUrl}/dashboard`);

  } catch (err) {
    logger.error(`[auth] Microsoft OAuth callback error: ${err.message}`);
    return res.redirect(`${frontendUrl}/login?error=oauth_failed`);
  }
});

// ─────────────────────────────────────────────────────────────
// Helper
// ─────────────────────────────────────────────────────────────

function _frontendUrl() {
  // Production: same origin (app.vidapulse.in)
  // Development: Vite dev server on port 5173
  return env.NODE_ENV === 'production' ? env.APP_URL : 'http://localhost:5173';
}

module.exports = router;
