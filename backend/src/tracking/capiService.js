'use strict';

/**
 * Meta Conversions API (CAPI) sender — VIEWER plane, per video.
 *
 * One request per Meta event, fired back to back, to the pixel/dataset
 * configured on THAT video (video_tracking_settings.pixel_id + capi_token).
 * Nothing here reads a global pixel: two videos can point at two different ad
 * accounts, and a video with no token simply never calls out.
 *
 * Deduplication: the embed fires the browser pixel for the same name with the
 * same event_id, so Meta collapses the pair into one event (and keeps the
 * richer one). See metaEvents.metaEventId.
 *
 * No viewer PII is sent — the viewer is anonymous by policy. user_data carries
 * only the signals Meta accepts for an anonymous web event: client IP, user
 * agent, and the _fbp / _fbc browser cookies.
 *
 * Always resolves. A CAPI failure must never affect playback or the webhook.
 */

const logger = require('../config/logger');

const GRAPH_VERSION = 'v21.0';
const CAPI_TIMEOUT_MS = 8_000;

/**
 * POST one event to /<pixel_id>/events.
 *
 * @param {object}  a
 * @param {string}  a.pixelId
 * @param {string}  a.token            CAPI access token for that pixel
 * @param {string}  a.eventName        e.g. 'ViewContent' or 'vsl_50'
 * @param {string}  a.eventId          dedup id shared with the browser pixel
 * @param {number} [a.eventTime]       unix seconds (defaults to now)
 * @param {string} [a.eventSourceUrl]  the page the video was embedded on
 * @param {string} [a.testEventCode]   TEST#### from Events Manager
 * @param {object} [a.userData]        { clientIp, userAgent, fbp, fbc }
 * @param {object} [a.customData]      extra event params (video id/title, …)
 * @returns {Promise<{ok:boolean, statusCode:number, responseBody:string|null,
 *                    errorMessage:string|null, payload:object}>}
 */
async function sendCapiEvent({
  pixelId, token, eventName, eventId, eventTime, eventSourceUrl,
  testEventCode = null, userData = {}, customData = {},
}) {
  const user_data = {};
  if (userData.clientIp)  user_data.client_ip_address = userData.clientIp;
  if (userData.userAgent) user_data.client_user_agent = userData.userAgent;
  if (userData.fbp)       user_data.fbp = userData.fbp;
  if (userData.fbc)       user_data.fbc = userData.fbc;

  const event = {
    event_name  : eventName,
    event_time  : eventTime || Math.floor(Date.now() / 1000),
    event_id    : eventId,
    action_source: 'website',
    user_data,
  };
  if (eventSourceUrl) event.event_source_url = eventSourceUrl;
  if (customData && Object.keys(customData).length) event.custom_data = customData;

  // Logged payload — the token is never written to tracking_log.
  const payload = { data: [event] };
  if (testEventCode) payload.test_event_code = testEventCode;

  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${encodeURIComponent(pixelId)}/events`;
  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), CAPI_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body   : JSON.stringify({ ...payload, access_token: token }),
      signal : controller.signal,
    });
    const responseBody = await res.text().catch(() => '');
    return {
      ok: res.ok,
      statusCode: res.status,
      responseBody,
      errorMessage: res.ok ? null : _metaError(responseBody, res.status),
      payload,
    };
  } catch (e) {
    const isTimeout = controller.signal.aborted;
    return {
      ok: false, statusCode: 0, responseBody: null,
      errorMessage: isTimeout ? `Timeout after ${CAPI_TIMEOUT_MS / 1000}s` : `Network error — ${e.message}`,
      payload,
    };
  } finally {
    clearTimeout(tid);
  }
}

/** Pull Meta's human message out of an error body (falls back to the status). */
function _metaError(body, status) {
  try {
    const j = JSON.parse(body);
    const m = j?.error?.error_user_msg || j?.error?.message;
    if (m) return String(m).slice(0, 500);
  } catch (_) { /* not JSON */ }
  return `HTTP ${status}`;
}

/** Log line helper so the caller stays readable. */
function logResult(eventName, pixelId, r) {
  if (r.ok) logger.info(`[capi] ✓ ${eventName} → pixel ${pixelId}`);
  else      logger.warn(`[capi] ✗ ${eventName} → pixel ${pixelId}: ${r.errorMessage}`);
}

module.exports = { sendCapiEvent, logResult, GRAPH_VERSION };
