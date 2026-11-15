'use strict';

/**
 * Static export of the public marketing site (vidapulse.io) for Cloudflare Pages.
 *
 * Cloudflare Pages runs this as the build command (project vidapulse-site):
 *   npm install --no-save --no-package-lock --no-audit --no-fund ejs@3.1.10 && node scripts/export-static.js
 * Output directory: dist-static/ (git-ignored). Production branch main,
 * preview branch orbitq. Do not run it in a dev session: Cloudflare builds it.
 *
 * Single source of truth: nothing here holds copy. It renders
 *   - backend/views/landing.ejs      -> /            (content: backend/src/content/landing.js)
 *   - backend/views/comparison.ejs   -> /<slug>      (content: backend/src/content/comparisons.js)
 *   - knowledge-base/generate.js     -> /video-analytics-guide/...
 * with prices from backend/src/services/pricing.js, the same files Railway
 * renders from. Every page carries the shared head / end-of-body snippets from
 * backend/src/content/siteChrome.js (the one place to add site-wide analytics).
 *
 * Also writes robots.txt, sitemap.xml (vidapulse.io URLs only), llms.txt,
 * 404.html, the Search Console verification file, and the Pages _headers /
 * _redirects files. The build FAILS (and Cloudflare keeps serving the last
 * good deploy) if a check at the bottom does not hold.
 *
 * Dependencies: ejs only (installed by the build command). pricing.js loads
 * geoip-lite lazily, so the backend's node_modules are not needed.
 */

const fs   = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT  = path.join(ROOT, 'dist-static');

const SITE = 'https://vidapulse.io';
const APP  = 'https://app.vidapulse.io';
const STAGING_APP = 'https://orbitq.vidapulse.io';

// Cloudflare Pages build environment.
const BRANCH  = process.env.CF_PAGES_BRANCH || '';
const IS_PROD = BRANCH === 'main';
// API calls (signup form, page-view beacon) go to production from main builds
// and to staging from preview builds, so testing a preview never writes
// leads into production. Visible links always point at the production app.
const API_ORIGIN = IS_PROD ? APP : STAGING_APP;
const ASSET_VERSION = (process.env.CF_PAGES_COMMIT_SHA || 'local').slice(0, 12);

// The guide generator and its template read these at require time.
process.env.VP_API_ORIGIN    = API_ORIGIN;
process.env.VP_ASSET_VERSION = ASSET_VERSION;

const ejs         = require('ejs');
const pricing     = require('../backend/src/services/pricing');
const landing     = require('../backend/src/content/landing');
const cmp         = require('../backend/src/content/comparisons');
const pol         = require('../backend/src/content/policies');
const chrome      = require('../backend/src/content/siteChrome');
const { LANDING_CSP } = require('../backend/src/config/landingCsp');
const kb          = require('../knowledge-base/generate');
const kbCategories = require('../knowledge-base/data/categories');

const VIEWS = path.join(ROOT, 'backend', 'views');

// ── helpers ───────────────────────────────────────────────────────

function write(rel, contents) {
  const full = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, contents);
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, e.name), d = path.join(dest, e.name);
    if (e.isDirectory()) copyDir(s, d); else fs.copyFileSync(s, d);
  }
}

function render(view, locals) {
  const file = path.join(VIEWS, view);
  return ejs.render(fs.readFileSync(file, 'utf8'), locals, { filename: file });
}

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Locals shared by landing.ejs and comparison.ejs (mirror of marketingLocals()
// in backend/src/index.js, set for a static page on vidapulse.io).
const ALL_PRICES = landing.allPrices();
const baseLocals = {
  prices      : pricing.table('USD'),          // default render; India switches to INR in the browser
  priceAttrs  : (key) => landing.priceAttrs(ALL_PRICES, key),
  gstLabel    : pricing.GST_LABEL,
  currencyAuto: true,
  apiOrigin   : API_ORIGIN,
  kbBase      : '',                            // the guide lives on this host
  chrome,
  assetVersion: ASSET_VERSION,
};

// ── build ─────────────────────────────────────────────────────────

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

// 1. Guide (hub, categories, articles, kb-assets, search index).
const kbStats = kb.run({ outDir: OUT, clean: false, sitemap: false });

// 2. Static assets.
copyDir(path.join(ROOT, 'landing', 'assets'), path.join(OUT, 'assets'));
fs.copyFileSync(path.join(ROOT, 'frontend', 'public', 'favicon.svg'), path.join(OUT, 'favicon.svg'));

// 3. Home page.
write('index.html', render('landing.ejs', {
  ...baseLocals,
  seo        : landing.SEO,
  definition : landing.DEFINITION,
  faq        : landing.FAQ,
  jsonLd     : landing.jsonLd(),
  comparisons: cmp.COMPARISONS,
}));

// 4. Comparison pages: /<slug> served from <slug>.html (Pages pretty URLs).
for (const c of cmp.COMPARISONS) {
  write(`${c.slug}.html`, render('comparison.ejs', {
    ...baseLocals,
    c,
    others: cmp.COMPARISONS.filter((o) => o.slug !== c.slug),
    jsonLd: cmp.jsonLdFor(c),
  }));
}

// 4b. Legal pages: /privacy-policy, /terms-of-use, /refund-policy, /shipping-policy.
for (const p of pol.POLICIES) {
  write(`${p.slug}.html`, render('policy.ejs', {
    ...baseLocals,
    p,
    others: pol.POLICIES.filter((o) => o.slug !== p.slug),
    jsonLd: pol.jsonLdFor(p),
  }));
}

// 5. 404 page (Pages serves it with status 404 for any unknown path).
write('404.html', `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Page not found | VidaPulse</title>
  <meta name="robots" content="noindex" />
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <link rel="stylesheet" href="/assets/compare.css?v=${esc(ASSET_VERSION)}" />
  ${chrome.head()}
</head>
<body>
  <header>
  <nav class="nav" aria-label="Main navigation">
    <div class="container nav-inner">
      <a href="/" class="nav-logo">VidaPulse</a>
      <a href="${APP}/login" class="btn btn-primary">Start free</a>
    </div>
  </nav>
  </header>
  <main class="container cmp">
    <span class="label">404</span>
    <h1>We could not find that page</h1>
    <p class="lede">The link may be old or mistyped. These are good places to continue:</p>
    <ul class="ticks">
      <li><a href="/">VidaPulse home</a></li>
      <li><a href="/#pricing">Pricing</a></li>
      <li><a href="/video-analytics-guide">Video analytics guide</a></li>
      <li><a href="${APP}/login">Log in to the app</a></li>
    </ul>
  </main>
  ${chrome.bodyEnd({ apiOrigin: API_ORIGIN, assetVersion: ASSET_VERSION })}
</body>
</html>
`);

// 6. robots.txt: the curated file (all crawlers allowed, AI bots listed).
const robots = fs.readFileSync(path.join(ROOT, 'landing', 'robots.txt'), 'utf8');
write('robots.txt', robots);

// 7. sitemap.xml: vidapulse.io only. Home, comparisons, policies, guide.
const sitemapUrls = [
  { loc: `${SITE}/`, mod: '2026-11-15', freq: 'weekly', pri: '1.0' },
  ...cmp.COMPARISONS.map((c) => ({ loc: `${SITE}/${c.slug}`, mod: c.updatedOn, freq: 'monthly', pri: '0.7' })),
  ...pol.POLICIES.map((p) => ({ loc: `${SITE}/${p.slug}`, mod: p.updatedOn, freq: 'yearly', pri: '0.3' })),
  ...kb.kbSitemapUrls(),
];
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrls.map((u) => `  <url>
    <loc>${esc(u.loc)}</loc>
    <lastmod>${u.mod}</lastmod>
    <changefreq>${u.freq}</changefreq>
    <priority>${u.pri}</priority>
  </url>`).join('\n')}
</urlset>
`);

// 8. llms.txt: the curated file plus the guide sections (from the guide data).
const llms = fs.readFileSync(path.join(ROOT, 'landing', 'llms.txt'), 'utf8').replace(/\s*$/, '\n');
write('llms.txt', llms + `
## Video analytics guide

Plain answers about VSL optimization, retention and video analytics: ${SITE}/video-analytics-guide

${kbCategories.map((c) => `- ${c.title}: ${SITE}/video-analytics-guide/${c.slug}`).join('\n')}
`);

// 9. Google Search Console HTML-file verification (Railway serves the same).
write('googleafbc734ffaa1db2d.html', 'google-site-verification: googleafbc734ffaa1db2d.html');

// 10. Pages headers. Preview builds are never indexed.
write('_headers', `/*
  Content-Security-Policy: ${LANDING_CSP}
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  X-Frame-Options: SAMEORIGIN
${IS_PROD ? '' : '  X-Robots-Tag: noindex\n'}
/assets/*
  Cache-Control: public, max-age=3600

/kb-assets/*
  Cache-Control: public, max-age=3600
`);

// 11. Pages redirects. Old guide aliases, plus app-only paths that used to
// answer on the apex too (Railway mounts /api, /embed and /cta.js on every
// host): send them to the app so nothing that was ever pasted breaks.
write('_redirects', `/questions          /video-analytics-guide          301
/learn              /video-analytics-guide          301
/login              ${APP}/login                    302
/register           ${APP}/register                 302
/embed/*            ${API_ORIGIN}/embed/:splat      301
/cta.js             ${API_ORIGIN}/cta.js            301
/tracker.js         ${API_ORIGIN}/tracker.js        301
/vidapulse-tour.js  ${API_ORIGIN}/vidapulse-tour.js 301
/api/*              ${API_ORIGIN}/api/:splat        308
`);

// ── checks: fail the build rather than ship a broken site ─────────

const problems = [];
const home = fs.readFileSync(path.join(OUT, 'index.html'), 'utf8');

if (landing.SEO.title.length >= 60) problems.push(`home title is ${landing.SEO.title.length} chars (need < 60)`);
if (landing.SEO.description.length >= 155) problems.push(`home description is ${landing.SEO.description.length} chars (need < 155)`);
if (!home.includes(esc(landing.DEFINITION))) problems.push('home is missing the hero definition sentence');
if (/founding/i.test(home)) problems.push('home still mentions the founding offer');
for (const p of pol.POLICIES) {
  if (!home.includes(`href="/${p.slug}"`)) problems.push(`home footer does not link /${p.slug}`);
  const html = fs.readFileSync(path.join(OUT, `${p.slug}.html`), 'utf8');
  if (html.includes('\u2014')) problems.push(`${p.slug} contains an em dash`);
  if (!/Last updated \d{2}-\d{2}-\d{4}</.test(html)) problems.push(`${p.slug} has no DD-MM-YYYY last-updated date`);
}
if (home.includes('\u2014')) problems.push('home contains an em dash');
for (const key of ['starter', 'pro', 'scale']) {
  const amt = ALL_PRICES.USD.plans[key].monthly.label.slice(1);
  if (!home.includes(`<span class="amt">${amt}</span>`)) problems.push(`home is missing the ${key} price ${amt}`);
}
for (const bot of ['GPTBot', 'ClaudeBot', 'Google-Extended', 'PerplexityBot', 'OAI-SearchBot']) {
  if (!new RegExp(`^User-agent: ${bot}\\s*$`, 'm').test(robots)) problems.push(`robots.txt does not name ${bot}`);
}
if (!robots.includes(`Sitemap: ${SITE}/sitemap.xml`)) problems.push('robots.txt has no vidapulse.io Sitemap line');
if (sitemapUrls.some((u) => !u.loc.startsWith(`${SITE}/`))) problems.push('sitemap has a URL outside vidapulse.io');

// Every HTML page: canonical on vidapulse.io, every JSON-LD block parses.
let pages = 0;
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) { walk(full); continue; }
    if (!e.name.endsWith('.html') || e.name === '404.html' || e.name.startsWith('google')) continue;
    pages++;
    const rel = path.relative(OUT, full).split(path.sep).join('/');
    const html = fs.readFileSync(full, 'utf8');
    const canon = /<link rel="canonical" href="([^"]+)"/.exec(html);
    if (!canon || !canon[1].startsWith(`${SITE}/`)) problems.push(`${rel}: canonical ${canon ? canon[1] : 'missing'}`);
    const re = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;
    let m;
    while ((m = re.exec(html))) {
      try { JSON.parse(m[1]); } catch (err) { problems.push(`${rel}: JSON-LD does not parse (${err.message})`); }
    }
    if (!html.includes('/assets/beacon.js')) problems.push(`${rel}: missing the shared chrome`);
  }
})(OUT);

console.log(`[export] branch=${BRANCH || '(none)'} prod=${IS_PROD} api=${API_ORIGIN} version=${ASSET_VERSION}`);
console.log(`[export] pages: ${pages} (home 1, comparisons ${cmp.COMPARISONS.length}, policies ${pol.POLICIES.length}, guide ${1 + kbStats.categories + kbStats.articles}), sitemap URLs: ${sitemapUrls.length}`);

if (problems.length) {
  console.error('[export] FAILED checks:\n  - ' + problems.join('\n  - '));
  process.exit(1);
}
console.log('[export] all checks passed -> dist-static/');
