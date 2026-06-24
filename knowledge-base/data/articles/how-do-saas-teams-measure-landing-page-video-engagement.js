'use strict';

module.exports = {
  metaTitle: `How do SaaS teams measure landing page video engagement? | VidaPulse`,
  metaDescription: `SaaS teams measure landing page video engagement — retention, reach-to-CTA, and source — on the hero video without changing the page builder.`,
  answer: `SaaS teams measure landing page video engagement by tracking the inside of the hero or explainer video: how far visitors watch, what share reach the sign-up CTA, and which traffic source they came from. On a video-led landing page, that video carries the pitch and is where most of the page's drop-off happens — so measuring it is where the real insight is. With VidaPulse you get retention, reach-to-CTA, and source attribution on the hero video without changing your page builder or re-hosting the video.`,
  sections: [
    {
      h2: `Why the hero video is the thing to measure`,
      html: `<p>On a video-led SaaS landing page, the page is mostly scaffolding — a headline, a player, a sign-up button. The argument that turns a visitor into a trial lives inside the hero or explainer video. So when the page underperforms, the loss is usually happening in the video, not in the layout around it.</p>
<p>Page analytics can tell you how many visitors landed and how many signed up, but it treats the video as a single opaque event: played or not. That hides the most important question — how far into the video people got, and where the ones who left dropped off. Measuring landing page video engagement fills that gap by looking inside the video, which is where the decision to start a trial is actually made.</p>`,
    },
    {
      h2: `What to measure on a landing page video`,
      html: `<p>Engagement on a hero video comes down to a focused set of numbers:</p>
<ul class="kb-list"><li><strong>Audience-retention curve</strong> — the share of visitors still watching at every second, so you can see exactly where attention falls off.</li>
<li><strong>Reach-to-CTA</strong> — the percentage of viewers who reach the moment the sign-up ask appears.</li>
<li><strong>Play rate, average watch time, total and unique viewers</strong> — how the video is being consumed on the page.</li>
<li><strong>Source attribution</strong> via UTM — which traffic source each viewer arrived from.</li>
<li><strong>Conversion and CTA tracking</strong> — whether viewers act on the sign-up ask.</li></ul>
<p>Together these answer what page-level analytics cannot: not just "did they sign up?" but "how far did they watch, where did they leave, and did they ever reach the ask?"</p>`,
    },
    {
      h2: `Measure without changing your page builder`,
      html: `<p>You do not need to rebuild your landing page or move the video to measure it. The video stays where it already lives, and the analytics ride along inside the embedded player.</p>
<ol><li><strong>Take the video's existing URL</strong> — YouTube, Amazon S3, Google Drive, Dropbox, OneDrive, Azure Blob, Loom, a Zoom recording, Vimeo, or a direct MP4/HLS link.</li>
<li><strong>Wrap it in an analytics player</strong> by pasting that URL into VidaPulse. Nothing is re-hosted.</li>
<li><strong>Embed it on the same landing page</strong> with one line of script or a script-free iframe.</li></ol>
<p>It drops into WordPress, Webflow, or custom HTML the same way your current player does. There is no coding, and your page builder, theme, and layout stay exactly as they are.</p>`,
    },
    {
      h2: `Read engagement by traffic source`,
      html: `<p>SaaS landing pages often receive traffic from several sources at once — organic, email, partner links, paid. The same hero video can perform very differently depending on who arrives, so blending it all into one number hides the insight.</p>
<p>With UTM tags on your inbound links, VidaPulse attributes each viewer to a source, so you can compare retention, reach-to-CTA, and sign-ups per channel.</p>
<p class="kb-example">Hypothetical: warm email traffic might reach your sign-up ask at 30% while a colder source reaches it at 12% on the very same page. That tells you the video is fine for warm visitors but loses cold ones early — an opening-hook and targeting insight you would never see from a single blended number. For ad traffic specifically, the video is usually the leak, not the ad: if clicks are strong but reach-to-CTA is low, the page's video is where those visitors disappear.</p>`,
    },
    {
      h2: `From measurement to a better page`,
      html: `<p>Once you can see inside the video, improving the landing page becomes a loop instead of a guess. Read the retention curve to find the steepest drop, fix the section before it, check whether more visitors now reach the sign-up ask and click through, and compare against your baseline.</p>
<p>VidaPulse measures the video step specifically — it pinpoints the video where the page leaks. It is not a full page-by-page funnel suite, so it will not map every element on the page. But on a video-led landing page the video is the deciding step, so measuring it is where the gains are. With Pro, the second-by-second engagement heatmap and viewer-level history take the detail down to the exact line and the individual session.</p>`,
    },
  ],
  solve: `<p>VidaPulse measures landing page video engagement without touching your page builder. You paste your hero or explainer video's existing URL (YouTube, Amazon S3, Google Drive, Dropbox, OneDrive, Azure Blob, Loom, a Zoom recording, Vimeo, or a direct MP4/HLS), VidaPulse wraps it in an analytics player, and you embed it with one line of script or a script-free iframe on the same page — WordPress, Webflow, or custom HTML. No re-hosting, no coding, no layout change.</p>
<p>On your landing page video you get:</p>
<ul class="kb-list"><li>The <strong>audience-retention curve, average watch time, and play rate</strong> — how far visitors watch.</li>
<li>The <strong>percentage of viewers who reach any point</strong> — reach-to-CTA, the share who hear the sign-up ask.</li>
<li><strong>UTM and source attribution</strong> — to read engagement by traffic source.</li>
<li><strong>Conversion and CTA tracking</strong> (Pro) — to see whether visitors sign up.</li>
<li>The <strong>second-by-second heatmap and viewer-level history</strong> (Pro) — for line-level and session-level detail.</li></ul>
<p>You can start free — one video, free forever, no card. No personal data is collected, and you can restrict the player to your own domains. Create a free VidaPulse account, wrap your landing page video, and find where it is actually costing you sign-ups.</p>`,
  faq: [
    {
      q: `Do I have to rebuild my landing page or move the video?`,
      a: `No. The video stays where it lives and your page builder does not change. You paste the video's existing URL into VidaPulse, it wraps the video in an analytics player, and you embed it with one line of script or a script-free iframe. It drops into WordPress, Webflow, or custom HTML the same way your current player does.`,
    },
    {
      q: `My landing page already has analytics — what does this add?`,
      a: `Page analytics counts landings and sign-ups and treats the video as played-or-not. Landing page video engagement measures inside the video: how far visitors watch, where they drop, what share reach the sign-up ask, and whether they act — by traffic source. On a video-led page that is where the decision happens, so it explains the conversion rate page analytics only reports.`,
    },
    {
      q: `My ads get clicks but the landing page does not convert — what is wrong?`,
      a: `Often the video is the leak, not the ad. If clicks are strong but few visitors reach the sign-up ask, the hero video is where those visitors disappear. Add UTM tags so VidaPulse attributes each viewer to a source, then read retention and reach-to-CTA for that channel to see exactly where the paid traffic drops off inside the video.`,
    },
  ],
};
