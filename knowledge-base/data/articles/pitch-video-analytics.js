'use strict';

module.exports = {
  metaTitle: `What is pitch video analytics? | VidaPulse`,
  metaDescription: `Pitch video analytics measures watch depth as a signal of interest on outreach and pitch videos — aggregate and anonymous, with no personal data collected.`,
  answer: `Pitch video analytics is the measurement of a pitch or outreach video as an interest signal: how far recipients watch, where they stop, and how engaged the audience is overall. With a pitch, watch depth is a proxy for interest — someone who watches to the end is telling you something different from someone who quits in the first few seconds. VidaPulse reads this in aggregate and anonymously: it shows you the retention pattern across viewers without collecting personal data or identifying who watched.`,
  sections: [
    {
      h2: `Why watch depth is the interest signal`,
      html: `<p>A pitch or outreach video is sent to make a case and gauge whether anyone cares. Unlike a public marketing video, its value is partly diagnostic: the fact that recipients watched, and how far, tells you how warm the audience is before you spend more effort. Watch depth becomes a stand-in for interest.</p>
<p>A view count flattens that signal. It says someone opened the pitch, not whether they leaned in or bailed at the first slide. Pitch video analytics measures the inside of the video, so the depth of attention — the actual interest signal — becomes visible across your audience.</p>`,
    },
    {
      h2: `What it measures`,
      html: `<p>The core is the <strong>audience-retention curve</strong>: the share of viewers still watching at every second of the pitch, read across everyone who played it.</p>
<ul class="kb-list"><li><strong>Deep, flat retention</strong> — the audience is engaged and the pitch is holding interest.</li>
<li><strong>An early cliff</strong> — the opening is not making the case fast enough, and the pitch loses people before the substance.</li>
<li><strong>Average watch time, play rate, and replays</strong> — how much of the pitch the typical viewer consumes, how many start it, and which moments get rewatched.</li></ul>
<p>Replays matter on a pitch: a moment viewers rewind to is one they found compelling or wanted to study, which is a strong signal about what is resonating.</p>`,
    },
    {
      h2: `Aggregate and anonymous by design`,
      html: `<p>Pitch and outreach can tempt you toward tracking individuals, but VidaPulse does not do that — and for a pitch that distinction matters. The analytics are aggregate and anonymous: you see the retention pattern across viewers, not a name attached to a session.</p>
<p>VidaPulse collects no personal data. It does not identify who watched, tie viewing to an email address, or build a profile of a recipient. What you get is the shape of attention across your audience — where interest holds and where it drops — which is the part that actually tells you whether the pitch is working.</p>
<p class="kb-example">Hypothetical: if most viewers drop within the first stretch but a meaningful share who pass it watch to the end, your pitch is filtering hard at the open. Tightening the first section may carry more of the interested audience through — and you learn that from the aggregate curve alone, without identifying anyone.</p>`,
    },
    {
      h2: `From the curve to a sharper pitch`,
      html: `<p>Once you can see watch depth across viewers, refining the pitch is a loop: find the steepest drop, tighten the section before it, then re-measure to confirm more of the audience reached the substance. Because attention depth stands in for interest, a flatter, deeper curve over time means the pitch is holding warmer attention.</p>
<p>With Pro, the second-by-second engagement heatmap shows the exact moment the pitch loses people. VidaPulse measures the video step specifically and reports it without personal data, so you get the interest signal you need without crossing into tracking individuals.</p>`,
    },
  ],
  solve: `<p>VidaPulse gives you pitch video analytics without re-hosting and without code. You paste your pitch or outreach video's existing URL (YouTube, Amazon S3, Google Drive, Dropbox, OneDrive, Azure Blob, Loom, a Zoom recording, Vimeo, or a direct MP4/HLS), VidaPulse wraps it in an analytics player, and you embed it with one line of script or a script-free iframe on any page — WordPress, Webflow, ClickFunnels, or custom HTML. The video stays where it lives and keeps its URL.</p>
<p>On your pitch video you can read:</p>
<ul class="kb-list"><li>The <strong>audience-retention curve, average watch time, play rate, and replays</strong> — watch depth as an interest signal.</li>
<li>The <strong>percentage of viewers who reach any point</strong> — how much of the audience reaches the substance.</li>
<li>The <strong>second-by-second engagement heatmap</strong> (Pro) — the exact moment the pitch loses people.</li>
<li><strong>UTM and source attribution</strong> — how each channel engages with the pitch.</li></ul>
<p>All of it is aggregate and anonymous — no personal data is collected, no recipient is identified — and you can restrict the player to your own domains. Start free and measure your pitch video: wrap it, read the watch-depth curve, and see where interest holds and where it drops.</p>`,
  faq: [
    {
      q: `What does pitch video analytics measure?`,
      a: `It measures watch depth as an interest signal across your audience: the retention curve, average watch time, play rate, replays, and the percentage of viewers who reach any point — plus, with Pro, a second-by-second heatmap. Together these show how engaged the audience is and where the pitch loses people, all in aggregate.`,
    },
    {
      q: `Can I see which individual recipient watched my pitch?`,
      a: `No. VidaPulse collects no personal data and does not identify who watched. Pitch video analytics is aggregate and anonymous — you see the retention pattern across all viewers, not a name tied to a session. That aggregate shape of attention is what tells you whether the pitch is holding interest.`,
    },
    {
      q: `Do I have to re-upload my pitch video to track it?`,
      a: `No. You paste the pitch's existing URL — from YouTube, S3, Drive, Dropbox, OneDrive, Azure Blob, Loom, Zoom, Vimeo, or a direct MP4/HLS link — and VidaPulse wraps it in an analytics player you embed with one line of script or a script-free iframe. Nothing is re-hosted and the video keeps its URL.`,
    },
  ],
};
