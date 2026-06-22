'use strict';

module.exports = {
  metaTitle: `What is a retention curve? | VidaPulse`,
  metaDescription: `A retention curve shows the percentage of viewers still watching at each point of a video. Learn to read its shape and how it differs from average watch time.`,
  answer: `A retention curve is a line that shows the percentage of viewers still watching at each point in a video, from the first second to the last. It starts at 100% of the people who pressed play and falls as viewers leave, so it only ever drops or holds flat — never rises. You read it by its shape: an early cliff where viewers quit at the start, a plateau where attention holds, small bumps where people rewatch, and a drop just before the offer. It is the clearest picture of where a video keeps people and where it loses them, which is exactly what a single average watch time number cannot show.`,
  sections: [
    {
      h2: `What a retention curve is`,
      html: `<p>A retention curve plots one thing across your video's timeline: at each moment, what share of your original audience is still watching? Time runs along the horizontal axis from start to finish, and the percentage of viewers remaining runs up the vertical axis from 0% to 100%. The line begins at the top left, because everyone counted pressed play at the first frame, and traces downward as people drop away.</p>
<p>The defining rule of the curve is that it can only fall or stay level. Once a viewer leaves, they are removed from the count and never return to it, so the line cannot climb back up. That is what makes the curve a trustworthy record of abandonment: every downward step represents people leaving at that exact second, and the steeper the step, the more of them left. Because it is a percentage, the curve also lets you compare videos of very different popularity on the same 0-to-100% scale.</p>`,
    },
    {
      h2: `How to read the shape of a retention curve`,
      html: `<p>The value of a retention curve is in its shape, and a handful of patterns cover almost everything you will see. Learn to spot these four and you can read any curve at a glance:</p>
<ul class="kb-list"><li><strong>The early cliff.</strong> A sharp fall in the opening seconds, usually the steepest drop on the whole curve. This is where viewers decide in an instant whether the video is worth their time, and it almost always points to a slow intro, a mismatch with what brought them in, or sound-off friction rather than your actual content.</li>
<li><strong>The plateau.</strong> A long, nearly flat stretch where the line holds steady. Viewers are staying through that section, which is a good sign that the content there is holding attention.</li>
<li><strong>Bumps from rewatches.</strong> Small rises or kinks where the line appears to recover slightly. These come from viewers rewatching a section — a moment compelling or confusing enough that people went back to it.</li>
<li><strong>The pre-offer drop.</strong> A fall just before your call to action or price reveal. This is the most costly drop on the curve, because the viewers leaving here came the furthest and were closest to converting.</li></ul>
<p>Reading a curve is mostly a matter of ignoring the gentle, even slope of normal attrition and letting your eye land on the steep segments. Those steep segments are the moments worth fixing.</p>`,
    },
    {
      h2: `How a retention curve differs from average watch time`,
      html: `<p>A retention curve and average watch time describe the same viewing behavior, but at completely different resolutions, and the difference is the whole reason to use the curve.</p>
<ul class="kb-list"><li><strong>Average watch time</strong> is a single number — the typical amount of the video a viewer watched, total watch time divided by viewers. It is a useful headline, but it compresses the entire video into one figure and hides <em>where</em> people left.</li>
<li><strong>The retention curve</strong> is the full shape behind that number. It shows the percentage of viewers remaining at every second, so it reveals the exact moments where attention collapses or holds.</li></ul>
<p>The gap matters because two videos with an identical average watch time can have completely different curves — one losing viewers gradually, another splitting its audience between people who quit at second 5 and people who watch to the end. The average treats those as the same; the curve shows they are not. Read together, the average is the quick gauge you check to see if engagement is trending up or down, and the curve is where you go to find the specific moment to fix.</p>
<p class="kb-example">Hypothetical illustration: a 60-second video where half the viewers leave at second 5 and half watch to the end has an average watch time of about 32 seconds — a figure that describes almost none of your real viewers. The retention curve shows the truth at a glance: a steep early cliff, then a flat plateau.</p>`,
    },
    {
      h2: `Why a retention curve is worth reading`,
      html: `<p>For a VSL or a product video, the point of measuring is to learn whether viewers reach the offer — and the retention curve is the only view that answers that directly. A strong view count or a respectable average can hide the fact that most people left long before the call to action ever appeared. The curve exposes it, second by second.</p>
<p>It also makes improvement concrete. Instead of debating opinions about an entire script, you find the single steepest cliff, change the one moment causing it, republish, and watch whether the cliff shrinks. To pin a drop to an exact second rather than a vague region, you cross-check the steepest part of the curve against a <strong>second-by-second heatmap</strong>, which resolves to the individual second and tells rewatched moments apart from replays. The loop is always the same: read the curve, fix the weakest moment, watch the line move.</p>`,
    },
  ],
  solve: `<p>VidaPulse draws a retention curve for your real viewers, on the video embedded on your own page. You paste any video URL from wherever it already lives (YouTube, Amazon S3, Google Drive, Dropbox, OneDrive, Azure Blob, Loom, a Zoom recording, Vimeo, or a direct MP4/HLS), VidaPulse wraps it in an analytics player, and you embed it with one line of script or a script-free iframe. There is no re-hosting and no re-uploading; your video stays exactly where it is.</p>
<p>From there the curve becomes something you can act on:</p>
<ul class="kb-list"><li>The <strong>audience-retention curve</strong> plots the percentage of viewers still watching over time, so you can read the early cliff, the plateaus, and the pre-offer drop directly.</li>
<li><strong>Average watch time</strong> and the <strong>percentage of viewers who reach any point</strong> sit alongside the curve, so the headline number and the full shape are always read together.</li>
<li>The <strong>second-by-second heatmap</strong> (Pro) lets you zoom from a rough drop on the curve to the exact second the bleed starts, and distinguishes rewatches from replays so a bump means real interest.</li></ul>
<p>Because the tracking lives in the embedded player, you read the retention curve for the page where your VSL or product video really runs — not just the platform that hosts the file. No personal data is collected. You can start on the Free plan with one video to see your own retention curve before changing anything; the second-level heatmap is on Pro.</p>`,
  faq: [
    {
      q: `Why does a retention curve only go down?`,
      a: `Because it measures the share of the original audience still watching, and once a viewer leaves they are removed from the count for good. The curve starts at 100% of the people who pressed play and can only fall or hold flat as the video continues. That is what makes every downward step a record of viewers quitting at that exact second, with the steepest steps marking where attention collapses.`,
    },
    {
      q: `What does a plateau on a retention curve mean?`,
      a: `A plateau is a long, nearly flat stretch where the line holds steady, which means viewers are staying through that section. It is generally a good sign that the content there is holding attention. Plateaus are what you want to see between drops; the parts worth fixing are the steep cliffs, not the flat stretches.`,
    },
    {
      q: `How is a retention curve different from average watch time?`,
      a: `Average watch time is a single number — the typical length watched — while the retention curve is the full shape showing how many viewers remain at every second. The average hides where people left, so two videos with the same average can have very different curves. Use the average as a quick gauge and the curve to find the specific moment to fix.`,
    },
  ],
};
