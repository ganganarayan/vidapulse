'use strict';

module.exports = {
  metaTitle: `How do SaaS teams A/B test product videos? | VidaPulse`,
  metaDescription: `SaaS teams A/B test product videos by comparing versions on retention, reach-to-CTA, and trial starts — then keeping the winner and running the loop again.`,
  answer: `SaaS teams A/B test product videos by running two versions of the same video, sending comparable traffic to each, and comparing them on the metrics that actually predict sign-ups: retention, reach-to-CTA, and trial starts. The goal is not which version looks better but which one moves more viewers to the trial ask and into the funnel. Because each version is its own analytics player, you can read both curves side by side and keep the one that wins — then run the loop again on the winner.`,
  sections: [
    {
      h2: `Decide what you are testing`,
      html: `<p>A useful A/B test changes one thing. If version B has a new opening, a shorter middle, and a different CTA all at once, a difference in results tells you nothing about which change caused it. Pick a single hypothesis — a faster opening, a tighter feature section, a clearer trial ask, a different CTA placement — and make version B differ from version A only there.</p>
<p>Then decide what "winning" means before you look. For a product video that drives sign-ups, the meaningful outcomes are reach-to-CTA and trial starts, not raw views or even average watch time on its own. A version that holds attention but never gets viewers to the ask is not the winner.</p>`,
    },
    {
      h2: `Compare versions on the right metrics`,
      html: `<p>Each version gets wrapped in its own analytics player, so you have two independent sets of metrics to compare on equal footing. Read them in this order:</p>
<ul class="kb-list"><li><strong>Retention curve</strong> — where does each version hold viewers and where does each lose them? The shapes show you why one is winning, not just that it is.</li>
<li><strong>Reach-to-CTA</strong> — what share of each version's viewers reach the trial ask? This is the closest leading indicator of sign-ups.</li>
<li><strong>Trial starts</strong> — with conversion and CTA tracking, how many viewers of each version actually start a trial?</li></ul>
<p>Average watch time and play rate add context, but the decision rests on which version gets more viewers to the ask and into a trial. If one version wins on reach-to-CTA but loses on trials, the curve and conversion data together tell you whether the run-up or the ask is responsible.</p>`,
    },
    {
      h2: `Keep the comparison fair`,
      html: `<p>An A/B test is only trustworthy if the two versions face comparable conditions. A few things keep it honest:</p>
<ol><li><strong>Comparable traffic</strong> — send similar audiences to each version. With UTM and source attribution you can confirm both versions saw the same mix of channels rather than one getting warmer traffic.</li>
<li><strong>Enough viewers</strong> — let each version accumulate enough plays that a difference is signal, not noise. A handful of views on each is not a test.</li>
<li><strong>Same ask</strong> — unless the CTA itself is what you are testing, keep the trial ask identical so the difference you measure is the change you made.</li></ol>
<p>When traffic, volume, and the ask are matched, a gap in reach-to-CTA or trial starts is something you can act on with confidence.</p>`,
    },
    {
      h2: `Run the loop`,
      html: `<p>A/B testing product videos is not a single contest — it is a loop that compounds. Each test ends by promoting the winner and asking the next question of it.</p>
<ol><li><strong>Test</strong> one change between version A and version B.</li>
<li><strong>Compare</strong> on retention, reach-to-CTA, and trial starts.</li>
<li><strong>Keep</strong> the winner as your new baseline.</li>
<li><strong>Find the next weakness</strong> in the winner's curve and test a change there.</li></ol>
<p class="kb-example">Hypothetical: suppose version A reads 25% at the trial ask and version B, with a tighter opening, reads 38% on comparable traffic — and trial starts rise in proportion. Version B becomes the baseline. The team then reads B's curve, spots a new mid-video drop, and tests a version C against B that targets it. The numbers are illustrative, but the discipline is the point: each round keeps the proven change and attacks the next leak, so the video gets steadily better at producing sign-ups.</p>`,
    },
  ],
  solve: `<p>VidaPulse makes A/B testing product videos straightforward, without re-hosting and without code. You paste each version's existing URL (YouTube, Amazon S3, Google Drive, Dropbox, OneDrive, Azure Blob, Loom, a Zoom recording, Vimeo, or a direct MP4/HLS), VidaPulse wraps each in its own analytics player, and you embed them with one line of script or a script-free iframe on the pages you are testing.</p>
<p>To compare versions you get, for each one:</p>
<ul class="kb-list"><li>The <strong>audience-retention curve and average watch time</strong> — where each version holds and loses viewers.</li>
<li>The <strong>percentage of viewers who reach any point</strong> — reach-to-CTA, the leading indicator of sign-ups.</li>
<li><strong>Conversion and CTA tracking</strong> (Pro) — trial starts per version, the outcome that decides the winner.</li>
<li><strong>UTM and source attribution</strong> — confirmation that both versions saw comparable traffic.</li>
<li>The <strong>second-by-second heatmap</strong> (Pro) — the exact seconds where one version beats the other.</li></ul>
<p>You can start free — one video, free forever, no card — with conversion tracking and heatmaps on Pro at nineteen dollars a month, and unlimited videos on Pro for running many tests at once. No personal data is collected. Create a free VidaPulse account and start comparing your product video versions on the metrics that predict trials.</p>`,
  faq: [
    {
      q: `Which metric should decide the winner of a video A/B test?`,
      a: `Trial starts, with reach-to-CTA as the leading indicator. A version that holds attention but does not get viewers to the ask is not the winner. Read the retention curves to understand why one version wins, but base the decision on which gets more viewers to the trial ask and into a trial — measured by reach-to-CTA and conversion tracking.`,
    },
    {
      q: `How do I keep the test fair between two versions?`,
      a: `Change one thing between the versions, send comparable traffic to each, and let both accumulate enough viewers that a difference is signal rather than noise. UTM and source attribution let you confirm both versions saw a similar channel mix, so a gap in reach-to-CTA or trial starts reflects the change you made, not a traffic difference.`,
    },
    {
      q: `Can I run more than one video test at a time?`,
      a: `Yes. Pro includes unlimited videos, so you can run several A/B tests across different pages at once, each version wrapped in its own analytics player. You paste each version's existing URL and embed it with one line of script or a script-free iframe — nothing is re-hosted, and each version reports its own retention, reach-to-CTA, and trial starts.`,
    },
  ],
};
