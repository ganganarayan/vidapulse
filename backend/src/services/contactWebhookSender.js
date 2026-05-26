'use strict';

/**
 * Contact Webhook Sender — V2
 *
 * Fires a GET request with query params to the admin-configured webhook URL.
 *
 * Request format:
 *   GET <webhook_url>?[api_token=…&]contact_name=…&contact_email=…
 *                    &[contact_phone=…&]contact_plan=…&event_type=…
 *
 * ── Failure behaviour ─────────────────────────────────────────────────────
 *   1. On any HTTP error or timeout:
 *      a. Log entry marked 'failed'
 *      b. webhook_settings.contact_webhook_paused → TRUE (with reason + timestamp)
 *      c. Notification webhook fired immediately (fire-and-forget, no retry)
 *
 *   2. While paused, new events are NOT dropped — they are INSERT-ed into
 *      contact_webhook_log with status = 'queued' so nothing is lost.
 *
 *   3. Admin resolves via /api/admin/contact-webhook/resend-queued:
 *      a. Clears the pause flag
 *      b. Re-fires every queued entry in chronological order
 *      c. If any entry fails again → re-pauses, stops, fires notification again
 *
 * ── Notification webhook ──────────────────────────────────────────────────
 *   Fires to webhook_settings.notification_webhook_url (different automation).
 *   Sends: event_type='webhook_failure_alert', error_message, failed_event_type,
 *          queued_count, api_token (if set).
 *   No retry on the notification webhook — it's best-effort.
 *
 * ── Exports ──────────────────────────────────────────────────────────────
 *   fireContactWebhook(userId, eventKey)  — called by auth routes + behavioral events
 *   resendQueuedWebhooks()               — called by admin "resend" action
 *   getContactWebhookStatus()            — returns { paused, paused_at, paused_reason, queued_count }
 */

const { pool } = require('../config/database');
const logger   = require('../config/logger');

const HTTP_TIMEOUT_MS = 10_000;

// ─────────────────────────────────────────────────────────────────────────
// PUBLIC API
// ─────────────────────────────────────────────────────────────────────────

/**
 * Fire a contact webhook for a user event.
 * Always resolves (never rejects). Non-blocking — caller should not await.
 */
async function fireContactWebhook(userId, eventKey) {
  try {
    const settings = await _loadSettings();
    if (!settings || !settings.is_active || !settings.webhook_url) return;

    // ── If paused, queue the entry rather than dropping it ────────────
    if (settings.contact_webhook_paused) {
      const user  = await _loadUser(userId);
      const lp    = user ? _buildLogParams(user, eventKey, settings) : { event_type: eventKey };
      await _insertLog({
        eventKey, userId,
        urlSentTo : settings.webhook_url,
        paramsSent: lp,
        status    : 'queued',
      });
      logger.info(`[contactWebhook] Queued ${eventKey} user=${userId} (webhook paused)`);
      return;
    }

    // ── Load user, build params, fire ─────────────────────────────────
    const user = await _loadUser(userId);
    if (!user) {
      logger.warn(`[contactWebhook] User ${userId} not found — skipping ${eventKey}`);
      return;
    }

    await _fireAndLog(userId, eventKey, user, settings);

  } catch (err) {
    logger.error(`[contactWebhook] Unexpected error for ${eventKey} user=${userId}: ${err.message}`);
  }
}

/**
 * Unpauses the webhook and re-fires every queued entry in order.
 * Returns { sent, failed, total, nowPaused }.
 * Never rejects.
 */
async function resendQueuedWebhooks() {
  try {
    // Unpause
    await pool.query(
      `UPDATE webhook_settings
       SET contact_webhook_paused        = FALSE,
           contact_webhook_paused_at     = NULL,
           contact_webhook_paused_reason = NULL`
    );

    const settings = await _loadSettings();
    if (!settings?.webhook_url) {
      return { sent: 0, failed: 0, total: 0, nowPaused: false };
    }

    // Load all queued entries ordered oldest-first
    const { rows: queued } = await pool.query(
      `SELECT * FROM contact_webhook_log WHERE status = 'queued' ORDER BY sent_at ASC`
    );

    let sent = 0, failed = 0;

    for (const entry of queued) {
      // Re-check pause state — a failure mid-loop re-pauses immediately
      const { rows: [fresh] } = await pool.query(
        `SELECT contact_webhook_paused FROM webhook_settings LIMIT 1`
      );
      if (fresh?.contact_webhook_paused) {
        logger.warn('[contactWebhook] Re-paused during resend — stopping');
        break;
      }

      const user = entry.user_id ? await _loadUser(entry.user_id) : null;
      const logParams = user
        ? _buildLogParams(user, entry.event_key, settings)
        : (typeof entry.params_sent === 'object' ? entry.params_sent : {});

      const finalUrl = _buildUrl(settings.webhook_url, logParams, settings.api_token);
      const { ok, statusCode, responseBody, errorMessage } = await _doGet(finalUrl);

      await pool.query(
        `UPDATE contact_webhook_log
         SET status          = $1,
             response_status = $2,
             response_body   = $3,
             error_message   = $4,
             response_at     = NOW()
         WHERE id = $5`,
        [ok ? 'sent' : 'failed', statusCode, _truncate(responseBody, 1000), errorMessage, entry.id]
      );

      if (ok) {
        sent++;
        logger.info(`[contactWebhook] Resent log_id=${entry.id} event=${entry.event_key}`);
      } else {
        failed++;
        logger.warn(`[contactWebhook] Resend failed log_id=${entry.id}: ${errorMessage}`);
        await _pauseWebhook(`Re-fire failed: ${errorMessage || `HTTP ${statusCode}`}`);
        await _fireNotificationWebhook(settings, entry.event_key, errorMessage);
        break;
      }
    }

    const { rows: [finalSettings] } = await pool.query(
      `SELECT contact_webhook_paused FROM webhook_settings LIMIT 1`
    );

    return { sent, failed, total: queued.length, nowPaused: !!finalSettings?.contact_webhook_paused };

  } catch (err) {
    logger.error(`[contactWebhook] resendQueuedWebhooks error: ${err.message}`);
    return { sent: 0, failed: 0, total: 0, nowPaused: false, error: err.message };
  }
}

/**
 * Just unpause without resending queued entries.
 */
async function unpauseWebhook() {
  await pool.query(
    `UPDATE webhook_settings
     SET contact_webhook_paused        = FALSE,
         contact_webhook_paused_at     = NULL,
         contact_webhook_paused_reason = NULL`
  );
}

/**
 * Returns current pause state and queued count.
 * @returns {{ paused: boolean, paused_at: string|null, paused_reason: string|null, queued_count: number }}
 */
async function getContactWebhookStatus() {
  const [settingsRes, countRes] = await Promise.all([
    pool.query(`SELECT contact_webhook_paused, contact_webhook_paused_at, contact_webhook_paused_reason FROM webhook_settings LIMIT 1`),
    pool.query(`SELECT COUNT(*)::int AS cnt FROM contact_webhook_log WHERE status = 'queued'`),
  ]);
  const s = settingsRes.rows[0] ?? {};
  return {
    paused       : s.contact_webhook_paused        ?? false,
    paused_at    : s.contact_webhook_paused_at     ?? null,
    paused_reason: s.contact_webhook_paused_reason ?? null,
    queued_count : countRes.rows[0]?.cnt           ?? 0,
  };
}

// ─────────────────────────────────────────────────────────────────────────
// CORE FIRE LOGIC
// ─────────────────────────────────────────────────────────────────────────

async function _fireAndLog(userId, eventKey, user, settings) {
  const logParams = _buildLogParams(user, eventKey, settings);
  const finalUrl  = _buildUrl(settings.webhook_url, logParams, settings.api_token);
  const t0 = Date.now();

  const { ok, statusCode, responseBody, errorMessage } = await _doGet(finalUrl);
  const ms = Date.now() - t0;

  await _insertLog({
    eventKey, userId,
    urlSentTo     : settings.webhook_url,
    paramsSent    : logParams,
    status        : ok ? 'sent' : 'failed',
    responseStatus: statusCode,
    responseBody  : responseBody ? _truncate(responseBody, 1000) : null,
    errorMessage,
  });

  if (ok) {
    logger.info(`[contactWebhook] ✓ ${eventKey} → ${statusCode} (${ms}ms) user=${userId}`);
  } else {
    logger.warn(`[contactWebhook] ✗ ${eventKey} → ${errorMessage} user=${userId}`);
    await _pauseWebhook(errorMessage || `HTTP ${statusCode}`);
    await _fireNotificationWebhook(settings, eventKey, errorMessage || `HTTP ${statusCode}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────
// NOTIFICATION WEBHOOK
// ─────────────────────────────────────────────────────────────────────────

async function _fireNotificationWebhook(settings, failedEventKey, errorMessage) {
  if (!settings.notification_webhook_url) return;

  try {
    const { rows: [countRow] } = await pool.query(
      `SELECT COUNT(*)::int AS cnt FROM contact_webhook_log WHERE status = 'queued'`
    );
    const queuedCount = countRow?.cnt ?? 0;

    const params = new URLSearchParams();
    if (settings.api_token)    params.set('api_token',          settings.api_token);
    params.set('event_type',          'webhook_failure_alert');
    params.set('failed_event_type',   failedEventKey || '');
    params.set('error_message',       _truncate(errorMessage, 200) || 'Unknown error');
    params.set('queued_count',        String(queuedCount));

    const sep      = settings.notification_webhook_url.includes('?') ? '&' : '?';
    const finalUrl = `${settings.notification_webhook_url}${sep}${params.toString()}`;

    const { ok, statusCode } = await _doGet(finalUrl);
    if (ok) {
      logger.info(`[contactWebhook] Notification webhook fired → ${statusCode}`);
    } else {
      logger.warn(`[contactWebhook] Notification webhook failed → ${statusCode}`);
    }
  } catch (err) {
    logger.error(`[contactWebhook] Notification webhook error: ${err.message}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────
// HTTP
// ─────────────────────────────────────────────────────────────────────────

async function _doGet(finalUrl) {
  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), HTTP_TIMEOUT_MS);

  try {
    const response = await fetch(finalUrl, {
      method : 'GET',
      headers: { 'User-Agent': 'VidaPulse-ContactWebhook/1.0', 'Accept': 'application/json' },
      signal : controller.signal,
    });
    const responseBody = await response.text().catch(() => '');
    const ok           = response.ok;
    const errorMessage = ok ? null : `HTTP ${response.status}: ${_truncate(responseBody, 300)}`;
    return { ok, statusCode: response.status, responseBody, errorMessage };
  } catch (fetchErr) {
    const errorMessage = controller.signal.aborted
      ? `Request timed out after ${HTTP_TIMEOUT_MS}ms`
      : fetchErr.message;
    return { ok: false, statusCode: 0, responseBody: null, errorMessage };
  } finally {
    clearTimeout(tid);
  }
}

// ─────────────────────────────────────────────────────────────────────────
// DB HELPERS
// ─────────────────────────────────────────────────────────────────────────

async function _loadSettings() {
  const { rows: [s] } = await pool.query(
    `SELECT webhook_url, api_token, notification_webhook_url,
            is_active, contact_webhook_paused
     FROM webhook_settings LIMIT 1`
  );
  return s ?? null;
}

async function _loadUser(userId) {
  const { rows: [u] } = await pool.query(
    `SELECT u.name, u.email, u.phone, p.name AS plan
     FROM   users u JOIN plans p ON p.id = u.plan_id
     WHERE  u.id = $1`,
    [userId]
  );
  return u ?? null;
}

async function _pauseWebhook(reason) {
  await pool.query(
    `UPDATE webhook_settings
     SET contact_webhook_paused        = TRUE,
         contact_webhook_paused_at     = NOW(),
         contact_webhook_paused_reason = $1`,
    [_truncate(reason, 500)]
  );
  logger.warn(`[contactWebhook] Webhook PAUSED — reason: ${reason}`);
}

async function _insertLog({ eventKey, userId, urlSentTo, paramsSent, status,
                            responseStatus = null, responseBody = null, errorMessage = null }) {
  await pool.query(
    `INSERT INTO contact_webhook_log
       (event_key, user_id, url_sent_to, params_sent,
        status, response_status, response_body, error_message,
        sent_at, response_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), $9)`,
    [
      eventKey,
      userId ?? null,
      urlSentTo,
      JSON.stringify(paramsSent),
      status,
      responseStatus,
      responseBody,
      errorMessage,
      status === 'queued' ? null : new Date(),
    ]
  );
}

// ─────────────────────────────────────────────────────────────────────────
// PARAM BUILDERS
// ─────────────────────────────────────────────────────────────────────────

function _buildLogParams(user, eventKey, settings) {
  const planName = user.plan === 'admin_lifetime' ? 'pro' : (user.plan || 'free');
  return {
    contact_name : user.name  || '',
    contact_email: user.email || '',
    ...(user.phone ? { contact_phone: user.phone } : {}),
    contact_plan : planName,
    event_type   : eventKey,
    ...(settings?.api_token ? { api_token: '[redacted]' } : {}),
  };
}

/**
 * Build the final GET URL, injecting api_token (not from logParams which has it redacted).
 */
function _buildUrl(baseUrl, logParams, apiToken) {
  const params = new URLSearchParams();
  if (apiToken) params.set('api_token', apiToken);

  // Copy all non-redacted fields
  for (const [k, v] of Object.entries(logParams)) {
    if (k !== 'api_token') params.set(k, v);
  }

  const sep = baseUrl.includes('?') ? '&' : '?';
  return `${baseUrl}${sep}${params.toString()}`;
}

// ─────────────────────────────────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────────────────────────────────

function _truncate(str, len) {
  if (!str) return null;
  const s = String(str);
  return s.length > len ? s.slice(0, len) + '…' : s;
}

module.exports = {
  fireContactWebhook,
  resendQueuedWebhooks,
  unpauseWebhook,
  getContactWebhookStatus,
};
