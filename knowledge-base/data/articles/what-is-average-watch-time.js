'use strict';

module.exports = {
  metaTitle: `What is average watch time? | VidaPulse`,
  metaDescription: `Average watch time is the typical amount of a video viewers watch before leaving. Learn how it's calculated, its blind spot, and why to pair it with retention.`,
  answer: `Average watch time is the typical amount of a video that viewers watch before they leave — the total time everyone spent watching, divided by the number of viewers. It is a useful headline number for how engaging a video is overall, expressed either as a length of time or as a percentage of the runtime. Its limitation is built in: an average compresses the whole video into a single figure and hides where people actually leave, so two videos with the same average watch time can behave completely differently. That is why average watch time is best read alongside the audience-retention curve, not on its own.`,
  sections: [
    {
      h2: `What average watch time measures`,
      html: `<p>Average watch time tells you, for a typical viewer, how much of your video they watched before leaving. It is one of the first numbers most people check because it is intuitive and it summarizes engagement in a single figure: a higher average means viewers are staying longer on the whole, a lower one means they are leaving sooner.</p>
<p>It is usually reported in one of two forms. As an <strong>absolute length</strong> — for example, "viewers watched 47 seconds on average" — or as a <strong>percentage of the runtime</strong> — "viewers watched 38% of the video on average." The percentage form is handy for comparing videos of different lengths, since a 47-second average means something very different on a one-minute video than on a ten-minute one. Either way, the figure answers the same question: on average, how far did people get?</p>`,
    },
    {
      h2: `How average watch time is calculated`,
      html: `<p>The calculation is a straightforward average. You take the total amount of watch time accumulated across everyone who viewed the video and divide it by the number of viewers. If ten people watch a video and their watch times add up to 300 seconds, the average watch time is 30 seconds.</p>
<p>Two details shape how the number reads. First, it is sensitive to extremes: a handful of viewers who watch the whole thing can pull the average up even if most people left early, and a cluster who bail in the first second can drag it down. Second, the way replays are handled affects it — a viewer who rewatches a section accumulates more watch time, which can inflate the figure if first watches and replays are not distinguished. Both effects are reasons the single number can mislead if you treat it as the whole story.</p>
<p class="kb-example">Hypothetical illustration: imagine a 60-second video where half the viewers leave at second 5 and the other half watch all 60 seconds. The average watch time is roughly 32 seconds — a number that describes almost none of your actual viewers, since nobody watched for "about half."</p>`,
    },
    {
      h2: `The blind spot: an average hides where people leave`,
      html: `<p>The core limitation of average watch time is that it flattens the entire video into one number, and that number cannot tell you <em>where</em> viewers left. The example above shows the trap directly: an average of 32 seconds sounds like middling engagement, but it actually describes a video that is sharply splitting its audience into two groups — those who quit almost immediately and those who stay to the end. The fix for that video is not the same as the fix for a video where everyone drifts away gradually, yet both can produce the same average.</p>
<p>This matters most for a VSL or a product video, where the question is not "how long on average" but "did viewers reach the offer?" Average watch time cannot answer that. A respectable-looking average can hide the fact that most people left long before the call to action. Relying on the average alone is like judging a road trip by the average distance traveled — it tells you nothing about whether anyone reached the destination.</p>`,
    },
    {
      h2: `Why to pair it with the retention curve`,
      html: `<p>The remedy is to read average watch time together with the <strong>audience-retention curve</strong>, which plots the percentage of viewers still watching at each second. The average gives you a one-line headline; the curve tells you the story behind it. Where the average says "32 seconds," the curve shows you the cliff at second 5 and the plateau that follows — the actual shape of how attention moves through the video.</p>
<p>Used as a pair, they reinforce each other. The average is the quick gauge you check to see whether engagement is trending up or down between video versions. The curve is where you go to find the specific moment to fix when the average disappoints. And to pin a drop to an exact second rather than a vague region, you cross-check the steepest part of the curve against a second-by-second heatmap. The average opens the question; the curve and heatmap answer it.</p>`,
    },
  ],
  solve: `<p>VidaPulse reports average watch time alongside the full retention picture, on the video embedded on your own page. You paste any video URL from wherever it already lives (YouTube, Amazon S3, Google Drive, Dropbox, OneDrive, Azure Blob, Loom, a Zoom recording, Vimeo, or a direct MP4/HLS), VidaPulse wraps it in an analytics player, and you embed it with one line of script or a script-free iframe. There is no re-hosting and no re-uploading; your video stays exactly where it is.</p>
<p>Because the average is only useful in context, VidaPulse gives you the metrics that surround it:</p>
<ul class="kb-list"><li><strong>Average watch time</strong> as the headline gauge of overall engagement, so you can track whether a new version is doing better or worse.</li>
<li>The <strong>audience-retention curve</strong> and the <strong>percentage of viewers who reach any point</strong>, so you can see where viewers actually leave instead of trusting a single number.</li>
<li>The <strong>second-by-second heatmap</strong> (Pro), which distinguishes first watches from replays and lets you pin a drop to the exact second — so replays do not quietly inflate your read on watch time.</li></ul>
<p>Because the tracking lives in the embedded player, you measure all of this on the page where your VSL or product video really runs — not just the platform that hosts the file. No personal data is collected. You can start on the Free plan with one video to see your own average watch time and retention curve side by side before changing anything.</p>`,
  faq: [
    {
      q: `How is average watch time calculated?`,
      a: `It is the total watch time accumulated across all viewers divided by the number of viewers. If ten people watch a video and their watch times add up to 300 seconds, the average watch time is 30 seconds. It can be reported as an absolute length or as a percentage of the runtime, which is the more useful form for comparing videos of different lengths.`,
    },
    {
      q: `Why is average watch time misleading on its own?`,
      a: `Because it compresses the whole video into one number and hides where viewers leave. Two videos with the same average can behave completely differently — one losing people gradually, another splitting its audience between early quitters and people who watch to the end. The average can also be skewed by replays. That is why you pair it with the retention curve, which shows the actual shape of viewer loss.`,
    },
    {
      q: `What should I look at alongside average watch time?`,
      a: `The audience-retention curve and the percentage of viewers who reach any point, which show where viewers actually drop off rather than a single summary figure. For a VSL or product video, that tells you whether people reach the offer — something the average cannot. To pin a drop to an exact second, cross-check the curve against a second-by-second heatmap.`,
    },
  ],
};
