'use strict';

module.exports = {
  metaTitle: `How do SaaS teams choose the right demo video length? | VidaPulse`,
  metaDescription: `SaaS teams let retention decide demo length — read the curve, find where it drops, and trim there. Measure the right length with no re-hosting and no code.`,
  answer: `SaaS teams choose the right demo video length by letting the audience-retention curve decide rather than guessing a target time. The right length is wherever the curve still holds attention up to your sign-up ask — so you read where viewers actually drop and trim the video to end before or at that point. With VidaPulse you read the curve and reach-to-CTA on a demo embedded anywhere, with no re-hosting and no code, so length becomes a measured decision.`,
  sections: [
    {
      h2: `There is no universal "right" length`,
      html: `<p>Advice about ideal demo length usually comes as a single number — keep it under two minutes, or under ninety seconds. The trouble is that a number cannot know your product, your audience, or where your demo gets compelling. A tight ninety-second demo that loses everyone at second forty is worse than a longer one that holds attention to the ask.</p>
<p>The right length is not a target you pick in advance; it is something your viewers tell you. The retention curve is that signal. It shows exactly how long attention lasts in your specific demo, which is the only length that actually matters.</p>`,
    },
    {
      h2: `Let the retention curve set the length`,
      html: `<p>The audience-retention curve is the share of viewers still watching at every second. Read for length, it answers the only question that counts: how long do viewers stay before they start leaving in numbers?</p>
<ul class="kb-list"><li><strong>Flat stretches</strong> are minutes that earn their place — viewers are still with you.</li>
<li><strong>A long, slow tail</strong> where almost no one is left is runtime you are paying for and few are watching.</li>
<li><strong>A steep cliff</strong> is a point viewers reject; runtime past a late cliff is usually wasted.</li></ul>
<p>The right length lives where the curve still has meaningful audience through your sign-up ask. If most viewers are gone well before the end, the demo is longer than its content justifies — and the curve shows you the second to aim for.</p>`,
    },
    {
      h2: `Trim where the curve drops, not by a target`,
      html: `<p>Once the curve shows where attention fades, length becomes an editing decision, not a guess. The aim is to keep the stretches that hold attention and cut the ones viewers abandon.</p>
<ol><li><strong>Find the last point</strong> the curve still holds a healthy share of viewers.</li>
<li><strong>Check reach-to-CTA</strong> — make sure your sign-up ask sits inside that held attention, not out in the abandoned tail.</li>
<li><strong>Cut or compress</strong> the low-retention stretches between the strong opening and the ask.</li></ol>
<p class="kb-example">Hypothetical: suppose your demo runs three minutes but the curve shows most viewers gone by the two-minute mark, with your CTA at two-forty. The fix is not "make it shorter" in the abstract — it is to compress the weak stretch around 1:40 and pull the CTA earlier, so the ask lands while viewers are still watching. Length follows the curve.</p>`,
    },
    {
      h2: `Measure length on the demo where it lives`,
      html: `<p>You do not need to move your demo or rebuild the page to read its length signal. The curve comes with the embedded player.</p>
<ol><li><strong>Take the demo's existing URL</strong> — YouTube, Amazon S3, Google Drive, Dropbox, OneDrive, Azure Blob, Loom, a Zoom recording, Vimeo, or a direct MP4/HLS link.</li>
<li><strong>Wrap it in an analytics player</strong> by pasting that URL into VidaPulse. Nothing is re-hosted.</li>
<li><strong>Embed it</strong> with one line of script or a script-free iframe on the page it already lives on, then read the curve, average watch time, and reach-to-CTA.</li></ol>
<p>After you trim, republish on the same host and the embed keeps working, so you can compare the new curve against the old and confirm the shorter cut holds more viewers to the ask. On Pro, the second-by-second heatmap pins the exact moment attention fades, making the trim precise.</p>`,
    },
  ],
  solve: `<p>VidaPulse lets SaaS teams choose the right demo video length by measurement, not by a target time, without re-hosting and without code. You paste the demo's existing URL (YouTube, Amazon S3, Google Drive, Dropbox, OneDrive, Azure Blob, Loom, a Zoom recording, Vimeo, or a direct MP4/HLS), VidaPulse wraps it in an analytics player, and you embed it with one line of script or a script-free iframe on the page it already lives on.</p>
<p>To let retention decide the length you get:</p>
<ul class="kb-list"><li>The <strong>audience-retention curve and average watch time</strong> — how long attention actually lasts in your demo.</li>
<li>The <strong>percentage of viewers who reach any point</strong> — reach-to-CTA, so you can keep the ask inside held attention.</li>
<li><strong>Replays versus first watches</strong> — the sections worth keeping because viewers return to them.</li>
<li>The <strong>second-by-second engagement heatmap</strong> (Pro) — to pin the exact second attention fades so you trim the right stretch.</li>
<li><strong>Viewer-level history</strong> (Pro) — to see how individual viewers moved through before they left.</li></ul>
<p>You can start free — one video, free forever, no card — with heatmaps and viewer-level history on Pro at nineteen dollars a month. No personal data is collected, and you can restrict the player to your own domains. Create a free VidaPulse account, wrap your demo, and let the curve tell you how long it should be.</p>`,
  faq: [
    {
      q: `Is there an ideal demo video length?`,
      a: `Not a universal one. The right length is wherever your retention curve still holds a meaningful share of viewers through your sign-up ask. A demo that loses most viewers early is too long regardless of its runtime, while one that holds attention to the end may earn extra minutes. VidaPulse shows you the curve so the length fits your actual demo.`,
    },
    {
      q: `How do I know which part to trim?`,
      a: `Read the retention curve for the stretches where viewers leave in numbers — the low-retention sections between a strong opening and your CTA. Trim or compress those, not the flat stretches that hold attention. On Pro, the second-by-second heatmap pins the exact second attention fades so the cut is precise.`,
    },
    {
      q: `Can I confirm a shorter demo actually performs better?`,
      a: `Yes. Save the original retention curve as a baseline, trim the demo, republish on its existing host — nothing is re-hosted, so the same embed keeps working — and re-measure on new traffic. Compare the new curve and reach-to-CTA against the baseline to confirm the shorter cut holds more viewers to the ask.`,
    },
  ],
};
