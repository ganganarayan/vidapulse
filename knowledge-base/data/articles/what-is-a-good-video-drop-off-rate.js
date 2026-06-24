'use strict';

module.exports = {
  metaTitle: `What is a good video drop-off rate? | VidaPulse`,
  metaDescription: `Some drop-off is normal in every video — the goal is not zero. Watch for steep cliffs in your retention curve, not gentle decline. Here is how to judge yours.`,
  answer: `Drop-off rate is the share of viewers who leave a video, either overall or at a specific moment. There is no good universal number, and chasing zero drop-off is the wrong goal — every video loses viewers, and a steady, gentle decline is completely normal. What you actually want to watch for is the shape, not the total: steep cliffs where many viewers leave at one moment signal a specific problem you can fix, while a gradual slope usually just reflects natural attrition. As a rough rule of thumb, the early seconds always lose the most people; the cliffs in the middle are where the useful information lives. Read your own retention curve and hunt the steep drops, not a benchmark.`,
  sections: [
    {
      h2: `What drop-off rate measures`,
      html: `<p>Drop-off rate is the flip side of retention: where retention measures who is still watching, drop-off measures who has left. It can be read two ways. Overall, it is the share of viewers who started but did not finish. At a specific point, it is the share who leave during a particular stretch of the video — the steepness of the retention curve at that moment.</p>
<p>The second reading is the useful one. A single overall drop-off number tells you little, but drop-off measured moment by moment shows you exactly where your video is shedding viewers — and that is where decisions get made. The curve sloping downward is drop-off happening in real time, and its shape tells you whether the loss is normal or a problem.</p>`,
    },
    {
      h2: `Some drop-off is always normal`,
      html: `<p>The instinct to drive drop-off toward zero is a trap. No video holds everyone, and trying to is a waste of effort. Several kinds of loss are simply expected:</p>
<ul class="kb-list"><li><strong>The opening seconds.</strong> Every video loses its largest chunk of viewers right at the start, as people who clicked by accident or are not the right audience leave. A steep early drop is partly natural — though an unusually severe one can still flag a weak hook.</li>
<li><strong>Gradual decline across the runtime.</strong> As a video plays, some viewers leave for reasons that have nothing to do with the content — interruptions, time, second thoughts. A gentle downward slope is the signature of a healthy video, not a broken one.</li>
<li><strong>Length.</strong> Longer videos accumulate more total drop-off simply because there is more runtime to leave across. A higher overall drop-off on a long video is not worse than a lower one on a short clip.</li></ul>
<p>So a "good" drop-off rate is never zero, and rarely even low in absolute terms. The question is not how much you lose but where and how sharply you lose it.</p>`,
    },
    {
      h2: `Watch for cliffs, not gentle slopes`,
      html: `<p>The single most useful skill in reading drop-off is telling a cliff apart from a slope. A gentle, steady decline is natural attrition and usually not worth chasing. A steep cliff — where the curve falls sharply at one specific moment — means many viewers left at the same point for the same reason, and that reason is almost always something in the video you can change.</p>
<p>A cliff is a clue with a timestamp. It points to a specific line, a slow stretch, a confusing transition, or a moment that broke trust. Because so many people left at once, fixing whatever sits at that second can recover a meaningful share of your audience. A gentle slope offers no such target; there is no single moment to fix.</p>
<p class="kb-example">Hypothetical illustration: imagine two videos that both end with sixty percent of viewers gone. In the first, the curve slopes down smoothly the whole way — ordinary attrition, little to act on. In the second, the curve is nearly flat except for one near-vertical drop in the middle where half the audience vanishes at once. The totals match, but the second video is telling you exactly where its problem is, and the first is not.</p>`,
    },
    {
      h2: `How to judge your own drop-off`,
      html: `<p>Drop-off is best judged on your own curve, against itself, by following the shape rather than the total:</p>
<ol><li><strong>Read the retention curve, not a single number.</strong> The overall drop-off rate hides the moments that matter; the curve shows them.</li>
<li><strong>Find your steepest cliff after the opening seconds.</strong> That is your highest-value fix, because the most viewers are leaving there for a shared reason.</li>
<li><strong>Ignore the gentle slope.</strong> Trying to flatten natural attrition wastes effort that the cliff deserves.</li>
<li><strong>Re-measure after each edit,</strong> comparing only to your previous version on the same kind of traffic, so you know whether the cliff got shallower.</li></ol>
<p>Done this way, drop-off stops being a number to minimize and becomes a map of exactly where to work.</p>`,
    },
  ],
  solve: `<p>VidaPulse shows you drop-off the way it is actually useful — as the shape of your retention curve on your real video, not a single discouraging number. You paste any video URL from wherever it already lives (YouTube, Amazon S3, Google Drive, Dropbox, OneDrive, Azure Blob, Loom, a Zoom recording, Vimeo, or a direct MP4/HLS), VidaPulse wraps it in an analytics player, and you embed it with one line of script or a script-free iframe on WordPress, Webflow, ClickFunnels, or custom HTML. There is no re-hosting; your video keeps its URL.</p>
<p>To find and fix the drops that matter:</p>
<ul class="kb-list"><li>The <strong>retention curve</strong> shows where your drop-off is steep versus gentle, so you can tell a fixable cliff from ordinary attrition.</li>
<li>The <strong>percentage of viewers who reach any point</strong> quantifies how many you lose before key moments like your offer.</li>
<li>The <strong>second-by-second heatmap</strong> (Pro) pins a cliff to the exact line, so you fix the right moment rather than guessing at a region.</li>
<li><strong>UTM and source attribution</strong> lets you check whether a cliff is specific to one traffic source.</li></ul>
<p>Because the analytics live in the embedded player, you measure all of this on the real page where the video runs. No personal data is collected. To start, create a free VidaPulse account, wrap your own video, and measure this on your own video to find your steepest cliff — the one drop worth fixing first.</p>`,
  faq: [
    {
      q: `Is there a good video drop-off rate to aim for?`,
      a: `No single number, and zero is not the goal. Every video loses viewers, and some drop-off is always normal — especially in the opening seconds and as gradual attrition across the runtime. Longer videos accumulate more total drop-off simply because there is more runtime. The useful question is where and how sharply you lose viewers, read on your own retention curve.`,
    },
    {
      q: `What is the difference between a cliff and a gentle slope?`,
      a: `A gentle slope is steady, natural attrition spread across the runtime — usually not worth chasing. A cliff is a sharp drop at one specific moment, meaning many viewers left at once for the same reason. Cliffs are fixable because they point to a specific line or stretch in the video, and recovering those viewers can meaningfully grow your audience.`,
    },
    {
      q: `Should I try to eliminate all drop-off?`,
      a: `No. Driving drop-off toward zero is a waste of effort because no video holds everyone, and a gentle decline is the signature of a healthy video. Focus on the steepest cliff after the opening seconds — that is where the most viewers are leaving for a shared, fixable reason — and leave the natural slope alone.`,
    },
  ],
};
