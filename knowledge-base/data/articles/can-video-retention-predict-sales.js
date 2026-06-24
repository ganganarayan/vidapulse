'use strict';

module.exports = {
  metaTitle: `Can video retention predict sales? | VidaPulse`,
  metaDescription: `Video retention, especially the % of viewers who reach your offer, is a leading indicator of sales because it controls how many hear your pitch. How to test it.`,
  answer: `Yes, to a meaningful degree — especially the percentage of viewers who reach your offer. Retention predicts sales because it controls how many people ever hear your pitch, and almost nobody buys before they hear the offer. It is a leading indicator, not a guarantee: the offer and the page still have to close. But because the pool that can convert is the pool that reaches the offer, retention to that point moves in step with sales. You can test the link on your own data by tracking both numbers over time.`,
  sections: [
    {
      h2: `Why retention leads sales`,
      html: `<p>The reason retention predicts sales is structural, not statistical. Selling with video is a chain: people press play, some keep watching until they reach the offer, some of those convert, and that produces revenue. Retention governs the link in the middle — how many viewers survive to the offer. Since the offer is what asks for the sale, the size of that surviving pool sets a ceiling on how many people can possibly buy.</p><p>That makes retention a <em>leading</em> indicator. Sales are the lagging result; retention to the offer is visible earlier and shapes the result before it happens. If far fewer viewers reach the offer this week, you can expect softer sales to follow, because fewer people heard the ask. The prediction is not magic; it is the chain doing what chains do.</p>`,
    },
    {
      h2: `The percentage reaching the offer is the sharpest predictor`,
      html: `<p>Not all retention numbers predict equally well. Overall average watch time is a blunt proxy; retention all the way to the end can be beside the point if your offer comes earlier. The metric with the tightest link to sales is the <strong>percentage of viewers who reach your offer</strong>.</p><p>The logic is simple: almost nobody buys before they hear the offer. So the count of people who arrive at the ask is the count of people who could convert at all. Grow that count and, holding your close rate steady, sales grow with it. Shrink it and sales fall. That is why, when you want one retention number to watch as a predictor of revenue, you watch the share reaching the offer — not total views and not retention to the final second.</p>`,
    },
    {
      h2: `Honest limits: retention is a leading indicator, not a guarantee`,
      html: `<p>Retention predicts how many people <em>hear</em> the offer; it does not guarantee they buy. Two videos can send the same share to the offer and convert very differently if one has a stronger pitch, a clearer price, or a better page after the click. So retention is necessary but not sufficient: it sets the size of the audience your offer works on, and the offer still has to do its job.</p><p>The relationship also depends on things that move with retention. Traffic temperature matters — warm viewers reach the offer more readily than cold ad traffic. Where the offer sits matters — an earlier offer is reached by more people for purely mechanical reasons. So treat retention as a strong leading indicator within your own funnel, not as a universal formula you can lift from someone else's video. The honest claim is: more people reaching the offer reliably means more people <em>can</em> buy, and usually means more <em>do</em>.</p>`,
    },
    {
      h2: `How to test the correlation on your own data`,
      html: `<p>You do not have to take the relationship on faith. Test it on your funnel by tracking two numbers over the same periods and watching whether they move together:</p><ol><li><strong>Percentage of viewers reaching the offer</strong> — read your retention curve at the exact second your offer begins, each week or per video version.</li><li><strong>Sales</strong> — or conversions, booked calls, or sign-ups, for the same period and the same traffic.</li></ol><p>Then change one thing. Edit the section before the offer to raise the percentage reaching it, keep traffic and offer constant, and see whether sales follow. The cleaner the isolation — same offer, same price, same sources — the more clearly you will see the link. If raising the share reaching the offer raises sales, you have confirmed the predictor on your own data, which is far more useful than any benchmark.</p>`,
    },
    {
      h2: `A worked example of the prediction`,
      html: `<p>The figures here are <strong>hypothetical and illustrative</strong>, not VidaPulse data or a promise of results.</p><p class="kb-example">Suppose 1,000 people press play, 30% reach the offer at the four-minute mark, and 10% of those who hear it buy at 120 dollars — that is 30 sales, or 3,600 dollars. Now suppose your only change is tightening the pre-offer section so 45% reach the offer, with the same traffic, same offer, and same 10% close rate. The model predicts 45 sales, or 5,400 dollars. Retention told you, before the sales came in, that revenue should rise by roughly half — because half again as many people now hear the pitch.</p><p>If you run this for real and sales rise close to the prediction, retention is predicting sales in your funnel. If they do not, the gap points you at the offer or the page — which is itself a useful diagnosis.</p>`,
    },
  ],
  solve: `<p>VidaPulse lets you measure the predictor and test it against your real sales. You paste your existing video URL from wherever it already lives (YouTube, Amazon S3, Google Drive, Dropbox, OneDrive, Azure Blob, Loom, a Zoom recording, Vimeo, or a direct MP4 or HLS file), VidaPulse wraps it in an analytics player, and you embed one line of script or a script-free iframe on your page. No re-hosting, no re-uploading, and no personal data collected.</p><p>To use retention as a predictor of your sales:</p><ul class="kb-list"><li>Read the <strong>percentage of viewers who reach any point</strong> at your offer timestamp — the sharpest retention predictor of revenue.</li><li>Use the <strong>audience-retention curve</strong>, and on Pro the <strong>second-by-second engagement heatmap</strong>, to find and fix the section that limits how many reach the offer.</li><li>Connect retention to outcomes with <strong>conversion and CTA tracking</strong> (Pro), so you can test whether reach actually moves sales in your funnel.</li><li>Use <strong>source attribution</strong> and, on Pro, <strong>segmentation</strong> to check whether warmer traffic both reaches the offer more and converts better — confirming the chain end to end.</li></ul><p>Because both numbers live in the same player, you can watch retention to the offer and conversions together over time and see the correlation on your own data. Create a free VidaPulse account, wrap your own video, and find out how well your retention predicts your sales.</p>`,
  faq: [
    {
      q: `Which retention number predicts sales best?`,
      a: `The percentage of viewers who reach your offer. Almost nobody buys before they hear the offer, so the count who arrive at the ask is the count who could convert. That metric tracks sales more tightly than total views or retention to the final second, because it measures the audience your offer can actually work on.`,
    },
    {
      q: `Does high retention guarantee high sales?`,
      a: `No. Retention is a leading indicator, not a guarantee. It controls how many people hear your offer, but the offer, price, and the page after the click still have to close. Two videos with the same share reaching the offer can sell differently. Retention sets the size of the audience your offer works on; it does not do the selling.`,
    },
    {
      q: `How do I confirm the link in my own funnel?`,
      a: `Track the percentage reaching your offer and your sales over the same periods and the same traffic, then change one thing — raise the share reaching the offer while holding the offer and traffic constant — and see whether sales follow. If they rise roughly in step, retention predicts sales for you. If not, the offer or the page is the limiting factor.`,
    },
  ],
};
