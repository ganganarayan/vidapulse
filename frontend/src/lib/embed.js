/**
 * embed.js — shared embed-snippet generator.
 *
 * Produces a script-based embed that forwards the host page's UTM params
 * (utm_source/medium/campaign/term/content) onto the iframe src, so
 * cross-origin traffic attribution is captured. Cross-origin iframes can't
 * read the parent URL, and default Referrer-Policy strips the query string,
 * so forwarding via the snippet is the reliable way to capture UTM.
 */
export function generateEmbedSnippet(videoId, origin = window.location.origin) {
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
