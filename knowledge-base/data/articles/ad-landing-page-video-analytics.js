'use strict';

module.exports = {
  metaTitle: `What is ad landing page video analytics? | VidaPulse`,
  metaDescription: `Ad landing page video analytics measures the video after the click — retention, reach-to-offer, and performance by source — so you find the leak past the ad.`,
  answer: `Ad landing page video analytics is the measurement of the video on the page people land on after clicking an ad: how far they watch, what share reach the offer, and how that differs by traffic source. Once the click is paid for, the video is usually where the visit is won or lost — it does the persuading, and most of the page's drop-off happens inside it. This is not about running ads; it is about the video that the ad traffic lands on, and finding where that video leaks the visitors you already paid to bring.`,
  sections: [
    {
      h2: `The video is the leak after the click`,
      html: `<p>When you pay for a click, the cost is already sunk by the time the visitor arrives. On a video-led landing page, the page itself is light — a headline, a player, a button — and the argument that turns a clicker into a lead or buyer lives inside the video. So when the page underperforms, the loss is usually happening in the video, not in the layout around it.</p>
<p>This page is about that video, not about the ad campaign. The ad's job ends at the click; the video's job begins there. Ad landing page video analytics measures the inside of that video so you can see where the paid-for visitor actually leaves.</p>`,
    },
    {
      h2: `Retention and reach-to-offer`,
      html: `<p>Two measurements tell you whether the video earns the click:</p>
<ul class="kb-list"><li><strong>Audience-retention curve</strong> — the share of visitors still watching at every second, so you can see exactly where attention falls off after the click.</li>
<li><strong>Reach-to-offer</strong> — the percentage of visitors who reach the second your offer or CTA appears, which is the share who could possibly act.</li>
<li><strong>Play rate, average watch time, and unique viewers</strong> — how the paid traffic consumes the video on the page.</li></ul>
<p>Together these answer what paid-traffic dashboards cannot: not just "did the click convert?" but "how far did the visitor watch, and did they ever reach the offer?" On most ad landing pages, reach-to-offer is far lower than the click count, and that gap is where the spend leaks.</p>`,
    },
    {
      h2: `Read it by source with UTM`,
      html: `<p>An ad landing page often receives clicks from several campaigns, audiences, or channels at once, and the same video performs very differently depending on who arrives. Reading the analytics by source is what makes the data actionable.</p>
<p>With UTM parameters on your inbound links, VidaPulse attributes each viewer to a source, so you can compare retention, reach-to-offer, and conversions per channel.</p>
<p class="kb-example">Hypothetical: one source might reach your offer at thirty percent while a colder source reaches it at twelve percent on the very same page. That tells you the video holds the warmer traffic but loses the colder traffic early — a hook-and-matching insight you would never see from a single blended number across all clicks.</p>`,
    },
    {
      h2: `From the curve to a tighter page`,
      html: `<p>Once you can see inside the video, plugging the leak is a loop: read the retention curve to find the steepest drop, fix the section before it, then check whether more visitors now reach the offer — by source — against your baseline.</p>
<p>With Pro, the second-by-second heatmap ties a drop to the exact moment and viewer-level history shows how sessions behave. VidaPulse measures the video step specifically; it is not an ads tool and not a full page-by-page funnel suite. But on a video-led ad landing page the video is the decisive step after the click, so measuring it is where you recover the visitors you already paid for.</p>`,
    },
  ],
  solve: `<p>VidaPulse gives you ad landing page video analytics without re-hosting and without code, and without touching your ad setup. You paste the landing page video's existing URL (YouTube, Amazon S3, Google Drive, Dropbox, OneDrive, Azure Blob, Loom, a Zoom recording, Vimeo, or a direct MP4/HLS), VidaPulse wraps it in an analytics player, and you embed it with one line of script or a script-free iframe on the same page — WordPress, Webflow, ClickFunnels, or custom HTML. The video stays where it lives and keeps its URL.</p>
<p>On your ad landing page video you can read:</p>
<ul class="kb-list"><li>The <strong>audience-retention curve, average watch time, and play rate</strong> — where the paid-for visitor leaves.</li>
<li>The <strong>percentage of viewers who reach any point</strong> — reach-to-offer, the share who hear the ask.</li>
<li><strong>UTM and source attribution</strong> — retention and reach-to-offer broken out by channel.</li>
<li><strong>Conversion and CTA tracking</strong> (Pro) — whether visitors who reach the offer act.</li>
<li>The <strong>second-by-second heatmap and viewer-level history</strong> (Pro) — the exact moment a drop happens.</li></ul>
<p>No personal data is collected, and you can restrict the player to your own domains. Start free and measure your ad landing page video: wrap it on the same page, read it by source, and find where the video is leaking the clicks you paid for.</p>`,
  faq: [
    {
      q: `Is this an ads tool or about running ads?`,
      a: `No. It does not run, manage, or optimize ad campaigns. It measures the video on the page that ad traffic lands on — how far visitors watch after the click, what share reach the offer, and how that varies by source. The ad's job ends at the click; this is about what the video does with the visitor after that.`,
    },
    {
      q: `Why measure the video instead of just the page conversion rate?`,
      a: `A page conversion rate tells you the click converted or it did not, treating the video as played-or-not. On a video-led ad landing page the video is where the decision happens, so the page rate hides the real story: how far the paid-for visitor watched, where they left, and whether they ever reached the offer. That detail is what explains and improves the conversion rate.`,
    },
    {
      q: `Can I compare how different ad sources watch the video?`,
      a: `Yes. Add UTM parameters to your inbound links and VidaPulse attributes each viewer to a source, so you can compare retention, reach-to-offer, and conversions per channel. The same video often performs very differently for warmer versus colder traffic, and reading it by source is what makes the data actionable.`,
    },
  ],
};
