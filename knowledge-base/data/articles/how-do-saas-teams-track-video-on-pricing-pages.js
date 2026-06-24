'use strict';

module.exports = {
  metaTitle: `How do SaaS teams track video on pricing pages? | VidaPulse`,
  metaDescription: `SaaS teams track pricing-page video by wrapping it in an analytics player and embedding it as-is — reading retention and reach-to-CTA, no builder changes.`,
  answer: `SaaS teams track a video on a pricing page by wrapping the existing video in an analytics player and embedding it where it already sits, then reading its retention curve and reach-to-CTA. A pricing-page explainer has a specific job — to answer objections and move a hesitating visitor toward a trial — so the numbers that matter are how far visitors watch and whether they reach the ask. You do this without changing your page builder, because the analytics live inside the player, not in the page.`,
  sections: [
    {
      h2: `Why pricing-page video needs its own measurement`,
      html: `<p>A video on a pricing page is doing different work than a homepage demo. The visitor is already considering you and is weighing whether to commit. The video is there to remove doubt — to clarify what a plan includes, answer the objection that is holding them back, and nudge them to start a trial. Whether it succeeds is invisible if all you see is that the page got traffic.</p>
<p>Page analytics tells you visits and maybe scroll depth, but it treats the video as a black box: played or not. That misses the part that matters — did visitors watch enough to have their doubt answered, and did they reach the point where you ask them to start. Those are video metrics, and you need them on the pricing video specifically.</p>`,
    },
    {
      h2: `The metrics that matter on a pricing page`,
      html: `<p>For a pricing or explainer video, a small set of numbers tells you almost everything:</p>
<ul class="kb-list"><li><strong>Retention curve</strong> — how far into the explanation visitors watch, and where they drop. On a pricing page a steep early drop often means the video is not addressing the question they came with.</li>
<li><strong>Reach-to-CTA</strong> — the share who reach the moment you ask them to start a trial. This is the ceiling on how many the video can convert.</li>
<li><strong>Replays</strong> — sections visitors rewind, which on a pricing video often flag the exact detail they are unsure about, such as what a tier includes.</li></ul>
<p>Read with average watch time and play rate, these turn a pricing video from decoration into a measurable part of the buying decision.</p>`,
    },
    {
      h2: `Track it without changing the page builder`,
      html: `<p>Pricing pages are often the most carefully built and most cautiously edited pages a SaaS team owns. The good news is you do not have to touch the builder, the layout, or the page's logic to measure the video.</p>
<ol><li><strong>Take the video's existing URL</strong> — YouTube, Amazon S3, Google Drive, Dropbox, OneDrive, Azure Blob, Loom, a Zoom recording, Vimeo, or a direct MP4/HLS link.</li>
<li><strong>Wrap it in an analytics player</strong> by pasting that URL into VidaPulse. Nothing is re-hosted, so the video stays where it lives.</li>
<li><strong>Embed it as you already do</strong> — with one line of script or a script-free iframe, on Webflow, WordPress, a custom-coded page, or whatever your pricing page is built in.</li></ol>
<p>The script-free iframe matters here: if your page builder only lets you drop in an embed code, you can still get full analytics with no custom code at all. The page looks and behaves exactly as before; the difference is that the video now reports.</p>`,
    },
    {
      h2: `Turn the data into a better pricing video`,
      html: `<p>Once the pricing video reports, improving it is the same loop you would run anywhere — find the drop, fix the section, re-measure — but the interpretation is specific to a buying decision.</p>
<p class="kb-example">Hypothetical: suppose your pricing video reads only 20% at the trial ask, and replays cluster on the part that explains what the top tier includes. That pattern suggests the plan details are confusing visitors before they reach the ask. Clarifying that one section and re-measuring would tell you whether reach-to-CTA rises. If instead many visitors reach the ask but few start a trial, the friction is in the offer or the page, not the video. The numbers are illustrative, but the data points to which fix to make.</p>
<p>With Pro, conversion and CTA tracking connect the video to trial starts on the pricing page, and the second-by-second heatmap pins the exact moment visitors hesitate or leave.</p>`,
    },
  ],
  solve: `<p>VidaPulse lets you track a pricing-page video without re-hosting and without touching your page builder. You paste the video's existing URL (YouTube, Amazon S3, Google Drive, Dropbox, OneDrive, Azure Blob, Loom, a Zoom recording, Vimeo, or a direct MP4/HLS), VidaPulse wraps it in an analytics player, and you embed it with one line of script or a script-free iframe exactly where it already sits on the page.</p>
<p>On your pricing video you can read:</p>
<ul class="kb-list"><li>The <strong>audience-retention curve, average watch time, and play rate</strong> — how far visitors watch the explanation.</li>
<li>The <strong>percentage of viewers who reach any point</strong> — reach-to-CTA, the share who hear the trial ask.</li>
<li><strong>Replays versus first watches</strong> — the plan details visitors rewind because they are unsure.</li>
<li><strong>Conversion and CTA tracking</strong> (Pro) — whether the video moves visitors into a trial.</li>
<li>The <strong>second-by-second heatmap and viewer-level history</strong> (Pro) — the exact moment of hesitation.</li></ul>
<p>You can start free — one video, free forever, no card. No personal data is collected, and you can restrict the player to your own domains. Create a free VidaPulse account, wrap your pricing video, and see where it loses visitors before they start a trial.</p>`,
  faq: [
    {
      q: `Do I have to change my pricing page to track the video?`,
      a: `No. You paste the video's existing URL, VidaPulse wraps it in an analytics player, and you embed it with one line of script or a script-free iframe — the same way you already place an embed. Nothing is re-hosted and the page builder, layout, and logic stay untouched. The page looks the same; the video simply reports now.`,
    },
    {
      q: `What should I look for in a pricing-page video's data?`,
      a: `Start with reach-to-CTA — the share of visitors who reach the trial ask — and the retention curve to see where they drop. On a pricing page, replays are especially telling: a section visitors rewind often marks the plan detail they are unsure about. Together they show whether the video is resolving doubt or creating it before the ask.`,
    },
    {
      q: `My page builder only accepts an embed code. Can I still track the video?`,
      a: `Yes. VidaPulse offers a script-free iframe embed, so any builder that accepts an embed code can carry the analytics player with no custom code. You get the full retention curve, reach-to-CTA, and replays on the pricing video, and on Pro conversion tracking and the heatmap, without writing any code.`,
    },
  ],
};
