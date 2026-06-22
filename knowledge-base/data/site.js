'use strict';

/**
 * Knowledge Base — global site configuration.
 *
 * Single source of truth for branding, canonical domain, the hub path,
 * and the colour palette used by the generated CSS. Everything that the
 * generator (../generate.js) needs that is NOT category- or question-
 * specific lives here.
 *
 * IMPORTANT: `originUrl` is ALWAYS the production origin, even when the
 * generated HTML is served on staging (orbitq). Canonical / OG / sitemap
 * URLs must always point at production so that, if staging is ever
 * crawled, search engines consolidate on the real pages.
 */

const ORIGIN = 'https://app.vidapulse.io';

module.exports = {
  brand: 'VidaPulse',
  tagline: 'Video analytics for VSLs and product videos',

  // Canonical production origin (never the staging origin).
  originUrl: ORIGIN,

  // The Knowledge Base hub. Everything lives under this path.
  hubPath: '/video-analytics-guide',

  // Bare paths that 301-redirect to the hub (handled in backend/src/index.js).
  hubAliases: ['/questions', '/learn'],

  // Where the "Start free" call-to-action sends a reader.
  ctaUrl: `${ORIGIN}/register`,
  loginUrl: `${ORIGIN}/login`,

  // Default social-share image (re-uses the landing OG image).
  ogImage: 'https://vidapulse.io/og-image.png',

  // Colour palette — mirrors the approved cream/brown reference design.
  // Consumed by lib/template.js → buildCss(). One background colour, warm
  // brown ink, a single orange accent, hairline dividers. Plain & premium.
  palette: {
    bg:     '#FAF4EA', // page background (single colour)
    ink:    '#33271A', // headings / strong text
    body:   '#7A6A59', // body copy
    lead:   '#574A3C', // lead / direct-answer paragraph
    muted:  '#A8927A', // breadcrumbs, captions, footnotes
    accent: '#E0822E', // links, CTA, bullet markers, eyebrow
    accentInk: '#B5651B', // accent text on the cream bg (darker, for contrast)
    line:   '#ECE3D2', // hairline dividers / borders
  },

  // Footer link columns (kept minimal, premium).
  footerLinks: [
    { label: 'VidaPulse home', href: 'https://vidapulse.io/' },
    { label: 'Pricing',        href: 'https://vidapulse.io/#pricing' },
    { label: 'Start free',     href: `${ORIGIN}/register` },
    { label: 'Log in',         href: `${ORIGIN}/login` },
  ],
};
