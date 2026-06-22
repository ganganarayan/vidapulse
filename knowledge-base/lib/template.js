'use strict';

/**
 * Knowledge Base — HTML template + helpers.
 *
 * Pure functions, no dependencies. The generator (../generate.js) composes
 * pages from these. Design goal: plain, premium, single cream background,
 * warm brown ink, one orange accent, hairline dividers (the approved look).
 */

const site = require('../data/site');

// ── Small utilities ───────────────────────────────────────────────

function slugify(str) {
  return String(str)
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[''`]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// JSON-LD must never break out of its <script> — escape the angle brackets.
function jsonLd(obj) {
  return JSON.stringify(obj, null, 2).replace(/</g, '\\u003c');
}

// Absolute production URL for a site-relative path.
function absUrl(p) {
  if (/^https?:\/\//.test(p)) return p;
  return site.originUrl + (p.startsWith('/') ? p : '/' + p);
}

// ── Stylesheet (served at /kb-assets/kb.css) ──────────────────────

function buildCss() {
  const c = site.palette;
  return `:root{
  --bg:${c.bg};--ink:${c.ink};--body:${c.body};--lead:${c.lead};
  --muted:${c.muted};--accent:${c.accent};--accent-ink:${c.accentInk};--line:${c.line};
}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--bg);color:var(--body);
  font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;
  font-size:17px;line-height:1.75;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}
a{color:var(--accent-ink);text-decoration:none}
a:hover{text-decoration:underline}
.kb-wrap{max-width:720px;margin:0 auto;padding:0 24px}
header.kb-header{position:sticky;top:0;z-index:50;background:var(--bg);border-bottom:1px solid var(--line)}
.kb-header-in{max-width:720px;margin:0 auto;padding:16px 24px;display:flex;align-items:center;justify-content:space-between;gap:16px}
.kb-brand{font-size:18px;font-weight:600;color:var(--ink);letter-spacing:.2px}
.kb-brand:hover{text-decoration:none;color:var(--ink)}
.kb-brand span{color:var(--muted);font-weight:400;margin-left:8px;font-size:14px}
.kb-cta{display:inline-block;font-size:13px;font-weight:600;color:#fff;background:var(--accent);padding:9px 16px;border-radius:6px;white-space:nowrap}
.kb-cta:hover{text-decoration:none;opacity:.92;color:#fff}
main{padding:34px 0 8px}
.kb-crumb{font-size:13px;color:var(--muted);margin-bottom:22px}
.kb-crumb a{color:var(--muted)}
.kb-eyebrow{font-size:12px;font-weight:600;letter-spacing:1.6px;text-transform:uppercase;color:var(--accent-ink);margin:0 0 10px}
h1{font-size:32px;line-height:1.22;font-weight:600;color:var(--ink);margin:0 0 18px;letter-spacing:-.2px}
h2{font-size:21px;font-weight:600;color:var(--ink);margin:34px 0 14px}
h3{font-size:17px;font-weight:600;color:var(--ink);margin:24px 0 10px}
p{margin:0 0 18px}
.kb-lead{font-size:19px;line-height:1.7;color:var(--lead);margin:0 0 26px}
.kb-intro{font-size:18px;color:var(--lead)}
hr{border:0;border-top:1px solid var(--line);margin:30px 0}
ul.kb-list{list-style:none;padding:0;margin:0 0 18px}
ul.kb-list li{position:relative;padding-left:22px;margin-bottom:14px}
ul.kb-list li::before{content:"";position:absolute;left:0;top:12px;width:7px;height:7px;border-radius:50%;background:var(--accent)}
.kb-cat{border-top:1px solid var(--line);padding:20px 0}
.kb-section .kb-cat:last-of-type{border-bottom:1px solid var(--line)}
.kb-cat h2{margin:0 0 5px;font-size:20px}
.kb-cat h2 a{color:var(--ink)}
.kb-cat h2 a:hover{color:var(--accent-ink);text-decoration:none}
.kb-cat-blurb{margin:0 0 5px;color:var(--body);font-size:16px}
.kb-cat-meta{font-size:13px;color:var(--muted)}
.kb-group{font-size:13px;font-weight:600;letter-spacing:.4px;text-transform:uppercase;color:var(--muted);margin:30px 0 6px}
ul.kb-qlist{list-style:none;margin:0;padding:0}
ul.kb-qlist li{border-top:1px solid var(--line)}
ul.kb-qlist li:last-child{border-bottom:1px solid var(--line)}
.kb-q{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 2px;font-size:17px;color:var(--ink)}
a.kb-q:hover{color:var(--accent-ink);text-decoration:none}
a.kb-q .kb-arrow{color:var(--accent);font-weight:600}
.kb-q .kb-soon{font-size:11px;font-weight:600;letter-spacing:.5px;text-transform:uppercase;color:var(--muted)}
.kb-search{margin:24px 0 4px}
.kb-search input{width:100%;font-size:16px;padding:13px 15px;border:1px solid var(--line);border-radius:9px;background:#fffdf8;color:var(--ink);outline:none}
.kb-search input:focus{border-color:var(--accent)}
.kb-search input::placeholder{color:var(--muted)}
#kb-results a{display:block;padding:11px 2px;border-bottom:1px solid var(--line);color:var(--ink)}
#kb-results a:hover{color:var(--accent-ink);text-decoration:none}
#kb-results a small{color:var(--muted);margin-left:8px;font-size:12px}
#kb-results .kb-noresults{padding:12px 2px;color:var(--muted)}
.kb-ctablock{margin:30px 0}
.kb-ctaline{font-size:17px;color:var(--lead);margin:0 0 6px}
footer.kb-footer{border-top:1px solid var(--line);margin-top:44px}
.kb-footer-in{max-width:720px;margin:0 auto;padding:26px 24px 44px}
.kb-footer-links{display:flex;flex-wrap:wrap;gap:20px;margin-bottom:14px}
.kb-footer-links a{color:var(--body);font-size:14px}
.kb-footer-tag{font-size:13px;color:var(--muted)}
figure.kb-fig{margin:26px 0}
figure.kb-fig svg{width:100%;height:auto;display:block}
figure.kb-fig figcaption{font-size:13px;color:var(--muted);margin-top:10px;text-align:center}
.kb-example{border-left:2px solid var(--accent);padding:2px 0 2px 16px;margin:0 0 18px;color:var(--lead)}
.kb-related a{display:block;padding:13px 2px;border-top:1px solid var(--line);color:var(--ink)}
.kb-related a:last-child{border-bottom:1px solid var(--line)}
.kb-related a:hover{color:var(--accent-ink);text-decoration:none}
.kb-pager{position:fixed;left:0;right:0;bottom:16px;z-index:45;pointer-events:none}
.kb-pager-in{max-width:760px;margin:0 auto;padding:0 16px;display:flex;align-items:center;justify-content:space-between;gap:10px}
.kb-pager a{pointer-events:auto;display:inline-flex;align-items:center;gap:8px;max-width:47%;background:#fffdf8;border:1px solid var(--line);color:var(--ink);padding:9px 15px;border-radius:999px;font-size:13px;font-weight:600;box-shadow:0 3px 14px rgba(51,39,26,.10)}
.kb-pager a:hover{text-decoration:none;border-color:var(--accent)}
.kb-pager .kb-pdir{color:var(--accent-ink)}
.kb-pager .kb-pt{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
body.kb-article main{padding-bottom:86px}
body.kb-article footer.kb-footer .kb-footer-in{padding-bottom:96px}
@media (max-width:560px){
  h1{font-size:26px}.kb-lead{font-size:17px}.kb-intro{font-size:16px}body{font-size:16px}
  .kb-pager .kb-pt{display:none}.kb-pager a{padding:11px 15px}
}
`;
}

// ── <head> ────────────────────────────────────────────────────────

function renderHead({ title, description, canonicalPath, graph }) {
  const canonical = absUrl(canonicalPath);
  const ld = graph && graph.length
    ? `\n  <script type="application/ld+json">\n${jsonLd({ '@context': 'https://schema.org', '@graph': graph })}\n  </script>`
    : '';
  return `  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
  <link rel="canonical" href="${canonical}" />
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="${escapeHtml(site.brand)}" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:url" content="${canonical}" />
  <meta property="og:image" content="${escapeHtml(site.ogImage)}" />
  <meta property="og:locale" content="en_US" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${escapeHtml(site.ogImage)}" />
  <link rel="stylesheet" href="/kb-assets/kb.css" />${ld}`;
}

// ── Header / footer ───────────────────────────────────────────────

function renderHeader() {
  return `<header class="kb-header">
    <div class="kb-header-in">
      <a class="kb-brand" href="${site.hubPath}">${escapeHtml(site.brand)}<span>Guide</span></a>
      <a class="kb-cta" href="${escapeHtml(site.ctaUrl)}">Start free</a>
    </div>
  </header>`;
}

function renderFooter() {
  const links = site.footerLinks
    .map((l) => `<a href="${escapeHtml(l.href)}">${escapeHtml(l.label)}</a>`)
    .join('\n        ');
  return `<footer class="kb-footer">
    <div class="kb-footer-in">
      <div class="kb-footer-links">
        ${links}
      </div>
      <div class="kb-footer-tag">${escapeHtml(site.brand)} — ${escapeHtml(site.tagline)} · video analytics on any video, no re-hosting.</div>
    </div>
  </footer>`;
}

// Breadcrumb trail. items = [{name, path}] (last is current, no link).
function renderCrumb(items) {
  const parts = items.map((it, i) => {
    const last = i === items.length - 1;
    return last
      ? `<span>${escapeHtml(it.name)}</span>`
      : `<a href="${it.path}">${escapeHtml(it.name)}</a>`;
  });
  return `<nav class="kb-crumb" aria-label="Breadcrumb">${parts.join(' &nbsp;›&nbsp; ')}</nav>`;
}

function breadcrumbLd(items) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: absUrl(it.path),
    })),
  };
}

// Sticky, always-visible Back / Forward article pager.
// prev/next = {title, path} or null. Forward (next) goes to the next article.
function renderPager(prev, next) {
  const left = prev
    ? `<a class="kb-prev" href="${prev.path}" aria-label="Back: ${escapeHtml(prev.title)}"><span class="kb-pdir">‹ Back</span><span class="kb-pt">${escapeHtml(prev.title)}</span></a>`
    : '<span aria-hidden="true"></span>';
  const right = next
    ? `<a class="kb-next" href="${next.path}" aria-label="Forward: ${escapeHtml(next.title)}"><span class="kb-pt">${escapeHtml(next.title)}</span><span class="kb-pdir">Forward ›</span></a>`
    : '<span aria-hidden="true"></span>';
  return `<nav class="kb-pager" aria-label="Article navigation"><div class="kb-pager-in">${left}${right}</div></nav>`;
}

// ── Full document ─────────────────────────────────────────────────

function renderPage({ title, description, canonicalPath, graph, body, bodyScript, bodyClass, pager }) {
  const script = bodyScript ? `\n  ${bodyScript}` : '';
  const cls = bodyClass ? ` class="${bodyClass}"` : '';
  const pagerHtml = pager ? `\n  ${pager}` : '';
  return `<!DOCTYPE html>
<html lang="en">
<head>
${renderHead({ title, description, canonicalPath, graph })}
</head>
<body${cls}>
  ${renderHeader()}
  <main>
    <div class="kb-wrap">
${body}
    </div>
  </main>${pagerHtml}
  ${renderFooter()}${script}
</body>
</html>
`;
}

module.exports = {
  slugify,
  escapeHtml,
  absUrl,
  buildCss,
  renderPage,
  renderPager,
  renderCrumb,
  breadcrumbLd,
};
