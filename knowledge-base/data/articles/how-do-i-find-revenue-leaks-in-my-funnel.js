'use strict';

module.exports = {
  metaTitle: `How to find revenue leaks in my funnel | VidaPulse`,
  metaDescription: `Find revenue leaks in a video funnel by locating where viewers leave before the offer, using the retention curve, % reaching the offer, and conversion tracking.`,
  answer: `Find revenue leaks by locating where in your funnel the most valuable viewers leave before they reach the offer or call to action. In a video funnel the leak is almost always inside the video, on a timeline your page analytics cannot see. The method is direct: read the audience-retention curve to find the steepest drop before the offer, confirm with the percentage of viewers who reach that point, and connect it to conversion tracking so you know whether the people who reach the offer actually act. That tells you the exact spot draining the most revenue.`,
  sections: [
    {
      h2: `Look inside the video, not just at the page`,
      html: `<p>Most funnel analysis stops at the page: landings, clicks, sign-ups, sales. That is fine until video carries the pitch — a VSL, a demo, a product walkthrough. Then the page metrics hide the leak, because the page loaded fine and the click happened; the loss occurred <em>inside the video</em>, on a timeline page analytics never see.</p><p>So the first move when hunting a revenue leak in a video funnel is to stop staring at page conversion and start reading the video's own timeline. If clicks are healthy but sales are flat, the video is the most likely leak. The viewer arrived, pressed play, and left somewhere in the middle — and that "somewhere" is what you need to find.</p>`,
    },
    {
      h2: `Step one: find where the most valuable viewers leave`,
      html: `<p>Open the <strong>audience-retention curve</strong> for your video. It plots the share of viewers still watching at each point in the timeline, so a leak shows up as a steep downward slope. You are looking for two things:</p><ul class="kb-list"><li><strong>The steepest drops before the offer.</strong> A cliff at a particular second means a specific moment is pushing people out — a slow section, a confusing claim, a tangent. Each cliff is a candidate leak.</li><li><strong>The level of the curve at the offer.</strong> Where the curve sits when your offer begins tells you how many survived to hear the ask at all.</li></ul><p>The most valuable leaks are the drops that happen <em>before</em> the offer, because those viewers were on their way to the pitch and never arrived. A drop after the offer still matters, but it is people who at least heard the ask. Prioritize the pre-offer cliffs.</p>`,
    },
    {
      h2: `Step two: quantify the leak with the percentage reaching each point`,
      html: `<p>A curve shows you shape; you also need the count. Use the <strong>percentage of viewers who reach any point</strong> to put hard numbers on the drop. Read the percentage just before a cliff and just after it, and the difference is the share of viewers lost at that exact spot. Read the percentage at your offer timestamp and you have the share who hear the pitch at all.</p><p>This step turns "there's a drop around here" into "I lose this specific percentage of viewers at this specific second, and only this percentage reach the offer." That precision is what lets you compare leaks and decide which one is worth fixing first. Eyeballing a curve is a guess; reading the percentage at the timestamps that matter is a measurement.</p>`,
    },
    {
      h2: `Step three: connect the leak to conversions`,
      html: `<p>The last step closes the loop. Knowing where viewers leave is only half the picture; you also need to know whether the viewers who <em>do</em> reach the offer actually act. Use <strong>conversion and CTA tracking</strong> to tie the offer moment to the click, the sign-up, or the booked call that follows.</p><p>This separates two very different problems that look identical from the dashboard. If lots of people reach the offer but few convert, the leak is the offer or the page after it — not the video's middle. If few people reach the offer in the first place, the leak is the drop-off before it, and your conversion rate among the survivors might be perfectly healthy. You cannot tell which without connecting reach to action, and the fix is completely different in each case.</p>`,
    },
    {
      h2: `Putting the method together with numbers`,
      html: `<p>Here is the full method on one example. The figures are <strong>hypothetical and illustrative</strong>, not VidaPulse data or a promise of results.</p><p class="kb-example">Suppose 1,000 people press play. The retention curve shows a steep cliff at the two-minute mark, where the percentage reaching that point falls from 70% to 40% — so 300 viewers are lost at one spot. The offer begins at five minutes, and only 25% are still there, so 250 reach the pitch. Conversion tracking shows that of those 250, a healthy 14% act. The diagnosis is clear: the offer and page are fine; the leak is the cliff at two minutes that drains 300 viewers before they ever get close to the ask. That single section is where your recoverable revenue is.</p><p>That is the whole method: read the curve for the steepest pre-offer drop, quantify it with the percentage reaching each point, and use conversion tracking to confirm whether the leak is reach or the offer itself.</p>`,
    },
  ],
  solve: `<p>VidaPulse gives you the three views this method needs, on your real video. You paste your existing video URL from wherever it already lives (YouTube, Amazon S3, Google Drive, Dropbox, OneDrive, Azure Blob, Loom, a Zoom recording, Vimeo, or a direct MP4 or HLS file), VidaPulse wraps it in an analytics player, and you embed one line of script or a script-free iframe on your page. No re-hosting, no re-uploading, and no personal data collected.</p><p>To find the leak in your funnel:</p><ul class="kb-list"><li>Read the <strong>audience-retention curve</strong> to spot the steepest drops before your offer, and on Pro use the <strong>second-by-second engagement heatmap</strong> to pin the exact line where viewers leave.</li><li>Use the <strong>percentage of viewers who reach any point</strong> to quantify each drop and the share who reach the offer.</li><li>Connect the offer moment to action with <strong>conversion and CTA tracking</strong> (Pro) to tell a reach problem from an offer problem.</li><li>On Pro, use <strong>viewer-level session history</strong> and <strong>segmentation</strong> to check whether your most valuable viewers — say, those from a particular source — leak at a different spot than the rest.</li></ul><p>Because the analytics live in the embedded player, you find the leak on the real page where your funnel runs, with <strong>source attribution</strong> showing which traffic feeds the leaky video. Create a free VidaPulse account, wrap your own video, and locate the exact point where your funnel is losing buyers.</p>`,
  faq: [
    {
      q: `Where is the revenue leak usually in a video funnel?`,
      a: `Inside the video, before the offer. Page analytics show landings and clicks but cannot see the video's timeline, so they miss the most common leak: viewers who press play and leave mid-video before reaching the pitch. The steepest drop in the retention curve before the offer is usually where the most recoverable revenue is.`,
    },
    {
      q: `How do I tell a reach problem from an offer problem?`,
      a: `Connect the offer moment to action with conversion tracking. If few viewers reach the offer, the leak is the drop-off before it. If many reach the offer but few convert, the leak is the offer or the page after it. They look identical on a dashboard but need opposite fixes, so you must measure both reach and the conversion rate among those who reach the offer.`,
    },
    {
      q: `Do I need to re-upload my video to find leaks?`,
      a: `No. VidaPulse wraps your existing video URL in an analytics player wherever the video already lives, so there is no re-hosting or re-uploading. You add one line of script or a script-free iframe to your page, and the retention curve, percentage reaching each point, and conversion tracking run on the real funnel.`,
    },
  ],
};
