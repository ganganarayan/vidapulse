'use strict';

module.exports = {
  metaTitle: `How do SaaS teams reduce demo video drop-off? | VidaPulse`,
  metaDescription: `SaaS teams reduce demo video drop-off by pinning the steepest cliff on the retention curve, fixing that one section, then re-measuring — no re-hosting, no code.`,
  answer: `SaaS teams reduce demo video drop-off by locating the single steepest cliff on the audience-retention curve, fixing the one section that causes it, and re-measuring to confirm the cliff flattened. Drop-off is not spread evenly — a few specific moments push most viewers away, so the work is targeting those points rather than re-editing the whole demo. With VidaPulse you find that exact drop and watch it shrink on a demo embedded anywhere, with no re-hosting and no code.`,
  sections: [
    {
      h2: `Drop-off concentrates at a few points`,
      html: `<p>It is tempting to treat a demo that loses viewers as a video that is "too long" or "not good enough." The retention curve usually tells a sharper story: most of the loss happens at a handful of specific seconds, not gradually across the whole runtime.</p>
<p>On the curve, gentle slopes are normal attrition you would see in any video, but <strong>steep cliffs</strong> are the real drop-off — a cluster of viewers leaving at the same moment. Reducing drop-off means going after those cliffs one at a time, starting with the biggest. Fixing the single worst point usually moves the needle more than a full re-edit, because that is where the bleeding actually is.</p>`,
    },
    {
      h2: `Pin the exact second viewers leave`,
      html: `<p>The retention curve narrows the drop to a region; the second-by-second engagement heatmap (a Pro feature) narrows it to the exact moment. Instead of "viewers leave somewhere in the middle," you get "viewers bail at 0:52, right after the integrations screen."</p>
<p>That precision is what makes the fix targeted. You are not rewatching the demo looking for a vague weak spot — you know the line, transition, or screen that is doing the damage. Replays versus first watches add a second clue: a moment viewers keep rewinding right before a cliff is usually confusion, and clearing it up often closes the drop.</p>`,
    },
    {
      h2: `Tighten the one section, not the whole demo`,
      html: `<p>Once you know the precise second, the change should be narrow. Re-cutting the entire demo risks breaking the parts that already hold attention. Common, surgical fixes for a demo cliff include:</p>
<ul class="kb-list"><li><strong>Cut a slow run-up</strong> — if the cliff follows a long setup, trim the lead-in so viewers reach the payoff faster.</li>
<li><strong>Re-order a point</strong> — if a feature is explained before viewers care about it, move it later.</li>
<li><strong>Clarify a confusing claim</strong> — if viewers rewind then leave, the line is unclear, not uninteresting.</li>
<li><strong>Move a strong moment earlier</strong> — pull a compelling result ahead of the cliff so more viewers see it before deciding to leave.</li></ul>
<p>The goal is to change as little as possible around the drop and leave the flat, working stretches alone.</p>`,
    },
    {
      h2: `Re-measure to confirm the cliff closed`,
      html: `<p>A fix is only real if the curve changes. Because nothing is re-hosted, you can republish the demo and keep the same embed, then compare the new curve against your baseline.</p>
<ol><li><strong>Save the original curve</strong> as your baseline before editing.</li>
<li><strong>Ship the narrow fix</strong> to the one section the heatmap flagged.</li>
<li><strong>Re-measure on new traffic</strong> and check whether the cliff at that second softened and more viewers carried past it.</li></ol>
<p class="kb-example">Hypothetical: a demo might lose nearly half its viewers in a fifteen-second stretch where setup steps are shown one by one. You compress that stretch to a few seconds, republish, and on the next batch of traffic the cliff flattens while the rest of the curve holds. That is a measured reduction in drop-off, not a guess about length.</p>`,
    },
  ],
  solve: `<p>VidaPulse helps SaaS teams reduce demo video drop-off without re-hosting and without code. You paste the demo's existing URL (YouTube, Amazon S3, Google Drive, Dropbox, OneDrive, Azure Blob, Loom, a Zoom recording, Vimeo, or a direct MP4/HLS), VidaPulse wraps it in an analytics player, and you embed it with one line of script or a script-free iframe on the page it already lives on.</p>
<p>To target and shrink the drop you get:</p>
<ul class="kb-list"><li>The <strong>audience-retention curve</strong> — to find the steepest cliff.</li>
<li>The <strong>second-by-second engagement heatmap</strong> (Pro) — to pin the exact second viewers leave.</li>
<li><strong>Replays versus first watches</strong> — to catch confusion sitting just before a drop.</li>
<li><strong>Average watch time and the percentage reaching any point</strong> — for context around the cliff and reach-to-CTA.</li>
<li><strong>Viewer-level history</strong> (Pro) — to see how individual prospects moved up to the drop.</li></ul>
<p>You can start free — one video, free forever, no card — with heatmaps and viewer-level history on Pro at nineteen dollars a month. No personal data is collected, and you can restrict the player to your own domains. Create a free VidaPulse account, wrap your demo, and find the exact second to fix.</p>`,
  faq: [
    {
      q: `How is reducing drop-off different from improving completion rate?`,
      a: `Completion rate is the overall share who finish; reducing drop-off is about a specific point. You target the single steepest cliff on the retention curve — the exact second a cluster of viewers leaves — and fix that one section. Closing the biggest cliff usually lifts completion as a side effect, but the work is surgical rather than a full re-edit.`,
    },
    {
      q: `Do I need Pro to reduce demo drop-off?`,
      a: `You can locate drop-offs on any plan with the audience-retention curve and average watch time. The second-by-second engagement heatmap and viewer-level history are Pro features that pin the exact second and show how individual prospects moved up to the drop, which makes the fix more precise and easier to verify.`,
    },
    {
      q: `Will re-editing the demo break my embed?`,
      a: `No. VidaPulse does not re-host your video, so you can edit and republish on its original host and keep the same one-line script or script-free iframe. The retention curve simply updates on new traffic, letting you compare the new curve against your baseline to confirm the cliff flattened.`,
    },
  ],
};
