'use strict';

/**
 * Public viewer-tracking endpoint — POST /api/track
 *
 * Called by the embed player (viewer's browser, no auth) when a viewer crosses
 * a milestone or clicks a CTA. Records the event server-side (owner resolution,
 * Pro gate, dedup, counter, webhook delivery all happen in trackingService).
 *
 * Never breaks the viewer: validation errors return 400, everything else
 * returns 200 with a result body (handy for the manual test before the embed
 * is wired).
 *
 * The browser pixel is fired client-side in the embed; the SERVER half (the
 * Conversions API, per video) fires from here via trackingService. The body
 * carries what only the browser can know — the per-fire event_id used to
 * deduplicate the two copies, the _fbp / _fbc cookies, and the embedding page
 * URL. The viewer's IP + user agent are read from THIS request, never trusted
 * from the body.
 */

const express = require('express');
const router  = express.Router();
const logger  = require('../config/logger');
const { recordViewerEvent } = require('../tracking/trackingService');

// ── Lightweight rate limit (per session_id, falling back to IP) ────────────
const _limiter = new Map();
const WINDOW_MS = 60_000;
const MAX       = 60; // generous — a viewer fires ≤ 6 events per session

function _rate(key) {
  const now = Date.now();
  const e   = _limiter.get(key);
  if (!e || e.resetAt <= now) { _limiter.set(key, { count: 1, resetAt: now + WINDOW_MS }); return true; }
  if (e.count >= MAX) return false;
  e.count++;
  return true;
}
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of _limiter) if (v.resetAt <= now) _limiter.delete(k);
}, 10 * 60_000).unref();

/** Trim an untrusted body value to a bounded string (or null). */
function _str(v, max) {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  return s ? s.slice(0, max) : null;
}

router.post('/', async (req, res) => {
  try {
    const { video_id, event, session_id, event_id, fbp, fbc, page_url } = req.body ?? {};
    if (!video_id || !event) {
      return res.status(400).json({ ok: false, error: 'video_id and event are required' });
    }

    const rateKey = session_id || req.ip || 'anon';
    if (!_rate(rateKey)) return res.status(429).json({ ok: false, error: 'rate_limited' });

    const result = await recordViewerEvent({
      videoId  : String(video_id),
      eventKey : String(event),
      sessionId: session_id ? String(session_id) : null,
      eventId  : _str(event_id, 120),
      fbp      : _str(fbp, 120),
      fbc      : _str(fbc, 255),
      pageUrl  : _str(page_url, 1000),
      clientIp : req.ip || null,
      userAgent: _str(req.headers['user-agent'], 500),
    });
    return res.json(result);
  } catch (err) {
    // Never surface a 500 to the viewer's browser.
    logger.error(`[track] ${err.message}`);
    return res.status(200).json({ ok: false, error: 'server_error' });
  }
});

module.exports = router;
