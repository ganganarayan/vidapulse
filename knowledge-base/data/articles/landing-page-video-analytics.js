'use strict';

module.exports = {
  metaTitle: `What is landing page video analytics? | VidaPulse`,
  metaDescription: `Landing page video analytics measures the video on your landing page — retention, reach-to-offer, source, and conversions — without changing your page builder.`,
  answer: `Landing page video analytics is the measurement of the video on your landing page: how far visitors watch, what share reach the offer, where they came from, and whether they convert. On a video-led landing page, that video is usually the decisive step — it does the persuading, and most of the page's drop-off happens inside it. Good landing page video analytics tells you exactly where the video loses people, by traffic source, without you changing your page builder or re-hosting the video.`,
  sections: [
    {
      h2: `Why the video is the decisive step on a landing page`,
      html: `<p>On a video-led landing page, the page is mostly scaffolding — a headline, a player, a button. The argument that turns a visitor into a lead or a buyer lives inside the video. So when the page underperforms, the loss is usually happening in the video, not in the layout around it.</p>
<p>Standard page analytics can tell you how many people landed and how many converted, but it treats the video as a single opaque event: played or not. That hides the most important question — how far into the video people got, and where the ones who left dropped off. Landing page video analytics fills that gap by measuring the inside of the video, which is where the decision is actually made.</p>`,
    },
    {
      h2: `What it actually measures`,
      html: `<p>Landing page video analytics turns the video from a black box into a series of readable numbers:</p>
<ul class="kb-list"><li><strong>Audience-retention curve</strong> — the share of visitors still watching at every second, so you can see exactly where attention falls off.</li>
<li><strong>Reach-to-offer</strong> — the percentage of viewers who reach the moment your offer or CTA appears.</li>
<li><strong>Play rate, average watch time, total and unique viewers</strong> — how the video is being consumed on the page.</li>
<li><strong>Source attribution</strong> via UTM — which traffic source each viewer came from.</li>
<li><strong>Conversion and CTA tracking</strong> — whether viewers act on the offer.</li></ul>
<p>Together these answer the questions page-level analytics cannot: not just "did they convert?" but "how far did they watch, where did they leave, and did they ever reach the offer?"</p>`,
    },
    {
      h2: `Measure without changing your page builder`,
      html: `<p>You do not need to rebuild your landing page or move the video to get this. The video stays where it already lives, and the analytics ride along inside the embedded player.</p>
<ol><li><strong>Take the video's existing URL</strong> — YouTube, Amazon S3, Google Drive, Dropbox, OneDrive, Azure Blob, Loom, a Zoom recording, Vimeo, or a direct MP4/HLS link.</li>
<li><strong>Wrap it in an analytics player</strong> by pasting that URL into VidaPulse. Nothing is re-hosted.</li>
<li><strong>Embed it on the same landing page</strong> with one line of script or a script-free iframe.</li></ol>
<p>It drops into WordPress, Webflow, ClickFunnels, or custom HTML the same way your current player does. There is no coding, and your page builder, theme, and layout stay exactly as they are.</p>`,
    },
    {
      h2: `Read it by traffic source`,
      html: `<p>Landing pages often receive traffic from several sources at once, and the same video can perform very differently depending on who arrives. Reading the analytics by source is what makes the data actionable.</p>
<p>With UTM tags on your inbound links, VidaPulse attributes each viewer to a source, so you can compare retention, reach-to-offer, and conversions per channel.</p>
<p class="kb-example">Hypothetical: warm email traffic might reach your offer at 30% while a colder source reaches it at 12% on the very same page. That tells you the video is fine for warm visitors but loses cold ones early — a targeting and opening-hook insight you would never see from a single blended number.</p>`,
    },
    {
      h2: `From measurement to a better page`,
      html: `<p>Once you can see inside the video, improving the landing page becomes a loop instead of a guess. Read the retention curve to find the steepest drop, fix the section before it, check whether more visitors now reach the offer and click through, and compare against your baseline.</p>
<p>VidaPulse measures the video step specifically — it pinpoints the video where the page leaks. It is not a full page-by-page funnel suite, so it will not map every element on the page. But on a video-led landing page the video is the decisive step, so measuring it is where the real gains are. With Pro, the second-by-second heatmap and viewer-level history take the detail down to the exact line and the individual session.</p>`,
    },
  ],
  solve: `<p>VidaPulse is landing page video analytics without touching your page builder. You paste your landing page video's existing URL (YouTube, Amazon S3, Google Drive, Dropbox, OneDrive, Azure Blob, Loom, a Zoom recording, Vimeo, or a direct MP4/HLS), VidaPulse wraps it in an analytics player, and you embed it with one line of script or a script-free iframe on the same page — WordPress, Webflow, ClickFunnels, or custom HTML. No re-hosting, no coding, no layout change.</p>
<p>On your landing page you get:</p>
<ul class="kb-list"><li>The <strong>audience-retention curve</strong> to see where the video loses people.</li>
<li>The <strong>percentage of viewers who reach any point</strong> for reach-to-offer.</li>
<li><strong>UTM and source attribution</strong> to read performance by traffic source.</li>
<li><strong>Conversion and CTA tracking</strong> (Pro) to see whether viewers act.</li>
<li>The <strong>second-by-second heatmap and viewer-level history</strong> (Pro) for line-level and session-level detail.</li></ul>
<p>No personal data is collected, and you can restrict the player to your own domains. Create a free VidaPulse account, wrap your landing page video, and find the step on your page that is actually costing you conversions.</p>`,
  faq: [
    {
      q: `Do I have to rebuild my landing page or move the video?`,
      a: `No. The video stays where it lives and your page builder does not change. You paste the video's existing URL into VidaPulse, it wraps the video in an analytics player, and you embed it with one line of script or a script-free iframe. It drops into WordPress, Webflow, ClickFunnels, or custom HTML the same way your current player does.`,
    },
    {
      q: `How is this different from my page analytics?`,
      a: `Page analytics counts landings and conversions and treats the video as played-or-not. Landing page video analytics measures inside the video: how far visitors watch, where they drop, what share reach the offer, and whether they click the CTA — by traffic source. On a video-led page that is where the decision happens, so it is the detail that explains your conversion rate.`,
    },
    {
      q: `Can I compare how different traffic sources watch the video?`,
      a: `Yes. Add UTM parameters to your inbound links and VidaPulse attributes each viewer to a source. You can then compare retention, reach-to-offer, and conversions per channel. The same video often performs very differently for warm versus cold traffic, and reading it by source is what makes the data actionable.`,
    },
  ],
};
