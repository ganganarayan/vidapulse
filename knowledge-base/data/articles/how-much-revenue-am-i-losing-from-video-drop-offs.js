'use strict';

module.exports = {
  metaTitle: `Revenue lost to video drop-offs? | VidaPulse`,
  metaDescription: `Video drop-offs cost real money. Follow the chain — plays to % reaching the offer to conversions to revenue — and turn your own drop-off into a dollar figure.`,
  answer: `You can put a number on it. The revenue you lose to video drop-offs is the gap between what every viewer could be worth and what only the viewers who reach your offer actually produce. Follow the chain: plays, then the percentage who reach the offer, then the conversion rate among those who hear it, then revenue. Every viewer who drops before the offer is a viewer you paid to acquire who never had a chance to buy. Measure your own percentage reaching the offer and you can price the loss exactly.`,
  sections: [
    {
      h2: `The chain that connects drop-offs to dollars`,
      html: `<p>Selling with a video runs as a chain, and a drop-off is a break in one of its links. People press play. Some share of them keep watching until they reach your offer. Some share of those convert. That produces revenue. Lay it out in order:</p><ol><li><strong>Plays</strong> — how many people press play in a given period.</li><li><strong>Percentage reaching the offer</strong> — the share still watching when your video asks for the sale.</li><li><strong>Conversion rate</strong> — the share of those who hear the offer who actually buy or book.</li><li><strong>Revenue</strong> — conversions multiplied by your price or order value.</li></ol><p>A video drop-off attacks link two. It shrinks the pool that reaches the offer, and because every link after that multiplies off the one before, a smaller pool at the offer scales down conversions and revenue with it. That is why mid-video drop-off is not a vanity problem: it sits directly on the path between the traffic you pay for and the money you collect.</p>`,
    },
    {
      h2: `Why a drop-off before the offer is the most expensive loss`,
      html: `<p>You pay to acquire every viewer up front — whether they came from an ad, an email, or organic search — and you pay the same for a viewer who watches to the end as for one who quits in the first ten seconds. So a drop-off <em>before</em> the offer is the costliest kind. You spent to bring that person in, the video lost them before the pitch, and there was never an opportunity to convert them.</p><p>From your dashboard this looks like traffic that "didn't convert." In reality, most of it never reached the moment that asks for the sale. The acquisition cost was real and the chance to earn it back was thrown away inside the video. That is the loss you are trying to quantify: not people who heard the offer and said no, but people who were never given the offer at all.</p>`,
    },
    {
      h2: `A worked example: turning a drop-off into a dollar figure`,
      html: `<p>The clearest way to see the loss is to run the chain with numbers. These figures are <strong>hypothetical and illustrative</strong>, made up to show the shape of the math — not VidaPulse data and not a promise of results. Use your own numbers when you have them.</p><p class="kb-example">Suppose 1,000 people press play on your VSL this month. Suppose the offer appears at the four-minute mark, and your retention curve reads 25% there, so 250 viewers reach the offer and 750 drop before it. Suppose 12% of those who hear the offer buy, at a price of 200 dollars. That is 30 sales, or 6,000 dollars, from those 1,000 plays.</p><p class="kb-example">Now suppose you fix the weakest section so 40% reach the offer instead of 25%, with the <em>same</em> 1,000 plays and the <em>same</em> 12% close rate among those who hear the pitch. Now 400 reach the offer and 48 buy: 9,600 dollars. The difference, 3,600 dollars, is what that single drop-off was costing you each month — on traffic you were already paying for.</p><p>The exact figures do not matter; the structure does. When the bottleneck is how many reach the offer, the gap between your current percentage and a higher one is your monthly loss, in dollars.</p>`,
    },
    {
      h2: `The data you need to do this on your own video`,
      html: `<p>To replace the hypothetical with your real loss, you need four numbers, and you need them from the video itself, not from the page:</p><ul class="kb-list"><li><strong>Plays</strong> in your chosen period.</li><li><strong>Percentage of viewers reaching the offer</strong> — read at the exact timestamp your offer begins.</li><li><strong>Conversion rate</strong> among viewers who reach the offer — which requires connecting the offer moment to the action that follows.</li><li><strong>Price or order value</strong> — which you already know.</li></ul><p>The number most people are missing is the second one: the precise share of viewers still watching when the offer appears. Without it, the whole calculation is a guess. With it, the loss stops being a feeling and becomes a figure you can compare against the cost of fixing the video.</p>`,
    },
    {
      h2: `What the number tells you to do next`,
      html: `<p>Once you can price the loss, two things follow. First, you stop scaling the leak. If viewers drop before the offer, buying more traffic just sends more people to the same exit, and you pay more to lose them at the same spot. The dollar figure makes that obvious, because doubling spend without changing the percentage that reaches the offer simply doubles the loss.</p><p>Second, you can prioritize. If you have more than one video, or more than one drop-off point, the loss figure tells you which one is the expensive one and worth fixing first. That is the whole value of quantifying it: it turns "my videos could be better" into a ranked list of revenue you can recover.</p>`,
    },
  ],
  solve: `<p>VidaPulse gives you every number in the chain so you can compute your real loss instead of a hypothetical. You paste your existing video URL from wherever it already lives (YouTube, Amazon S3, Google Drive, Dropbox, OneDrive, Azure Blob, Loom, a Zoom recording, Vimeo, or a direct MP4 or HLS file), VidaPulse wraps it in an analytics player, and you embed one line of script or a script-free iframe on your page. No re-hosting, no re-uploading, and no personal data collected.</p><p>To turn your drop-offs into a dollar figure:</p><ul class="kb-list"><li>See <strong>plays</strong>, <strong>play rate</strong>, and <strong>total and unique viewers</strong> for the top of the chain.</li><li>Read the <strong>percentage of viewers who reach any point</strong> at your offer timestamp — the share who actually hear the pitch.</li><li>Use the <strong>audience-retention curve</strong>, and on Pro the <strong>second-by-second engagement heatmap</strong>, to locate the drop-off that costs the most.</li><li>Connect it with <strong>conversion and CTA tracking</strong> (Pro) to measure the conversion rate among viewers who reach the offer, closing the chain to revenue.</li></ul><p>With those figures you can run the math on your own data: how many viewers you lose before the offer, and what that drop-off costs at your conversion rate and price. Create a free VidaPulse account, wrap your own video, and find out exactly how much revenue your drop-offs are costing you.</p>`,
  faq: [
    {
      q: `How do I calculate revenue lost to video drop-offs?`,
      a: `Run the chain twice. Multiply your plays by the percentage who reach the offer, then by your close rate among those people, then by your price — that is your current revenue. Do the same math with a higher percentage reaching the offer. The gap is what your drop-off is costing. The number you most likely lack is the real percentage of viewers reaching the offer.`,
    },
    {
      q: `Why is a drop-off before the offer worse than one after?`,
      a: `Because you paid to acquire that viewer and the offer never ran for them. A viewer who hears the pitch and declines at least had the chance to convert. A viewer who leaves before the offer was an acquisition cost with no opportunity to earn it back. That is why the loss concentrates in mid-video drop-off before the pitch.`,
    },
    {
      q: `Will buying more traffic recover the lost revenue?`,
      a: `No — if viewers drop before the offer, more traffic just sends more people to the same exit and you pay more to lose them at the same spot. The loss figure makes this clear: without raising the percentage that reaches the offer, doubling spend roughly doubles the loss. Fix the drop-off first, then the traffic you already buy converts a larger share.`,
    },
  ],
};
