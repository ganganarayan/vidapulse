/**
 * pixel.js — Meta Pixel (fbq) helper
 *
 * The pixel ID is managed in the app (super admin > Settings) and read at
 * runtime from GET /api/public-config; VITE_META_PIXEL_ID is only a fallback
 * when that call fails. Events fired before the ID arrives are queued.
 * All functions are silent no-ops when the ID is blank — safe to ship
 * before the pixel ID is configured.
 *
 * Usage:
 *   initPixel()                                           ← call once at app boot
 *   pixelPageView()                                       ← on every route change
 *   pixelTrack('StartTrial')                              ← after free signup
 *   pixelTrack('Purchase', { value: 999, currency: 'INR' }) ← after paid plan activates
 */

const FALLBACK_PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID;

let initialized = false;
let started     = false;
let disabled    = false;   // config says no pixel: drop events
const pending   = [];      // [method, event, data] fired before init

async function _resolvePixelId() {
  try {
    const r = await fetch('/api/public-config', { credentials: 'same-origin' });
    if (r.ok) {
      const j = await r.json();
      return j?.meta_pixel_id || null;
    }
  } catch { /* fall through */ }
  return FALLBACK_PIXEL_ID || null;
}

function _send(method, event, data) {
  if (data && Object.keys(data).length > 0) window.fbq(method, event, data);
  else window.fbq(method, event);
}

function _fire(method, event, data) {
  if (disabled) return;
  if (!initialized || typeof window.fbq !== 'function') {
    if (pending.length < 50) pending.push([method, event, data]);
    return;
  }
  _send(method, event, data);
}

/**
 * Injects the Meta Pixel base code and calls fbq('init', PIXEL_ID).
 * Safe to call multiple times — only executes once.
 * No-ops when VITE_META_PIXEL_ID is empty or undefined.
 */
export function initPixel() {
  if (started) return;
  started = true;
  _resolvePixelId().then((id) => {
    if (!id) { disabled = true; pending.length = 0; return; }
    _inject(id);
    pending.splice(0).forEach(([m, e, d]) => _send(m, e, d));
  });
}

function _inject(PIXEL_ID) {
  if (initialized) return;

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
  _fire('track', event, data);
}

/**
 * Fire a CUSTOM Meta Pixel event — fbq('trackCustom', …).
 *
 * Used for the onboarding engagement signals (UserLogin, VideoAdded,
 * EmbedGenerated). These are engagement events, NOT milestones — they fire
 * on EVERY occurrence (no client-side dedup). Once-only logic lives on the
 * server (onboarding_state + behavioralEventService) for the CRM side only.
 *
 * Silently no-ops when the pixel has not been initialised.
 *
 * @param {string} event  — custom event name, e.g. 'UserLogin'
 * @param {object} [data] — optional event parameters
 */
export function pixelTrackCustom(event, data) {
  _fire('trackCustom', event, data);
}

/** Convenience shorthand: fire a PageView event. */
export function pixelPageView() {
  pixelTrack('PageView');
}

// ─── Purchase intent helpers ─────────────────────────────────────────────────
//
// Before redirecting to Razorpay, call savePurchaseIntent() with the plan,
// currency (INR | USD), and numeric value the user is about to pay.
// localStorage is used instead of sessionStorage so the value survives
// when Razorpay opens in a new tab and redirects back to /payment/:plan.
//
// On the return page call popPurchaseIntent() — it reads and immediately
// deletes the stored value so it fires only once.

const INTENT_KEY = 'vp_pixel_purchase';

/**
 * Save the pending purchase details before leaving for Razorpay.
 * @param {{ plan: string, currency: 'INR'|'USD', value: number }} intent
 */
export function savePurchaseIntent({ plan, currency, value }) {
  try {
    localStorage.setItem(INTENT_KEY, JSON.stringify({ plan, currency, value }));
  } catch {
    // localStorage blocked (private browsing strict mode) — fail silently
  }
}

/**
 * Read and immediately delete the stored purchase intent.
 * Returns null if nothing was saved.
 * @returns {{ plan: string, currency: string, value: number } | null}
 */
export function popPurchaseIntent() {
  try {
    const raw = localStorage.getItem(INTENT_KEY);
    localStorage.removeItem(INTENT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
