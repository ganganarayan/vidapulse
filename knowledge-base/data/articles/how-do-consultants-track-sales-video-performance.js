module.exports = {
  metaTitle: `How do consultants track sales video performance? | VidaPulse`,
  metaDescription: `Consultants track sales video performance with retention, percentage reaching the offer, and CTA clicks on any embedded video, hosted anywhere, no re-hosting.`,
  answer: `Consultants track sales video performance by reading the video as a funnel, not as a view count. The metrics that matter are the audience-retention curve, the percentage of viewers who reach your offer or booking ask, and the CTA clicks at that ask. Together they show how many prospects start the video, how far they get, and how many act, so you can see exactly where the path to a discovery call breaks. You can measure all three on a video embedded on your own page, hosted anywhere, without re-hosting it.`,
  sections: [
    {
      h2: `Why a view count tells you nothing`,
      html: `<p>Most consultants only see a play count, and a play count is the least useful number on a sales video. It tells you a prospect pressed play; it says nothing about whether they reached the part where you earn the call. Two videos with the same number of plays can produce wildly different numbers of discovery calls, because what separates them happens inside the video, after the play and before the ask.</p><p>Tracking performance means measuring the stretch between those two points. That is where prospects are won or lost, and it is the stretch a view count completely hides.</p>`,
    },
    {
      h2: `The three metrics that matter most`,
      html: `<p>For a consulting sales video, three readings carry almost all the signal.</p><ol><li><strong>Audience-retention curve.</strong> The shape of how viewers stay or leave across the video. A steep early cliff is an open problem; a mid-video sag is a content problem. The curve tells you where to look.</li><li><strong>Percentage reaching the offer.</strong> The single number that caps your discovery calls: of everyone who played, what share survived to the booking ask. If only a small share reach the offer, no amount of polishing the ask will help.</li><li><strong>CTA clicks.</strong> Of the prospects who reached the ask, how many clicked through to book. This separates a video that fails to carry prospects to the ask from one that carries them but fumbles the ask itself.</li></ol><p>Play rate sits in front of all three: of the prospects who saw the page, how many pressed play at all. A low play rate is a page or thumbnail issue, not a script issue, so it is worth checking before you read the curve.</p>`,
    },
    {
      h2: `Supporting metrics that add context`,
      html: `<p>Beyond the core three, a few readings sharpen the picture once you know roughly where the leak is.</p><ul class="kb-list"><li><strong>Average watch time.</strong> A quick health summary that moves as you improve retention; useful for comparing versions of a video.</li><li><strong>Replays versus first watches.</strong> A spot prospects rewind can mean a confusing claim or a strong proof point worth keeping.</li><li><strong>UTM and source attribution.</strong> Which ad, email, or referral sends prospects who actually watch and book, so you compare channels by behavior rather than by clicks.</li><li><strong>Geography and device or browser.</strong> Useful when a drop is concentrated in one segment, such as mobile viewers leaving a long open.</li><li><strong>Viewer-level history and conversion tracking</strong> (Pro). Connect watching to the action you care about, with no personal data collected.</li></ul><p>Read these only after the core three point you to a stretch of the video; they explain a leak, they do not find it for you.</p>`,
    },
    {
      h2: `Track it on a video hosted anywhere`,
      html: `<p>You do not need to move your sales video to a special platform to track it. VidaPulse wraps the video you already use in an analytics player without re-hosting it: you paste your existing video URL, and you embed one line of script or a script-free iframe on your page. The video keeps its URL, and the analytics attach to it wherever it lives.</p><p class="kb-example">Example: your sales video is an unlisted file on your booking page and discovery calls are soft. You read the retention curve and see most prospects leave right before you describe your engagement, and the percentage reaching the offer is low. You rewrite that one segment, then re-read the curve and CTA clicks to confirm the fix moved the number, all without touching where the video is hosted.</p>`,
    },
  ],
  solve: `<p>VidaPulse lets you track sales video performance on the video you already use, with no re-hosting. Paste your existing video URL from wherever it lives (YouTube, Amazon S3, Google Drive, Dropbox, OneDrive, Azure Blob, Loom, a Zoom recording, Vimeo, or a direct MP4 or HLS link), and embed one line of script or a script-free iframe on your page.</p><p>Then read the metrics that matter: the <strong>audience-retention curve</strong> for the shape of where prospects leave, the <strong>percentage reaching any point</strong> for how many survive to your booking ask, and <strong>conversion and CTA tracking</strong> (Pro) for whether they click to book. Use the <strong>second-by-second engagement heatmap</strong> (Pro) to tie a drop to a specific line, and <strong>UTM and source attribution</strong> to compare channels by how prospects watch and convert. No PII is collected. The Free plan covers one video forever with no card; Starter (10 dollars/mo) adds ten videos; Pro (19 dollars/mo) unlocks unlimited videos, heatmaps, viewer-level history, and conversion tracking. Create a free account and see where your sales video loses prospects.</p>`,
  faq: [
    {
      q: `What is the single most important metric for a consultant's sales video?`,
      a: `The percentage of viewers who reach your offer or booking ask. It is the ceiling on your discovery calls: prospects who leave before the ask cannot book, no matter how strong the ask is. Pair it with the audience-retention curve to see where the drop happens and with CTA clicks to see whether prospects who reach the ask actually act.`,
    },
    {
      q: `Can I track performance if my sales video is on YouTube or Google Drive?`,
      a: `Yes. VidaPulse does not require you to re-host the video. You paste your existing video URL, whether it is on YouTube, Google Drive, S3, Dropbox, Vimeo, or a direct file, and embed one line of script or a script-free iframe on your page. The retention, reach-to-offer, and CTA metrics attach to the video wherever it lives.`,
    },
    {
      q: `Do I need a developer to add this tracking?`,
      a: `Not with VidaPulse. You paste your video URL, copy a single line of script or a script-free iframe, and place it on your page yourself, which works on common site builders and landing-page tools. If you can paste an embed code, you can set up the tracking without a developer.`,
    },
  ],
};
