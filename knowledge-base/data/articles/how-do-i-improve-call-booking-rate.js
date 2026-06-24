'use strict';

module.exports = {
  metaTitle: `How do I improve my call booking rate? | VidaPulse`,
  metaDescription: `Improve your call booking rate by making the VSL carry viewers to the booking CTA. Measure the share reaching the CTA and the clicks, then fix the run-up.`,
  answer: `You improve your call booking rate by treating the video as the thing that has to carry viewers all the way to the booking CTA. If the VSL loses them before the ask, the booking page never gets a chance. Measure two numbers — the percentage of viewers who reach the booking CTA and how many of them click through — then fix the section right before the ask so more people survive to it. For coaches, consultants, and B2B sellers, the booked call is usually won or lost inside the video, not on the calendar page.`,
  sections: [
    {
      h2: `The VSL has to carry viewers to the ask`,
      html: `<p>For coaches, consultants, and B2B sellers, the booked call is the conversion. The booking page — the calendar, the form — only collects a decision the video was supposed to produce. If the VSL does not build enough trust and clarity to make someone want the call, the booking page has nothing to work with.</p>
<p>So a low booking rate is rarely a calendar problem. It is almost always a video problem: the VSL either loses viewers before the booking CTA, or reaches it without making the ask compelling. Both are measurable, and both are fixed inside the video.</p>`,
    },
    {
      h2: `Measure the percentage reaching the booking CTA`,
      html: `<p>The first number is the <strong>percentage of viewers who reach any point</strong>, read at the exact second your booking CTA appears. This tells you how many people even hear the invitation to book.</p>
<ol><li><strong>Find the timestamp</strong> where you invite the viewer to book a call.</li>
<li><strong>Read the retention curve at that point.</strong> The value there is the share of starters still watching when the ask arrived.</li>
<li><strong>Treat that as the ceiling on your booking rate.</strong> No one books who never reached the ask.</li></ol>
<p class="kb-example">Hypothetical: if 500 people start the VSL and the curve reads 20% at your booking CTA, only about 100 ever hear the invitation. The calendar can only convert from those 100, so raising that share is usually the biggest available win.</p>`,
    },
    {
      h2: `Measure clicks on the booking CTA`,
      html: `<p>Reaching the ask and acting on it are different. Once you know how many viewers survive to the booking CTA, the next number is how many of them click through to the calendar.</p>
<p>Conversion and CTA tracking (a Pro feature) separates two distinct problems:</p>
<ul class="kb-list"><li><strong>Few reach the CTA:</strong> the leak is in the run-up — the VSL loses people before the ask.</li>
<li><strong>Many reach the CTA but few click:</strong> the leak is the ask itself — the invitation is weak, vague, or makes the call feel like a sales trap rather than a useful next step.</li></ul>
<p>These have opposite fixes, so you need both numbers before you start editing.</p>`,
    },
    {
      h2: `Fix the section before the ask`,
      html: `<p>When few viewers reach the CTA, the fix is the section of the VSL right before the booking ask. Use the retention curve to find the steepest drop ahead of the CTA, then treat the seconds before it as the suspect.</p>
<ul class="kb-list"><li><strong>If trust was not built,</strong> strengthen the proof — the outcome, the case, the reason this call is worth their time — before the ask.</li>
<li><strong>If the run-up dragged,</strong> tighten the pacing so more viewers survive to the invitation.</li>
<li><strong>If the ask is the problem,</strong> make it explicit and low-friction: name exactly what the call covers, who it is for, and what they walk away with.</li></ul>
<p>A second-by-second engagement heatmap (Pro) helps you pin the exact line where viewers leave, so the edit lands on the real culprit rather than a guess. Change one thing at a time.</p>`,
    },
    {
      h2: `Re-test and compare`,
      html: `<p>After the change, run real traffic through the new VSL until the curve stabilizes, then compare against your baseline.</p>
<ol><li><strong>Did more viewers reach the booking CTA?</strong> A higher reach-to-CTA share means a higher ceiling on bookings.</li>
<li><strong>Did CTA clicks rise?</strong> More of those viewers acted on the invitation.</li>
<li><strong>Keep the change if both held or improved;</strong> revert and try the other lever if not.</li></ol>
<p>Repeat the loop on the next biggest drop. Each round either lifts the share reaching the ask or lifts the clicks once they get there — and both feed directly into your booking rate.</p>`,
    },
  ],
  solve: `<p>VidaPulse measures the part of booking that usually goes blind: how far your VSL carries viewers toward the booking CTA, and how many click it. You paste any video URL from wherever it already lives (YouTube, Amazon S3, Google Drive, Dropbox, OneDrive, Azure Blob, Loom, a Zoom recording, Vimeo, or a direct MP4/HLS), VidaPulse wraps it in an analytics player, and you embed it with one line of script or a script-free iframe on any page — WordPress, Webflow, ClickFunnels, or custom HTML. No re-hosting; the VSL keeps its URL.</p>
<p>Then improving the booking rate becomes measured work:</p>
<ul class="kb-list"><li>The <strong>percentage of viewers who reach any point</strong> gives you the share who reach the booking CTA — the ceiling on your bookings.</li>
<li>The <strong>audience-retention curve</strong> shows where in the run-up the VSL loses people before the ask.</li>
<li><strong>Conversion and CTA tracking</strong> (Pro) tells you how many who reach the CTA actually click through to the calendar.</li>
<li>The <strong>second-by-second engagement heatmap</strong> (Pro) pins the exact line where viewers bail.</li></ul>
<p>VidaPulse measures the video step of the funnel, which for a booked-call offer is where the decision is really made. No personal data is collected. Create a free VidaPulse account, wrap your VSL, and find the section that is costing you booked calls.</p>`,
  faq: [
    {
      q: `Should I change my booking page or calendar first?`,
      a: `Usually not. The VSL produces the decision to book; the calendar only collects it. If few viewers reach the booking CTA, the calendar has almost nothing to convert. Check the percentage reaching the CTA and the click rate first. If both are healthy and bookings still lag, then the booking page is worth a look — but the video is the more common leak.`,
    },
    {
      q: `How do I know if the problem is the run-up or the ask?`,
      a: `Use two numbers. If few viewers reach the booking CTA, the run-up is losing them before the ask, so tighten or strengthen the section before it. If many reach the CTA but few click, the ask itself is weak — make it explicit and low-friction. Measuring both stops you from fixing the part that already worked.`,
    },
    {
      q: `Does this work for B2B demo and sales videos too?`,
      a: `Yes. Any video whose job is to drive a booked call works the same way — a B2B demo or sales video must carry the viewer to the ask. Measure the share reaching the CTA and the clicks, then fix the section before the ask. VidaPulse measures the video step where that decision is made.`,
    },
  ],
};
