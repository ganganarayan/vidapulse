module.exports = {
  metaTitle: `How to get video heatmaps without Wistia | VidaPulse`,
  metaDescription: `You can get second-by-second video heatmaps without a hosting platform. VidaPulse adds them to a video you host anywhere, with no re-hosting, on its Pro plan.`,
  answer: `You do not need a hosting platform like Wistia to get a video heatmap. VidaPulse adds a second-by-second engagement heatmap to a video you already host anywhere, with no re-hosting. You point it at your video's existing URL on a supported source, embed one line of script or a script-free iframe, and the heatmap is available on the Pro plan. The honest framing is that Wistia bundles heatmaps with hosting and a branded player; VidaPulse gives you just the heatmap on the video you already have, which is cheaper if hosting is not what you needed.`,
  sections: [
    {
      h2: `What a video heatmap actually shows`,
      html: `<p>A heatmap turns "people stop watching somewhere" into "people stop watching here." Instead of a single average, it shows engagement second by second across the timeline, so you can see which exact moments hold attention and which lose it.</p><p>That detail is what makes a heatmap worth wanting. A retention curve tells you the shape of the drop; the heatmap lets you scrub to the precise second a chunk of your audience left, so you can look at what is on screen at that moment and fix it. Nothing about that insight requires the video to be hosted on the same tool that draws the heatmap.</p>`,
    },
    {
      h2: `Why you do not need Wistia for it`,
      html: `<p>Heatmaps are often associated with Wistia because Wistia is a complete platform: it hosts your file, serves it through a branded player, and draws the heatmap on top. That bundle is genuinely useful if you want all of it.</p><p>But the heatmap itself is an analytics feature, not a hosting feature. Measuring engagement across a timeline only needs the player to report playback events; it does not need to own the file. So if the only reason you were looking at Wistia is the heatmap, you are considering a hosting platform to get an analytics result, which is more than the job requires.</p>`,
    },
    {
      h2: `Getting a heatmap on a video hosted anywhere`,
      html: `<p>VidaPulse provides the heatmap as an analytics layer over a video you host yourself. The setup is short and nothing is uploaded to VidaPulse.</p><ol><li>Make sure your video is on a supported source: YouTube, Vimeo, Amazon S3, Google Drive, Dropbox, OneDrive, Azure Blob, Loom, a Zoom recording, or a direct MP4 or HLS file. Direct files and S3 get full second-by-second tracking.</li><li>Paste that video URL into VidaPulse, which wraps it in an analytics player.</li><li>Embed it with one line of script or a script-free iframe where the video should appear.</li><li>Open the Pro plan to view the second-by-second engagement heatmap once traffic has flowed.</li></ol><p class="kb-example">Example: your sales video plays from S3 on your landing page. You point VidaPulse at the S3 URL, swap the embed, and on Pro you watch the heatmap reveal a steep cooling-off right before your offer.</p>`,
    },
    {
      h2: `Read the heatmap, then act`,
      html: `<p>A heatmap is only useful if it changes what you do. Read it in this order to turn the picture into a fix.</p><ul class="kb-list"><li><strong>Find the coldest stretch.</strong> Scrub to where engagement falls off most and watch exactly what is on screen there.</li><li><strong>Check the moment before your offer.</strong> Use the <strong>percentage reaching any point</strong> to see how many viewers even get to your call to action.</li><li><strong>Tie it to outcomes.</strong> With <strong>conversion or CTA tracking</strong> on Pro, connect the moments people watch to the actions they take, and use <strong>UTM and source attribution</strong> to see which traffic watches longest.</li></ul><p>Then change the weakest moment first and watch the heatmap again. All of this works on the video where it already lives, and no personal data is collected.</p>`,
    },
  ],
  solve: `<p>To get a second-by-second heatmap without a hosting platform, keep your video where it is and add VidaPulse on top. Host it on YouTube, Amazon S3, Google Drive, Dropbox, OneDrive, Azure Blob, Loom, a Zoom recording, Vimeo, or a direct MP4 or HLS file, paste that URL into VidaPulse, and embed one line of script or a script-free iframe.</p><p>You get the <strong>retention curve</strong> and <strong>percentage reaching any point</strong> on every plan, and the <strong>second-by-second engagement heatmap</strong>, <strong>viewer-level history</strong>, and <strong>conversion tracking</strong> on Pro. The Free plan covers one video forever with no card; Starter (ten dollars per month) adds ten videos; Pro (nineteen dollars per month) unlocks unlimited videos plus the heatmap. Start free and track your video where it already lives, then upgrade to Pro when you want the heatmap detail.</p>`,
  faq: [
    {
      q: `Can I get a video heatmap without hosting on Wistia?`,
      a: `Yes. A heatmap is an analytics feature, not a hosting one, so you do not need a hosting platform to get it. VidaPulse adds a second-by-second engagement heatmap to a video you already host on a supported source, with no re-hosting. The heatmap is on the Pro plan, and the video keeps living wherever it is now.`,
    },
    {
      q: `Which plan includes the heatmap?`,
      a: `The second-by-second engagement heatmap is a Pro feature. Pro is nineteen dollars per month and also unlocks unlimited videos, viewer-level history, and conversion or CTA tracking. The Free plan (one video, no card) and Starter (ten dollars per month, ten videos) include the retention curve and percentage reaching any point, but the detailed heatmap is on Pro.`,
    },
    {
      q: `Does the heatmap work on a YouTube or S3 video?`,
      a: `Yes. As long as the video is on a supported source, VidaPulse can build the heatmap over it. Direct files and Amazon S3 get full second-by-second tracking, and other sources such as YouTube and Vimeo are supported too. You paste the existing URL, embed the analytics player, and view the heatmap on Pro, with no re-hosting and no personal data collected.`,
    },
  ],
};
