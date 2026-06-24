'use strict';

module.exports = {
  metaTitle: `How do I measure funnel engagement? | VidaPulse`,
  metaDescription: `Measure funnel engagement at the video step: retention, percentage reaching the offer, replays, and CTA clicks — captured on any embedded video, no re-hosting.`,
  answer: `Funnel engagement is how deeply prospects actually interact with each step, not just whether they passed through it. At the video step — the one that carries the pitch in most funnels — engagement means retention, the percentage of viewers reaching your offer, replays versus first watches, and clicks on your call to action. You measure it by wrapping your existing video in an analytics player and reading those signals second by second. Engagement is the difference between a play that happened and a pitch that landed.`,
  sections: [
    {
      h2: `What funnel engagement really means`,
      html: `<p>Passing through a step and engaging with it are not the same thing. A prospect can reach your video and press play without ever absorbing the message; a play is a yes-or-no event, but <strong>engagement</strong> is everything that happens after. Funnel engagement measures the depth of interaction at a step — how much attention it actually earned — rather than the bare fact that someone arrived.</p>
<p>This matters most at the step that does the persuading. In a video funnel, the video carries the pitch, so engagement there is the closest thing you have to watching a prospect listen to your sales argument. Low engagement at the video step is why a funnel can show plenty of plays and very few conversions: the message was delivered but not received, and a play count cannot tell the two apart.</p>`,
    },
    {
      h2: `The signals that make up video-step engagement`,
      html: `<p>Engagement at the video step is not one number; it is a small set of behavioral signals that together describe how the pitch landed. The ones that matter for selling are these:</p>
<ul class="kb-list"><li><strong>Audience retention</strong> — the percentage of viewers still watching at each second, so you can see how long attention holds and where it breaks.</li>
<li><strong>Percentage reaching the offer</strong> — what share of viewers actually make it to the part where you make the ask, which is the engagement that decides whether the funnel can convert at all.</li>
<li><strong>Average watch time</strong> — how long the typical viewer stays before leaving.</li>
<li><strong>Replays versus first watches</strong> — which moments get re-watched, a sign of either strong interest or confusion worth investigating.</li>
<li><strong>Conversion and CTA clicks</strong> — whether engagement turned into the action the video asked for.</li></ul>
<p>Read together, these answer the question a play count never can: did this video hold attention, and did that attention move people toward the sale?</p>`,
    },
    {
      h2: `How to capture engagement on any embedded video`,
      html: `<p>The practical obstacle is that your video almost certainly does not live where it is watched. The file might sit in cloud storage or on a video host, while the actual viewing happens on your VSL page or landing page. Native analytics measure watches on the host platform, not on the page where your funnel runs, so the engagement that matters is invisible to them.</p>
<p>The way around this is to track the <strong>embedded player itself</strong>, wherever it appears. Instead of relying on the host's report, you wrap your existing video in an analytics player and embed that on your page. The player records retention, watch time, the percentage reaching each point, replays, and CTA clicks for the video as it is actually watched, on the page that matters — no re-hosting and no second upload required.</p>
<p class="kb-example">Hypothetical: a demo video reports 1,000 plays on its host platform, which looks like strong engagement. But measured on the actual sales page where it is embedded, only 8 percent stay long enough to reach the offer. The host's number flattered the funnel; the embedded-player number revealed the leak. Same video, very different story depending on where you measure.</p>`,
    },
    {
      h2: `Turning engagement signals into decisions`,
      html: `<p>Measuring engagement is only worth it if it changes what you do next. The pattern in the retention curve usually points to a specific problem. A steep early drop means the opening fails to confirm the viewer is in the right place. A long, slow slide through the middle means the content drags before it earns the offer. A cliff right before the call to action means people leave precisely when you ask. Each is a different, fixable issue.</p>
<p>Use the other signals to confirm and refine. A low percentage reaching the offer tells you the funnel cannot convert because too few people arrive at the ask. Heavy replays on one section can mean a confusing claim worth clarifying. Strong retention paired with weak CTA clicks suggests the message landed but the ask did not. The discipline is to act on the signal that points to a decision — change one thing, then re-measure engagement to see if it moved.</p>`,
    },
  ],
  solve: `<p>VidaPulse measures funnel engagement at the step where it counts most: the video. You paste any video URL from wherever it already lives — YouTube, Amazon S3, Google Drive, Dropbox, OneDrive, Azure Blob, Loom, a Zoom recording, Vimeo, or a direct MP4 or HLS file — and VidaPulse wraps it in an analytics player you embed with one line of script or a script-free iframe. There is no re-hosting and no second upload; your video keeps its existing URL.</p>
<p>Once it is embedded, every engagement signal is captured on the page where your funnel actually runs:</p>
<ul class="kb-list"><li>The <strong>audience-retention curve</strong> and <strong>average watch time</strong> show how deeply viewers engage and where attention breaks.</li>
<li>The <strong>percentage of viewers reaching any point</strong> tells you how many engage all the way to your offer.</li>
<li>The <strong>second-by-second heatmap</strong> (Pro) ties engagement to specific moments and separates replays from first watches, with <strong>viewer-level history</strong> (Pro) for individual paths.</li>
<li><strong>Conversion and CTA tracking</strong> (Pro) confirms whether engagement turned into action, and <strong>UTM source attribution</strong> compares engagement by traffic source.</li></ul>
<p>No personal data is collected; unique viewers are counted by a first-party ID, not by profiling individuals. Start on the Free plan with one video — free forever, no card — to measure your own video's engagement; Starter (10 dollars/mo) adds ten videos plus geography, device, and average watch time, and Pro (19 dollars/mo) unlocks unlimited videos, heatmaps, viewer-level history, segmentation, and conversion tracking. Create a free account and find your funnel's video leak.</p>`,
  faq: [
    {
      q: `What is the difference between funnel engagement and funnel conversion?`,
      a: `Conversion is whether a step was completed; engagement is how deeply a prospect interacted with it. At the video step, conversion asks whether someone clicked the CTA, while engagement measures retention, the percentage reaching the offer, watch time, and replays. Engagement explains the conversion result — it shows whether the pitch was actually received, not just whether the play happened.`,
    },
    {
      q: `Can I measure engagement on a video that isn't hosted on my site?`,
      a: `Yes. VidaPulse wraps your existing video — from a cloud store, a video host, or a direct MP4 or HLS link — in an analytics player you embed on your page. It tracks the embedded player wherever it appears, so engagement is captured on the page where your funnel actually runs, not on the host platform. There is no re-hosting and no second upload.`,
    },
    {
      q: `Which engagement metric matters most for a video funnel?`,
      a: `The percentage of viewers who reach your offer, because the funnel cannot convert if people leave before the ask. Pair it with the audience-retention curve to see where viewers drop on the way there, and with CTA clicks to confirm whether the engagement turned into action. Those three together describe whether the pitch held attention and moved people toward the sale.`,
    },
  ],
};
