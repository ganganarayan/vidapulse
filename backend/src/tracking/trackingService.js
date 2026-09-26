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
 *      via tracking_session_events; 'many' always proceeds. The dedup gates the
 *      CRM webhook + the funnel counter, NOT the Meta copies.
 *   4. Parse this video's mapping cell — a comma-separated list of Meta event
 *      names, so one VidaPulse event can fan out to several.
 *   5. Increment the fired-counters — the VidaPulse event total
 *      (tracking_event_counts) plus one per Meta name
 *      (tracking_meta_event_counts), so the UI can show them separately.
 *   6. Fan out: log the browser-pixel fires, send one Conversions API request
 *      per Meta name (back to back, to THIS video's pixel + token), and — when
 *      the mapping marks the event webhook:true — deliver to the owner's active
 *      tracking_webhooks, logging every attempt.
 *
 * Meta gets each event twice on purpose: the embed fires the browser pixel and
 * this module fires CAPI, both with the same (event_name, event_id) pair, so
 * Meta deduplicates them and keeps whichever arrived with more signal.
 *
 * The WEBHOOK payload never carries a Meta event name — the CRM only ever sees
 * the VidaPulse key (vsl_50, cta_clicked …). Meta names are a pixel concern.
 *
 * Never throws to the caller path that matters — viewer requests must not fail.
 */

const { pool }   = require('../config/database');
const logger     = require('../config/logger');
const registry   = require('../events/registry');
const { buildEnvelope } = require('../events/envelope');
const { parseMetaEvents, metaEventId } = require('./metaEvents');
const { sendCapiEvent, logResult }     = require('./capiService');

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
 * @param {object}  args
 * @param {string}  args.videoId
 * @param {string}  args.eventKey
 * @param {string} [args.sessionId]  analytics session (drives once_per_session dedup)
 * @param {string} [args.eventId]    per-fire base id minted by the embed (CAPI dedup)
 * @param {string} [args.fbp]        _fbp cookie from the viewer's browser
 * @param {string} [args.fbc]        _fbc cookie (or one built from ?fbclid=)
 * @param {string} [args.pageUrl]    page the video was embedded on
 * @param {string} [args.clientIp]   viewer IP (from the /api/track request)
 * @param {string} [args.userAgent]  viewer UA (from the /api/track request)
 * @param {boolean}[args.pixelFired] did the BROWSER fire the pixel for this one?
 *        True for player milestones (the embed fires them). False for a CTA
 *        click, which redirects away before fbq can run — there CAPI is the
 *        only copy Meta gets, and logging a browser fire would be a lie.
 * @returns {Promise<{ok:boolean, deduped?:boolean, reason?:string, meta_events?:string[]}>}
 */
async function recordViewerEvent({
  videoId, eventKey, sessionId = null, eventId = null,
  fbp = null, fbc = null, pageUrl = null, clientIp = null, userAgent = null,
  pixelFired = true,
}) {
  try {
    // 1. Only known, active VIEWER-scope events are accepted here.
    const ev = registry.getEvent(eventKey);
    if (!ev || ev.scope !== 'viewer' || ev.reserved) {
      return { ok: false, reason: 'unknown_event' };
    }

    // 2. Resolve video → owner → plan → this video's tracking settings (one query).
    const { rows: [ctx] } = await pool.query(
      `SELECT v.user_id                       AS owner_id,
              v.title                          AS video_title,
              u.is_active                      AS owner_active,
              COALESCE(p.name::text, 'free')   AS owner_plan,
              ts.enabled                       AS enabled,
              ts.event_mapping                 AS event_mapping,
              ts.pixel_id                      AS pixel_id,
              ts.capi_token                    AS capi_token,
              ts.capi_test_event_code          AS capi_test_event_code
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

    // 3. Frequency-driven dedup (registry metadata). This gates the CRM webhook
    //    and the funnel counter ONLY — the Meta copies mirror the browser pixel,
    //    which fires every occurrence, so CAPI must too or the two halves of the
    //    same event stop matching.
    const freq = registry.getFrequency(eventKey);
    let deduped = false;
    if (freq === 'once_per_session') {
      if (!sessionId) return { ok: false, reason: 'no_session' };
      const { rowCount } = await pool.query(
        `INSERT INTO tracking_session_events (session_id, event_key)
         VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [sessionId, eventKey]
      );
      deduped = rowCount === 0; // already fired this session
    }

    // 4. Resolve the destination mapping for this event. One cell can name
    //    SEVERAL Meta events ("vsl_view, ViewContent") — each is its own fire.
    const mapping    = (ctx.event_mapping && typeof ctx.event_mapping === 'object') ? ctx.event_mapping : {};
    const metaEvents = parseMetaEvents(mapping[eventKey]?.meta);
    const baseId     = eventId || `${videoId.slice(0, 8)}-${sessionId || 'nosess'}-${eventKey}-${Date.now()}`;

    // 5. Fired-counters (funnel display — one per session): the VidaPulse event
    //    total, plus one counter per Meta name so the UI can show them
    //    separately. A name added to the cell later starts from zero, which is
    //    exactly what makes the per-name numbers worth reading.
    if (!deduped) {
      await pool.query(
        `INSERT INTO tracking_event_counts (video_id, event_key, count, updated_at)
         VALUES ($1, $2, 1, NOW())
         ON CONFLICT (video_id, event_key)
         DO UPDATE SET count = tracking_event_counts.count + 1, updated_at = NOW()`,
        [videoId, eventKey]
      );

      if (metaEvents.length) {
        await pool.query(
          `INSERT INTO tracking_meta_event_counts (video_id, event_key, meta_event, count, updated_at)
           SELECT $1::uuid, $2::varchar, name, 1, NOW() FROM UNNEST($3::text[]) AS name
           ON CONFLICT (video_id, event_key, meta_event)
           DO UPDATE SET count = tracking_meta_event_counts.count + 1, updated_at = NOW()`,
          [videoId, eventKey, metaEvents]
        ).catch(e => logger.warn(`[tracking] meta counter failed (${eventKey}): ${e.message}`));
      }
    }

    // 6a. Log the browser-pixel fires (the embed fired one per name).
    for (const metaEvent of (pixelFired ? metaEvents : [])) {
      _logFire({
        kind: 'pixel', ownerId: ctx.owner_id, videoId, eventKey, metaEvent,
        status: 'fired', sessionId,
        payload: {
          event: eventKey, video_id: videoId, meta_event: metaEvent,
          pixel_id: ctx.pixel_id, event_id: metaEventId(baseId, metaEvent), session_id: sessionId,
        },
      }).catch(() => {});
    }

    // 6b. Conversions API — same names, same event_ids, THIS video's pixel.
    //     Fire-and-forget: the viewer's request must not wait on Meta.
    if (metaEvents.length && ctx.pixel_id && ctx.capi_token) {
      _fireCapiEvents({
        ownerId: ctx.owner_id, videoId, videoTitle: ctx.video_title, eventKey,
        metaEvents, baseId, sessionId,
        pixelId: ctx.pixel_id, token: ctx.capi_token, testEventCode: ctx.capi_test_event_code,
        fbp, fbc, pageUrl, clientIp, userAgent,
      }).catch(() => {});
    }

    // 6c. Webhook delivery — only if the per-video mapping opts this event in,
    //     and not a second time in the same session. The payload carries the
    //     VidaPulse key only, never a Meta event name.
    if (!deduped && mapping[eventKey]?.webhook === true) {
      deliverTrackingWebhooks(ctx.owner_id, eventKey, {
        video_id: videoId, video_title: ctx.video_title, session_id: sessionId,
      }).catch(() => {});
    }

    return { ok: true, deduped, meta_events: metaEvents };
  } catch (err) {
    logger.error(`[tracking] recordViewerEvent failed (${eventKey}/${videoId}): ${err.message}`);
    return { ok: false, reason: 'error' };
  }
}

// ─────────────────────────────────────────────────────────────────────────
// CONVERSIONS API FAN-OUT (per-video pixel + token)
// ─────────────────────────────────────────────────────────────────────────

/**
 * Send one CAPI event per mapped Meta name, sequentially (back to back), and
 * log each attempt to tracking_log (kind='capi'). Always resolves.
 *
 * Sequential rather than batched on purpose: each name gets its own event_id,
 * its own HTTP result and its own log row, so a rejected name is visible
 * instead of hidden inside a partially-accepted batch.
 */
async function _fireCapiEvents({
  ownerId, videoId, videoTitle, eventKey, metaEvents, baseId, sessionId,
  pixelId, token, testEventCode, fbp, fbc, pageUrl, clientIp, userAgent,
}) {
  // Fill the gaps the browser could not supply from the stored session.
  let src = { page_url: pageUrl || null, user_agent: userAgent || null, ip: clientIp || null };
  if (sessionId && (!src.page_url || !src.user_agent || !src.ip)) {
    try {
      const { rows: [s] } = await pool.query(
        `SELECT page_url, user_agent, host(ip_address) AS ip
           FROM analytics_sessions WHERE id = $1`,
        [sessionId]
      );
      if (s) {
        src.page_url   = src.page_url   || s.page_url;
        src.user_agent = src.user_agent || s.user_agent;
        src.ip         = src.ip         || s.ip;
      }
    } catch (_) { /* non-uuid / missing session — send what we have */ }
  }

  const eventTime = Math.floor(Date.now() / 1000);

  for (const metaEvent of metaEvents) {
    const eventId = metaEventId(baseId, metaEvent);
    const r = await sendCapiEvent({
      pixelId, token, testEventCode,
      eventName: metaEvent, eventId, eventTime,
      eventSourceUrl: src.page_url,
      userData : { clientIp: src.ip, userAgent: src.user_agent, fbp, fbc },
      customData: {
        vidapulse_event: eventKey,
        video_id       : videoId,
        content_name   : videoTitle || '',
      },
    });
    logResult(metaEvent, pixelId, r);

    await _logFire({
      kind: 'capi', ownerId, videoId, eventKey, metaEvent,
      url: `graph.facebook.com/${pixelId}/events`,
      status: r.ok ? 'sent' : 'failed',
      responseStatus: r.statusCode, responseBody: r.responseBody, errorMessage: r.errorMessage,
      payload: r.payload, sessionId,
    }).catch(e => logger.warn(`[capi] log insert failed: ${e.message}`));
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

    const payload = await _buildViewerEnvelope(ownerId, eventKey, ctx);

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

/**
 * Build the viewer-plane webhook payload.
 *
 * The VIEWER is anonymous (no lead PII, by policy), so the CRM's "≥2 of
 * name/email/phone" rule is satisfied with the SUBSCRIBER (video owner) as the
 * contact identity. We also attach the viewer's UTM (campaign attribution, no
 * PII) and the event/video context. Reuses the same HYBRID envelope the
 * platform CRM already maps (buildEnvelope) — but delivered ONLY to the owner's
 * tracking_webhooks, so plane separation is preserved (it's a pure formatter,
 * not a delivery route).
 */
async function _buildViewerEnvelope(ownerId, eventKey, ctx = {}) {
  // Subscriber (owner) identity — the contact the CRM ties the event to.
  let owner = {};
  try {
    const { rows: [o] } = await pool.query(
      `SELECT u.name, u.email, u.phone, COALESCE(p.name::text, 'free') AS plan
         FROM users u LEFT JOIN plans p ON p.id = u.plan_id
        WHERE u.id = $1`,
      [ownerId]
    );
    if (o) owner = o;
  } catch (e) { logger.warn(`[tracking] owner lookup failed: ${e.message}`); }

  // Viewer's campaign attribution — UTM from the analytics session (no PII).
  let utm = {};
  if (ctx.session_id) {
    try {
      const { rows: [s] } = await pool.query(
        `SELECT utm_source, utm_medium, utm_campaign, utm_term, utm_content
           FROM analytics_sessions WHERE id = $1`,
        [ctx.session_id]
      );
      if (s) utm = s;
    } catch (_) { /* non-uuid / missing session — UTM just stays empty */ }
  }

  return buildEnvelope(eventKey, {
    user: { name: owner.name, email: owner.email, phone: owner.phone, plan: owner.plan },
    extraFields: {
      identity    : 'subscriber',   // the contact is the account OWNER, not the viewer
      viewer      : 'anonymous',
      video_id    : ctx.video_id    || '',
      video_title : ctx.video_title || '',
      session_id  : ctx.session_id  || '',
      utm_source  : utm.utm_source   || '',
      utm_medium  : utm.utm_medium   || '',
      utm_campaign: utm.utm_campaign || '',
      utm_term    : utm.utm_term     || '',
      utm_content : utm.utm_content  || '',
    },
  });
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
