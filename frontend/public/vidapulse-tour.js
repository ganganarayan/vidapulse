/* ============================================================================
   VidaPulse — Quick Tour  (per-page, first-visit guided tour)
   ----------------------------------------------------------------------------
   PASTE THIS ENTIRE BLOCK (including the <script> tags) into the app's custom
   HEADER code box. It is fully self-contained: no libraries, no build, no CSS
   file. Styles + logic live here.

   What it does
   • The FIRST time a user lands on a page (Overview, Videos, a video, etc.) it
     runs a short coach-mark tour for that page — once ever, per browser.
   • A floating "?" Quick Tour button (top-right, under "Add video") replays the
     current page's tour any time.
   • Targets are matched by the app's REAL visible text / title / aria-label
     (robust to auto-generated class names), with a CSS fallback.

   Console API (for testing):
     VPTour.start()            run the current page's tour now
     VPTour.startPage('videos')run a specific page's tour
     VPTour.end()              close any open tour
     VPTour.reset()            clear ALL "seen" flags → replay first-login flow
     VPTour.reset('videos')    clear one page's flag
   ============================================================================ */
(function () {
  'use strict';

  // Guard against double-injection (header code can run more than once).
  if (window.__VP_TOUR__) return;
  window.__VP_TOUR__ = true;

  // ---- config --------------------------------------------------------------
  var SEEN_PREFIX = 'vp_tour_seen_v1:';      // per-page first-visit flag
  var POLL_MS     = 250;                     // poll interval for async UI
  var WAIT_MS     = 9000;                    // ~9s wait for render after a click
  var REDUCED     = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  var Z           = 2147483000;              // sit above the app

  // ==========================================================================
  // THEME — auto-detect accent + light/dark from the live app, amber fallback.
  // ==========================================================================
  function lum(rgb) {
    if (!rgb) return 0;
    var m = rgb.match(/\d+(\.\d+)?/g); if (!m) return 0;
    var r = +m[0] / 255, g = +m[1] / 255, b = +m[2] / 255;
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }
  function isColorful(rgb) {
    if (!rgb) return false;
    var m = rgb.match(/\d+(\.\d+)?/g); if (!m || (m[3] !== undefined && +m[3] === 0)) return false;
    var r = +m[0], g = +m[1], b = +m[2];
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    return (max - min) > 40 && max > 70;            // saturated, not grey/near-black
  }
  function detectTheme() {
    var accent = '#f59e0b';                          // VidaPulse amber (fallback)
    try {
      // The "Add video" button is amber — borrow its colour if we can find it.
      var btn = findByText('Add video', true) ||
                document.querySelector('button, a[role="button"]');
      var bg = btn && getComputedStyle(btn).backgroundColor;
      if (isColorful(bg)) accent = bg;
    } catch (e) {}
    var pageBg = getComputedStyle(document.body).backgroundColor;
    var dark = lum(pageBg) < 0.5;                     // VidaPulse is dark
    return dark
      ? { accent: accent, bg: '#0b1220', panel: '#111a2b', fg: '#f3f4f6', muted: '#9aa4b2', line: 'rgba(255,255,255,.10)', dark: true }
      : { accent: accent, bg: '#ffffff', panel: '#ffffff', fg: '#0f172a', muted: '#64748b', line: 'rgba(0,0,0,.10)',     dark: false };
  }

  // ==========================================================================
  // ELEMENT MATCHING — by visible text / title / aria-label, with CSS fallback.
  // ==========================================================================
  function norm(s) { return (s || '').replace(/\s+/g, ' ').trim().toLowerCase(); }
  function visible(el) {
    if (!el || !el.getBoundingClientRect) return false;
    var r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return false;
    var s = getComputedStyle(el);
    return s.visibility !== 'hidden' && s.display !== 'none' && parseFloat(s.opacity || '1') > 0.05;
  }
  function findByAttr(attr, val) {
    var want = norm(val);
    var nodes = document.querySelectorAll('[' + attr + ']');
    for (var i = 0; i < nodes.length; i++) {
      var v = norm(nodes[i].getAttribute(attr));
      if (v && (v === want || v.indexOf(want) > -1) && visible(nodes[i])) return nodes[i];
    }
    return null;
  }
  // Find the smallest visible clickable element whose text matches.
  function findByText(text, clickableOnly) {
    var want = norm(text);
    var sels = ['button', 'a', '[role="button"]', '[role="menuitem"]', 'summary'];
    if (!clickableOnly) sels = sels.concat(['li', 'span', 'p', 'h1', 'h2', 'h3', 'div']);
    var nodes = document.querySelectorAll(sels.join(','));
    var best = null, bestArea = Infinity;
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      if (!visible(el)) continue;
      var t = norm(el.textContent);
      if (!t) continue;
      var hit = (t === want) || (t.indexOf(want) > -1 && t.length <= want.length + 24);
      if (!hit) continue;
      var r = el.getBoundingClientRect(), area = r.width * r.height;
      if (area < bestArea) { best = el; bestArea = area; }   // prefer most specific
    }
    return best;
  }
  // Climb to the row/card that contains a matched action button.
  function rowOf(el) {
    var node = el;
    for (var i = 0; i < 8 && node && node.parentElement; i++) {
      node = node.parentElement;
      var r = node.getBoundingClientRect();
      if (r.width > window.innerWidth * 0.45 && r.height > 44 && r.height < 280) return node;
    }
    return el;
  }
  // matcher: { title } | { aria } | { text } | { css } | { row:'<title>' }
  function findTarget(m) {
    if (!m) return null;
    if (m.title) { var a = findByAttr('title', m.title); if (a) return a; }
    if (m.aria)  { var b = findByAttr('aria-label', m.aria); if (b) return b; }
    if (m.row)   { var c = findByAttr('title', m.row); if (c) return rowOf(c); }
    if (m.text)  { var d = findByText(m.text, true) || findByText(m.text, false); if (d) return d; }
    if (m.css)   { var e = document.querySelector(m.css); if (e && visible(e)) return e; }
    return null;
  }

  // ==========================================================================
  // PER-PAGE TOUR REGISTRY  (real labels pulled from the VidaPulse app)
  // ==========================================================================
  function pageKey() {
    var p = location.pathname.replace(/\/+$/, '') || '/';
    if (/\/dashboard\/videos\/[^/]+/.test(p)) return 'video';
    if (p === '' || p === '/' || p === '/dashboard') return 'overview';
    if (p.indexOf('/videos') === 0)        return 'videos';
    if (p.indexOf('/cta-tracking') === 0)  return 'cta';
    if (p.indexOf('/tracking-logs') === 0) return 'tracking';
    if (p.indexOf('/audience') === 0)      return 'audience';
    if (p.indexOf('/events') === 0)        return 'events';
    if (p.indexOf('/funnels') === 0)       return 'funnels';
    if (p.indexOf('/reports') === 0)       return 'reports';
    if (p.indexOf('/account') === 0)       return 'settings';
    if (p.indexOf('/billing') === 0)       return 'billing';
    if (p.indexOf('/integrations') === 0)  return 'integrations';
    if (p.indexOf('/alerts') === 0)        return 'alerts';
    if (p.indexOf('/help') === 0)          return 'help';
    return null;
  }

  // step: { target, title, body, click, nav, waitFor }
  //   target   matcher to spotlight (omit/null = centered welcome card)
  //   click    true = advance when the user acts (not via Next)
  //   nav       true = the click navigates away (hand off to the next page's tour)
  //   waitFor  matcher to poll for after a same-page click before advancing
  var TOURS = {
    overview: [
      { title: 'Welcome to VidaPulse 👋', body: 'A 30-second tour. Use Next, or Skip anytime.' },
      { target: { title: 'Switch to' }, title: 'Light or dark', body: 'Tap the sun / moon to switch themes.' },
      { target: { text: 'Add video' }, title: 'Add a video', body: 'Add your first video to start tracking.' }
    ],
    videos: [
      { target: { text: 'Add video' }, title: 'Add your first video', body: 'Click to paste a video URL.',
        click: true, waitFor: { title: 'Edit video name' } },
      { target: { title: 'Edit video name' }, title: 'Rename it', body: 'The pencil renames your video.' },
      { target: { title: 'Copy embed code' }, title: 'Grab the embed', body: 'This holds the player code for any page.' },
      { target: { row: 'Edit video name' }, title: 'Open the video', body: 'Click a video to see its analytics.',
        click: true, nav: true }
    ],
    video: [
      { target: { text: 'Share & Embed' }, title: 'Share & Embed', body: 'Open this for the link and embed code.',
        click: true, waitFor: { text: 'Copy embed code' } },
      { target: { text: 'Copy embed code' }, title: 'Copy your embed', body: 'Paste it on any page to track views.' },
      { target: { text: 'Player Settings' }, title: 'Player Settings', body: 'Customise the player look and behaviour here. Done!' }
    ],
    cta:          [ { title: 'CTA Tracking', body: 'Create named links for your buttons — every click is logged here.' } ],
    tracking:     [ { title: 'Tracking Logs', body: 'Every Meta Pixel fire and webhook fire from your videos. Click a row for details.' } ],
    audience:     [ { title: 'Audience', body: 'See who watches — geography, devices and traffic sources.' } ],
    events:       [ { title: 'Events', body: 'A live log of every play, pause and completion across your videos.' } ],
    funnels:      [ { title: 'Funnels', body: 'See where viewers drop off, step by step.' } ],
    reports:      [ { title: 'Reports', body: 'Performance summaries for your videos.' } ],
    alerts:       [ { title: 'Alerts', body: 'Get notified when key events happen — set them up here.' } ],
    settings:     [ { title: 'Settings', body: 'Manage your account, profile and preferences here.' } ],
    billing:      [ { title: 'Billing', body: 'Your plan, invoices and payment history live here.' } ],
    integrations: [ { title: 'Integrations', body: 'Connect VidaPulse to your other tools.' } ],
    help:         [ { title: 'Help & Support', body: 'Guides and answers — replay any tour from the "?" button.' } ]
  };

  // ==========================================================================
  // OVERLAY + SPOTLIGHT + BUBBLE
  // ==========================================================================
  var TH = null, root = null, bubble = null, state = null;

  function injectStyle() {
    if (document.getElementById('vp-tour-style')) return;
    var st = document.createElement('style');
    st.id = 'vp-tour-style';
    st.textContent =
      '#vp-tour-root{position:fixed;inset:0;z-index:' + Z + ';pointer-events:none;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}' +
      '.vp-mask{position:fixed;background:rgba(2,6,23,.5);pointer-events:auto}' +
      '.vp-block{position:fixed;background:transparent;pointer-events:auto;cursor:pointer}' +
      '.vp-ring{position:fixed;border-radius:12px;pointer-events:none;box-shadow:0 0 0 3px var(--vp-accent),0 0 0 9px rgba(245,158,11,.25);transition:all .25s ease}' +
      (REDUCED ? '' : '.vp-ring.vp-pulse{animation:vpPulse 1.6s ease-out infinite}@keyframes vpPulse{0%{box-shadow:0 0 0 3px var(--vp-accent),0 0 0 6px rgba(245,158,11,.35)}70%{box-shadow:0 0 0 3px var(--vp-accent),0 0 0 16px rgba(245,158,11,0)}100%{box-shadow:0 0 0 3px var(--vp-accent),0 0 0 16px rgba(245,158,11,0)}}') +
      '.vp-bubble{position:fixed;z-index:' + (Z + 2) + ';pointer-events:auto;width:320px;max-width:calc(100vw - 24px);background:var(--vp-panel);color:var(--vp-fg);border:1px solid var(--vp-line);border-radius:14px;box-shadow:0 18px 50px rgba(0,0,0,.45);padding:16px 16px 14px;box-sizing:border-box;' + (REDUCED ? '' : 'animation:vpIn .18s ease') + '}' +
      (REDUCED ? '' : '@keyframes vpIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}') +
      '.vp-eyebrow{font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--vp-accent)}' +
      '.vp-title{font-size:16px;font-weight:700;margin:6px 0 4px;line-height:1.3}' +
      '.vp-body{font-size:13.5px;line-height:1.5;color:var(--vp-muted)}' +
      '.vp-x{position:absolute;top:10px;right:10px;width:24px;height:24px;border:0;background:transparent;color:var(--vp-muted);font-size:16px;cursor:pointer;border-radius:6px;line-height:1}' +
      '.vp-x:hover{background:var(--vp-line);color:var(--vp-fg)}' +
      '.vp-dots{display:flex;gap:6px;margin:12px 0 10px}' +
      '.vp-dot{width:7px;height:7px;border-radius:50%;background:var(--vp-line)}' +
      '.vp-dot.on{background:var(--vp-accent)}' +
      '.vp-row{display:flex;align-items:center;justify-content:space-between;gap:8px}' +
      '.vp-hint{font-size:12px;color:var(--vp-accent);font-weight:600}' +
      '.vp-btns{display:flex;gap:8px;margin-left:auto}' +
      '.vp-btn{font:inherit;font-size:13px;font-weight:600;padding:7px 14px;border-radius:9px;cursor:pointer;border:1px solid var(--vp-line);background:transparent;color:var(--vp-fg)}' +
      '.vp-btn:hover{border-color:var(--vp-accent)}' +
      '.vp-btn.primary{background:var(--vp-accent);border-color:var(--vp-accent);color:#0b1220}' +
      '.vp-btn.ghost{color:var(--vp-muted);border-color:transparent;padding-left:6px;padding-right:6px}' +
      '.vp-btn:disabled{opacity:.4;cursor:default}' +
      '@media (max-width:560px){.vp-bubble{position:fixed!important;left:0!important;right:0!important;bottom:0!important;top:auto!important;width:100%!important;max-width:100%!important;border-radius:16px 16px 0 0}}' +
      /* Quick Tour button */
      '#vp-help{position:fixed;z-index:' + (Z - 1) + ';display:flex;align-items:center;gap:7px;padding:7px 12px 7px 8px;background:var(--vp-accent);color:#0b1220;border:0;border-radius:999px;font-family:system-ui,sans-serif;font-size:12.5px;font-weight:700;cursor:pointer;box-shadow:0 6px 18px rgba(0,0,0,.3)}' +
      '#vp-help .q{display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:50%;background:rgba(0,0,0,.18);font-size:13px}' +
      '#vp-help:hover{filter:brightness(1.05)}' +
      '.vp-toast{position:fixed;z-index:' + Z + ';left:50%;transform:translateX(-50%);bottom:24px;background:var(--vp-panel);color:var(--vp-fg);border:1px solid var(--vp-line);padding:10px 16px;border-radius:10px;font-family:system-ui,sans-serif;font-size:13px;box-shadow:0 10px 30px rgba(0,0,0,.4)}';
    document.head.appendChild(st);
  }

  function setVars() {
    var r = document.documentElement.style;
    r.setProperty('--vp-accent', TH.accent);
    r.setProperty('--vp-panel', TH.panel);
    r.setProperty('--vp-fg', TH.fg);
    r.setProperty('--vp-muted', TH.muted);
    r.setProperty('--vp-line', TH.line);
  }

  function ensureRoot() {
    if (root) return;
    root = document.createElement('div');
    root.id = 'vp-tour-root';
    root.innerHTML =
      '<div class="vp-mask" data-m="t"></div><div class="vp-mask" data-m="r"></div>' +
      '<div class="vp-mask" data-m="b"></div><div class="vp-mask" data-m="l"></div>' +
      '<div class="vp-ring"></div><div class="vp-block" style="display:none"></div>';
    document.body.appendChild(root);
    // Clicking the dimmed area does nothing (prevents accidental page clicks);
    // the transparent hole has no overlay element, so clicks pass to the app.
    var masks = root.querySelectorAll('.vp-mask');
    for (var i = 0; i < masks.length; i++) masks[i].addEventListener('click', function (e) { e.stopPropagation(); });
    // Passive-step hole cover: absorbs a stray click on the highlighted element
    // (so it can't open a modal UNDER the overlay) and just advances instead.
    root.querySelector('.vp-block').addEventListener('click', function (e) {
      e.stopPropagation(); if (state) gotoStep(state.idx + 1);
    });
  }

  function layoutSpotlight(rect, opts) {
    opts = opts || {};
    ensureRoot();
    root.style.display = '';                 // re-show if a prior click hid it
    var pad = 6, W = innerWidth, H = innerHeight;
    var x = rect ? Math.max(0, rect.left - pad) : 0;
    var y = rect ? Math.max(0, rect.top - pad) : 0;
    var w = rect ? Math.min(W, rect.right + pad) - x : 0;
    var h = rect ? Math.min(H, rect.bottom + pad) - y : 0;
    var m = {
      t: root.querySelector('[data-m="t"]'), r: root.querySelector('[data-m="r"]'),
      b: root.querySelector('[data-m="b"]'), l: root.querySelector('[data-m="l"]')
    };
    var ring = root.querySelector('.vp-ring');
    var block = root.querySelector('.vp-block');
    function box(el, L, T, Wd, Ht) { el.style.cssText = 'position:fixed;left:' + L + 'px;top:' + T + 'px;width:' + Math.max(0, Wd) + 'px;height:' + Math.max(0, Ht) + 'px;background:rgba(2,6,23,.5);pointer-events:auto'; }
    if (!rect) { box(m.t, 0, 0, W, H); box(m.r, 0, 0, 0, 0); box(m.b, 0, 0, 0, 0); box(m.l, 0, 0, 0, 0); ring.style.opacity = '0'; block.style.display = 'none'; return; }
    box(m.t, 0, 0, W, y);
    box(m.b, 0, y + h, W, H - (y + h));
    box(m.l, 0, y, x, h);
    box(m.r, x + w, y, W - (x + w), h);
    ring.style.opacity = '1';
    ring.style.left = x + 'px'; ring.style.top = y + 'px';
    ring.style.width = w + 'px'; ring.style.height = h + 'px';
    ring.className = 'vp-ring' + (REDUCED ? '' : ' vp-pulse');
    // Passive steps: cover the hole so a stray click can't trigger the app (and
    // open a modal UNDER the dimmer). Click-driven steps leave the hole open.
    if (opts.block) {
      block.style.cssText = 'position:fixed;left:' + x + 'px;top:' + y + 'px;width:' + Math.max(0, w) + 'px;height:' + Math.max(0, h) + 'px;background:transparent;pointer-events:auto;cursor:pointer;display:block';
    } else {
      block.style.display = 'none';
    }
  }

  // Hide the dimmer (keeps the bubble) the instant the user clicks a click-driven
  // target, so the modal/page it opens is fully interactive.
  function hideOverlay() { if (root) root.style.display = 'none'; }

  function placeBubble(rect) {
    if (!bubble) return;
    if (innerWidth <= 560) { bubble.style.cssText += ''; return; } // CSS handles bottom-sheet
    var bb = bubble.getBoundingClientRect(), gap = 14;
    var bw = bb.width || 320, bh = bb.height || 180;
    var pos;
    if (!rect) { pos = { left: (innerWidth - bw) / 2, top: (innerHeight - bh) / 2 }; }
    else {
      var below = innerHeight - rect.bottom, above = rect.top, right = innerWidth - rect.right, left = rect.left;
      if (below > bh + gap)      pos = { left: clamp(rect.left, bw), top: rect.bottom + gap };
      else if (above > bh + gap) pos = { left: clamp(rect.left, bw), top: rect.top - bh - gap };
      else if (right > bw + gap) pos = { left: rect.right + gap, top: clampV(rect.top, bh) };
      else if (left > bw + gap)  pos = { left: rect.left - bw - gap, top: clampV(rect.top, bh) };
      else pos = { left: (innerWidth - bw) / 2, top: innerHeight - bh - gap };
    }
    bubble.style.left = Math.round(pos.left) + 'px';
    bubble.style.top = Math.round(pos.top) + 'px';
    bubble.style.right = 'auto'; bubble.style.bottom = 'auto';
  }
  function clamp(L, bw) { return Math.max(12, Math.min(L, innerWidth - bw - 12)); }
  function clampV(T, bh) { return Math.max(12, Math.min(T, innerHeight - bh - 12)); }

  // ==========================================================================
  // STEP RUNNER
  // ==========================================================================
  function renderBubble(step, idx, total) {
    if (!bubble) { bubble = document.createElement('div'); bubble.className = 'vp-bubble'; document.body.appendChild(bubble); }
    var dots = '';
    for (var i = 0; i < total; i++) dots += '<span class="vp-dot' + (i === idx ? ' on' : '') + '"></span>';
    var last = idx === total - 1;
    var controls = step.click
      ? '<span class="vp-hint">Click the highlighted item ↑</span>' +
        '<div class="vp-btns"><button class="vp-btn ghost" data-act="skip">Skip</button></div>'
      : '<button class="vp-btn ghost" data-act="prev"' + (idx === 0 ? ' disabled' : '') + '>Prev</button>' +
        '<div class="vp-btns"><button class="vp-btn ghost" data-act="skip">Skip</button>' +
        '<button class="vp-btn primary" data-act="next">' + (last ? 'Finish' : 'Next') + '</button></div>';
    bubble.innerHTML =
      '<button class="vp-x" data-act="skip" aria-label="Close">×</button>' +
      '<div class="vp-eyebrow">Step ' + (idx + 1) + ' of ' + total + '</div>' +
      '<div class="vp-title">' + esc(step.title || '') + '</div>' +
      '<div class="vp-body">' + esc(step.body || '') + '</div>' +
      '<div class="vp-dots">' + dots + '</div>' +
      '<div class="vp-row">' + controls + '</div>';
    bubble.querySelectorAll('[data-act]').forEach(function (b) {
      b.addEventListener('click', function () {
        var a = b.getAttribute('data-act');
        if (a === 'skip') endTour();
        else if (a === 'prev') gotoStep(idx - 1);
        else if (a === 'next') { if (last) endTour(); else gotoStep(idx + 1); }
      });
    });
  }
  function esc(s) { return String(s).replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; }); }

  function gotoStep(idx) {
    if (!state) return;
    var steps = state.steps;
    if (idx < 0 || idx >= steps.length) return endTour();
    clearWatch();
    state.idx = idx;
    var step = steps[idx];
    var target = step.target ? findTarget(step.target) : null;

    // If a targeted step can't find its element yet, poll briefly for it.
    if (step.target && !target) {
      var t0 = Date.now();
      state.findIv = setInterval(function () {
        var el = findTarget(step.target);
        if (el) { clearInterval(state.findIv); showStep(step, idx, el); }
        else if (Date.now() - t0 > WAIT_MS) { clearInterval(state.findIv); showStep(step, idx, null); }
      }, POLL_MS);
      return;
    }
    showStep(step, idx, target);
  }

  function showStep(step, idx, target) {
    if (!state) return;
    if (target && target.scrollIntoView) {
      try { target.scrollIntoView({ block: 'center', inline: 'center', behavior: REDUCED ? 'auto' : 'smooth' }); } catch (e) {}
    }
    var draw = function () {
      var rect = target ? target.getBoundingClientRect() : null;
      layoutSpotlight(rect, { block: !step.click });   // passive steps block the hole
      placeBubble(rect);
    };
    renderBubble(step, idx, state.steps.length);
    draw();
    setTimeout(draw, 60); setTimeout(draw, 260);   // settle after scroll/anim
    state.redraw = draw;

    if (step.click) armClickStep(step, target);
  }

  // Click-driven steps.
  //  • nav step: clicking navigates away — the route handler starts the next
  //    page's tour, so there's nothing to poll here.
  //  • reveal step (waitFor): advance the moment the resulting UI appears. We
  //    poll rather than hard-advance after a fixed time, because some actions
  //    (e.g. pasting a URL into the Add-video modal) take longer than a render.
  //    The user can Skip if they abandon. Cap the poll so it never runs forever.
  function armClickStep(step, target) {
    // The instant the user clicks the highlighted target, hide the dimmer so the
    // modal/page it opens is fully usable (no frozen canvas under the overlay).
    state.hideClick = function (e) {
      if (!target || target === e.target || target.contains(e.target)) {
        hideOverlay();
        document.removeEventListener('click', state.hideClick, true); state.hideClick = null;
      }
    };
    document.addEventListener('click', state.hideClick, true);

    if (step.nav) return;              // navigation → route handler starts the next tour
    if (step.waitFor) {
      var t0 = Date.now();
      state.waitIv = setInterval(function () {
        if (findTarget(step.waitFor)) { clearInterval(state.waitIv); state.waitIv = null; gotoStep(state.idx + 1); }
        else if (Date.now() - t0 > 120000) { clearInterval(state.waitIv); state.waitIv = null; }
      }, POLL_MS);
      return;
    }
    // No waitFor: advance when the highlighted target is clicked.
    state.onClick = function (e) {
      if (!target || target === e.target || target.contains(e.target)) {
        document.removeEventListener('click', state.onClick, true); state.onClick = null;
        gotoStep(state.idx + 1);
      }
    };
    document.addEventListener('click', state.onClick, true);
  }

  function clearWatch() {
    if (!state) return;
    if (state.onClick) { document.removeEventListener('click', state.onClick, true); state.onClick = null; }
    if (state.hideClick) { document.removeEventListener('click', state.hideClick, true); state.hideClick = null; }
    [state.waitIv, state.pollIv, state.findIv].forEach(function (iv) { if (iv) clearInterval(iv); });
    state.waitIv = state.pollIv = state.findIv = null;
  }

  function startTour(key, opts) {
    var steps = TOURS[key];
    if (!steps || !steps.length) { if (opts && opts.toast) toast('No guided tour on this page yet.'); return; }
    endTour(true);
    TH = detectTheme(); setVars();
    state = { key: key, steps: steps, idx: 0, redraw: null };
    gotoStep(0);
    if (!startTour._bound) {
      startTour._bound = true;
      window.addEventListener('resize', function () { if (state && state.redraw) state.redraw(); });
      window.addEventListener('scroll', function () { if (state && state.redraw) state.redraw(); }, true);
    }
  }

  function endTour(silent) {
    clearWatch();
    if (state) state = null;
    if (root) { root.parentNode && root.parentNode.removeChild(root); root = null; }
    if (bubble) { bubble.parentNode && bubble.parentNode.removeChild(bubble); bubble = null; }
  }

  // ==========================================================================
  // QUICK TOUR "?" BUTTON  (top-right, under "Add video")
  // ==========================================================================
  var help = null;
  function ensureHelp() {
    if (help) return;
    help = document.createElement('button');
    help.id = 'vp-help';
    help.type = 'button';
    help.innerHTML = '<span class="q">?</span><span>Quick Tour</span>';
    help.addEventListener('click', function () {
      var k = pageKey();
      if (k && TOURS[k]) startTour(k); else startTour(k, { toast: true });
    });
    document.body.appendChild(help);
    positionHelp();
  }
  function positionHelp() {
    if (!help) return;
    var add = findByText('Add video', true);
    if (add) {
      var r = add.getBoundingClientRect();
      help.style.top = Math.round(r.bottom + 10) + 'px';
      help.style.right = Math.round(innerWidth - r.right) + 'px';
      help.style.left = 'auto';
    } else {
      help.style.top = '70px'; help.style.right = '16px'; help.style.left = 'auto';
    }
  }

  // ==========================================================================
  // ROUTE DETECTION + FIRST-VISIT AUTO-START
  // ==========================================================================
  function seenKey(k) { return SEEN_PREFIX + k; }
  function maybeAutoStart() {
    var k = pageKey();
    if (!k || !TOURS[k]) return;
    var flag = seenKey(k);
    var seen; try { seen = localStorage.getItem(flag); } catch (e) { seen = '1'; }
    if (seen) return;
    try { localStorage.setItem(flag, '1'); } catch (e) {}
    // small delay so the page's own content renders first
    setTimeout(function () { if (pageKey() === k) startTour(k); }, 700);
  }

  var lastPath = location.pathname;
  function onRoute() {
    if (location.pathname === lastPath) return;
    lastPath = location.pathname;
    endTour(true);                 // close any open tour from the previous page
    positionHelp();
    maybeAutoStart();
  }
  // Patch the SPA history API so we hear client-side navigations.
  ['pushState', 'replaceState'].forEach(function (fn) {
    var orig = history[fn];
    history[fn] = function () { var r = orig.apply(this, arguments); setTimeout(onRoute, 0); return r; };
  });
  window.addEventListener('popstate', function () { setTimeout(onRoute, 0); });
  setInterval(onRoute, 600);       // fallback for routers that don't use history

  // ==========================================================================
  // BOOT — wait for the app shell, then mount the "?" button + first-visit tour
  // ==========================================================================
  function toast(msg) {
    var t = document.createElement('div'); t.className = 'vp-toast'; t.textContent = msg;
    document.body.appendChild(t); setTimeout(function () { t.parentNode && t.remove(); }, 2600);
  }
  function shellReady() {
    // The app is up once its nav has rendered (any of these labels exist).
    return !!(findByText('Overview', true) || findByText('Videos', true) || findByText('Add video', true));
  }
  function boot() {
    injectStyle();
    if (!TH) { TH = detectTheme(); setVars(); }
    var t0 = Date.now();
    var iv = setInterval(function () {
      if (shellReady()) {
        clearInterval(iv);
        if (!TH) { TH = detectTheme(); setVars(); }
        ensureHelp();
        // Keep the "?" button alive across SPA re-renders.
        try {
          new MutationObserver(function () {
            if (!document.getElementById('vp-help')) { help = null; ensureHelp(); }
            positionHelp();
          }).observe(document.body, { childList: true, subtree: true });
        } catch (e) {}
        maybeAutoStart();
      } else if (Date.now() - t0 > 20000) {
        clearInterval(iv);          // give up gracefully if the shell never matches
      }
    }, 300);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  // ==========================================================================
  // PUBLIC API
  // ==========================================================================
  window.VPTour = {
    start: function () { var k = pageKey(); startTour(k, { toast: true }); },
    startPage: function (k) { startTour(k, { toast: true }); },
    end: function () { endTour(); },
    reset: function (k) {
      try {
        if (k) localStorage.removeItem(seenKey(k));
        else for (var i = localStorage.length - 1; i >= 0; i--) {
          var key = localStorage.key(i);
          if (key && key.indexOf(SEEN_PREFIX) === 0) localStorage.removeItem(key);
        }
      } catch (e) {}
      maybeAutoStart();
    }
  };
})();
