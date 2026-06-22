module.exports = {
  metaTitle: `What tools show viewer retention? | VidaPulse`,
  metaDescription: `Tools that show viewer retention: platform-native like YouTube and Vimeo, hosted platforms like Wistia and Vidyard, and VidaPulse for any-source retention.`,
  answer: `Viewer retention is shown by three kinds of tools. Platform-native analytics, like YouTube Analytics and Vimeo on higher tiers, show retention for videos hosted on those platforms. Hosting platforms like Wistia and Vidyard show retention for videos you upload to them, often with heatmaps. And VidaPulse shows second-by-second retention for a video you already host anywhere, on your own page, with no re-hosting. Which one you need depends mostly on where your video lives and whether you want depth like a heatmap, not on which brand is most popular.`,
  sections: [
    {
      h2: `What "viewer retention" means here`,
      html: `<p>Before comparing tools, it helps to be precise about the thing they show. Viewer retention is the percentage of viewers still watching at each moment of a video. Plotted over time, it forms a retention curve that starts at 100 percent and falls as people leave. A steep early drop, a slow slide through the middle, or a cliff right before the offer each point to a different problem.</p><p>Almost any serious tool can show a retention curve. The real differences are <strong>where your video has to live</strong> for the tool to work, and <strong>how granular</strong> the view gets, whether you only see a curve or also a second-by-second heatmap that ties drop-off to specific moments. Keep those two questions in mind as you read the categories below.</p>`,
    },
    {
      h2: `Platform-native retention tools`,
      html: `<p>If your video lives on a public platform, that platform may show retention for free or on its paid tiers. This is the simplest option when you are happy hosting there.</p><ul class="kb-list"><li><strong>YouTube Analytics</strong> shows strong audience-retention reports for videos hosted publicly on YouTube, at no cost. The catch is that it only covers YouTube-hosted public videos, and the data is aggregate. If your sales video is not on YouTube, or you do not want YouTube branding near your offer, this will not help.</li><li><strong>Vimeo</strong> includes analytics, with retention available on higher tiers, for videos hosted on Vimeo. Useful if Vimeo is already your home and you want a cleaner player than YouTube.</li></ul><p>Platform-native tools are great value when your video already lives on the platform. They stop being an option the moment your video lives somewhere else.</p>`,
    },
    {
      h2: `Hosted-platform retention tools`,
      html: `<p>Dedicated video platforms show retention as part of a larger product that also hosts your video and serves a branded player. You upload your video to them.</p><ul class="kb-list"><li><strong>Wistia</strong> is a hosting and marketing platform with a branded player, creation tools, lead capture, and analytics that include retention and heatmaps. Priced for businesses and teams.</li><li><strong>Vidyard</strong> is a video platform that leans to sales, with personalized recording, CRM workflows, hosting, and engagement analytics. Best when your team sends many one-to-one videos.</li></ul><p>These give you retention plus much more, but they expect your video to live on their platform, and adopting one means migrating or re-hosting what you have. Check current pricing and limits on each company's own site.</p>`,
    },
    {
      h2: `Any-source retention: VidaPulse`,
      html: `<p>The third category exists for a common gap: you want retention on a video you already host, on your own page, without moving it or paying for a hosting platform. That is what VidaPulse does.</p><p>You paste your existing video URL, VidaPulse wraps it in an analytics player, and you embed one line of script or a script-free iframe. You get a retention curve and the percentage of viewers reaching any point, plus total and unique viewers and UTM or source attribution. On Pro you add a second-by-second engagement heatmap, viewer-level history, and conversion or CTA tracking. No personal data is collected.</p><table class="kb-table"><thead><tr><th></th><th>Where the video must live</th><th>Retention curve</th><th>Per-second heatmap</th><th>On your own page</th></tr></thead><tbody><tr><td>YouTube Analytics</td><td>YouTube (public)</td><td>Yes</td><td>No</td><td>Lives on YouTube</td></tr><tr><td>Vimeo</td><td>Vimeo</td><td>Higher tiers</td><td>No</td><td>Vimeo player</td></tr><tr><td>Wistia</td><td>Wistia</td><td>Yes</td><td>Yes</td><td>Wistia player</td></tr><tr><td>Vidyard</td><td>Vidyard</td><td>Yes</td><td>Engagement analytics</td><td>Vidyard player</td></tr><tr><td>VidaPulse</td><td>Anywhere you already host</td><td>Yes</td><td>Yes (Pro)</td><td>Yes, any page</td></tr></tbody></table>`,
    },
    {
      h2: `Which one should you use`,
      html: `<p>Let where your video lives make the decision for you.</p><ul class="kb-list"><li><strong>Use platform-native</strong> (YouTube or Vimeo) if your video is already public on that platform and you are happy hosting there.</li><li><strong>Use a hosted platform</strong> (Wistia or Vidyard) if you want hosting, a branded player, and creation or sales workflows alongside retention, and can budget for it.</li><li><strong>Use VidaPulse</strong> if your video already lives somewhere, you want it on your own page without platform branding, and you need second-by-second retention without re-hosting, cheaply.</li></ul><p class="kb-example">Example: your VSL is a direct MP4 on your landing page. YouTube and Vimeo do not apply, and a hosting platform would mean migrating. VidaPulse lets you paste that file URL and read second-by-second retention on the page where it already lives.</p>`,
    },
  ],
  solve: `<p>If your video already lives somewhere and you want to see retention on your own page, VidaPulse shows it without moving anything. Paste your existing video URL, from YouTube, Amazon S3, Google Drive, Dropbox, OneDrive, Azure Blob, Loom, a Zoom recording, Vimeo, or a direct MP4 or HLS file, and embed one line of script or a script-free iframe.</p><p>Then read the <strong>audience-retention curve</strong> and <strong>percentage reaching any point</strong> to find where viewers leave, open the <strong>second-by-second heatmap</strong> (Pro) to tie each drop to a specific moment, and use <strong>UTM and source attribution</strong> with <strong>conversion tracking</strong> (Pro) to connect watching to outcomes. The Free plan covers one video forever with no card; Starter (10 dollars/mo) adds ten videos; Pro (19 dollars/mo) unlocks unlimited videos, heatmaps, viewer-level history, and conversion tracking. Create a free account and read the retention curve on one of your own videos.</p>`,
  faq: [
    {
      q: `Which tools show second-by-second viewer retention?`,
      a: `Most serious tools show a retention curve. For second-by-second detail tied to specific moments, you generally need a heatmap. Wistia provides heatmaps on videos hosted with Wistia, and VidaPulse provides a second-by-second heatmap on its Pro plan for a video you already host anywhere. Platform-native tools like YouTube show a retention curve but not a per-second heatmap.`,
    },
    {
      q: `Can I see viewer retention without hosting my video on a platform?`,
      a: `Yes. That is exactly what VidaPulse is for. You keep your video on whatever host you already use, paste its URL, and embed one line of script or a script-free iframe to see retention on your own page. Platform-native and hosted-platform tools, by contrast, require your video to live on their platform.`,
    },
    {
      q: `Is YouTube retention data good enough?`,
      a: `For a public YouTube video, YouTube Analytics gives genuinely strong, free retention reports, so it can be plenty. Its limits are that it only covers YouTube-hosted public videos and the data is aggregate. If your video lives on your own page, or you want a per-second heatmap and source attribution on a video hosted elsewhere, you will want a tool like VidaPulse instead.`,
    },
  ],
};
