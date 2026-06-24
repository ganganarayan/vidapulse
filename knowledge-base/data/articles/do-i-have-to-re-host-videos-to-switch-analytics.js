module.exports = {
  metaTitle: `Do I have to re-host videos to switch analytics? | VidaPulse`,
  metaDescription: `With VidaPulse, no — it never re-hosts your video. You point it at the video's existing URL. The one nuance is files locked inside another host's player.`,
  answer: `With VidaPulse, no: it never re-hosts your video, so switching to it for analytics does not mean uploading your video anywhere new. You point VidaPulse at the video's existing URL on a supported source, and it adds analytics on top, with nothing moving if the video already lives on a supported source. The one honest nuance is when your video is locked inside another platform's proprietary player, such as Wistia or Vidyard: that player is not a source VidaPulse can read, so you would need the original file on a supported source, which may mean placing it somewhere you control.`,
  sections: [
    {
      h2: `Why most analytics tools make you re-host`,
      html: `<p>The reason "switching analytics" usually sounds painful is that many tools are hosting platforms first. To measure your video, they need it on their servers, in their player. So switching to them means uploading your file, getting a new embed, and replacing the old one everywhere.</p><p>That is a real migration, and it is why people dread switching. But it is a consequence of how those tools are built, not a law of analytics. Measuring how people watch does not actually require owning the video file.</p>`,
    },
    {
      h2: `How VidaPulse avoids it`,
      html: `<p>VidaPulse is designed the other way around. It is an analytics layer, not a host. You give it the URL of a video you already have, and it wraps that video in an analytics player you embed with one line of script or a script-free iframe.</p><p>Because nothing is uploaded to VidaPulse, there is no second copy of your file, no new storage bill from VidaPulse, and no re-encoding. The video keeps living exactly where it lives now, and VidaPulse simply measures playback. Supported sources include YouTube, Vimeo, Amazon S3, Google Drive, Dropbox, OneDrive, Azure Blob, Loom, a Zoom recording, and direct MP4 or HLS files.</p><p class="kb-example">Example: your video sits in an S3 bucket and plays on your landing page. You paste that S3 URL into VidaPulse and swap the embed. The file never moves, and you now have retention analytics on it.</p>`,
    },
    {
      h2: `The one nuance: files locked inside a host's player`,
      html: `<p>Here is the honest exception. If your video only exists inside another platform's proprietary player, such as Wistia or Vidyard, VidaPulse cannot read it where it sits, because that player is not one of its supported sources. There is no integration that reaches inside another vendor's player.</p><p>In that case you do have one move to make, but it is not re-hosting into VidaPulse. You take your original file and put it on a source VidaPulse supports, for example a direct MP4 or HLS link, Amazon S3, or another cloud source you control. Then VidaPulse tracks that. So the work, if any, is giving the file a home you can point at, not uploading it to VidaPulse.</p><p>If you are happy to keep the original platform too, you can leave that video where it is for its own player and track a supported copy for analytics. Check your host's terms before moving a file.</p>`,
    },
    {
      h2: `Quick check: does anything need to move?`,
      html: `<p>Use this to know whether you face any work at all before switching analytics.</p><ul class="kb-list"><li><strong>Nothing moves</strong> if your video is already on YouTube, Vimeo, S3, Drive, Dropbox, OneDrive, Azure Blob, Loom, a Zoom recording, or a direct file. Paste the URL and you are done.</li><li><strong>One step</strong> if your video is locked inside a host's player like Wistia or Vidyard. Put the original file on a supported source you control, then point VidaPulse at it.</li></ul><p>Either way, you are never uploading your video into VidaPulse itself. The distinction matters: switching analytics is not the same as migrating your hosting.</p>`,
    },
  ],
  solve: `<p>If your video already lives on a supported source, switching analytics is just pointing VidaPulse at the existing URL. Paste that link from YouTube, Amazon S3, Google Drive, Dropbox, OneDrive, Azure Blob, Loom, a Zoom recording, Vimeo, or a direct MP4 or HLS file, and embed one line of script or a script-free iframe. Nothing is uploaded to VidaPulse.</p><p>From there you read the <strong>retention curve</strong> and <strong>percentage reaching any point</strong> to find drop-off, open the <strong>second-by-second heatmap</strong> (Pro) to tie each drop to a moment, and use <strong>UTM and source attribution</strong> with <strong>conversion tracking</strong> (Pro) to connect watching to action, all with no personal data collected. The Free plan covers one video forever with no card; Starter (ten dollars per month) adds ten videos; Pro (nineteen dollars per month) unlocks unlimited videos, heatmaps, viewer-level history, and conversion tracking. Start free and track your video where it already lives.</p>`,
  faq: [
    {
      q: `Does VidaPulse upload a copy of my video?`,
      a: `No. VidaPulse never re-hosts or stores your video. It reads the video from its existing URL on a supported source and wraps it in an analytics player you embed. There is no second copy, no storage bill from VidaPulse, and no re-encoding. The file stays exactly where it is now.`,
    },
    {
      q: `My video is stuck inside Wistia's player — what then?`,
      a: `That is the one case where you have a step to take, because another platform's proprietary player is not a source VidaPulse can read. You would put your original file on a supported source you control, such as a direct MP4 or HLS link or Amazon S3, and point VidaPulse at that. You are not uploading to VidaPulse; you are just giving the file a home VidaPulse can see. Check the host's terms first.`,
    },
    {
      q: `Can I keep my current host and still add analytics?`,
      a: `Yes, that is the normal way to use VidaPulse. As long as your video plays from a supported source, you keep hosting wherever you like and add VidaPulse purely for analytics. The only time you move anything is if the video is locked inside a player VidaPulse cannot read, and even then you move it to a source you control, not into VidaPulse.`,
    },
  ],
};
