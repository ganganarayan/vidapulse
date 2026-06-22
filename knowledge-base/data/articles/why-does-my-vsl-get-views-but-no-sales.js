'use strict';

module.exports = {
  metaTitle: `Why does my VSL get views but no sales? | VidaPulse`,
  metaDescription: `Your VSL gets views but no sales because views are not watches. Most viewers never reach the pitch. See the percentage who get to your offer.`,
  answer: `Your VSL gets views but no sales because a view is not a watch. A view means someone pressed play; it says nothing about how far they got. In most VSLs the majority of viewers leave long before the pitch, so the offer never reaches them at all. That makes this a retention problem, not a traffic problem, and the number to check is the percentage of viewers who actually reach the moment you make the offer.`,
  sections: [
    {
      h2: `A view is not a watch`,
      html: `<p>The word "view" is doing a lot of quiet damage to how you read your numbers. A view is counted the instant someone presses play, or sometimes the instant the page loads. It tells you that a person arrived. It tells you nothing about whether they stayed for ten seconds or ten minutes.</p>
<p>This is why a VSL can show thousands of views and almost no sales without any contradiction. The views are real; the watches are not what you assumed. When you look at a flat view count, you are seeing the size of the audience that started, not the size of the audience that finished, and a VSL only sells to the audience that finishes.</p>
<p class="kb-example">Hypothetical illustration: a VSL with 4,000 views could have nearly everyone watch to the pitch, or it could lose three out of four viewers in the first thirty seconds. The view count reads 4,000 in both cases. Only a retention measure can tell the two apart, and they are completely different businesses.</p>`,
    },
    {
      h2: `Most viewers never reach the pitch`,
      html: `<p>In a typical VSL the audience drains steadily, and the offer usually lives in the back third of the runtime. Put those two facts together and the conclusion is uncomfortable: by the time you make the ask, a large share of the people who pressed play are already gone. They did not reject your offer. They never heard it.</p>
<p>This reframes "no sales" entirely. If only a small fraction of viewers are present when the call to action appears, then your conversion rate is being computed against the wrong denominator. You are not losing people at the offer; you are losing them on the way to it. The pitch can be excellent and still produce nothing, because excellence does not matter to an empty room.</p>
<p>So the first question is not "is my offer good enough?" It is "how many people are even there to hear it?" Until you know that number, you are guessing.</p>`,
    },
    {
      h2: `It is a retention problem, not a traffic problem`,
      html: `<p>The instinct when sales are flat is to buy more traffic. More clicks, more views, a bigger top of the funnel. But if the video leaks badly, more traffic just pours more people into the same holes. You pay for views that never become watches, and the sales line barely moves.</p>
<p>The leak is the video itself, not the traffic source. When viewers arrive from an ad or a link and leave within seconds, the problem is rarely that the wrong people came; it is that the video did not hold the right ones. Doubling spend on a video that loses most viewers before the pitch is the most expensive way to stay flat.</p>
<ul class="kb-list"><li><strong>Traffic problem:</strong> the wrong people are arriving, or too few are arriving at all.</li>
<li><strong>Retention problem:</strong> the right people arrive, press play, and leave before the offer. This is the far more common cause of views-but-no-sales.</li></ul>
<p>Fix the leak first. A video that holds viewers turns the traffic you already have into watches, and watches are what can become sales.</p>`,
    },
    {
      h2: `Check the percentage who reach the offer`,
      html: `<p>There is one number that cuts through all of this: the percentage of viewers still watching at the second your offer or call to action begins. It converts a vague worry into a concrete figure you can act on.</p>
<ol><li><strong>Find the offer timestamp.</strong> Note the exact second your pitch, price, or call to action starts.</li>
<li><strong>Read the retention curve at that point.</strong> The audience-retention curve plots the share of viewers still present at every second. Read its value at the offer timestamp.</li>
<li><strong>Interpret the gap.</strong> If that share is small, your problem is upstream of the offer. Most of your traffic is leaving before they ever reach the ask, and no change to the offer wording will help the people who are already gone.</li></ol>
<p>This single reading tells you where to look. A low percentage at the offer means the work is in retention: hold more viewers so more of them arrive at the pitch. A healthy percentage at the offer with still-flat sales points instead at the offer or call to action itself. Either way, you now know which problem you actually have.</p>`,
    },
    {
      h2: `What to do with that number`,
      html: `<p>Once you know how many viewers reach the offer, the next move is to raise that number, then re-check sales. The reliable way to do that is to find where viewers leave and fix the biggest drop first.</p>
<ol><li><strong>Find the steepest drops.</strong> Read the retention curve for the sharpest cliffs in front of the offer. Those are where you are bleeding the viewers who would otherwise reach the pitch.</li>
<li><strong>Confirm the exact second.</strong> Use a second-by-second engagement heatmap to pin the drop to a specific line or moment, so you fix the real cause and not a guess.</li>
<li><strong>Change one thing and re-measure.</strong> Rewrite or cut that one section, republish, and compare the new curve and the new offer-reach percentage against the old. If more viewers now reach the offer, you have moved the number that matters.</li></ol>
<p>Repeat on the next biggest drop. As the percentage reaching the offer climbs, you give your pitch the one thing it has been missing: an audience that is still there to hear it.</p>`,
    },
  ],
  solve: `<p>VidaPulse exists to turn "views but no sales" into a number you can act on. You paste your existing video URL from wherever it already lives (YouTube, Amazon S3, Google Drive, Dropbox, OneDrive, Azure Blob, Loom, a Zoom recording, Vimeo, or a direct MP4/HLS link), VidaPulse wraps it in an analytics player, and you embed it with one line of script or a script-free iframe. There is no re-hosting; your VSL keeps its URL and stays exactly where it is.</p>
<p>From there you stop reading views and start reading watches:</p>
<ul class="kb-list"><li>The <strong>percentage of viewers who reach any point</strong> tells you exactly how many make it to your offer, so you know whether the problem is before the pitch or at it.</li>
<li>The <strong>audience-retention curve</strong> shows the steepest drops in front of the offer, so you fix the leaks costing you the most reach.</li>
<li>The <strong>second-by-second engagement heatmap</strong> (Pro) pins each drop to the exact second, so you change the real cause.</li>
<li><strong>Play rate</strong>, <strong>average watch time</strong>, and <strong>replays vs first-time watches</strong> confirm the picture as you go.</li></ul>
<p>No personal data is collected. To start, create a free VidaPulse account, wrap your own VSL, and read the percentage of viewers who reach your offer before you spend another dollar on traffic.</p>`,
  faq: [
    {
      q: `Why does my VSL have lots of views but no sales?`,
      a: `Because a view only means someone pressed play, not that they watched to your offer. In most VSLs the majority of viewers leave before the pitch ever appears, so the offer reaches only a fraction of the audience the view count implies. Check the percentage of viewers still watching at the second your call to action begins; if that share is small, the problem is retention, not traffic.`,
    },
    {
      q: `Should I buy more traffic to get more sales?`,
      a: `Not before you check retention. If your video loses most viewers before the offer, more traffic just pours more people into the same leak, and you pay for views that never become watches. Fix the biggest drops first so the traffic you already have actually reaches the pitch, then scale spend once the video holds.`,
    },
    {
      q: `How do I know if the problem is my offer or my video?`,
      a: `Read the percentage of viewers still watching at the offer timestamp. If that number is low, most people never hear the offer and the problem is upstream retention. If a healthy share reaches the offer and sales are still flat, the issue is more likely the offer or call to action itself. The percentage who reach the offer tells you which one to work on.`,
    },
  ],
};
