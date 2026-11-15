/* VidaPulse home page behaviour, external so the page carries no inline
 * scripts (keeps it CSP-clean). Loaded with `defer` at end of <body>.
 * Sections: (1) engagement heatstrip, (3) signup modal + Google sign-in.
 * Prices and the monthly / yearly toggle: /assets/prices.js. Page-view beacon:
 * /assets/beacon.js (shared chrome, backend/src/content/siteChrome.js).
 *
 * <html data-api> is the app origin for API calls: empty on the Railway
 * landing hosts (same origin), the app URL on the static Cloudflare build. */
(function () {
  'use strict';
  var API = document.documentElement.getAttribute('data-api') || '';

  // ── 1. Engagement heatmap strip ("The One Thing" section) ────────────────
  (function () {
    var bars = document.getElementById('heatstrip-bars');
    if (!bars) return;
    var n = 90;
    for (var i = 0; i < n; i++) {
      var x = i / n, v;
      if (x < 0.35)      v = 0.9 - 0.15 * (x / 0.35) + 0.05 * Math.sin(x * 22);
      else if (x < 0.37) v = 0.35;                       // the cliff
      else               v = 0.30 - 0.12 * (x - 0.37) + 0.05 * Math.sin(x * 18);
      v = Math.max(0.08, Math.min(1, v));
      var bar = document.createElement('div');
      bar.className = 'hbar';
      var color = v > 0.6 ? '#10B981' : v > 0.33 ? '#F59E0B' : '#EF4444';
      bar.style.cssText = 'height:' + Math.round(v * 100) + '%;background:' + color +
        ';opacity:' + (0.55 + v * 0.45) + ';';
      bars.appendChild(bar);
    }
  })();

  // ── 3. Signup modal + Google sign-in ─────────────────────────────────────
  (function () {
    var overlay = document.getElementById('signup-overlay');
    var form    = document.getElementById('signup-form');
    var msg     = document.getElementById('signup-msg');
    var submit  = document.getElementById('signup-submit');
    if (!overlay || !form) return;

    function openModal(e) { if (e) e.preventDefault(); overlay.classList.add('open'); document.body.style.overflow = 'hidden'; var n = document.getElementById('su-name'); if (n) setTimeout(function () { n.focus(); }, 30); }
    function closeModal() { overlay.classList.remove('open'); document.body.style.overflow = ''; }

    document.querySelectorAll('.js-signup').forEach(function (el) { el.addEventListener('click', openModal); });
    var closeBtn = document.getElementById('signup-close');
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) closeModal(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && overlay.classList.contains('open')) closeModal(); });

    function leadSource() {
      var q = new URLSearchParams(location.search), ls = {};
      ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach(function (k) { var v = q.get(k); if (v) ls[k] = v; });
      return ls;
    }

    // Continue with Google: OAuth must run on the app host (that's where
    // Google's callback + state cookie live). Lead source is stashed in a
    // .vidapulse.io cookie so the callback still attributes the signup.
    var googleBtn = document.getElementById('su-google'), googleOr = document.getElementById('su-or');
    fetch(API + '/api/auth/providers').then(function (r) { return r.json(); }).then(function (p) {
      if (p && p.google && googleBtn) { googleBtn.hidden = false; if (googleOr) googleOr.hidden = false; }
    }).catch(function () {});
    if (googleBtn) googleBtn.addEventListener('click', function () {
      try {
        var ls = leadSource();
        if (Object.keys(ls).length) {
          document.cookie = 'vp_ls=' + encodeURIComponent(JSON.stringify(ls)) + '; path=/; domain=.vidapulse.io; max-age=2592000; samesite=lax';
        }
      } catch (e) {}
      window.location.href = (API || 'https://app.vidapulse.io') + '/api/auth/oauth/google';
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      msg.textContent = ''; msg.className = 'signup-msg';
      var name = document.getElementById('su-name').value.trim();
      var email = document.getElementById('su-email').value.trim();
      var phone = document.getElementById('su-phone').value.trim();
      var company_website = document.getElementById('su-company').value;
      if (!name || !email) { msg.textContent = 'Please enter your name and email.'; msg.className = 'signup-msg err'; return; }

      submit.disabled = true; var orig = submit.innerHTML; submit.textContent = 'Creating your account…';
      fetch(API + '/api/auth/lead-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name, email: email, phone: phone, company_website: company_website, lead_source: leadSource() }),
      }).then(function (r) {
        return r.json().then(function (data) { return { status: r.status, data: data }; });
      }).then(function (res) {
        // DM-link lead attribution: this form is JS-submitted (not a native
        // submit), so notify the content-engine tracker on a successful lead
        // (new account 201 or existing 409) before we navigate away.
        if ((res.status === 201 || res.status === 409) && window.ceLeadForm) {
          try { window.ceLeadForm({ name: name, email: email, phone: phone }); } catch (e) {}
        }
        if (res.status === 201 && res.data && res.data.set_password_url) {
          msg.textContent = 'Account created. Taking you to set your password…'; msg.className = 'signup-msg ok';
          window.location.href = res.data.set_password_url;
          return;
        }
        if (res.status === 409 && res.data && res.data.login_url) {
          msg.textContent = 'You already have an account. Taking you to log in…'; msg.className = 'signup-msg ok';
          window.location.href = res.data.login_url;
          return;
        }
        msg.textContent = (res.data && res.data.message) || 'Something went wrong. Please try again.';
        msg.className = 'signup-msg err';
        submit.disabled = false; submit.innerHTML = orig;
      }).catch(function () {
        msg.textContent = 'Network error. Please try again.'; msg.className = 'signup-msg err';
        submit.disabled = false; submit.innerHTML = orig;
      });
    });
  })();

})();
