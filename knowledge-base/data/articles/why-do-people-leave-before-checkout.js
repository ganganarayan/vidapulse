'use strict';

module.exports = {
  metaTitle: `Why do people leave before checkout? | VidaPulse`,
  metaDescription: `People leave before checkout when the video's pitch fails ahead of the buy step. Check whether they reach the offer and click through, then fix the run-up.`,
  answer: `People usually leave before checkout because the video that carries the pitch failed before the buy step ever appeared — not because the checkout itself is broken. If the argument loses them in the run-up, they never reach the offer, and a checkout no one arrives at cannot convert. The way to diagnose it is to check two numbers: what percentage of viewers reach the offer in the video, and how many of those click through. Then you fix the section that comes before the drop, not the checkout page.`,
  sections: [
    {
      h2: `The leak is usually before the buy step, not at it`,
      html: `<p>When checkouts stay empty, the natural instinct is to redesign the checkout — change the button, the copy, the form. But in a video sales funnel, the video does the persuading, and the checkout only collects a decision the video was supposed to produce. If the video does not justify the purchase, the checkout has nothing to work with.</p>
<p>So the real question is not "what is wrong with my checkout?" It is "how many people did the video actually carry to the point of buying?" Most of the time the answer is: far fewer than you assumed, because the pitch in the video failed somewhere upstream.</p>`,
    },
    {
      h2: `Check whether viewers even reach the offer`,
      html: `<p>The first number to pull is the <strong>percentage of viewers who reach any point</strong>, read at the exact second your offer or buy step appears. This is reach-to-offer, and it is the number that determines everything downstream.</p>
<ol><li><strong>Find the timestamp</strong> where the offer, price, or buy prompt appears in the video.</li>
<li><strong>Read the retention curve at that point.</strong> The value there is the share of starters still watching when the offer arrived.</li>
<li><strong>Treat that as the ceiling on your checkout.</strong> No one can buy who never heard the offer.</li></ol>
<p class="kb-example">Hypothetical: if 1,000 viewers start and the curve reads 15% at your offer, only about 150 ever reach the buy step — and the checkout can only convert from those 150, not the full thousand. Raising that share is usually a bigger win than any button tweak.</p>`,
    },
    {
      h2: `Then check whether they click through`,
      html: `<p>Reaching the offer and acting on it are two different things. Once you know how many viewers survive to the offer, the next number is how many of them actually click through to the checkout.</p>
<p>Conversion and CTA tracking (a Pro feature) gives you this. It separates two very different problems:</p>
<ul class="kb-list"><li><strong>Few reach the offer:</strong> the leak is in the run-up — the pitch loses people before the ask.</li>
<li><strong>Many reach the offer but few click:</strong> the leak is the hand-off — the ask itself is weak, unclear, or buried.</li></ul>
<p>Without both numbers you cannot tell these apart, and they have opposite fixes. Guessing wrong means you "improve" the part that was already working.</p>`,
    },
    {
      h2: `Fix the run-up to the offer`,
      html: `<p>When the diagnosis points to the run-up, the fix is the section of the video right before the drop, not the checkout. Use the retention curve to find the steepest fall ahead of the offer, then treat the seconds before it as the suspect.</p>
<ul class="kb-list"><li><strong>If value was not built,</strong> strengthen the proof and outcome before the ask so the offer feels earned when it arrives.</li>
<li><strong>If the run-up dragged,</strong> tighten the pacing — cut tangents and restated points so more viewers survive to the offer.</li>
<li><strong>If the ask is weak,</strong> make the next step explicit and singular and restate the value at the moment of the CTA.</li></ul>
<p>A second-by-second engagement heatmap (Pro) helps you pin the exact line where viewers bail, so the edit lands on the real culprit. Fix one thing, then re-measure.</p>`,
    },
    {
      h2: `Re-test and compare`,
      html: `<p>After the change, run real traffic through the new version until the curve stabilizes, then compare against the baseline.</p>
<ol><li><strong>Did reach-to-offer rise?</strong> More viewers now arrive at the buy step.</li>
<li><strong>Did CTA clicks rise?</strong> More of those viewers acted.</li>
<li><strong>Keep the change if both held or improved;</strong> revert and try the other lever if not.</li></ol>
<p>Only once the video carries more people to the offer and more of them click through does it make sense to scrutinize the checkout page itself. In a video funnel, the checkout is rarely the first thing to fix — the video almost always is.</p>`,
    },
  ],
  solve: `<p>VidaPulse measures the exact part of this that goes blind: how many viewers your video carries to the offer, and how many click through. You paste any video URL from wherever it already lives (YouTube, Amazon S3, Google Drive, Dropbox, OneDrive, Azure Blob, Loom, a Zoom recording, Vimeo, or a direct MP4/HLS), VidaPulse wraps it in an analytics player, and you embed it with one line of script or a script-free iframe on any page — WordPress, Webflow, ClickFunnels, or custom HTML. No re-hosting; the video keeps its URL.</p>
<p>Then the diagnosis is concrete:</p>
<ul class="kb-list"><li>The <strong>percentage of viewers who reach any point</strong> gives you reach-to-offer — the ceiling on your checkout.</li>
<li>The <strong>audience-retention curve</strong> shows where in the run-up the pitch loses people.</li>
<li><strong>Conversion and CTA tracking</strong> (Pro) tells you how many who reach the offer actually click through.</li>
<li>The <strong>second-by-second engagement heatmap</strong> (Pro) pins the exact line where viewers bail before the buy step.</li></ul>
<p>VidaPulse measures the video step of the funnel, which is where the leak before checkout almost always lives. It is not a full page-by-page funnel suite, but it pinpoints the video that most funnels leak at. No personal data is collected. Create a free VidaPulse account, wrap your funnel's video, and find your funnel's video leak before you touch the checkout.</p>`,
  faq: [
    {
      q: `Should I redesign my checkout page first?`,
      a: `Usually not. In a video funnel the video produces the decision and the checkout only collects it, so if few viewers reach the offer the checkout has nothing to convert. Check reach-to-offer and CTA clicks first. If both are healthy and the checkout still stalls, then the page is worth scrutinizing — but the video is almost always the real leak.`,
    },
    {
      q: `How do I tell a run-up problem from a weak-ask problem?`,
      a: `Use two numbers. If few viewers reach the offer, the leak is in the run-up — the pitch loses people before the ask. If many reach the offer but few click through, the leak is the hand-off — the ask itself is weak or unclear. They have opposite fixes, so measure both before editing.`,
    },
    {
      q: `Can VidaPulse track the checkout page itself?`,
      a: `VidaPulse measures the video step — retention, the percentage who reach your offer, and CTA clicks. It is not a full multi-page funnel suite and does not track the checkout page directly. But it pinpoints the video where most funnels leak, which is usually upstream of the checkout and the more important thing to fix first.`,
    },
  ],
};
