module.exports = {
  metaTitle: `How to switch from Wistia to VidaPulse | VidaPulse`,
  metaDescription: `Switching analytics from Wistia to VidaPulse honestly: host your video on a supported source, add the embed, set a baseline, and know what you keep and lose.`,
  answer: `Switching from Wistia to VidaPulse is not a one-click migration, and it is fair to say so up front. VidaPulse does not host video, so "switching" really means keeping or moving your video to a supported source you control, then adding VidaPulse analytics to it. The steps are straightforward: choose where the video will live, paste that URL into VidaPulse, embed one line of script or a script-free iframe, and set a baseline. You gain low-cost, deep retention analytics with no re-hosting by VidaPulse; you give up Wistia's branded player, creation tools, and managed hosting unless you keep those separately.`,
  sections: [
    {
      h2: `Understand what "switching" means here`,
      html: `<p>It helps to be precise, because Wistia and VidaPulse are not the same kind of product. Wistia hosts your video and analyzes it. VidaPulse only analyzes; it never hosts. So you cannot simply move a Wistia-hosted file into VidaPulse and keep everything.</p><p>What you are really doing is separating the two jobs Wistia bundled. The video needs a home on a source VidaPulse supports, and then VidaPulse adds the analytics layer on top. If your only reason for using Wistia was the analytics, this is a clean swap. If you also relied on Wistia's player or hosting, decide whether to keep those before you move.</p>`,
    },
    {
      h2: `Step 1: choose where the video will live`,
      html: `<p>First, give the video a home on a source VidaPulse can read. You have two honest options.</p><ul class="kb-list"><li><strong>Use a host you already have.</strong> If the same video also exists on YouTube, Vimeo, or another supported source, you can point VidaPulse there without moving anything new.</li><li><strong>Move the file to a source you control.</strong> If the video only lives inside Wistia, download your original file and put it where VidaPulse supports: a direct MP4 or HLS link, Amazon S3, Google Drive, Dropbox, OneDrive, Azure Blob, Loom, a Zoom recording, Vimeo, or YouTube. Direct files and S3 get full second-by-second tracking.</li></ul><p class="kb-example">Example: you keep your sales video on Wistia today, but you also have the original MP4. You upload that MP4 to an Amazon S3 bucket, and that S3 URL becomes the source VidaPulse tracks.</p>`,
    },
    {
      h2: `Step 2: add VidaPulse and embed`,
      html: `<p>With the video on a supported source, the rest is quick. Paste the video URL into VidaPulse, which wraps it in an analytics player. Then place it on your page using either method, both of which work without re-hosting.</p><ul class="kb-list"><li><strong>One-line script.</strong> Drop a single script tag where the video should appear. This is the usual choice when you control the page's HTML.</li><li><strong>Script-free iframe.</strong> Paste a ready-made iframe instead, useful on builders where adding scripts is awkward.</li></ul><p>Replace the old Wistia embed on that page with the VidaPulse embed. From here, VidaPulse is measuring playback in its own player on the supported source, not inside Wistia.</p>`,
    },
    {
      h2: `Step 3: set a baseline, then read it`,
      html: `<p>Resist the urge to compare day-one VidaPulse numbers to historical Wistia numbers; the two measured in different players, so treat this as a fresh start. Let normal traffic flow for a stretch you trust, then read the data.</p><ol><li>Open the <strong>retention curve</strong> and note where the line drops most steeply.</li><li>Check the <strong>percentage reaching any point</strong>, especially the moment your offer or call to action appears.</li><li>On Pro, open the <strong>second-by-second heatmap</strong> to tie each drop to an exact moment, and use <strong>viewer-level history</strong> and <strong>conversion tracking</strong> to connect watching to action.</li><li>Use <strong>UTM and source attribution</strong> to see which traffic sources watch longest.</li></ol><p>That baseline becomes the thing you improve against, which is more useful than any cross-tool comparison.</p>`,
    },
    {
      h2: `What you keep and what you lose`,
      html: `<p>Being clear about the trade-off prevents surprises after you switch.</p><ul class="kb-list"><li><strong>You keep:</strong> deep retention analytics, a second-by-second heatmap on Pro, conversion and CTA tracking, attribution, and a much lower price, with no re-hosting by VidaPulse and no personal data collected.</li><li><strong>You lose, unless you keep them separately:</strong> Wistia's managed hosting, its branded customizable player, and its recording and creation tools. VidaPulse does not provide these.</li></ul><p>If those Wistia features matter, you can keep hosting where it suits you and still use VidaPulse purely for analytics. If they do not, the switch is a straightforward downgrade in cost and upgrade in focus.</p>`,
    },
  ],
  solve: `<p>To make the switch, pick where your video will live on a supported source, then add VidaPulse on top. Host it on YouTube, Amazon S3, Google Drive, Dropbox, OneDrive, Azure Blob, Loom, a Zoom recording, Vimeo, or a direct MP4 or HLS file, paste that URL into VidaPulse, and embed one line of script or a script-free iframe in place of your old Wistia embed.</p><p>Then set your baseline with the <strong>retention curve</strong> and <strong>percentage reaching any point</strong>, use the <strong>second-by-second heatmap</strong> (Pro) to find exact drop moments, and read <strong>UTM and source attribution</strong> with <strong>conversion tracking</strong> (Pro) to connect watching to action. The Free plan covers one video forever with no card; Starter (ten dollars per month) adds ten videos; Pro (nineteen dollars per month) unlocks unlimited videos, heatmaps, viewer-level history, and conversion tracking. Start free and track your video where it already lives.</p>`,
  faq: [
    {
      q: `Can I migrate my Wistia video to VidaPulse in one click?`,
      a: `No, and it is honest to say so. VidaPulse does not host video, so there is no one-click migration of a Wistia-hosted file. You keep or move the video to a supported source you control, then add VidaPulse analytics to it. If the only thing you wanted from Wistia was analytics, this is a clean swap; if you relied on Wistia's hosting or player, decide whether to keep those separately.`,
    },
    {
      q: `Will I lose my Wistia analytics history when I switch?`,
      a: `Your historical Wistia data stays in Wistia; VidaPulse starts measuring fresh in its own player on the supported source. Because the two tools measure in different players, comparing day-one VidaPulse numbers to old Wistia numbers is not apples to apples. Set a new baseline in VidaPulse and improve against that.`,
    },
    {
      q: `Do I have to cancel Wistia to use VidaPulse?`,
      a: `No. A common pattern is to keep hosting where you are happy, even on Wistia, and use VidaPulse only for analytics on a video served from a supported source. You would only cancel Wistia if you no longer need its hosting, branded player, or creation tools. Decide based on which Wistia features you actually use.`,
    },
  ],
};
