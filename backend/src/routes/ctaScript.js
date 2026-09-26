'use strict';

/**
 * GET /cta.js — the universal CTA id stamper.
 *
 * One tag on any page:  <script src="https://app.vidapulse.io/cta.js" async></script>
 *
 * WHY THIS EXISTS
 * A CTA click can only be joined back to the person who took the assessment if
 * the click carries their id. The obvious carrier — the Referer header — is the
 * one that cannot be relied on: our own CTA anchors set rel="noreferrer", page
 * builders set referrer policies, and Facebook/Instagram in-app webviews strip
 * the header outright, which is exactly the traffic that matters most. Nothing
 * can stop a browser stripping a header.
 *
 * So the id is never left to a header. This script puts it IN THE URL, at click
 * time, on the navigation itself — which no referrer policy can touch.
 *
 * WHERE THE ID COMES FROM (first hit wins, higher rank can replace lower)
 *   url    — ?t= / ?r= / ?cid= on this page's own URL
 *   crm    — VidaPulse.setId(t, cid) called by the page (e.g. a CRM merge field)
 *   iframe — a VidaPulse player embedded on the page; it resolved the id from
 *            its OWN src, so it often knows the viewer when the page does not
 *   cache  — an id this domain saw on an earlier page of the same funnel
 *
 * Only VidaPulse CTA tracking links are ever rewritten. Every other link on the
 * page is left untouched, byte for byte.
 *
 * Only opaque ids travel — never a name, email or phone — so nothing here puts
 * personal data into a URL.
 *
 * Served from the app origin as a plain script: no CORS involvement (a <script>
 * tag is not a cross-origin fetch), no cookies, no network calls of its own.
 */

// Rank decides which carrier may overwrite which. The page URL and an explicit
// setId() are authoritative; a cached id is the weakest (it may be stale from
// an earlier visitor on a shared device).
const SCRIPT = `(function(){
  if(window.VidaPulse&&window.VidaPulse.__stamper)return;
  var CACHE_KEY='vp_cta_ids';
  var RANK={url:4,crm:4,iframe:3,cache:1};
  var ids={t:null,cid:null,src:null,rank:0};

  /* Match ?name= OR &name= — a page builder's param forwarder can append
     "&r=<id>" onto a URL that has no '?', which URLSearchParams would miss. */
  function scan(url,name){
    if(!url)return null;
    try{
      var m=String(url).match(new RegExp('[?&]'+name+'=([^&#]*)'));
      return (m&&m[1])?decodeURIComponent(m[1]):null;
    }catch(e){return null;}
  }
  function clean(v){
    if(!v)return null;
    return String(v).replace(/[^a-zA-Z0-9\\-_]/g,'').slice(0,128)||null;
  }
  function isCtaUrl(u){ return /\\/api\\/analytics\\/cta\\//i.test(u||''); }

  /* ── id store ─────────────────────────────────────────────────────── */
  function apply(t,cid,src){
    t=clean(t); cid=clean(cid);
    if(!t&&!cid)return false;
    var r=RANK[src]||0;
    if(r<ids.rank)return false;
    ids={t:t||ids.t,cid:cid||ids.cid,src:src,rank:r};
    if(src!=='cache')save();
    stampAll();
    return true;
  }
  function save(){
    var v=JSON.stringify({t:ids.t,cid:ids.cid});
    try{localStorage.setItem(CACHE_KEY,v);}catch(e){}
    /* Cookie fallback: localStorage throws in private windows / blocked storage.
       Lax + 1 year, first-party on the embedding site, opaque ids only. */
    try{
      document.cookie=CACHE_KEY+'='+encodeURIComponent(v)+
        ';path=/;max-age=31536000;samesite=lax'+(location.protocol==='https:'?';secure':'');
    }catch(e){}
  }
  function load(){
    var raw=null;
    try{raw=localStorage.getItem(CACHE_KEY);}catch(e){}
    if(!raw){
      try{
        var m=document.cookie.match(/(?:^|;\\s*)vp_cta_ids=([^;]*)/);
        if(m)raw=decodeURIComponent(m[1]);
      }catch(e){}
    }
    if(!raw)return;
    try{var o=JSON.parse(raw); apply(o.t,o.cid,'cache');}catch(e){}
  }

  /* ── stamping ─────────────────────────────────────────────────────── */
  function stamp(url,src){
    if(!url||!isCtaUrl(url))return url;
    if(!ids.t&&!ids.cid)return url;
    try{
      var x=new URL(url,location.href);
      if(ids.t&&!x.searchParams.get('t'))x.searchParams.set('t',ids.t);
      if(ids.cid&&!x.searchParams.get('cid'))x.searchParams.set('cid',ids.cid);
      x.searchParams.set('vpsrc',src||ids.src||'url');
      return x.toString();
    }catch(e){return url;}
  }
  /* Pre-stamp anchors already in the DOM. Click-time stamping is what actually
     guarantees coverage; this only makes a copied link or a middle-click carry
     the id too. Re-run whenever a better id arrives. */
  function stampAll(){
    if(!document.querySelectorAll)return;
    try{
      var as=document.querySelectorAll('a[href]');
      for(var i=0;i<as.length;i++){
        var h=as[i].getAttribute('href');
        if(isCtaUrl(h)){ var s=stamp(as[i].href); if(s!==as[i].href)as[i].href=s; }
      }
    }catch(e){}
  }

  /* Capture phase: runs before any other click handler and before the browser
     resolves the href, so the navigation itself carries the id — including a
     new-tab click, which never sends a referrer at all. */
  function onClick(e){
    try{
      var n=e.target;
      while(n&&n.nodeType===1&&n.tagName!=='A')n=n.parentNode;
      if(!n||n.nodeType!==1)return;
      var h=n.getAttribute('href');
      if(!isCtaUrl(h))return;
      var s=stamp(n.href);
      if(s!==n.href)n.href=s;
    }catch(_){}
  }

  /* ── id sources ───────────────────────────────────────────────────── */
  load();                                                   /* weakest first */
  apply(scan(location.href,'t')||scan(location.href,'r'),
        scan(location.href,'cid'),'url');

  /* A VidaPulse player on the page publishes what it read from its own src. */
  try{
    window.addEventListener('message',function(e){
      var d=e&&e.data;
      if(!d||d.type!=='vidapulse_ids')return;
      apply(d.t,d.cid,'iframe');
    });
  }catch(e){}
  function askFrames(){
    try{
      var f=document.getElementsByTagName('iframe');
      for(var i=0;i<f.length;i++){
        try{f[i].contentWindow.postMessage({type:'vidapulse_request_ids'},'*');}catch(_){}
      }
    }catch(e){}
  }

  try{document.addEventListener('click',onClick,true);}catch(e){}
  if(document.readyState==='loading'){
    try{document.addEventListener('DOMContentLoaded',function(){stampAll();askFrames();});}catch(e){}
  }else{ stampAll(); askFrames(); }
  /* Players can mount late (lazy sections, tab switches) — one delayed retry
     costs nothing and covers the common case without polling forever. */
  try{setTimeout(askFrames,1500);}catch(e){}

  window.VidaPulse=window.VidaPulse||{};
  window.VidaPulse.__stamper=true;
  /* For a page that knows the person by some other route — a CRM merge field,
     a server-rendered template: VidaPulse.setId('<token>','<customer id>') */
  window.VidaPulse.setId=function(t,cid){ return apply(t,cid,'crm'); };
  /* For JS-driven navigation (window.open, router.push) on a CTA link. */
  window.VidaPulse.stamp=function(u){ return stamp(u); };
  window.VidaPulse.ids=function(){ return {t:ids.t,cid:ids.cid,source:ids.src}; };
})();`;

/**
 * Express handler. Short cache so a fix reaches every embedding page within
 * minutes, long enough that a busy funnel is not re-fetching it per page view.
 */
function serveCtaScript(_req, res) {
  res.set('Content-Type', 'application/javascript; charset=utf-8');
  res.set('Cache-Control', 'public, max-age=300');
  res.set('X-Content-Type-Options', 'nosniff');
  return res.send(SCRIPT);
}

module.exports = { serveCtaScript, SCRIPT };
