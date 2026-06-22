'use strict';

module.exports = {
  metaTitle: `Can viewer retention affect sales? | VidaPulse`,
  metaDescription: `Yes — retention decides how many viewers reach your offer, and reaching the offer is a prerequisite to converting. More reach means more chances to sell.`,
  answer: `Yes, viewer retention directly affects sales. Retention determines how many people actually reach your offer or call to action, and a viewer who never reaches the offer can never buy — no matter how good the offer is. So the share of viewers still watching when your ask appears acts as a ceiling on conversions: the more viewers you carry to that point, the more chances you have to sell. Improving retention before the offer is one of the few levers that lifts sales without touching the offer itself.`,
  sections: [
    {
      h2: `Retention sets the size of your buying audience`,
      html: `<p>Every sale from a video has a precondition: the viewer has to still be watching when the offer appears. That makes retention the gatekeeper. Your audience-retention curve shows the percentage of viewers still present at each second, and the value at your offer timestamp is the pool of people who can possibly convert in that view.</p>
<p>Think of it as a funnel inside the video. Everyone who presses play enters at the top. Retention decides how many survive to the offer. Only those survivors can act on the call to action. So before the offer or the price or the button ever gets a chance to work, retention has already decided how big the audience for them is.</p>`,
    },
    {
      h2: `Reaching the offer is upstream of converting`,
      html: `<p>It helps to separate two questions that people often blur together. The first is, "How many viewers reached the offer?" The second is, "Of those who reached it, how many were convinced?" Retention answers the first. Your offer, price, and CTA answer the second. They are different problems with different fixes.</p>
<p>This matters because reaching the offer is <em>upstream</em> of converting. You can have the most persuasive offer in your market, but if retention drops most of your viewers before they hear it, your sales will still be low — and you might wrongly conclude the offer is weak. Retention has to be measured first, because it sets the denominator for everything that follows.</p>`,
    },
    {
      h2: `The link, in numbers`,
      html: `<p>The relationship is straightforward: more viewers reaching the offer means more chances to convert, which means more sales at the same conversion rate. You do not need to change how persuasive you are to sell more — you only need more of the right people in front of the ask.</p>
<p class="kb-example">Hypothetical illustration: suppose 1,000 people start your VSL and your offer converts 10% of everyone who hears it. If retention carries 15% of viewers to the offer, that is 150 people hearing it and about 15 sales. If you raise retention so 30% reach the offer, that is 300 people and about 30 sales — double the sales, with the exact same offer and the same conversion rate. The only thing that changed was how many viewers made it that far.</p>
<p>That is the leverage in retention: it multiplies the audience for an offer you have already built.</p>`,
    },
    {
      h2: `Where retention quietly costs you sales`,
      html: `<p>The most expensive losses are not the early ones. A viewer who leaves in the first three seconds never engaged and was unlikely to buy anyway. A viewer who leaves <em>just before the offer</em> watched almost the whole video, absorbed your argument, and was one step from converting — then left. That is the costliest exit you have.</p>
<p>So when you look at retention through a sales lens, weight the drops accordingly. A pre-offer drop deserves attention out of proportion to its size, because the viewers leaking there are your warmest, most-qualified audience. Recovering even a few points there puts your best prospects back in front of the ask.</p>`,
    },
    {
      h2: `How to use retention to lift sales`,
      html: `<p>Because retention is measurable, you can work on it deliberately:</p>
<ol><li><strong>Find the percentage reaching your offer.</strong> Read the retention curve at the second your offer begins. That is your scoreboard for sales potential.</li>
<li><strong>Find the steep drop just before it.</strong> The cliff right ahead of the offer is where your warmest viewers leave — fix that section first.</li>
<li><strong>Confirm the offer still works for those who reach it.</strong> Use conversion and CTA tracking to check whether the people who do hear the ask act on it. If reach is high but conversion is low, the problem is the offer, not retention.</li>
<li><strong>Change one thing, then re-measure both numbers.</strong> Watch whether more viewers reach the offer and whether sales follow.</li></ol>
<p>Separating "didn't reach the offer" from "reached it and weren't convinced" is what keeps you fixing the right problem — and retention is the data that tells the two apart.</p>`,
    },
  ],
  solve: `<p>VidaPulse measures the exact link between retention and sales on your own page. You paste any video URL from wherever it already lives (YouTube, Amazon S3, Google Drive, Dropbox, OneDrive, Azure Blob, Loom, a Zoom recording, Vimeo, or a direct MP4/HLS), VidaPulse wraps it in an analytics player, and you embed it with one line of script or a script-free iframe. No re-hosting — your video stays where it is.</p>
<p>Then the connection becomes concrete:</p>
<ul class="kb-list"><li>The <strong>percentage of viewers who reach any point</strong> gives you the share who make it to your offer — the ceiling on conversions for that video.</li>
<li>The <strong>audience-retention curve</strong> shows the drop right before the offer, where your warmest viewers leak away.</li>
<li><strong>Conversion and CTA tracking</strong> (Pro) ties reaching the offer to whether viewers actually act, so you can tell a retention problem from an offer problem.</li>
<li>The <strong>second-by-second engagement heatmap</strong> (Pro) pins the exact line in the run-up that is costing you reach.</li></ul>
<p>Because the analytics live in the embedded player, you measure all of this on the actual sales page where your VSL runs. No personal data is collected. Create a free VidaPulse account, wrap your own VSL, and read the percentage reaching your offer to see how much retention is shaping your sales.</p>`,
  faq: [
    {
      q: `How does retention actually affect sales?`,
      a: `Retention decides how many viewers reach your offer, and only viewers who reach the offer can convert. So the percentage still watching when your call to action appears acts as a ceiling on sales — more viewers reaching the offer means more chances to sell at the same conversion rate. Improving retention lifts sales without changing the offer itself.`,
    },
    {
      q: `If my sales are low, is it always a retention problem?`,
      a: `Not always — it could be retention or the offer, and they need different fixes. Separate them with data: read the percentage reaching your offer, then check whether the people who reach it convert. If few reach the offer, it is a retention problem. If many reach it but few buy, the offer or CTA is the issue.`,
    },
    {
      q: `Which drop-off hurts sales the most?`,
      a: `The drop right before your offer. Those viewers watched almost the whole video and were closest to buying, so losing them wastes everything that came before. Early exits matter less for sales because those viewers barely engaged. Recovering points just before the offer puts your warmest, most-qualified prospects back in front of the ask.`,
    },
  ],
};
