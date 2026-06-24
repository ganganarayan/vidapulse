'use strict';

module.exports = {
  metaTitle: `How do SaaS teams measure explainer video performance? | VidaPulse`,
  metaDescription: `SaaS teams measure explainer video performance with the retention curve, average watch time, and reach-to-CTA on a homepage video — no re-hosting, no code.`,
  answer: `SaaS teams measure explainer video performance by reading how far viewers watch and what share reach the sign-up ask, not by counting plays. The metrics that matter for a homepage or explainer video are the audience-retention curve, average watch time, and reach-to-CTA — the percentage of viewers who get to the point where you invite them to start a trial. With VidaPulse you read all of these on the explainer wherever it already sits, with no re-hosting and no code.`,
  sections: [
    {
      h2: `What "performance" means for an explainer`,
      html: `<p>An explainer video on your homepage has one job: take a first-time visitor from "what is this?" to "I want to try it." A play count cannot tell you whether that happened. Two videos with the same number of plays can perform completely differently if one holds attention to the trial CTA and the other loses most viewers in the first fifteen seconds.</p>
<p>Performance for an explainer is about depth and reach: how far into the explanation viewers stay, and what share of them actually arrive at the moment you ask them to sign up. Those two questions decide whether the video is moving visitors toward a trial or quietly draining them off the page.</p>`,
    },
    {
      h2: `The metrics that show explainer performance`,
      html: `<p>A homepage explainer is best read with a small set of clear numbers:</p>
<ul class="kb-list"><li><strong>Audience-retention curve</strong> — the share of viewers still watching at every second. The opening seconds matter most on a homepage, where a visitor decides in moments whether to keep watching.</li>
<li><strong>Average watch time</strong> — how much of the explanation a typical visitor absorbs before leaving.</li>
<li><strong>Reach-to-CTA</strong> — the percentage of viewers who reach the second your trial ask appears. This is the share who even hear the offer.</li>
<li><strong>Replays versus first watches</strong> — the parts viewers rewind, which flag either the line that lands or a claim that confuses.</li></ul>
<p>Read together with play rate and unique viewers, these turn "the explainer got views" into a precise account of how much of the message landed and how many visitors reached the ask.</p>`,
    },
    {
      h2: `Measure the explainer where it already lives`,
      html: `<p>Your explainer probably sits at the top of your homepage and may be repeated on a product or pricing page. You do not need to move it or rebuild the page to measure it.</p>
<ol><li><strong>Take the explainer's existing URL</strong> — YouTube, Amazon S3, Google Drive, Dropbox, OneDrive, Azure Blob, Loom, a Zoom recording, Vimeo, or a direct MP4/HLS link.</li>
<li><strong>Wrap it in an analytics player</strong> by pasting that URL into VidaPulse. Nothing is re-hosted.</li>
<li><strong>Embed it</strong> with one line of script or a script-free iframe on the page it already lives on — WordPress, Webflow, custom HTML, or your app.</li></ol>
<p>The analytics ride along inside the embedded player, so the homepage explainer reports its own retention and reach-to-CTA exactly where visitors meet it. There is no coding and your page does not change.</p>`,
    },
    {
      h2: `Read source attribution to compare audiences`,
      html: `<p>A homepage explainer is watched by very different visitors — organic search, a referral link, a newsletter. Performance is not one number; it changes by who is watching.</p>
<p>With UTM and source attribution you can read the retention curve and reach-to-CTA separately by where the visitor came from. That tells you which audiences your explainer actually serves and which ones bounce before the ask.</p>
<p class="kb-example">Hypothetical: suppose visitors arriving from a comparison article watch the explainer to the CTA at a far higher rate than visitors from a broad social post. That is a signal the explainer assumes context the social audience does not have — and a reason to either rework the opening or send colder traffic to a simpler intro first.</p>
<p>On Pro, the second-by-second heatmap pins the exact second visitors leave, and conversion tracking ties the watch to whether they actually started a trial.</p>`,
    },
  ],
  solve: `<p>VidaPulse lets SaaS teams measure explainer video performance without re-hosting and without code. You paste the explainer's existing URL (YouTube, Amazon S3, Google Drive, Dropbox, OneDrive, Azure Blob, Loom, a Zoom recording, Vimeo, or a direct MP4/HLS), VidaPulse wraps it in an analytics player, and you embed it with one line of script or a script-free iframe on the page it already lives on.</p>
<p>On your explainer you can read:</p>
<ul class="kb-list"><li>The <strong>audience-retention curve and average watch time</strong> — how far visitors watch.</li>
<li>The <strong>percentage of viewers who reach any point</strong> — reach-to-CTA, the share who hear the trial ask.</li>
<li><strong>UTM and source attribution</strong> — performance broken down by where the visitor came from.</li>
<li><strong>Replays versus first watches</strong> — the lines viewers rewind.</li>
<li>The <strong>second-by-second heatmap and conversion tracking</strong> (Pro) — the exact second viewers leave and whether the watch led to a trial.</li></ul>
<p>You can start free — one video, free forever, no card. No personal data is collected, and you can restrict the player to your own domains. Create a free VidaPulse account, wrap your explainer, and see how much of it visitors actually watch before they reach the sign-up ask.</p>`,
  faq: [
    {
      q: `What is the single best metric for a homepage explainer?`,
      a: `Reach-to-CTA: the percentage of viewers who reach the point where you ask them to start a trial. An explainer can have a high play count and still fail if most visitors leave before the ask. Pair it with the audience-retention curve to see exactly where the drop happens, especially in the critical opening seconds.`,
    },
    {
      q: `Can I tell which traffic sources watch the explainer best?`,
      a: `Yes. VidaPulse reads UTM and source attribution, so you can compare the retention curve and reach-to-CTA by where the visitor came from — organic, referral, or a campaign link. That shows which audiences your explainer serves well and which ones drop off before they hear the trial offer.`,
    },
    {
      q: `Do I need to re-host the explainer to measure it?`,
      a: `No. You paste the explainer's existing URL — YouTube, S3, Drive, Dropbox, OneDrive, Azure Blob, Loom, Zoom, Vimeo, or a direct MP4/HLS link — and VidaPulse wraps it in an analytics player you embed with one line of script or a script-free iframe. The video stays on its current host and you still get full performance data.`,
    },
  ],
};
