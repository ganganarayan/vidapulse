/**
 * pixel.js — Meta Pixel (fbq) helper
 *
 * Reads VITE_META_PIXEL_ID at build time.
 * All functions are silent no-ops when the ID is blank — safe to ship
 * before the pixel ID is configured.
 *
 * Usage:
 *   initPixel()                                           ← call once at app boot
 *   pixelPageView()                                       ← on every route change
 *   pixelTrack('CompleteRegistration')                    ← after free signup
 *   pixelTrack('Purchase', { value: 999, currency: 'INR' }) ← after paid plan activates
 */

const PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID;

let initialized = false;

/**
 * Injects the Meta Pixel base code and calls fbq('init', PIXEL_ID).
 * Safe to call multiple times — only executes once.
 * No-ops when VITE_META_PIXEL_ID is empty or undefined.
 */
export function initPixel() {
  if (!PIXEL_ID || initialized) return;

  // Standard Meta Pixel base snippet (injected dynamically so the pixel
  // ID can come from an env variable rather than being hardcoded in HTML).
  /* eslint-disable */
  (function (f, b, e, v, n, t, s) {
    if (f.fbq) return;
    n = f.fbq = function () {
      n.callMethod
        ? n.callMethod.apply(n, arguments)
        : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n;
    n.push    = n;
    n.loaded  = true;
    n.version = '2.0';
    n.queue   = [];
    t         = b.createElement(e);
    t.async   = true;
    t.src     = v;
    s         = b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t, s);
  })(
    window,
    document,
    'script',
    'https://connect.facebook.net/en_US/fbevents.js',
  );
  /* eslint-enable */

  window.fbq('init', PIXEL_ID);
  initialized = true;
}

/**
 * Fire a standard Meta Pixel event.
 * Silently no-ops when the pixel has not been initialised.
 *
 * @param {string} event  — e.g. 'PageView', 'CompleteRegistration', 'Purchase'
 * @param {object} [data] — optional event parameters
 */
export function pixelTrack(event, data) {
  if (!initialized || typeof window.fbq !== 'function') return;
  if (data && Object.keys(data).length > 0) {
    window.fbq('track', event, data);
  } else {
    window.fbq('track', event);
  }
}

/** Convenience shorthand: fire a PageView event. */
export function pixelPageView() {
  pixelTrack('PageView');
}
