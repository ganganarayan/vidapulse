'use strict';

module.exports = {
  metaTitle: `How do I plug revenue leaks in a VSL? | VidaPulse`,
  metaDescription: `Plug VSL revenue leaks step by step: locate the leak with retention and heatmap data, diagnose the cause, rewrite the section, re-test, then repeat on the next.`,
  answer: `You plug revenue leaks in a VSL one at a time, in order of size. Locate the biggest drop before your offer using the retention curve and a heatmap, diagnose why viewers leave at that exact moment, rewrite or restructure just that section, then re-test and compare against your baseline. If the number improves, keep it and move to the next-biggest leak. The whole method is a loop: find, diagnose, fix, re-test, repeat.`,
  sections: [
    {
      h2: `Step 1: locate the leak`,
      html: `<p>A revenue leak in a VSL is a spot where viewers leave before they reach your offer. You cannot fix what you cannot see, so the first step is to find the leaks precisely, not by feel.</p>
<ol><li><strong>Read the retention curve.</strong> It shows the share of viewers still watching at each second. Steep vertical drops are leaks; gentle slopes are normal. List the steep drops that happen <em>before</em> your offer, since drops after it do not cost sales.</li>
<li><strong>Pin the moment with a heatmap.</strong> A second-by-second engagement heatmap ties each drop to a specific line, scene, or transition, so you know exactly where the leak is.</li>
<li><strong>Rank by size and proximity.</strong> The biggest, latest pre-offer drop is your costliest leak, because it removes the most viewers who were closest to the offer. Start there.</li></ol>
<p>By the end of this step you should have a short, ordered list of exact moments where viewers bleed out, with the most expensive one at the top.</p>`,
    },
    {
      h2: `Step 2: diagnose the cause`,
      html: `<p>Knowing where viewers leave is not the same as knowing why. Before you rewrite anything, line the drop up against your script and ask what happens at that exact second that makes people quit. The cause determines the fix.</p>
<ul class="kb-list"><li><strong>A slow or padded stretch.</strong> If the leak sits on a section that meanders, viewers ran out of patience. The fix is to cut or tighten.</li>
<li><strong>A confusing or unbelievable claim.</strong> If the drop follows a specific statement, it may not have landed. The fix is to clarify or support it.</li>
<li><strong>A tangent or detour.</strong> If viewers leave when the video wanders off the through-line, the fix is to remove the detour and keep momentum toward the offer.</li>
<li><strong>A long run-up to the price.</strong> If the leak is right before the offer, the build-up may be too long, so buyers leave before the ask. The fix is to move the offer earlier or shorten the run-up.</li></ul>
<p>Diagnose one leak at a time. Guessing the cause wrong means you rewrite the section and the drop stays, so spend the minute it takes to match the moment to a specific reason before you touch the script.</p>`,
    },
    {
      h2: `Step 3: rewrite or restructure that section`,
      html: `<p>Now fix the one leak you diagnosed, and only that one. The goal is to change the smallest amount that addresses the cause, so the re-test cleanly attributes any improvement to this edit.</p>
<ul class="kb-list"><li><strong>Cut</strong> if the section was slow or padded. Less is usually the fix for a patience leak.</li>
<li><strong>Clarify</strong> if a claim confused viewers. Say it more plainly, or add the proof that makes it believable.</li>
<li><strong>Resequence</strong> if the problem is order, for example moving the offer earlier so more viewers reach it before patience runs out.</li>
<li><strong>Smooth the transition</strong> if viewers leave at a jarring jump between sections.</li></ul>
<p>Resist the urge to fix three leaks in one pass. If you change several sections at once and retention moves, you will not know which edit did it, which means you cannot repeat the win or undo a change that quietly hurt. One leak, one rewrite, per round.</p>`,
    },
    {
      h2: `Step 4: re-test, compare, then repeat`,
      html: `<p>A fix is a hypothesis until the data confirms it. Republish the edited VSL, run real traffic, and lay the new retention curve and offer-reach percentage next to your baseline.</p>
<ol><li><strong>Compare to baseline.</strong> Did the drop at that moment shrink? Did a larger share of viewers reach the offer? Did conversions move?</li>
<li><strong>Keep or revert.</strong> If the leak narrowed and the downstream numbers improved, keep the change. If nothing moved or it got worse, revert and try a different fix for the same spot, your diagnosis may have been off.</li>
<li><strong>Move to the next leak.</strong> Once the top leak is plugged, go back to your ranked list and repeat the whole loop on the next-biggest one.</li></ol>
<p class="kb-example">Hypothetical illustration, not VidaPulse data. Suppose you cut a slow section before the offer and the share of viewers reaching the pitch rises from 25% to 40%, with conversions ticking up alongside. Because you changed only that section, you can credit the lift to that fix and confidently apply the same loop to the next leak.</p>
<p>You are never chasing a benchmark. You are beating your own last version, one plugged leak at a time, until a much larger share of viewers reaches a clear offer.</p>`,
    },
  ],
  solve: `<p>VidaPulse turns each step of this loop into a measured action. You paste your existing video URL from wherever it already lives (YouTube, Amazon S3, Google Drive, Dropbox, OneDrive, Azure Blob, Loom, a Zoom recording, Vimeo, or a direct MP4 or HLS link), VidaPulse wraps it in an analytics player, and you embed it with one line of script or a script-free iframe. There is no re-hosting; your VSL keeps its URL while you fix it.</p>
<p>From there, every step is visible:</p>
<ul class="kb-list"><li>The <strong>audience-retention curve</strong> locates every leak, so you can list and rank the steep drops before your offer.</li>
<li>The <strong>second-by-second engagement heatmap</strong> (Pro) pins each leak to the exact moment, so you can diagnose the real cause against your script.</li>
<li>The <strong>percentage of viewers who reach any point</strong> measures how many make it to your offer, the number you compare before and after each fix.</li>
<li><strong>Conversion and CTA tracking</strong> (Pro) shows whether a plugged leak actually moved sales, not just the curve.</li>
<li>Because the tracking lives in the embedded player, you republish one fix and compare the new curve against the old, which makes the re-test step fast and honest.</li></ul>
<p>No personal data is collected. To start, create a free VidaPulse account, wrap your own VSL, and find the biggest revenue leak before you rewrite a single line.</p>`,
  faq: [
    {
      q: `What is a revenue leak in a VSL?`,
      a: `It is a spot where viewers leave before they reach your offer. Those viewers were paid for and never heard the pitch, so the lost sales are revenue draining out of the video. Leaks show up as steep drops on the retention curve in front of the offer. Drops after the offer are not leaks, because those viewers already heard the ask.`,
    },
    {
      q: `Which leak should I fix first?`,
      a: `The biggest, latest drop that happens before your offer. It removes the most viewers who were closest to the pitch, so plugging it recovers the most revenue per fix. Rank your pre-offer drops by size and proximity to the offer, start at the top, and work down one leak at a time, re-testing after each.`,
    },
    {
      q: `Why fix only one section at a time?`,
      a: `So you can tell whether the fix worked. If you rewrite several sections at once and retention moves, you cannot credit any single edit, which means you cannot repeat the win or undo a change that quietly hurt. Fix one diagnosed leak, re-test against your baseline, then move to the next. It is slower per step but far more reliable.`,
    },
  ],
};
