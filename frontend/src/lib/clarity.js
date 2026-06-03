'use strict';

/**
 * Microsoft Clarity loader — gated by auth state.
 *
 * We only want Clarity to record the PRE-LOGIN funnel (landing → login →
 * register), NOT the authenticated dashboard. So instead of hard-coding the
 * tag in index.html (which would load on every page), we load it lazily for
 * unauthenticated visitors and stop it the moment the user is authenticated.
 *
 * Because login does a full page reload into /dashboard, an authenticated
 * page-load simply never injects the tag. For the SPA register→dashboard hop
 * (no reload) we also call stopClarity() so recording halts immediately.
 */

const CLARITY_ID = 'x095b765gx';
let injected = false;

/** Inject the Clarity tag once (no-op if already present). */
export function loadClarity() {
  if (injected || typeof window === 'undefined') return;
  injected = true;
  if (window.clarity) return; // already loaded (e.g. landing page set it)
  (function (c, l, a, r, i, t, y) {
    c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
    t = l.createElement(r); t.async = 1; t.src = 'https://www.clarity.ms/tag/' + i;
    y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
  })(window, document, 'clarity', 'script', CLARITY_ID);
}

/** Stop Clarity recording (best-effort) — called once authenticated. */
export function stopClarity() {
  try { if (window.clarity) window.clarity('stop'); } catch { /* no-op */ }
}
