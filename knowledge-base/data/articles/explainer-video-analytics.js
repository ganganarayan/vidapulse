'use strict';

module.exports = {
  metaTitle: `What is explainer video analytics? | VidaPulse`,
  metaDescription: `Explainer video analytics measures hook hold, completion, and reach-to-CTA on your homepage explainer — so you see whether the video earns the next step.`,
  answer: `Explainer video analytics is the measurement of a homepage or explainer video as a first impression: how well the opening holds attention, how many viewers complete it, and what share reach the call to action. An explainer has seconds to make a stranger care, so the numbers that matter most are hook hold in the first moments, completion across the whole video, and reach-to-CTA at the end. Good explainer video analytics shows you whether the video is actually earning the next step — or quietly losing visitors before it ever makes its point.`,
  sections: [
    {
      h2: `Why an explainer needs its own analytics`,
      html: `<p>A homepage explainer usually meets cold, impatient visitors who have not decided to care yet. Its whole job is to make a stranger understand and want the product in under a couple of minutes, which puts enormous weight on the first few seconds and on whether anyone reaches the end. It is the opposite of a captive audience.</p>
<p>A view count cannot tell you any of this. It confirms a visitor pressed play, not whether the hook held, whether they finished, or whether they reached the CTA. Explainer video analytics measures those three things directly, so you can see whether the video is doing its first-impression job or working against you.</p>`,
    },
    {
      h2: `Hook hold in the first seconds`,
      html: `<p>The most expensive seconds in an explainer are the first ones. The <strong>audience-retention curve</strong> shows the share of visitors still watching at every second, and the opening of that curve is your hook hold — how many survive the first moments.</p>
<ul class="kb-list"><li><strong>A steep early cliff</strong> means visitors quit before the explainer says anything worth staying for — usually a slow intro or a hook that does not match why they arrived.</li>
<li><strong>A flat opening</strong> means the hook is landing and the rest of the video gets a chance.</li>
<li><strong>Play rate</strong> tells you how many visitors who see the player actually start it in the first place.</li></ul>
<p>Hook hold is the highest-leverage number on a homepage explainer, because every later second only matters for the visitors who survive the open.</p>`,
    },
    {
      h2: `Completion and reach-to-CTA`,
      html: `<p>Past the hook, two numbers tell you whether the explainer earns the next step:</p>
<ol><li><strong>Completion:</strong> how far the typical visitor gets, read from average watch time and the tail of the retention curve. A curve that fades long before the end means the message is not landing in full.</li>
<li><strong>Reach-to-CTA:</strong> the percentage of visitors who reach the second your call to action appears — the share who actually hear the ask.</li></ol>
<p class="kb-example">Hypothetical: if hook hold is strong but the curve fades steeply in the middle, the explainer over-explains and loses people before the point. If completion is healthy but reach-to-CTA is low because the CTA sits after a long tail, moving the ask earlier may capture viewers who were leaving anyway. The curve tells you which.</p>
<p>With conversion and CTA tracking (a Pro feature), you can also see how many of the visitors who reach the CTA click through.</p>`,
    },
    {
      h2: `From the curve to a clearer explainer`,
      html: `<p>Once you can see hook hold, completion, and reach-to-CTA, improving the explainer is a loop: fix the opening first, then the steepest mid-video drop, then check whether more visitors complete it and reach the CTA — comparing each version against your baseline.</p>
<p>With Pro, the second-by-second engagement heatmap ties a drop to the exact moment, and viewer-level history shows how sessions move through the video. VidaPulse measures the video step specifically — not a full page analytics suite — but on a video-led homepage the explainer is the decisive first impression, so measuring it is where the gains are.</p>`,
    },
  ],
  solve: `<p>VidaPulse gives you explainer video analytics without re-hosting and without code. You paste your explainer's existing URL (YouTube, Amazon S3, Google Drive, Dropbox, OneDrive, Azure Blob, Loom, a Zoom recording, Vimeo, or a direct MP4/HLS), VidaPulse wraps it in an analytics player, and you embed it with one line of script or a script-free iframe on your homepage — WordPress, Webflow, ClickFunnels, or custom HTML. The video stays where it lives and keeps its URL.</p>
<p>On your explainer you can read:</p>
<ul class="kb-list"><li>The <strong>audience-retention curve and play rate</strong> — hook hold in the first seconds.</li>
<li><strong>Average watch time</strong> and the curve's tail — completion across the video.</li>
<li>The <strong>percentage of viewers who reach any point</strong> — reach-to-CTA, the share who hear the ask.</li>
<li><strong>Conversion and CTA tracking</strong> (Pro) — whether viewers who reach the CTA act.</li>
<li>The <strong>second-by-second heatmap and viewer-level history</strong> (Pro) — the exact moment a drop happens.</li></ul>
<p>No personal data is collected, and you can restrict the player to your own domains. Start free and measure your explainer video: wrap it on your homepage, read the hook hold, and find out whether the video is earning the next step.</p>`,
  faq: [
    {
      q: `What does explainer video analytics measure?`,
      a: `It measures the explainer as a first impression: hook hold in the opening seconds from the retention curve, play rate, completion from average watch time and the curve's tail, and reach-to-CTA — plus, with conversion tracking, whether viewers who reach the CTA act. Together these show whether the video earns the next step.`,
    },
    {
      q: `Why does hook hold matter so much for an explainer?`,
      a: `A homepage explainer meets cold visitors who have not decided to care, so the first few seconds carry the most weight. If the hook does not hold, viewers leave before the video makes its point, and every later improvement only helps the few who stayed. That is why the opening of the retention curve is the highest-leverage number to fix first.`,
    },
    {
      q: `Do I have to move my explainer off my homepage to track it?`,
      a: `No. You paste the explainer's existing URL — from YouTube, S3, Drive, Dropbox, OneDrive, Azure Blob, Loom, Zoom, Vimeo, or a direct MP4/HLS link — and VidaPulse wraps it in an analytics player you embed with one line of script or a script-free iframe. It drops onto your homepage the same way your current player does, with nothing re-hosted.`,
    },
  ],
};
