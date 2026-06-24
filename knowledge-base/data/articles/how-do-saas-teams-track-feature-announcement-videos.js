'use strict';

module.exports = {
  metaTitle: `How do SaaS teams track feature announcement videos? | VidaPulse`,
  metaDescription: `SaaS teams track feature announcement videos with the retention curve, reach-to-CTA, and source attribution to measure launch engagement — no re-hosting.`,
  answer: `SaaS teams track feature announcement videos by measuring how many viewers watch the launch through to the point you ask them to try it, broken down by where the viewer came from. A feature or launch video has a short, intense window, so the metrics that matter are the retention curve, reach-to-CTA, and source attribution that separates a launch email audience from a homepage visitor. With VidaPulse you read all of this on the announcement video wherever it is embedded, with no re-hosting and no code.`,
  sections: [
    {
      h2: `What you actually want to know about a launch video`,
      html: `<p>A feature announcement video is published into a burst of attention — a launch email, a changelog post, a banner on the dashboard. The play count from that burst is easy to get and tells you almost nothing about whether the launch landed.</p>
<p>The real questions are sharper: how far into the announcement did viewers watch, what share reached the moment you invite them to try the new feature, and did the audience you emailed behave differently from people who stumbled on it from your homepage. Those answers tell you whether the launch communicated the feature or just collected clicks.</p>`,
    },
    {
      h2: `The metrics for an announcement video`,
      html: `<p>A launch video is best read with a focused set of numbers, because its window is short:</p>
<ul class="kb-list"><li><strong>Audience-retention curve</strong> — the share still watching at every second, so you can see whether viewers stay long enough to understand what the feature does.</li>
<li><strong>Reach-to-CTA</strong> — the percentage who reach the point where you ask them to try or enable the feature.</li>
<li><strong>Average watch time and play rate</strong> — how much of the announcement a typical viewer absorbs.</li>
<li><strong>Replays versus first watches</strong> — the parts viewers rewind, which often flag the new behavior they want to see again.</li></ul>
<p>Together these turn "the launch got views" into a clear read on whether viewers understood the feature and reached the prompt to use it.</p>`,
    },
    {
      h2: `Use source attribution to separate launch channels`,
      html: `<p>A feature announcement usually goes out across several channels at once, and each audience behaves differently. A blended average hides that.</p>
<p>With UTM and source attribution you can read the retention curve and reach-to-CTA separately for each channel — the launch email, the changelog post, an in-app prompt, a social post. That tells you which channel actually drove engaged viewing and which only drove plays.</p>
<p class="kb-example">Hypothetical: suppose viewers from the launch email watch the announcement nearly to the end while viewers from a social link leave in the first few seconds. That is a signal the social audience needs more context before the video, or a shorter teaser, while the email audience is ready for the full walkthrough.</p>`,
    },
    {
      h2: `Track it wherever the announcement appears`,
      html: `<p>An announcement video often lives in more than one place — a blog post, a changelog entry, an in-app modal, a help page. You do not need to move it or rebuild any of those surfaces to track it.</p>
<ol><li><strong>Take the video's existing URL</strong> — YouTube, Amazon S3, Google Drive, Dropbox, OneDrive, Azure Blob, Loom, a Zoom recording, Vimeo, or a direct MP4/HLS link.</li>
<li><strong>Wrap it in an analytics player</strong> by pasting that URL into VidaPulse. Nothing is re-hosted.</li>
<li><strong>Embed it</strong> with one line of script or a script-free iframe on each surface where the announcement appears.</li></ol>
<p>The analytics ride along inside the player, so the same announcement reports its engagement from every place you embed it. On Pro, the second-by-second heatmap pins the exact moment viewers leave and conversion tracking ties the watch to whether they enabled the feature.</p>`,
    },
  ],
  solve: `<p>VidaPulse lets SaaS teams track feature announcement videos without re-hosting and without code. You paste the video's existing URL (YouTube, Amazon S3, Google Drive, Dropbox, OneDrive, Azure Blob, Loom, a Zoom recording, Vimeo, or a direct MP4/HLS), VidaPulse wraps it in an analytics player, and you embed it with one line of script or a script-free iframe on each surface where the announcement appears.</p>
<p>On your announcement video you can read:</p>
<ul class="kb-list"><li>The <strong>audience-retention curve and average watch time</strong> — how far viewers watch the launch.</li>
<li>The <strong>percentage of viewers who reach any point</strong> — reach-to-CTA, the share who hear the prompt to try the feature.</li>
<li><strong>UTM and source attribution</strong> — engagement broken down by launch channel.</li>
<li><strong>Replays versus first watches</strong> — the new behavior viewers rewind to see again.</li>
<li>The <strong>second-by-second heatmap and conversion tracking</strong> (Pro) — the exact moment viewers leave and whether they enabled the feature.</li></ul>
<p>You can start free — one video, free forever, no card. No personal data is collected, and you can restrict the player to your own domains. Create a free VidaPulse account, wrap your announcement, and see which channels actually watched your launch.</p>`,
  faq: [
    {
      q: `Can I see which launch channel watched the announcement best?`,
      a: `Yes. VidaPulse reads UTM and source attribution, so you can compare the retention curve and reach-to-CTA by channel — launch email, changelog post, in-app prompt, or social. That shows which channel drove engaged viewing of the feature and which only drove plays that dropped off early.`,
    },
    {
      q: `Can I track the same announcement video in several places?`,
      a: `Yes. Wrap the video once with VidaPulse and embed the same player on your blog post, changelog entry, in-app modal, and help page. Each placement reports engagement, and source attribution lets you separate them, so one announcement gives you a full picture across every surface it appears on.`,
    },
    {
      q: `Does tracking a launch video require code?`,
      a: `No. You paste the video's existing URL, VidaPulse wraps it in an analytics player, and you embed it with one line of script or a script-free iframe. There is no re-hosting and the page does not change, so even a changelog post or in-app modal can carry full engagement tracking.`,
    },
  ],
};
