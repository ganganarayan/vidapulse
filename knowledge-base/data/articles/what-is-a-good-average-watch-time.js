'use strict';

module.exports = {
  metaTitle: `What is a good average watch time? | VidaPulse`,
  metaDescription: `A good average watch time is best read as a share of your video's length, not raw seconds — and always alongside the retention curve. How to judge yours.`,
  answer: `Average watch time is the typical amount of a video viewers watch before leaving — total watch time divided by the number of viewers. There is no universal good number, because raw seconds mean nothing without knowing the runtime: thirty seconds is excellent on a forty-second clip and dismal on a ten-minute video. The more honest way to judge it is as a share of the video's length, and even then only as directional guidance, not a benchmark. Most importantly, an average hides where people actually leave, so it should always be read alongside the retention curve. Measure your own average as a percentage of runtime, pair it with the curve, and track it over time.`,
  sections: [
    {
      h2: `What average watch time measures`,
      html: `<p>Average watch time tells you, for a typical viewer, how much of your video they got through before leaving. You take the total watch time accumulated across everyone who viewed it and divide by the number of viewers. If ten people watch and their times add up to three hundred seconds, the average watch time is thirty seconds.</p>
<p>It is one of the first numbers most people check because it summarizes engagement in a single figure — a higher average means viewers are staying longer overall. But that single figure is also its weakness: it compresses an entire video into one number, which makes it easy to misread if you treat raw seconds as a verdict.</p>`,
    },
    {
      h2: `Judge it as a share of length, not raw seconds`,
      html: `<p>The single biggest mistake is comparing average watch times in seconds across videos of different lengths. A thirty-second average means something completely different on a forty-second video than on a ten-minute one. The first held most of the runtime; the second lost almost everyone early.</p>
<p>The fix is to express average watch time as a percentage of the runtime. "Viewers watched thirty-eight percent of the video on average" travels across different lengths in a way that raw seconds never can. Even then, treat any target as <strong>directional guidance only</strong>:</p>
<ul class="kb-list"><li><strong>Length.</strong> A short video naturally posts a higher percentage watched than a long one, because there is simply less to lose people across. The percentages are not directly comparable across very different runtimes either, only more comparable than seconds.</li>
<li><strong>Traffic temperature.</strong> Warm traffic watches a larger share than cold traffic that just arrived and leaves freely.</li>
<li><strong>Format and pacing.</strong> A tight edit lifts the share watched; a slow one drags it down, independent of subject.</li></ul>
<p class="kb-example">Purely hypothetical illustration: an average watch time of forty seconds might be excellent on a fifty-second video — eighty percent watched — and poor on a five-minute one, where it is barely over ten percent. The raw forty seconds is identical; the meaning is opposite. This is exactly why the percentage form, and your own baseline, beat any quoted figure.</p>`,
    },
    {
      h2: `The blind spot: an average hides where people leave`,
      html: `<p>Even as a clean percentage, average watch time has a built-in limitation: it cannot tell you <em>where</em> viewers left. Two videos with the same average can behave completely differently — one losing people gradually across the whole runtime, another splitting its audience between early quitters and people who watch to the end. The average is identical; the fix is not.</p>
<p>This matters most for a sales or product video, where the real question is not "how long on average" but "did viewers reach the offer?" A respectable-looking average can hide the fact that most people left long before the call to action. Relying on the average alone is like judging a journey by the average distance traveled — it says nothing about whether anyone arrived.</p>`,
    },
    {
      h2: `Pair it with the retention curve and track the trend`,
      html: `<p>The remedy is to read average watch time together with the <strong>audience-retention curve</strong>, which plots the share still watching at each second. The average is the one-line headline; the curve is the story behind it. Where the average says "thirty-eight percent," the curve shows you the cliff and the plateau that produced it.</p>
<p>To judge your own average well:</p>
<ol><li><strong>Convert it to a percentage of runtime</strong> so it is comparable as your video evolves.</li>
<li><strong>Read it alongside the curve</strong> to see whether the average comes from steady engagement or a sharp early split.</li>
<li><strong>Compare only to a previous version of the same video</strong> on the same kind of traffic — that trend, not an external benchmark, is what tells you your edits are working.</li></ol>
<p>The range matters far less than the direction it moves. A rising share watched, version over version, on the same traffic is the clearest sign your video is improving.</p>`,
    },
  ],
  solve: `<p>VidaPulse reports average watch time alongside the full retention picture, on the video embedded on your own page. You paste any video URL from wherever it already lives (YouTube, Amazon S3, Google Drive, Dropbox, OneDrive, Azure Blob, Loom, a Zoom recording, Vimeo, or a direct MP4/HLS), VidaPulse wraps it in an analytics player, and you embed it with one line of script or a script-free iframe on WordPress, Webflow, ClickFunnels, or custom HTML. There is no re-hosting; your video keeps its URL.</p>
<p>Because the average is only useful in context, VidaPulse gives you the metrics around it:</p>
<ul class="kb-list"><li><strong>Average watch time</strong> as the headline gauge, which you can read as a share of your runtime and track between versions.</li>
<li>The <strong>retention curve</strong> and the <strong>percentage of viewers who reach any point</strong>, so you see where viewers actually leave rather than trusting one number.</li>
<li><strong>UTM and source attribution</strong> so you compare cold and warm traffic separately instead of averaging their very different watch shares together.</li>
<li>The <strong>second-by-second heatmap</strong> (Pro), which distinguishes first watches from replays so rewatching does not quietly inflate your read.</li></ul>
<p>Because the tracking lives in the embedded player, you measure all of this on the page where your video really runs. No personal data is collected. To start, create a free VidaPulse account, wrap your own video, and measure this on your own video to see your average watch time and retention curve side by side.</p>`,
  faq: [
    {
      q: `Is there a standard good average watch time?`,
      a: `No. Raw seconds mean nothing without the runtime, and even as a percentage of length the figure depends on traffic temperature, format, and pacing. Any single quoted number is meaningless out of context. The useful target is your own average — expressed as a share of runtime, read alongside the retention curve, and compared to a previous version of the same video.`,
    },
    {
      q: `Should I measure average watch time in seconds or as a percentage?`,
      a: `As a percentage of the runtime, because seconds are not comparable across videos of different lengths. Thirty seconds is excellent on a forty-second video and poor on a ten-minute one. The percentage form travels across lengths and across your own edits far better, though even it is only roughly comparable when runtimes differ a lot.`,
    },
    {
      q: `Why isn't average watch time enough on its own?`,
      a: `Because an average compresses the whole video into one figure and hides where viewers actually leave. Two videos with the same average can behave completely differently — gradual decline versus an early split. That is why you pair it with the retention curve, which shows the real shape of viewer loss, and track the trend version over version rather than chasing a benchmark.`,
    },
  ],
};
