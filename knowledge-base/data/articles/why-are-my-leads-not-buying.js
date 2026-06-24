'use strict';

module.exports = {
  metaTitle: `Why are my leads not buying? | VidaPulse`,
  metaDescription: `Often leads do not buy because they never reach the offer in your video, or it lands too late. Separate "didn't reach the pitch" from "heard it and passed."`,
  answer: `Most of the time, leads are not buying for one of two reasons that look identical from the outside: they never reached the offer in your video, or they reached it and were not convinced. The honest first step is to tell those apart, because the fix is opposite. Use the retention curve to see how many actually reach the pitch, and CTA data to see how many act once they do. Until you separate "didn't hear it" from "heard it and passed," you are guessing.`,
  sections: [
    {
      h2: `The two reasons leads do not buy`,
      html: `<p>When a lead does not buy, it feels like a single failure, but it is almost always one of two very different ones. Either the lead left before your offer ever appeared, or the lead stayed, heard the pitch, and decided no. These are not the same problem, and treating them as one is why most fixes miss.</p>
<p>If they never reached the offer, your message was never tested; the sale failed before the pitch began. If they reached it and passed, the message was tested and lost. One is a retention and structure problem. The other is an offer and persuasion problem. You cannot fix the right one until you know which you have.</p>
<p>From a sales dashboard, both show up the same way: traffic that "didn't convert." That sameness is the trap. The answer lives inside the video, in how far people actually watched.</p>`,
    },
    {
      h2: `Most leads never reach the offer`,
      html: `<p>This is the more common and more expensive reason, and it is the one most sellers underestimate. In a typical VSL or demo, the offer sits in the back third, and the audience drains steadily before it. If only a small share of viewers are still watching when you ask for the sale, then most of your "leads who didn't buy" never heard you ask.</p>
<p>That changes everything about the fix. Rewriting your offer to be more persuasive does nothing for people who left ten minutes earlier. The real work is getting more viewers to the offer in the first place: finding the steep drops in front of the pitch and repairing the biggest one.</p>
<p class="kb-example">Hypothetical illustration, not VidaPulse data. Suppose 1,000 people press play but only 200 are still watching at the offer. If 20 of those 200 buy, you have an offer that converts one in ten of the people who hear it, hidden behind a video that loses 800 before the ask. The problem reads as "leads not buying." It is really "leads not reaching the pitch."</p>`,
    },
    {
      h2: `Sometimes the offer or CTA is weak or too late`,
      html: `<p>The other reason is the one most people assume first: viewers reach the offer and still do not act. If a healthy share of viewers is present at the pitch and the click rate on your call to action is still low, the leak is in the offer or the ask, not in retention.</p>
<ul class="kb-list"><li><strong>The offer is unclear.</strong> If viewers cannot tell exactly what they get, who it is for, and why it is worth the price, the ambiguity reads as risk and they pass.</li>
<li><strong>The call to action is vague or split.</strong> Competing or fuzzy next steps lose the click. One specific, named action converts better.</li>
<li><strong>The offer arrives too late.</strong> If viewers drop off in the minutes just before the pitch, the build-up may be too long, so the people most likely to buy leave before you ever ask.</li></ul>
<p>The tell for "too late" is a steep drop right before the offer paired with decent earlier retention. People stayed for the value, then ran out of patience before the ask. Moving the offer earlier, or tightening the run-up to it, often recovers exactly those buyers.</p>`,
    },
    {
      h2: `Separate "didn't reach the pitch" from "heard it and passed"`,
      html: `<p>This is the whole diagnosis, and it takes two numbers you can read directly. The first is the percentage of viewers who reach the offer. The second is the percentage of those who then act on the call to action.</p>
<ol><li><strong>Read the percentage who reach the offer.</strong> Low means most leads leave before the pitch. Your problem is retention and structure, so fix the biggest pre-offer drop first.</li>
<li><strong>Read the CTA action rate among those who reach it.</strong> If a healthy share reaches the offer but few act, your problem is the offer or the call to action, so work on clarity and the ask.</li>
<li><strong>Confirm with the curve and heatmap.</strong> Use the retention curve, and a second-by-second heatmap, to see whether the loss is a slow bleed or a cliff right before the price.</li></ol>
<p>Once you know which of the two you have, the fix is obvious instead of a guess. Low offer-reach means get more people to the pitch. Healthy offer-reach with low action means sharpen the pitch. The mistake is spending weeks rewriting an offer that most leads never hear, or buying more traffic for a pitch that loses everyone who does.</p>`,
    },
  ],
  solve: `<p>VidaPulse exists to make this diagnosis a reading instead of a guess. You paste your existing video URL from wherever it already lives (YouTube, Amazon S3, Google Drive, Dropbox, OneDrive, Azure Blob, Loom, a Zoom recording, Vimeo, or a direct MP4 or HLS link), VidaPulse wraps it in an analytics player, and you embed it with one line of script or a script-free iframe. There is no re-hosting; your video stays where it is.</p>
<p>From there you can tell the two reasons apart on your own data:</p>
<ul class="kb-list"><li>The <strong>percentage of viewers who reach any point</strong> tells you how many leads actually reach your offer, which separates "didn't hear it" from "heard it and passed."</li>
<li>The <strong>audience-retention curve</strong> shows whether you are bleeding viewers before the pitch or losing them in a cliff right before the price.</li>
<li>The <strong>second-by-second engagement heatmap</strong> (Pro) pins the drop to the exact moment so you fix the real cause.</li>
<li><strong>Conversion and CTA tracking</strong> (Pro) shows how many viewers who reach the offer actually act, so you can read the action rate that diagnoses a weak offer.</li>
<li><strong>Viewer-level history</strong> (Pro) lets you see how individual leads moved through the video, so a "didn't buy" lead is no longer a black box.</li></ul>
<p>No personal data is collected. To start, create a free VidaPulse account, wrap your own video, and find out whether your leads are leaving before the offer or passing on it.</p>`,
  faq: [
    {
      q: `Why are my leads not buying even though I get plenty of them?`,
      a: `Usually because most of them never reach your offer. In a typical VSL or demo the pitch sits near the end and the audience drains before it, so a lot of "leads who didn't buy" never heard you ask. Read the percentage of viewers who reach the offer first. If it is low, the problem is retention, not your offer.`,
    },
    {
      q: `How do I know if it's my offer or my video losing the sale?`,
      a: `Compare two numbers. If a low percentage of viewers reaches the offer, the video is losing them before the pitch, so fix retention. If a healthy percentage reaches the offer but few act on the call to action, the offer or the ask is the leak, so work on clarity and the CTA. The two numbers point you to the right fix.`,
    },
    {
      q: `Could my offer be arriving too late in the video?`,
      a: `Yes, and it is common. If you see decent retention through the middle but a steep drop in the minutes right before the price, viewers stayed for the value and then left before the ask. Moving the offer earlier, or tightening the run-up to it, often recovers exactly the people who were most likely to buy.`,
    },
  ],
};
