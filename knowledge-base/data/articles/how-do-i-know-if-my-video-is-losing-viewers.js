'use strict';

module.exports = {
  metaTitle: `How do I know if my video is losing viewers? | VidaPulse`,
  metaDescription: `Three signs your video is losing viewers: low average watch time, a steep early retention drop, and few reaching the offer. Here's how to measure each.`,
  answer: `You know your video is losing viewers when three signs show up: average watch time is low relative to the runtime, the audience-retention curve drops steeply early instead of declining gently, and only a small share of viewers reach the end or your offer. View counts cannot tell you any of this — they only count who pressed play, not who stayed. To measure it properly you need an audience-retention curve on the video as it runs on your own page, because that is the report that shows when attention falls, not just how much traffic arrived.`,
  sections: [
    {
      h2: `Sign one: low average watch time`,
      html: `<p>The fastest gut check is <strong>average watch time</strong> measured against your runtime. If your VSL runs eight minutes and the average viewer watches ninety seconds, the average person is leaving long before the offer — the video is losing viewers, badly.</p>
<p>Read it as a ratio, not an absolute. Ninety seconds sounds fine until you compare it to an eight-minute video, where it means most people quit in the first fifth. A healthy average sits close enough to the runtime that the typical viewer reaches the part that sells. A low average is the first and clearest alarm.</p>`,
    },
    {
      h2: `Sign two: a steep early drop`,
      html: `<p>Average watch time tells you <em>that</em> you are losing viewers; the <strong>audience-retention curve</strong> tells you <em>where</em>. The curve plots the percentage of viewers still watching at each second, and the shape is the signal. A gentle, even slope is normal attrition. A <em>steep cliff early</em> — the line falling sharply in the first seconds — means the hook is failing and most viewers never give the video a chance.</p>
<p>This early cliff is the most common loss pattern and often the most damaging, because it happens before any of your value lands. If the curve drops from 100% to half in the first ten seconds, no amount of polish later in the video can save the people who already left.</p>`,
    },
    {
      h2: `Sign three: few reach the end or offer`,
      html: `<p>The third sign is the one tied directly to money: the <strong>percentage of viewers who reach any point</strong> — specifically, the second your offer or call to action begins. This number is your real scoreboard, because a viewer who never reaches the offer can never convert no matter how good the offer is.</p>
<p>If only a small fraction of the people who started reach your offer, the video is losing viewers in the stretch that matters most. You can read this at the end of the runtime too — how many make it to the final frame — but the offer timestamp is the more useful checkpoint, since that is where the sale happens.</p>
<p class="kb-example">Hypothetical illustration: if 1,000 people start the VSL and the retention curve reads 12% at your offer timestamp, only about 120 viewers ever hear the ask. Raising that share is usually the highest-leverage change you can make.</p>`,
    },
    {
      h2: `Why view counts hide the problem`,
      html: `<p>The trap is reading success from totals. Total views, unique viewers, and play rate all measure the same thing: how many people <em>started</em>. None of them measure who stayed. A video can post strong view numbers and still lose almost everyone in the first ten seconds — the count looks identical whether viewers watch to the end or quit instantly.</p>
<p>That is why a video can feel like it is "getting views" while quietly failing. The view count is rising; the retention is collapsing; and without a retention curve you would never see the gap. To know whether you are losing viewers, you have to measure attention across the timeline, not arrivals at the start.</p>`,
    },
    {
      h2: `How to measure it properly`,
      html: `<p>Measuring this well comes down to looking at the right reports on the right video:</p>
<ol><li><strong>Check average watch time against runtime.</strong> If the ratio is low, you are losing viewers — move to the curve to find out where.</li>
<li><strong>Read the audience-retention curve for shape.</strong> Note whether the steepest drop is at the start, in the middle, or just before the offer.</li>
<li><strong>Read the percentage reaching your offer timestamp.</strong> Treat that single number as your scoreboard.</li>
<li><strong>Measure on your own page, not the host platform.</strong> Native reports like YouTube's only cover watches on their own site and do not follow your embed onto a VSL or landing page, so they cannot tell you how your real audience behaves.</li></ol>
<p>Done together, these three readings turn a vague worry into a precise answer: yes or no, you are losing viewers, here is where, and here is how many reach the part that matters.</p>`,
    },
  ],
  solve: `<p>VidaPulse gives you all three signs on the video that matters — the one embedded on your own page. You paste any video URL from wherever it already lives (YouTube, Amazon S3, Google Drive, Dropbox, OneDrive, Azure Blob, Loom, a Zoom recording, Vimeo, or a direct MP4/HLS), VidaPulse wraps it in an analytics player, and you embed it with one line of script or a script-free iframe. No re-hosting — your video stays where it is.</p>
<p>The signs become numbers you can read at a glance:</p>
<ul class="kb-list"><li><strong>Average watch time</strong> against your runtime tells you immediately whether the typical viewer is leaving early.</li>
<li>The <strong>audience-retention curve</strong> shows the shape of the loss — whether the steep drop is at the start, the middle, or before the offer.</li>
<li>The <strong>percentage of viewers who reach any point</strong> gives you the share who make it to your offer — your scoreboard.</li>
<li>The <strong>second-by-second engagement heatmap</strong> (Pro) pins the exact second behind any drop you find.</li></ul>
<p>Because the tracking lives in the embedded player, you measure all of this on the page where your VSL or product video really runs, not just on the host platform. Unique viewers are counted with a first-party identifier and no personal data is collected. Create a free VidaPulse account, wrap your own video, and read these three reports to see whether — and where — you are losing viewers.</p>`,
  faq: [
    {
      q: `Can I tell my video is losing viewers from the view count?`,
      a: `No. View counts, unique viewers, and play rate only measure how many people started the video, never who stayed. A video can show strong view numbers while losing almost everyone in the first ten seconds. To know whether you are losing viewers you need average watch time and an audience-retention curve, which track attention across the timeline.`,
    },
    {
      q: `What's a quick way to check if I'm losing viewers?`,
      a: `Compare average watch time to your runtime. If the average viewer watches only a small fraction of the video, you are losing them early. It is the fastest single check; the audience-retention curve then shows you exactly where the loss happens and the percentage reaching your offer tells you how many make it to the part that sells.`,
    },
    {
      q: `Why can't I just use YouTube's retention report?`,
      a: `YouTube's report only covers the video as watched on YouTube itself — it does not follow your embed onto a VSL or landing page, where viewer behavior is usually different. If your video runs on your own page, you need a tool that tracks that embedded player so you measure your real audience, not the platform's.`,
    },
  ],
};
