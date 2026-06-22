'use strict';

module.exports = {
  metaTitle: `Where do viewers leave my VSL? | VidaPulse`,
  metaDescription: `View counts cannot tell you where viewers leave your VSL. Learn to read a second-by-second retention curve and heatmap to find the exact exit point.`,
  answer: `You cannot tell where viewers leave your VSL from view counts — those only show how many pressed play, never when anyone left. To know where viewers exit you need an audience-retention curve, which plots the percentage still watching at every second, plus a second-by-second heatmap to pin the exact moment. Read the curve for steep cliffs rather than gentle slope, then zoom into the steepest segment to tie the drop to a specific line or scene in your own video.`,
  sections: [
    {
      h2: `Why view counts cannot answer this`,
      html: `<p>The instinct is to look at views, plays, or even average watch time and try to infer where people leave. None of those can answer the question. Total views and play rate tell you how many people started. Average watch time tells you, on average, how long they stayed — but an average hides everything. Two VSLs with the same average watch time can leak in completely different places: one bleeds at the open and holds the rest, the other holds the open and collapses right before the offer.</p>
<p>To see <em>where</em> viewers leave, you need a measure that tracks attention across the timeline second by second, not a single summary number. That is the gap between knowing your VSL is underperforming and knowing exactly which moment to fix.</p>`,
    },
    {
      h2: `Read the audience-retention curve first`,
      html: `<p>The <strong>audience-retention curve</strong> is the one report that shows where viewers leave. The y-axis is the percentage of viewers still watching; the x-axis is time through the video. The line only ever goes down or holds flat — once someone leaves, they are gone from it — so every downward step is a record of people quitting at that exact moment.</p>
<ul class="kb-list"><li><strong>Flat stretches are healthy.</strong> Where the line holds level, viewers are staying with you. Leave those sections alone.</li>
<li><strong>Gentle decline is normal.</strong> Every video loses some viewers steadily across its runtime. That slow slope is natural attrition, not a problem you can edit away.</li>
<li><strong>Steep cliffs are the leaks.</strong> A near-vertical fall means many viewers left in a short span. Those are the moments doing real damage, and the timestamp of each cliff is your target.</li></ul>
<p>Note the two or three steepest drops and the second each begins. That is your shortlist, ordered by how much they cost you.</p>`,
    },
    {
      h2: `Pin the exact second with the heatmap`,
      html: `<p>The retention curve points you to roughly where a drop happens. To act on it you need the exact second, and that is what the <strong>second-by-second engagement heatmap</strong> (a Pro feature) gives you. It shows which precise moments hold attention and which get skipped, paused, or abandoned, down to the individual second.</p>
<p>Cross-check your steepest curve segment against the heatmap. Where the curve says "viewers leave somewhere around here," the heatmap lets you zoom in until you can tie the bleed to a specific sentence, claim, or visual rather than a vague region. That precision is the difference between rewriting a whole section and fixing the one line that is actually breaking.</p>
<p class="kb-example">Hypothetical illustration: say your curve shows a sharp fall between roughly 1:20 and 1:35. The heatmap lets you narrow it to 1:24, where a slow tangent begins. Now you know the exact line to cut, instead of rewriting the entire middle of the VSL.</p>`,
    },
    {
      h2: `Match each exit to a part of your VSL`,
      html: `<p>Where a drop sits on the curve usually tells you what kind of problem it is. Sorting your exits by location turns "people leave" into a specific question you can answer:</p>
<ul class="kb-list"><li><strong>An exit in the first seconds</strong> is a hook problem. Viewers decided in an instant the video was not for them — often a slow intro, an ad-to-video mismatch, or sound-off friction rather than your offer.</li>
<li><strong>An exit in the middle</strong> is usually a pacing problem. A long setup, a tangent, or a section that lost the thread. These are the easiest to fix once located, because the edit is often just "cut or tighten this part."</li>
<li><strong>An exit right before the offer</strong> is the most expensive. Those viewers came the furthest and were closest to converting. A drop here often means the transition into the ask felt abrupt or the value was not yet clear.</li></ul>
<p>Reading where the steep drop sits tells you not just that viewers left, but why — and where to point your next edit.</p>`,
    },
    {
      h2: `Turn the read into a fix you can prove`,
      html: `<p>Finding where viewers leave is only useful if you can confirm a fix worked. Use a simple loop so every change is measured, not guessed:</p>
<ol><li><strong>Save your baseline curve.</strong> Let real traffic run until the curve is stable, then record it. This is what every later version gets compared against.</li>
<li><strong>Fix the single steepest drop.</strong> Change one section at a time so you can attribute the result.</li>
<li><strong>Re-measure and compare.</strong> Run real traffic through the new version and lay the new curve next to the baseline. If the cliff got shallower, keep the edit; if a new drop appeared, revert and try a different fix for that same spot.</li></ol>
<p>Changing one thing per round is slower per cycle but far faster at actually improving the VSL, because you always know which edit moved the curve.</p>`,
    },
  ],
  solve: `<p>VidaPulse is built to show you exactly where viewers leave the VSL you actually care about — the one on your own page. You paste any video URL from wherever it already lives (YouTube, Amazon S3, Google Drive, Dropbox, OneDrive, Azure Blob, Loom, a Zoom recording, Vimeo, or a direct MP4/HLS), VidaPulse wraps it in an analytics player, and you embed it with one line of script or a script-free iframe on WordPress, Webflow, ClickFunnels, or custom HTML. There is no re-hosting and no re-uploading; your video keeps its URL.</p>
<p>From there, locating exits is the loop above, measured on your real viewers:</p>
<ul class="kb-list"><li>The <strong>audience-retention curve</strong> shows the steep cliffs where viewers leave, so you stop guessing from view counts.</li>
<li>The <strong>second-by-second engagement heatmap</strong> (Pro) pins the exact second a drop begins, so you can tie it to a specific line or visual.</li>
<li>The <strong>percentage of viewers who reach any point</strong> tells you how many actually arrive at your offer, and <strong>average watch time</strong> and <strong>play rate</strong> round out the picture.</li></ul>
<p>Because the tracking lives in the embedded player, you measure where viewers leave on the page where your VSL really runs, not just on the platform that hosts the file. Unique viewers are counted with a first-party cookie or localStorage ID, and no personal data is collected. To start, create a free VidaPulse account, wrap your own VSL, and pull your retention curve to see exactly where your viewers are leaving — the second-level heatmap is on Pro.</p>`,
  faq: [
    {
      q: `Can I tell where viewers leave from average watch time?`,
      a: `No. Average watch time is a single summary number that hides where the loss happens. Two VSLs with the same average can leak in completely different places — one at the open, one before the offer. To see where viewers actually leave you need the audience-retention curve, which plots the percentage still watching at every second.`,
    },
    {
      q: `What is the difference between the retention curve and the heatmap?`,
      a: `The audience-retention curve shows roughly where viewers leave by plotting the percentage still watching across the timeline; you read it for steep cliffs. The second-by-second heatmap resolves down to the individual second so you can pin the exact moment a drop starts and tie it to a specific line or visual. You use the curve to locate the region, then the heatmap to find the precise second.`,
    },
    {
      q: `Does YouTube show me where viewers leave my embedded VSL?`,
      a: `Only for the video as watched on YouTube itself. YouTube's retention report does not follow your embed onto a VSL or landing page, and it is aggregate, so it cannot pin a drop to the exact second on your own page. To see where viewers leave a video embedded outside the host platform, you need a tool that tracks that specific embedded player wherever it lives.`,
    },
  ],
};
