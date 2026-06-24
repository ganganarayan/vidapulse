module.exports = {
  metaTitle: `How do coaches track which ads bring buyers? | VidaPulse`,
  metaDescription: `Coaches track which ads bring buyers by tagging the VSL with UTM and source attribution, then seeing which source watches to the offer and converts.`,
  answer: `Coaches track which ads bring buyers by measuring what each source does on the VSL itself, not just how many clicks it sent. With UTM and source attribution on the video, you can see which source actually watches to the offer and converts, instead of which one looks busy in the dashboard. The video is where the buying decision happens, so it is where you read the truth: a source that sends many viewers who all leave before the ask is not bringing buyers, whatever the click count says.`,
  sections: [
    {
      h2: `Clicks and plays are not buyers`,
      html: `<p>A source that delivers a flood of clicks can feel like your best performer while booking almost nothing. Clicks tell you a prospect arrived; plays tell you they pressed play; neither tells you whether they stayed, reached your offer, or booked a call. Two sources can send the same number of plays and produce completely different numbers of clients.</p><p>The reason is that traffic quality shows up inside the video, not at the click. Some sources send curious browsers who bounce in the first seconds, and some send qualified prospects who watch deep and book. From the click count alone these look identical. To tell them apart you have to follow each source into the VSL and watch how its viewers behave, all the way to the booking ask.</p>`,
    },
    {
      h2: `Tag the VSL with UTM and source attribution`,
      html: `<p>The fix is to attach UTM parameters or source attribution to the traffic that reaches your VSL, so every play carries a label for where it came from. Once each viewer is tagged by source, you can split your retention and conversion data by source and compare them on equal terms.</p><p>This turns a vague sense of "that campaign feels good" into a side-by-side comparison. For each source you can read how many viewers it sent, how far those viewers watched, what share reached your booking ask, and how many clicked to book. The source that produces buyers becomes obvious because its viewers behave differently inside the video, not because it produced the most clicks.</p><p>Worth being clear: this is video analytics, not an ads tool. VidaPulse does not run, buy, or manage your campaigns. It reads what each source does once the prospect lands on your VSL, so you can judge sources by the watching and booking they produce.</p>`,
    },
    {
      h2: `Read which source watches to the offer and converts`,
      html: `<p>With sources tagged, the question stops being "which ad got clicks" and becomes "which source sends prospects who reach my offer and book." That is the number that maps to buyers.</p><p class="kb-example">Hypothetical illustration, not real data: imagine two sources send roughly the same number of plays to your VSL. Source A's viewers mostly drop off in the first half and almost none reach the booking ask. Source B's viewers watch deep, most reach the ask, and a healthy share click to book. By click count the two look similar, but source B is the one bringing buyers. Attribution on the video makes that difference visible, so you can lean into source B and rework or drop source A.</p><ul class="kb-list"><li><strong>Compare reach-to-offer by source.</strong> The source whose viewers reach the booking ask is sending qualified prospects.</li><li><strong>Compare CTA clicks by source.</strong> Reaching the ask and clicking to book is the closest signal to a buyer.</li><li><strong>Ignore raw play counts in isolation.</strong> Volume without depth is not buyers.</li></ul>`,
    },
    {
      h2: `The video is the leak, not the ad`,
      html: `<p>Attribution sometimes reveals the opposite problem: a good source is being wasted by the video. If a source sends qualified prospects who watch deep but still leave at a specific point before the ask, the source is fine and the VSL is the leak. You would have blamed the campaign and never found the real cause.</p><p>Reading source data and the retention curve together separates the two questions. If a source's viewers leave early across the board, the source is sending the wrong people. If they watch deep then drop at one section, the video is losing buyers a good source delivered. Either way you are fixing the right thing: the targeting when the source is poor, the script when the video is poor. The point is that the buying decision plays out on the video, so the video is where you diagnose which sources truly bring buyers and where you are losing the ones they send.</p>`,
    },
  ],
  solve: `<p>VidaPulse lets you see which source brings buyers by reading what each one does on the video you already use, with no re-hosting. You paste your existing video URL from wherever it lives (YouTube, Amazon S3, Google Drive, Dropbox, OneDrive, Azure Blob, Loom, a Zoom recording, Vimeo, or a direct MP4 or HLS link), VidaPulse wraps it in an analytics player, and you embed one line of script or a script-free iframe on your page.</p><p>Then you judge sources by buying behavior, not clicks:</p><ul class="kb-list"><li>Use <strong>UTM and source attribution</strong> to label every play by where it came from.</li><li>Split the <strong>audience-retention curve</strong> by source to compare how deep each one's viewers watch.</li><li>Check the <strong>percentage reaching any point</strong> by source to see who reaches the booking offer.</li><li>Turn on <strong>conversion and CTA tracking</strong> to compare booked-call clicks by source.</li><li>Use <strong>viewer-level history</strong> (Pro) to follow individual prospects from a source through the video.</li></ul><p>This is analytics, not an ads platform: VidaPulse reads what happens on your VSL and never runs your campaigns. The Free plan covers one video forever with no card; Starter (ten dollars a month) adds ten videos; Pro (nineteen dollars a month) unlocks unlimited videos, the second-level heatmap, viewer-level history, segmentation, and conversion tracking. No PII is collected. Create a free VidaPulse account and see which source watches your VSL to the offer.</p>`,
  faq: [
    {
      q: `Can VidaPulse tell me which ad to run?`,
      a: `It is not an ads tool and does not run or manage campaigns. What it does is show which source, tagged by UTM, sends prospects who actually watch your VSL to the offer and click to book. You still run your ads elsewhere; VidaPulse tells you which source produces buying behavior on the video so you can decide where to lean in.`,
    },
    {
      q: `My best ad gets the most clicks but few clients. Why?`,
      a: `Because clicks are not buyers. A high-click source can send curious browsers who leave the VSL early and never reach your offer. Tag the video by source and compare reach-to-offer and CTA clicks per source; you will often find a quieter source whose viewers watch deep and book at a far higher rate.`,
    },
    {
      q: `How is this different from my ad platform's reporting?`,
      a: `Ad platforms report on the click and the landing, but the buying decision happens later, inside the VSL. VidaPulse reads what each source's viewers do on the video itself, from how far they watch to whether they reach and click the booking ask, which is where the difference between traffic and buyers actually shows up.`,
    },
  ],
};
