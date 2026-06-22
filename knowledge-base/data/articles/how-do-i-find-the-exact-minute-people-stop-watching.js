'use strict';

module.exports = {
  metaTitle: `How do I find the exact minute people stop watching? | VidaPulse`,
  metaDescription: `Raw view counts cannot show when people stop watching. A second-level heatmap and retention curve pinpoint the exact timestamp. Here is the step-by-step.`,
  answer: `You cannot find the exact minute people stop watching from view counts, because totals only show how many pressed play, never when they left. To pinpoint the moment you need an audience-retention curve, which plots the share of viewers still watching at each second, then a second-by-second heatmap to resolve the drop down to the exact timestamp. Read the curve for the steepest cliff, zoom in with the heatmap, and you have the precise second viewers leave.`,
  sections: [
    {
      h2: `Why raw counts can never tell you`,
      html: `<p>The most common mistake is trying to read "when do people stop watching" from your view numbers. Total views, unique viewers, and play rate all answer a different question: how many people started. They are silent on when anyone left.</p>
<p>Consider what a view count actually records. It marks the moment of play and nothing after it. A video with 3,000 views could keep nearly everyone to the end or lose most of them in the first minute, and the count reads 3,000 either way. The number you are staring at simply does not contain the information you want.</p>
<p>To find when people leave, you need a measure that tracks attention across the timeline rather than at the starting line. That is a different kind of report entirely, and without it you are guessing.</p>`,
    },
    {
      h2: `What the retention curve shows`,
      html: `<p>The audience-retention curve is the report that can answer the question at all. It plots the percentage of viewers still watching at each point in the video, from the first second to the last. Its defining property is that it only goes down or holds flat: once a viewer leaves, they are gone from the line for good.</p>
<p>That property is what makes it useful. Every downward step on the curve is a direct record of people quitting at that exact moment. A flat stretch means viewers are holding; a steep step means a group left in a short span. So "where do people stop watching" becomes a concrete visual task: find the steepest steps.</p>
<p>The curve gets you close. It will tell you that a sharp drop happens somewhere around a certain point in the timeline. What it is not built to do is resolve that down to the single second, and that is where the next tool comes in.</p>`,
    },
    {
      h2: `What the second-level heatmap adds`,
      html: `<p>A second-by-second engagement heatmap (a Pro feature) raises the resolution. Where the curve says "a drop happens roughly here," the heatmap says "the bleed starts at this exact second." That precision is the difference between a vague region and an actionable moment.</p>
<p>The reason precision matters is that it lets you tie the drop to a specific cause. Once you know the exact second, you can go to that point in your video and see what is happening: the line being spoken, the visual on screen, the transition that just occurred. You stop fixing "the middle" and start fixing "the moment the backstory begins."</p>
<p class="kb-example">Hypothetical illustration: the retention curve shows a steep fall somewhere around the two-minute mark. The heatmap narrows it to 1:57, and at 1:57 the video cuts to a long screen-share with no narration. Now you have the exact second and the exact cause, not a rough guess about the second minute.</p>`,
    },
    {
      h2: `Step by step: pinpoint the exact second`,
      html: `<p>Finding the moment people stop watching is a repeatable process. Work through it in order:</p>
<ol><li><strong>Get your VSL into an analytics player and gather real traffic.</strong> Let enough viewers run through it that the curve stabilizes; a handful of sessions will mislead you.</li>
<li><strong>Open the audience-retention curve.</strong> This is the one report that can show when viewers leave. View totals cannot.</li>
<li><strong>Find the steepest downward step.</strong> Ignore the gentle, even slope of normal decline and look for the near-vertical falls. Note the rough timestamp of the worst one.</li>
<li><strong>Zoom in with the second-by-second heatmap.</strong> Move to the flagged region and read it second by second to find the exact second the drop begins.</li>
<li><strong>Go to that second in your video.</strong> Watch what happens there and name the cause: a slow line, a visual change, a transition, a load or sound issue.</li>
<li><strong>Fix one thing and re-measure.</strong> Change that single moment, republish, and compare the new curve against the old at the same timestamp to confirm the drop shrank.</li></ol>
<p>That sequence takes you from "people stop watching somewhere" to "people stop watching at 1:57 because of this," which is the only version of the answer you can actually act on.</p>`,
    },
    {
      h2: `Why native analytics often cannot pinpoint it on your page`,
      html: `<p>If your video lives on a VSL page or a landing page rather than only on the platform that hosts the file, native analytics will usually fall short. There are two reasons.</p>
<ul class="kb-list"><li><strong>Scope.</strong> YouTube's retention report, for example, covers the video as watched on YouTube. It does not follow your embed onto your own sales page, where viewer behavior is often very different. A direct MP4 on your page or a file in cloud storage is invisible to it.</li>
<li><strong>Resolution.</strong> Native reports tend to be aggregate and coarse. They can give a rough sense of retention but are not built to pin a drop to an exact second on the page that actually matters to you.</li></ul>
<p>To find the exact minute, or better, the exact second, viewers stop watching on a video embedded on your own page, you need a tool that tracks that specific embedded player wherever it lives.</p>`,
    },
  ],
  solve: `<p>VidaPulse is built to pinpoint exactly when viewers stop watching on the video you actually care about, the one embedded on your own page. You paste any video URL from wherever it already lives (YouTube, Amazon S3, Google Drive, Dropbox, OneDrive, Azure Blob, Loom, a Zoom recording, Vimeo, or a direct MP4/HLS link), VidaPulse wraps it in an analytics player, and you embed it with one line of script or a script-free iframe. There is no re-hosting; your video stays where it is and keeps its URL.</p>
<p>From there, finding the exact second is the loop above:</p>
<ul class="kb-list"><li>The <strong>audience-retention curve</strong> marks the steepest drops on your real viewers, so you see the cliffs instead of guessing from view counts.</li>
<li>The <strong>second-by-second engagement heatmap</strong> (Pro) resolves the drop to the exact second so you can tie it to a specific line or visual.</li>
<li>The <strong>percentage of viewers who reach any point</strong> and <strong>average watch time</strong> confirm how many viewers make it to that moment and to your offer.</li></ul>
<p>Because the tracking lives in the embedded player, you measure when people leave on the page where your VSL really runs, not just on the platform that hosts the file. No personal data is collected. You can start on the Free plan with one video to find your own drop points; the second-level heatmap is on Pro.</p>`,
  faq: [
    {
      q: `Can I find when people stop watching from view counts?`,
      a: `No. View counts, unique viewers, and play rate only tell you how many people started, never when anyone left. The same view count can hide a video that holds everyone or one that loses most viewers in the first minute. To find when people stop watching you need an audience-retention curve, and to find the exact second you need a second-by-second heatmap.`,
    },
    {
      q: `How do I find the exact second viewers leave, not just the minute?`,
      a: `Start with the audience-retention curve to locate the steepest downward segment, which shows you roughly where the drop is. Then zoom into that region with a second-by-second engagement heatmap, which resolves to individual seconds. Go to that second in your video to see the specific line or visual that triggered the drop, so you fix the real cause.`,
    },
    {
      q: `Why does YouTube not show when people leave my embedded VSL?`,
      a: `Because YouTube's retention report only covers the video as watched on YouTube itself; it does not follow your embed onto a VSL or landing page, where behavior is often very different. Its data is also aggregate, so it cannot pin a drop to an exact second on your own page. To find when people leave a video embedded outside the host platform, you need a tool that tracks that specific embedded player.`,
    },
  ],
};
