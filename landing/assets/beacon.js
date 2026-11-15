/* VidaPulse page-view beacon, shared by every public page (loaded from the
 * shared chrome in backend/src/content/siteChrome.js). Sends path, host,
 * referrer, utm_* and device class to <api>/api/pageview as an image request.
 * data-api on this script tag = the app origin; empty = same origin. */
(function () {
  'use strict';
  try {
    var me = document.currentScript;
    var api = (me && me.getAttribute('data-api')) || '';
    var q = new URLSearchParams(location.search), p = new URLSearchParams();
    p.set('path', location.pathname); p.set('host', location.hostname);
    if (document.referrer) p.set('ref', document.referrer);
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach(function (k) { var v = q.get(k); if (v) p.set(k, v); });
    p.set('dt', innerWidth < 768 ? 'mobile' : innerWidth < 1024 ? 'tablet' : 'desktop');
    new Image().src = api + '/api/pageview?' + p.toString() + '&t=' + Date.now();
  } catch (e) {}
})();
