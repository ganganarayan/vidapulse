'use strict';

module.exports = {
  metaTitle: `What is sales video analytics? | VidaPulse`,
  metaDescription: `Sales video analytics measures retention, reach-to-offer, and conversions on any sales video — so you see where it loses buyers and whether the offer lands.`,
  answer: `Sales video analytics is the measurement of any video built to sell — its retention, the share of viewers who reach the offer, and whether they convert once they do. A sales video only earns revenue from the viewers who are still watching when the offer appears, so the numbers that matter are retention across the whole video, reach-to-offer at the moment the price or ask shows up, and conversions among those who get there. Good sales video analytics turns a single view count into a clear picture of where the video loses buyers and whether the offer itself is landing.`,
  sections: [
    {
      h2: `Why a sales video needs its own analytics`,
      html: `<p>Whatever the format — a long pitch, a short closer, a recorded walkthrough that ends in an ask — a sales video lives or dies on the same logic: the viewer has to still be there when you ask for the sale. Drop them during the build-up and the offer never reaches them, so the loss is almost always upstream of the close.</p>
<p>A view count flattens all of that into one number that confirms a play and nothing more. It cannot tell you how far viewers got, whether they reached the offer, or whether the offer converted the ones who did. Sales video analytics measures the inside of the video, so each drop attaches to a moment in the pitch.</p>`,
    },
    {
      h2: `Retention across the video`,
      html: `<p>The foundation is the <strong>audience-retention curve</strong>: the share of viewers still watching at every second. Read against your script, it shows which parts of the pitch hold attention and which bleed it.</p>
<ul class="kb-list"><li><strong>Steep early drops</strong> — viewers quitting before the promise lands, usually a slow open or a hook that misfires.</li>
<li><strong>Long mid-video slides</strong> — proof or story that runs too long, losing interested buyers before the offer.</li>
<li><strong>Average watch time and play rate</strong> — how much the typical viewer watches, and how many who land actually start the video.</li></ul>
<p>The curve turns "people watched the sales video" into a ranked list of the drops doing the most damage, in pitch order.</p>`,
    },
    {
      h2: `Reach-to-offer and conversions`,
      html: `<p>Two numbers turn retention into a revenue verdict:</p>
<ol><li><strong>Reach-to-offer:</strong> the percentage of viewers who reach the second your offer, price, or ask appears — the share who could possibly buy.</li>
<li><strong>Conversions among those who reach it:</strong> with conversion and CTA tracking (a Pro feature), how many of the viewers who survive to the offer actually click through or buy.</li></ol>
<p class="kb-example">Hypothetical: if reach-to-offer is low but the few who get there convert well, the fix is upstream — keep more viewers alive to the offer. If reach-to-offer is high but conversions are weak, the offer or CTA is the problem. Sales video analytics is how you tell which side of the offer is leaking.</p>`,
    },
    {
      h2: `From the curve to more sales`,
      html: `<p>Once you can see retention, reach-to-offer, and conversions together, improving the video becomes a loop instead of a guess: read the curve, fix the single steepest drop ahead of the offer, then re-measure to confirm more viewers reached the offer and converted.</p>
<p>With Pro, the second-by-second engagement heatmap ties a drop to the exact sentence, and viewer-level history shows how individual sessions move toward the offer. VidaPulse measures the video step specifically — it is not a full multi-page funnel suite — but the sales video is the decisive selling step, so measuring it is where revenue is recovered.</p>`,
    },
  ],
  solve: `<p>VidaPulse gives you sales video analytics without re-hosting and without code. You paste your sales video's existing URL (YouTube, Amazon S3, Google Drive, Dropbox, OneDrive, Azure Blob, Loom, a Zoom recording, Vimeo, or a direct MP4/HLS), VidaPulse wraps it in an analytics player, and you embed it with one line of script or a script-free iframe on any page — WordPress, Webflow, ClickFunnels, or custom HTML. The video stays where it lives and keeps its URL.</p>
<p>On your sales video you can read:</p>
<ul class="kb-list"><li>The <strong>audience-retention curve, average watch time, and play rate</strong> — where the video loses buyers.</li>
<li>The <strong>percentage of viewers who reach any point</strong> — reach-to-offer, the share who hear the ask.</li>
<li><strong>Conversion and CTA tracking</strong> (Pro) — whether viewers who reach the offer convert.</li>
<li>The <strong>second-by-second heatmap and viewer-level history</strong> (Pro) — the exact moment a drop happens.</li>
<li><strong>UTM and source attribution</strong> — how each traffic source watches and converts.</li></ul>
<p>No personal data is collected, and you can restrict the player to your own domains. Start free and measure your sales video: wrap it, pull your baseline curve, and find the drop that is costing you sales.</p>`,
  faq: [
    {
      q: `What does sales video analytics measure?`,
      a: `It measures a selling video end to end: the retention curve across the whole video, average watch time and play rate, the percentage of viewers who reach the offer, and — with conversion tracking — how many of those who reach it convert. Together these show where the video loses buyers and whether the offer itself lands.`,
    },
    {
      q: `How do I tell a retention problem from an offer problem?`,
      a: `Compare reach-to-offer with conversions. If few viewers reach the offer but those who do convert well, the leak is upstream and you need to keep more viewers alive to the offer. If many reach the offer but few convert, the offer or CTA is the weak link. The two have opposite fixes, and the numbers tell you which one to make.`,
    },
    {
      q: `Do I have to re-upload my sales video to track it?`,
      a: `No. You paste the video's existing URL — from YouTube, S3, Drive, Dropbox, OneDrive, Azure Blob, Loom, Zoom, Vimeo, or a direct MP4/HLS link — and VidaPulse wraps it in an analytics player you embed with one line of script or a script-free iframe. Nothing is re-hosted and the video keeps its URL.`,
    },
  ],
};
