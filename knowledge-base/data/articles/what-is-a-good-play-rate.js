'use strict';

module.exports = {
  metaTitle: `What is a good play rate? | VidaPulse`,
  metaDescription: `Play rate is the share of people who see your video and press play. There is no universal good number — it depends on placement, autoplay, and traffic.`,
  answer: `Play rate is the percentage of people who see your video on a page and actually press play, rather than scrolling past it. There is no universal good number, and any single figure quoted without context is misleading — it depends on where the video sits on the page, whether it autoplays, how clearly the thumbnail and headline promise something worth watching, and how warm the traffic is. As a very rough rule of thumb, a manually-played video that the visitor came specifically to watch often pulls a far higher play rate than a video buried below the fold for cold visitors who did not expect it. The honest move is to measure your own play rate and improve it, not to chase a benchmark.`,
  sections: [
    {
      h2: `What play rate measures`,
      html: `<p>Play rate answers a simple gatekeeping question: of the people who had the chance to watch your video, what share chose to start it? It is calculated as the number of plays divided by the number of people who loaded the page or saw the video, expressed as a percentage. If one hundred people land on a page and forty press play, the play rate is forty percent.</p>
<p>It matters because every other video metric depends on it. Retention, average watch time, the share who reach your offer — none of them exist for a viewer who never pressed play. A video can have a flawless retention curve and still drive nothing if almost nobody starts it. Play rate is the top of the funnel for the video itself, which is why it deserves attention before you obsess over what happens later in the runtime.</p>`,
    },
    {
      h2: `Why there is no universal good number`,
      html: `<p>The temptation is to want a single figure — "a good play rate is X percent." The problem is that play rate is shaped by factors that vary enormously from one page to the next, so any one number is meaningless out of context.</p>
<ul class="kb-list"><li><strong>Placement.</strong> A video at the top of a page, above the fold, gets seen by far more visitors and tends to pull a higher play rate than the same video buried near the bottom that most people never scroll to.</li>
<li><strong>Autoplay versus click-to-play.</strong> These are barely the same metric. Autoplay (often muted) can push the play rate toward one hundred percent because the video starts on its own, but those plays are far lower-intent than someone who deliberately clicked. A high autoplay play rate and a high click-to-play rate mean completely different things.</li>
<li><strong>Traffic temperature and intent.</strong> A visitor who clicked a link specifically to watch a video arrives ready to press play. A cold visitor who landed on a general page may never have intended to watch anything.</li>
<li><strong>The promise.</strong> A clear thumbnail, a headline that tells the visitor what they will get, and a visible play button all lift play rate. A vague or hidden video suppresses it.</li></ul>
<p>Because these move at once, a play rate that is excellent on one page is poor on another. Comparing your number to a figure you read somewhere tells you nothing useful.</p>`,
    },
    {
      h2: `A directional ballpark, clearly hypothetical`,
      html: `<p>People still want a sense of scale, so here is one — with a firm caveat. These are <strong>illustrative ranges only</strong>, not benchmarks to hit, and your real numbers may sit well outside them depending on your placement and traffic.</p>
<p class="kb-example">Purely hypothetical illustration: a click-to-play video placed high on a page that the visitor came specifically to view might see a large share of visitors press play, while the same video placed low on a general page seen by cold traffic might see only a small fraction start it. An autoplay video, by contrast, could report a play rate near one hundred percent that says very little about genuine interest. None of these figures is "good" or "bad" on its own — they describe different situations entirely.</p>
<p>The useful takeaway is not the range. It is that the same video can post wildly different play rates depending on context, which is exactly why your own measured number beats any external one.</p>`,
    },
    {
      h2: `Benchmark your own play rate instead`,
      html: `<p>The only play rate worth judging is the one your page actually produces, compared against itself over time. Setting that baseline takes a few steps:</p>
<ol><li><strong>Measure plays against page visits on your real page.</strong> Wait until the figure is stable across many visits, not a handful, so noise does not mislead you.</li>
<li><strong>Note whether you are using autoplay or click-to-play,</strong> and never compare the two as if they were the same metric.</li>
<li><strong>Change one thing and re-measure.</strong> Move the video higher, sharpen the thumbnail, or rewrite the headline above it — one change per round so you can attribute the result.</li>
<li><strong>Segment by source where you can.</strong> Cold and warm traffic press play at different rates, so reading them together hides what is happening.</li></ol>
<p>That baseline is worth more than any number you could look up, because it is measured on your page, your placement, and your traffic.</p>`,
    },
  ],
  solve: `<p>VidaPulse gives you the play rate that matters — your own, measured on the page where the video really runs. You paste any video URL from wherever it already lives (YouTube, Amazon S3, Google Drive, Dropbox, OneDrive, Azure Blob, Loom, a Zoom recording, Vimeo, or a direct MP4/HLS), VidaPulse wraps it in an analytics player, and you embed it with one line of script or a script-free iframe on WordPress, Webflow, ClickFunnels, or custom HTML. There is no re-hosting; your video keeps its URL.</p>
<p>To baseline and raise your play rate:</p>
<ul class="kb-list"><li><strong>Play rate</strong> tells you the share of people who saw the video and pressed play — the gatekeeping number for everything that follows.</li>
<li>The <strong>retention curve</strong> and <strong>average watch time</strong> show what happens after the play, so you know whether lifting play rate also brings the right viewers.</li>
<li><strong>UTM and source attribution</strong> lets you read play rate by traffic source, so you compare cold and warm traffic fairly instead of averaging them into one misleading figure.</li></ul>
<p>Because the analytics live in the embedded player, you measure all of this on the real page, not just the platform hosting the file. Unique viewers are counted with a first-party cookie or localStorage ID, and no personal data is collected. To start, create a free VidaPulse account, wrap your own video, and measure this on your own video to see the play rate you are actually starting from.</p>`,
  faq: [
    {
      q: `Is there a standard good play rate?`,
      a: `No. Play rate depends on where the video sits on the page, whether it autoplays, how clearly the thumbnail and headline promise value, and how warm the traffic is — all of which vary from one page to the next. Any single quoted figure is meaningless out of context. The useful target is your own play rate measured on your real page, improved over time.`,
    },
    {
      q: `Does autoplay count as a higher play rate?`,
      a: `It usually reports a much higher play rate, often near one hundred percent, because the video starts on its own rather than waiting for a click. But those plays are far lower-intent than a deliberate click-to-play. The two are effectively different metrics, so never compare an autoplay play rate to a click-to-play one as if they meant the same thing.`,
    },
    {
      q: `How do I improve my play rate?`,
      a: `Move the video higher on the page so more visitors actually see it, sharpen the thumbnail, and make the headline above it clearly promise what the viewer will get. Change one thing at a time and re-measure on your real page, and segment by traffic source where you can, since cold and warm visitors press play at very different rates.`,
    },
  ],
};
