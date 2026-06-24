'use strict';

module.exports = {
  metaTitle: `How do SaaS teams find drop-offs in product videos? | VidaPulse`,
  metaDescription: `SaaS teams find product video drop-offs with the retention curve and a second-by-second heatmap that pin the exact moment viewers lose interest.`,
  answer: `SaaS teams find drop-offs in product videos by reading the audience-retention curve to spot the steepest decline, then using a second-by-second engagement heatmap to pin the exact moment viewers lose interest. The curve shows where attention falls off; the heatmap shows the precise second so you can fix the right line instead of guessing. With VidaPulse you get both on your product video wherever it is embedded — no re-hosting and no code.`,
  sections: [
    {
      h2: `Read the retention curve to spot the drop`,
      html: `<p>The retention curve is the share of viewers still watching at every second of your product video. It turns "people watched the video" into a precise map of where attention holds and where it falls off.</p>
<ul class="kb-list"><li><strong>Flat stretches</strong> are sections that hold attention — leave them alone.</li>
<li><strong>Gentle slopes</strong> are normal, gradual attrition you would expect in any video.</li>
<li><strong>Steep cliffs</strong> are drop-offs: a specific moment where a cluster of viewers left at once. These are your targets.</li></ul>
<p>A cliff is the signal that something at that exact point is pushing viewers away — a slow stretch, a confusing claim, a feature that does not feel relevant. The curve tells you a drop is happening; the next step is finding precisely where.</p>`,
    },
    {
      h2: `Use the heatmap to pin the exact moment`,
      html: `<p>The retention curve narrows the problem to a region. The second-by-second engagement heatmap (a Pro feature) narrows it to the exact second. It shows attention intensity moment by moment, so instead of "viewers leave somewhere in the middle," you get "viewers bail at 0:48, right after the pricing slide."</p>
<p>That precision is what makes the fix surgical. You are no longer rewatching the whole video looking for the weak part — the heatmap points at the line, transition, or section that is doing the damage. Replays versus first watches add another layer: a spot viewers keep rewinding is either the moment that lands or a point of confusion sitting right before a drop.</p>`,
    },
    {
      h2: `Find drop-offs on the video wherever it lives`,
      html: `<p>Your product videos might be scattered across a homepage, feature pages, a docs site, or in-app onboarding. You do not need to consolidate or move them to find their drop-offs.</p>
<ol><li><strong>Take the video's existing URL</strong> — YouTube, Amazon S3, Google Drive, Dropbox, OneDrive, Azure Blob, Loom, a Zoom recording, Vimeo, or a direct MP4/HLS link.</li>
<li><strong>Wrap it in an analytics player</strong> by pasting that URL into VidaPulse. Nothing is re-hosted.</li>
<li><strong>Embed it</strong> with one line of script or a script-free iframe on the page it already lives on.</li></ol>
<p>The retention curve and heatmap come with the embedded player, so every product video reports its own drop-offs wherever you place it. There is no coding and your page does not change.</p>`,
    },
    {
      h2: `Fix the drop and confirm it closed`,
      html: `<p>Finding the drop is half the work; confirming the fix worked is the other half. Once the heatmap pins the moment, the loop is short:</p>
<ol><li><strong>Edit the one section</strong> the heatmap flagged — cut the slow stretch, clarify the confusing claim, or move a stronger point earlier.</li>
<li><strong>Republish</strong> the video. Because nothing is re-hosted, the same embed keeps working.</li>
<li><strong>Re-measure</strong> on new traffic and compare the new curve against the old to confirm the cliff flattened.</li></ol>
<p class="kb-example">Hypothetical: a product video might lose a third of viewers in a ten-second stretch where a feature is explained out of order. The heatmap pins it, you re-sequence those ten seconds, and on the next batch of traffic the cliff softens and more viewers reach the end. That is a measured fix, not a guess.</p>`,
    },
  ],
  solve: `<p>VidaPulse helps SaaS teams find drop-offs in product videos without re-hosting and without code. You paste the video's existing URL (YouTube, Amazon S3, Google Drive, Dropbox, OneDrive, Azure Blob, Loom, a Zoom recording, Vimeo, or a direct MP4/HLS), VidaPulse wraps it in an analytics player, and you embed it with one line of script or a script-free iframe on the page it already lives on.</p>
<p>To find and fix drop-offs you get:</p>
<ul class="kb-list"><li>The <strong>audience-retention curve</strong> — to spot the steepest decline.</li>
<li>The <strong>second-by-second engagement heatmap</strong> (Pro) — to pin the exact moment viewers lose interest.</li>
<li><strong>Replays versus first watches</strong> — to catch confusion sitting before a drop.</li>
<li><strong>Average watch time, play rate, and the percentage reaching any point</strong> — for context around the drop.</li>
<li><strong>Viewer-level history</strong> (Pro) — to see how an individual moved through the video.</li></ul>
<p>You can start free — one video, free forever, no card — with heatmaps and viewer-level history on Pro at nineteen dollars a month. No personal data is collected, and you can restrict the player to your own domains. Create a free VidaPulse account, wrap your product video, and find the exact second it loses viewers.</p>`,
  faq: [
    {
      q: `What is the difference between the retention curve and the heatmap?`,
      a: `The retention curve shows the share of viewers still watching at each second, so it points you to the region where a drop happens. The second-by-second engagement heatmap (Pro) narrows that to the exact moment and shows attention intensity, so you can fix the precise line or section rather than rewatching the whole video to guess.`,
    },
    {
      q: `Do I need the Pro plan to find drop-offs?`,
      a: `You can spot drop-offs on any plan using the audience-retention curve, average watch time, and the percentage reaching any point. The second-by-second engagement heatmap and viewer-level history are Pro features that pin the exact moment and show how individual viewers moved through, which makes the fix more surgical.`,
    },
    {
      q: `Can I find drop-offs across several product videos at once?`,
      a: `Yes. Wrap each video with VidaPulse and every one reports its own retention curve and, on Pro, its own heatmap, wherever it is embedded. Starter covers ten videos and Pro covers unlimited videos, so a SaaS team can measure drop-offs across an entire library of product and feature clips.`,
    },
  ],
};
