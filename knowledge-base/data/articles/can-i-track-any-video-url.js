module.exports = {
  metaTitle: `Can I track any video URL? | VidaPulse`,
  metaDescription: `Yes — VidaPulse tracks videos from its supported sources: direct MP4 or HLS, S3, Azure Blob, Google Drive, Dropbox, OneDrive, YouTube, Vimeo, Loom, and Zoom.`,
  answer: `Yes, for the sources VidaPulse supports. You paste a video URL from a supported host, VidaPulse wraps it in an analytics player, and you embed it on any page with no re-hosting. The depth of analytics depends on the source: direct files and cloud storage get full second-by-second tracking, YouTube and Vimeo get close to it, and Loom or Zoom recordings get basic event-level data. The video stays exactly where it already lives.`,
  sections: [
    {
      h2: `Which video URLs you can track`,
      html: `<p>VidaPulse accepts a wide range of sources, so the URL you already have is usually one you can track. The supported sources are:</p><ul class="kb-list"><li><strong>Direct files</strong> — a hosted MP4 or HLS stream.</li><li><strong>Cloud storage</strong> — Amazon S3, Azure Blob, Google Drive, Dropbox, and OneDrive.</li><li><strong>Video platforms</strong> — YouTube and Vimeo.</li><li><strong>Recording tools</strong> — Loom and Zoom cloud recordings.</li></ul><p>In every case you keep hosting the video where it is. VidaPulse does not re-upload or re-host anything; it adds an analytics layer on top of the URL you paste, then gives you a one-line script or a script-free iframe to drop onto WordPress, Webflow, ClickFunnels, Squarespace, or plain HTML. No coding is required.</p>`,
    },
    {
      h2: `Analytics depth depends on the source`,
      html: `<p>"Track any URL" does not mean every source gives identical detail. How a platform exposes playback determines how much VidaPulse can see, so depth tiers by source:</p><ul class="kb-list"><li><strong>Full second-by-second</strong> — direct MP4 or HLS, Amazon S3, Azure Blob, Google Drive, Dropbox, and OneDrive. These give the complete retention curve and second-level heatmaps (heatmaps are a Pro feature).</li><li><strong>About 95 percent</strong> — YouTube, tracked through the player API, which captures nearly the full picture.</li><li><strong>Near-full</strong> — Vimeo, close to the depth of a direct file.</li><li><strong>Basic events</strong> — Loom is play, pause, and complete; Zoom recordings are impression-level.</li></ul><p>The practical takeaway: if you want the deepest retention and heatmap data, host the file as a direct MP4 or HLS, or on S3 or another supported cloud source. If your video already lives on YouTube or Vimeo, you still get rich, usable retention without moving it.</p>`,
    },
    {
      h2: `What you get on a tracked URL`,
      html: `<p>Once a supported URL is wrapped, you measure how people actually watch, not just that they pressed play. Across sources you can read the audience-retention curve, average watch time, play rate, total and unique viewers, and the percentage of viewers reaching any point, including your offer. You also get UTM and source attribution to see where viewers came from.</p><p>On Pro you add second-by-second heatmaps, viewer-level history, and conversion or CTA tracking. None of this collects personal data; unique viewers are counted with a first-party UUID. The richer source tiers simply give these metrics at finer resolution.</p>`,
    },
  ],
  solve: `<p>To track a video URL with VidaPulse, paste it in, and VidaPulse wraps it in an analytics player you embed with one line of script or a script-free iframe. Your video stays where it is, on YouTube, Amazon S3, Google Drive, Dropbox, OneDrive, Azure Blob, Loom, a Zoom recording, Vimeo, or a direct MP4 or HLS link. There is no migration and no second upload.</p><p>For the deepest data, point VidaPulse at a direct file or a cloud source like S3 to get full second-by-second retention and heatmaps (Pro). For a video already on YouTube or Vimeo, you still get near-complete retention without moving it. Start free with one video and no card, then upgrade to Starter (10 dollars/mo, ten videos) or Pro (19 dollars/mo, unlimited plus heatmaps, viewer-level history, and conversion tracking). Create a free account and analyze your own video URL to see exactly how it tracks.</p>`,
  faq: [
    {
      q: `Which video sources does VidaPulse support?`,
      a: `Direct MP4 or HLS files, Amazon S3, Azure Blob, Google Drive, Dropbox, OneDrive, YouTube, Vimeo, Loom, and Zoom cloud recordings. You paste the URL and embed the analytics player on any page; the video stays hosted where it already is.`,
    },
    {
      q: `Do all sources give the same level of detail?`,
      a: `No. Direct files and cloud storage (S3, Azure, Drive, Dropbox, OneDrive) get full second-by-second tracking and heatmaps. YouTube is about 95 percent via the player API, Vimeo is near-full, and Loom (play, pause, complete) and Zoom (impression-level) are more basic.`,
    },
    {
      q: `Do I need to re-host my video to track it?`,
      a: `No. VidaPulse never re-hosts your video. You keep it wherever it lives and paste the URL; VidaPulse adds the analytics layer through an embed. If you want the deepest tracking, hosting the file as a direct MP4 or HLS, or on S3, gives full second-by-second data.`,
    },
  ],
};
