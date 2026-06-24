'use strict';

module.exports = {
  metaTitle: `What is product video launch analytics? | VidaPulse`,
  metaDescription: `Product video launch analytics measures how far viewers watch your launch video, where they drop, and whether they click through — to iterate fast mid-launch.`,
  answer: `Product video launch analytics is the measurement of a product or launch video while the launch is live: how far viewers watch, where they drop off, and whether they click through to act. During a launch, attention is at its peak and time is short, so you cannot afford to guess. Reading the retention curve and reach-to-CTA in near real time lets you spot the leak, fix it, and re-measure within the launch window — instead of discovering after it ends that most viewers left before the offer.`,
  sections: [
    {
      h2: `Why launches need their own video analytics`,
      html: `<p>A product launch concentrates attention into a short window. The launch or product video usually carries the core message — what the product does, why it matters, and what to do next — and that video is where most of the launch's drop-off happens. If it loses viewers before the call to action, every other launch asset is working against a leak no one can see.</p>
<p>The difference during a launch is speed. You do not have weeks to learn from the data; you have days, sometimes hours. Product video launch analytics exists to make the video step legible fast enough to act on while the launch is still running.</p>`,
    },
    {
      h2: `Measure how far viewers watch`,
      html: `<p>The foundation is the <strong>audience-retention curve</strong>: the share of viewers still watching at every second of the launch video. It turns "people watched the video" into a precise map of where attention holds and where it falls off.</p>
<ul class="kb-list"><li><strong>Flat stretches</strong> are sections that hold attention — leave them alone.</li>
<li><strong>Steep cliffs</strong> are where viewers leave — these are your targets.</li>
<li><strong>Average watch time and play rate</strong> give you the launch-wide context: how much of the video the typical viewer consumes, and how many who land actually press play.</li></ul>
<p>Read alongside total and unique viewers, this tells you not just how many showed up to the launch, but how much of the message actually landed.</p>`,
    },
    {
      h2: `Find where they drop and whether they click`,
      html: `<p>Two numbers turn the curve into action during a launch:</p>
<ol><li><strong>Reach-to-CTA:</strong> read the percentage of viewers who reach the second your call to action appears. This is the share who even hear the ask.</li>
<li><strong>CTA clicks:</strong> with conversion and CTA tracking (a Pro feature), see how many of those who reach the CTA actually click through during the launch.</li></ol>
<p class="kb-example">Hypothetical: if the curve reads 25% at your CTA but clicks are strong among those who reach it, your problem is the run-up losing viewers, not the offer. If many reach the CTA but few click, the ask itself needs work. The two have opposite fixes, and during a launch you need to know which one to make.</p>
<p>A second-by-second engagement heatmap (Pro) pins the exact moment viewers bail, so a mid-launch edit lands on the real culprit.</p>`,
    },
    {
      h2: `Iterate fast inside the launch window`,
      html: `<p>The point of launch analytics is to act before the window closes. Once you can see the drop, you can fix it and re-measure on the same live traffic.</p>
<ol><li><strong>Find the steepest drop</strong> ahead of your CTA on the retention curve.</li>
<li><strong>Fix the one section</strong> before it — tighten the pacing or strengthen the proof, depending on what the data shows.</li>
<li><strong>Republish</strong> the edited video. Because nothing is re-hosted, the same embed keeps working.</li>
<li><strong>Compare the new curve</strong> against the earlier one as fresh launch traffic flows through.</li></ol>
<p>Each round either lifts the share reaching the CTA or lifts the clicks once they get there. During a launch, that compounding is the whole game — small, measured fixes made while attention is still high.</p>`,
    },
    {
      h2: `Read it by source during the launch`,
      html: `<p>Launch traffic arrives from many directions at once — emails, posts, ads, partner links. The same launch video can perform very differently depending on who arrives, and blending all of it into one number hides that.</p>
<p>With UTM tags on your launch links, VidaPulse attributes each viewer to a source, so you can compare retention, reach-to-CTA, and clicks per channel in near real time. That tells you which sources are sending viewers who actually watch and act, and which are sending plays that drop off early — useful while you still have time to shift where you point the launch.</p>
<p>VidaPulse measures the video step of the launch specifically. It is not a full page-by-page funnel suite, but the launch video is where most of the drop-off happens, so it is the step worth measuring fastest.</p>`,
    },
  ],
  solve: `<p>VidaPulse gives you product video launch analytics without re-hosting and without code, so you can wire it up before the launch and act during it. You paste your launch video's existing URL (YouTube, Amazon S3, Google Drive, Dropbox, OneDrive, Azure Blob, Loom, a Zoom recording, Vimeo, or a direct MP4/HLS), VidaPulse wraps it in an analytics player, and you embed it with one line of script or a script-free iframe on any page — WordPress, Webflow, ClickFunnels, or custom HTML. The video keeps its URL.</p>
<p>During the launch you can read:</p>
<ul class="kb-list"><li>The <strong>audience-retention curve, average watch time, and play rate</strong> — how far viewers watch.</li>
<li>The <strong>percentage of viewers who reach any point</strong> — reach-to-CTA, the share who hear the ask.</li>
<li><strong>Conversion and CTA tracking</strong> (Pro) — how many click through during the launch.</li>
<li>The <strong>second-by-second engagement heatmap</strong> (Pro) — the exact moment viewers bail.</li>
<li><strong>UTM and source attribution</strong> — how each launch channel performs.</li></ul>
<p>Because the analytics live in the embedded player, you can edit and republish mid-launch and compare the new curve against the old on live traffic. No personal data is collected. Create a free VidaPulse account, wrap your launch video, and find its leak while the launch is still running.</p>`,
  faq: [
    {
      q: `Can I see launch results fast enough to act during the launch?`,
      a: `Yes — that is the point. As launch traffic flows through the embedded player, you read the retention curve, reach-to-CTA, and clicks. When you spot the drop, you fix the section before it, republish, and compare the new curve against the old on the same live traffic. Because nothing is re-hosted, the embed keeps working through every edit.`,
    },
    {
      q: `Do I have to re-upload my launch video to track it?`,
      a: `No. You paste the launch video's existing URL — from YouTube, S3, Drive, Dropbox, OneDrive, Azure Blob, Loom, Zoom, Vimeo, or a direct MP4/HLS link — and VidaPulse wraps it in an analytics player you embed with one line of script or a script-free iframe. The video stays where it is, which is what lets you iterate fast mid-launch.`,
    },
    {
      q: `Does it track the whole launch funnel or just the video?`,
      a: `VidaPulse measures the video step — how far viewers watch, where they drop, reach-to-CTA, and clicks, by source. It is not a full multi-page funnel suite, so it does not map every page of the launch. It focuses on the launch video because that is where most of the drop-off happens and where fast iteration pays off most.`,
    },
  ],
};
