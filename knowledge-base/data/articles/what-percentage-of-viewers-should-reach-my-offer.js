'use strict';

module.exports = {
  metaTitle: `What % of viewers should reach my offer? | VidaPulse`,
  metaDescription: `The percentage of viewers who reach your offer is the metric that predicts VSL sales. There is no fixed target — measure it on your video, then raise it.`,
  answer: `There is no fixed percentage you should hit — anyone quoting one is guessing, because it depends on your traffic, length, and offer. The right way to think about it: the percentage of viewers who reach your offer is the single metric that best predicts sales, so the goal is not to match a benchmark but to measure your own number and steadily raise it. Read your audience-retention curve at the second your offer begins, treat that figure as your scoreboard, and improve it version over version.`,
  sections: [
    {
      h2: `Why this metric predicts sales`,
      html: `<p>Almost nobody buys before they hear the offer. That makes the percentage of viewers who reach your offer a leading indicator of revenue in a way that total views or even overall retention is not. Views tell you how many started; retention-to-the-end is interesting but often beside the point. The pool of people who could possibly convert is the pool who actually arrive at the ask — so growing that pool is one of the most direct levers you have on sales.</p>
<p>Put plainly: you can have a brilliant offer and still sell nothing if most viewers leave before they hear it. The offer cannot do its job for an audience that is not there.</p>`,
    },
    {
      h2: `Why there is no fixed target`,
      html: `<p>It is tempting to want a number — "good VSLs get X% to the offer." But the same factors that make overall retention uncomparable apply here:</p>
<ul class="kb-list"><li><strong>Traffic temperature.</strong> Warm traffic reaches the offer at much higher rates than cold ad traffic, which leaves freely.</li>
<li><strong>How far in the offer sits.</strong> An offer at 2:00 will be reached by more viewers than the same offer at 12:00, purely because of time.</li>
<li><strong>Audience and offer type.</strong> A quick B2C pitch and a considered B2B demo pull different behavior.</li></ul>
<p>Because these move together, a percentage that is excellent for one VSL is poor for another. A fixed target would be wrong for nearly everyone. The useful question is not "what number should I hit" but "what is my number, and is it going up."</p>`,
    },
    {
      h2: `How to measure your number`,
      html: `<p>Getting your offer-reaching percentage is straightforward once your VSL is in an analytics player:</p>
<ol><li><strong>Find the exact timestamp where your offer begins</strong> — the second you transition from teaching or proving into asking.</li>
<li><strong>Read your audience-retention curve at that point.</strong> The value there is the share of viewers who started the VSL and were still watching when the offer appeared. That is your number.</li>
<li><strong>Cross-check with the percentage-of-viewers-reaching-any-point report</strong> so you have a clean figure, not a guess from eyeballing the curve.</li></ol>
<p>Record it. From now on this is your scoreboard, and every edit to the VSL is an attempt to move it.</p>`,
    },
    {
      h2: `A worked example, clearly hypothetical`,
      html: `<p>Here is how raising the number translates into reach. The figures below are <strong>made up for illustration</strong>, not claims about typical performance.</p>
<p class="kb-example">Say 1,000 people press play on your VSL this month, and your offer begins at 4:00. Suppose your retention curve reads 30% at the 4:00 mark — so roughly 300 of those 1,000 viewers actually hear the offer; the other 700 leave before it. Now suppose you tighten the section right before the offer and the curve at 4:00 rises to 40%. On the same 1,000 plays, that is roughly 400 viewers reaching the offer instead of 300 — a third more qualified eyes on your ask, from a single edit, with no extra traffic.</p>
<p>That is the whole argument for treating this as your scoreboard: a 10-point move on a percentage is a large move in the count of people who could buy.</p>`,
    },
    {
      h2: `Measure it, then raise it`,
      html: `<p>Once you have your baseline percentage, improving it is a repeatable loop:</p>
<ol><li><strong>Find the steepest drop before the offer.</strong> That is where you are losing the most viewers who would otherwise reach the ask.</li>
<li><strong>Fix one thing.</strong> Either rewrite the section right before the offer or move the offer earlier — one change per round so you can attribute the result.</li>
<li><strong>Re-measure the percentage at the offer timestamp.</strong> If it rose, keep the edit; if not, revert and try the other lever.</li></ol>
<p>Repeat until the share reaching your offer is as high as you can push it. You are never chasing someone else's number — only beating your own last version.</p>`,
    },
  ],
  solve: `<p>VidaPulse measures the metric this whole question is about — the percentage of viewers who reach your offer — on your real video. You paste any video URL from wherever it already lives (YouTube, Amazon S3, Google Drive, Dropbox, OneDrive, Azure Blob, Loom, a Zoom recording, Vimeo, or a direct MP4/HLS), VidaPulse wraps it in an analytics player, and you embed it with one line of script or a script-free iframe on WordPress, Webflow, ClickFunnels, or custom HTML. No re-hosting; your video stays where it is.</p>
<p>To measure and raise your offer-reaching percentage:</p>
<ul class="kb-list"><li>The <strong>percentage of viewers who reach any point</strong> gives you the exact share who make it to your offer timestamp — your scoreboard.</li>
<li>The <strong>audience-retention curve</strong> shows the steep drop right before the offer, so you know which section to fix to raise the number.</li>
<li>The <strong>second-by-second engagement heatmap</strong> (Pro) pins the exact line where pre-offer viewers bail.</li>
<li><strong>Conversion and CTA tracking</strong> (Pro) connects the viewers who reach the offer to whether they actually act on it.</li></ul>
<p>Because the analytics live in the embedded player, you measure all of this on the real sales page where your VSL runs. Unique viewers are counted with a first-party cookie or localStorage ID, and no personal data is collected. To start, create a free VidaPulse account, wrap your own VSL, and read the curve at your offer timestamp to find the percentage you are starting from — then raise it.</p>`,
  faq: [
    {
      q: `Is there a target percentage of viewers who should reach the offer?`,
      a: `No fixed target exists, because the percentage depends on your traffic temperature, how far into the video the offer sits, and your audience and offer type. A figure that is excellent for one VSL is poor for another. The goal is to measure your own number and raise it version over version, not to match a benchmark.`,
    },
    {
      q: `Why is reaching the offer a better metric than total views?`,
      a: `Almost nobody buys before they hear the offer, so the pool of people who could convert is the pool who actually reach the ask — not the pool who pressed play. Total views count people who may have left in the first seconds. The offer-reaching percentage is a leading indicator of sales because it measures the audience your offer can actually work on.`,
    },
    {
      q: `How do I raise the percentage who reach my offer?`,
      a: `Find the steepest drop in your retention curve before the offer timestamp, then fix one thing — either tighten the section right before the offer or move the offer earlier. Re-measure the percentage at the offer point after each change. Keep edits that raise it and revert ones that do not, repeating until the share is as high as you can push it.`,
    },
  ],
};
