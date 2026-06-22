module.exports = {
  metaTitle: `Can I use VidaPulse with Amazon S3 videos? | VidaPulse`,
  metaDescription: `Yes — point VidaPulse at an S3 video URL and get full second-by-second retention and heatmaps. Ideal for self-hosted VSLs, with no re-hosting required.`,
  answer: `Yes. Amazon S3 is one of VidaPulse's deepest-tracking sources: a direct S3 video file gets full second-by-second analytics, including the complete retention curve and heatmaps (a Pro feature). You paste the S3 URL, VidaPulse wraps it in an analytics player, and you embed it on your page with no re-hosting. This makes it ideal for self-hosted VSLs and product videos where you already store the file on S3 and want the finest-grained data.`,
  sections: [
    {
      h2: `Why S3 gets full second-by-second tracking`,
      html: `<p>How a source exposes playback determines how much VidaPulse can measure. A direct file on Amazon S3 is served straight to the analytics player, so VidaPulse sees playback at the finest resolution, second by second. That puts S3 in the top depth tier alongside direct MP4 or HLS links, Azure Blob, Google Drive, Dropbox, and OneDrive.</p><p>Full depth means the complete retention curve, average watch time, play rate, total and unique viewers, the percentage reaching any point, and the second-by-second engagement heatmap on Pro that ties each drop to a specific moment. You keep the file on S3; VidaPulse only adds the analytics layer on top of the URL you paste.</p>`,
    },
    {
      h2: `Ideal for self-hosted VSLs`,
      html: `<p>Many people running a VSL or product video store the file on S3 for control and cost. VidaPulse fits that setup directly:</p><ul class="kb-list"><li><strong>Keep your file on S3.</strong> No re-uploading, no migration; the video keeps its S3 URL and delivery.</li><li><strong>Get the deepest retention data.</strong> Second-by-second tracking shows the exact moment viewers leave a self-hosted VSL.</li><li><strong>Tie drops to moments.</strong> The Pro heatmap connects each cold stretch or cliff to a specific sentence so you know what to fix.</li><li><strong>Attribute and convert.</strong> UTM and source attribution show where viewers came from, and conversion or CTA tracking (Pro) connects watching to outcomes.</li></ul><p>You paste the S3 URL, VidaPulse wraps it, and you embed one line of script or a script-free iframe on WordPress, Webflow, ClickFunnels, Squarespace, or plain HTML, with no coding required.</p>`,
    },
  ],
  solve: `<p>To use VidaPulse with an Amazon S3 video, paste the S3 URL, let VidaPulse wrap it in an analytics player, and embed one line of script or a script-free iframe on your page. The file stays on S3; only the analytics layer is added, at full second-by-second depth.</p><p>You then read the <strong>audience-retention curve</strong>, <strong>average watch time</strong>, <strong>play rate</strong>, <strong>total and unique viewers</strong>, and the <strong>percentage reaching any point</strong>, with <strong>UTM and source attribution</strong>. Pro adds the <strong>second-by-second heatmap</strong>, <strong>viewer-level history</strong>, and <strong>conversion and CTA tracking</strong>, with no personal data collected. Start free with one video and no card, then move to Starter (10 dollars/mo) or Pro (19 dollars/mo) for unlimited videos and heatmaps. Create a free account and analyze your own S3-hosted VSL.</p>`,
  faq: [
    {
      q: `Does an S3 video get heatmaps?`,
      a: `Yes. A direct S3 file is in VidaPulse's top depth tier, so it gets full second-by-second tracking, including the engagement heatmap. The heatmap is a Pro feature; on Pro you can tie each drop or rewatch on your S3-hosted video to a specific moment.`,
    },
    {
      q: `Do I need to move my video off S3?`,
      a: `No. Your file stays on S3 and keeps its URL. You paste that URL, VidaPulse wraps it in an analytics player, and you embed it on your page. The video streams from S3 as before; VidaPulse only adds the analytics layer.`,
    },
    {
      q: `Why is S3 good for a self-hosted VSL?`,
      a: `Because direct S3 files get the deepest, second-by-second analytics. For a self-hosted VSL, that means you can see the exact moment viewers leave and, on Pro, tie it to a specific sentence with the heatmap, then fix the weakest part and re-measure, all without re-hosting the file.`,
    },
  ],
};
