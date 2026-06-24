'use strict';

module.exports = {
  metaTitle: `What is product video analytics? | VidaPulse`,
  metaDescription: `Product video analytics measures engagement and drop-offs on your product or feature video — so you see which feature holds attention and which loses it.`,
  answer: `Product video analytics is the measurement of a product or feature video as a value story: how engaged viewers stay, where they drop off, and which feature or moment holds attention. A product video has to keep showing why each capability matters, so the numbers that count are engagement across the video, the drop-off points between sections, and how much of the value story the typical viewer actually sees. Good product video analytics shows you which features earn attention and which ones quietly send viewers away.`,
  sections: [
    {
      h2: `Why a product video needs its own analytics`,
      html: `<p>A product or feature video walks viewers through what something does and why it matters, capability by capability. Attention is conditional: viewers stay while a feature feels relevant and leave the moment a section drags or covers something they do not care about. So the value the video delivers depends entirely on how far each viewer gets through the story.</p>
<p>A view count flattens that into a single play event. It cannot tell you which feature held attention, where viewers left, or how much of the value story landed. Product video analytics measures the inside of the video, so engagement and drop-off attach to specific parts of the product.</p>`,
    },
    {
      h2: `Engagement across the video`,
      html: `<p>The foundation is the <strong>audience-retention curve</strong>: the share of viewers still watching at every second. Read against your sections, it shows where the product story holds attention and where it loses it.</p>
<ul class="kb-list"><li><strong>Flat stretches</strong> are features doing their job — viewers are staying through them.</li>
<li><strong>Steep drops</strong> are sections that lose people, whether they run long, feel off-topic, or follow a weak transition.</li>
<li><strong>Average watch time, play rate, replays, and unique viewers</strong> — how much of the story the typical viewer sees, how many start it, and which moments get rewatched.</li></ul>
<p>Replays are especially telling on a product video: a moment viewers rewind to is one they found important or hard to follow, and either is worth knowing.</p>`,
    },
    {
      h2: `Finding the drop-offs`,
      html: `<p>Engagement is the picture; drop-offs are the targets. Read the curve to find the single steepest fall and tie it to a section of the product story.</p>
<ol><li>Locate the steepest drop and note the feature or transition right before it — that is the suspect.</li>
<li>With the second-by-second engagement heatmap (a Pro feature), pin the exact moment inside that section where viewers bail, down to the line.</li>
<li>Check how far the curve has fallen by the end to see how many viewers ever reach your closing point or call to action.</li></ol>
<p class="kb-example">Hypothetical: if the curve holds through the first two features but falls off a cliff when a third, more technical feature begins, that section is asking for patience it does not earn back. Cutting or reframing just that part is the fix — and the curve tells you it was the culprit.</p>`,
    },
    {
      h2: `From the curve to a tighter product video`,
      html: `<p>Once you can see engagement and drop-offs, improving the video is a loop: tighten or reorder the single section with the steepest drop, then re-measure to confirm more viewers stayed through it and reached the end.</p>
<p>With Pro, viewer-level history shows how individual sessions move through the features, and the heatmap pins the exact moment a section loses people. VidaPulse measures the video step specifically — it is not a full multi-page funnel suite — but the product video is where most of the engagement and drop-off happens, so it is the step worth measuring.</p>`,
    },
  ],
  solve: `<p>VidaPulse gives you product video analytics without re-hosting and without code. You paste your product or feature video's existing URL (YouTube, Amazon S3, Google Drive, Dropbox, OneDrive, Azure Blob, Loom, a Zoom recording, Vimeo, or a direct MP4/HLS), VidaPulse wraps it in an analytics player, and you embed it with one line of script or a script-free iframe on any page — WordPress, Webflow, ClickFunnels, or custom HTML. The video stays where it lives and keeps its URL.</p>
<p>On your product video you can read:</p>
<ul class="kb-list"><li>The <strong>audience-retention curve, average watch time, play rate, and replays</strong> — engagement across the video.</li>
<li>The <strong>drop-off points</strong> on the curve — which feature or section loses viewers.</li>
<li>The <strong>second-by-second engagement heatmap and viewer-level history</strong> (Pro) — the exact moment a section loses people.</li>
<li>The <strong>percentage of viewers who reach any point</strong> — how many reach your closing point or CTA.</li>
<li><strong>UTM and source attribution</strong> — how each traffic source watches the video.</li></ul>
<p>No personal data is collected, and you can restrict the player to your own domains. Start free and measure your product video: wrap it, read the engagement curve, and find the feature that is sending viewers away.</p>`,
  faq: [
    {
      q: `What does product video analytics measure?`,
      a: `It measures engagement and drop-off across a product or feature video: the retention curve, average watch time, play rate, replays, and the drop-off points between sections — plus, with Pro, a second-by-second heatmap and viewer-level history. Together these show which feature holds attention and which one loses viewers.`,
    },
    {
      q: `Why do replays matter on a product video?`,
      a: `A moment viewers rewind to is one they found important or hard to follow. On a product video that signal is useful either way: an important moment may deserve more emphasis, and a confusing one may need to be reworked. Replays appear alongside the retention curve so you can see which parts of the product story pull viewers back.`,
    },
    {
      q: `Do I have to move my product video to track it?`,
      a: `No. You paste the video's existing URL — from YouTube, S3, Drive, Dropbox, OneDrive, Azure Blob, Loom, Zoom, Vimeo, or a direct MP4/HLS link — and VidaPulse wraps it in an analytics player you embed with one line of script or a script-free iframe. Nothing is re-hosted and the video keeps its URL.`,
    },
  ],
};
