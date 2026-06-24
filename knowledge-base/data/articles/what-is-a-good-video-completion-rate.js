'use strict';

module.exports = {
  metaTitle: `What is a good video completion rate? | VidaPulse`,
  metaDescription: `Completion rate is the share of viewers who watch a video to the end. It varies hugely by length — and reaching your offer often matters more than finishing.`,
  answer: `Video completion rate is the percentage of viewers who watch all the way to the end. There is no universal good number, and the figure varies hugely by length: holding viewers to the end of a short clip is common, while the same percentage on a long video would be remarkable. As a rough rule of thumb only, completion drops as runtime grows and as traffic gets colder — so a low completion rate on a long video for cold traffic can be perfectly healthy. More importantly, for a sales or product video, completing the video matters far less than reaching your offer, which usually sits before the end. Measure your own completion rate, but treat reach-to-offer as the number that drives action.`,
  sections: [
    {
      h2: `What completion rate measures`,
      html: `<p>Completion rate is the share of people who pressed play and stayed all the way to the final second. If one hundred viewers start a video and twenty-five reach the end, the completion rate is twenty-five percent. It is the endpoint reading of your retention — the single point on the far right of the audience-retention curve, expressed as a percentage of the people who started.</p>
<p>It is an intuitive headline because "did they finish" feels like a clean measure of whether the video held attention. And for some content it genuinely is the goal. But as a standalone scorecard it carries a heavy assumption — that the end is where the important thing happens — and for many videos that assumption is simply wrong.</p>`,
    },
    {
      h2: `Why it varies hugely by length`,
      html: `<p>The biggest reason there is no universal good completion rate is runtime. Asking someone to finish a thirty-second clip is a small request; asking them to finish a twenty-minute video is a large one, and the percentages reflect that gap.</p>
<ul class="kb-list"><li><strong>Length.</strong> A high completion rate on a short video and a low one on a long video can represent equally good performance. The percentages are not comparable across different runtimes, so judging them by the same bar is a mistake.</li>
<li><strong>Traffic temperature.</strong> Cold traffic that just arrived leaves more freely and completes less often than warm traffic that came already interested. The same video completes very differently depending on who lands on it.</li>
<li><strong>Format and pacing.</strong> A tightly edited video holds people to the end more often than a loose one, regardless of subject. Borrowing a completion benchmark from a different format tells you nothing about yours.</li></ul>
<p>Because these vary together, a completion rate that is excellent for one video is poor for another. The number only means something against your own video on your own traffic.</p>`,
    },
    {
      h2: `Reaching the offer usually matters more`,
      html: `<p>For a sales or product video, completion rate quietly answers the wrong question. What you actually care about is whether viewers reached the point where you ask them to act — and that point almost always sits before the final second. A viewer who hears your offer and clicks through, then leaves before the closing remarks, counts as a non-completer but may be your best result of the day.</p>
<p>So a video can have a modest completion rate and still perform well, as long as most surviving viewers reach the offer. And a video can have a respectable completion rate that hides a problem if people are finishing the video but the offer landed too late to matter, or too early and got forgotten. The better metric is the percentage of viewers still watching at the second your offer begins — that is the audience your ask can actually work on.</p>
<p class="kb-example">Hypothetical illustration: a video where the offer appears at the eighty-percent mark might have only a small completion rate yet still get most of its surviving viewers in front of the ask — because almost everyone who reached the offer acted and left before the final wrap-up. The low completion rate would look alarming and be entirely fine.</p>`,
    },
    {
      h2: `How to use your own completion rate well`,
      html: `<p>Completion rate is still worth tracking — just as a trend against itself, not a benchmark to hit. Use it like this:</p>
<ol><li><strong>Read it as the endpoint of your retention curve,</strong> not in isolation, so you see the shape that produced it rather than a lone figure.</li>
<li><strong>Compare it only to a previous version of the same video</strong> on the same kind of traffic, which controls for length, format, and audience automatically.</li>
<li><strong>Pair it with reach-to-offer.</strong> If completion is low but the share reaching your offer is healthy and rising, your video is doing its job. If both are falling, you have a real problem.</li></ol>
<p>Judged that way, completion rate becomes a useful gauge of whether your edits hold attention longer, rather than an anxiety-inducing number you compare against strangers.</p>`,
    },
  ],
  solve: `<p>VidaPulse reports completion rate inside the full retention picture, measured on the video embedded on your own page. You paste any video URL from wherever it already lives (YouTube, Amazon S3, Google Drive, Dropbox, OneDrive, Azure Blob, Loom, a Zoom recording, Vimeo, or a direct MP4/HLS), VidaPulse wraps it in an analytics player, and you embed it with one line of script or a script-free iframe on WordPress, Webflow, ClickFunnels, or custom HTML. There is no re-hosting; your video keeps its URL.</p>
<p>Because completion is only useful in context, VidaPulse gives you the metrics around it:</p>
<ul class="kb-list"><li>The <strong>retention curve</strong> shows the full shape that produces your completion rate, so you read the endpoint against the whole story.</li>
<li>The <strong>percentage of viewers who reach any point</strong> tells you the share who make it to your offer — usually a more important number than the share who finish.</li>
<li><strong>UTM and source attribution</strong> lets you separate cold and warm traffic, so you do not judge their very different completion rates by one bar.</li>
<li>The <strong>second-by-second heatmap</strong> (Pro) shows exactly where viewers leave before the end, so you know what to fix.</li></ul>
<p>Because the analytics live in the embedded player, you measure all of this on the real page where the video runs. No personal data is collected. To start, create a free VidaPulse account, wrap your own video, and measure this on your own video to see your completion rate against the share who actually reach your offer.</p>`,
  faq: [
    {
      q: `Is there a standard good completion rate?`,
      a: `No. Completion rate varies hugely by video length, traffic temperature, and format, so any single quoted figure is meaningless out of context. A high completion rate on a short clip and a low one on a long video can both be good. The useful target is your own completion rate compared to a previous version of the same video on the same traffic.`,
    },
    {
      q: `Why is reaching the offer better than completing the video?`,
      a: `Because your offer almost always sits before the final second, and a viewer who reaches the offer and acts may leave before the video ends — counting as a non-completer while being your best result. The percentage of viewers still watching when the offer begins measures the audience your ask can actually work on, which completion rate cannot tell you.`,
    },
    {
      q: `My completion rate is low. Is that bad?`,
      a: `Not necessarily. On a long video or for cold traffic, a low completion rate can be perfectly normal. What matters is whether the share of viewers reaching your offer is healthy and trending up, and whether completion is rising version over version. A low completion rate alongside a strong reach-to-offer is usually fine.`,
    },
  ],
};
