'use strict';

module.exports = {
  metaTitle: `How does video retention affect SaaS sign-ups? | VidaPulse`,
  metaDescription: `Video retention affects SaaS sign-ups because only viewers who reach the in-video CTA can start a trial. Higher reach-to-CTA means more sign-ups.`,
  answer: `Video retention affects SaaS sign-ups because a viewer can only start a trial if they reach the moment your demo or product video asks them to. If most viewers drop off before the call to action, the offer never gets heard, no matter how strong it is. Retention is the mechanism that determines how many people reach the ask, so lifting the share who get to the CTA directly lifts the number who can sign up.`,
  sections: [
    {
      h2: `Reaching the CTA is the precondition for a sign-up`,
      html: `<p>Every video that drives sign-ups has a moment where it asks the viewer to act — start a trial, create an account, book a call. A viewer who leaves before that moment cannot respond to it. So the share of viewers who reach the CTA sets a hard ceiling on how many sign-ups the video can produce.</p>
<p>This is why retention matters more than raw views for SaaS. A demo with thousands of plays but a CTA that only 15% reach is asking the offer of a small fraction of the audience. The other 85% left before they ever heard it. Improving retention up to the CTA widens that ceiling, which is the part of the funnel most teams never see because page analytics treats the video as played-or-not.</p>`,
    },
    {
      h2: `The link, step by step`,
      html: `<p>The chain from retention to sign-up is straightforward, and each link is measurable:</p>
<ol><li><strong>Viewers press play</strong> — measured by play rate, total and unique viewers.</li>
<li><strong>They watch into the video</strong> — measured by the audience-retention curve and average watch time.</li>
<li><strong>Some reach the CTA</strong> — measured by the percentage of viewers who reach that point (reach-to-CTA).</li>
<li><strong>Of those, some act</strong> — measured by conversion and CTA tracking.</li></ol>
<p>Retention governs step three, and step three feeds step four. You can improve the offer all you want, but if the run-up to it leaks viewers, you are optimizing an ask that fewer and fewer people hear.</p>`,
    },
    {
      h2: `A hypothetical example`,
      html: `<p class="kb-example">Hypothetical: a SaaS team runs a demo where the trial ask appears near the end. Suppose 1,000 viewers press play, but the retention curve shows only 20% — 200 viewers — reach the CTA. Of those, a healthy share start a trial. Now suppose the team tightens the slow stretch in the middle that was causing the drop, and reach-to-CTA climbs to 35% — 350 viewers — on the next batch of traffic. With the same offer and the same conversion rate among those who reach the ask, the number of viewers hearing the trial ask jumped by three quarters. The lift came entirely from retention, not from changing the offer.</p>
<p>The numbers here are illustrative, but the mechanism is real: when more viewers reach the CTA, more viewers can sign up. Retention is the lever.</p>`,
    },
    {
      h2: `How to act on it`,
      html: `<p>Treating retention as a sign-up lever turns guesswork into a loop. Read the retention curve to find the steepest drop before your CTA, fix the one section ahead of it, then check whether reach-to-CTA rose and whether sign-ups followed.</p>
<p>Reading by traffic source sharpens this. With UTM tags, VidaPulse attributes each viewer to a channel, so you can see whether a low reach-to-CTA is a video problem across the board or a problem with one cold source. And conversion tracking closes the loop: if many viewers reach the CTA but few act, the fix is the ask, not the run-up. The two have opposite solutions, and the data tells you which to make.</p>`,
    },
  ],
  solve: `<p>VidaPulse shows you the retention-to-sign-up link on your own demo and product videos, without re-hosting and without code. You paste the video's existing URL (YouTube, Amazon S3, Google Drive, Dropbox, OneDrive, Azure Blob, Loom, a Zoom recording, Vimeo, or a direct MP4/HLS), VidaPulse wraps it in an analytics player, and you embed it with one line of script or a script-free iframe on your own page.</p>
<p>To connect retention to sign-ups you get:</p>
<ul class="kb-list"><li>The <strong>audience-retention curve and average watch time</strong> — how far viewers get toward the ask.</li>
<li>The <strong>percentage of viewers who reach any point</strong> — reach-to-CTA, the ceiling on sign-ups.</li>
<li><strong>Conversion and CTA tracking</strong> (Pro) — how many who reach the ask actually start a trial.</li>
<li><strong>UTM and source attribution</strong> — whether a low reach-to-CTA is one channel or all of them.</li>
<li>The <strong>second-by-second heatmap</strong> (Pro) — the exact drop costing you reach.</li></ul>
<p>You can start free — one video, free forever, no card — with conversion tracking and heatmaps on Pro at nineteen dollars a month. No personal data is collected. Create a free VidaPulse account and see where your demo or product video loses viewers before they sign up.</p>`,
  faq: [
    {
      q: `Does higher retention guarantee more sign-ups?`,
      a: `It raises the ceiling, not a guarantee. Retention determines how many viewers reach the CTA, which is the precondition for a sign-up. If more viewers reach the ask and the offer holds up, sign-ups rise. If many reach it but few act, the fix shifts to the ask itself — which is why conversion tracking sits alongside the retention curve.`,
    },
    {
      q: `What retention metric matters most for sign-ups?`,
      a: `Reach-to-CTA: the percentage of viewers who reach the moment you ask them to start a trial. It is the most direct link to sign-ups because only those viewers can respond to the offer. Pair it with the retention curve to see where the run-up loses people and with conversion tracking to see how many of those who reach the ask act.`,
    },
    {
      q: `How do I tell if my problem is the video or the offer?`,
      a: `Compare reach-to-CTA with conversion among those who reach it. If few viewers reach the CTA, the video's run-up is leaking and retention is the fix. If many reach it but few sign up, the offer or the ask needs work. The two have opposite solutions, and VidaPulse measures both so you act on the right one.`,
    },
  ],
};
