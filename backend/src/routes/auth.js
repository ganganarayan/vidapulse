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

    return res.json({
      success    : true,
      token,
      first_login: !!user.first_login,
      redirect   : '/dashboard',
    });
  } catch (err) {
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
// POST /api/auth/register
//
// Self-signup: creates a free subscriber account and logs in.
// Body: { email, name, password }
// ─────────────────────────────────────────────────────────────

router.post('/register', async (req, res, next) => {
  try {
    const { email, name, password } = req.body ?? {};

    if (!email || !name || !password) {
      return res.status(400).json({ error: 'Validation Error', message: 'email, name and password are required' });
    }
    const normalizedEmail = String(email).toLowerCase().trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({ error: 'Validation Error', message: 'Enter a valid email address' });
    }
    if (String(password).length < 8) {
      return res.status(400).json({ error: 'Validation Error', message: 'Password must be at least 8 characters' });
    }

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

      const hash = await require('bcrypt').hash(password, 12);

      const { rows: [user] } = await client.query(
        `INSERT INTO users (email, name, plan_id, role, password_hash, password_set, created_via)
         VALUES ($1, $2, $3, 'subscriber', $4, TRUE, 'self_signup')
         RETURNING id`,
        [normalizedEmail, String(name).trim(), plans[0].id, hash]
      );

      await client.query(
        `INSERT INTO user_preferences (user_id) VALUES ($1) ON CONFLICT DO NOTHING`, [user.id]
      );
      await client.query(
        `INSERT INTO onboarding_state (user_id, signed_up_at) VALUES ($1, NOW()) ON CONFLICT DO NOTHING`,
        [user.id]
      );

      await client.query('COMMIT');

      const token = await authService.buildJwt(user.id);
      authService.setJwtCookie(res, token);

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
      const hash = await require('bcrypt').hash(new_password, 12);
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
    // Token in URL lets the frontend store it in localStorage for non-cookie clients.
    // The httpOnly cookie is also set so the browser SPA works without any extra JS.
    return res.redirect(`${frontendUrl}/dashboard?token=${jwt}`);

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
    return res.redirect(`${frontendUrl}/dashboard?token=${jwt}`);

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
