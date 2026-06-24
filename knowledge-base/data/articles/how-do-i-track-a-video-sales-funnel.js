'use strict';

module.exports = {
  metaTitle: `How do I track a video sales funnel? | VidaPulse`,
  metaDescription: `Track a video sales funnel by wrapping the funnel's video in an analytics player, adding UTM tags, and measuring retention, reach-to-offer, and CTA clicks.`,
  answer: `You track a video sales funnel by instrumenting the one step that usually goes unmeasured: the video. Wrap your funnel's video in an analytics player, tag your traffic with UTM parameters so you know which source each viewer came from, then measure three things — retention, the percentage who reach the offer, and CTA clicks. None of it requires code or re-hosting the video. The result is a clear picture of where the video step leaks, which is where most funnels lose people.`,
  sections: [
    {
      h2: `Wrap the funnel's video — no re-hosting`,
      html: `<p>Tracking starts with the video, because in a video sales funnel the video carries the pitch and is the step most likely to leak. You do not move or re-upload it.</p>
<ol><li><strong>Take the video's existing URL</strong> from wherever it already lives — YouTube, Amazon S3, Google Drive, Dropbox, OneDrive, Azure Blob, Loom, a Zoom recording, Vimeo, or a direct MP4/HLS link.</li>
<li><strong>Paste it into VidaPulse,</strong> which wraps it in an analytics player without re-hosting. The video keeps its original URL.</li>
<li><strong>Embed the player on your page</strong> with one line of script or a script-free iframe. It drops into WordPress, Webflow, ClickFunnels, or custom HTML the same way.</li></ol>
<p>That is the entire setup. There is no coding involved, and your existing page builder does not change.</p>`,
    },
    {
      h2: `Add UTM tags so you know where viewers come from`,
      html: `<p>To track a funnel you need to know which traffic source each viewer arrived from. UTM parameters on the links pointing to your page do that, and VidaPulse reads them as source attribution on the video.</p>
<ul class="kb-list"><li><strong>Tag every inbound link</strong> — ads, emails, posts — with UTM parameters so each carries its source.</li>
<li><strong>VidaPulse captures UTM and source</strong> per viewer, alongside the retention and conversion data.</li>
<li><strong>Now you can compare sources:</strong> two channels can send the same number of plays but produce very different retention and reach-to-offer, and attribution is how you see that.</li></ul>
<p>This matters because the video step can perform differently depending on who arrives. Cold ad traffic and warm email traffic behave differently, and you want to read each one separately.</p>`,
    },
    {
      h2: `Measure retention and reach-to-offer`,
      html: `<p>With the video wrapped and traffic tagged, the core funnel metrics come from the player.</p>
<ol><li><strong>Read the audience-retention curve</strong> to see the share of viewers still watching at every second and where the steep drops are.</li>
<li><strong>Find the timestamp of your offer</strong> and read the percentage of viewers who reach that point. This reach-to-offer number is the link between the video and the rest of the funnel.</li>
<li><strong>Watch average watch time, play rate, and total versus unique viewers</strong> for context on how the video is being consumed.</li></ol>
<p class="kb-example">Hypothetical: if the curve reads 22% at your offer, roughly one in five viewers reaches the pitch. That is the ceiling on every downstream step — the checkout or booking page can only convert the people the video delivers to it.</p>`,
    },
    {
      h2: `Track CTA clicks and conversions`,
      html: `<p>Reaching the offer is not the same as acting on it. The last piece is whether viewers who reach the CTA actually click through.</p>
<p>Conversion and CTA tracking (a Pro feature) records clicks on your call to action, so you can connect watching to action. Together with reach-to-offer it gives you a complete read of the video step:</p>
<ul class="kb-list"><li><strong>Reach-to-offer</strong> — how many survive to the ask.</li>
<li><strong>CTA clicks</strong> — how many of those act.</li>
<li><strong>By source</strong> — how each UTM channel performs on both.</li></ul>
<p>If reach-to-offer is healthy but clicks are low, the hand-off is the leak. If reach-to-offer is low, the run-up is the leak. The numbers tell you which.</p>`,
    },
    {
      h2: `Read it as a funnel and iterate`,
      html: `<p>Once everything is wired, you read the video step as a small funnel of its own: plays in, share reaching the offer, share clicking the CTA, split by source. Then you iterate.</p>
<p>VidaPulse tracks the video step specifically — it is not a full page-by-page funnel suite, so it will not map every page transition for you. But the video is where most funnels leak, so this is the part worth instrumenting first. With Pro, viewer-level history and the second-by-second heatmap add detail down to the individual session and the exact line where attention drops. Fix the biggest leak, re-measure, and move on.</p>`,
    },
  ],
  solve: `<p>This entire setup is what VidaPulse is built for, and it takes no code. You paste your funnel's video URL from wherever it already lives (YouTube, Amazon S3, Google Drive, Dropbox, OneDrive, Azure Blob, Loom, a Zoom recording, Vimeo, or a direct MP4/HLS), VidaPulse wraps it in an analytics player, and you embed it with one line of script or a script-free iframe on any page — WordPress, Webflow, ClickFunnels, or custom HTML. The video keeps its URL; nothing is re-hosted.</p>
<p>The tracking you get on the video step:</p>
<ul class="kb-list"><li><strong>Audience-retention curve, average watch time, play rate, total and unique viewers</strong> — how the video is watched.</li>
<li><strong>Percentage of viewers who reach any point</strong> — your reach-to-offer number.</li>
<li><strong>UTM and source attribution</strong> — which traffic source each viewer came from.</li>
<li><strong>Conversion and CTA tracking</strong> (Pro) — whether viewers act on the offer.</li>
<li><strong>Second-by-second heatmap and viewer-level history</strong> (Pro) — detail down to the session and the line.</li></ul>
<p>No personal data is collected, and you can restrict the player to your own domains. Create a free VidaPulse account, wrap your funnel's video, add your UTM tags, and start tracking the step where most funnels leak.</p>`,
  faq: [
    {
      q: `Do I need to move my video to VidaPulse to track it?`,
      a: `No. VidaPulse does not re-host your video. You paste its existing URL — from YouTube, S3, Drive, Dropbox, OneDrive, Azure Blob, Loom, Zoom, Vimeo, or a direct MP4/HLS link — and VidaPulse wraps it in an analytics player you embed with one line of script or a script-free iframe. The video stays exactly where it is.`,
    },
    {
      q: `How do I know which traffic source my viewers came from?`,
      a: `Add UTM parameters to the links pointing at your page — ads, emails, posts. VidaPulse reads them as source attribution per viewer, so you can compare how each channel performs on retention, reach-to-offer, and CTA clicks. Two sources can send the same number of plays and behave completely differently.`,
    },
    {
      q: `Does VidaPulse track every page in my funnel?`,
      a: `No. VidaPulse measures the video step — retention, the percentage who reach your offer, and CTA clicks. It is not a full multi-page funnel suite, so it does not map every page transition. It focuses on the video because that is where most funnels leak, which makes it the highest-value step to track first.`,
    },
  ],
};
