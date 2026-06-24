'use strict';

module.exports = {
  metaTitle: `What makes a SaaS demo video convert? | VidaPulse`,
  metaDescription: `A SaaS demo video converts when it shows value fast and asks for the trial clearly. Retention shows which parts work and where viewers leave.`,
  answer: `A SaaS demo video converts when it shows real value in the first few seconds, keeps the walkthrough tight, and makes a clear ask to start a trial at a point most viewers actually reach. The video's only job is to move a prospect from curiosity to sign-up, so the parts that matter are how fast it earns attention and whether viewers stay long enough to hear the offer. Retention data is what tells you which parts of the demo are doing that work and which are quietly losing people.`,
  sections: [
    {
      h2: `Show value fast`,
      html: `<p>A prospect decides within the first several seconds whether your demo is worth their time. If the opening is a logo animation, a long preamble, or a slow setup, you spend that goodwill before the product ever appears. The demos that convert lead with the outcome — the thing the product does for the viewer — and show it happening on screen, not described.</p>
<p>The signal that this is working is a shallow early drop on the retention curve. When viewers stay through the opening instead of bailing in the first ten seconds, your front-loaded value is landing. A steep cliff at the start means the opening is asking for patience the prospect has not agreed to give yet.</p>`,
    },
    {
      h2: `Make the CTA clear and reachable`,
      html: `<p>Every converting demo has a moment where it asks the viewer to act — start a trial, create an account, book a call. Two things determine whether that ask works: it has to be unmistakable, and it has to land where most viewers still are. A brilliant CTA at the end of a video that loses everyone in the middle reaches almost no one.</p>
<p>The number that captures this is reach-to-CTA: the share of viewers who get to the second your ask appears. It sets a hard ceiling on conversion, because a viewer who left before the ask cannot respond to it. A demo that converts puts a clear ask at a point a large share of viewers reach — and the only way to know that share is to measure it.</p>`,
    },
    {
      h2: `Keep the middle tight`,
      html: `<p>Most demos do not lose viewers at the start or the end. They lose them in the middle — a feature tour that runs too long, a tangent, a slow section that does not earn its runtime. Each of those is a place where the retention curve falls and never recovers, and every viewer lost there is a viewer who never reaches your CTA.</p>
<p>The converting version of a demo is ruthless about the middle. It cuts the parts that do not move the prospect toward the decision and tightens the pacing on the parts that do. You find those parts by reading where the curve drops:</p>
<ul class="kb-list"><li><strong>A steep cliff mid-demo</strong> — a section that is too long, off-topic, or confusing.</li>
<li><strong>A flat stretch</strong> — a part that holds attention and is worth keeping or expanding.</li>
<li><strong>A replayed section</strong> — either the moment that finally lands or a point viewers rewind because it confused them.</li></ul>`,
    },
    {
      h2: `Let retention show what works`,
      html: `<p>The elements above are not guesses you make once. They are settings you tune against data, because the same demo behaves differently for different products and audiences. Retention turns "I think the demo is good" into a precise account of what is actually happening:</p>
<ol><li><strong>Read the retention curve</strong> to see where viewers stay and where they leave.</li>
<li><strong>Check reach-to-CTA</strong> to see how many even hear the ask.</li>
<li><strong>Compare replays</strong> to find the moments that land or confuse.</li></ol>
<p class="kb-example">Hypothetical: suppose your demo reads only 25% at the trial ask, but the viewers who reach it convert well. That tells you the offer is fine — the run-up is leaking, and the fix is the middle of the video. If instead most viewers reach the CTA and few act, the ask itself needs work. The elements that make a demo convert have opposite fixes when they break, and retention is what tells you which fix to make.</p>`,
    },
  ],
  solve: `<p>VidaPulse shows you what is making your SaaS demo convert — or not — without re-hosting and without code. You paste the demo's existing URL (YouTube, Amazon S3, Google Drive, Dropbox, OneDrive, Azure Blob, Loom, a Zoom recording, Vimeo, or a direct MP4/HLS), VidaPulse wraps it in an analytics player, and you embed it with one line of script or a script-free iframe on whatever page the demo already lives on.</p>
<p>To see which elements are working you get:</p>
<ul class="kb-list"><li>The <strong>audience-retention curve, average watch time, and play rate</strong> — whether your fast opening and tight middle hold viewers.</li>
<li>The <strong>percentage of viewers who reach any point</strong> — reach-to-CTA, the share who hear the ask.</li>
<li><strong>Replays versus first watches</strong> — the moments that land or confuse.</li>
<li><strong>Conversion and CTA tracking</strong> (Pro) — whether viewers who reach the ask start the trial.</li>
<li>The <strong>second-by-second heatmap and viewer-level history</strong> (Pro) — the exact moment viewers bail and how an individual moved through.</li></ul>
<p>You can start free — one video, free forever, no card. No personal data is collected, and you can restrict the player to your own domains. Create a free VidaPulse account, wrap your demo, and see exactly where it loses viewers before they sign up.</p>`,
  faq: [
    {
      q: `What is the single biggest factor in whether a demo converts?`,
      a: `Reach-to-CTA: the share of viewers who get to the moment you ask them to start a trial. A demo that loses most viewers before the ask cannot convert no matter how strong the offer is. Pair it with the retention curve to see where the run-up leaks and with conversion tracking to see how many who reach the ask actually act.`,
    },
    {
      q: `How long should a converting SaaS demo be?`,
      a: `There is no fixed number — the right length is the one your retention curve supports. Let the curve decide: if viewers drop steeply partway through, the demo is longer than your audience will watch, and the fix is to cut the section ahead of the drop. A shorter demo that holds viewers to the CTA beats a longer one they abandon.`,
    },
    {
      q: `Can I measure conversion if my demo is on YouTube or Loom?`,
      a: `Yes. You paste the demo's existing URL — YouTube, Loom, S3, Drive, Dropbox, OneDrive, Azure Blob, Zoom, Vimeo, or a direct MP4/HLS — and VidaPulse wraps it in an analytics player you embed with one line of script or a script-free iframe. Nothing is re-hosted, so the demo stays on its host while you read retention, reach-to-CTA, and conversion tracking on Pro.`,
    },
  ],
};
