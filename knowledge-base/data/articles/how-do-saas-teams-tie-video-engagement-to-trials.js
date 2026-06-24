'use strict';

module.exports = {
  metaTitle: `How do SaaS teams tie video engagement to trials? | VidaPulse`,
  metaDescription: `SaaS teams tie video engagement to trials by connecting reach-to-CTA and CTA clicks to trial starts with conversion tracking and UTM source attribution.`,
  answer: `SaaS teams tie video engagement to trials by connecting two things they can already measure — how many viewers reach the in-video CTA and how many click it — to the trial starts that follow, using conversion tracking and UTM source attribution. The chain is direct: viewers watch, some reach the ask, some click, and some of those start a trial. When each step is measured, you can see which videos and which traffic sources actually produce trials rather than just plays.`,
  sections: [
    {
      h2: `The chain from engagement to trial`,
      html: `<p>"Engagement" is only useful if it connects to an outcome. For a SaaS product video, that outcome is a trial start, and the path to it is a chain where every link is measurable:</p>
<ol><li><strong>Viewers press play</strong> — play rate, total and unique viewers.</li>
<li><strong>They watch toward the ask</strong> — the retention curve and average watch time.</li>
<li><strong>Some reach the CTA</strong> — reach-to-CTA, the share who hear the offer.</li>
<li><strong>Some click</strong> — CTA tracking on the in-video ask.</li>
<li><strong>Some start a trial</strong> — conversion tracking.</li></ol>
<p>When you can read the whole chain, you stop guessing whether the video "works." You can see exactly where viewers fall out — before the ask, at the click, or after — and which link is the one limiting trials.</p>`,
    },
    {
      h2: `Use conversion tracking to record the trial`,
      html: `<p>Reach-to-CTA tells you how many viewers heard the ask, but it does not by itself tell you how many acted. Conversion and CTA tracking close that gap. They record when a viewer clicks the in-video CTA and when the action you count as a conversion — a started trial — happens, so the trial is attributed back to the video that drove it.</p>
<p>This is what turns engagement into a number a SaaS team can defend. Instead of "the demo got a lot of views," you can say how many of those viewers reached the ask, how many clicked, and how many started a trial. Each of those is a different lever, and conversion tracking is what lets you tell them apart.</p>`,
    },
    {
      h2: `Use UTM source attribution to see which traffic converts`,
      html: `<p>Not all traffic behaves the same, and a single conversion number hides that. UTM and source attribution tag each viewer with the channel they came from, so you can read engagement and trials by source rather than as one blended figure.</p>
<p>That distinction is what makes the data actionable:</p>
<ul class="kb-list"><li><strong>By source, reach-to-CTA</strong> shows whether one channel sends viewers who watch and one sends viewers who bounce.</li>
<li><strong>By source, trial starts</strong> show which channels actually produce trials, not just plays.</li>
<li><strong>A mismatch between the two</strong> — high reach but low trials from a source, or the reverse — tells you whether the video or the audience is the issue for that channel.</li></ul>
<p>Without source attribution, a strong channel and a weak one average into a number that hides both. With it, you can put effort behind the traffic that turns video engagement into trials.</p>`,
    },
    {
      h2: `Putting it together`,
      html: `<p>The two tools work as a pair: conversion tracking measures whether engagement became a trial, and UTM attribution tells you for whom. Read together, they answer the question that matters — which video, watched by which audience, produces trials.</p>
<p class="kb-example">Hypothetical: suppose a product video gets 1,000 plays. Reach-to-CTA shows 30% — 300 viewers — get to the ask, CTA tracking shows 90 of them click, and conversion tracking shows 40 start a trial. Split by UTM, suppose most of those trials come from one source while another source drives plays but almost no trials. The conclusion is clear: the video converts the first audience well, and effort on the second is better spent on the audience or the message than on more plays. The numbers are illustrative, but the method is exact — every figure in that chain is something you can measure, so the conclusion rests on data, not a hunch.</p>`,
    },
  ],
  solve: `<p>VidaPulse ties your video engagement to trials without re-hosting and without code. You paste the video's existing URL (YouTube, Amazon S3, Google Drive, Dropbox, OneDrive, Azure Blob, Loom, a Zoom recording, Vimeo, or a direct MP4/HLS), VidaPulse wraps it in an analytics player, and you embed it with one line of script or a script-free iframe on whatever page the video lives on.</p>
<p>To connect engagement to trials you get:</p>
<ul class="kb-list"><li>The <strong>audience-retention curve and average watch time</strong> — how far viewers watch toward the ask.</li>
<li>The <strong>percentage of viewers who reach any point</strong> — reach-to-CTA, the share who hear the offer.</li>
<li><strong>Conversion and CTA tracking</strong> (Pro) — clicks on the in-video ask and the trial starts that follow.</li>
<li><strong>UTM and source attribution</strong> — which channels turn engagement into trials.</li>
<li>The <strong>second-by-second heatmap and viewer-level history</strong> (Pro) — where viewers fall out of the chain and how individuals moved through.</li></ul>
<p>You can start free — one video, free forever, no card — with conversion tracking on Pro at nineteen dollars a month. No personal data is collected, and you can restrict the player to your own domains. Create a free VidaPulse account and see which video and which source actually turn engagement into trials.</p>`,
  faq: [
    {
      q: `What is the difference between reach-to-CTA and conversion tracking?`,
      a: `Reach-to-CTA is the share of viewers who get to the moment you ask them to start a trial — it measures who heard the offer. Conversion and CTA tracking measure what happened next: who clicked the in-video ask and who actually started a trial. Reach-to-CTA sets the ceiling; conversion tracking tells you how much of that ceiling you captured.`,
    },
    {
      q: `Why use UTM attribution if I already have conversion tracking?`,
      a: `Conversion tracking tells you how many trials a video produced; UTM attribution tells you which traffic produced them. A single conversion number blends a strong channel and a weak one into a figure that hides both. With source attribution you can see reach-to-CTA and trial starts per channel and put effort behind the traffic that actually converts.`,
    },
    {
      q: `Does tying engagement to trials require collecting personal data?`,
      a: `No personal data is collected. VidaPulse connects engagement to trials through aggregate metrics — reach-to-CTA, CTA clicks, conversions, and UTM source — and on Pro adds viewer-level history for session-level detail without PII. You can also restrict the player to your own domains so it only reports where you embed it.`,
    },
  ],
};
