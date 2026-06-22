'use strict';

module.exports = {
  metaTitle: `Why are my ads getting clicks but no sales? | VidaPulse`,
  metaDescription: `If your ads get clicks but no sales, the click works — the sale is lost on the landing video after the click. Check the video's retention and reach-to-offer.`,
  answer: `If your ads are getting clicks but no sales, the clicks are doing their job — they are paying to send interested people to your page. The sale is usually lost after the click, on the landing video or VSL, where viewers drop off before they ever reach the offer. This is not an ad-platform problem; the targeting and creative got the click. The real question is what happens on the video after people arrive. Check the video's audience-retention curve and the percentage of viewers reaching your offer to see where the drop-off actually is.`,
  sections: [
    {
      h2: `The click already worked`,
      html: `<p>Start by giving the ad credit for what it did. A click means your targeting reached someone relevant, your creative earned their interest, and they chose to come to your page. That is the entire job of an ad: buy attention and deliver it to your offer. When you have clicks, that part of the machine is running.</p>
<p>So "clicks but no sales" is not a sign the ad failed. It is a sign that something <em>after</em> the click is failing to convert the attention you already paid for. Spending more time tuning audiences and headlines when the click rate is fine is optimizing the part that already works while the real leak sits one step downstream.</p>`,
    },
    {
      h2: `Where the sale is actually lost`,
      html: `<p>After the click, most paid traffic lands on a page built around a video — a VSL, a demo, or a product video that carries the argument and leads to the offer. That video is where the sale is won or lost. If viewers arrive and then leave the video before the offer, the click was paid for and wasted, and no sale was ever possible.</p>
<p>This is the part founders most often can't see. The ad dashboard shows clicks and cost; it goes dark the moment the viewer reaches your page. What happens inside the video — how far people watch, whether they reach the offer — is invisible to the ad platform, even though it decides everything about whether the click turns into money.</p>`,
    },
    {
      h2: `This is not an ad-platform problem`,
      html: `<p>It is worth being precise about where to look, because the instinct is to blame the ads. But the symptom — clicks arriving, sales not — points away from the ad platform, not toward it. The click is the platform's deliverable, and you are getting it. Tweaking bids, audiences, or creative changes how many clicks you get and what they cost; it does not change what happens once a viewer is watching your video.</p>
<p>The diagnosis lives on the page, in the video. The most useful thing you can do with "clicks but no sales" is stop staring at the ad metrics and start reading how the landing video performs once people arrive on it.</p>`,
    },
    {
      h2: `Check the video's retention and reach-to-offer`,
      html: `<p>Two readings on the landing video tell you where the post-click drop is:</p>
<ol><li><strong>The audience-retention curve.</strong> It plots the percentage of viewers still watching at each second. Read it for steep cliffs — a sharp fall in the first seconds means the video doesn't match what the ad promised; a drop later means the body or run-up loses people.</li>
<li><strong>The percentage of viewers reaching your offer.</strong> Read the curve at the second your offer begins. This is the share of clicks that actually reach the ask — and it is usually far lower than founders expect.</li></ol>
<p>A common pattern is an early cliff: ad traffic arrives expecting one thing, the video opens with something else, and viewers leave in the first seconds. UTM and source attribution let you check this per campaign — if one ad sends clicks that drop off instantly, the mismatch is between that ad and the video.</p>
<p class="kb-example">Hypothetical illustration: an ad sends 1,000 clicks, but the retention curve reads 9% at your offer. Only about 90 of those paid clicks ever reach the ask — so the "no sales" problem is really a "no one reaches the offer" problem, and the fix is in the video, not the ad.</p>`,
    },
    {
      h2: `Fix the video, not the ad`,
      html: `<p>Once you can see the drop, the fix follows the data:</p>
<ol><li><strong>If the cliff is early,</strong> align the video's opening with the ad that brought viewers in, so the promise matches the payoff.</li>
<li><strong>If the drop is before the offer,</strong> tighten the run-up so more viewers reach the ask.</li>
<li><strong>If many reach the offer but few buy,</strong> the problem is the offer or CTA, not retention — and conversion tracking will show that the clicks are landing on the ask and not acting.</li>
<li><strong>Change one thing, then re-measure</strong> reach-to-offer and conversions before touching the ads again.</li></ol>
<p>The clicks already work. Spend your effort where the sale is actually being lost.</p>`,
    },
  ],
  solve: `<p>VidaPulse shows you what happens to your paid clicks after they land on the video. You paste any video URL from wherever it already lives (YouTube, Amazon S3, Google Drive, Dropbox, OneDrive, Azure Blob, Loom, a Zoom recording, Vimeo, or a direct MP4/HLS), VidaPulse wraps it in an analytics player, and you embed it with one line of script or a script-free iframe on your landing page. No re-hosting — your video stays where it is.</p>
<p>Then the post-click drop becomes visible:</p>
<ul class="kb-list"><li>The <strong>audience-retention curve</strong> shows where ad traffic leaves the video — an early cliff for an ad-to-video mismatch, or a drop before the offer.</li>
<li>The <strong>percentage of viewers who reach any point</strong> tells you how many of your paid clicks actually reach the offer.</li>
<li><strong>UTM and source attribution</strong> let you see which campaign or channel sends clicks that drop off fastest.</li>
<li><strong>Conversion and CTA tracking</strong> (Pro) tells you whether the viewers who do reach the offer act on it — separating a retention problem from an offer problem.</li></ul>
<p>Because the analytics live in the embedded player, you measure all of this on the actual landing page your ads point to. No personal data is collected. Create a free VidaPulse account, wrap your landing video, and read reach-to-offer to find where your paid clicks are really being lost.</p>`,
  faq: [
    {
      q: `If I have clicks but no sales, should I change my ad targeting?`,
      a: `Usually not first. Clicks mean the targeting and creative are working — the platform delivered interested people to your page. The sale is most often lost after the click, on the landing video, where viewers drop off before the offer. Read the video's retention and reach-to-offer before touching the ads, so you fix where the leak actually is.`,
    },
    {
      q: `How do I know if the problem is the ad or the video?`,
      a: `Look at the video's retention curve and the percentage reaching your offer, broken out by campaign with UTM and source attribution. If a campaign's clicks drop off in the first seconds, that ad and the video promise different things. If clicks watch well but few reach the offer, the problem is inside the video. The ad platform can't show this — it goes dark after the click.`,
    },
    {
      q: `Why can't my ad dashboard tell me where sales are lost?`,
      a: `The ad dashboard measures the click and its cost, then loses sight of the viewer the moment they reach your page. What happens inside the landing video — how far people watch, whether they reach the offer — is invisible to it. To see the post-click drop you need analytics on the embedded video itself, on the page the ad points to.`,
    },
  ],
};
