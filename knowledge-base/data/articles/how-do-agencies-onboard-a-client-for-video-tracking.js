module.exports = {
  metaTitle: `How do agencies onboard a client for video tracking? | VidaPulse`,
  metaDescription: `A clean agency onboarding checklist for video tracking: get the video URL, wrap and embed it, tag UTMs, and set a baseline before any optimization begins.`,
  answer: `Agencies onboard a client for video tracking with a short, repeatable checklist: collect the video URL, wrap and embed it on the client's page, tag the traffic with UTMs, and capture a baseline before changing anything. Because VidaPulse needs no re-hosting, the video stays on the client's existing host and tracking starts the moment the embed loads. Done the same way every time, onboarding takes minutes per client and leaves you with a clean starting point to measure against.`,
  sections: [
    {
      h2: `Step one: get the video URL`,
      html: `<p>Onboarding starts with one ask: the URL of the video the client already runs. You do not need their hosting login, their files, or a migration — you paste the URL and VidaPulse wraps it in an analytics player. The video can stay wherever it lives: YouTube, Amazon S3, Google Drive, Dropbox, OneDrive, Azure Blob, Loom, a Zoom recording, Vimeo, or a direct MP4 or HLS link.</p><p>If the client runs more than one video — a main VSL, a shorter cut, a product clip — collect each URL up front so you wrap them all in one pass. Name each wrapped video consistently by client and asset, for example client name plus video type, so the right one is easy to find once your roster grows. This naming step costs nothing now and saves real time later.</p>`,
    },
    {
      h2: `Step two: embed on the client's page`,
      html: `<p>With the video wrapped, place the analytics player where it needs to live. There are two ways and both are quick:</p><ul class="kb-list"><li><strong>One line of script</strong> dropped into the page — the simplest option on most sites.</li><li><strong>A script-free iframe</strong> for page builders, a CMS, or any setup where adding a script is not possible or not allowed.</li></ul><p>Whichever you use, the player loads the client's video and tracking begins immediately. If you manage the client's pages, place it yourself; if the client manages them, hand over the single line or iframe snippet to paste. Use domain restrictions to control where the wrapped player is allowed to load, which keeps the embed tidy and prevents it running where it should not.</p>`,
    },
    {
      h2: `Step three: tag traffic with UTMs`,
      html: `<p>Tracking is only useful if the data is attributable, so tag the links pointing at the page with UTMs before traffic flows. UTM and source attribution lets you split each video's retention, reach-to-offer, and conversions by campaign or source, so the client's ads, emails, and organic links never blur together in the numbers.</p><p>Agree the UTM convention with the client at onboarding rather than after the fact — consistent source, medium, and campaign tags from day one mean every later report slices cleanly. If the client already tags links for their other analytics, reuse their convention so the two systems line up. A few minutes here is the difference between a clean dataset and one you have to apologise for in the first review.</p>`,
    },
    {
      h2: `Step four: set a baseline`,
      html: `<p>The last onboarding step is the one most often skipped: capture the starting numbers before you change anything. Load the page, confirm views register, and let normal traffic run long enough to read a stable retention curve, reach-to-offer, and — on the Pro plan — conversions. That snapshot is your baseline.</p><p class="kb-example">Hypothetical illustration, not real data: at onboarding a client's VSL might settle at a certain average watch time, a steep drop partway through, and an offer reached by a minority of viewers. Recording those figures as the baseline means every future improvement is measured against a real before, not a guess about what the video "used to do."</p><p>Export or screenshot the baseline views and file them with the client's records. Without a baseline you can optimise a video and still be unable to prove the lift; with one, every later report has a clear point of comparison.</p>`,
    },
  ],
  solve: `<p>VidaPulse is built for fast, repeatable client onboarding with no re-hosting. For each client you paste the video's existing URL (YouTube, Amazon S3, Google Drive, Dropbox, OneDrive, Azure Blob, Loom, a Zoom recording, Vimeo, or a direct MP4/HLS link), VidaPulse wraps it in an analytics player, and you embed it with one line of script or a script-free iframe. The video stays on the client's host, and tracking starts the moment the embed loads.</p>
<p>Your onboarding checklist gives you, on every client video:</p>
<ul class="kb-list"><li>The <strong>audience-retention curve, average watch time, and play rate</strong>.</li>
<li>The <strong>percentage of viewers who reach any point</strong> — reach-to-offer.</li>
<li><strong>UTM and source attribution</strong> so each campaign's traffic stays separable from day one.</li>
<li><strong>Conversion and CTA tracking, the second-by-second engagement heatmap, and viewer-level history</strong> (Pro) for deeper baselines.</li>
<li><strong>Domain restrictions</strong> to control where each player loads, and <strong>unlimited videos</strong> on Pro for the whole roster.</li></ul>
<p>Each video keeps its own analytics, so clients never blend together, and you can export or screenshot the baseline for the client's records. No personal data is collected. Create a free VidaPulse account, onboard one client with this checklist, then repeat across the roster on Pro.</p>`,
  faq: [
    {
      q: `What do I actually need from the client to start?`,
      a: `Just the URL of the video they already run, and access to place an embed on the relevant page — or someone on their side to paste one line of script or an iframe. You do not need their hosting login, their files, or a migration, because VidaPulse wraps the existing video with no re-hosting. That keeps onboarding to a quick ask the client can fulfil in minutes.`,
    },
    {
      q: `Why set a baseline before optimizing?`,
      a: `A baseline is what lets you prove a result later. If you record the starting retention curve, reach-to-offer, and conversions before changing anything, every future improvement is measured against a real before rather than a guess. Skipping it means you can improve a video and still be unable to show the client the lift. Capturing the baseline takes one snapshot you can export or screenshot for their records.`,
    },
    {
      q: `Can I onboard several of a client's videos at once?`,
      a: `Yes. Collect every video URL up front, wrap each one, and name them consistently by client and asset so they stay easy to find. Each video keeps its own analytics, so a main VSL, a shorter cut, and a product clip never blend together. The Pro plan's unlimited videos mean there is no per-video cap forcing you to onboard only part of a client's library.`,
    },
  ],
};
