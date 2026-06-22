'use strict';

module.exports = {
  metaTitle: `How can I tell where viewers stop watching my video? | VidaPulse`,
  metaDescription: `You find where viewers stop watching by reading an audience-retention curve and a second-level heatmap on your own embedded video — not raw view counts.`,
  answer: `You can tell exactly where viewers stop watching by reading an audience-retention curve for your video, then zooming into the steepest drop with a second-by-second engagement heatmap. The curve plots the percentage of viewers still watching at each moment, so every sharp fall marks a spot where people left in numbers. View counts cannot show this — they only tell you how many pressed play, never when attention dropped. With a tool that tracks the embedded player, this works on any video on your own page, wherever the file is actually hosted.`,
  sections: [
    {
      h2: `Start with the audience-retention curve`,
      html: `<p>The single report that answers this question is the <strong>audience-retention curve</strong>. It plots the percentage of viewers still watching at each second of your video, from the moment they press play to the final frame. Because the line only falls or holds flat — once someone leaves, they are gone from it — every downward step is a record of people quitting at that exact moment.</p>
<p>Read the curve for shape, not just height. A gentle, even slope across the runtime is ordinary attrition that every video has; you cannot edit it away. What you are hunting for are the <em>steep cliffs</em> — the near-vertical falls where many viewers leave in a short span. Those are the moments doing real damage, and they are where viewers actually stop watching.</p>`,
    },
    {
      h2: `Why view counts cannot tell you`,
      html: `<p>The most common mistake is trying to read this from totals. Total views, unique viewers, and play rate tell you how many people started — they say nothing about <em>when</em> people left. Two videos with the same view count can behave completely differently: one keeps almost everyone to the end, the other loses most of its audience in the first ten seconds. The count is identical; the truth is not.</p>
<p>To see where viewers stop, you need a measure that tracks attention across the timeline rather than at the start. That is the whole job of the retention curve. Average watch time gives you a useful summary — a low average watch time relative to runtime is a strong signal that people leave early — but only the curve shows you the precise spot.</p>`,
    },
    {
      h2: `Pinpoint the exact second with a heatmap`,
      html: `<p>A retention curve points you to roughly where a drop is. To pin it to a specific line or visual, cross-check the steepest segment against a <strong>second-by-second engagement heatmap</strong> (a Pro feature). The heatmap resolves down to individual seconds, so instead of "somewhere around the two-minute mark" you get the exact second the bleed starts.</p>
<p>That precision is what makes the finding actionable. Once you know the second, you can play it back and see what is on screen — a slow setup, a confusing claim, a tangent, a price reveal that lands wrong — and tie the drop to a concrete cause you can edit.</p>
<p class="kb-example">Hypothetical illustration: say your curve sits at 55% and then falls to 30% across a five-second stretch starting at 1:42. The heatmap lets you zoom to 1:42 and watch exactly what you said there — turning "people leave in the middle" into "people leave when I start the long product backstory."</p>`,
    },
    {
      h2: `It works on any video on your own page`,
      html: `<p>The catch with native analytics is scope. YouTube's retention report, for example, only covers the video <em>as watched on YouTube</em> — it does not follow your embed onto a VSL or landing page, where viewer behavior is usually different. An MP4 on your own page or a file in cloud storage is invisible to it entirely.</p>
<p>To tell where viewers stop watching on the video that matters — the one embedded on your sales or product page — you need a tool that tracks that specific embedded player. Because the analytics travel with the player, you can paste a URL from wherever the file already lives and measure stop points on your real page, not just on the host platform.</p>`,
    },
    {
      h2: `Turn the finding into a fix`,
      html: `<p>Finding the spot is only useful if you act on it, so close the loop:</p>
<ol><li><strong>Read the curve</strong> and mark the steepest drop.</li>
<li><strong>Zoom in with the heatmap</strong> to find the exact second and what is on screen there.</li>
<li><strong>Make one change</strong> to that single moment — cut it, tighten it, or rewrite it.</li>
<li><strong>Republish and re-measure.</strong> Compare the new curve against the old one. If the cliff shrinks, the change worked; if it does not move, you found the wrong cause and look again.</li></ol>
<p>The loop is always the same: read the curve, pinpoint the second, fix one thing, watch whether the curve moves. That is how "I don't know where I'm losing people" becomes a repeatable diagnosis.</p>`,
    },
  ],
  solve: `<p>VidaPulse is built to show you exactly where viewers stop watching the video you actually care about — the one embedded on your own page. You paste any video URL from wherever it already lives (YouTube, Amazon S3, Google Drive, Dropbox, OneDrive, Azure Blob, Loom, a Zoom recording, Vimeo, or a direct MP4/HLS), VidaPulse wraps it in an analytics player, and you embed it with one line of script or a script-free iframe. There is no re-hosting — your video stays exactly where it is.</p>
<p>From there the diagnosis is direct:</p>
<ul class="kb-list"><li>The <strong>audience-retention curve</strong> marks the steepest drops from your real viewers, so you see where attention falls instead of guessing from view counts.</li>
<li>The <strong>second-by-second engagement heatmap</strong> (Pro) pins the exact second a drop begins, so you can tie it to a specific line or visual.</li>
<li><strong>Average watch time</strong> and the <strong>percentage of viewers who reach any point</strong> confirm how far the typical viewer gets and how many reach your offer.</li></ul>
<p>Because the tracking lives in the embedded player, you measure all of this on the page where your VSL, demo, or product video really runs. Unique viewers are counted with a first-party identifier and no personal data is collected. To start, create a free VidaPulse account, wrap your own video, and read the curve to see exactly where your viewers stop.</p>`,
  faq: [
    {
      q: `Can I tell where viewers stop watching from view counts alone?`,
      a: `No. View counts, unique viewers, and play rate only tell you how many people started the video — they reveal nothing about when people left. Two videos with identical view counts can have completely different retention. To see where viewers stop, you need an audience-retention curve, which plots the percentage still watching at each second.`,
    },
    {
      q: `How precise can I get about where viewers leave?`,
      a: `Down to the individual second. The audience-retention curve shows you roughly where the steepest drop is, and a second-by-second engagement heatmap resolves to the exact second the drop begins. That lets you play back the moment and tie the loss to a specific sentence or visual rather than a vague stretch of the timeline.`,
    },
    {
      q: `Does this work for a video that isn't on YouTube?`,
      a: `Yes. Because the analytics live in the embedded player, you can paste a URL from wherever the file is hosted — cloud storage, a direct MP4, or a hosting platform — and measure where viewers stop on your own page. Native reports like YouTube's only cover watches on their own platform, so they cannot see your embed on a VSL or landing page.`,
    },
  ],
};
