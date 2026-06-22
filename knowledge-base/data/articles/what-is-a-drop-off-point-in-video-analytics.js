'use strict';

module.exports = {
  metaTitle: `What is a drop-off point in video analytics? | VidaPulse`,
  metaDescription: `A drop-off point is a moment where viewers leave in numbers — a steep downward step on the retention curve. Learn cliffs vs. decline and the common types.`,
  answer: `In video analytics, a drop-off point is a moment where viewers leave in numbers rather than one by one — a steep downward step on the audience-retention curve. It is the difference between the gentle, steady attrition that every video has and a sharp cliff where many people quit in a short span. Drop-off points matter because each cliff usually ties to a specific line, visual, or transition that is costing you viewers, which makes it the single most actionable thing to find and fix in a video.`,
  sections: [
    {
      h2: `What a drop-off point actually is`,
      html: `<p>A <strong>drop-off point</strong> is a spot in your video where the audience falls off a cliff instead of trickling away. On an audience-retention curve — the line showing the percentage of viewers still watching at each second — a drop-off point appears as a steep downward step: the line falls far over a short span of time. That sharp fall is the visual signature of many viewers leaving at the same moment.</p>
<p>The reason the concept exists at all is that not all viewer loss is equal. Every video loses people steadily from start to finish, and that ordinary decline is not something you can edit away. A drop-off point is different in kind: it is concentrated, sudden, and almost always caused by something specific in the video at that exact moment. Naming it as a distinct event is what lets you separate the loss worth fixing from the loss that is simply normal.</p>`,
    },
    {
      h2: `Cliffs vs. gentle decline`,
      html: `<p>The most important distinction in reading drop-off is the difference between a cliff and a slope, because the two call for completely different responses.</p>
<ul class="kb-list"><li><strong>Gentle decline</strong> is the slow, even downward drift of the retention curve across the whole runtime. Some viewers always leave as a video plays — they get interrupted, they got what they needed, they ran out of time. This is natural attrition and there is no single edit that removes it.</li>
<li><strong>A cliff</strong> is a near-vertical fall over a few seconds. This is a drop-off point: a concentrated exit that points to a concrete cause — a slow setup, a confusing claim, a price reveal that lands wrong, a transition that felt abrupt. A cliff is a problem you can name and fix.</li></ul>
<p>When you read a retention curve, the skill is to ignore the gentle slope and let your eye land on the steepest segments. Those steep segments are your drop-off points, and they are where your attention belongs.</p>
<p class="kb-example">Hypothetical illustration: if a retention line drifts from 100% to 60% over the first half of a VSL, that is ordinary decline. But if it sits at 55% and then falls to 30% across a five-second stretch, that stretch is a drop-off point — and it is the part worth investigating.</p>`,
    },
    {
      h2: `The common types of drop-off point`,
      html: `<p>Drop-off points tend to cluster in three places, and each type has a different likely cause and a different fix. Sorting what you see into these categories turns a vague "people leave" into a specific question you can answer.</p>
<ul class="kb-list"><li><strong>The first-seconds drop.</strong> A sharp cliff at the very start, where viewers decide in an instant whether the video is worth their time. This is usually the steepest drop on the whole curve and rarely about your offer — it points to a slow intro, a mismatch between what brought viewers in and what the video opened with, or sound-off friction.</li>
<li><strong>The mid-video drop.</strong> A cliff somewhere in the body, typically a section that drags — a long setup, a tangent, or a stretch that lost the thread. These are often the easiest to fix once located, because the edit is usually "cut or tighten this part."</li>
<li><strong>The pre-offer drop.</strong> A fall just before the call to action or price reveal. This is the most costly type, because the viewers leaving here came the furthest and were closest to converting. A drop right before the offer often means the transition into the ask felt abrupt or the value was not yet clear.</li></ul>
<p>Knowing which type you are looking at tells you where to look next: is the opening failing, is the middle dragging, or is the offer arriving before viewers are ready?</p>`,
    },
    {
      h2: `How to find a drop-off point`,
      html: `<p>Finding drop-off is a repeatable process, not a guess. Raw view counts cannot show it — total views, unique viewers, and play rate tell you how many people started, never <em>when</em> they left. To see drop-off you need a measure that tracks attention across the timeline.</p>
<p>Start with the <strong>audience-retention curve</strong> and scan for the steepest downward segments, ignoring the gentle slope. That points you to roughly where each drop-off point sits. To pin it precisely, cross-check the steepest region against a <strong>second-by-second engagement heatmap</strong>, which resolves down to the individual second so you can tie the drop to a specific sentence or visual rather than a vague stretch. Then make one change, republish, and compare the new curve against the old: if the cliff shrinks, the change worked.</p>`,
    },
  ],
  solve: `<p>VidaPulse is built to find drop-off points on the video you actually care about — the one embedded on your own page. You paste any video URL from wherever it already lives (YouTube, Amazon S3, Google Drive, Dropbox, OneDrive, Azure Blob, Loom, a Zoom recording, Vimeo, or a direct MP4/HLS), VidaPulse wraps it in an analytics player, and you embed it with one line of script or a script-free iframe. There is no re-hosting and no re-uploading; your video stays exactly where it is.</p>
<p>From there, locating drop-off becomes a simple loop:</p>
<ul class="kb-list"><li>The <strong>audience-retention curve</strong> marks the steepest cliffs on your real viewers, so you see the drops instead of guessing from view counts.</li>
<li>The <strong>second-by-second heatmap</strong> (Pro) pinpoints the exact second a drop begins and tells rewatched moments apart from replays, so you can tie a cliff to a specific line or visual.</li>
<li>Cross-check against <strong>average watch time</strong> and the <strong>percentage of viewers who reach any point</strong> to confirm how many people actually arrive at your offer.</li></ul>
<p>Because the tracking lives in the embedded player, you measure drop-off on the page where your VSL or product video really runs — not just the platform that hosts the file. No personal data is collected. You can start on the Free plan with one video to find your own drop-off points before changing anything; the second-level heatmap is on Pro.</p>`,
  faq: [
    {
      q: `What is the difference between a drop-off point and normal decline?`,
      a: `Normal decline is the gentle, steady loss of viewers across the whole runtime — every video has it and you cannot edit it away. A drop-off point is a steep cliff at a specific spot where many viewers leave in a short span. When reading your retention curve, ignore the slow slope and focus on the steepest downward segments; those are the drop-off points worth fixing.`,
    },
    {
      q: `Where do drop-off points usually happen?`,
      a: `They tend to cluster in three places: the first few seconds, where viewers decide whether the video is worth their time; somewhere in the middle, where a section drags; and just before the offer or call to action. The first-seconds drop is usually the steepest, and the pre-offer drop is the most costly because those viewers came the furthest before leaving.`,
    },
    {
      q: `Can I see a drop-off point from view counts alone?`,
      a: `No. Total views, unique viewers, and play rate tell you how many people started the video but never when they left. A video with thousands of views could keep almost everyone or lose most of them in the first ten seconds — the count is identical either way. To see drop-off you need an audience-retention curve, ideally cross-checked against a second-by-second heatmap.`,
    },
  ],
};
