'use strict';

module.exports = {
  metaTitle: `What is VSL analytics? | VidaPulse`,
  metaDescription: `VSL analytics measures how far viewers watch your video sales letter, what share reach the offer, and whether they act — so you fix the leak before the pitch.`,
  answer: `VSL analytics is the measurement of a video sales letter as a selling sequence: how far viewers watch, what percentage survive to the offer, and whether they act once they hear it. A VSL only converts the viewers who are still watching when the pitch arrives, so the numbers that matter are retention along the run-up, reach-to-offer at the moment the price or CTA appears, and conversions among those who get there. Good VSL analytics turns the video from a single "view" count into a second-by-second map of where the sale is won or lost.`,
  sections: [
    {
      h2: `Why a VSL needs its own analytics`,
      html: `<p>A video sales letter is built to do one job in sequence: hook, build the case, present the offer, ask for the sale. Every step depends on the one before it, so a viewer who leaves during the backstory never hears the offer, no matter how strong the offer is. That makes the VSL unusually unforgiving — the loss is almost always upstream of the pitch.</p>
<p>A plain view count cannot see any of this. It tells you someone pressed play, not how far they got or whether they were still there for the ask. VSL analytics exists to measure the inside of the letter: the exact points along the argument where attention holds and where it collapses.</p>`,
    },
    {
      h2: `Retention to the offer`,
      html: `<p>The core of VSL analytics is the <strong>audience-retention curve</strong>: the share of viewers still watching at every second of the letter. Read against the structure of your script, it tells you whether each section is earning the next.</p>
<ul class="kb-list"><li><strong>The opening seconds</strong> — a steep early cliff means viewers quit before the promise lands, and nothing downstream can recover them.</li>
<li><strong>The mid-letter slide</strong> — a long downhill stretch is usually backstory or proof that runs too long, bleeding interested viewers before the pitch.</li>
<li><strong>Average watch time and play rate</strong> — how much of the letter the typical viewer consumes, and how many who land actually start it.</li></ul>
<p>The curve turns "people watched the VSL" into a ranked list of the drops that cost you the most, in script order.</p>`,
    },
    {
      h2: `Reach-to-CTA and whether they act`,
      html: `<p>Two numbers convert the curve into a verdict on the sale:</p>
<ol><li><strong>Reach-to-offer:</strong> the percentage of viewers who reach the second your price, offer, or call to action appears. This is the share who even hear the ask — and on most VSLs it is far lower than the view count suggests.</li>
<li><strong>Conversions among those who reach it:</strong> with conversion and CTA tracking (a Pro feature), how many of the viewers who survive to the offer actually click through or buy.</li></ol>
<p class="kb-example">Hypothetical: if your curve reads twenty percent at the offer but the few who reach it convert well, the problem is the run-up losing people, not the pitch. If most reach the offer but few act, the offer or CTA itself is the weak link. The two have opposite fixes, and VSL analytics is how you tell them apart.</p>`,
    },
    {
      h2: `From the curve to a better VSL`,
      html: `<p>Once you can see inside the letter, improving it becomes a loop instead of a guess: read the curve, fix the single steepest drop ahead of the offer, then re-measure on fresh traffic to confirm the fix lifted reach-to-offer or conversions.</p>
<p>With Pro, the second-by-second engagement heatmap ties a drop to the exact sentence, and viewer-level history shows how sessions move through the letter. VidaPulse measures the video step specifically — not a full multi-page funnel suite — but in a VSL funnel the letter is the decisive step, so measuring it is where the real gains live.</p>`,
    },
  ],
  solve: `<p>VidaPulse gives you VSL analytics without re-hosting and without code. You paste your video sales letter's existing URL (YouTube, Amazon S3, Google Drive, Dropbox, OneDrive, Azure Blob, Loom, a Zoom recording, Vimeo, or a direct MP4/HLS), VidaPulse wraps it in an analytics player, and you embed it with one line of script or a script-free iframe on any page — WordPress, Webflow, ClickFunnels, or custom HTML. The video stays where it lives and keeps its URL.</p>
<p>On your VSL you can read:</p>
<ul class="kb-list"><li>The <strong>audience-retention curve, average watch time, and play rate</strong> — how far viewers watch.</li>
<li>The <strong>percentage of viewers who reach any point</strong> — reach-to-offer, the share who hear the ask.</li>
<li><strong>Conversion and CTA tracking</strong> (Pro) — whether viewers who reach the offer act.</li>
<li>The <strong>second-by-second heatmap and viewer-level history</strong> (Pro) — the exact sentence that loses people.</li>
<li><strong>UTM and source attribution</strong> — how each traffic source watches the letter.</li></ul>
<p>No personal data is collected, and you can restrict the player to your own domains. Start free and measure your VSL: wrap your video sales letter, pull your baseline curve, and find the drop that is costing you the sale.</p>`,
  faq: [
    {
      q: `What does VSL analytics actually measure?`,
      a: `It measures the video sales letter as a sequence: the retention curve across the whole letter, average watch time and play rate, the percentage of viewers who reach the offer, and — with conversion tracking — how many of those who reach it act. Together these show where the letter loses people before the pitch and whether the pitch itself converts.`,
    },
    {
      q: `Why is reach-to-offer more useful than my view count?`,
      a: `A view count only confirms someone pressed play. Reach-to-offer tells you what share of viewers were still watching when your price or CTA appeared — the only people who could possibly buy. It is usually far lower than the view count, and it is the number that explains a VSL that gets views but no sales.`,
    },
    {
      q: `Do I have to re-upload my VSL to track it?`,
      a: `No. You paste the VSL's existing URL — from YouTube, S3, Drive, Dropbox, OneDrive, Azure Blob, Loom, Zoom, Vimeo, or a direct MP4/HLS link — and VidaPulse wraps it in an analytics player you embed with one line of script or a script-free iframe. Nothing is re-hosted and the video keeps its URL.`,
    },
  ],
};
