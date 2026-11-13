'use strict';

/**
 * platformSettings: platform keys and secrets that the super admin manages
 * inside the app (Billing and Settings pages) instead of in Railway env vars.
 *
 * How it plugs in: the fields below are turned into getters on the shared
 * `env` object, so every existing `env.RAZORPAY_KEY_ID`, `env.JWT_SECRET`, ...
 * read keeps working unchanged and now returns the value saved in the app.
 * The app is the ONLY source: there is no env fallback.
 *
 * One-time import: on load, a key with no app value but an env var is copied
 * into the app once, so deleting the env vars afterwards changes nothing.
 * After that, env vars for these keys are ignored.
 *
 * Saving a value takes effect immediately (in-memory cache, single instance).
 * Clearing it leaves the key empty (not allowed for required keys).
 *
 * Boot: install() runs at require time (before any route); load() runs after
 * migrations. Requests wait on ready (max 15 s) so auth never verifies tokens
 * with the wrong secret during the first seconds after a restart.
 */

const crypto   = require('crypto');
const { pool } = require('../config/database');
const env      = require('../config/env');
const logger   = require('../config/logger');

const MANAGED = {
  // ── Billing (Razorpay) ─────────────────────────────────────────────────
  RAZORPAY_KEY_ID         : { group: 'billing',  label: 'Razorpay Key ID',            secret: false, help: 'Razorpay Dashboard > Account & Settings > API Keys (rzp_live_... or rzp_test_...).' },
  RAZORPAY_KEY_SECRET     : { group: 'billing',  label: 'Razorpay Key Secret',        secret: true,  help: 'Shown once by Razorpay when the key is generated.' },
  RAZORPAY_WEBHOOK_SECRET : { group: 'billing',  label: 'Razorpay Webhook Secret',    secret: true,  generate: true, url: '/api/payments/razorpay', help: 'Must match the secret on the Razorpay webhook that calls the URL above. If you generate a new one here, paste it into Razorpay too.' },
  RAZORPAY_PLAN_ID_STARTER: { group: 'billing',  label: 'Starter plan ID (optional)', secret: false, help: 'Leave blank to let the app create the plan automatically.' },
  RAZORPAY_PLAN_ID_PRO    : { group: 'billing',  label: 'Growth plan ID (optional)',  secret: false, help: 'Leave blank to let the app create the plan automatically.' },

  // ── Settings (sign-in, tracking, security) ─────────────────────────────
  GOOGLE_CLIENT_ID        : { group: 'settings', label: 'Google OAuth Client ID',     secret: false, help: 'Google Cloud Console > APIs & Services > Credentials.' },
  GOOGLE_CLIENT_SECRET    : { group: 'settings', label: 'Google OAuth Client Secret', secret: true,  help: 'Same OAuth client as the ID above.' },
  META_PIXEL_ID           : { group: 'settings', label: 'VidaPulse Meta Pixel ID',    secret: false, help: 'The platform pixel on the app (signup, purchase). Subscribers set their own pixel and CAPI token per video.' },
  WEBHOOK_SECRET          : { group: 'settings', label: 'Inbound Webhook Secret',     secret: true,  generate: true, required: true, url: '/api/webhook/create-user', help: 'Authenticates the CRM webhook that creates accounts. Changing it breaks that webhook until the CRM is updated.' },
  JWT_SECRET              : { group: 'settings', label: 'JWT Signing Secret',         secret: true,  generate: true, required: true, help: 'Signs every login session. Changing it signs EVERYONE out, you included.' },
};

const KEYS      = Object.keys(MANAGED);
const original  = {};   // env-var values captured at boot
const cache     = {};   // values saved in the app
let   loaded    = false;
let   _resolve;
const ready     = new Promise((r) => { _resolve = r; });

function _has(v) { return v !== undefined && v !== null && String(v) !== ''; }

/** Turn the managed env fields into getters (app value first, env fallback). */
function install() {
  for (const k of KEYS) {
    original[k] = env[k];
    Object.defineProperty(env, k, {
      configurable: true,
      enumerable  : true,
      // Before the first load the env value bridges the boot window (requests
      // are held by gate() anyway); after load only the app value counts.
      get: () => (_has(cache[k]) ? cache[k] : (!loaded && _has(original[k]) ? original[k] : null)),
    });
  }
}

/** Load saved values. Called after migrations; safe to call again. */
async function load() {
  try {
    const { rows } = await pool.query(`SELECT key, value FROM platform_settings`);
    for (const k of Object.keys(cache)) delete cache[k];
    for (const r of rows) if (MANAGED[r.key]) cache[r.key] = r.value;

    for (const k of KEYS) {
      if (_has(cache[k])) continue;
      // One-time import of an existing env var, then the app owns it.
      if (_has(original[k])) {
        await pool.query(
          `INSERT INTO platform_settings (key, value) VALUES ($1, $2)
           ON CONFLICT (key) DO NOTHING`, [k, String(original[k])]
        );
        cache[k] = String(original[k]);
        logger.info(`[platformSettings] imported ${k} from the env var into the app (env no longer read)`);
        continue;
      }
      // A required secret set nowhere: create one.
      if (MANAGED[k].required) {
        const v = randomSecret();
        await pool.query(
          `INSERT INTO platform_settings (key, value) VALUES ($1, $2)
           ON CONFLICT (key) DO NOTHING`, [k, v]
        );
        cache[k] = v;
        logger.warn(`[platformSettings] ${k} was not set anywhere: generated and saved a random one`);
      }
    }
    loaded = true;
    logger.info(`[platformSettings] loaded ${rows.length} app-managed key(s)`);
  } catch (err) {
    logger.error(`[platformSettings] load failed, using env vars only: ${err.message}`);
  } finally {
    _resolve();
  }
}

/** Express middleware: hold requests until the first load (max 15 s). */
function gate(req, res, next) {
  if (loaded) return next();
  if (req.path === '/api/health' || req.path === '/api/version') return next();
  const t = setTimeout(next, 15_000);
  ready.then(() => { clearTimeout(t); next(); });
}

function randomSecret(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

/** Save (or with an empty value, clear) one key. Returns the new list entry. */
async function set(key, value, userId) {
  const def = MANAGED[key];
  if (!def) throw Object.assign(new Error(`Unknown setting ${key}`), { status: 400 });
  const v = value == null ? '' : String(value).trim();

  if (!v) {
    if (def.required) {
      throw Object.assign(new Error(`${def.label} cannot be empty`), { status: 400 });
    }
    await pool.query(`DELETE FROM platform_settings WHERE key = $1`, [key]);
    delete cache[key];
  } else {
    if (v.length > 4096) throw Object.assign(new Error('Value too long'), { status: 400 });
    await pool.query(
      `INSERT INTO platform_settings (key, value, updated_by, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value,
                                       updated_by = EXCLUDED.updated_by,
                                       updated_at = NOW()`,
      [key, v, userId || null]
    );
    cache[key] = v;
  }
  return describe(key);
}

function describe(key) {
  const def = MANAGED[key];
  return {
    key, group: def.group, label: def.label, help: def.help,
    secret: def.secret, generate: !!def.generate, required: !!def.required,
    url   : def.url || null,
    value : env[key] ?? '',
    source: _has(cache[key]) ? 'app' : 'none',
  };
}

/** All managed keys of one group, with their current effective value. */
function list(group) {
  return KEYS.filter((k) => !group || MANAGED[k].group === group).map(describe);
}

install();

module.exports = { load, gate, set, list, randomSecret, MANAGED, ready };
