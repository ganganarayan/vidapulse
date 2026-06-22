'use strict';

/**
 * Knowledge Base — static site generator.
 *
 * Run:  node knowledge-base/generate.js
 *
 * Reads data/{site,categories,questions}.js, writes fully static,
 * AI-crawlable HTML into knowledge-base/public/. That directory is
 * committed and served by Express on the app domain (see backend/src/index.js).
 *
 * Phase 1 emits: the hub, the 7 category pages, kb.css, sitemap.xml and a
 * client-side search index. Articles (status:'published') are emitted in
 * Phase 2 — until then questions render as the content roadmap.
 */

const fs   = require('fs');
const path = require('path');

const site       = require('./data/site');
const categories = require('./data/categories');
const questions  = require('./data/questions');
const T          = require('./lib/template');

const PUBLIC = path.join(__dirname, 'public');
const HUB    = site.hubPath; // /video-analytics-guide

// ── Resolve every question to a slug / path / status, grouped by category ──

const catBySlug = new Map(categories.map((c) => [c.slug, c]));

const resolved = questions.map((q) => {
  const cat = catBySlug.get(q.cat);
  if (!cat) throw new Error(`Question "${q.q}" references unknown category "${q.cat}"`);
  const slug = q.slug || T.slugify(q.q);
  return {
    ...q,
    slug,
    catTitle: cat.title,
    status: q.status || 'planned',
    path: `${HUB}/${cat.slug}/${slug}`,
  };
});

// Guard: no duplicate URLs.
const seen = new Set();
for (const r of resolved) {
  if (seen.has(r.path)) throw new Error(`Duplicate URL: ${r.path}`);
  seen.add(r.path);
}

const byCat = new Map(categories.map((c) => [c.slug, []]));
resolved.forEach((r) => byCat.get(r.cat).push(r));

// ── Helpers ───────────────────────────────────────────────────────

function write(relPath, contents) {
  const full = path.join(PUBLIC, relPath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, contents);
}

// Render one category's question roadmap (grouped if `group` is set).
function renderQuestionList(items) {
  const groups = [];
  const index = new Map();
  for (const it of items) {
    const key = it.group || '';
    if (!index.has(key)) { index.set(key, []); groups.push(key); }
    index.get(key).push(it);
  }
  return groups.map((g) => {
    const rows = index.get(g).map((it) => {
      if (it.status === 'published') {
        return `        <li><a class="kb-q" href="${it.path}">${T.escapeHtml(it.q)}<span class="kb-arrow">›</span></a></li>`;
      }
      return `        <li><span class="kb-q">${T.escapeHtml(it.q)}<span class="kb-soon">Coming soon</span></span></li>`;
    }).join('\n');
    const heading = g ? `      <div class="kb-group">${T.escapeHtml(g)}</div>\n` : '';
    return `${heading}      <ul class="kb-qlist">\n${rows}\n      </ul>`;
  }).join('\n');
}

function ctaBlock() {
  return `      <div class="kb-ctablock">
        <hr />
        <p class="kb-ctaline">See exactly where your own video loses viewers — create a free VidaPulse account and analyze your first video in minutes.</p>
        <p><a class="kb-cta" href="${T.escapeHtml(site.ctaUrl)}">Start free →</a></p>
      </div>`;
}

// ── Hub page ──────────────────────────────────────────────────────

function buildHub() {
  const crumb = [{ name: 'Video analytics guide', path: HUB }];
  const cats = categories.map((c) => {
    const count = byCat.get(c.slug).length;
    return `      <div class="kb-cat">
        <h2><a href="${HUB}/${c.slug}">${T.escapeHtml(c.title)}</a></h2>
        <p class="kb-cat-blurb">${T.escapeHtml(c.blurb)}</p>
        <p class="kb-cat-meta">${count} ${count === 1 ? 'topic' : 'topics'} · explore ${T.escapeHtml(c.title.toLowerCase())} →</p>
      </div>`;
  }).join('\n');

  const body = `${T.renderCrumb(crumb)}
      <p class="kb-eyebrow">Knowledge base</p>
      <h1>The video analytics &amp; VSL optimization guide</h1>
      <p class="kb-lead">Plain answers to the questions marketers ask about video: where viewers drop off, why traffic doesn't convert, and how to measure retention on any video — without re-hosting it.</p>

      <div class="kb-search">
        <input id="kb-search-input" type="search" placeholder="Search the guide — e.g. drop-off, retention, Wistia…" aria-label="Search the knowledge base" autocomplete="off" />
        <div id="kb-results" role="region" aria-live="polite"></div>
      </div>

      <div class="kb-section">
${cats}
      </div>

${ctaBlock()}`;

  const graph = [
    {
      '@type': 'WebSite',
      '@id': `${site.originUrl}${HUB}#website`,
      name: `${site.brand} — Video analytics guide`,
      url: T.absUrl(HUB),
      publisher: { '@type': 'Organization', name: site.brand, url: 'https://vidapulse.io/' },
    },
    {
      '@type': 'CollectionPage',
      name: 'The video analytics & VSL optimization guide',
      url: T.absUrl(HUB),
      description: 'Plain answers to the questions marketers ask about video analytics, VSL optimization and viewer retention.',
    },
    T.breadcrumbLd(crumb),
    {
      '@type': 'ItemList',
      itemListElement: categories.map((c, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: c.title,
        url: T.absUrl(`${HUB}/${c.slug}`),
      })),
    },
  ];

  const bodyScript = `<script src="/kb-assets/search.js" defer></script>`;

  write('video-analytics-guide.html', T.renderPage({
    title: 'Video Analytics & VSL Optimization Guide — Retention, Drop-off & Heatmaps | VidaPulse',
    description: 'The VidaPulse knowledge base: find where viewers leave your VSL, understand audience retention and heatmaps, compare video analytics tools, and turn views into sales.',
    canonicalPath: HUB,
    graph,
    body,
    bodyScript,
  }));
}

// ── Category pages ────────────────────────────────────────────────

function buildCategory(cat) {
  const items = byCat.get(cat.slug);
  const crumb = [
    { name: 'Guide', path: HUB },
    { name: cat.title, path: `${HUB}/${cat.slug}` },
  ];

  const body = `${T.renderCrumb(crumb)}
      <p class="kb-eyebrow">${T.escapeHtml(cat.eyebrow)}</p>
      <h1>${T.escapeHtml(cat.title)}</h1>
      <p class="kb-intro">${T.escapeHtml(cat.intro)}</p>

${renderQuestionList(items)}

${ctaBlock()}`;

  const graph = [
    {
      '@type': 'CollectionPage',
      name: cat.title,
      url: T.absUrl(`${HUB}/${cat.slug}`),
      description: cat.metaDescription,
    },
    T.breadcrumbLd(crumb),
    {
      '@type': 'ItemList',
      itemListElement: items.map((it, i) => {
        const el = { '@type': 'ListItem', position: i + 1, name: it.q };
        if (it.status === 'published') el.url = T.absUrl(it.path);
        return el;
      }),
    },
  ];

  write(`video-analytics-guide/${cat.slug}.html`, T.renderPage({
    title: cat.metaTitle,
    description: cat.metaDescription,
    canonicalPath: `${HUB}/${cat.slug}`,
    graph,
    body,
  }));
}

// ── Search index + client script ──────────────────────────────────

function buildSearch() {
  const entries = [];
  categories.forEach((c) => {
    entries.push({ t: c.title, u: `${HUB}/${c.slug}`, c: 'Category', type: 'category' });
  });
  resolved.forEach((r) => {
    entries.push({
      t: r.q,
      // Planned items route to their category page until the article exists.
      u: r.status === 'published' ? r.path : `${HUB}/${r.cat}`,
      c: r.catTitle,
      type: r.status,
    });
  });
  write('kb-assets/search-index.json', JSON.stringify(entries));

  const js = `(function(){
  var input=document.getElementById('kb-search-input');
  var out=document.getElementById('kb-results');
  if(!input||!out)return;
  var data=[];
  fetch('/kb-assets/search-index.json').then(function(r){return r.json();}).then(function(d){data=d;});
  function render(q){
    out.innerHTML='';
    var s=q.trim().toLowerCase();
    if(!s)return;
    var hits=data.filter(function(e){return e.t.toLowerCase().indexOf(s)>-1||e.c.toLowerCase().indexOf(s)>-1;}).slice(0,12);
    if(!hits.length){out.innerHTML='<div class="kb-noresults">No matches yet — try "retention", "drop-off" or "Wistia".</div>';return;}
    hits.forEach(function(e){
      var a=document.createElement('a');
      a.href=e.u;
      a.innerHTML=e.t.replace(/[&<>]/g,function(ch){return ch==='&'?'&amp;':ch==='<'?'&lt;':'&gt;';})+' <small>'+e.c+'</small>';
      out.appendChild(a);
    });
  }
  input.addEventListener('input',function(){render(input.value);});
})();`;
  write('kb-assets/search.js', js);
}

// ── sitemap.xml (live pages only) ─────────────────────────────────

function buildSitemap() {
  const lastmod = new Date().toISOString().slice(0, 10);
  const urls = [{ loc: HUB, pri: '1.0', freq: 'weekly' }];
  categories.forEach((c) => urls.push({ loc: `${HUB}/${c.slug}`, pri: '0.8', freq: 'weekly' }));
  resolved.filter((r) => r.status === 'published')
    .forEach((r) => urls.push({ loc: r.path, pri: '0.7', freq: 'monthly' }));

  const body = urls.map((u) => `  <url>
    <loc>${T.absUrl(u.loc)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${u.freq}</changefreq>
    <priority>${u.pri}</priority>
  </url>`).join('\n');

  write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`);
}

// ── Run ───────────────────────────────────────────────────────────

function run() {
  fs.rmSync(PUBLIC, { recursive: true, force: true });
  fs.mkdirSync(PUBLIC, { recursive: true });

  write('kb-assets/kb.css', T.buildCss());
  buildHub();
  categories.forEach(buildCategory);
  buildSearch();
  buildSitemap();

  const published = resolved.filter((r) => r.status === 'published').length;
  console.log(`[kb] generated: hub + ${categories.length} categories + ${published} articles`);
  console.log(`[kb] roadmap: ${resolved.length} questions mapped (${resolved.length - published} planned)`);
  console.log(`[kb] output: knowledge-base/public/`);
}

run();
