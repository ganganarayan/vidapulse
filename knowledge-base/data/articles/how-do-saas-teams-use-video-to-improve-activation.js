'use strict';

module.exports = {
  metaTitle: `How do SaaS teams use video to improve activation? | VidaPulse`,
  metaDescription: `SaaS teams improve activation with onboarding videos and measure how far new users watch — retention, reach-to-CTA, and where users drop. No re-hosting.`,
  answer: `SaaS teams use video to improve activation by placing short onboarding and feature videos where new users first get stuck, then measuring how far those users actually watch. The signals that matter are the retention curve, reach-to-CTA on the "do this next" step, and where users drop, so you can tell whether the video is moving them to the activation moment. With VidaPulse you read all of this on an in-app or help-page video, with no re-hosting and no code.`,
  sections: [
    {
      h2: `Where activation video fits`,
      html: `<p>Activation is the moment a new user reaches first value — the step that turns a sign-up into someone who actually uses the product. Short videos help when a written step is easy to skip or hard to picture: a setup walkthrough on an empty-state screen, a "connect your data" clip on a help page, a feature intro in an onboarding modal.</p>
<p>The point is to lower the effort of the next step, not to teach a syllabus. These are product videos embedded on a page or in your app — a quick "here is how this works" beside the action, never a course or a lesson library. The question that follows is simple: are new users watching enough of the video to take the step it is meant to unblock?</p>`,
    },
    {
      h2: `Measure how far new users watch`,
      html: `<p>An onboarding video only improves activation if users get to its point. The metrics tell you whether they do:</p>
<ul class="kb-list"><li><strong>Audience-retention curve</strong> — the share of new users still watching at every second, so you can see whether they reach the key instruction or leave first.</li>
<li><strong>Reach-to-CTA</strong> — the percentage who reach the moment you tell them to take the activation step.</li>
<li><strong>Average watch time</strong> — how much of the guidance a typical new user actually absorbs.</li>
<li><strong>Replays versus first watches</strong> — the steps users rewind, which flag the part that is genuinely hard to follow.</li></ul>
<p>If most new users leave before the key instruction, the video is not the lever it could be — and the curve shows you exactly where they give up.</p>`,
    },
    {
      h2: `Put the video where activation happens`,
      html: `<p>Activation guidance works best right next to the action it supports — an empty-state screen, a setup page, a help article, an onboarding modal. You do not need to move the video or rebuild those surfaces to measure it.</p>
<ol><li><strong>Take the video's existing URL</strong> — YouTube, Amazon S3, Google Drive, Dropbox, OneDrive, Azure Blob, Loom, a Zoom recording, Vimeo, or a direct MP4/HLS link.</li>
<li><strong>Wrap it in an analytics player</strong> by pasting that URL into VidaPulse. Nothing is re-hosted.</li>
<li><strong>Embed it</strong> with one line of script or a script-free iframe inside your app or on the help page where users hit the step.</li></ol>
<p>The analytics ride along inside the player, so each onboarding clip reports how far new users watch right where activation happens. There is no coding and your page does not change.</p>`,
    },
    {
      h2: `Improve activation as a loop`,
      html: `<p>Once you can read how far new users watch, improving activation becomes a measured loop rather than a hunch:</p>
<ol><li><strong>Find the drop</strong> before the key instruction on the retention curve.</li>
<li><strong>Fix the one section</strong> — shorten a slow setup, reorder a confusing step, or move the critical instruction earlier.</li>
<li><strong>Re-measure</strong> on new users and check whether more of them reach the activation step.</li></ol>
<p class="kb-example">Hypothetical: suppose new users on a "connect your data" help video drop off right before the instruction that unblocks them, because the lead-in is too long. You move that instruction to the first few seconds, and on the next cohort more users reach it and complete the step. With Pro, the second-by-second heatmap pins the exact moment they were leaving, conversion tracking ties the watch to whether they completed the step, and viewer-level history shows how an individual new user moved through.</p>`,
    },
  ],
  solve: `<p>VidaPulse lets SaaS teams use video to improve activation without re-hosting and without code. You paste an onboarding or feature video's existing URL (YouTube, Amazon S3, Google Drive, Dropbox, OneDrive, Azure Blob, Loom, a Zoom recording, Vimeo, or a direct MP4/HLS), VidaPulse wraps it in an analytics player, and you embed it with one line of script or a script-free iframe inside your app or on the help page where new users hit the step.</p>
<p>On your activation videos you can read:</p>
<ul class="kb-list"><li>The <strong>audience-retention curve and average watch time</strong> — how far new users watch.</li>
<li>The <strong>percentage of viewers who reach any point</strong> — reach-to-CTA on the activation step.</li>
<li><strong>Replays versus first watches</strong> — the steps users find hard to follow.</li>
<li><strong>Conversion and CTA tracking</strong> (Pro) — whether the watch led to the activation step.</li>
<li>The <strong>second-by-second heatmap and viewer-level history</strong> (Pro) — the exact moment users leave and how an individual new user moved through.</li></ul>
<p>You can start free — one video, free forever, no card — with unlimited videos, heatmaps, and viewer-level history on Pro at nineteen dollars a month. No personal data is collected, and you can restrict the player to your own domains. Create a free VidaPulse account, wrap your onboarding video, and see how far new users watch before activation.</p>`,
  faq: [
    {
      q: `Is this a course or learning library for users?`,
      a: `No. These are short product videos embedded next to an action — a setup clip on an empty-state screen or a "do this next" video on a help page. VidaPulse measures how far new users watch them; it is video analytics for onboarding guidance, not a course platform or learning library.`,
    },
    {
      q: `Can I track activation videos embedded inside my app?`,
      a: `Yes. You paste the video's existing URL, VidaPulse wraps it in an analytics player, and you embed it with one line of script or a script-free iframe inside your app or on a help page. Each clip reports its retention curve and reach-to-CTA wherever new users meet it, with no re-hosting and no page changes.`,
    },
    {
      q: `Which metric tells me if an onboarding video helps activation?`,
      a: `Reach-to-CTA on the activation step — the percentage of new users who reach the moment the video tells them what to do next. If most leave before that instruction, the video is not unblocking them. The retention curve shows where they drop, and on Pro conversion tracking ties the watch to whether they completed the step.`,
    },
  ],
};
