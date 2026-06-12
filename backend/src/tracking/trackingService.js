'use strict';

/**
 * Tracking Service — VIEWER plane (subscriber-owned video engagement).
 *
 * Completely separate from the platform plane (contactWebhookSender →
 * event_webhooks). This module ONLY ever reads tracking_webhooks and writes
 * tracking_log — by design it cannot deliver a viewer event to a platform
 * endpoint, and the platform sender cannot reach tracking_webhooks.
 * That isolation is the whole point (Constraint 1).
 *
 * Flow (recordViewerEvent):
 *   1. Resolve video → owner → owner plan + this video's tracking settings.
 *   2. Gate: owner active, owner Pro/admin_lifetime, tracking enabled.
 *   3. Frequency (from the registry, not hardcoded): 'once_per_session' dedups
 *      via tracking_session_events; 'many' always proceeds.
 *   4. Increment the fired-counter (tracking_event_counts) — funnel display.
 *   5. If the per-video event_mapping marks this event webhook:true, deliver to
 *      the owner's active tracking_webhooks and log each attempt.
 *
 * The Meta Pixel is fired CLIENT-side from the embed (every occurrence). The
 * `meta` value in event_mapping is for the embed; the server uses only the
 * `webhook` flag here.
 *
 * Never throws to the caller path that matters — viewer requests must not fail.
 */

const { pool }   = require('../config/database');
const logger     = require('../config/logger');
const registry   = require('../events/registry');

const TRACK_TIMEOUT_MS = 8_000;

/** The approved V1 preset — used as the default when a video has no row yet. */
const DEFAULT_EVENT_MAPPING = {
  vsl_view:    { meta: 'ViewContent', webhook: true },
  vsl_25:      { meta: 'ViewContent', webhook: true },
  vsl_50:      { meta: 'ViewContent', webhook: true },
  vsl_75:      { meta: 'ViewContent', webhook: true },
  vsl_100:     { meta: 'Lead',        webhook: true },
  cta_clicked: { meta: 'Lead',        webhook: true },
};

// ─────────────────────────────────────────────────────────────────────────
// PUBLIC: record a viewer event (called by POST /api/track)
// ─────────────────────────────────────────────────────────────────────────

/**
 * @param {{ videoId:string, eventKey:string, sessionId?:string|null }} args
 * @returns {Promise<{ok:boolean, deduped?:boolean, reason?:string}>}
 */
async function recordViewerEvent({ videoId, eventKey, sessionId = null }) {
  try {
    // 1. Only known, active VIEWER-scope events are accepted here.
    const ev = registry.getEvent(eventKey);
    if (!ev || ev.scope !== 'viewer' || ev.reserved) {
      return { ok: false, reason: 'unknown_event' };
    }

    // 2. Resolve video → owner → plan → this video's tracking settings (one query).
    const { rows: [ctx] } = await pool.query(
      `SELECT v.user_id                       AS owner_id,
              u.is_active                      AS owner_active,
              COALESCE(p.name::text, 'free')   AS owner_plan,
              ts.enabled                       AS enabled,
              ts.event_mapping                 AS event_mapping
         FROM videos v
         JOIN users u            ON u.id = v.user_id
         LEFT JOIN plans p       ON p.id = u.plan_id
         LEFT JOIN video_tracking_settings ts ON ts.video_id = v.id
        WHERE v.id = $1 AND v.is_active = TRUE`,
      [videoId]
    );

    if (!ctx || !ctx.owner_active)                         return { ok: false, reason: 'video_not_found' };
    if (!(ctx.owner_plan === 'pro' || ctx.owner_plan === 'admin_lifetime')) return { ok: false, reason: 'not_pro' };
    if (!ctx.enabled)                                      return { ok: false, reason: 'disabled' };

    // 3. Frequency-driven dedup (registry metadata).
    const freq = registry.getFrequency(eventKey);
    if (freq === 'once_per_session') {
      if (!sessionId) return { ok: false, reason: 'no_session' };
      const { rowCount } = await pool.query(
        `INSERT INTO tracking_session_events (session_id, event_key)
         VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [sessionId, eventKey]
      );
      if (rowCount === 0) return { ok: true, deduped: true }; // already fired this session
    }

    // 4. Increment the fired-counter (funnel display).
    await pool.query(
      `INSERT INTO tracking_event_counts (video_id, event_key, count, updated_at)
       VALUES ($1, $2, 1, NOW())
       ON CONFLICT (video_id, event_key)
       DO UPDATE SET count = tracking_event_counts.count + 1, updated_at = NOW()`,
      [videoId, eventKey]
    );

    // 5. Resolve the destination mapping for this event.
    const mapping   = (ctx.event_mapping && typeof ctx.event_mapping === 'object') ? ctx.event_mapping : {};
    const metaEvent = mapping[eventKey]?.meta || null;

    // 5a. Log the pixel fire (the embed fired the owner's pixel for this event).
    if (metaEvent) {
      _logFire({
        kind: 'pixel', ownerId: ctx.owner_id, videoId, eventKey, metaEvent,
        status: 'fired', sessionId,
        payload: { event: eventKey, video_id: videoId, meta_event: metaEvent, session_id: sessionId },
      }).catch(() => {});
    }

    // 5b. Webhook delivery — only if the per-video mapping opts this event in.
    if (mapping[eventKey]?.webhook === true) {
      deliverTrackingWebhooks(ctx.owner_id, eventKey, { video_id: videoId, session_id: sessionId }).catch(() => {});
    }

    return { ok: true };
  } catch (err) {
    logger.error(`[tracking] recordViewerEvent failed (${eventKey}/${videoId}): ${err.message}`);
    return { ok: false, reason: 'error' };
  }
}

// ─────────────────────────────────────────────────────────────────────────
// VIEWER-PLANE WEBHOOK DELIVERY (tracking_webhooks ONLY — never event_webhooks)
// ─────────────────────────────────────────────────────────────────────────

/**
 * Deliver a viewer event to every ACTIVE tracking webhook owned by ownerId.
 * Also used by behavioralEventService for viewer-scope SERVER events.
 * Always resolves; logs each attempt to tracking_log (kind='webhook').
 */
async function deliverTrackingWebhooks(ownerId, eventKey, ctx = {}) {
  try {
    const { rows: hooks } = await pool.query(
      `SELECT id, url FROM tracking_webhooks WHERE user_id = $1 AND status = 'active'`,
      [ownerId]
    );
    if (!hooks.length) return;

    const payload = _buildTrackingPayload(eventKey, ctx);

    for (const hook of hooks) {
      const { ok, statusCode, responseBody, errorMessage } = await _post(hook.url, payload);
      await _logFire({
        kind: 'webhook', ownerId, videoId: ctx.video_id || null, eventKey,
        url: hook.url, status: ok ? 'sent' : 'failed',
        responseStatus: statusCode, responseBody, errorMessage,
        payload, sessionId: ctx.session_id || null,
      }).catch(e => logger.warn(`[tracking] log insert failed: ${e.message}`));

      if (ok) logger.info(`[tracking] ✓ ${eventKey} → ${statusCode} url=${hook.url}`);
      else    logger.warn(`[tracking] ✗ ${eventKey} → ${errorMessage} url=${hook.url}`);
    }
  } catch (err) {
    logger.error(`[tracking] deliverTrackingWebhooks error (${eventKey}): ${err.message}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────
// HELPERS (self-contained — no shared routing with the platform sender)
// ─────────────────────────────────────────────────────────────────────────

/** Viewer-event payload. No contact identity — the viewer is anonymous. */
function _buildTrackingPayload(eventKey, ctx = {}) {
  return {
    event    : eventKey,
    source   : 'vidapulse',
    timestamp: new Date().toISOString(),
    video_id : ctx.video_id || null,
    ...(ctx.session_id ? { session_id: ctx.session_id } : {}),
  };
}

async function _post(url, body) {
  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), TRACK_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method : 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'VidaPulse-Tracking/1.0' },
      body   : JSON.stringify(body),
      signal : controller.signal,
    });
    const responseBody = await res.text().catch(() => '');
    return { ok: res.ok, statusCode: res.status, responseBody, errorMessage: res.ok ? null : `HTTP ${res.status}` };
  } catch (e) {
    const isTimeout = controller.signal.aborted;
    return { ok: false, statusCode: 0, responseBody: null, errorMessage: isTimeout ? `Timeout after ${TRACK_TIMEOUT_MS / 1000}s` : `Network error — ${e.message}` };
  } finally {
    clearTimeout(tid);
  }
}

// ─────────────────────────────────────────────────────────────────────────
// TRACKING LOG (read-only feed — pixel + webhook fires)
// ─────────────────────────────────────────────────────────────────────────

/** Insert one tracking_log row (a pixel fire or a webhook fire). */
async function _logFire({ kind, ownerId, videoId = null, eventKey, metaEvent = null, url = null,
                          status, responseStatus = null, responseBody = null, errorMessage = null,
                          payload = null, sessionId = null }) {
  await pool.query(
    `INSERT INTO tracking_log
       (owner_user_id, video_id, kind, event_key, meta_event, url, status,
        response_status, response_body, error_message, payload, session_id, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW())`,
    [ownerId, videoId, kind, eventKey, metaEvent, url, status,
     responseStatus, responseBody ? String(responseBody).slice(0, 2000) : null, errorMessage,
     payload ? JSON.stringify(payload) : null, sessionId]
  );
}

// Whitelist of sortable columns → safe SQL expression (prevents injection).
const _LOG_SORT = {
  date  : 'tl.created_at',
  video : 'v.title',
  event : 'tl.event_key',
  type  : 'tl.kind',
  dest  : 'COALESCE(tl.meta_event, tl.url)',
  status: 'tl.status',
  owner : 'u.email',
};

/**
 * Paginated, sortable tracking log. ownerId=null → all users (admin view);
 * otherwise scoped to that owner (user view). Read-only.
 */
async function getTrackingLogs({ ownerId = null, page = 1, limit = 50, sort = 'date', dir = 'desc' } = {}) {
  const col       = _LOG_SORT[sort] || _LOG_SORT.date;
  const direction = String(dir).toLowerCase() === 'asc' ? 'ASC' : 'DESC';
  const lim       = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));
  const pg        = Math.max(1, parseInt(page, 10) || 1);
  const offset    = (pg - 1) * lim;

  const where      = ownerId ? 'WHERE tl.owner_user_id = $3' : '';
  const dataParams = ownerId ? [lim, offset, ownerId] : [lim, offset];

  const { rows } = await pool.query(
    `SELECT tl.id, tl.created_at, tl.kind, tl.event_key, tl.meta_event, tl.url,
            tl.status, tl.response_status, tl.error_message, tl.payload,
            tl.video_id, v.title AS video_title, u.email AS owner_email
     FROM   tracking_log tl
     LEFT JOIN videos v ON v.id = tl.video_id
     LEFT JOIN users  u ON u.id = tl.owner_user_id
     ${where}
     ORDER BY ${col} ${direction} NULLS LAST, tl.id DESC
     LIMIT $1 OFFSET $2`,
    dataParams
  );

  const { rows: [c] } = await pool.query(
    `SELECT COUNT(*)::int AS total FROM tracking_log tl ${ownerId ? 'WHERE tl.owner_user_id = $1' : ''}`,
    ownerId ? [ownerId] : []
  );

  const total      = c?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / lim));
  return {
    log: rows,
    pagination: {
      page: pg, limit: lim, total, total_pages: totalPages,
      has_next: pg < totalPages, has_prev: pg > 1,
    },
  };
}

module.exports = {
  DEFAULT_EVENT_MAPPING,
  recordViewerEvent,
  deliverTrackingWebhooks,
  getTrackingLogs,
};
