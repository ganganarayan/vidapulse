/* VidaPulse price display: currency (USD / INR) and billing cycle.
 *
 * Every price element carries all four values as data attributes
 * (data-usd-monthly, data-usd-yearly, data-inr-monthly, data-inr-yearly); the
 * number goes into its .amt child (or the element itself), the symbol into
 * every .js-cur. <html data-currency> is the currency the page was rendered
 * in. With <html data-currency-auto> (the static Cloudflare build) the
 * visitor's country is read from Cloudflare's /cdn-cgi/trace and India gets
 * INR, matching what the server does by IP. The monthly / yearly toggle
 * (.billing-toggle .bt-opt) only exists on the home page. Elements with
 * .js-gst (the "+ 18% GST" note) are shown for INR only. */
(function () {
  'use strict';
  var root = document.documentElement;
  var SYM = { usd: '$', inr: '₹' };
  var state = { cur: String(root.getAttribute('data-currency') || 'USD').toLowerCase(), cycle: 'monthly' };
  if (!SYM[state.cur]) state.cur = 'usd';

  function render() {
    document.querySelectorAll('.js-cur').forEach(function (el) { el.textContent = SYM[state.cur]; });
    document.querySelectorAll('[data-usd-monthly]').forEach(function (el) {
      var v = el.getAttribute('data-' + state.cur + '-' + state.cycle);
      if (v == null) return;
      var amt = el.querySelector('.amt') || el;
      amt.textContent = v;
      var card = el.closest('.pricing-card');
      var per = card && card.querySelector('[data-period]');
      if (per) per.textContent = state.cycle === 'yearly' ? 'per year' : 'per month';
    });
    // GST note: shown with INR prices only (18% GST is added at checkout in India).
    document.querySelectorAll('.js-gst').forEach(function (el) { el.hidden = state.cur !== 'inr'; });
    document.querySelectorAll('.billing-toggle .bt-opt').forEach(function (b) {
      var on = b.getAttribute('data-cycle') === state.cycle;
      b.classList.toggle('active', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }

  document.querySelectorAll('.billing-toggle .bt-opt').forEach(function (b) {
    b.addEventListener('click', function () {
      state.cycle = b.getAttribute('data-cycle') === 'yearly' ? 'yearly' : 'monthly';
      render();
    });
  });

  if (root.hasAttribute('data-currency-auto')) {
    fetch('/cdn-cgi/trace').then(function (r) { return r.text(); }).then(function (t) {
      var m = /^loc=([A-Z]{2})$/m.exec(t || '');
      if (m && m[1] === 'IN' && state.cur !== 'inr') { state.cur = 'inr'; render(); }
    }).catch(function () {});
  }
})();
