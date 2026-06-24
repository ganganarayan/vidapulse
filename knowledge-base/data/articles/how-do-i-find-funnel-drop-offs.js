'use strict';

module.exports = {
  metaTitle: `How do I find funnel drop-offs? | VidaPulse`,
  metaDescription: `Find funnel drop-offs at two levels: which step loses the most people, then the exact moment inside the video where attention breaks, using the retention curve.`,
  answer: `Finding funnel drop-offs happens at two levels. First, find the step-level drop: compare how many people clear each stage of your funnel and locate the biggest gap between two steps. Second, when that biggest gap is the video — as it usually is in a video funnel — find the within-video drop by reading the retention curve and heatmap to pin the exact moment viewers leave. The step level tells you which stage leaks; the within-video level tells you precisely where and why. You need both to fix the right thing.`,
  sections: [
    {
      h2: `Two levels of drop-off`,
      html: `<p>There are two different things people mean by a "drop-off," and confusing them leads to the wrong fix. The first is a <strong>step-level drop-off</strong>: people who reach one stage of your funnel but never advance to the next. The second is a <strong>within-video drop-off</strong>: people who start your video but leave before reaching the end or the offer inside it.</p>
<p>Step-level drop-off tells you <em>which stage</em> is leaking. Within-video drop-off tells you <em>where inside that stage</em> the leak is. You find them in that order, because there is no point pinpointing the exact second of a video that is not actually your biggest problem. First narrow to the leaking step; then zoom into it.</p>`,
    },
    {
      h2: `Finding the step-level drop-off`,
      html: `<p>To find the leaking step, lay out your funnel in order and put a count on each stage. For a funnel that sells with video, the stages are usually traffic, the video, the offer, and the booking or checkout. Then compare the transition between each pair and look for the largest percentage loss — that gap is your biggest step-level drop-off.</p>
<p>The rule is to read percentages, not raw totals, and to follow them even when the leaking step surprises you. A funnel can have strong traffic and a strong offer and still convert almost no one because one stage in the middle collapses. The most visible step is rarely the guilty one; the numbers point to the real leak.</p>
<p class="kb-example">Hypothetical: 1,000 visitors reach your video page, and 20 book a call. Before blaming the booking page, check how many reached the offer inside the video. If only 60 of the 1,000 ever got that far, the video step is the biggest drop-off by a wide margin, and the booking page was never the issue.</p>`,
    },
    {
      h2: `Why the video step needs a closer look`,
      html: `<p>When the biggest step-level drop-off is the video — the common case in a video funnel — a single number cannot tell you what to do. "People leave during the video" is true but useless on its own, because the cause of an early exit is completely different from the cause of a pre-offer exit, and the edits are different too.</p>
<p>This is where raw view counts fail you. Total views, unique viewers, and play rate tell you how many people started; they say nothing about <em>when</em> people left. Two videos with identical view counts can hold almost everyone or lose most viewers in the first ten seconds. To find a within-video drop-off you need a measure that tracks attention across the timeline, which view counts simply do not provide.</p>`,
    },
    {
      h2: `Finding the exact moment inside the video`,
      html: `<p>Within-video drop-off is found with two tools that work together, from rough to precise:</p>
<ol><li><strong>Read the audience-retention curve.</strong> The curve plots the percentage of viewers still watching at each second. It only goes down or holds flat, so every downward step records people quitting at that moment. Run your eye across it and ignore the gentle, even slope — that is normal attrition. Look for the steep cliffs, the near-vertical falls where many viewers leave in a short span. Those are your drop-off points.</li>
<li><strong>Cross-check with a second-by-second heatmap.</strong> The curve points you to roughly where a drop is; the heatmap (a Pro feature) resolves it to the exact second, so you can tie the bleed to a specific sentence or visual instead of a vague region.</li></ol>
<p>Then classify what you find. A cliff at the very start usually points to a slow intro or an ad-to-video mismatch. A cliff in the body usually means a stretch that drags. A cliff right before the offer is the most costly, because those viewers came the furthest and were closest to converting. Naming the type turns "people leave" into a specific, fixable question.</p>`,
    },
    {
      h2: `Why native analytics rarely show the within-video drop`,
      html: `<p>If your video lives on a VSL page or a landing page, the analytics built into the host platform will usually let you down for two reasons. First, <strong>scope</strong>: a platform's retention report only covers watches on that platform, so it does not follow your embed onto your own page, and an MP4 in cloud storage is invisible to it entirely. Second, <strong>resolution</strong>: native reports tend to be coarse and aggregate — fine for a rough sense of retention, but not enough to pin a drop to the exact second on the page that actually matters.</p>
<p>To find a within-video drop-off on the page where your funnel really runs, you need a tool that tracks the specific embedded player wherever it lives, at second-level resolution. That is the gap between knowing the video step leaks and knowing the exact moment it leaks.</p>`,
    },
  ],
  solve: `<p>VidaPulse finds funnel drop-offs at the level where view counts go silent: inside the video, on the real page where your funnel runs. You paste any video URL from wherever it already lives — YouTube, Amazon S3, Google Drive, Dropbox, OneDrive, Azure Blob, Loom, a Zoom recording, Vimeo, or a direct MP4 or HLS file — and VidaPulse wraps it in an analytics player you embed with one line of script or a script-free iframe. There is no re-hosting and no second upload.</p>
<p>From there, both levels of drop-off come into view:</p>
<ul class="kb-list"><li>The <strong>percentage of viewers reaching any point</strong> shows the step-level drop — how many actually arrive at your offer inside the video.</li>
<li>The <strong>audience-retention curve</strong> and <strong>average watch time</strong> mark the steepest within-video drops on your real viewers, so you see the cliffs instead of guessing.</li>
<li>The <strong>second-by-second heatmap</strong> (Pro) pinpoints the exact second a drop begins, and <strong>viewer-level history</strong> (Pro) separates first watches from replays.</li>
<li><strong>UTM source attribution</strong> lets you check whether a particular traffic source drops off harder, so you can compare channels by behavior, not just volume.</li></ul>
<p>Because the tracking lives in the embedded player, you measure drop-off on the page where your VSL or product video really runs, not just on the platform that hosts the file. No personal data is collected. Start on the Free plan with one video to find your own drop-off points; the second-level heatmap is on Pro (19 dollars/mo), Starter (10 dollars/mo) covers ten videos, and the Free plan is free forever with no card. Create a free account and find your funnel's video leak.</p>`,
  faq: [
    {
      q: `What is the difference between a step-level and a within-video drop-off?`,
      a: `A step-level drop-off is people who reach one stage of the funnel but never advance to the next, which tells you which stage is leaking. A within-video drop-off is people who start the video but leave before reaching the end or the offer inside it, which tells you where inside that stage the leak is. Find the step-level drop first, then zoom into the video.`,
    },
    {
      q: `Can I find funnel drop-offs from view counts alone?`,
      a: `No. Total views, unique viewers, and play rate tell you how many people started, not when they left. Two videos with identical view counts can hold almost everyone or lose most viewers in seconds. To find a within-video drop-off you need an audience-retention curve that tracks the percentage still watching across the timeline, plus a second-level heatmap to pin the exact moment.`,
    },
    {
      q: `Why don't native platform analytics show my biggest drop-off?`,
      a: `Native analytics have two gaps. Their scope is limited to watches on the host platform, so they do not follow your embed onto a VSL or landing page. And their resolution is coarse and aggregate, so they cannot pin a drop to the exact second on your own page. To find drop-off where your funnel actually runs, you need a tool that tracks the specific embedded player at second-level detail.`,
    },
  ],
};
