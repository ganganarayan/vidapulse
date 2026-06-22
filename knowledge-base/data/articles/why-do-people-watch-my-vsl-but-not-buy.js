'use strict';

module.exports = {
  metaTitle: `Why do people watch my VSL but not buy? | VidaPulse`,
  metaDescription: `People watch your VSL but don't buy for two reasons: they leave before the offer, or reach it and aren't convinced. Retention and CTA data tell them apart.`,
  answer: `People watch your VSL but don't buy for one of two reasons, and they need opposite fixes. Either they don't actually watch to the offer — they leave earlier than you think, so they never hear the ask — or they do reach it and aren't convinced, often because the offer or CTA is weak or comes too late. The mistake is treating "watched" as one thing. Use your audience-retention curve to see how many truly reach the offer, then CTA data to see how many who reach it act. That separates a reach problem from a persuasion problem.`,
  sections: [
    {
      h2: `"Watched" is two different things`,
      html: `<p>The phrase "people watch my VSL but don't buy" hides an assumption: that the people who pressed play actually saw the whole thing. They usually didn't. View counts and play rate tell you how many <em>started</em>, not how many stayed — so a high view count can sit on top of an audience that mostly left in the first minute.</p>
<p>That assumption sends you to the wrong fix. If you believe everyone watched and nobody bought, you rewrite the offer. But if most viewers left before the offer, the offer was never the problem — and you just spent effort on the part that was working. The first job is to find out how many people genuinely reach the ask.</p>`,
    },
    {
      h2: `Reason one: they don't reach the offer`,
      html: `<p>The most common reason is the simplest: they leave before the offer. The audience-retention curve, read at the second your offer begins, gives you the <strong>percentage of viewers who reach the ask</strong> — and that number is almost always lower than founders expect. If only a small slice reaches the offer, low sales are the obvious consequence, not a mystery.</p>
<p>When this is the cause, you'll see a drop in the curve before the offer. The fix is upstream of the offer entirely: find the steep cliff ahead of the ask and tighten or rewrite that section so more viewers survive to hear it. A second-by-second engagement heatmap (a Pro feature) pins the exact line where they bail.</p>
<p class="kb-example">Hypothetical illustration: 1,000 people start the VSL and the curve reads 14% at your offer. Only about 140 ever hear the ask. The "they watch but don't buy" feeling is really "most of them never reach the part that sells."</p>`,
    },
    {
      h2: `Reason two: they reach it but aren't convinced`,
      html: `<p>The second reason is the one most people assume from the start: viewers do reach the offer, but it doesn't move them. Maybe the offer is weak, the value wasn't built, the price feels wrong for what came before, or the CTA is buried or vague. Here the problem genuinely is the ask — but you can only know that once you've confirmed people actually reach it.</p>
<p>The offer also arriving too late counts here in a particular way: even when people reach it, an ask that comes after too much runtime meets a thinned, impatient audience. The lever is to surface the offer sooner and make the CTA unmistakable, then continue building the case for those who want more.</p>`,
    },
    {
      h2: `Separate the two with retention plus CTA data`,
      html: `<p>The whole diagnosis comes down to telling these two reasons apart, and two numbers do it cleanly:</p>
<ol><li><strong>Reach-to-offer:</strong> the percentage of viewers still watching when your offer begins, from the retention curve. This tells you how many can possibly buy.</li>
<li><strong>CTA action among those who reach it:</strong> conversion and CTA tracking that shows how many of the viewers who hear the ask actually click or act on it.</li></ol>
<p>Now the verdict is clear. <strong>Low reach-to-offer</strong> means the problem is upstream — fix the run-up so more people reach the ask. <strong>Healthy reach but few acting on the CTA</strong> means the offer or CTA is the issue — fix the ask itself. Without both numbers you are guessing which one to change, and half your edits land on the wrong problem.</p>`,
    },
    {
      h2: `Fix the right problem, then re-measure`,
      html: `<p>Once the data names the cause, act on one thing at a time:</p>
<ol><li><strong>If reach-to-offer is low,</strong> find the steep drop before the offer and tighten that section. Re-check whether more viewers now reach the ask.</li>
<li><strong>If reach is healthy but CTA action is low,</strong> rework the offer, the price framing, or the clarity and timing of the CTA. Re-check whether more of the same audience now acts.</li>
<li><strong>Change one variable per round</strong> so the data can tell you whether it worked.</li></ol>
<p>The reason people watch but don't buy is rarely a mystery once you stop treating "watched" as a single number. Reach and persuasion are different problems, and the data tells you which one is yours.</p>`,
    },
  ],
  solve: `<p>VidaPulse separates the two reasons for you on your own page. You paste any video URL from wherever it already lives (YouTube, Amazon S3, Google Drive, Dropbox, OneDrive, Azure Blob, Loom, a Zoom recording, Vimeo, or a direct MP4/HLS), VidaPulse wraps it in an analytics player, and you embed it with one line of script or a script-free iframe. No re-hosting — your video stays where it is.</p>
<p>Then "watched but didn't buy" splits into two answerable questions:</p>
<ul class="kb-list"><li>The <strong>audience-retention curve</strong> and the <strong>percentage of viewers who reach any point</strong> tell you how many truly reach your offer — your reach-to-offer number.</li>
<li><strong>Conversion and CTA tracking</strong> (Pro) tells you how many of the viewers who reach the offer act on it, isolating persuasion from reach.</li>
<li>The <strong>second-by-second engagement heatmap</strong> (Pro) pins the exact line in the run-up where viewers leave before the ask.</li>
<li><strong>Viewer-level history</strong> (Pro) lets you see how individual viewers move through the VSL.</li></ul>
<p>Because the analytics live in the embedded player, you measure all of this on the actual sales page where your VSL runs. No personal data is collected. Create a free VidaPulse account, wrap your own VSL, and read reach-to-offer next to CTA action to find out which problem is costing you sales.</p>`,
  faq: [
    {
      q: `Do people who watch my VSL really not reach the offer?`,
      a: `Far more often than founders expect. View counts and play rate only show how many started — not how many stayed. Read your audience-retention curve at the second your offer begins to get the true percentage who reach the ask. It is usually much lower than the view count suggests, which alone can explain low sales.`,
    },
    {
      q: `How do I know if my offer is the problem or my retention?`,
      a: `Compare two numbers. Reach-to-offer is the percentage of viewers still watching when the offer begins. CTA action is how many of those viewers act on the ask. Low reach-to-offer means the problem is upstream — fix the run-up. Healthy reach but low CTA action means the offer or CTA itself needs work. Together they tell the two apart.`,
    },
    {
      q: `Should I shorten my VSL to fix this?`,
      a: `Only if the data points to length. If reach-to-offer is low and the offer arrives after a lot of runtime, surfacing it sooner often helps more viewers hear the ask. But if a single steep cliff is dropping people at one spot, the fix is that section, not overall length. Read the curve's shape first, then decide.`,
    },
  ],
};
