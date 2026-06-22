module.exports = {
  metaTitle: `How can product video creators track viewer engagement? | VidaPulse`,
  metaDescription: `Product video creators track viewer engagement by wrapping demo videos in an analytics player and reading retention, heatmaps, and source on any host.`,
  answer: `Product video creators track viewer engagement by wrapping their demo or product video in an analytics player and reading retention, heatmaps, and source data wherever the video is embedded. You see what share of viewers press play, how far they watch, which exact moments hold or lose attention, and where the engaged viewers came from. This works on the video you already have, on whatever host it lives on, without re-uploading it. The result is a clear picture of which parts of your product story actually land.`,
  sections: [
    {
      h2: `Track engagement on the video you already have, on any host`,
      html: `<p>Most product and demo videos already live somewhere: YouTube, Amazon S3, Google Drive, Dropbox, OneDrive, Azure Blob, Loom, a Zoom recording, Vimeo, or a direct MP4 or HLS link. The mistake is thinking you must move the video into an analytics platform before you can measure it. You do not. You wrap the existing URL in an analytics player and embed that, so the video keeps its home and its URL while you collect engagement data on top.</p><p>This matters for product marketers because the same demo often appears in several places at once: a landing page, a pricing page, an email, a sales follow-up. Tracking happens at the player level, so you can see engagement no matter where the video is embedded, instead of having one set of numbers on YouTube and nothing everywhere else.</p>`,
    },
    {
      h2: `The engagement metrics that actually tell you something`,
      html: `<p>Views and play counts are vanity numbers; they tell you a video was seen, not whether it worked. For product and demo videos, the metrics that drive decisions are about attention and progress.</p><ul class="kb-list"><li><strong>Play rate.</strong> What share of people who saw the video pressed play. Low play rate is a placement, thumbnail, or page-context problem, not a content problem.</li><li><strong>Audience-retention curve.</strong> What share are still watching at each second. This is where you see exactly which feature, claim, or section loses people.</li><li><strong>Average watch time.</strong> How much of the video the typical viewer actually consumes.</li><li><strong>Percentage reaching any point.</strong> How many viewers make it to the moment that matters, such as the feature reveal, the proof, or the CTA.</li><li><strong>Replays vs first-time watches.</strong> Sections viewers rewatch often signal either strong interest or confusion worth investigating.</li><li><strong>Total and unique viewers.</strong> The audience size behind the curve, so you trust patterns over noise.</li></ul>`,
    },
    {
      h2: `See which exact moments hold attention with the heatmap`,
      html: `<p>The retention curve tells you where viewers leave; the second-by-second engagement heatmap (Pro) tells you what is happening at the sentence level. It shows which exact moments hold attention and which get skipped or abandoned, down to the line. For a product video, that is the difference between knowing "people drop around two minutes" and knowing "people drop the moment the pricing section starts."</p><p class="kb-example">Example: Suppose your heatmap shows a sharp dip right as a particular feature demo begins, and a small spike of replays a few seconds later. That tells you the feature explanation is both losing some viewers and confusing others enough to rewind. You now know precisely which segment to re-shoot or re-script, instead of guessing across the whole video.</p>`,
    },
    {
      h2: `Connect engagement to source, geography, and device`,
      html: `<p>Engagement is more useful when you know who is engaging. VidaPulse ties viewer behavior to the context around it so you can act on patterns, not averages.</p><ul class="kb-list"><li><strong>UTM and source attribution.</strong> See how viewers from different campaigns, emails, or pages watch the same video, so you can tell whether a low engagement number is the video or the audience.</li><li><strong>Geography.</strong> Spot where your most engaged viewers are, useful when a product targets specific regions.</li><li><strong>Device and browser.</strong> Confirm the video performs on mobile as well as desktop, since a demo that drops only on mobile points to a playback or layout issue, not the content.</li></ul><p>For deeper analysis, viewer-level history (Pro) lets you follow how an individual viewer moved through the video across sessions, and audience segmentation (Pro) lets you compare how different groups engage. No PII is collected, so you get behavior, not personal identity.</p>`,
    },
  ],
  solve: `<p>VidaPulse is built to track engagement on product and demo videos without re-hosting them. You paste your existing video URL from wherever it lives (YouTube, Amazon S3, Google Drive, Dropbox, OneDrive, Azure Blob, Loom, Zoom recording, Vimeo, a direct MP4 or HLS link, and more), VidaPulse wraps it in an analytics player, and you embed one line of script or a script-free iframe on any page. The video stays put and keeps its URL, and the same wrap reports engagement wherever it is embedded.</p><p>Once it is live, you read the full engagement picture:</p><ul class="kb-list"><li><strong>Play rate</strong> and the <strong>audience-retention curve</strong> for what share start and how far they get.</li><li>The <strong>second-by-second engagement heatmap</strong> (Pro) to find the exact moments that hold or lose attention.</li><li><strong>Average watch time</strong>, <strong>percentage reaching any point</strong>, and <strong>replays vs first-time watches</strong> for the shape of consumption.</li><li><strong>UTM and source attribution</strong>, <strong>geography</strong>, and <strong>device and browser</strong> to see who engages and from where.</li><li><strong>Viewer-level history</strong> and <strong>segmentation</strong> (Pro) for deeper analysis, plus <strong>conversion and CTA tracking</strong> when the video drives an action.</li></ul><p>No PII is collected. To start, create a free VidaPulse account, wrap your own demo or product video, and read its real engagement before you change anything.</p>`,
  faq: [
    {
      q: `Do I have to move my product video off YouTube or S3 to track it?`,
      a: `No. You paste your existing video URL, VidaPulse wraps it in an analytics player, and you embed that. The video stays on its current host and keeps its URL. Nothing is re-uploaded or re-hosted, and engagement is tracked at the player level wherever the video is embedded.`,
    },
    {
      q: `What is the most useful engagement metric for a demo video?`,
      a: `The audience-retention curve, because it shows exactly where viewers lose interest. Paired with the second-by-second heatmap on Pro, you can tie a drop to a specific feature or section, which tells you precisely what to re-script or re-shoot instead of guessing.`,
    },
    {
      q: `Can I see engagement separately for different campaigns or pages?`,
      a: `Yes. UTM and source attribution lets you split engagement by where viewers came from, so you can compare how the same video performs across campaigns, emails, and pages, and tell a content problem from an audience or placement problem.`,
    },
  ],
};
