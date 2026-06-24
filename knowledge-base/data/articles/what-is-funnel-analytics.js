'use strict';

module.exports = {
  metaTitle: `What is funnel analytics? | VidaPulse`,
  metaDescription: `Funnel analytics measure how prospects move through your steps and where they drop. Learn the concept, then how to read the video step where most funnels leak.`,
  answer: `Funnel analytics is the practice of measuring how prospects move through the steps of your funnel and pinpointing where they fall out before converting. Instead of looking at one number at the end, you watch how many people clear each stage, so a drop between two steps tells you exactly which stage is leaking. For funnels built on video, the single step that quietly loses the most people is usually the video itself, because that is where you make the actual pitch. Funnel analytics tells you which step leaks; reading the video step second by second tells you why.`,
  sections: [
    {
      h2: `A working definition of funnel analytics`,
      html: `<p><strong>Funnel analytics</strong> is the measurement of how prospects move through the sequence of steps between first contact and a completed action, and where they drop out along the way. A funnel is just an ordered set of stages a person passes through, narrowing at each step: more people arrive than advance, and more advance than convert. Funnel analytics records that narrowing so you can see it instead of guess at it.</p>
<p>The core idea is the <strong>step-to-step transition</strong>. A funnel measured well does not report a single conversion rate; it reports how many people enter each stage and how many continue to the next. The gap between two stages is a drop-off, and the largest gap is where you are losing the most people for the least reason. That shift, from one end-of-funnel number to a stage-by-stage view, is what turns a vague "sales are low" into a specific "people fall out right here."</p>`,
    },
    {
      h2: `The steps of a typical sales funnel`,
      html: `<p>Most funnels that sell with video share the same backbone, even when the surface differs. Laid out in order, the stages usually look like this:</p>
<ul class="kb-list"><li><strong>Traffic</strong> — the clicks, ad impressions, or visits that bring people to the page where your video lives.</li>
<li><strong>The video</strong> — the VSL, demo, or product video that carries your actual pitch and does the persuading.</li>
<li><strong>The offer</strong> — the call to action, price reveal, or booking prompt the video leads into.</li>
<li><strong>The conversion</strong> — the booked call, sign-up, or checkout that completes the funnel.</li></ul>
<p>Funnel analytics measures the transition between each of these. You can have abundant traffic and a strong offer and still convert almost no one, simply because too few people make it through the middle. Naming the stages in order is what lets you ask the only question that matters: between which two steps are you losing the most people?</p>`,
    },
    {
      h2: `Why the video step is where funnels leak`,
      html: `<p>When a funnel runs on video, the video is not a decoration between the click and the offer. It <em>is</em> the pitch, the part that does the work a salesperson would do in a room. That makes it the step where attention is most likely to break, because it is the longest, most demanding stage and the one a prospect can abandon silently at any second.</p>
<p>It also tends to be the least measured step. Many teams track the click and the conversion carefully but treat the video as a black box: a play happened, and then either a conversion did or it did not. The trouble is that most of the loss happens <em>inside</em> that box. People leave during the video, before they ever reach the offer, and an end-to-end conversion rate cannot tell you that. The leak is real, large, and invisible unless you measure the video step directly.</p>
<p class="kb-example">Hypothetical: suppose a funnel sends 1,000 visitors to a page with a VSL, and only 30 book a call. It is tempting to blame the offer or the booking page. But if only 80 of those 1,000 ever reach the part of the video where the offer is made, the offer was never the problem — the video lost more than 90 percent of viewers before the ask. Funnel analytics at the video step is what makes that visible.</p>`,
    },
    {
      h2: `What funnel analytics is — and is not`,
      html: `<p>Be honest about scope. Full funnel analytics, in its broadest sense, can span many pages and tools: ad platforms, page-by-page tracking, CRM stages, and checkout systems. VidaPulse does not claim to be a complete multi-page funnel suite, and you should be wary of any single tool that says it tracks every step end to end. What matters is matching the tool to the step.</p>
<p>VidaPulse measures the <strong>video step</strong> of the funnel, and it measures it in depth: retention, the percentage of viewers reaching the offer, replays versus first watches, and conversion clicks. That is deliberately narrow, because the video step is both the largest hidden leak and the one most other tools ignore. Funnel analytics done well is not one tool watching everything badly; it is the right measurement at the step that is actually bleeding, which for video funnels is the video.</p>`,
    },
  ],
  solve: `<p>VidaPulse gives you funnel analytics where most funnels actually leak: the video step. You paste any video URL from wherever it already lives — YouTube, Amazon S3, Google Drive, Dropbox, OneDrive, Azure Blob, Loom, a Zoom recording, Vimeo, or a direct MP4 or HLS file — and VidaPulse wraps it in an analytics player. You embed it with one line of script or a script-free iframe on any page. There is no re-hosting and no second upload; your video keeps its existing URL.</p>
<p>From there you can read the video step as a funnel of its own:</p>
<ul class="kb-list"><li>The <strong>audience-retention curve</strong> and <strong>average watch time</strong> show how attention holds and where it falls.</li>
<li>The <strong>percentage of viewers reaching any point</strong> tells you how many actually arrive at your offer.</li>
<li>The <strong>second-by-second heatmap</strong> (Pro) and <strong>viewer-level history</strong> (Pro) tie each drop to a specific moment and separate first watches from replays.</li>
<li><strong>Conversion and CTA tracking</strong> (Pro) and <strong>UTM source attribution</strong> connect watching to outcomes and to the channel that sent each viewer.</li></ul>
<p>You can start free: the Free plan covers one video forever with no card. Starter (10 dollars/mo) adds ten videos plus geography, device, and average watch time. Pro (19 dollars/mo) unlocks unlimited videos, heatmaps, viewer-level history, segmentation, and conversion tracking. No personal data is collected. Create a free account and find your funnel's video leak before you change anything else.</p>`,
  faq: [
    {
      q: `What is the difference between funnel analytics and a single conversion rate?`,
      a: `A single conversion rate reports one number at the end of the funnel and hides where people fell out. Funnel analytics breaks the journey into steps and measures the transition between each one, so you can see which stage loses the most people. The end-of-funnel rate tells you something is wrong; funnel analytics tells you which step to fix.`,
    },
    {
      q: `Does VidaPulse track my entire funnel?`,
      a: `No, and it is honest about that. VidaPulse focuses on the video step of the funnel — retention, the percentage reaching the offer, replays, and conversion clicks. It is not a full multi-page funnel suite. It is built to measure the one step that most other funnel tools treat as a black box and where many video funnels quietly lose the bulk of their prospects.`,
    },
    {
      q: `Why is the video the most important step to measure?`,
      a: `In a video funnel, the video carries the actual pitch, so it is the longest and most demanding step and the one a prospect can abandon silently. Most loss happens inside the video, before anyone reaches the offer, yet an end-to-end conversion rate cannot reveal it. Measuring the video step directly is what makes that hidden leak visible.`,
    },
  ],
};
