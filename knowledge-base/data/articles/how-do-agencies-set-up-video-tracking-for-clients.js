module.exports = {
  metaTitle: `How do agencies set up video tracking for clients? | VidaPulse`,
  metaDescription: `Agencies set up client video tracking by pasting the existing video URL and embedding one line of script or an iframe — no re-hosting, organised per client.`,
  answer: `Agencies set up video tracking for clients in three steps: paste the client's existing video URL, place the wrapped analytics player on the client's page with one line of script or a script-free iframe, and tag traffic with UTMs so the data stays clean. Nothing is re-hosted, so the video stays on whatever host the client already uses and tracking begins the moment the embed loads. The same process repeats for every client, which keeps onboarding fast and the account organised as your roster grows.`,
  sections: [
    {
      h2: `Step one: paste the client's existing video URL`,
      html: `<p>Setup starts with the video the client already has. You paste its URL and VidaPulse wraps it in an analytics player — there is no upload, conversion, or migration. The video keeps living where it is: YouTube, Amazon S3, Google Drive, Dropbox, OneDrive, Azure Blob, Loom, a Zoom recording, Vimeo, or a direct MP4 or HLS link all work.</p><p>This no-re-hosting approach is what makes agency setup painless. You are not asking the client to move files, change hosting bills, or grant you access to their video platform. You add a tracking layer over the asset they already trust, so there is nothing for the client to approve beyond a single embed. For a client with several videos, you repeat the paste for each one.</p>`,
    },
    {
      h2: `Step two: embed with one line or an iframe`,
      html: `<p>Once the video is wrapped, you put the analytics player on the client's page. There are two ways, and both are quick:</p><ul class="kb-list"><li><strong>One line of script</strong> dropped into the page where the video should appear — the simplest option on most sites.</li><li><strong>A script-free iframe</strong> for pages, builders, or CMS setups where you cannot or prefer not to add a script.</li></ul><p>Either way, the player loads the client's video and tracking starts immediately. Because the embed is lightweight and host-agnostic, it works on landing-page builders, the client's own site, and most page builders without special configuration. If you manage the client's pages you can place it yourself; if the client manages them, you hand over one line or one iframe snippet for them to paste.</p>`,
    },
    {
      h2: `Step three: tag traffic and confirm it works`,
      html: `<p>Tracking is only useful if the data is attributable, so tag the links pointing at the page with UTMs before traffic flows. UTM and source attribution lets you split a video's retention, reach-to-offer, and conversions by campaign or source, so you can see how the same video performs across the client's ads, emails, and organic links.</p><p>Then confirm the setup: load the page, play the video, and check that views register in VidaPulse. Use domain restrictions to control where the wrapped player is allowed to load, which keeps the client's embed tidy and prevents it from running where it should not. A few minutes of confirmation here saves you from discovering a broken embed weeks into a campaign.</p>`,
    },
    {
      h2: `Organise tracking per client`,
      html: `<p>As you add clients, organisation is what keeps the account usable. Name each wrapped video consistently by client and asset — for example client name plus video type — so the right video is easy to find when you have dozens. Each video keeps its own analytics, so one client's retention, reach-to-offer, and conversions never blend into another's.</p><p class="kb-example">Hypothetical illustration, not real data: an agency might carry a main VSL, a shorter cut, and a product video for each of several clients, all in one account. With consistent naming and per-video analytics, pulling up any single client's numbers takes seconds, and adding a new client's video the day you sign them is just another paste-and-embed.</p><p>Because the Pro plan covers unlimited videos, this scales without a per-video cap forcing you to choose which client work gets measured. One account holds the whole roster, and the cost of tracking stays flat as the roster grows.</p>`,
    },
  ],
  solve: `<p>VidaPulse is built for fast, repeatable client setup with no re-hosting. For each client you paste the video's existing URL (YouTube, Amazon S3, Google Drive, Dropbox, OneDrive, Azure Blob, Loom, a Zoom recording, Vimeo, or a direct MP4/HLS link), VidaPulse wraps it in an analytics player, and you embed it with one line of script or a script-free iframe. The video stays on the client's host, and tracking starts the moment the embed loads.</p>
<p>Setting up tracking gives you, on every client video:</p>
<ul class="kb-list"><li>The <strong>audience-retention curve, average watch time, and play rate</strong>.</li>
<li>The <strong>percentage of viewers who reach any point</strong> — reach-to-offer.</li>
<li><strong>UTM and source attribution</strong> to keep each campaign's traffic separable.</li>
<li><strong>Conversion and CTA tracking, the second-by-second engagement heatmap, and viewer-level history</strong> (Pro) for deeper diagnosis.</li>
<li><strong>Domain restrictions</strong> to control where each wrapped player loads, and <strong>unlimited videos</strong> on Pro for the whole roster.</li></ul>
<p>Each video keeps its own analytics, so clients never blend together, and you can export or screenshot reports for reviews. No personal data is collected. Create a free VidaPulse account, wrap one client's video, confirm it tracks, then repeat across the roster on Pro.</p>`,
  faq: [
    {
      q: `Do I have to re-host or move the client's video?`,
      a: `No. You paste the client's existing video URL and VidaPulse wraps it in an analytics player — there is no upload, conversion, or migration. The video stays on whatever host the client already uses, whether that is YouTube, S3, Vimeo, Drive, Dropbox, OneDrive, Azure Blob, Loom, Zoom, or a direct MP4/HLS link. You are adding a tracking layer, not changing the client's hosting.`,
    },
    {
      q: `What if I cannot add a script to the client's page?`,
      a: `Use the script-free iframe instead. VidaPulse offers both a one-line script and an iframe embed, so you can place the wrapped player on pages, CMS setups, or builders where adding a script is not possible or not allowed. Both methods load the client's video and start tracking immediately, so you can use whichever fits the client's page.`,
    },
    {
      q: `How do I keep many clients organised in one account?`,
      a: `Name each wrapped video consistently by client and asset so the right one is easy to find, and rely on per-video analytics so one client's numbers never blend into another's. Tag links with UTMs so traffic stays attributable, and use domain restrictions to control where each player loads. The Pro plan's unlimited videos let one account hold your whole roster.`,
    },
  ],
};
