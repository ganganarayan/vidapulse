module.exports = {
  metaTitle: `Does VidaPulse work with Wistia? | VidaPulse`,
  metaDescription: `VidaPulse is not a plugin inside Wistia's player. It tracks videos you embed from its supported sources — an affordable, no-re-hosting analytics alternative.`,
  answer: `Not as a plugin inside Wistia's player, and it is honest to be clear about that. VidaPulse tracks videos you embed from its own supported sources (YouTube, Vimeo, Amazon S3, Google Drive, Dropbox, OneDrive, Azure Blob, Loom, Zoom, or a direct MP4 or HLS file); it does not sit inside another platform's proprietary player. If your video lives in Wistia, you would either keep using Wistia's analytics, or host the file via a supported source to track it with VidaPulse. Think of VidaPulse as an affordable analytics alternative that adds deep retention data to a video you already host elsewhere, with no re-hosting.`,
  sections: [
    {
      h2: `What "work with Wistia" really means`,
      html: `<p>It helps to separate two different questions. One is "can VidaPulse plug into Wistia's player and read its playback?" The honest answer is no; VidaPulse is not an add-on inside Wistia, and it does not claim an integration that does not exist. The other question is "can VidaPulse give me the kind of retention analytics Wistia offers, on my video?" There the answer is yes, as long as the video is hosted on one of VidaPulse's supported sources.</p><p>VidaPulse works by wrapping a video URL you paste, from YouTube, Vimeo, S3, Drive, Dropbox, OneDrive, Azure Blob, Loom, Zoom, or a direct file, in its own analytics player, which you embed on any page. It measures playback in that player. A video served from inside Wistia's player is not one of those sources, so VidaPulse is not reading it where it sits in Wistia.</p>`,
    },
    {
      h2: `Your options if your video is in Wistia`,
      html: `<p>If your video currently lives in Wistia, you have two clear paths, and neither involves a pretend integration:</p><ul class="kb-list"><li><strong>Keep Wistia's analytics.</strong> Wistia is a capable hosting and analytics platform with its own heatmaps and retention data. If you are happy hosting there, you can simply use what Wistia provides.</li><li><strong>Host the file via a supported source and use VidaPulse.</strong> If you want VidaPulse's retention analytics, put the video file on a supported source, such as a direct MP4 or HLS link, Amazon S3, or another cloud source, then paste that URL into VidaPulse. Direct files and S3 get full second-by-second tracking.</li></ul><p>The right path depends on what you value: an all-in-one hosting platform, or affordable, deep retention analytics on a video you host yourself without re-hosting it into another platform. If you are weighing the two, it is worth reading a direct comparison of VidaPulse and Wistia to see where each fits.</p>`,
    },
  ],
  solve: `<p>Where VidaPulse fits is simple: it adds deep retention analytics to a video you already host on a supported source, with no re-hosting and at a low price. You paste your video URL from YouTube, Amazon S3, Google Drive, Dropbox, OneDrive, Azure Blob, Loom, Zoom, Vimeo, or a direct MP4 or HLS file; VidaPulse wraps it in an analytics player; and you embed one line of script or a script-free iframe on your page.</p><p>You then read the <strong>audience-retention curve</strong>, <strong>average watch time</strong>, <strong>play rate</strong>, <strong>total and unique viewers</strong>, and the <strong>percentage reaching any point</strong>, with <strong>UTM and source attribution</strong>. Pro adds <strong>second-by-second heatmaps</strong>, <strong>viewer-level history</strong>, and <strong>conversion and CTA tracking</strong>, with no personal data collected. Start free with one video and no card, then Starter (10 dollars/mo) or Pro (19 dollars/mo). If your video sits in Wistia today, create a free VidaPulse account and try it on a video hosted via a supported source to compare the two directly.</p>`,
  faq: [
    {
      q: `Is VidaPulse a plugin inside Wistia?`,
      a: `No. VidaPulse is not an add-on inside Wistia's player and does not claim a direct integration. It tracks videos you embed from its own supported sources (YouTube, Vimeo, S3, Drive, Dropbox, OneDrive, Azure, Loom, Zoom, or a direct MP4 or HLS file) by wrapping them in its analytics player.`,
    },
    {
      q: `My video is hosted on Wistia — what are my options?`,
      a: `Either keep Wistia's own analytics, which include heatmaps and retention, or host the video file via a supported source such as a direct MP4 or HLS link or Amazon S3 and track it with VidaPulse. Direct files and S3 get full second-by-second analytics. There is no way to track it inside Wistia's player itself.`,
    },
    {
      q: `Is VidaPulse a cheaper alternative to Wistia?`,
      a: `For the specific job of deep retention analytics on a video you host yourself, yes. VidaPulse adds analytics to a video you already host elsewhere with no re-hosting, starting free and at low flat plans. Wistia is a fuller hosting platform, so the right choice depends on whether you want hosting plus analytics or just the analytics.`,
    },
  ],
};
