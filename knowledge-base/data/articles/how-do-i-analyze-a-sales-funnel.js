'use strict';

module.exports = {
  metaTitle: `How do I analyze a sales funnel? | VidaPulse`,
  metaDescription: `Analyze a sales funnel by mapping its steps, finding the stage with the worst drop, then zooming into the video step second by second to fix the real leak.`,
  answer: `To analyze a sales funnel, map its steps in order — traffic, video, offer, and booking or checkout — then measure how many people clear each step so you can see where the largest drop happens. The point is to find the one stage that loses the most people, not to optimize everything at once. In funnels built on video, that worst drop is usually the video step, where the pitch is made and attention quietly breaks. Once you have found the leaking step, zoom into the video second by second to see exactly where viewers leave and why.`,
  sections: [
    {
      h2: `Why you analyze a funnel step by step`,
      html: `<p>Analyzing a sales funnel is not about staring at the final conversion number and hoping for an explanation. A funnel is a sequence of stages, and people drop out between them, so the only way to understand a low result is to break the journey into steps and watch the narrowing at each one. The gap between two stages is a drop-off, and the largest gap is your leak.</p>
<p>This matters because effort is finite. If you try to improve the whole funnel at once, you spread changes thin and learn nothing about cause and effect. A step-by-step analysis points you to the single stage doing the most damage, so one focused fix can move the whole result. The method below is a loop: map the steps, find the worst drop, zoom into it, change one thing, and measure again.</p>`,
    },
    {
      h2: `Step one: map your funnel in order`,
      html: `<p>Before you can find a leak, you need the stages written down in the order a prospect passes through them. For a funnel that sells with video, the backbone is almost always the same:</p>
<ol><li><strong>Traffic</strong> — the clicks, ad visits, or referrals that land on the page where your video lives.</li>
<li><strong>The video</strong> — the VSL, demo, or product video that carries the pitch and does the persuading.</li>
<li><strong>The offer</strong> — the call to action, price reveal, or booking prompt the video leads into.</li>
<li><strong>The booking or checkout</strong> — the booked call, sign-up, or purchase that completes the funnel.</li></ol>
<p>Write down a count for each step: how many arrive, how many advance. Even rough numbers expose the shape of the funnel. You are looking for where a large number entering a stage shrinks to a small number leaving it — that contrast is the whole point of mapping.</p>`,
    },
    {
      h2: `Step two: find the step with the worst drop`,
      html: `<p>With the stages mapped, compare the transition between each pair. The worst drop is the largest percentage loss from one step to the next, not the smallest absolute number at the end. A funnel can have plenty of traffic and a strong offer and still convert almost no one, simply because one stage in the middle is collapsing.</p>
<p>Resist the instinct to blame the most visible step. Teams often rewrite the offer or redesign the booking page because those are easy to see, when the real loss is happening earlier. The discipline of funnel analysis is to follow the numbers to the stage with the steepest drop, even when it is not the stage you expected.</p>
<p class="kb-example">Hypothetical: imagine 1,000 visitors reach your video page and 25 book a call. It is tempting to fix the booking page. But if only 70 of those 1,000 ever reach the part of the video where you make the offer, the booking page was never the problem — the video lost the overwhelming majority of viewers before the ask. The worst drop is the video step.</p>`,
    },
    {
      h2: `Step three: zoom into the video step`,
      html: `<p>When the worst drop is the video — as it usually is in a video funnel — a single step-level number is not enough. "People leave during the video" is a symptom, not a cause. You need to see <em>where</em> inside the video they leave, because the fix for an early exit is different from the fix for a pre-offer exit.</p>
<p>This is where you change resolution. Instead of treating the video as one step, treat it as a small funnel of its own and read it second by second:</p>
<ul class="kb-list"><li>The <strong>audience-retention curve</strong> shows the percentage still watching at each moment, so steep cliffs reveal where attention breaks.</li>
<li>The <strong>percentage of viewers reaching any point</strong> tells you how many actually arrive at the offer.</li>
<li>A <strong>second-by-second heatmap</strong> resolves a drop to a specific second, so you can tie it to the exact sentence or visual that lost people.</li></ul>
<p>The combination turns "the video is leaking" into "viewers fall off a cliff at the forty-second mark, right before the proof," which is a problem you can actually edit.</p>`,
    },
    {
      h2: `Step four: fix one thing and re-measure`,
      html: `<p>Funnel analysis is only useful if it ends in a change you can verify. Once you have located the steepest drop inside the video, make a single edit aimed at that one moment — tighten the slow setup, sharpen the hook, smooth the transition into the offer — then republish and compare the new retention curve against the old one.</p>
<p>Change one thing at a time so cause and effect stay legible. If the cliff shrinks, you found the right problem; if it does not move, you found the wrong cause and learned something cheap. Then return to the top of the loop: re-check which step now has the worst drop, because once the video improves, the leak may move to the offer or the booking step, and the analysis starts again on the new weakest link.</p>`,
    },
  ],
  solve: `<p>VidaPulse is built for step three, the part of funnel analysis most tools cannot do: reading the video step second by second. You paste any video URL from wherever it already lives — YouTube, Amazon S3, Google Drive, Dropbox, OneDrive, Azure Blob, Loom, a Zoom recording, Vimeo, or a direct MP4 or HLS file — and VidaPulse wraps it in an analytics player you embed with one line of script or a script-free iframe. There is no re-hosting and no second upload.</p>
<p>Once it is embedded, analyzing the video step becomes the loop described above:</p>
<ul class="kb-list"><li>The <strong>audience-retention curve</strong> and <strong>average watch time</strong> reveal the steepest drops on your real viewers.</li>
<li>The <strong>percentage of viewers reaching any point</strong> confirms how many actually arrive at your offer.</li>
<li>The <strong>second-by-second heatmap</strong> (Pro) pinpoints the exact second a drop begins, and <strong>viewer-level history</strong> (Pro) separates first watches from replays.</li>
<li><strong>UTM source attribution</strong> lets you compare traffic sources by behavior, and <strong>conversion and CTA tracking</strong> (Pro) connects watching to the booked call or checkout.</li></ul>
<p>Because the tracking lives in the embedded player, you measure the video on the real page where your funnel runs, not just on the platform that hosts the file. Start free with one video to find your funnel's video leak; the Free plan is free forever with no card, Starter (10 dollars/mo) covers ten videos, and Pro (19 dollars/mo) unlocks unlimited videos, heatmaps, viewer-level history, segmentation, and conversion tracking. No personal data is collected.</p>`,
  faq: [
    {
      q: `What is the first step in analyzing a sales funnel?`,
      a: `Map the funnel's stages in the order a prospect passes through them — for a video funnel, that is traffic, the video, the offer, and the booking or checkout — and write down how many people enter and leave each stage. Mapping comes first because you cannot find a leak until you can see the transition between every pair of steps.`,
    },
    {
      q: `How do I know which funnel step to fix first?`,
      a: `Fix the step with the worst drop — the largest percentage loss from one stage to the next — rather than the most visible or the last one. Follow the numbers even when the leaking stage is not the one you expected. In video funnels the worst drop is usually the video step, where the pitch is made and most viewers leave before reaching the offer.`,
    },
    {
      q: `Why isn't an overall conversion rate enough to analyze a funnel?`,
      a: `An overall conversion rate is a single number at the end that hides where people actually fell out. It cannot tell you whether the loss is in the traffic, the video, the offer, or the checkout. To analyze a funnel you need step-by-step transitions, and for the video step you need second-by-second retention so you can see the exact moment attention breaks.`,
    },
  ],
};
