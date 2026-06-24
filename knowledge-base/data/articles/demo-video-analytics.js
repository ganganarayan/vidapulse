'use strict';

module.exports = {
  metaTitle: `What is demo video analytics? | VidaPulse`,
  metaDescription: `Demo video analytics measures how far prospects watch your product demo, which feature loses them, and what share reach the CTA — so you fix the drop-off.`,
  answer: `Demo video analytics is the measurement of a product demo as a guided walkthrough: how far prospects watch, which part of the walkthrough loses them, and what share reach the call to action at the end. A demo earns the next step only if prospects stay long enough to see the feature that matters to them, so the numbers that count are retention across the walkthrough, the drop-off points between features, and reach-to-CTA. Good demo video analytics shows you exactly which moment in the demo sends prospects away before they ask for a trial or a call.`,
  sections: [
    {
      h2: `Why a demo needs its own analytics`,
      html: `<p>A product demo is a sequence of explanations — setup, then feature after feature, then the ask. Unlike a short ad, a demo asks for sustained attention, and prospects give it conditionally: they stay while a section feels relevant and leave the moment it stops earning that patience. A demo that drops people during the third feature never gets them to the CTA, however good the close is.</p>
<p>A view count cannot see any of that. It tells you a prospect started the demo, not which feature lost them or whether they reached the ask. Demo video analytics measures the inside of the walkthrough, so the drop is attached to a specific part of the product story.</p>`,
    },
    {
      h2: `Where prospects drop`,
      html: `<p>The foundation is the <strong>audience-retention curve</strong>: the share of prospects still watching at every second of the demo. Read against your walkthrough, it maps attention to specific segments.</p>
<ul class="kb-list"><li><strong>Setup and intro</strong> — an early cliff usually means the demo takes too long to show something the prospect came for.</li>
<li><strong>Feature transitions</strong> — drops clustered at the seams between features point to sections that feel irrelevant or run long.</li>
<li><strong>Average watch time and play rate</strong> — how much of the walkthrough the typical prospect consumes, and how many who land actually press play.</li></ul>
<p>The curve turns "prospects watched the demo" into a precise list of which features hold attention and which ones lose it.</p>`,
    },
    {
      h2: `Reach-to-CTA`,
      html: `<p>The number that connects the demo to pipeline is <strong>reach-to-CTA</strong>: the percentage of prospects who reach the second your call to action appears. This is the share who actually hear the ask after the walkthrough — and on a long demo it is often far lower than the play count implies.</p>
<ol><li>Find the timestamp where your CTA begins, and read the curve at that exact point to see what share of prospects made it.</li>
<li>With conversion and CTA tracking (a Pro feature), see how many of those who reach the CTA click through to a trial, a booking, or the next step.</li></ol>
<p class="kb-example">Hypothetical: if reach-to-CTA reads fifteen percent but those who reach it click through well, your demo is losing prospects mid-walkthrough, not at the ask. If many reach the CTA but few click, the close needs work. Demo video analytics is how you separate a walkthrough problem from a CTA problem.</p>`,
    },
    {
      h2: `From the curve to a tighter demo`,
      html: `<p>Once you can see where prospects drop, improving the demo is a loop: read the curve, cut or tighten the single segment with the steepest drop, then re-measure to confirm more prospects reached the CTA.</p>
<p>With Pro, the second-by-second engagement heatmap pins the exact moment within a feature that loses people, and viewer-level history shows how prospects move through the walkthrough. VidaPulse measures the video step — not a full multi-page funnel suite — but the demo is usually the longest, leakiest step before the ask, so it is where measuring pays off most.</p>`,
    },
  ],
  solve: `<p>VidaPulse gives you demo video analytics without re-hosting and without code. You paste your demo's existing URL (YouTube, Amazon S3, Google Drive, Dropbox, OneDrive, Azure Blob, Loom, a Zoom recording, Vimeo, or a direct MP4/HLS), VidaPulse wraps it in an analytics player, and you embed it with one line of script or a script-free iframe on any page — WordPress, Webflow, ClickFunnels, or custom HTML. The demo stays where it lives and keeps its URL.</p>
<p>On your demo you can read:</p>
<ul class="kb-list"><li>The <strong>audience-retention curve, average watch time, and play rate</strong> — where prospects drop.</li>
<li>The <strong>percentage of viewers who reach any point</strong> — reach-to-CTA, the share who hear the ask.</li>
<li><strong>Conversion and CTA tracking</strong> (Pro) — whether prospects who reach the CTA act.</li>
<li>The <strong>second-by-second heatmap and viewer-level history</strong> (Pro) — the exact moment within a feature that loses people.</li>
<li><strong>UTM and source attribution</strong> — how each traffic source watches the demo.</li></ul>
<p>No personal data is collected, and you can restrict the player to your own domains. Start free and measure your demo video: wrap your walkthrough, pull the retention curve, and find the feature that is sending prospects away before the ask.</p>`,
  faq: [
    {
      q: `What does demo video analytics measure?`,
      a: `It measures the demo as a walkthrough: the retention curve across the whole video, average watch time and play rate, the drop-off points between features, the percentage of prospects who reach the CTA, and — with conversion tracking — how many of those who reach it act. Together these show which part of the demo loses prospects before the ask.`,
    },
    {
      q: `How do I know which feature is losing prospects?`,
      a: `Read the retention curve against your walkthrough order. Drops clustered at a particular segment or feature transition show where prospects leave. With the second-by-second heatmap (Pro), you can pin the exact moment inside that feature, so you tighten the real culprit instead of guessing.`,
    },
    {
      q: `Do I have to move my demo to track it?`,
      a: `No. You paste the demo's existing URL — from YouTube, S3, Drive, Dropbox, OneDrive, Azure Blob, Loom, Zoom, Vimeo, or a direct MP4/HLS link — and VidaPulse wraps it in an analytics player you embed with one line of script or a script-free iframe. Nothing is re-hosted and the demo keeps its URL.`,
    },
  ],
};
