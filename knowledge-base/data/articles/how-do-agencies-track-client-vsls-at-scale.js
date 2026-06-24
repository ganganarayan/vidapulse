module.exports = {
  metaTitle: `How do agencies track client VSLs at scale? | VidaPulse`,
  metaDescription: `Agencies track client VSLs at scale with one analytics embed per client video, no re-hosting, and unlimited videos on Pro — all organised in a single account.`,
  answer: `Agencies track client VSLs at scale by wrapping each client's existing video in an analytics player and embedding it once on the client's page, with no re-hosting. Because the Pro plan covers unlimited videos, a single account can carry every client's VSL, sales, and product video at once. The work is repeatable: paste the URL, embed one line of script or an iframe, tag traffic with UTMs so each video's data stays clean and separable. That gives you the same retention, reach-to-offer, and conversion view across your whole client roster.`,
  sections: [
    {
      h2: `One embed per client video, no re-hosting`,
      html: `<p>Scale starts with a repeatable setup that does not depend on any client's infrastructure. For each client VSL you paste the existing video URL, VidaPulse wraps it in an analytics player, and you drop one line of script or a script-free iframe onto the client's page. Nothing moves. The video stays on whatever host the client already uses — YouTube, Amazon S3, Vimeo, Google Drive, Dropbox, OneDrive, Loom, a Zoom recording, or a direct MP4 or HLS link.</p><p>This is what makes onboarding fast. You are not migrating files, converting formats, or asking a client to change their player. You add a tracking layer over the video they already have, and tracking begins the moment the embed loads. The same three-step process works for every client, which is exactly what scaling requires.</p>`,
    },
    {
      h2: `Unlimited videos on one account`,
      html: `<p>An agency cannot work under a per-video cap. The Pro plan removes that limit: unlimited videos, plus heatmaps, conversion tracking, and viewer-level history. That means one account can hold every client's VSL and every variant you are testing, without you rationing which videos get measured.</p><p>Practically, this lets you track a client's main VSL, a shorter cut, and a product video all at once, and add a new client's video the day you sign them. Pricing stays flat as your roster grows, so the cost of measurement does not scale with the number of clients — it stays fixed while your coverage expands.</p>`,
    },
    {
      h2: `Keep each video's data clean and separable`,
      html: `<p>Tracking many VSLs only helps if you can tell them apart. Each wrapped video has its own analytics, so a client's retention curve, reach-to-offer, and conversions never blend into another's. Within a single video, UTM and source attribution keeps campaign traffic separable, so you can see how the same VSL performs across a client's different ads or links.</p><ul class="kb-list"><li><strong>Name videos consistently</strong> by client and asset so the right VSL is easy to find as the list grows.</li><li><strong>Tag every link with UTMs</strong> so each campaign's viewers stay attributable inside that video's data.</li><li><strong>Use domain restrictions</strong> to control where each wrapped player is allowed to load, keeping client embeds tidy.</li></ul><p>That discipline keeps a roster of many videos readable instead of turning into a pile of mixed-up numbers.</p>`,
    },
    {
      h2: `A repeatable diagnosis loop across the roster`,
      html: `<p>Scale is not just storing many videos; it is being able to act on all of them the same way. Once every client VSL is wrapped, you run the same loop on each:</p><ol><li><strong>Read the retention curve</strong> to find the steepest drop and the reach-to-offer number.</li><li><strong>Pin the moment</strong> with the second-by-second engagement heatmap (Pro) to tie the drop to a specific line.</li><li><strong>Recommend one fix</strong> to the client and re-measure on fresh traffic.</li></ol><p class="kb-example">Hypothetical illustration, not real data: across a roster, you might find one client's VSL keeps half its viewers to the offer while another keeps only a fifth. The same view, applied to every video, lets you prioritise where your hours go — you work the video with the biggest leak first, instead of spreading effort evenly across clients who do not all need it.</p>`,
    },
  ],
  solve: `<p>VidaPulse is built to track many client VSLs without per-video friction. For each client you paste the video's existing URL (YouTube, Amazon S3, Google Drive, Dropbox, OneDrive, Azure Blob, Loom, a Zoom recording, Vimeo, or a direct MP4/HLS link), VidaPulse wraps it in an analytics player, and you embed it with one line of script or a script-free iframe. Nothing is re-hosted, so onboarding a new client video takes minutes.</p>
<p>At scale you get:</p>
<ul class="kb-list"><li><strong>Unlimited videos</strong> on the Pro plan — one account for your whole roster.</li>
<li><strong>Separate analytics per video</strong> — each client's retention, reach-to-offer, and conversions stay distinct.</li>
<li>The <strong>audience-retention curve, average watch time, and play rate</strong> on every VSL.</li>
<li><strong>UTM and source attribution</strong> to keep each campaign's traffic separable within a video.</li>
<li>The <strong>second-by-second engagement heatmap, conversion tracking, and viewer-level history</strong> (Pro) for deeper diagnosis.</li>
<li><strong>Domain restrictions</strong> to control where each wrapped player loads.</li></ul>
<p>You can export or screenshot any video's reports for client reviews. No personal data is collected. Create a free VidaPulse account, wrap one client VSL, and once the loop works, repeat it across the roster on Pro.</p>`,
  faq: [
    {
      q: `Is there a limit on how many client videos I can track?`,
      a: `On the Pro plan there is no video limit — it covers unlimited videos along with heatmaps, conversion tracking, and viewer-level history. That lets a single account carry every client's VSL, sales, and product video at once, so the cost of measurement stays flat as your roster grows. The Free plan covers one video and Starter covers ten.`,
    },
    {
      q: `Do clients' videos all have to be on the same host?`,
      a: `No. Each client can stay on a different host. You paste whatever URL each client already uses — YouTube, S3, Vimeo, Drive, Dropbox, OneDrive, Loom, Zoom, or a direct MP4/HLS link — and VidaPulse wraps it in an analytics player. Nothing is re-hosted, so a mixed roster of hosts is no problem.`,
    },
    {
      q: `How do I keep one client's data from blending into another's?`,
      a: `Each wrapped video has its own analytics, so client VSLs never mix. Name videos consistently by client and asset, tag every campaign link with UTMs so traffic stays attributable within each video, and use domain restrictions to control where each player loads. That keeps a large roster readable instead of turning into mixed-up numbers.`,
    },
  ],
};
