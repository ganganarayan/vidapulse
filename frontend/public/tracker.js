/**
 * VidaPulse Embed Tracker  v1.0
 *
 * Lightweight analytics script for tracking video engagement on any page.
 * Drop this script tag onto any page that embeds a VidaPulse-tracked video.
 *
 * Usage — paste once before </body>:
 *
 *   <script
 *     src="https://app.vidapulse.in/tracker.js"
 *     data-video-id="YOUR_VIDEO_UUID"
 *     async
 *   ></script>
 *
 * Optional attributes:
 *   data-video-id   — UUID of the video (required for tracking)
 *   data-target     — CSS selector of the <video> or <iframe> element to track.
 *                     Defaults to the first <video> or <iframe> on the page.
 *
 * What it tracks:
 *   - Session start (player load)
 *   - Play, pause, seek events
 *   - Heartbeat every 10 s while playing (progress + heatmap intervals)
 *   - End event + page unload (via sendBeacon)
 *
 * Privacy:
 *   - Viewer identified by a UUID stored in localStorage (no PII)
 *   - No cookies set by this script
 *   - All data sent to the VidaPulse backend only
 */

(function (win, doc) {
  'use strict';

  // ── Config ────────────────────────────────────────────────────────────

  var API_BASE = 'https://app.vidapulse.in/api/analytics';
  var HEARTBEAT_INTERVAL_MS = 10000; // 10 s between progress pings
  var VIEWER_COOKIE_KEY     = 'vp_viewer_id';
  var MAX_INTERVALS_PER_PING = 300;  // cap heatmap payload size

  // ── Detect own script tag ─────────────────────────────────────────────

  var scriptTag = doc.currentScript ||
    (function () {
      var tags = doc.getElementsByTagName('script');
      return tags[tags.length - 1];
    })();

  var videoId   = scriptTag && scriptTag.getAttribute('data-video-id');
  var targetSel = scriptTag && scriptTag.getAttribute('data-target');

  if (!videoId) {
    console.warn('[VidaPulse] data-video-id attribute is missing — tracking disabled.');
    return;
  }

  // ── Viewer ID ─────────────────────────────────────────────────────────
  // Persistent UUID stored in localStorage. Not a cookie.

  function getOrCreateViewerId() {
    try {
      var stored = localStorage.getItem(VIEWER_COOKIE_KEY);
      if (stored && /^[a-zA-Z0-9\-]{8,}$/.test(stored)) return stored;
      var id = 'vp-' + _uuid();
      localStorage.setItem(VIEWER_COOKIE_KEY, id);
      return id;
    } catch (e) {
      // localStorage blocked (private mode / cross-origin iframe)
      return 'vp-' + _uuid();
    }
  }

  // ── Device detection ──────────────────────────────────────────────────

  function detectDevice() {
    var ua = navigator.userAgent || '';
    if (/Mobi|Android|iPhone|iPad|iPod/i.test(ua)) {
      return /iPad|Tablet/i.test(ua) ? 'tablet' : 'mobile';
    }
    return 'desktop';
  }

  function detectBrowser() {
    var ua = navigator.userAgent || '';
    if (ua.indexOf('Edg/') > -1)    return 'Edge';
    if (ua.indexOf('Chrome') > -1)   return 'Chrome';
    if (ua.indexOf('Firefox') > -1)  return 'Firefox';
    if (ua.indexOf('Safari') > -1)   return 'Safari';
    return 'Other';
  }

  function detectOS() {
    var ua = navigator.userAgent || '';
    if (/Windows/.test(ua)) return 'Windows';
    if (/Mac OS/.test(ua))  return 'macOS';
    if (/Android/.test(ua)) return 'Android';
    if (/iPhone|iPad/.test(ua)) return 'iOS';
    if (/Linux/.test(ua))   return 'Linux';
    return 'Other';
  }

  function getUTM(param) {
    try {
      return new URLSearchParams(win.location.search).get(param) || null;
    } catch (e) { return null; }
  }

  // ── Tracker state ─────────────────────────────────────────────────────

  var sessionId       = null;
  var playing         = false;
  var maxPct          = 0;
  var watchSeconds    = 0;
  var heartbeatTimer  = null;
  var lastTickTime    = null;
  var intervals       = [];      // [[start, end, pass], ...] collected since last ping
  var intervalStart   = null;
  var watchPass       = 1;       // 1 = first watch, 2+ = replay

  // ── Utility ───────────────────────────────────────────────────────────

  function _uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  }

  function _post(path, data) {
    var url = API_BASE + path;
    var json = JSON.stringify(data);
    // Use sendBeacon for unload events (no guaranteed response)
    if (data._beacon && navigator.sendBeacon) {
      try {
        navigator.sendBeacon(url, new Blob([json], { type: 'application/json' }));
        return;
      } catch (e) { /* fall through to fetch */ }
    }
    // Use fetch for normal pings
    try {
      fetch(url, {
        method : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body   : json,
        keepalive: true,
      }).catch(function () { /* swallow network errors */ });
    } catch (e) { /* fetch not available */ }
  }

  function _currentPct(el) {
    if (!el || !el.duration || el.duration === 0 || isNaN(el.duration)) return 0;
    return Math.min(100, (el.currentTime / el.duration) * 100);
  }

  // ── Session start ─────────────────────────────────────────────────────
  // Calls POST /session and stores the returned session_id.
  // All pings wait for session_id before sending (pings with no session_id
  // are silently dropped by the server).

  function startSession() {
    var viewerId = getOrCreateViewerId();
    try {
      fetch(API_BASE + '/session', {
        method  : 'POST',
        headers : { 'Content-Type': 'application/json' },
        body    : JSON.stringify({
          video_id      : videoId,
          viewer_cookie : viewerId,
          page_url      : win.location.href,
          referrer      : doc.referrer || null,
          utm_source    : getUTM('utm_source'),
          utm_medium    : getUTM('utm_medium'),
          utm_campaign  : getUTM('utm_campaign'),
          utm_term      : getUTM('utm_term'),
          utm_content   : getUTM('utm_content'),
          device_type   : detectDevice(),
          browser       : detectBrowser(),
          os            : detectOS(),
          screen_width  : win.screen ? win.screen.width  : null,
          screen_height : win.screen ? win.screen.height : null,
          user_agent    : navigator.userAgent,
        }),
      })
        .then(function (r) { return r.json(); })
        .then(function (d) {
          if (d && d.session_id) sessionId = d.session_id;
        })
        .catch(function () { /* session failed — pings will be silently dropped */ });
    } catch (e) { /* fetch not available */ }
  }

  // ── Interval tracking ────────────────────────────────────────────────

  function openInterval(currentSec) {
    intervalStart = currentSec;
  }

  function closeInterval(currentSec) {
    if (intervalStart !== null && currentSec > intervalStart) {
      intervals.push([intervalStart, currentSec, watchPass]);
    }
    intervalStart = null;
  }

  // ── Heartbeat ────────────────────────────────────────────────────────

  function tick(el) {
    var now = Date.now();
    if (playing && lastTickTime) {
      watchSeconds += (now - lastTickTime) / 1000;
    }
    lastTickTime = now;

    if (el) {
      var pct = _currentPct(el);
      if (pct > maxPct) maxPct = pct;
      // Update the open interval's end to current time
    }
  }

  function sendPing(eventType, el, useBeacon) {
    if (!sessionId) return;

    // Close any open interval before sending
    if (el && intervalStart !== null) {
      closeInterval(el.currentTime || 0);
    }

    var payload = {
      session_id    : sessionId,
      video_id      : videoId,
      event         : eventType,
      max_pct       : Math.round(maxPct * 10) / 10,
      watch_seconds : Math.round(watchSeconds * 10) / 10,
      intervals     : intervals.slice(0, MAX_INTERVALS_PER_PING),
      _beacon       : !!useBeacon,
    };

    _post('/ping', payload);
    intervals = []; // clear flushed intervals

    // Re-open interval if still playing
    if (playing && el) openInterval(el.currentTime || 0);
  }

  function startHeartbeat(el) {
    stopHeartbeat();
    heartbeatTimer = setInterval(function () {
      tick(el);
      sendPing('heartbeat', el, false);
    }, HEARTBEAT_INTERVAL_MS);
  }

  function stopHeartbeat() {
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }
  }

  // ── Event handlers ───────────────────────────────────────────────────

  function onPlay(el) {
    playing     = true;
    lastTickTime = Date.now();
    openInterval(el.currentTime || 0);
    startHeartbeat(el);
    sendPing('play', el, false);
  }

  function onPause(el) {
    playing = false;
    stopHeartbeat();
    tick(el);
    closeInterval(el.currentTime || 0);
    sendPing('pause', el, false);
  }

  function onSeek(el) {
    // Close current interval; open a new one at seek target
    if (intervalStart !== null) closeInterval(el.currentTime || 0);
    openInterval(el.currentTime || 0);
    sendPing('seek', el, false);
  }

  function onEnded(el) {
    playing = false;
    stopHeartbeat();
    tick(el);
    closeInterval(el.duration || 0);
    maxPct = 100;
    watchPass++;
    sendPing('end', el, false);
  }

  function onUnload(el) {
    if (playing) {
      tick(el);
      closeInterval(el ? (el.currentTime || 0) : 0);
    }
    sendPing('end', el, true); // sendBeacon
  }

  // ── Attach to a <video> element ──────────────────────────────────────

  function attachToVideo(el) {
    if (!el) return;

    el.addEventListener('play',     function () { onPlay(el);   });
    el.addEventListener('pause',    function () { onPause(el);  });
    el.addEventListener('seeked',   function () { onSeek(el);   });
    el.addEventListener('ended',    function () { onEnded(el);  });
    el.addEventListener('timeupdate', function () {
      if (playing) {
        var pct = _currentPct(el);
        if (pct > maxPct) maxPct = pct;
      }
    });
  }

  // ── Attach to an <iframe> (YouTube / Vimeo / etc.) ───────────────────
  // For iframes we can only detect page-level play intent via postMessage.
  // The YouTube IFrame API sends messages we can listen to.

  function attachToIframe(el) {
    if (!el) return;
    win.addEventListener('message', function (evt) {
      try {
        var data = typeof evt.data === 'string' ? JSON.parse(evt.data) : evt.data;
        if (!data) return;

        // YouTube IFrame API events
        if (data.event === 'video' || (data.info && typeof data.info.playerState !== 'undefined')) {
          var state = data.info ? data.info.playerState : null;
          if (state === 1 && !playing) { playing = true;  lastTickTime = Date.now(); startHeartbeat(null); sendPing('play', null, false); }
          if (state === 2 &&  playing) { playing = false; stopHeartbeat(); sendPing('pause', null, false); }
          if (state === 0 &&  playing) { playing = false; stopHeartbeat(); maxPct = 100; sendPing('end', null, false); }
        }

        // Vimeo postMessage events
        if (data.method === 'play'  && !playing) { playing = true;  lastTickTime = Date.now(); startHeartbeat(null); sendPing('play', null, false); }
        if (data.method === 'pause' &&  playing) { playing = false; stopHeartbeat(); sendPing('pause', null, false); }
        if (data.event  === 'finish')            { playing = false; stopHeartbeat(); maxPct = 100; sendPing('end', null, false); }
        if (data.event  === 'timeupdate' && data.data) {
          var pct2 = data.data.percent ? data.data.percent * 100 : 0;
          if (pct2 > maxPct) maxPct = pct2;
        }
      } catch (e) { /* ignore parse errors from unrelated iframes */ }
    });
  }

  // ── Init ─────────────────────────────────────────────────────────────

  function init() {
    startSession();

    // Find the target element
    var el = null;
    if (targetSel) {
      el = doc.querySelector(targetSel);
    } else {
      el = doc.querySelector('video') || doc.querySelector('iframe');
    }

    if (!el) {
      // Retry once the DOM is fully loaded
      win.addEventListener('load', function () {
        el = doc.querySelector('video') || doc.querySelector('iframe');
        if (el) attachElement(el);
      });
      return;
    }
    attachElement(el);
  }

  function attachElement(el) {
    if (el.tagName === 'VIDEO') {
      attachToVideo(el);
    } else if (el.tagName === 'IFRAME') {
      attachToIframe(el);
    }
    // Page unload
    win.addEventListener('beforeunload', function () { onUnload(el); });
    win.addEventListener('pagehide',     function () { onUnload(el); });
  }

  // Run after DOM is interactive
  if (doc.readyState === 'loading') {
    doc.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

}(window, document));
