'use strict';

module.exports = {
  metaTitle: `What percentage of a video do people watch? | VidaPulse`,
  metaDescription: `It depends — short videos for warm traffic hold a far larger share than long videos for cold traffic. Here are honest rough ranges and how to measure yours.`,
  answer: `It depends, and anyone giving you one number is guessing. The share of a video people watch swings enormously with length and traffic temperature: a short video for a warm, interested audience can hold most of its runtime, while a long video for cold traffic that just clicked an ad might lose the majority in the opening stretch alone. As a rough, illustrative rule of thumb, the share watched tends to fall as videos get longer and as traffic gets colder, and the steepest loss almost always happens at the very start. The only figure that means anything is your own, measured on your real video and traffic — so the useful move is to stop looking for a universal number and measure yours.`,
  sections: [
    {
      h2: `Why "it depends" is the honest answer`,
      html: `<p>People want a single statistic — "people watch X percent of a video on average" — and plenty of sources will hand one over. The trouble is that such a number averages across wildly different videos, audiences, and contexts, which makes it useless for predicting yours. The share watched is not a property of video in general; it is a property of <em>a specific video shown to specific people on a specific page</em>.</p>
<p>Two factors dominate, and they pull hard in opposite directions:</p>
<ul class="kb-list"><li><strong>Length.</strong> The longer a video runs, the smaller the share most viewers watch, because there is simply more runtime to lose them across. A short video can hold a large percentage; a long one rarely does.</li>
<li><strong>Traffic temperature.</strong> Warm viewers who arrived already interested watch a far larger share than cold traffic that just clicked and has no relationship with you. The same video shown to each audience produces very different numbers.</li></ul>
<p>Because these move together, a universal percentage is meaningless. The right question is not "what percentage do people watch" but "what percentage do <em>my</em> people watch on <em>my</em> video."</p>`,
    },
    {
      h2: `Rough ranges, clearly illustrative`,
      html: `<p>People still want a sense of scale, so here is one — framed honestly. These are <strong>illustrative ranges only</strong>, not statistics, and your real numbers may sit well outside them.</p>
<p class="kb-example">Purely hypothetical illustration: a short video shown to a warm audience might hold a large majority of its runtime on average, because the viewers came specifically to watch and there is little runtime to lose them across. A long video shown to cold ad traffic might see the typical viewer watch only a small fraction, with a big chunk leaving in the opening seconds before the content even gets going. A medium-length video on mixed traffic could land anywhere between. None of these is "the" answer — they are different situations producing different numbers.</p>
<p>Notice what the ranges do not give you: a target. They exist only to show that the spread is huge, which is the whole point. A figure that would be alarming for one video is excellent for another.</p>`,
    },
    {
      h2: `The opening seconds dominate the number`,
      html: `<p>One pattern holds across nearly every video regardless of length or traffic: the largest single loss happens right at the start. A meaningful share of viewers leave in the first few seconds — people who clicked by accident, are not the right audience, or were not convinced to commit. This early drop pulls down the overall percentage watched more than anything later in the runtime.</p>
<p>That has a practical consequence. If your share watched looks low, the first place to look is the opening, not the body. A weak hook in the first seconds caps the percentage for everything that follows, because viewers who never get past the start cannot watch the middle. Recovering even part of that early loss lifts the share watched across the whole video.</p>`,
    },
    {
      h2: `How to measure yours`,
      html: `<p>Replacing the guess with your real number is straightforward once your video is in an analytics player:</p>
<ol><li><strong>Read your average watch time as a percentage of the runtime.</strong> That is the headline answer to "what share do my viewers watch," in a form that is comparable as your video changes.</li>
<li><strong>Read the retention curve to see how that share is distributed.</strong> The average tells you how much; the curve tells you where it is lost.</li>
<li><strong>Segment by source.</strong> Read cold and warm traffic separately, because blending them produces an average that describes neither.</li>
<li><strong>Track the trend.</strong> Compare only to a previous version of the same video on the same traffic, and watch whether the share watched is rising.</li></ol>
<p>That measured number, tracked against itself, is worth more than any statistic you could look up, because it is the only one that describes your actual situation.</p>`,
    },
  ],
  solve: `<p>VidaPulse answers this question for your real video instead of leaving you with an internet average. You paste any video URL from wherever it already lives (YouTube, Amazon S3, Google Drive, Dropbox, OneDrive, Azure Blob, Loom, a Zoom recording, Vimeo, or a direct MP4/HLS), VidaPulse wraps it in an analytics player, and you embed it with one line of script or a script-free iframe on WordPress, Webflow, ClickFunnels, or custom HTML. There is no re-hosting; your video keeps its URL.</p>
<p>To measure the share your viewers actually watch:</p>
<ul class="kb-list"><li><strong>Average watch time</strong> as a percentage of runtime gives you the headline answer for your video.</li>
<li>The <strong>retention curve</strong> shows how that share is distributed, including the heavy loss in the opening seconds.</li>
<li><strong>UTM and source attribution</strong> lets you read cold and warm traffic separately, so the number describes a real audience rather than a blend.</li>
<li>The <strong>second-by-second heatmap</strong> (Pro) pins exactly where viewers leave, so you know what is dragging the percentage down.</li></ul>
<p>Because the analytics live in the embedded player, you measure all of this on the real page where the video runs. No personal data is collected. To start, create a free VidaPulse account, wrap your own video, and measure this on your own video to replace the internet average with the percentage your actual viewers watch.</p>`,
  faq: [
    {
      q: `What percentage of a video do people watch on average?`,
      a: `There is no honest single answer, because the share watched depends mostly on video length and how warm the traffic is. A short video for a warm audience can hold most of its runtime, while a long video for cold traffic might lose the majority in the opening stretch. Any quoted average blends wildly different videos and will not predict yours — measure your own instead.`,
    },
    {
      q: `Why do shorter videos hold a higher percentage?`,
      a: `Because there is simply less runtime to lose viewers across. The longer a video plays, the more opportunities for people to leave, so the typical share watched falls as length grows. This is why you should never compare the percentage watched across videos of very different lengths, and why expressing it as a share of runtime is more useful than raw seconds.`,
    },
    {
      q: `How do I find the percentage my viewers watch?`,
      a: `Put your video in an analytics player and read your average watch time as a percentage of the runtime, then read the retention curve to see how that share is distributed. Segment cold and warm traffic separately, since blending them produces an average that describes neither, and track the figure against previous versions of the same video.`,
    },
  ],
};
