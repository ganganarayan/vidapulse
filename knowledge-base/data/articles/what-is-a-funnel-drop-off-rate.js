'use strict';

module.exports = {
  metaTitle: `What is a funnel drop-off rate? | VidaPulse`,
  metaDescription: `A funnel drop-off rate is the share of people who leave a step without advancing. Learn to read it and pair it with in-video retention to find the real leak.`,
  answer: `A funnel drop-off rate is the share of people who reach a step but leave without advancing to the next one. It is the inverse of the step's conversion rate: if 30 percent advance, the drop-off rate is 70 percent. You read it step by step, looking for the stage with the highest drop-off, because that is where your funnel loses the most for the least reason. A step-level drop-off rate tells you which stage leaks; pairing it with in-video retention tells you exactly where inside the video the leak happens.`,
  sections: [
    {
      h2: `A working definition of drop-off rate`,
      html: `<p>The <strong>funnel drop-off rate</strong> for a step is the percentage of people who enter that step but do not continue to the next one. If 1,000 people reach a stage and 200 advance, then 800 dropped off and the drop-off rate is 80 percent. It is simply the mirror image of that step's conversion rate: drop-off rate plus advance rate always equals 100 percent.</p>
<p>The reason to measure drop-off rather than only the final conversion is that it is <em>local</em>. A single end-of-funnel number averages everything together and hides where the loss occurs. A per-step drop-off rate isolates each stage, so a high number on one step points a finger directly at it. You are no longer asking "why are sales low" but "why does this one step lose 80 percent of the people who reach it."</p>`,
    },
    {
      h2: `How to calculate it for each step`,
      html: `<p>To put a drop-off rate on a funnel, lay the stages out in order and count entries and exits at each one. For a video funnel the stages are usually traffic, the video, the offer, and the booking or checkout. Then for each step, divide the number who advanced by the number who entered to get the advance rate, and subtract from one hundred percent to get the drop-off rate.</p>
<ul class="kb-list"><li><strong>Step entries</strong> — how many people reached this stage.</li>
<li><strong>Step advances</strong> — how many of them continued to the next stage.</li>
<li><strong>Drop-off rate</strong> — 100 percent minus (advances divided by entries).</li></ul>
<p>Do this for every transition and you get a drop-off rate per step rather than one blended figure. The step with the highest rate is your worst leak. Read percentages, not raw counts, so a small absolute number at the end of the funnel does not distract you from a stage in the middle that is quietly losing most of its traffic.</p>`,
    },
    {
      h2: `How to read a drop-off rate honestly`,
      html: `<p>A drop-off rate is only useful in context. Some drop-off is unavoidable: not everyone who clicks an ad is a real prospect, and every stage will lose someone. The question is not whether a step has drop-off but whether its rate is out of line with the value lost there. A high drop-off late in the funnel, among people who came the furthest, is far more expensive than the same rate at the top.</p>
<p>Watch for two traps. The first is comparing drop-off rates across steps that handle very different traffic — a cold-traffic top of funnel and a warm pre-checkout step are not comparable. The second is reading the rate without knowing the cause; "this step drops 85 percent" is a symptom, and a symptom does not tell you what to edit. The rate sends you to the right stage, but it does not yet tell you why people leave.</p>
<p class="kb-example">Hypothetical: a video page receives 1,000 visitors and 25 book a call, for a 97.5 percent drop-off across the whole page. That single number hides everything. If 900 started the video but only 70 reached the offer inside it, the video step alone has a roughly 92 percent drop-off — and that is the rate worth chasing.</p>`,
    },
    {
      h2: `Pairing step-level rate with in-video retention`,
      html: `<p>A step-level drop-off rate stops at the door of the video. It can tell you that the video step loses, say, 90 percent of the people who start it, but it cannot tell you whether they leave in the first five seconds or right before the offer. Those are different problems with different fixes, and a single rate flattens them into one number.</p>
<p>To go further you pair the step-level rate with <strong>in-video retention</strong>. The audience-retention curve shows the percentage still watching at each second, so it turns one drop-off rate into a continuous picture of where the loss actually happens. Where the curve falls off a cliff, that is the moment driving your step's drop-off rate. A second-by-second heatmap then resolves the cliff to the exact second, so you can tie it to a specific sentence or visual. The rate finds the leaking step; retention finds the leaking moment.</p>`,
    },
  ],
  solve: `<p>VidaPulse gives you both halves of the picture for the video step: the share of viewers who advance, and the exact moment the rest fall off. You paste any video URL from wherever it already lives — YouTube, Amazon S3, Google Drive, Dropbox, OneDrive, Azure Blob, Loom, a Zoom recording, Vimeo, or a direct MP4 or HLS file — and VidaPulse wraps it in an analytics player you embed with one line of script or a script-free iframe. There is no re-hosting and no second upload.</p>
<p>From there you can put a real drop-off rate on the video step and then go deeper:</p>
<ul class="kb-list"><li>The <strong>percentage of viewers reaching any point</strong> gives you the step-level drop-off rate for the video — how many start versus how many reach the offer.</li>
<li>The <strong>audience-retention curve</strong> and <strong>average watch time</strong> turn that rate into a moment-by-moment view of where viewers leave.</li>
<li>The <strong>second-by-second heatmap</strong> (Pro) pinpoints the exact second behind the drop, and <strong>viewer-level history</strong> (Pro) separates first watches from replays.</li>
<li><strong>UTM source attribution</strong> lets you compare drop-off by traffic source, so you can see if one channel leaks harder than another.</li></ul>
<p>Because the tracking lives in the embedded player, the rate you read reflects the page where your funnel actually runs, not just the platform that hosts the file. No personal data is collected. Start on the Free plan with one video — free forever, no card — to measure your own video's drop-off rate; Starter (10 dollars/mo) covers ten videos and Pro (19 dollars/mo) unlocks unlimited videos, heatmaps, viewer-level history, segmentation, and conversion tracking. Create a free account and find your funnel's video leak.</p>`,
  faq: [
    {
      q: `What does a funnel drop-off rate actually measure?`,
      a: `It measures the share of people who reach a given step but leave without advancing to the next one. It is the inverse of that step's advance rate, so a 70 percent drop-off means 30 percent continued. Measuring it per step rather than as one end-of-funnel number isolates each stage, so a high rate points directly at the step that is leaking.`,
    },
    {
      q: `What is a good funnel drop-off rate?`,
      a: `There is no single number, because every step loses someone and cold traffic naturally drops more than warm. Judge a rate against the value lost there: high drop-off late in the funnel, among people who came the furthest, is far more costly than the same rate at the top. Compare each step to itself over time rather than to an arbitrary benchmark.`,
    },
    {
      q: `Why pair the drop-off rate with in-video retention?`,
      a: `A step-level drop-off rate can tell you the video loses most of its viewers, but not whether they leave in the first seconds or right before the offer — different problems with different fixes. In-video retention shows the percentage still watching at each second, turning one rate into a picture of where the loss happens, so you can pin the moment driving the rate.`,
    },
  ],
};
