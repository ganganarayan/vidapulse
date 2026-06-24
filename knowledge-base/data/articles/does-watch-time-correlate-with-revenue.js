'use strict';

module.exports = {
  metaTitle: `Does watch time correlate with revenue? | VidaPulse`,
  metaDescription: `Average watch time is a rough proxy for revenue, not a reliable one. What matters more is the % of viewers who reach your offer. When it misleads, what to use.`,
  answer: `Loosely, yes — average watch time tends to rise and fall with revenue, because more watching usually means more people hearing the pitch. But it is a rough proxy, not a reliable one. What actually drives sales is the percentage of viewers who reach your offer, and watch time can move in ways that have nothing to do with that. So treat watch time as a weak signal and track the share reaching the offer instead, because that is the number sitting directly on the path to revenue.`,
  sections: [
    {
      h2: `Why watch time correlates at all`,
      html: `<p>There is a real reason watch time and revenue tend to move together. Selling with video is a chain: people press play, some keep watching until they reach the offer, some of those convert. Longer average watch time usually means viewers are getting deeper into the video, and getting deeper means more of them reach the offer. Since the offer is what asks for the sale, deeper watching often does translate into more sales.</p><p>So the correlation is not fake — it is just indirect. Watch time is standing in for the thing that really matters, which is how many people reach the offer. When the proxy and the real metric move together, watch time looks like a good predictor. The problem is that they do not always move together, and that is where watch time starts to mislead.</p>`,
    },
    {
      h2: `Where watch time misleads`,
      html: `<p>Average watch time is an average, and averages hide the distribution that actually decides revenue. Several situations break the link between watch time and sales:</p><ul class="kb-list"><li><strong>The offer comes early.</strong> If your ask is at two minutes, viewers who stay only that long are exactly the ones who could buy — but they drag your average watch time <em>down</em>. A "low" watch time can sit on top of healthy offer-reaching.</li><li><strong>A few long viewers inflate the average.</strong> A handful of people who leave the video playing, or rewatch, can pull average watch time up while most viewers still bail before the offer. The average looks fine; the offer is starved.</li><li><strong>Watching past the offer.</strong> Time spent after the ask adds to watch time but adds nothing to the pool that can convert — those viewers already heard the offer.</li><li><strong>Different video lengths.</strong> Watch time in raw minutes is not comparable across videos of different lengths, so it cannot rank funnels against each other.</li></ul><p>In each case watch time moves without sales moving, or stays flat while sales change. That is what makes it a rough proxy: it sometimes points the right way, but it cannot tell you <em>why</em>, and it can quietly point the wrong way.</p>`,
    },
    {
      h2: `What to track instead: reaching the offer`,
      html: `<p>The metric that removes the ambiguity is the <strong>percentage of viewers who reach your offer</strong>. It goes straight to the link in the chain that matters — how many people hear the ask — without being distorted by long tails, early offers, or post-offer viewing. Almost nobody buys before they hear the offer, so the share who reach it is the share who could convert, full stop.</p><p>Where watch time gives you a single blurry average, the share reaching the offer gives you a number you can act on. If it is low, you know the leak is before the offer. If it is high but sales are weak, you know the problem is the offer or the page, not retention. Watch time can rarely make that distinction; reaching-the-offer makes it cleanly.</p>`,
    },
    {
      h2: `A worked example of the mismatch`,
      html: `<p>These figures are <strong>hypothetical and illustrative</strong>, not VidaPulse data or a promise of results.</p><p class="kb-example">Suppose two versions of your VSL both report an average watch time of three minutes on 1,000 plays. Version A holds a steady audience and 40% are still watching at the offer, so 400 reach the ask. Version B has a strong opening that everyone watches, then a cliff right before the offer, so only 20% reach the ask — but a few viewers who left the tab open keep the average at three minutes too. Same watch time, but Version A sends twice as many people to the offer. At the same close rate and price, Version A sells about twice as much.</p><p>Watch time said the two videos were identical. The share reaching the offer said one was twice the other. That gap is exactly why watch time is the wrong number to optimize against on its own.</p>`,
    },
    {
      h2: `Use watch time as a glance, not a verdict`,
      html: `<p>None of this means watch time is useless. As a quick health glance it is fine: a sudden collapse in average watch time is worth investigating, and a steady rise after an edit is mild reassurance. The mistake is treating it as a verdict on revenue or optimizing it directly. You can lift watch time without lifting sales — for instance by padding the front of the video — and feel like you are winning while the offer stays starved.</p><p>The discipline is simple: use watch time as a coarse signal, then go to the retention curve and the percentage reaching the offer for the decision. Optimize the number that sits on the path to revenue, and let watch time be a side glance.</p>`,
    },
  ],
  solve: `<p>VidaPulse shows you watch time alongside the metric that actually predicts revenue, so you do not have to rely on the rough proxy. You paste your existing video URL from wherever it already lives (YouTube, Amazon S3, Google Drive, Dropbox, OneDrive, Azure Blob, Loom, a Zoom recording, Vimeo, or a direct MP4 or HLS file), VidaPulse wraps it in an analytics player, and you embed one line of script or a script-free iframe on your page. No re-hosting, no re-uploading, and no personal data collected.</p><p>To track what drives revenue instead of just watch time:</p><ul class="kb-list"><li>See <strong>average watch time</strong> as a quick health glance, alongside <strong>play rate</strong> and <strong>total and unique viewers</strong>.</li><li>Read the <strong>percentage of viewers who reach any point</strong> at your offer timestamp — the number that sits directly on the path to revenue.</li><li>Use the <strong>audience-retention curve</strong>, and on Pro the <strong>second-by-second engagement heatmap</strong>, to see the distribution a watch-time average hides and find the pre-offer drop.</li><li>Connect reach to outcomes with <strong>conversion and CTA tracking</strong> (Pro) so you can tell when high watch time is masking a starved offer.</li></ul><p>Because all of these live in the same player, you can see exactly when watch time is misleading you and switch to the metric that matters. Create a free VidaPulse account, wrap your own video, and find out whether your watch time is hiding a leak before your offer.</p>`,
  faq: [
    {
      q: `Is average watch time a good predictor of revenue?`,
      a: `It is a rough proxy, not a reliable one. Watch time tends to rise with revenue because deeper viewing usually means more people reach the offer, but it is an average that hides the distribution. Long-tail viewers, an early offer, or viewing past the offer can all move watch time without moving sales. The percentage reaching the offer predicts revenue far more directly.`,
    },
    {
      q: `When does watch time mislead?`,
      a: `When the average and the share reaching the offer move apart. A few viewers leaving a tab open can inflate average watch time while most people bail before the offer. An early offer can make watch time look low while offer-reaching is healthy. And time spent after the offer adds to watch time but nothing to the pool that can convert.`,
    },
    {
      q: `What should I track instead of watch time?`,
      a: `The percentage of viewers who reach your offer, read from the retention curve at your offer timestamp. Almost nobody buys before they hear the offer, so that share is the audience your offer can work on. Use watch time as a coarse health glance, but make decisions from the reaching-the-offer number and the shape of the retention curve.`,
    },
  ],
};
