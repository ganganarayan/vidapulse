'use strict';

/**
 * Auth service — all authentication business logic.
 *
 * v2 changes:
 *   - No emails sent by VidaPulse. Password reset tokens are delivered via
 *     the behavioral event system → divineleads sends the email.
 *   - fireOutboundWebhook (v1) removed. Replaced by emitEvent.
 *   - user_signed_up event emitted for new OAuth users.
 *   - password_reset_requested event emitted instead of sendPasswordResetEmail.
 *
 * Account creation paths:
 *   a) Webhook (divineleads) — creates Starter/Pro accounts (paid)
 *   b) Google/Microsoft OAuth — creates Free account if email is new
 *   c) Email/password — set via set_password_url sent by divineleads
 */

const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt    = require('jsonwebtoken');

const { pool }      = require('../config/database');
const { emitEvent } = require('./behavioralEventService');
const env    = require('../config/env');
const logger = require('../config/logger');

const BCRYPT_ROUNDS = 12;

// ─────────────────────────────────────────────────────────────
// JWT helpers
// ─────────────────────────────────────────────────────────────

/**
 * Build a signed JWT. Always queries DB to verify the user is active.
 *
 * The JWT payload contains ONLY sub (user ID).
 * All other user fields (email, role, plan) are loaded fresh from the DB
 * on every request by requireAuth — never trusted from the JWT payload.
 * This prevents stale claims and reduces the data encoded in the token.
 */
async function buildJwt(userId) {
  const result = await pool.query(
    `SELECT id FROM users WHERE id = $1 AND is_active = TRUE`,
    [userId]
  );
  if (!result.rows.length) throw new Error('User not found or inactive');

  return jwt.sign(
    { sub: userId },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );
}

/**
 * Set the JWT as an httpOnly cookie named vp_token.
 */
function setJwtCookie(res, token) {
  const isProd = env.NODE_ENV === 'production';
  res.cookie('vp_token', token, {
    httpOnly: true,
    secure  : isProd,
    sameSite: isProd ? 'strict' : 'lax',
    maxAge  : 7 * 24 * 60 * 60 * 1000, // 7 days
    path    : '/',
  });
}

function clearJwtCookie(res) {
  res.clearCookie('vp_token', { path: '/' });
}

// ─────────────────────────────────────────────────────────────
// Email + password login
// ─────────────────────────────────────────────────────────────

async function loginWithPassword(email, password) {
  const normalizedEmail = email.toLowerCase().trim();

  const result = await pool.query(
    `SELECT id, email, name, password_hash, password_set, role, is_active
     FROM users WHERE email = $1`,
    [normalizedEmail]
  );
  const user = result.rows[0];

  // Unknown or inactive account — constant-time compare prevents email enumeration.
  // This is a valid bcrypt hash (cost 12) that will never match any real password
  // but forces the full work factor so timing is identical to a found account.
  if (!user || !user.is_active) {
    await bcrypt.compare(password, '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW');
    throw Object.assign(
      new Error('Invalid email or password'),
      { code: 'INVALID_CREDENTIALS' }
    );
  }

  // ── First login: password_set = FALSE ──────────────────────────────────
  // Account created by webhook — subscriber hasn't set a password yet.
  // Their first login attempt IS their password-set step: validate, hash,
  // persist. From this point on they are a returning user.
  if (!user.password_set || !user.password_hash) {
    if (password.length < 8) {
      throw Object.assign(
        new Error('Password must be at least 8 characters'),
        { code: 'VALIDATION_ERROR' }
      );
    }
    if (!/\d/.test(password)) {
      throw Object.assign(
        new Error('Password must contain at least one number'),
        { code: 'VALIDATION_ERROR' }
      );
    }
    const hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    await pool.query(
      `UPDATE users
       SET password_hash = $1, password_set = TRUE,
           last_login_at = NOW(), updated_at  = NOW()
       WHERE id = $2`,
      [hash, user.id]
    );
    logger.info(`[authService] First login — password set for: ${normalizedEmail}`);
    return { ...user, first_login: true };
  }

  // ── Returning user: verify password ───────────────────────────────────
  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) {
    throw Object.assign(
      new Error('Invalid email or password'),
      { code: 'INVALID_CREDENTIALS' }
    );
  }

  await pool.query(
    `UPDATE users SET last_login_at = NOW() WHERE id = $1`,
    [user.id]
  );

  logger.info(`[authService] Password login: ${normalizedEmail}`);
  return { ...user, first_login: false };
}

// ─────────────────────────────────────────────────────────────
// Set password (welcome email token flow)
// ─────────────────────────────────────────────────────────────

async function setPassword(token, newPassword) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const tokenResult = await client.query(
      `SELECT id, user_id, used_at, expires_at
       FROM auth_tokens
       WHERE token = $1 AND purpose = 'set_password'`,
      [token]
    );
    const tokenRow = tokenResult.rows[0];

    if (!tokenRow) {
      throw Object.assign(new Error('Invalid or expired link'), { code: 'INVALID_TOKEN' });
    }
    if (tokenRow.used_at) {
      throw Object.assign(new Error('This link has already been used'), { code: 'TOKEN_USED' });
    }
    if (new Date(tokenRow.expires_at) < new Date()) {
      throw Object.assign(
        new Error('This link has expired — use Forgot Password to get a new one'),
        { code: 'TOKEN_EXPIRED' }
      );
    }

    const hash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

    await client.query(
      `UPDATE users
       SET password_hash = $1, password_set = TRUE, updated_at = NOW()
       WHERE id = $2`,
      [hash, tokenRow.user_id]
    );
    await client.query(
      `UPDATE auth_tokens SET used_at = NOW() WHERE id = $1`,
      [tokenRow.id]
    );

    await client.query('COMMIT');
    logger.info(`[authService] Password set for user ${tokenRow.user_id}`);
    return tokenRow.user_id;

  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// ─────────────────────────────────────────────────────────────
// Forgot password
// ─────────────────────────────────────────────────────────────

/**
 * Generate a reset token and emit a password_reset_requested event.
 * divineleads receives the event via webhook and sends the reset email.
 * Always returns successfully — never reveals whether the email exists.
 */
async function forgotPassword(email) {
  const normalizedEmail = email.toLowerCase().trim();

  const result = await pool.query(
    `SELECT id, name, email FROM users WHERE email = $1 AND is_active = TRUE`,
    [normalizedEmail]
  );

  if (!result.rows.length) {
    // Silent — don't leak whether an account exists
    logger.debug(`[authService] Forgot password: no account for ${normalizedEmail}`);
    return;
  }

  const user  = result.rows[0];
  const token = crypto.randomBytes(48).toString('hex');

  await pool.query(
    `INSERT INTO auth_tokens (user_id, token, purpose, expires_at)
     VALUES ($1, $2, 'reset_password', NOW() + INTERVAL '1 hour')`,
    [user.id, token]
  );

  // Emit behavioral event — divineleads sends the reset email.
  // The payload includes the full reset URL so divineleads can embed it directly.
  const resetUrl = `${env.APP_URL}/reset-password?token=${token}`;
  emitEvent(user.id, 'password_reset_requested', null, {
    reset_url    : resetUrl,
    reset_token  : token,
    user_name    : user.name,
    user_email   : user.email,
    expires_in   : '1 hour',
    // divineleads embeds reset_url in the email they send to the subscriber
  });

  logger.info(`[authService] Password reset requested for ${normalizedEmail}`);
}

// ─────────────────────────────────────────────────────────────
// Reset password
// ─────────────────────────────────────────────────────────────

async function resetPassword(token, newPassword) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const tokenResult = await client.query(
      `SELECT id, user_id, used_at, expires_at
       FROM auth_tokens
       WHERE token = $1 AND purpose = 'reset_password'`,
      [token]
    );
    const tokenRow = tokenResult.rows[0];

    if (!tokenRow) {
      throw Object.assign(new Error('Invalid or expired link'), { code: 'INVALID_TOKEN' });
    }
    if (tokenRow.used_at) {
      throw Object.assign(new Error('This link has already been used'), { code: 'TOKEN_USED' });
    }
    if (new Date(tokenRow.expires_at) < new Date()) {
      throw Object.assign(
        new Error('This link has expired — request a new reset link'),
        { code: 'TOKEN_EXPIRED' }
      );
    }

    const hash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

    await client.query(
      `UPDATE users
       SET password_hash = $1, password_set = TRUE, updated_at = NOW()
       WHERE id = $2`,
      [hash, tokenRow.user_id]
    );
    await client.query(
      `UPDATE auth_tokens SET used_at = NOW() WHERE id = $1`,
      [tokenRow.id]
    );

    await client.query('COMMIT');
    logger.info(`[authService] Password reset for user ${tokenRow.user_id}`);
    return tokenRow.user_id;

  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// ─────────────────────────────────────────────────────────────
// OAuth — find or create user
// ─────────────────────────────────────────────────────────────

/**
 * Handle the result of a successful OAuth flow.
 * Lookup order:
 *   1. Match by provider_id  (stable — survives email changes)
 *   2. Match by email        (links OAuth to existing webhook-created account)
 *   3. Not found             → create Free account
 *
 * Emits user_signed_up for new users (non-blocking, after commit).
 */
async function findOrCreateOAuthUser(provider, providerProfile) {
  const { id: providerId, email: providerEmail, name } = providerProfile;
  const normalizedEmail = providerEmail.toLowerCase().trim();

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // ── 1. Match by provider_id ───────────────────────────────
    const oauthResult = await client.query(
      `SELECT u.id, u.email, u.role, u.is_active
       FROM user_oauth_accounts oa
       JOIN users u ON u.id = oa.user_id
       WHERE oa.provider = $1 AND oa.provider_id = $2`,
      [provider, providerId]
    );

    if (oauthResult.rows.length > 0) {
      const user = oauthResult.rows[0];
      if (!user.is_active) {
        throw Object.assign(new Error('Account is inactive'), { code: 'INACTIVE' });
      }
      await client.query(
        `UPDATE user_oauth_accounts
         SET provider_email = $1, updated_at = NOW()
         WHERE provider = $2 AND provider_id = $3`,
        [normalizedEmail, provider, providerId]
      );
      await client.query(
        `UPDATE users SET last_login_at = NOW() WHERE id = $1`,
        [user.id]
      );
      await client.query('COMMIT');
      return { user, isNew: false };
    }

    // ── 2. Match by email (link OAuth to existing account) ────
    const emailResult = await client.query(
      `SELECT id, email, role, is_active FROM users WHERE email = $1`,
      [normalizedEmail]
    );

    let user;
    let isNew = false;

    if (emailResult.rows.length > 0) {
      user = emailResult.rows[0];
      if (!user.is_active) {
        throw Object.assign(new Error('Account is inactive'), { code: 'INACTIVE' });
      }
      await client.query(
        `INSERT INTO user_oauth_accounts (user_id, provider, provider_id, provider_email)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (provider, provider_id) DO NOTHING`,
        [user.id, provider, providerId, normalizedEmail]
      );
      logger.info(`[authService] Linked ${provider} to existing user: ${normalizedEmail}`);

    } else {
      // ── 3. New user — create Free account ───────────────────
      const freePlan = await client.query(
        `SELECT id FROM plans WHERE name = 'free' AND is_active = TRUE LIMIT 1`
      );
      if (!freePlan.rows.length) throw new Error('Free plan not found in database');

      const newUser = await client.query(
        `INSERT INTO users (email, name, plan_id, created_via, password_set)
         VALUES ($1, $2, $3, $4, FALSE)
         RETURNING id, email, role`,
        [
          normalizedEmail,
          name || normalizedEmail.split('@')[0],
          freePlan.rows[0].id,
          `oauth_${provider}`,
        ]
      );
      user  = newUser.rows[0];
      isNew = true;

      await client.query(
        `INSERT INTO user_preferences (user_id) VALUES ($1)`,
        [user.id]
      );
      await client.query(
        `INSERT INTO onboarding_state (user_id, signed_up_at) VALUES ($1, NOW())
         ON CONFLICT (user_id) DO NOTHING`,
        [user.id]
      );
      await client.query(
        `INSERT INTO user_oauth_accounts (user_id, provider, provider_id, provider_email)
         VALUES ($1, $2, $3, $4)`,
        [user.id, provider, providerId, normalizedEmail]
      );
      logger.info(`[authService] New OAuth user (free plan): ${normalizedEmail} via ${provider}`);
    }

    await client.query(
      `UPDATE users SET last_login_at = NOW() WHERE id = $1`,
      [user.id]
    );
    await client.query('COMMIT');

    // Emit user_signed_up for brand-new OAuth accounts (non-blocking)
    if (isNew) {
      emitEvent(user.id, 'user_signed_up', null, {
        signup_source: `oauth_${provider}`,
        email        : user.email,
        plan         : 'free',
      });
    }

    return { user, isNew };

  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = {
  loginWithPassword,
  setPassword,
  forgotPassword,
  resetPassword,
  findOrCreateOAuthUser,
  buildJwt,
  setJwtCookie,
  clearJwtCookie,
};
