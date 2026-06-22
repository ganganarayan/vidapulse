module.exports = {
  metaTitle: `Why is my VSL not converting? | VidaPulse`,
  metaDescription: `Most VSLs fail because viewers leave before they reach the offer, not because of price. Learn the real cause and how to diagnose it with a retention curve.`,
  answer: `Your VSL almost never fails because of the offer or the price. It fails because most viewers leave before they ever reach the offer. "Views but no sales" is a retention problem, not a traffic problem: people press play, drop off silently in the first seconds or the mid-video lull, and never hear the pitch. You cannot fix what you cannot see, so the first step is measuring exactly where viewers leave with a second-by-second retention curve.`,
  sections: [
    {
      h2: `The real cause: silent drop-off, not a weak offer`,
      html: `<p>When a VSL underperforms, the instinct is to blame the offer, the price, or the guarantee. Those are usually the last things wrong. The honest answer is simpler and harder to accept: most of your viewers leave long before the offer ever appears on screen.</p><p>The drop-off is silent. Nobody emails to say they quit at the 90-second mark. They just close the tab. From your side it looks like traffic that "didn't convert," when in reality most of that traffic never reached the part of the video that asks for the sale. A weak first 10 seconds and a soft mid-video stretch lose more sales than any pricing decision.</p>`,
    },
    {
      h2: `The three predictable leak points`,
      html: `<p>Across VSLs, viewers tend to leave at the same three places. Find which one is hurting you most and you have found your highest-leverage fix.</p><ul class="kb-list"><li><strong>The first seconds.</strong> If your opening does not immediately confirm the viewer is in the right place, a large share quit before you have said anything. This is the biggest single leak in most VSLs.</li><li><strong>The mid-video lull.</strong> After the hook lands, energy sags. Backstory runs too long, the promise gets vague, and viewers who were interested quietly drift away before the proof and the pitch.</li><li><strong>Right before the price.</strong> A smaller, sharper drop happens just as you transition to the offer. Some of this is natural, but a steep cliff here means the value was not built well enough to justify what comes next.</li></ul>`,
    },
    {
      h2: `"Views but no sales" is a retention problem`,
      html: `<p>It is tempting to read flat sales as a traffic problem and respond by buying more clicks. But if viewers are not reaching your offer, more traffic just means more people leaving at the same spot. You scale the leak instead of fixing it.</p><p class="kb-example">Example: Say 1,000 people press play. If only 200 are still watching when you reveal the offer, then 800 sales were lost to the video itself, not to the price. Doubling your traffic to 2,000 plays without fixing retention simply loses 1,600 the same way.</p><p>The number that matters is not how many people arrive. It is what percentage of them actually reach the offer. Until you know that, every other optimization is guesswork.</p>`,
    },
    {
      h2: `How to diagnose it: the retention curve and heatmap`,
      html: `<p>You diagnose a VSL the way a doctor reads a chart, not by guessing. Two views tell you almost everything.</p><ul class="kb-list"><li><strong>The audience-retention curve</strong> shows what share of viewers are still watching at each moment. Steep cliffs mark your leak points. A wall at the start means the hook is failing; a long slow slide means the middle drags.</li><li><strong>The second-by-second engagement heatmap</strong> shows which exact moments hold attention and which get skipped or abandoned, so you can tie a drop to a specific sentence or section.</li></ul><p>With both, you stop debating opinions and start reading evidence. You can see whether anyone even reaches the offer, and which 20 seconds are doing the most damage.</p>`,
    },
  ],
  solve: `<p>VidaPulse turns "I think my VSL is fine" into "I can see exactly where it breaks." You paste your existing VSL URL from wherever it already lives (YouTube, S3, Google Drive, Dropbox, Vimeo, a direct MP4, and more), VidaPulse wraps it in an analytics player, and you embed one line of script or a script-free iframe on your page. There is no re-hosting and no re-uploading.</p><p>Once it is live, you diagnose the drop-off directly:</p><ul class="kb-list"><li>Watch the <strong>audience-retention curve</strong> to find the exact moments viewers leave.</li><li>Read the <strong>second-by-second engagement heatmap</strong> (Pro) to tie each drop to a specific section or sentence.</li><li>See the <strong>percentage of viewers who reach the offer</strong> using the metric for what share of people get to any point in the video.</li><li>Check <strong>average watch time</strong>, <strong>play rate</strong>, and <strong>replays vs first-time watches</strong> to confirm what the curve is telling you.</li></ul><p>Then rewrite the single weakest section first, usually the first seconds or the mid-video lull, republish, and watch the curve again. You can start free: create a VidaPulse account, wrap your own VSL, and see where your viewers actually leave before you touch the offer or the price.</p>`,
  faq: [
    {
      q: `Should I fix my offer or my video first?`,
      a: `Fix the video first. If most viewers leave before the offer appears, no amount of offer tuning will help. Use a retention curve to confirm what percentage actually reach the pitch, then improve the offer once people are getting there.`,
    },
    {
      q: `My VSL gets plenty of views but no sales. Is that a traffic problem?`,
      a: `Usually not. Views but no sales almost always means viewers are leaving before the offer. More traffic just scales the same leak. Diagnose where people drop off, fix that section, then add traffic.`,
    },
    {
      q: `Do I have to move my video to use VidaPulse?`,
      a: `No. VidaPulse wraps your existing video wherever it already lives and gives you an embed line or iframe. Your video stays put, and you keep the same URL.`,
    },
  ],
  related: ['how-to-find-video-drop-off-points', 'why-viewers-leave-in-the-first-3-seconds', 'how-to-improve-vsl-retention'],
};
