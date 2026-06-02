'use strict';

/**
 * Lead-source capture.
 *
 * Flow: ad → vidapulse.io (?utm_*) → "Sign up" → app.vidapulse.io/login?utm_*
 *
 * On app boot we read the UTM params from the URL and persist them so they
 * survive in-app navigation (login → register) and the OAuth round-trip:
 *   - localStorage 'vp_lead_source' → read by Register and sent in the request body
 *   - cookie       'vp_ls'          → sent automatically (same-origin) to the
 *                                      backend on the OAuth GET so OAuth signups
 *                                      capture the source too
 *
 * Last-touch on UTM presence: whenever the current URL carries UTM params we
 * overwrite the stored value, so the source reflects the campaign that drove
 * this visit. Cleared after a successful signup via clearLeadSource().
 */

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
const LS_KEY   = 'vp_lead_source';
const COOKIE   = 'vp_ls';
const MAX_AGE  = 60 * 60 * 24 * 30; // 30 days
const MAX_LEN  = 300;

/** Read UTM params from the current URL and persist them (no-op if none present). */
export function captureLeadSource() {
  try {
    const params = new URLSearchParams(window.location.search);
    const ls = {};
    for (const k of UTM_KEYS) {
      const v = params.get(k);
      if (v) ls[k] = String(v).slice(0, MAX_LEN);
    }
    if (Object.keys(ls).length === 0) return; // nothing to capture this visit

    const json = JSON.stringify(ls);
    localStorage.setItem(LS_KEY, json);
    document.cookie = `${COOKIE}=${encodeURIComponent(json)}; path=/; max-age=${MAX_AGE}; samesite=lax`;
  } catch { /* non-fatal — analytics nicety, never block the app */ }
}

/** Returns the stored lead-source object ({ utm_* }) or null. */
export function getLeadSource() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

/** Clear the stored lead source (call after a successful signup). */
export function clearLeadSource() {
  try {
    localStorage.removeItem(LS_KEY);
    document.cookie = `${COOKIE}=; path=/; max-age=0; samesite=lax`;
  } catch { /* non-fatal */ }
}
