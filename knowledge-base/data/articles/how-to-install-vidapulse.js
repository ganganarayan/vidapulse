module.exports = {
  metaTitle: `How do I install VidaPulse? | VidaPulse`,
  metaDescription: `Install VidaPulse with no code: create a free account, add your video URL, choose player settings, copy the embed, paste it on your page, and confirm tracking.`,
  answer: `You install VidaPulse by wrapping your existing video in an analytics player and pasting it on your page. Create a free account, add your video URL, choose your player settings, copy the one-line script or the script-free iframe, paste it where the video appears, then confirm tracking is recording. There is no re-hosting and no coding, and it works on common page builders.`,
  sections: [
    {
      h2: `Step 1: create a free account and add your video URL`,
      html: `<p>Installation starts with the video you already have. You do not move it, re-upload it, or change its URL, you point VidaPulse at it.</p><ol><li>Create a free VidaPulse account. The Free plan needs no card and covers one video, so you can install and test before deciding on anything.</li><li>Paste your video URL. VidaPulse works with the common hosts and formats: YouTube, Amazon S3, Google Drive, Dropbox, OneDrive, Azure Blob, Loom, a Zoom recording, Vimeo, and direct MP4 or HLS links.</li><li>VidaPulse wraps the video in an analytics player. The original file stays exactly where it lives.</li></ol><p>If you have a URL to the video, that is all you need to bring it in.</p>`,
    },
    {
      h2: `Step 2: choose your player settings`,
      html: `<p>Before you grab the embed, set up the player the way you want it. These are optional, and you can change them later, but it is worth a moment now.</p><ul class="kb-list"><li><strong>Custom player controls</strong> — show or hide controls to match how you want the video to behave on the page.</li><li><strong>Domain restrictions</strong> — limit where the player is allowed to load, so the embed only works on your own pages.</li><li><strong>CTA and conversion tracking</strong> — turn on call-to-action tracking (Pro) if you want to tie viewing to clicks and outcomes.</li></ul><p>None of this requires code. You are choosing options, and VidaPulse builds the embed to match.</p>`,
    },
    {
      h2: `Step 3: copy the one-line script or the script-free iframe`,
      html: `<p>VidaPulse gives you two embed options, and either one installs the analytics player. Pick the one your page supports.</p><ul class="kb-list"><li><strong>One-line script</strong> — a single snippet you paste onto the page. Use this where custom scripts are allowed.</li><li><strong>Script-free iframe</strong> — an iframe embed for builders or pages that block custom scripts. It installs the player without any JavaScript on your side.</li></ul><p>Copy whichever fits. You are copying a ready-made snippet, not writing one, so there is no coding involved at this step or any other.</p>`,
    },
    {
      h2: `Step 4: paste it on your page`,
      html: `<p>Put the embed where the video should appear, replacing the old player or video block. This is the same paste action you would use for any embed, and it works across the common page builders.</p><ul class="kb-list"><li><strong>WordPress</strong> — paste into a Custom HTML block, or use the iframe if your setup blocks scripts.</li><li><strong>Webflow, Squarespace, ClickFunnels</strong> — drop the snippet into an embed or code element where the video goes.</li><li><strong>Custom HTML</strong> — paste the one-line script or iframe directly into your page markup.</li></ul><p>Then publish the page. As soon as it is live, the analytics player is in place and ready to record viewers.</p>`,
    },
    {
      h2: `Step 5: confirm tracking is recording`,
      html: `<p>Finish by verifying the install actually works. Open the published page, play the video yourself, and check your VidaPulse dashboard for that session. Seeing your own view appear confirms the embed is wired correctly and engagement is being captured.</p><p>From there, let real traffic flow through it. A handful of sessions will not give you a stable picture, so let enough viewers accumulate before you read the retention curve, heatmap, and conversions. Once data is flowing, the install is done and the analytics do the rest. No personal data is collected.</p>`,
    },
  ],
  solve: `<p>Installing VidaPulse is the same as installing any embed, with one difference: it wraps your existing video instead of re-hosting it. You paste your video URL, VidaPulse builds the analytics player, and you drop a one-line script or a script-free iframe onto your page. The video keeps its original home and URL, and there is no code to write.</p><p>Once it is in place, the player records a full engagement picture: the <strong>audience-retention curve</strong>, the <strong>second-by-second heatmap</strong> (Pro), <strong>conversion and CTA tracking</strong> (Pro), plus average watch time, play rate, total and unique viewers, the percentage reaching any point, replays vs first watches, geography, device and browser, and UTM/source attribution. No PII is collected.</p><p>You can install for free and decide later: the Free plan covers one video with no card. Starter is 10 dollars/mo for 10 videos, and Pro is 19 dollars/mo for unlimited videos plus heatmaps, viewer-level history, segmentation, and conversion tracking. To install it on your own page, create a free account and add one of your own videos.</p>`,
  faq: [
    {
      q: `Do I need a developer to install VidaPulse?`,
      a: `No. Installation is copy and paste: you add one line of script or a script-free iframe to the page where the video appears. It works on WordPress, Webflow, Squarespace, ClickFunnels, and custom HTML. You are pasting a ready-made snippet, not writing code.`,
    },
    {
      q: `Will installing VidaPulse move or re-upload my video?`,
      a: `No. VidaPulse wraps your existing video by its URL and leaves the file exactly where it lives, whether that is YouTube, S3, Google Drive, Dropbox, OneDrive, Azure Blob, Loom, a Zoom recording, Vimeo, or a direct MP4/HLS link. The video keeps its original URL.`,
    },
    {
      q: `How do I confirm the install worked?`,
      a: `Open the published page, play the video yourself, and check your VidaPulse dashboard for that session. Seeing your own view confirms the embed is wired correctly. After that, let real traffic accumulate so the data is stable rather than noise from a few plays.`,
    },
  ],
};
