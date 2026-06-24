module.exports = {
  metaTitle: `How do coaches find where their VSL loses clients? | VidaPulse`,
  metaDescription: `Coaches find where a VSL loses clients by reading the retention curve for the steepest drop, then using the heatmap to tie that moment to a specific line.`,
  answer: `Coaches find where their VSL loses clients by reading two views together: the audience-retention curve, which shows the share of viewers still watching over time, and the second-by-second heatmap, which ties a drop to the exact line being spoken. The curve tells you when prospects leave; the heatmap tells you what they were hearing when they left. The steepest cliff before your booking ask is almost always the section costing you enrollments. Find that timestamp first, then read the words around it.`,
  sections: [
    {
      h2: `Start with the retention curve, not the script`,
      html: `<p>When bookings are soft, the instinct is to reread the whole script and rewrite the parts that feel weak. That wastes effort on sections prospects never reach. The retention curve points you straight at the section that is actually losing people.</p><p>Read it like a map. The vertical axis is the share of viewers still watching; the horizontal axis is time through the video. A gentle, gradual slope is normal and healthy. What you are hunting for is a cliff: a steep, sudden drop where a noticeable chunk of your audience quits in just a few seconds. Note the timestamp of the two or three steepest cliffs. Those are your suspects, and the one that falls before your booking ask is the most expensive of all.</p>`,
    },
    {
      h2: `Use the heatmap to find the exact moment`,
      html: `<p>The curve tells you when prospects leave. To fix it, you need to know what they were hearing at that second. That is what the second-by-second engagement heatmap (Pro) is for. It shows attention across the timeline at the granularity of individual seconds, so you can line a drop up against the precise sentence that triggered it.</p><p>This matters because a thirty-second window is too coarse to act on. "People leave somewhere in the second minute" is not a fix; "people leave the moment you start the long backstory at one minute fifteen" is. The heatmap turns a vague region into a specific line you can rewrite, cut, or move. It also reveals the opposite signal: sections viewers replay, which tell you what is landing and worth keeping.</p>`,
    },
    {
      h2: `Read the percentage reaching your offer`,
      html: `<p>Alongside the curve, check one number directly: what percentage of viewers are still watching at the moment your booking ask appears. This is the clearest single measure of whether your VSL is doing its job, because the ask can only convert the prospects who are still there to hear it.</p><p class="kb-example">Hypothetical illustration, not real data: suppose your VSL runs eight minutes and the booking ask lands at minute seven. If the retention curve shows only one in eight viewers survives to that point, the ask is being made to almost an empty room. No rewrite of the ask itself can fix that; the loss happened earlier, in the run-up. Knowing the reach-to-offer number stops you from polishing a CTA that hardly anyone hears.</p>`,
    },
    {
      h2: `Separate a leak from a mismatch`,
      html: `<p>Sometimes the same VSL loses clients from one traffic source but holds prospects from another. Before you rewrite the video, check whether the drop is the video's fault or a mismatch between what the prospect was promised and what the video delivers. UTM and source attribution lets you split the retention curve by where the prospect came from.</p><p>If a cold ad audience leaves the open while a warm email list watches deep, the open is not universally broken; it is failing to pay off that one ad's promise. Reading retention by source shows you whether to fix the video for everyone or to align a single campaign's message with what the VSL actually says. That keeps you from rewriting a section that works fine for most of your prospects.</p>`,
    },
  ],
  solve: `<p>VidaPulse shows you the exact moment your VSL loses clients on the video you already use, with no re-hosting. You paste your existing video URL from wherever it lives (YouTube, Amazon S3, Google Drive, Dropbox, OneDrive, Azure Blob, Loom, a Zoom recording, Vimeo, or a direct MP4 or HLS link), VidaPulse wraps it in an analytics player, and you embed one line of script or a script-free iframe on your page.</p><p>Then you locate the leak step by step:</p><ul class="kb-list"><li>Read the <strong>audience-retention curve</strong> to find the steepest drop and its timestamp.</li><li>Open the <strong>second-by-second engagement heatmap</strong> (Pro) to tie that drop to the exact line being spoken.</li><li>Check the <strong>percentage reaching any point</strong> to see what share of viewers survive to your booking ask.</li><li>Use <strong>replays versus first watches</strong> to spot the sections worth keeping.</li><li>Split retention by <strong>UTM and source attribution</strong> to tell a video leak from a campaign mismatch.</li></ul><p>The Free plan covers one video forever with no card, enough to read the retention curve on your main VSL; Starter (ten dollars a month) adds ten videos; Pro (nineteen dollars a month) unlocks unlimited videos, the second-level heatmap, viewer-level history, segmentation, and conversion tracking. No PII is collected. Create a free VidaPulse account and see where your VSL loses clients.</p>`,
  faq: [
    {
      q: `Is the retention curve or the heatmap more useful for finding drop-off?`,
      a: `You use them together. The retention curve tells you when prospects leave by showing the steepest cliffs; the second-by-second heatmap tells you what they were hearing at that moment so you can tie the drop to a specific line. The curve points you to the region, and the heatmap pins it to the exact sentence to fix.`,
    },
    {
      q: `What does a steep drop early in the VSL mean?`,
      a: `A sharp drop in the first ten to fifteen seconds usually means the open did not pay off the promise that brought the prospect, so they left before you said anything worth staying for. Cut the slow intro, state who the video is for, and deliver on the hook quickly so the open earns the rest of the video.`,
    },
    {
      q: `Can I find drop-off without moving my video?`,
      a: `Yes. VidaPulse wraps your existing video URL in an analytics player, so the video stays exactly where it is hosted and keeps its URL. You add one line of script or a script-free iframe to your page and read the retention curve and heatmap there, with no re-uploading or migration.`,
    },
  ],
};
