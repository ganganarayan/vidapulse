'use strict';

/**
 * Content-Security-Policy for the public marketing pages (home, comparisons,
 * guide). One definition, used in two places:
 *   - backend/src/index.js sets it on the Railway landing hosts;
 *   - scripts/export-static.js writes it into the Cloudflare Pages _headers.
 *
 * 'unsafe-inline' covers the guide's inline page-view beacon; clarity.ms is the
 * Microsoft Clarity tag; content-engine is the DM-link lead tracker (lead.js).
 * connect-src / img-src https: cover the app API (signup form, beacon) and
 * Clarity's own beacons. A marketing page reflects no user input, so the
 * inline allowance is low risk.
 */
const LANDING_CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://www.clarity.ms https://*.clarity.ms https://content-engine-production-230f.up.railway.app",
  "style-src 'self' 'unsafe-inline' https:",
  "img-src 'self' data: https:",
  "font-src 'self' https: data:",
  "connect-src 'self' https:",
  "form-action 'self'",
  "base-uri 'self'",
  "frame-ancestors 'self'",
  "object-src 'none'",
  'upgrade-insecure-requests',
].join(';');

module.exports = { LANDING_CSP };
