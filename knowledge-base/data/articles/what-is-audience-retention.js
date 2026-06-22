'use strict';

module.exports = {
  metaTitle: `What is audience retention? | VidaPulse`,
  metaDescription: `Audience retention is the share of viewers still watching at each point of a video, shown as a curve. Learn how to read it and why it matters for sales videos.`,
  answer: `Audience retention is the share of viewers still watching at each point in a video, measured second by second from start to finish. It is usually expressed as a curve that starts at 100% of the people who pressed play and falls as viewers leave, so every downward step records people quitting at that exact moment. Where a view count tells you how many people started, audience retention tells you how many are still there at any given second — which is the difference between knowing your video got attention and knowing where it lost it.`,
  sections: [
    {
      h2: `What audience retention measures`,
      html: `<p>Audience retention answers a single question across your whole runtime: of everyone who started the video, what fraction is still watching at this second? At the very first frame the answer is 100%, because everyone counted pressed play. From there the number can only fall or hold flat — once a viewer leaves, they are gone from the measurement and do not return to it.</p>
<p>That makes retention fundamentally different from the metrics most people check first. <strong>Total views</strong> and <strong>unique viewers</strong> count how many people arrived. <strong>Play rate</strong> measures how many of the people who saw the player actually started it. None of those say anything about <em>when</em> people left. Audience retention is the one measure that tracks attention across time rather than at the doorway, so it is where you look when you want to know not just that people came, but how far they stayed.</p>`,
    },
    {
      h2: `How audience retention is expressed as a curve`,
      html: `<p>Retention is almost always drawn as a line, plotted left to right across the video's timeline, with the percentage of viewers still watching on the vertical axis. Read it like a downhill profile: the line begins at the top left at 100% and works its way down as the video plays. The <em>shape</em> of that descent is the whole point.</p>
<ul class="kb-list"><li>A <strong>gentle, even slope</strong> is ordinary attrition — every video loses some viewers steadily, and that decline is normal.</li>
<li>A <strong>steep cliff</strong> is a moment where many viewers left in a short span. These sharp drops are the parts worth investigating, because they mark a specific second that is costing you.</li>
<li>A <strong>long flat stretch</strong> means viewers are staying put through that section — a good sign that the content there is holding attention.</li></ul>
<p>Because the curve is a percentage of the original audience, it lets you compare videos of different popularity on equal footing. A video with 200 viewers and one with 20,000 can both be read on the same 0-to-100% scale, so retention describes the quality of attention independently of how much traffic the video got.</p>`,
    },
    {
      h2: `Why audience retention matters for sales videos`,
      html: `<p>For a VSL or a product video, the goal is not just to be watched — it is to carry viewers all the way to the offer. Audience retention is the only metric that tells you how many people actually get there. A video can have an impressive view count and still convert poorly because most of the audience left long before the call to action ever appeared. Retention exposes that gap directly.</p>
<p>It also turns vague worry into a precise target. "People aren't buying" is not actionable; "retention falls from 55% to 30% in the five seconds before the offer" is. By showing you where attention collapses, retention points to the single edit most likely to recover lost viewers, instead of leaving you to guess at the whole script.</p>
<p class="kb-example">Hypothetical illustration: imagine two sales videos that each got 3,000 plays. One holds 60% of viewers to the offer; the other holds 12%. The view counts look identical, but the first video is delivering five times as many people to the moment that matters. Without audience retention, you would never see that difference.</p>`,
    },
    {
      h2: `How to read your retention number`,
      html: `<p>Retention is best read as a shape first and a single number second. Start by scanning the curve for the steepest drops, since those mark the exact moments viewers quit. Then ask which kind of drop you are seeing: a cliff in the opening seconds usually points to a slow intro or a mismatch between what brought viewers in and what the video opened with; a drop in the middle points to a section that drags; a fall right before the offer is the most expensive, because those viewers came the furthest before leaving.</p>
<p>One caution: do not read audience retention in isolation from <strong>average watch time</strong>. The average compresses the entire curve into one figure and hides where people left — two videos with the same average watch time can have completely different retention shapes. Pair the two: the average gives you a headline, and the curve tells you the story behind it.</p>`,
    },
  ],
  solve: `<p>VidaPulse measures audience retention on your real viewers, on the video you actually care about — the one embedded on your own page. You paste any video URL from wherever it already lives (YouTube, Amazon S3, Google Drive, Dropbox, OneDrive, Azure Blob, Loom, a Zoom recording, Vimeo, or a direct MP4/HLS), VidaPulse wraps it in an analytics player, and you embed it with one line of script or a script-free iframe. There is no re-hosting and no re-uploading; your video stays exactly where it is.</p>
<p>From there, retention becomes something you can act on:</p>
<ul class="kb-list"><li>The <strong>audience-retention curve</strong> shows the percentage of viewers still watching at each point, so you see the cliffs instead of guessing from view counts.</li>
<li><strong>Average watch time</strong> and the <strong>percentage of viewers who reach any point</strong> sit alongside the curve, so you can confirm how many people actually arrive at your offer.</li>
<li>The <strong>second-by-second heatmap</strong> (Pro) lets you zoom from a rough drop on the curve to the exact second the bleed starts, so you can tie it to a specific line or visual.</li></ul>
<p>Because the tracking lives in the embedded player, you measure retention on the page where your VSL or product video really runs — not just on the platform that happens to host the file. No personal data is collected. You can start on the Free plan with one video to see your own retention curve before changing anything.</p>`,
  faq: [
    {
      q: `What is the difference between audience retention and view count?`,
      a: `A view count tells you how many people started the video; audience retention tells you how many are still watching at each second after that. Two videos with identical view counts can have completely different retention — one might hold most viewers to the end while the other loses them in the first ten seconds. Retention is the measure that tracks attention across time rather than just counting who arrived.`,
    },
    {
      q: `Why does a retention curve only go down?`,
      a: `Because it measures the share of the original audience still watching, and once a viewer leaves they are gone from that line. The curve starts at 100% of the people who pressed play and can only fall or hold flat as the video continues. That is why every downward step is a record of viewers quitting at that exact moment, and steep steps mark where attention collapses.`,
    },
    {
      q: `Is audience retention the same as average watch time?`,
      a: `No. Average watch time is a single number — the typical length watched — while audience retention is the full curve showing how many viewers remain at every point. The average hides where people left, so two videos with the same average can have very different shapes. You want both: the average as a headline and the retention curve to show where the drops actually happen.`,
    },
  ],
};
