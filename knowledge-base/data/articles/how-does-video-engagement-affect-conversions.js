'use strict';

module.exports = {
  metaTitle: `How does video engagement affect conversions? | VidaPulse`,
  metaDescription: `Engagement is upstream of conversions: reaching your offer and the CTA make a sale possible. Measure reach-to-offer and CTA clicks to see the link.`,
  answer: `Video engagement affects conversions because engagement is upstream of the sale. Conversions can only happen after a viewer reaches your offer and stays through the call to action, so the share of viewers who get that far sets the ceiling on how many can convert. Measure two things to see the link: reach-to-offer — the percentage of viewers still watching when your offer begins — and CTA clicks among those who reach it. When reach-to-offer rises, conversions tend to follow, because more of your audience is in front of the ask.`,
  sections: [
    {
      h2: `Engagement is upstream of conversion`,
      html: `<p>It is tempting to treat engagement and conversion as separate scores, but they sit in sequence. A conversion requires a viewer to reach the offer, hear the ask, and act. Engagement — how much of the video a viewer actually watches — decides whether the first two of those even happen. So engagement is not a parallel metric to conversion; it is a precondition for it.</p>
<p>This is why a strong offer can still convert poorly. If most viewers disengage before the offer, the offer never gets its chance, and the conversion rate reflects the small slice who made it rather than the quality of the ask. To understand conversions, you have to look one step upstream at engagement.</p>`,
    },
    {
      h2: `The two numbers that connect them`,
      html: `<p>Two measurements turn this relationship from theory into something you can watch move:</p>
<ul class="kb-list"><li><strong>Reach-to-offer.</strong> The percentage of viewers who are still watching when your offer or call to action begins, read from the audience-retention curve at that exact timestamp. This is the size of the audience that can possibly convert.</li>
<li><strong>CTA clicks among those who reach it.</strong> Of the viewers who reach the offer, how many act on the call to action. This is conversion tracking applied to the part of the video that does the selling.</li></ul>
<p>Together these split the funnel cleanly. Reach-to-offer tells you how many people get the chance to convert; CTA clicks tell you how persuasive the ask is for those who do. Looking at conversions without both numbers leaves you guessing which half is the problem.</p>`,
    },
    {
      h2: `Why this beats reading conversions alone`,
      html: `<p>A bare conversion rate hides its own cause. Say your video converts 2% of everyone who pressed play. That single number cannot tell you whether the offer is weak or whether almost nobody reached it. Both produce the same disappointing 2%, but they call for opposite fixes — rewrite the offer, or fix the retention before it.</p>
<p>Splitting the funnel resolves the ambiguity. If reach-to-offer is low, the engagement problem is upstream and the offer is being judged by too few people. If reach-to-offer is healthy but CTA clicks are low, the engagement is fine and the offer or CTA is what needs work. The engagement numbers are what let you read the conversion number correctly.</p>`,
    },
    {
      h2: `A worked example`,
      html: `<p class="kb-example">Hypothetical illustration: 1,000 viewers start your VSL. Reach-to-offer is 20%, so 200 hear the ask, and 10% of them click the CTA — about 20 conversions. You leave the offer untouched and instead fix the dragging section before it, lifting reach-to-offer to 40%. Now 400 hear the same ask, 10% click, and you get about 40 conversions. The offer never changed and the CTA never changed — you doubled conversions purely by raising engagement before the offer. That is engagement acting on conversion through reach.</p>
<p>The same logic runs the other way: if you raised reach-to-offer and conversions did not move, the CTA-click rate is your bottleneck, and the offer itself is where to look next.</p>`,
    },
    {
      h2: `How to use engagement to lift conversions`,
      html: `<p>Work the funnel in order so you always know which lever you are pulling:</p>
<ol><li><strong>Measure reach-to-offer.</strong> Read the retention curve at your offer timestamp. That is the ceiling on conversions for this video.</li>
<li><strong>Find the steep drop before the offer.</strong> Use the curve, and a second-by-second engagement heatmap (a Pro feature) to pin the exact second, then tighten that section to carry more viewers to the ask.</li>
<li><strong>Measure CTA clicks among those who reach it.</strong> This isolates how persuasive the offer is from how many people see it.</li>
<li><strong>Change one variable and re-measure both.</strong> Watch whether reach-to-offer and conversions move together.</li></ol>
<p>Engagement is the lever you can pull without rewriting the offer, and it is often the cheaper of the two to move.</p>`,
    },
  ],
  solve: `<p>VidaPulse measures the full chain from engagement to conversion on your own page. You paste any video URL from wherever it already lives (YouTube, Amazon S3, Google Drive, Dropbox, OneDrive, Azure Blob, Loom, a Zoom recording, Vimeo, or a direct MP4/HLS), VidaPulse wraps it in an analytics player, and you embed it with one line of script or a script-free iframe. No re-hosting — your video stays where it is.</p>
<p>The link becomes measurable end to end:</p>
<ul class="kb-list"><li>The <strong>audience-retention curve</strong> and the <strong>percentage of viewers who reach any point</strong> give you reach-to-offer — the audience that can convert.</li>
<li><strong>Conversion and CTA tracking</strong> (Pro) tells you how many of the viewers who reach the offer actually click the ask.</li>
<li>The <strong>second-by-second engagement heatmap</strong> (Pro) pins the exact moment engagement falls before the offer.</li>
<li><strong>Average watch time</strong> and <strong>play rate</strong> give context on overall engagement at the top of the funnel.</li></ul>
<p>Because the analytics live in the embedded player, you measure engagement and conversion together on the actual page where your video runs. No personal data is collected. Create a free VidaPulse account, wrap your own video, and read reach-to-offer next to CTA clicks to see exactly how engagement is shaping your conversions.</p>`,
  faq: [
    {
      q: `Does higher engagement always mean more conversions?`,
      a: `Higher engagement raises the ceiling on conversions by getting more viewers to the offer, but it only converts them if the offer and CTA hold up. Measure both: reach-to-offer for how many arrive, and CTA clicks for how many act. If reach rises and conversions do not, the offer is the bottleneck. Engagement is necessary for conversion, not a guarantee of it.`,
    },
    {
      q: `What two metrics show the engagement-to-conversion link?`,
      a: `Reach-to-offer and CTA clicks. Reach-to-offer is the percentage of viewers still watching when your offer begins — the size of the audience that can convert. CTA clicks among those viewers measure how persuasive the ask is. Together they split the funnel so you can tell an engagement problem from an offer problem.`,
    },
    {
      q: `My conversion rate is low — is that an engagement issue?`,
      a: `It might be, but a bare conversion rate cannot tell you. Read reach-to-offer first. If few viewers reach the offer, the issue is engagement upstream and the offer is being judged by too few people. If many reach it but few click the CTA, engagement is fine and the offer or CTA needs work. The engagement numbers tell the two apart.`,
    },
  ],
};
