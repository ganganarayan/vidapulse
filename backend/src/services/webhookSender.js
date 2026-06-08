'use strict';

/**
 * Webhook Sender — Step 5
 *
 * Two parallel workers share one module:
 *
 * ── Worker A: Standard Event Sender  (polls every 30 s) ──────────────────
 *   Source : behavioral_events WHERE processed = FALSE
 *            (skips event_key = 'insight_available' — handled by Worker B)
 *   Retries: webhook_outbound_log WHERE status = 'failed' AND next_retry_at <= NOW()
 *   Retry schedule: attempt 1 = immediate · 2 = +5 min · 3 = +30 min → abandoned
 *   Signs  : HMAC-SHA256 on full JSON body (X-VidaPulse-Signature header)
 *   Logs   : every attempt to webhook_outbound_log (full audit trail)
 *
 * ── Worker B: Insight Dispatch Worker (polls every 60 s) ─────────────────
 *   Source : in_app_notifications WHERE dispatched_at IS NULL
 *   Guards : user is_online (last_seen_at > NOW() - 3 min) → skip
 *            insight_emails_enabled = FALSE → skip
 *            insight_email_counters ≥ 2/day → skip
 *            webhook_governor.fires_this_hour ≥ hourly_cap → stop loop
 *            webhook_governor.is_paused → stop loop
 *   Bundle : groups all pending notifications per user into ONE webhook fire
 *   Payload: { template_key, video_title, notification_count, dashboard_url,
 *              teaser_variable_1, teaser_variable_2 }
 *            — NO raw numbers, percentages, or timestamps in payload
 *
 * ── Export ────────────────────────────────────────────────────────────────
 *   start()        — called from src/index.js on server startup
 *   stop()         — called on graceful shutdown
 *   testWebhook()  — called by admin "Test" button; updates last_tested_at
 */

const crypto   = require('crypto');
const { pool } = require('../config/database');
const logger   = require('../config/logger');

// ── Tuning constants ─────────────────────────────────────────────────────
const STANDARD_INTERVAL_MS  = 30_000;          // Worker A poll rate
const DISPATCH_INTERVAL_MS  = 60_000;          // Worker B poll rate
const DISPATCH_STAGGER_MS   = 15_000;          // B starts 15 s after A to avoid DB pile-up
const ONLINE_WINDOW_MS      = 3 * 60 * 1_000;  // 3 min = user is "online"
const HTTP_TIMEOUT_MS       = 10_000;           // per HTTP call
const MAX_ATTEMPTS          = 3;
const RETRY_DELAY_MS        = [0, 5 * 60_000, 30 * 60_000]; // attempt 1, 2, 3
const STANDARD_BATCH_SIZE   = 10;               // events per Worker A cycle
const DISPATCH_BATCH_USERS  = 20;              // users per Worker B cycle
const DAILY_EMAIL_CAP       = 2;               // bundled insight emails per user per day

// ── Runtime state ─────────────────────────────────────────────────────────
let _standardTimer  = null;
let _dispatchTimer  = null;
let _isRunning      = false;

// ─────────────────────────────────────────────────────────────────────────
// LIFECYCLE
// ─────────────────────────────────────────────────────────────────────────

// Master switch for the behavioral/insight event STREAM to the CRM webhook_url.
// Disabled: this is an event feed, but our CRM webhook_url is a contact-UPSERT
// automation — the event-style calls were overwriting/wiping contacts ~30s
// after signup. The contact webhook (contactWebhookSender) and the magic-link
// delivery remain the only senders to the CRM. Behavioral events are still
// recorded (emitEvent → behavioral_events) for the funnel; they just no longer
// POST to the CRM. Re-enable only with a SEPARATE event URL.
const CRM_EVENT_STREAM_ENABLED = false;

function start() {
  if (_isRunning) return;
  _isRunning = true;

  if (!CRM_EVENT_STREAM_ENABLED) {
    logger.info('[webhookSender] CRM event stream DISABLED — Worker A/B not started (contact webhook is the sole CRM sender)');
    return;
  }

  _standardTimer = setInterval(_processStandardEvents, STANDARD_INTERVAL_MS);

  // Stagger the dispatch worker so both workers don't hit the DB simultaneously
  setTimeout(() => {
    _dispatchTimer = setInterval(_processInsightDispatch, DISPATCH_INTERVAL_MS);
    logger.info('[webhookSender] Dispatch worker started');
  }, DISPATCH_STAGGER_MS);

  logger.info('[webhookSender] Standard sender started (30 s interval)');
}

function stop() {
  if (_standardTimer) { clearInterval(_standardTimer); _standardTimer = null; }
  if (_dispatchTimer) { clearInterval(_dispatchTimer); _dispatchTimer = null; }
  _isRunning = false;
  logger.info('[webhookSender] Stopped');
}

// ─────────────────────────────────────────────────────────────────────────
// WORKER A — STANDARD EVENT SENDER
// ─────────────────────────────────────────────────────────────────────────

async function _processStandardEvents() {
  try {
    const settings = await _loadSettings();
    if (!settings || !settings.is_active || !settings.webhook_url) return;

    // ── 1. Retries: failed log entries whose next_retry_at has passed ───
    const { rows: retries } = await pool.query(
      `SELECT wol.*,
              be.event_key,
              be.user_id,
              be.video_id,
              be.payload   AS event_payload,
              u.name  AS u_name,
              u.email AS u_email,
              u.phone AS u_phone
       FROM   webhook_outbound_log wol
       JOIN   behavioral_events    be  ON be.id = wol.behavioral_event_id
       JOIN   users                u   ON u.id  = be.user_id
       WHERE  wol.status        = 'failed'
         AND  wol.next_retry_at <= NOW()
         AND  wol.attempts      < wol.max_attempts
       ORDER  BY wol.next_retry_at ASC
       LIMIT  $1`,
      [STANDARD_BATCH_SIZE]
    );

    for (const retry of retries) {
      const envelope = _buildStandardEnvelope(retry);
      await _attemptStandardFire(settings, envelope, retry.id, retry.behavioral_event_id, retry.attempts);
    }

    // ── 2. New events: no existing log row yet ──────────────────────────
    // insight_available is excluded — handled exclusively by Worker B
    const { rows: newEvents } = await pool.query(
      `SELECT be.*,
              u.name  AS u_name,
              u.email AS u_email,
              u.phone AS u_phone
       FROM   behavioral_events be
       JOIN   users u ON u.id = be.user_id
       WHERE  be.processed   = FALSE
         AND  be.event_key  != 'insight_available'
         AND  (be.scheduled_for IS NULL OR be.scheduled_for <= NOW())
         AND  NOT EXISTS (
           SELECT 1
           FROM   webhook_outbound_log wol
           WHERE  wol.behavioral_event_id = be.id
         )
       ORDER  BY be.created_at ASC
       LIMIT  $1`,
      [STANDARD_BATCH_SIZE]
    );

    for (const event of newEvents) {
      const envelope = _buildStandardEnvelope(event);

      // Create the log row first (audit trail starts before the HTTP call)
      const { rows: [logRow] } = await pool.query(
        `INSERT INTO webhook_outbound_log
           (behavioral_event_id, user_id, event_key,
            webhook_url_snapshot, payload, status, attempts, max_attempts)
         VALUES ($1, $2, $3, $4, $5, 'pending', 0, $6)
         RETURNING id`,
        [
          event.id,
          event.user_id,
          event.event_key,
          settings.webhook_url,
          JSON.stringify(envelope),
          MAX_ATTEMPTS,
        ]
      );

      await _attemptStandardFire(settings, envelope, logRow.id, event.id, 0);
    }

  } catch (err) {
    logger.error(`[webhookSender] Standard sender cycle error: ${err.message}`);
  }
}

/**
 * Fire one standard webhook and update the outbound log + behavioral event.
 *
 * @param {object} settings      - webhook_settings row
 * @param {object} envelope      - JSON payload to POST
 * @param {number} logId         - webhook_outbound_log.id to update
 * @param {number} eventId       - behavioral_events.id
 * @param {number} prevAttempts  - number of previous attempts (0 = first try)
 */
async function _attemptStandardFire(settings, envelope, logId, eventId, prevAttempts) {
  const attemptNumber = prevAttempts + 1;

  try {
    const { ok, statusCode, responseBody } = await _postWebhook(
      settings.webhook_url,
      settings.webhook_secret,
      envelope
    );

    if (ok) {
      await pool.query(
        `UPDATE webhook_outbound_log
         SET status            = 'sent',
             attempts          = $1,
             response_code     = $2,
             response_body     = $3,
             last_attempted_at = NOW(),
             next_retry_at     = NULL
         WHERE id = $4`,
        [attemptNumber, statusCode, _truncate(responseBody, 500), logId]
      );

      await pool.query(
        `UPDATE behavioral_events
         SET processed = TRUE, processed_at = NOW()
         WHERE id = $1`,
        [eventId]
      );

      logger.info(`[webhookSender] ✓ event_id=${eventId} key=${envelope['contact.event_type']} (attempt ${attemptNumber})`);

    } else {
      throw new Error(`HTTP ${statusCode}: ${_truncate(responseBody, 200)}`);
    }

  } catch (err) {
    const isLastAttempt   = attemptNumber >= MAX_ATTEMPTS;
    const retryDelayMs    = RETRY_DELAY_MS[attemptNumber] ?? RETRY_DELAY_MS[RETRY_DELAY_MS.length - 1];
    const nextRetry       = isLastAttempt ? null : new Date(Date.now() + retryDelayMs);

    await pool.query(
      `UPDATE webhook_outbound_log
       SET status            = $1,
           attempts          = $2,
           error_message     = $3,
           last_attempted_at = NOW(),
           next_retry_at     = $4
       WHERE id = $5`,
      [
        isLastAttempt ? 'abandoned' : 'failed',
        attemptNumber,
        _truncate(err.message, 500),
        nextRetry,
        logId,
      ]
    );

    if (isLastAttempt) {
      // Mark processed so it is never picked up again
      await pool.query(
        `UPDATE behavioral_events
         SET processed = TRUE, processed_at = NOW()
         WHERE id = $1`,
        [eventId]
      );
      logger.warn(`[webhookSender] Abandoned event_id=${eventId} after ${attemptNumber} attempts`);
    } else {
      logger.warn(
        `[webhookSender] Failed event_id=${eventId} attempt ${attemptNumber}` +
        ` — retry at ${nextRetry.toISOString()}: ${err.message}`
      );
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────
// WORKER B — INSIGHT DISPATCH WORKER
// ─────────────────────────────────────────────────────────────────────────

async function _processInsightDispatch() {
  try {
    const settings = await _loadSettings();
    if (!settings || !settings.is_active || !settings.webhook_url) return;

    // ── Global governor check ───────────────────────────────────────────
    const governor = await _loadGovernor();
    if (!governor) return;

    if (governor.is_paused) {
      logger.debug('[webhookSender] Dispatch skipped — governor is paused');
      return;
    }

    // Reset governor window if it has expired (> 1 hour old)
    const windowAgeMs = Date.now() - new Date(governor.window_start).getTime();
    if (windowAgeMs > 60 * 60_000) {
      await pool.query(
        `UPDATE webhook_governor
         SET window_start = NOW(), fires_this_hour = 0, updated_at = NOW()`
      );
      governor.fires_this_hour = 0;  // reflect reset in local state
    }

    if (governor.fires_this_hour >= governor.hourly_cap) {
      logger.info(`[webhookSender] Hourly cap reached (${governor.fires_this_hour}/${governor.hourly_cap}) — dispatch paused until window resets`);
      return;
    }

    // ── Find offline users with pending notifications ───────────────────
    const onlineCutoff = new Date(Date.now() - ONLINE_WINDOW_MS).toISOString();

    const { rows: pendingUsers } = await pool.query(
      `SELECT DISTINCT ian.user_id
       FROM   in_app_notifications ian
       JOIN   users                u   ON u.id        = ian.user_id
       JOIN   user_preferences     up  ON up.user_id  = ian.user_id
       WHERE  ian.dispatched_at        IS NULL
         AND  u.is_online              = FALSE
         AND  (u.last_seen_at IS NULL OR u.last_seen_at < $1)
         AND  up.insight_emails_enabled = TRUE
       LIMIT  $2`,
      [onlineCutoff, DISPATCH_BATCH_USERS]
    );

    if (pendingUsers.length === 0) return;

    logger.debug(`[webhookSender] Dispatch cycle: ${pendingUsers.length} eligible offline user(s)`);

    for (const { user_id } of pendingUsers) {
      // Re-read governor before each user — cap may have been hit mid-loop
      const { rows: [gov] } = await pool.query(`SELECT * FROM webhook_governor LIMIT 1`);
      if (!gov || gov.is_paused || gov.fires_this_hour >= gov.hourly_cap) {
        logger.info('[webhookSender] Governor cap hit mid-loop — stopping dispatch cycle');
        break;
      }

      // Daily cap check for this user
      const dailySent = await _getDailyEmailCount(user_id);
      if (dailySent >= DAILY_EMAIL_CAP) {
        logger.debug(`[webhookSender] Daily cap hit for user ${user_id} (${dailySent}/${DAILY_EMAIL_CAP})`);
        continue;
      }

      // Load all pending notifications for this user
      const { rows: notifications } = await pool.query(
        `SELECT ian.*, v.title AS video_title
         FROM   in_app_notifications ian
         LEFT   JOIN videos v ON v.id = ian.video_id
         WHERE  ian.user_id        = $1
           AND  ian.dispatched_at IS NULL
         ORDER  BY ian.created_at ASC`,
        [user_id]
      );

      if (notifications.length === 0) continue;

      await _fireInsightDispatch(settings, user_id, notifications, gov);
    }

  } catch (err) {
    logger.error(`[webhookSender] Dispatch worker cycle error: ${err.message}`);
  }
}

/**
 * Bundle a user's pending notifications and fire one insight_available webhook.
 * On success: marks notifications dispatched, increments counters, writes audit log.
 * On failure: writes failed log entry; notifications stay undispatched for next cycle.
 */
async function _fireInsightDispatch(settings, userId, notifications, governor) {
  const isBundle    = notifications.length > 1;
  const primary     = notifications[0];
  const rawKey      = isBundle ? 'multiple_insights' : primary.template_key;
  const templateKey = await _resolveTemplateKey(rawKey);
  const videoTitle  = primary.video_title || 'your video';
  const dashUrl     = primary.dashboard_url;

  // Teaser variables: single insight → use its own; bundle → neutral qualitative
  const t1 = isBundle ? 'new insights' : (primary.teaser_variable_1 || '');
  const t2 = isBundle ? ''             : (primary.teaser_variable_2 || '');

  // Contact identity (so the CRM matches & updates, never overwrites).
  const { rows: [u] } = await pool.query(
    `SELECT name, email, phone FROM users WHERE id = $1`, [userId]
  );

  const envelope = {};
  if (u?.name)  envelope.contact_name  = u.name;
  if (u?.email) envelope.contact_email = u.email;
  if (u?.phone) envelope.contact_phone = u.phone;
  envelope['contact.event_type']         = 'insight_available';
  envelope['contact.template_key']       = templateKey;
  envelope['contact.video_title']        = videoTitle;
  envelope['contact.notification_count'] = notifications.length;
  envelope['contact.dashboard_url']      = dashUrl;
  envelope['contact.teaser_variable_1']  = t1;
  envelope['contact.teaser_variable_2']  = t2;

  try {
    const { ok, statusCode, responseBody } = await _postWebhook(
      settings.webhook_url,
      settings.webhook_secret,
      envelope
    );

    if (!ok) throw new Error(`HTTP ${statusCode}: ${_truncate(responseBody, 200)}`);

    // ── Success ────────────────────────────────────────────────────────
    const now    = new Date();
    const notIds = notifications.map(n => n.id);

    await pool.query(
      `UPDATE in_app_notifications
       SET dispatched_at = $1
       WHERE id = ANY($2::bigint[])`,
      [now, notIds]
    );

    // Increment daily counter (INSERT first day, UPDATE thereafter)
    await pool.query(
      `INSERT INTO insight_email_counters (user_id, date, emails_sent, updated_at)
       VALUES ($1, CURRENT_DATE, 1, NOW())
       ON CONFLICT (user_id, date) DO UPDATE
       SET emails_sent = insight_email_counters.emails_sent + 1,
           updated_at  = NOW()`,
      [userId]
    );

    // Increment governor (window was already verified above)
    await pool.query(
      `UPDATE webhook_governor
       SET fires_this_hour = fires_this_hour + 1,
           updated_at      = NOW()`
    );

    // Full audit trail — no behavioral_event_id (dispatch doesn't use that table)
    await pool.query(
      `INSERT INTO webhook_outbound_log
         (user_id, event_key, webhook_url_snapshot, payload,
          status, attempts, max_attempts, response_code, response_body,
          last_attempted_at)
       VALUES ($1, 'insight_available', $2, $3, 'sent', 1, 1, $4, $5, NOW())`,
      [userId, settings.webhook_url, JSON.stringify(envelope), statusCode, _truncate(responseBody, 500)]
    );

    logger.info(
      `[webhookSender] ✓ insight_available dispatched` +
      ` user=${userId} count=${notifications.length} template=${templateKey}`
    );

  } catch (err) {
    // Write failure to audit log; notifications stay undispatched for next cycle
    await pool.query(
      `INSERT INTO webhook_outbound_log
         (user_id, event_key, webhook_url_snapshot, payload,
          status, attempts, max_attempts, error_message, last_attempted_at)
       VALUES ($1, 'insight_available', $2, $3, 'failed', 1, $4, $5, NOW())`,
      [userId, settings.webhook_url, JSON.stringify(envelope), MAX_ATTEMPTS, _truncate(err.message, 500)]
    );

    logger.warn(`[webhookSender] Dispatch failed user=${userId}: ${err.message}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────
// HTTP POST
// ─────────────────────────────────────────────────────────────────────────

/**
 * Fire one HTTP POST with optional HMAC-SHA256 signing.
 * Requires Node 18+ (native fetch + AbortController).
 *
 * @returns {{ ok: boolean, statusCode: number, responseBody: string }}
 */
async function _postWebhook(url, secret, payload) {
  const bodyStr    = JSON.stringify(payload);
  const controller = new AbortController();
  const tid        = setTimeout(() => controller.abort(), HTTP_TIMEOUT_MS);

  const headers = {
    'Content-Type'    : 'application/json',
    'User-Agent'      : 'VidaPulse-Webhook/1.0',
    'X-VidaPulse-At'  : new Date().toISOString(),
  };

  if (secret) {
    const sig = crypto.createHmac('sha256', secret).update(bodyStr).digest('hex');
    headers['X-VidaPulse-Signature'] = `sha256=${sig}`;
  }

  try {
    const response = await fetch(url, {
      method  : 'POST',
      headers,
      body    : bodyStr,
      signal  : controller.signal,
    });

    const responseBody = await response.text().catch(() => '');
    return { ok: response.ok, statusCode: response.status, responseBody };

  } catch (err) {
    // Normalise timeout and network errors
    const message = controller.signal.aborted
      ? `Request timed out after ${HTTP_TIMEOUT_MS}ms`
      : err.message;
    return { ok: false, statusCode: 0, responseBody: message };
  } finally {
    clearTimeout(tid);
  }
}

// ─────────────────────────────────────────────────────────────────────────
// PAYLOAD BUILDER
// ─────────────────────────────────────────────────────────────────────────

/**
 * Build the outbound envelope for a standard behavioral event.
 * Handles both new events (from behavioral_events) and retry rows
 * (from webhook_outbound_log JOIN behavioral_events).
 */
function _buildStandardEnvelope(event) {
  const rawPayload = event.event_payload ?? event.payload;
  const data       = _parseJson(rawPayload);

  // Contact identity FIRST (so the CRM matches & updates the existing contact,
  // never overwrites a blank), then the event details as contact.* customs.
  const out = {};
  if (event.u_name)  out.contact_name  = event.u_name;
  if (event.u_email) out.contact_email = event.u_email;
  if (event.u_phone) out.contact_phone = event.u_phone;
  out['contact.event_type'] = event.event_key;
  out['contact.event_id']   = event.behavioral_event_id ?? event.id;
  out['contact.fired_at']   = new Date().toISOString();
  out['contact.user_id']    = event.user_id;
  out['contact.video_id']   = event.video_id ?? null;
  out['contact.data']       = data;
  return out;
}

// ─────────────────────────────────────────────────────────────────────────
// DATABASE HELPERS
// ─────────────────────────────────────────────────────────────────────────

async function _loadSettings() {
  const { rows } = await pool.query(
    `SELECT webhook_url, webhook_secret, is_active FROM webhook_settings LIMIT 1`
  );
  return rows[0] ?? null;
}

async function _loadGovernor() {
  const { rows } = await pool.query(
    `SELECT * FROM webhook_governor LIMIT 1`
  );
  return rows[0] ?? null;
}

async function _getDailyEmailCount(userId) {
  const { rows } = await pool.query(
    `SELECT emails_sent
     FROM   insight_email_counters
     WHERE  user_id = $1 AND date = CURRENT_DATE`,
    [userId]
  );
  return rows[0]?.emails_sent ?? 0;
}

/**
 * Validate template_key exists and is active; fall back to 'multiple_insights'.
 */
async function _resolveTemplateKey(key) {
  const { rows } = await pool.query(
    `SELECT template_key
     FROM   insight_template_keys
     WHERE  template_key = $1 AND is_active = TRUE
     LIMIT  1`,
    [key]
  );
  return rows[0]?.template_key ?? 'multiple_insights';
}

// ─────────────────────────────────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────────────────────────────────

function _parseJson(val) {
  if (!val) return {};
  if (typeof val === 'string') {
    try { return JSON.parse(val); } catch { return {}; }
  }
  return val;
}

function _truncate(str, len) {
  if (!str) return null;
  const s = String(str);
  return s.length > len ? s.slice(0, len) + '…' : s;
}

// ─────────────────────────────────────────────────────────────────────────
// ADMIN TEST WEBHOOK
// Called by POST /api/admin/webhook-settings/test
// ─────────────────────────────────────────────────────────────────────────

/**
 * Fire a single test payload to the configured URL.
 * Updates webhook_settings.last_tested_at, last_test_status, last_test_error.
 *
 * @returns {{ ok: boolean, statusCode: number, durationMs: number, responseBody: string }}
 */
async function testWebhook() {
  const settings = await _loadSettings();
  if (!settings?.webhook_url) {
    throw new Error('No webhook URL has been configured yet');
  }

  const testPayload = {
    event_key : 'webhook_test',
    fired_at  : new Date().toISOString(),
    data      : {
      message: 'VidaPulse test — if you receive this, your webhook connection is working correctly.',
    },
  };

  const t0     = Date.now();
  const result = await _postWebhook(settings.webhook_url, settings.webhook_secret, testPayload);
  const ms     = Date.now() - t0;

  await pool.query(
    `UPDATE webhook_settings
     SET last_tested_at   = NOW(),
         last_test_status = $1,
         last_test_error  = $2,
         updated_at       = NOW()`,
    [
      result.ok ? 'success' : 'failed',
      result.ok ? null      : _truncate(result.responseBody, 500),
    ]
  );

  logger.info(`[webhookSender] Test webhook → ${result.statusCode} in ${ms}ms`);
  return { ...result, durationMs: ms };
}

/**
 * Returns the current status of workers managed by this module.
 * Called by GET /api/health — reads in-memory flag, no DB query.
 *
 *   dispatch_worker — Worker B: insight notification dispatch (runs every 60 s)
 */
function getStatus() {
  return {
    dispatch_worker: _isRunning ? 'running' : 'stopped',
  };
}

module.exports = { start, stop, testWebhook, getStatus };
