'use strict';

module.exports = {
  metaTitle: `What is a good VSL retention rate? | VidaPulse`,
  metaDescription: `There is no single magic VSL retention number. What matters is the percentage who reach your offer and your own trend over time. Learn how to baseline yours.`,
  answer: `There is no single magic VSL retention rate, and chasing a benchmark you read somewhere will mislead you. What counts as good depends on how warm your traffic is and how long your VSL runs — cold ad traffic on a long VSL behaves nothing like a warm referral on a short one. Two metrics matter more than any external number: the percentage of viewers who reach your offer, and your own retention trend version over version. Set a baseline on your real video, then beat it.`,
  sections: [
    {
      h2: `Why there is no universal number`,
      html: `<p>People want a single figure — "a good VSL holds X% to the end" — because it is simple. The problem is that retention is shaped by factors that vary wildly from one VSL to the next, so any one number is meaningless out of context.</p>
<ul class="kb-list"><li><strong>Traffic temperature.</strong> Cold traffic that just clicked an ad has no relationship with you and leaves freely. Warm traffic from your list or a referral arrives already interested and holds far longer. The same VSL will show very different curves depending on who lands on it.</li>
<li><strong>Length.</strong> A 3-minute VSL and a 30-minute VSL cannot be judged by the same percentage. Holding 40% across 30 minutes is a different achievement than holding 40% across 3.</li>
<li><strong>Audience and offer.</strong> A high-consideration B2B demo and a quick B2C product pitch pull different behavior. Borrowing a benchmark from a different audience tells you nothing about yours.</li></ul>
<p>Because all of these move at once, a "good" retention rate for one VSL can be a poor one for another. The number you should care about is the one your own video produces.</p>`,
    },
    {
      h2: `What actually matters: reaching the offer`,
      html: `<p>If you replace "what is a good retention rate" with a better question, it becomes answerable: <em>what percentage of viewers reach my offer?</em> Overall retention to the end is interesting, but most of a VSL's job is getting people to the ask. A video that holds modest overall retention but lands most of its surviving viewers right at the offer can outperform one with a prettier curve that loses people just before the pitch.</p>
<p>So read your audience-retention curve at the exact second your offer begins, and treat the percentage there as the number that matters. It is closer to revenue than any to-the-end figure, and unlike an external benchmark, it is measured on your real traffic and your real video.</p>`,
    },
    {
      h2: `What actually matters more: your own trend`,
      html: `<p>The second metric that beats any benchmark is your own retention over time. The only fair comparison for your VSL is a previous version of the same VSL, on the same kind of traffic. Did the steepest drop get shallower? Did more viewers reach the offer than last version? That trend tells you whether your edits are working — which is the entire point.</p>
<p>Comparing against someone else's published number is a trap, because you never know their traffic temperature, length, audience, or whether the figure is even real. Comparing against your own last version controls for all of that automatically. Beat your baseline, then beat it again.</p>`,
    },
    {
      h2: `Directional ranges, clearly hypothetical`,
      html: `<p>People still ask for a ballpark, so here is one — with a firm caveat. These are <strong>illustrative ranges only</strong>, not benchmarks to hit, and your real numbers may sit well outside them depending on your traffic and length. Use them to sanity-check, never as a target.</p>
<p class="kb-example">Purely hypothetical illustration: a short VSL on warm traffic might hold a much larger share of viewers to the offer than a long VSL on cold ad traffic, where it would not be surprising for a large share to leave in the opening stretch alone. Neither figure is "good" or "bad" in isolation — the warm-traffic VSL still has a weak hook if its first-seconds drop is steep, and the cold-traffic VSL might be performing well for its context.</p>
<p>The honest answer to "what number should I expect" is: measure yours, then judge it against itself. The range matters far less than the direction it moves.</p>`,
    },
    {
      h2: `How to baseline your own retention`,
      html: `<p>Setting a real baseline takes three steps and replaces guesswork with a number you can improve:</p>
<ol><li><strong>Get your VSL into an analytics player and run real traffic.</strong> Wait until the curve is stable across many sessions, not a handful — a few viewers will give you a noisy, misleading line.</li>
<li><strong>Record two numbers.</strong> The shape of the audience-retention curve (where the steep drops are) and the percentage of viewers who reach your offer timestamp.</li>
<li><strong>Save it and compete against it.</strong> Every future edit gets compared to this baseline. If the offer-reaching percentage rises and your worst drop flattens, you improved — regardless of what any external benchmark says.</li></ol>
<p>That baseline is worth more than any number you could look up, because it is measured on your video, your traffic, and your offer.</p>`,
    },
  ],
  solve: `<p>VidaPulse exists to give you the only retention numbers that matter — your own, measured on your real video and traffic. You paste any video URL from wherever it already lives (YouTube, Amazon S3, Google Drive, Dropbox, OneDrive, Azure Blob, Loom, a Zoom recording, Vimeo, or a direct MP4/HLS), VidaPulse wraps it in an analytics player, and you embed it with one line of script or a script-free iframe on WordPress, Webflow, ClickFunnels, or custom HTML. No re-hosting; your video keeps its URL.</p>
<p>To baseline and beat your own retention:</p>
<ul class="kb-list"><li>The <strong>audience-retention curve</strong> gives you the shape of your real retention and shows where the steep drops sit.</li>
<li>The <strong>percentage of viewers who reach any point</strong> tells you the share who make it to your offer — the number closest to revenue.</li>
<li><strong>UTM and source attribution</strong> lets you read retention by traffic source, so you compare cold ad traffic against warm referrals fairly instead of mixing them into one misleading average.</li>
<li>Because the analytics live on the same video, you can republish an edit and lay the new curve next to your baseline to confirm the trend.</li></ul>
<p>Unique viewers are counted with a first-party cookie or localStorage ID, and no personal data is collected. To start, create a free VidaPulse account, wrap your own VSL, and set your baseline curve so you can stop guessing at benchmarks and start beating your own number.</p>`,
  faq: [
    {
      q: `Is there a standard good retention rate for a VSL?`,
      a: `No. Retention depends on traffic temperature, video length, audience, and offer, all of which vary from one VSL to the next, so any single published number is meaningless out of context. The useful targets are the percentage of viewers who reach your offer and your own retention trend version over version — both measured on your real video.`,
    },
    {
      q: `Should I compare my retention to a competitor's?`,
      a: `It is a trap. You rarely know their traffic temperature, length, audience, or whether the figure is even real, so the comparison is apples to oranges. The only fair benchmark is a previous version of your own VSL on the same kind of traffic, which controls for all of those variables automatically.`,
    },
    {
      q: `How do I judge cold traffic against warm traffic?`,
      a: `Separate them. Cold ad traffic and warm referrals behave very differently, so averaging them hides what is happening. Read retention by source — using UTM and source attribution — so you compare each kind of traffic against itself. A steep first-seconds drop on cold traffic still signals a weak hook; a healthy warm-traffic curve does not excuse it.`,
    },
  ],
};
