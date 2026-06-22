'use strict';

module.exports = {
  metaTitle: `How do I find video drop-off points? | VidaPulse`,
  metaDescription: `A drop-off point is where viewers leave in numbers. Learn how to find it with a retention curve and a second-level heatmap on your own video.`,
  answer: `A video drop-off point is a moment where viewers leave in numbers, not one by one. To find it you need an audience-retention curve, because raw view counts cannot show where attention falls — only how many pressed play. Read the curve for steep cliffs rather than gentle slope, then cross-check the steepest segment against a second-by-second heatmap to pin the exact second. Native analytics like YouTube only cover videos hosted there and report aggregates, so to find drop-off on a VSL embedded on your own page you need a tool that tracks that embedded video.`,
  sections: [
    {
      h2: `What a drop-off point actually is`,
      html: `<p>A <strong>drop-off point</strong> is a moment in your video where viewers leave in numbers — a spot where the audience falls off a cliff rather than trickling away. Every video loses some viewers steadily from start to finish; that gentle decline is normal and not what you are hunting for. What you want are the specific seconds where the line drops sharply, because those are the moments doing real damage.</p>
<p>The distinction matters because the fix is different. A gentle slope across the runtime is natural attrition you cannot edit away. A steep cliff at one second is a concrete problem: a slow setup, a confusing claim, a price reveal that lands wrong. Find the cliff and you have found the one edit worth making.</p>
<p class="kb-example">Hypothetical illustration: if your retention line drifts from 100% to 60% over the first half of a VSL, that is ordinary decline. But if it sits at 55% and then falls to 30% across a five-second stretch, that stretch is a drop-off point — and it is where your attention should go.</p>`,
    },
    {
      h2: `Why raw view counts cannot show drop-off`,
      html: `<p>The most common mistake is trying to read drop-off from view counts. Total views, unique viewers, and play rate tell you how many people started — they say nothing about <em>when</em> people left. A video with 5,000 views could keep almost everyone to the end or lose 80% in the first ten seconds; the view count is identical either way.</p>
<p>To see drop-off you need a measure that tracks attention across the timeline, second by second. That is what an <strong>audience-retention curve</strong> does: it plots the percentage of viewers still watching at each point in the video. The curve only goes down or holds flat — once someone leaves, they are gone from the line — so every downward step is a record of people quitting at that exact moment. Drop-off points are simply the steepest steps on that curve.</p>`,
    },
    {
      h2: `How to find your drop-off points step by step`,
      html: `<p>Finding drop-off is a repeatable process, not a guess. Work through it in order:</p>
<ol><li><strong>Open your audience-retention curve.</strong> This is the one report that can show drop-off at all. Without it you are reading view totals, which cannot answer the question.</li>
<li><strong>Scan for steep cliffs, not gentle decline.</strong> Run your eye across the curve and ignore the slow, even slope. Look for the <em>steepest downward segments</em> — the near-vertical falls where many viewers leave in a short span. Those are your candidates.</li>
<li><strong>Cross-check with a second-level heatmap.</strong> A retention curve points you to roughly where the drop is. A second-by-second engagement heatmap (a Pro feature) lets you zoom to the exact second the bleed starts, so you can tie it to a specific sentence or visual rather than a vague region.</li>
<li><strong>Classify the drop.</strong> Separate the first-seconds cliff from a mid-video drop from a pre-offer drop (covered below). Each type has a different cause and a different fix, so naming the type tells you where to look.</li>
<li><strong>Make one change and re-measure.</strong> Edit the single weakest moment, republish, and compare the new curve against the old. If the cliff shrinks, the change worked; if it does not move, you found the wrong cause.</li></ol>
<p>The loop is always the same: read the curve, pinpoint the second, fix one thing, watch whether the curve moves.</p>`,
    },
    {
      h2: `The three kinds of drop-off points`,
      html: `<p>Not all drop-off is the same, and treating it as one problem leads to the wrong fix. Sort what you see into three types:</p>
<ul class="kb-list"><li><strong>The first-seconds cliff.</strong> The sharp fall at the very start, where viewers decide in an instant whether the video is worth their time. This is usually the steepest drop on the whole curve and almost always points to a slow intro, an ad-to-video mismatch, or sound-off friction rather than your offer.</li>
<li><strong>The mid-video drop.</strong> A cliff somewhere in the body, typically a stretch that drags — a long setup, a tangent, or a section that lost the thread. These are the easiest to fix once located, because the edit is usually "cut or tighten this part."</li>
<li><strong>The pre-offer drop.</strong> A fall just before your call to action or price reveal. This one is the most costly, because the viewers leaving here came the furthest and were closest to converting. A drop right before the offer often means the transition into the ask felt abrupt or the value was not yet clear.</li></ul>
<p>Knowing which type you are looking at turns a vague "people leave" into a specific question you can answer: is the opening failing, is the middle dragging, or is the offer arriving before viewers are ready?</p>`,
    },
    {
      h2: `Why native analytics often cannot find it`,
      html: `<p>If your video lives on a VSL page, a landing page, or anywhere outside the platform that hosts the file, native analytics will usually let you down. YouTube's retention report, for instance, only covers the video <em>as watched on YouTube</em> — it does not follow your embed onto your own sales page, where viewer behavior is often very different.</p>
<p>There are two gaps. First, <strong>scope</strong>: native analytics only see watches on their own platform, so an MP4 on your page or a file in cloud storage is invisible to them. Second, <strong>resolution</strong>: native reports tend to be aggregate and coarse — fine for a rough sense of retention, but not enough to pin a drop to an exact second on the page that matters. To find drop-off on a video embedded on your own page, you need a tool that tracks that specific embedded player wherever it lives.</p>`,
    },
  ],
  solve: `<p>VidaPulse is built to find drop-off on the video you actually care about — the one embedded on your own page. You paste any video URL from wherever it already lives (YouTube, Amazon S3, Google Drive, Dropbox, OneDrive, Azure Blob, Loom, a Zoom recording, Vimeo, or a direct MP4/HLS), VidaPulse wraps it in an analytics player, and you embed it with one line of script or a script-free iframe. There is no re-hosting and no re-uploading; your video stays exactly where it is.</p>
<p>From there, finding drop-off becomes the simple loop described above:</p>
<ul class="kb-list"><li>The <strong>audience-retention curve</strong> marks the steepest drops on your real viewers, so you see the cliffs instead of guessing from view counts.</li>
<li>The <strong>second-by-second heatmap</strong> (Pro) pinpoints the exact second a drop begins, so you can tie it to a specific line or visual.</li>
<li>Cross-check against <strong>average watch time</strong> and the <strong>percentage of viewers who reach any point</strong> to confirm how many people actually arrive at your offer.</li></ul>
<p>Because the tracking lives in the embedded player, you measure drop-off on the page where your VSL or product video really runs — not just on the platform that happens to host the file. No personal data is collected. You can start on the Free plan with one video to find your own drop-off points before changing anything; the second-level heatmap is on Pro.</p>`,
  faq: [
    {
      q: `What is the difference between a drop-off point and normal decline?`,
      a: `Normal decline is the gentle, steady loss of viewers across the whole runtime — every video has it and you cannot edit it away. A drop-off point is a steep cliff at a specific spot where many viewers leave in a short span. When reading your retention curve, ignore the slow slope and focus on the steepest downward segments; those are the drop-off points worth fixing.`,
    },
    {
      q: `Can I find drop-off points from YouTube analytics?`,
      a: `Only for the video as watched on YouTube itself. YouTube's retention report does not follow your embed onto a VSL or landing page, and its data is aggregate, so it cannot pin a drop to the exact second on your own page. To find drop-off on a video embedded outside the host platform, you need a tool that tracks that specific embedded player wherever it lives.`,
    },
    {
      q: `How do I find the exact second viewers drop off?`,
      a: `Start with the audience-retention curve to locate the steepest downward segment, which shows you roughly where the drop is. Then cross-check that region against a second-by-second engagement heatmap, which resolves down to the individual second so you can tie the drop to a specific sentence or visual rather than a vague stretch of the timeline.`,
    },
  ],
  related: ['what-is-a-video-heatmap', 'why-is-my-vsl-not-converting', 'how-to-improve-vsl-retention'],
};
