'use strict';

module.exports = {
  metaTitle: `Why do viewers leave before seeing the price? | VidaPulse`,
  metaDescription: `Viewers leave before the price when the value wasn't built or the run-up dragged. See the percentage reaching the offer and fix the section before it.`,
  answer: `Viewers leave before seeing the price for one of two reasons: the value was never built strongly enough to make them want the price, or the run-up to it dragged and lost them along the way. Either way you get a cliff in the retention curve just before the price reveal — a pre-price drop where your warmest viewers leave one step short of the ask. The fix starts with one number: the percentage of viewers who actually reach the price. Read your retention curve at that timestamp, find the drop right before it, and fix the section that comes ahead of the price.`,
  sections: [
    {
      h2: `The pre-price drop is a specific, costly cliff`,
      html: `<p>When viewers leave before the price, it rarely happens evenly across the video. It shows up as a <strong>cliff in the retention curve just before the price reveal</strong> — a sharp fall in the seconds leading up to the moment you state the number. That cliff is the pattern you are looking for.</p>
<p>It is also the most expensive cliff you have. A viewer who leaves here watched almost the whole video, followed your argument, and was a single step from hearing the offer — then left. You paid for everything that came before that exit and got nothing for it. That is why the pre-price drop deserves attention out of proportion to its size.</p>`,
    },
    {
      h2: `Reason one: the value wasn't built`,
      html: `<p>The first cause is that the price arrives before the viewer wants it. Price only feels reasonable in proportion to perceived value, so if the video hasn't yet made the case — hasn't shown the outcome, the proof, or the reason this is worth paying for — the moment the conversation turns to money, viewers sense a pitch they aren't ready for and leave.</p>
<p>You can spot this on the curve: the drop sits right at or just before the price reveal, and viewers leave the instant the tone shifts toward the ask. The fix is not to hide the price — it is to strengthen the value-building section that precedes it, so that by the time the number appears, the viewer is asking "how much?" rather than looking for the exit.</p>`,
    },
    {
      h2: `Reason two: the run-up dragged`,
      html: `<p>The second cause is pacing. Even when the value is there, a long, slow run-up bleeds viewers before they ever reach the price. A repeated point, a tangent, a stretch that asks for patience without giving a reason to keep watching — each one peels off a few more people, and by the time the price arrives the audience has thinned.</p>
<p>This shows up as a steeper-than-normal decline across the section <em>before</em> the price, rather than a single sharp wall right at it. The fix is to tighten that run-up: cut what drags, keep the forward pull, and shorten the distance between value and price so more viewers survive to hear the number.</p>`,
    },
    {
      h2: `Measure the percentage who reach the price`,
      html: `<p>Before theorizing, measure. The number that turns this from a feeling into a metric is the <strong>percentage of viewers who reach any point</strong> — read at the exact second your price appears.</p>
<ol><li><strong>Find the timestamp</strong> where you state the price or open the offer.</li>
<li><strong>Read the retention curve at that point.</strong> The value there is the share of starters still watching when the price appeared.</li>
<li><strong>Treat that number as your scoreboard.</strong> Every change you make to the video is really an attempt to raise it.</li></ol>
<p>View counts cannot help here — they tell you how many pressed play, never how many survived to the price. Only the retention curve, read at the price timestamp, gives you this number.</p>
<p class="kb-example">Hypothetical illustration: if 1,000 viewers start and the curve reads 18% at your price reveal, only about 180 ever hear the number. Lifting that share is usually a bigger win than rewording the price itself.</p>`,
    },
    {
      h2: `Fix the section before the price, then re-measure`,
      html: `<p>The two causes have different fixes, so use the curve to tell them apart before you edit:</p>
<ol><li><strong>A sharp wall right at the price</strong> points to value not yet built — strengthen the proof and outcome in the section immediately before it.</li>
<li><strong>A steeper-than-normal slope across the run-up</strong> points to pacing — tighten that stretch and move the price closer.</li>
<li><strong>Change one thing,</strong> republish, and run real traffic until the curve stabilizes.</li>
<li><strong>Compare the new percentage-reaching number to the old.</strong> If more viewers now reach the price, keep the change; if not, revert and try the other lever.</li></ol>
<p>Use a second-by-second engagement heatmap (a Pro feature) to pin the exact line where viewers bail, so your edit lands on the real culprit rather than a guess.</p>`,
    },
  ],
  solve: `<p>VidaPulse measures the exact thing this question turns on — how many viewers reach your price, and where the ones who don't are leaving. You paste any video URL from wherever it already lives (YouTube, Amazon S3, Google Drive, Dropbox, OneDrive, Azure Blob, Loom, a Zoom recording, Vimeo, or a direct MP4/HLS), VidaPulse wraps it in an analytics player, and you embed it with one line of script or a script-free iframe. No re-hosting — your video stays where it is.</p>
<p>Then the diagnosis becomes concrete:</p>
<ul class="kb-list"><li>The <strong>percentage of viewers who reach any point</strong> gives you the share who make it to your price reveal — your scoreboard.</li>
<li>The <strong>audience-retention curve</strong> shows whether the drop is a sharp wall at the price (value not built) or a steep slope across the run-up (pacing).</li>
<li>The <strong>second-by-second engagement heatmap</strong> (Pro) pins the exact line where viewers bail before the number.</li>
<li><strong>Conversion and CTA tracking</strong> (Pro) ties the price moment to whether the viewers who reach it act on it.</li></ul>
<p>Because the analytics live in the embedded player, you measure all of this on the actual sales page where your VSL runs. No personal data is collected. Create a free VidaPulse account, wrap your own VSL, and read the curve at your price timestamp to see how many viewers reach it — and where the rest go.</p>`,
  faq: [
    {
      q: `Should I just reveal the price earlier so more people see it?`,
      a: `Only if the cause is pacing, not value. If viewers leave because the value wasn't built, showing the price sooner makes the problem worse — they hit the number before they want it. Read the retention curve: a steep run-up slope means tighten the pacing and move the price closer; a sharp wall right at the price means strengthen the value-building section first.`,
    },
    {
      q: `How do I see how many viewers reach my price?`,
      a: `Read the percentage of viewers who reach any point at the exact second your price appears. It is the share of people who started the video and were still watching when the number showed up. View counts cannot tell you this — they only count who pressed play. The retention curve, read at the price timestamp, is the only way to get it.`,
    },
    {
      q: `Why is the drop before the price worse than an early drop?`,
      a: `Because those viewers came the furthest. Someone who leaves just before the price watched most of the video and was closest to buying, so losing them wastes everything that came before. An early exit costs little because that viewer barely engaged. Recovering points right before the price puts your warmest, most-qualified viewers back in front of the offer.`,
    },
  ],
};
