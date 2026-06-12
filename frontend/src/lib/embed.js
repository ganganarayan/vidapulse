/**
 * embed.js — shared embed-snippet generator.
 *
 * Default = a plain, script-FREE responsive <iframe>. Many page builders
 * (GoHighLevel, Wix, Squarespace, some WordPress blocks, email tools) block or
 * strip <script> on the canvas, so a bare iframe is the only thing that pastes
 * "universally without resistance". The player, analytics, Meta Pixel and
 * viewer tracking all run INSIDE the iframe — no wrapper script is required.
 *
 * Responsive via the padding-ratio wrapper (56.25% = 16:9), which works
 * everywhere (no dependency on the modern `aspect-ratio` CSS property).
 *
 * UTM: a cross-origin iframe can't read the parent URL, but the embed already
 * captures utm_* from `document.referrer`. For builders that DO allow scripts
 * and want guaranteed parent-URL UTM forwarding, use generateEmbedSnippetScript().
 */

export function generateEmbedSnippet(videoId, origin = window.location.origin) {
  const src = `${origin}/embed/${videoId}`;
  return `<div style="position:relative;width:100%;max-width:560px;margin:0 auto">
  <div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden">
    <iframe src="${src}"
      style="position:absolute;top:0;left:0;width:100%;height:100%;border:0"
      allow="autoplay; fullscreen; picture-in-picture"
      allowfullscreen loading="lazy" title="VidaPulse video"></iframe>
  </div>
</div>`;
}

/**
 * Optional script-based snippet — same iframe, but forwards the host page's
 * utm_* params onto the iframe src (reliable attribution where the referrer is
 * stripped by Referrer-Policy). Only for builders that permit <script>.
 */
export function generateEmbedSnippetScript(videoId, origin = window.location.origin) {
  const cid = `vp-${videoId}`;
  return `<div id="${cid}" style="position:relative;width:100%;max-width:560px;aspect-ratio:16/9;margin:auto"></div>
<script>
(function(){
  var base="${origin}/embed/${videoId}";
  var keep=["utm_source","utm_medium","utm_campaign","utm_term","utm_content"];
  var src=new URLSearchParams(window.location.search), out=new URLSearchParams();
  keep.forEach(function(k){var v=src.get(k); if(v) out.set(k,v);});
  var qs=out.toString();
  var f=document.createElement("iframe");
  f.src=base+(qs?("?"+qs):"");
  f.style.cssText="position:absolute;inset:0;width:100%;height:100%;border:0";
  f.allow="autoplay; fullscreen; picture-in-picture"; f.allowFullscreen=true;
  document.getElementById("${cid}").appendChild(f);
})();
</script>`;
}
