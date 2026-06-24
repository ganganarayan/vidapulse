'use strict';

module.exports = {
  metaTitle: `How do SaaS teams track demo video engagement? | VidaPulse`,
  metaDescription: `SaaS teams track demo video engagement with the retention curve, reach-to-CTA, and replays — on a demo embedded anywhere, no re-hosting or code.`,
  answer: `SaaS teams track demo video engagement by measuring what happens inside the demo, not just whether it played: the audience-retention curve, the percentage of viewers who reach the sign-up CTA, and how often viewers replay key sections. A demo's job is to get a prospect to the moment you ask them to start a trial, so the numbers that matter are how far they watch and whether they reach the ask. With VidaPulse you get all of this on a demo embedded anywhere — on its existing host, with no re-hosting and no code.`,
  sections: [
    {
      h2: `What "engagement" means for a demo video`,
      html: `<p>A play count tells you a prospect started your demo. It does not tell you whether they understood the product or ever heard you ask them to sign up. Real demo engagement is about depth, not just the click on play.</p>
<p>The questions that actually matter for a SaaS demo are concrete: how far into the walkthrough did viewers get, where did the ones who left drop off, what share reached the trial CTA, and which sections did they rewind to watch again. Those are the signals that tell you whether the demo is doing its job — moving a prospect toward a sign-up — or quietly losing them before the ask.</p>`,
    },
    {
      h2: `The three numbers to track`,
      html: `<p>Demo engagement comes down to a small set of readable metrics:</p>
<ul class="kb-list"><li><strong>Audience-retention curve</strong> — the share of viewers still watching at every second of the demo. Flat stretches hold attention; steep cliffs are where viewers leave. This is the map of where your demo loses people.</li>
<li><strong>Reach-to-CTA</strong> — the percentage of viewers who reach the second your sign-up ask appears. This is the share who even hear the offer to start a trial.</li>
<li><strong>Replays versus first watches</strong> — the sections viewers rewind to. A replayed section is either the moment that finally lands or a point of confusion worth clarifying.</li></ul>
<p>Read alongside average watch time, play rate, and total and unique viewers, these turn "people watched the demo" into a precise account of how much of it landed and how many reached the ask.</p>`,
    },
    {
      h2: `Track it on a demo embedded anywhere`,
      html: `<p>Your demo might live on your homepage, a feature page, a sales follow-up page, or inside your app. You do not need to move it or rebuild the page to track engagement.</p>
<ol><li><strong>Take the demo's existing URL</strong> — YouTube, Amazon S3, Google Drive, Dropbox, OneDrive, Azure Blob, Loom, a Zoom recording, Vimeo, or a direct MP4/HLS link.</li>
<li><strong>Wrap it in an analytics player</strong> by pasting that URL into VidaPulse. Nothing is re-hosted.</li>
<li><strong>Embed it</strong> with one line of script or a script-free iframe on whatever page the demo already lives on — WordPress, Webflow, custom HTML, or your app.</li></ol>
<p>The analytics ride along inside the embedded player, so wherever the demo appears, the engagement data comes with it. There is no coding and your page does not change.</p>`,
    },
    {
      h2: `Turn engagement data into a better demo`,
      html: `<p>Tracking is only useful if it tells you what to change. Once you can read the demo's curve, improving it becomes a loop:</p>
<ol><li><strong>Find the steepest drop</strong> ahead of your CTA on the retention curve.</li>
<li><strong>Fix the one section</strong> before it — tighten the pacing or clarify the part viewers keep rewinding.</li>
<li><strong>Re-measure</strong> on new traffic and compare the curve against your baseline.</li></ol>
<p class="kb-example">Hypothetical: if your demo reads only 20% at the sign-up CTA but the viewers who reach it convert well, your problem is the run-up losing people, not the offer. If many reach the CTA but few sign up, the ask itself needs work. The two have opposite fixes, and engagement data is what tells you which one to make.</p>
<p>With Pro, the second-by-second engagement heatmap pins the exact moment viewers bail, and viewer-level history shows how an individual prospect moved through the demo.</p>`,
    },
  ],
  solve: `<p>VidaPulse lets SaaS teams track demo video engagement without re-hosting and without code. You paste your demo's existing URL (YouTube, Amazon S3, Google Drive, Dropbox, OneDrive, Azure Blob, Loom, a Zoom recording, Vimeo, or a direct MP4/HLS), VidaPulse wraps it in an analytics player, and you embed it with one line of script or a script-free iframe on whatever page the demo already lives on.</p>
<p>On your demo you can read:</p>
<ul class="kb-list"><li>The <strong>audience-retention curve, average watch time, and play rate</strong> — how far viewers watch.</li>
<li>The <strong>percentage of viewers who reach any point</strong> — reach-to-CTA, the share who hear the sign-up ask.</li>
<li><strong>Replays versus first watches</strong> — the sections viewers rewind to.</li>
<li><strong>Conversion and CTA tracking</strong> (Pro) — whether viewers start the trial.</li>
<li>The <strong>second-by-second heatmap and viewer-level history</strong> (Pro) — the exact moment viewers bail and how an individual moved through.</li></ul>
<p>You can start free — one video, free forever, no card. No personal data is collected, and you can restrict the player to your own domains. Create a free VidaPulse account, wrap your demo, and see exactly where it loses viewers before they sign up.</p>`,
  faq: [
    {
      q: `Can I track demo engagement if the demo is on YouTube or Loom?`,
      a: `Yes. You paste the demo's existing URL — YouTube, Loom, S3, Drive, Dropbox, OneDrive, Azure Blob, Zoom, Vimeo, or a direct MP4/HLS link — and VidaPulse wraps it in an analytics player you embed with one line of script or a script-free iframe. Nothing is re-hosted, so the demo stays on its current host and you still get full engagement data.`,
    },
    {
      q: `What is the single most useful demo metric?`,
      a: `Reach-to-CTA: the percentage of viewers who reach the point where you ask them to start a trial. A demo that loses most viewers before the ask cannot convert no matter how good the offer is. Pair it with the retention curve to see exactly where the drop happens, and replays to spot the moments that confuse or click.`,
    },
    {
      q: `Does tracking the demo collect personal data on viewers?`,
      a: `No personal data is collected. VidaPulse measures engagement — how far viewers watch, where they drop, reach-to-CTA, and replays — and on Pro adds viewer-level history for session-level detail. You can also restrict the player to your own domains so the demo only reports where you embed it.`,
    },
  ],
};
