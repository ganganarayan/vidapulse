'use strict';

module.exports = {
  metaTitle: `How to calculate cost of video drop-off | VidaPulse`,
  metaDescription: `Calculate the cost of video drop-off with a simple formula: lost viewers at the offer times conversion rate times order value. See what data you need to run it.`,
  answer: `Calculate the cost of video drop-off with a simple formula: the number of viewers you lose before the offer, multiplied by your conversion rate among people who reach the offer, multiplied by your order value. That gives an illustrative estimate of the sales those lost viewers would have produced if they had stayed. The hard part is not the arithmetic — it is getting the real number of viewers who drop before the offer, which you read from your video's retention curve, not from page analytics.`,
  sections: [
    {
      h2: `The formula`,
      html: `<p>The cost of video drop-off is an estimate of revenue that lost viewers would have produced had they reached and acted on your offer. The formula is intentionally simple:</p><p class="kb-example"><strong>Cost of drop-off = lost viewers at the offer × conversion rate × order value</strong></p><p>Read it left to right. <em>Lost viewers at the offer</em> is the count of people who pressed play but were gone before the offer appeared. <em>Conversion rate</em> is the share of viewers who reach the offer and then buy or book — the rate among survivors, not among all plays. <em>Order value</em> is your price or average order value. Multiply the three and you have an illustrative figure for what the drop-off costs over the period you measured.</p><p>Every figure produced by this formula is an estimate, not a guarantee. It assumes the lost viewers would have converted at the same rate as the ones who stayed, which is an approximation. Its value is not precision to the dollar; it is turning a vague "my video loses people" into a number you can rank and act on.</p>`,
    },
    {
      h2: `A worked example, clearly illustrative`,
      html: `<p>The numbers below are <strong>hypothetical and made up for illustration</strong> — not VidaPulse data and not a promise of results. Substitute your own figures when you have them.</p><p class="kb-example">Suppose 1,000 people press play on your VSL this month and the offer appears at three minutes. Your retention curve reads 35% at three minutes, so 350 reach the offer and 650 are lost before it. Suppose, conservatively, that the lost viewers would have converted at the same rate as the survivors — say 8% — at an order value of 150 dollars. The illustrative cost of that drop-off is 650 × 0.08 × 150, which is 7,800 dollars for the month.</p><p>Two cautions. First, the real lost viewers almost certainly would not all have converted at the survivor rate — people who leave early were less engaged — so treat the figure as an upper-bound illustration, not a literal forecast. Second, the point of the math is comparison: if one video's drop-off prices out at 7,800 dollars and another's at 1,200 dollars, you know which to fix first. The relative size is more reliable than the absolute figure.</p>`,
    },
    {
      h2: `The data you need to run it`,
      html: `<p>The formula has three inputs, and two of them must come from the video itself, not the page:</p><ul class="kb-list"><li><strong>Lost viewers at the offer.</strong> This is plays minus the number who reach the offer. You get it from the percentage of viewers who reach your offer timestamp, applied to your total plays. This is the input most people are missing.</li><li><strong>Conversion rate among those who reach the offer.</strong> Not your overall page conversion — the rate among viewers who actually heard the pitch. You get it by connecting the offer moment to the action that follows.</li><li><strong>Order value.</strong> Your price or average order value, which you already know.</li></ul><p>Notice that two of the three inputs require seeing inside the video. Page analytics give you plays and maybe a final sale count, but they cannot tell you how many viewers reached the offer or what the survivors converted at. Without those, the formula has no real numbers to chew on and you are back to guessing.</p>`,
    },
    {
      h2: `Pricing each drop-off separately`,
      html: `<p>A video rarely has one leak; it has several smaller drops plus, often, one cliff. You can run the formula on each drop separately by reading the percentage reaching the point just before and just after a drop. The difference is the viewers lost at that spot, and you can price that single section.</p><p>This is more useful than one lump figure, because it tells you where the recoverable money is concentrated. A long slow decline might cost less in total than one sharp cliff at a single second. Pricing each drop turns the retention curve into a ranked list: this section costs the most, fix it first; that section is minor, leave it. You are not just measuring loss, you are sequencing the work.</p>`,
    },
    {
      h2: `What the cost figure is for`,
      html: `<p>The reason to calculate this at all is decision-making. A drop-off cost lets you do three things. First, compare the loss to the effort of fixing it — if a section costs an illustrative few thousand dollars a month and a rewrite takes an afternoon, the decision is easy. Second, resist scaling the leak: if viewers drop before the offer, the cost figure shows that buying more traffic just multiplies the same loss. Third, prioritize across videos, so you spend your time on the leak that drains the most.</p><p>Used this way, the formula is not an accounting exercise. It is a way to point your effort at the most expensive problem instead of the most obvious one.</p>`,
    },
  ],
  solve: `<p>VidaPulse supplies the two inputs the formula is missing — how many viewers reach the offer and what the survivors convert at — measured on your real video. You paste your existing video URL from wherever it already lives (YouTube, Amazon S3, Google Drive, Dropbox, OneDrive, Azure Blob, Loom, a Zoom recording, Vimeo, or a direct MP4 or HLS file), VidaPulse wraps it in an analytics player, and you embed one line of script or a script-free iframe on your page. No re-hosting, no re-uploading, and no personal data collected.</p><p>To calculate your drop-off cost:</p><ul class="kb-list"><li>Get <strong>lost viewers</strong> from <strong>total plays</strong> and the <strong>percentage of viewers who reach any point</strong>, read at your offer timestamp.</li><li>Use the <strong>audience-retention curve</strong>, and on Pro the <strong>second-by-second engagement heatmap</strong>, to price each individual drop, not just the total.</li><li>Get the <strong>conversion rate among viewers who reach the offer</strong> from <strong>conversion and CTA tracking</strong> (Pro), so the formula uses the survivor rate, not your blended page rate.</li><li>Check <strong>source attribution</strong> to see which traffic is feeding the drop-off you just priced.</li></ul><p>With those numbers the formula runs on your own data instead of a hypothetical. Create a free VidaPulse account, wrap your own video, read the percentage reaching your offer, and put a real dollar figure on what your drop-off is costing.</p>`,
  faq: [
    {
      q: `What is the formula for the cost of video drop-off?`,
      a: `Lost viewers at the offer times your conversion rate among viewers who reach the offer times your order value. Lost viewers is plays minus the number who reach the offer. The result is an illustrative estimate of the sales those lost viewers would have produced. It is an approximation, because early leavers may convert below the survivor rate.`,
    },
    {
      q: `Why use the survivor conversion rate instead of my overall conversion rate?`,
      a: `Because the formula is asking what the lost viewers would have done if they had reached the offer. The relevant benchmark is how viewers who actually hear the offer convert — the survivor rate — not your blended page rate, which is dragged down by everyone who never got to the pitch. Using the page rate would understate the cost of the drop-off.`,
    },
    {
      q: `Is the calculated cost a guarantee of recoverable revenue?`,
      a: `No. It is an illustrative upper-bound estimate. It assumes lost viewers would have converted at the survivor rate, and early leavers were probably less likely to buy. Treat the figure as a way to rank and prioritize leaks rather than a literal forecast. The relative size between drops is more reliable than any single absolute number.`,
    },
  ],
};
