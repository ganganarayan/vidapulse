module.exports = {
  metaTitle: `Can I use VidaPulse with YouTube? | VidaPulse`,
  metaDescription: `Yes — paste your YouTube URL and VidaPulse tracks retention on your own page, with UTM source and per-viewer history that YouTube's analytics do not give you.`,
  answer: `Yes. You paste a YouTube video URL, VidaPulse wraps it in an analytics player, and you embed it on your own page, where it tracks how people watch via the YouTube player API at roughly 95 percent depth. The key difference from YouTube's built-in analytics is that VidaPulse measures the video on your funnel page, attributes viewers to the campaign or UTM that sent them, and ties retention to per-viewer history and conversions. Your video stays on YouTube; nothing is re-hosted.`,
  sections: [
    {
      h2: `How VidaPulse tracks a YouTube video`,
      html: `<p>You do not move the video off YouTube. You paste the YouTube URL into VidaPulse, which wraps it in an analytics player, then you embed that player on your page with one line of script or a script-free iframe. It works on WordPress, Webflow, ClickFunnels, Squarespace, or plain HTML, with no coding required.</p><p>VidaPulse reads playback through the YouTube player API, which captures roughly 95 percent of the picture: the retention curve, average watch time, play rate, total and unique viewers, and the percentage reaching any point. The video still streams from YouTube as normal; VidaPulse simply records how people watch it on your page.</p>`,
    },
    {
      h2: `How this differs from YouTube's own analytics`,
      html: `<p>YouTube Studio reports on views that happen across YouTube, the watch page, search, suggested videos, and the YouTube app. That is useful for a YouTube channel, but it is the wrong lens for a sales or product video living on your own landing page. VidaPulse answers a different set of questions:</p><ul class="kb-list"><li><strong>Your funnel page, not YouTube.</strong> VidaPulse measures the video where it actually sells, on your page, so retention reflects the audience you sent there rather than YouTube's general traffic.</li><li><strong>Source and UTM attribution.</strong> You can see which campaign, ad, or UTM tag sent each viewer, and compare how those sources behave, something YouTube Studio does not expose for an embedded video on your site.</li><li><strong>Per-viewer history.</strong> On Pro, viewer-level history lets you follow how individual viewers watched, instead of only channel-wide aggregates.</li><li><strong>Conversion and CTA tracking.</strong> On Pro, you can connect watching to the action that follows on your page, tying retention to outcomes.</li></ul><p>In short, YouTube Studio tells you how your video performs across YouTube; VidaPulse tells you how it performs in your funnel.</p>`,
    },
  ],
  solve: `<p>To use VidaPulse with YouTube, paste your YouTube URL, let VidaPulse wrap it in an analytics player, and embed one line of script or a script-free iframe on your page. The video stays on YouTube; only the analytics layer is added. Tracking runs through the YouTube player API at about 95 percent depth.</p><p>You then read the <strong>audience-retention curve</strong>, <strong>average watch time</strong>, <strong>play rate</strong>, and the <strong>percentage of viewers reaching any point</strong> on your funnel page, with <strong>UTM and source attribution</strong> for where they came from. Pro adds <strong>viewer-level history</strong> and <strong>conversion and CTA tracking</strong>, with no personal data collected (first-party UUID). Start free with one video and no card, or move to Starter (10 dollars/mo) or Pro (19 dollars/mo). Create a free account and analyze your own YouTube video on your page.</p>`,
  faq: [
    {
      q: `Do I have to take my video off YouTube to use VidaPulse?`,
      a: `No. Your video stays on YouTube. You paste the YouTube URL, VidaPulse wraps it in an analytics player, and you embed it on your page. The video keeps streaming from YouTube; VidaPulse only adds the analytics layer.`,
    },
    {
      q: `How is this different from YouTube Studio analytics?`,
      a: `YouTube Studio reports on views across YouTube itself. VidaPulse measures the same video on your funnel page, attributes viewers to the UTM or campaign that sent them, and, on Pro, ties retention to per-viewer history and conversions. It is built for video that sells on your site, not for a YouTube channel.`,
    },
    {
      q: `How complete is YouTube tracking in VidaPulse?`,
      a: `About 95 percent. VidaPulse reads YouTube playback through the player API, which captures nearly the full retention picture, average watch time, play rate, viewers, and percentage reaching any point. For full second-by-second heatmaps, a direct file or a cloud source like S3 gives the deepest data.`,
    },
  ],
};
