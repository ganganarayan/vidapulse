'use strict';

/**
 * Shared page chrome for EVERY public page: the tags that go at the end of
 * <head> and at the end of <body>. This is the one place to add or change a
 * site-wide snippet (analytics, tag managers, trackers).
 *
 * Used by all three renderers of public HTML:
 *   - backend/views/landing.ejs and comparison.ejs (Railway render and the
 *     static export), via the `chrome` local;
 *   - knowledge-base/lib/template.js (the guide pages);
 *   - scripts/export-static.js (the 404 page).
 *
 * Pure strings, no dependencies, so the guide generator and the Cloudflare
 * Pages build can load it without the backend's node_modules.
 *
 * Current snippets (all pre-existing, consolidated here):
 *   head:    Microsoft Clarity (/assets/clarity.js)
 *   bodyEnd: page-view beacon (/assets/beacon.js -> <api>/api/pageview)
 *            content-engine lead tracker (lead.js, DM-link attribution)
 */

const LEAD_TRACKER = 'https://content-engine-production-230f.up.railway.app/api/v1/t/lead.js';

function esc(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

/** Tags for the end of <head>. */
function head() {
  return '<script src="/assets/clarity.js"></script>';
}

/**
 * Tags for the end of <body>.
 * apiOrigin: '' = same origin (Railway landing hosts), otherwise the app
 * origin the beacon reports to (e.g. https://app.vidapulse.io).
 */
function bodyEnd({ apiOrigin = '', assetVersion = '' } = {}) {
  const v = assetVersion ? `?v=${esc(assetVersion)}` : '';
  return [
    `<script src="/assets/beacon.js${v}" data-api="${esc(apiOrigin)}" defer></script>`,
    `<script src="${LEAD_TRACKER}" async></script>`,
  ].join('\n  ');
}

module.exports = { head, bodyEnd };
