'use strict';

/**
 * OAuth 2.0 helpers — Google and Microsoft.
 *
 * Implemented without Passport.js using the standard Authorization Code Flow:
 *   1. Redirect user to provider's auth URL (with state for CSRF protection)
 *   2. Provider redirects back with ?code=...&state=...
 *   3. Exchange code for access token
 *   4. Fetch user profile (id, email, name) using the access token
 *
 * Both providers are only active when their env vars are set.
 * The auth route checks env before calling these helpers.
 */

const https              = require('https');
const { URL, URLSearchParams } = require('url');
const env    = require('./env');
const logger = require('./logger');

// ─────────────────────────────────────────────────────────────
// GOOGLE
// ─────────────────────────────────────────────────────────────

/**
 * Build the Google OAuth authorization URL.
 * prompt=select_account forces the account picker even if the user is
 * already signed in — ensures they can switch Google accounts.
 */
function getGoogleAuthUrl(state, loginHint) {
  const params = new URLSearchParams({
    client_id    : env.GOOGLE_CLIENT_ID,
    redirect_uri : `${env.APP_URL}/api/auth/oauth/google/callback`,
    response_type: 'code',
    scope        : 'openid email profile',
    state,
    access_type  : 'online',
    prompt       : 'select_account',
  });
  // Pre-select the account when we already know the email (e.g. a lead landing
  // on /register whose email is already a Google account).
  if (loginHint && typeof loginHint === 'string') {
    params.set('login_hint', loginHint.slice(0, 254));
  }
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

/**
 * Exchange an authorization code for Google tokens.
 * Returns { access_token, id_token, ... }
 */
async function exchangeGoogleCode(code) {
  const body = new URLSearchParams({
    code,
    client_id    : env.GOOGLE_CLIENT_ID,
    client_secret: env.GOOGLE_CLIENT_SECRET,
    redirect_uri : `${env.APP_URL}/api/auth/oauth/google/callback`,
    grant_type   : 'authorization_code',
  }).toString();

  const data = await _post('https://oauth2.googleapis.com/token', body, {
    'Content-Type': 'application/x-www-form-urlencoded',
  });

  if (data.error) {
    throw new Error(`Google token exchange failed: ${data.error_description || data.error}`);
  }
  return data;
}

/**
 * Fetch Google user profile using an access token.
 * Returns { id, email, name }
 */
async function getGoogleUserInfo(accessToken) {
  const data = await _get('https://www.googleapis.com/oauth2/v3/userinfo', {
    Authorization: `Bearer ${accessToken}`,
  });
  if (!data.email) throw new Error('Google did not return an email address');
  return {
    id   : data.sub,
    email: data.email,
    name : data.name || data.given_name || data.email.split('@')[0],
  };
}

// Microsoft OAuth removed — reserved for future use.

// ─────────────────────────────────────────────────────────────
// HTTP helpers (no external dependencies)
// ─────────────────────────────────────────────────────────────

function _get(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    https.request(
      {
        hostname: parsed.hostname,
        path    : parsed.pathname + parsed.search,
        method  : 'GET',
        headers,
      },
      (res) => {
        let body = '';
        res.on('data', chunk => { body += chunk; });
        res.on('end', () => {
          try   { resolve(JSON.parse(body)); }
          catch { reject(new Error(`Non-JSON response from ${url}: ${body.slice(0, 200)}`)); }
        });
      }
    ).on('error', reject).end();
  });
}

function _post(url, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const parsed  = new URL(url);
    const bodyBuf = Buffer.from(body, 'utf8');
    const req = https.request(
      {
        hostname: parsed.hostname,
        path    : parsed.pathname + parsed.search,
        method  : 'POST',
        headers : { ...headers, 'Content-Length': bodyBuf.length },
      },
      (res) => {
        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => {
          try   { resolve(JSON.parse(data)); }
          catch { reject(new Error(`Non-JSON response from ${url}: ${data.slice(0, 200)}`)); }
        });
      }
    );
    req.on('error', reject);
    req.write(bodyBuf);
    req.end();
  });
}

module.exports = {
  getGoogleAuthUrl,
  exchangeGoogleCode,
  getGoogleUserInfo,
};
