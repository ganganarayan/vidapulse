'use strict';

module.exports = {
  metaTitle: `What is a video retention graph? | VidaPulse`,
  metaDescription: `A video retention graph is a line showing the percentage of viewers still watching over time. Learn how to read its shape and how it differs from a heatmap.`,
  answer: `A video retention graph is a line chart that plots the percentage of viewers still watching at each point in a video, from the first second to the last. It starts at 100% of the people who pressed play and falls as viewers leave, so the line only ever drops or holds flat — never rises. Reading it is a matter of reading its shape: gentle slopes are normal attrition, steep cliffs mark where many viewers quit at once, and long flat stretches show where attention holds. It is the single clearest picture of where a video keeps people and where it loses them.`,
  sections: [
    {
      h2: `What a video retention graph shows`,
      html: `<p>A retention graph maps one thing across your video's timeline: at each moment, what share of your original audience is still watching? The horizontal axis is time, running from the start of the video to the end. The vertical axis is the percentage of viewers remaining, from 100% at the top down to 0%. The line begins at the top left, because everyone who pressed play is present at the first frame, and traces downward as people drop away.</p>
<p>The defining property of the graph is that the line can only go down or stay level. Once a viewer leaves, they are removed from the count and do not return to it, so there is no way for the percentage to climb back up. That is what makes the graph trustworthy as a record of abandonment: every downward step is people leaving at that exact second, and the steeper the step, the more of them left.</p>`,
    },
    {
      h2: `How to read the shape of the graph`,
      html: `<p>You read a retention graph by its profile, the way you would read the elevation of a hill. The numbers matter, but the shape tells the story faster. Three patterns cover almost everything you will see:</p>
<ul class="kb-list"><li><strong>A gentle, steady decline.</strong> The line eases down evenly across the runtime. This is ordinary attrition — every video loses some viewers continuously, and there is nothing here to fix.</li>
<li><strong>A steep cliff.</strong> The line drops sharply over a short span, falling far in just a few seconds. This is the signal you are hunting for: a specific moment where many viewers left at once, almost always tied to a particular line, visual, or transition.</li>
<li><strong>A flat plateau.</strong> The line runs nearly level for a stretch. Viewers are staying through that section, which usually means the content there is doing its job and holding attention.</li></ul>
<p>The first few seconds deserve special attention, because the opening cliff is usually the steepest drop on the entire graph — it is where viewers decide in an instant whether the video is worth their time. After that, watch for any sharp fall just before your offer or call to action, since those are the most costly viewers to lose.</p>`,
    },
    {
      h2: `How a retention graph differs from a heatmap`,
      html: `<p>A retention graph and a video heatmap are often confused, but they answer different questions and you want both. The cleanest way to keep them straight is to remember that one counts people and the other measures intensity.</p>
<ul class="kb-list"><li><strong>The retention graph</strong> shows the <em>percentage of viewers still watching</em> at each point. It only goes down, because it tracks how many people remain. Its job is to find abandonment — the cliffs where viewers quit.</li>
<li><strong>The heatmap</strong> shows <em>per-second engagement intensity, including replays</em>. It can rise again later in the video, because a moment can be rewatched even after some viewers have left. Its job is to find which individual seconds are watched hardest and which are skipped.</li></ul>
<p>Put simply: the retention graph tells you <strong>how many</strong> people are still there; the heatmap tells you <strong>how intensely</strong> each second is being watched. The two work together. The graph points you to roughly where a drop happens; the heatmap, at second-level resolution, lets you pin it to the exact second and tell rewatched moments apart from dead air.</p>`,
    },
    {
      h2: `Why a retention graph is worth reading`,
      html: `<p>The reason to read a retention graph rather than a view count is that the view count cannot show you where a video fails. Two videos with the same number of plays can hold wildly different shares of their audience to the end, and only the graph reveals it. For a VSL or a product video, that gap is the difference between traffic and results — getting people to press play is meaningless if they leave before the offer.</p>
<p>A retention graph also makes improvement concrete. Instead of debating opinions about a whole script, you find the single steepest cliff, change the one moment that is causing it, and re-measure to see if the cliff shrinks. That feedback loop — read the graph, fix the weakest moment, watch the line move — is what turns retention from a passive report into a tool for actually fixing a video.</p>
<p class="kb-example">Hypothetical illustration: a demo video's graph holds a flat 70% through the first half, then falls from 65% to 25% across a six-second stretch where a long setup begins. That cliff is the whole problem, visible at a glance — trim the setup, republish, and watch whether the fall flattens out.</p>`,
    },
  ],
  solve: `<p>VidaPulse draws a video retention graph for your real viewers, on the video embedded on your own page. You paste any video URL from wherever it already lives (YouTube, Amazon S3, Google Drive, Dropbox, OneDrive, Azure Blob, Loom, a Zoom recording, Vimeo, or a direct MP4/HLS), VidaPulse wraps it in an analytics player, and you embed it with one line of script or a script-free iframe. There is no re-hosting and no re-uploading; your video stays exactly where it is.</p>
<p>From there the graph becomes something you can act on:</p>
<ul class="kb-list"><li>The <strong>audience-retention curve</strong> plots the percentage of viewers still watching over time, so you can read the cliffs and plateaus directly instead of guessing from view counts.</li>
<li>The <strong>second-by-second heatmap</strong> (Pro) lets you zoom from a rough drop on the graph to the exact second the bleed starts, and tells rewatched moments apart from replays.</li>
<li><strong>Average watch time</strong> and the <strong>percentage of viewers who reach any point</strong> sit alongside the graph, so you can confirm how many people actually reach your offer.</li></ul>
<p>Because the tracking lives in the embedded player, you read the retention graph for the page where your VSL or product video really runs — not just the platform that hosts the file. No personal data is collected. You can start on the Free plan with one video to see your own retention graph before changing anything.</p>`,
  faq: [
    {
      q: `Why does a video retention graph never go up?`,
      a: `Because it tracks the share of the original audience still watching, and once a viewer leaves they are removed from the count for good. The line starts at 100% of the people who pressed play and can only fall or hold flat as the video continues. That is exactly what makes it reliable for finding abandonment: every downward step is people leaving at that second.`,
    },
    {
      q: `What does a steep drop on the retention graph mean?`,
      a: `A steep drop, or cliff, means many viewers left in a short span — a specific moment that is costing you, as opposed to the gentle slope of normal attrition. Cliffs almost always tie to a particular line, visual, or transition. The opening cliff is usually the steepest, and a fall just before your offer is the most costly because those viewers came the furthest.`,
    },
    {
      q: `Is a retention graph the same as a heatmap?`,
      a: `No. A retention graph shows the percentage of viewers still watching over time and only goes down. A heatmap shows per-second engagement intensity including replays, so it can rise again later in the video. The graph finds where people quit; the heatmap finds which exact seconds are watched, replayed, or skipped. They answer different questions and are best used together.`,
    },
  ],
};
