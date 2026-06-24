'use strict';

module.exports = {
  metaTitle: `Which part of my VSL loses the most revenue? | VidaPulse`,
  metaDescription: `The steepest drop before your offer usually loses the most revenue. Find it with the retention curve and heatmap, then weight each drop by offer proximity.`,
  answer: `The part of your VSL that loses the most revenue is usually the steepest drop that happens before your offer. A drop after the offer costs you nothing in sales; a drop just before it costs you the viewers who came the furthest and were closest to buying. To find it, read the retention curve for the biggest cliffs, confirm the exact moment with a heatmap, and weight each drop by how close it sits to the offer. The closest, steepest pre-offer drop is your most expensive section.`,
  sections: [
    {
      h2: `Not all drops cost the same`,
      html: `<p>It is tempting to treat your biggest drop as your biggest problem, but size alone is misleading. A drop only costs you revenue if it removes viewers who would otherwise have reached the offer. So the question is never just "where do most people leave," it is "where do most <em>future buyers</em> leave."</p>
<p>That means two drops of the same height can have very different price tags depending on where they sit. A cliff in the opening seconds loses many viewers, but most of them were never going to reach the back-third pitch anyway. A cliff right before the offer loses fewer people in raw numbers, but every one of them was one step from hearing the ask. The closer to the offer, the more each lost viewer is worth.</p>
<p>This is why "which part loses the most revenue" is a different question from "which part loses the most viewers." You have to weight the loss by proximity to the sale.</p>`,
    },
    {
      h2: `The steepest drop before the offer is usually the costliest`,
      html: `<p>Combine the two factors and a pattern emerges. The section that usually loses the most revenue is the steepest drop that still sits in front of your offer. It is steep enough to remove a meaningful share of the audience, and late enough that those viewers had already invested time and were close to the ask.</p>
<p>A drop after the offer is, in revenue terms, free. Those viewers already heard the pitch; whether they keep watching afterward does not change whether they buy. So you can ignore the back of the curve entirely when hunting for the costliest section. Everything that matters happens between the first play and the moment you ask for the sale.</p>
<p class="kb-example">Hypothetical illustration, not VidaPulse data. Suppose two drops each lose 100 viewers. The first is at second ten, the second is one minute before the offer. The early 100 mostly would have left anyway; few were future buyers. The late 100 were one step from the pitch. At your close rate among people who reach the offer, the late drop costs far more sales even though both lost the same number of viewers. That is why proximity, not just size, sets the price.</p>`,
    },
    {
      h2: `How to find it: retention curve plus heatmap`,
      html: `<p>Finding the costliest section is a two-step read, from broad to precise.</p>
<ol><li><strong>Scan the retention curve for cliffs.</strong> The curve shows the share of viewers still watching at each second. Steep vertical drops are where you lose people in numbers. List every cliff that happens before your offer.</li>
<li><strong>Confirm the exact moment with a heatmap.</strong> A second-by-second engagement heatmap pins each cliff to a specific line, scene, or transition. This is what tells you the real cause, a slow stretch, a confusing claim, a tangent, rather than just the timestamp.</li>
<li><strong>Map drops to the script.</strong> Line up each pre-offer cliff with what is being said or shown at that second, so the fix targets the actual moment viewers reject, not a guess about it.</li></ol>
<p>The curve tells you where; the heatmap tells you exactly where and hints at why. Together they turn "the video underperforms" into a short, ordered list of specific moments you can repair.</p>`,
    },
    {
      h2: `Weight each drop by how close it is to the offer`,
      html: `<p>Now rank the list. For each pre-offer drop, estimate two things: how many viewers it removes, and how close those viewers were to the offer. The drop with the worst combination, large and late, is the one to fix first.</p>
<ul class="kb-list"><li><strong>Size.</strong> How steep is the cliff? Bigger drops remove more potential buyers.</li>
<li><strong>Proximity.</strong> How close to the offer does it happen? The later it sits, the more invested and sale-ready the viewers it loses.</li>
<li><strong>The product of the two.</strong> A medium drop right before the offer often outranks a huge drop in the first ten seconds, because the late viewers were worth far more.</li></ul>
<p>Fix the highest-ranked drop first, re-measure, then move to the next. You are not trying to flatten the whole curve; you are recovering the most revenue per fix by going after the large, late drops before the small, early ones. That ordering is what makes the work pay off fastest.</p>`,
    },
  ],
  solve: `<p>VidaPulse makes the costliest section findable instead of theoretical. You paste your existing video URL from wherever it already lives (YouTube, Amazon S3, Google Drive, Dropbox, OneDrive, Azure Blob, Loom, a Zoom recording, Vimeo, or a direct MP4 or HLS link), VidaPulse wraps it in an analytics player, and you embed it with one line of script or a script-free iframe. There is no re-hosting; your VSL keeps its URL.</p>
<p>From there you can locate and rank the drops that lose the most revenue:</p>
<ul class="kb-list"><li>The <strong>audience-retention curve</strong> shows every cliff, so you can list the steep drops that happen before your offer.</li>
<li>The <strong>second-by-second engagement heatmap</strong> (Pro) pins each cliff to the exact moment, so you can map it to the line or scene that causes it.</li>
<li>The <strong>percentage of viewers who reach any point</strong> lets you measure how many make it to your offer and how proximity to the pitch changes the cost of each drop.</li>
<li><strong>Conversion and CTA tracking</strong> (Pro) ties reach to action, so you can estimate, at your own close rate, what each pre-offer drop is costing in sales.</li></ul>
<p>No personal data is collected. To start, create a free VidaPulse account, wrap your own VSL, and find the steep pre-offer drop that is quietly costing you the most revenue.</p>`,
  faq: [
    {
      q: `Which part of a VSL usually loses the most revenue?`,
      a: `Usually the steepest drop that happens just before the offer. It removes a meaningful share of viewers, and those viewers had already invested time and were close to hearing the pitch, so each one is worth more than a viewer lost in the opening seconds. Drops after the offer cost nothing in sales, so the costliest section is almost always a large, late, pre-offer drop.`,
    },
    {
      q: `Isn't my biggest drop my biggest problem?`,
      a: `Not necessarily. A drop only costs revenue if it removes viewers who would have reached the offer. A huge drop in the first ten seconds mostly loses people who were never going to reach a back-third pitch, while a medium drop right before the offer loses sale-ready viewers. Weight each drop by both its size and how close it sits to the offer.`,
    },
    {
      q: `How do I find the exact moment people leave?`,
      a: `Read the retention curve to spot the steep cliffs, then confirm the exact second with a second-by-second heatmap and line it up against your script. The curve tells you roughly where, the heatmap tells you precisely where and hints at why, and the script tells you what to fix. Together they turn a vague underperformance into a specific moment you can repair.`,
    },
  ],
};
