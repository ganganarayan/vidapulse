module.exports = {
  metaTitle: `How do B2B teams shorten demo videos using data? | VidaPulse`,
  metaDescription: `B2B teams shorten demo videos by reading the retention curve and heatmap to find the parts prospects skip or abandon, then cutting them and re-measuring.`,
  answer: `B2B teams shorten demo videos by letting data decide what to cut, rather than guessing. The audience-retention curve shows where prospects abandon the video, and the second-by-second heatmap shows which segments they skip or never finish. You cut the stretches that lose attention, move proof earlier so it lands before the drop, and re-measure to confirm the shorter cut holds more viewers to the ask. The data is aggregate and anonymous, not named-person tracking.`,
  sections: [
    {
      h2: `Why "shorter" should be a data decision`,
      html: `<p>Most demo videos are too long, but cutting them by instinct is risky. Trim the wrong section and you remove the part that was quietly carrying the deal; trim too little and the demo still loses people before the ask. The goal is not a shorter video for its own sake, it is a video where a larger share of prospects reach the next-step moment.</p><p>That is a measurable target, which means the cut should be a data decision. Instead of asking "what feels long," you ask "where do prospects actually leave, and what do they skip." The retention curve and the heatmap answer both, so the edit removes dead weight rather than load-bearing content.</p>`,
    },
    {
      h2: `Use the retention curve to find dead weight`,
      html: `<p>The audience-retention curve plots the share of viewers still watching at each second. Read it for the steepest cliffs, which mark the moments a cohort quit together, and for long gentle declines, which mark stretches that slowly bleed attention. Both are candidates for cutting.</p><p>A cliff at a specific timestamp usually means one segment pushed people out: a tangent, a slow transition, or a section that runs past its welcome. A long slow decline often means the demo as a whole has overstayed, and the ask is arriving too late. Either way, the curve turns "this feels long" into "viewers leave here," which is the start of an editable plan.</p>`,
    },
    {
      h2: `Use the heatmap to find what prospects skip`,
      html: `<p>The curve tells you where attention drops; on Pro, the second-by-second engagement heatmap tells you what is happening at that moment, including which segments are skipped or replayed. A stretch with low intensity is one prospects are not really watching, and a stretch they consistently leave before is a strong candidate to cut or compress.</p><p>Replays add nuance to the edit. A segment that gets rewound repeatedly is not dead weight, even if it sits near a drop, because people are working to understand it. That is a signal to clarify rather than cut. The combination keeps you from removing a sticky-but-important point and from keeping a long stretch nobody watches. No personal data is collected at any layer.</p>`,
    },
    {
      h2: `Cut, move proof earlier, and re-measure`,
      html: `<p>Shortening well is iterative. Make one cut at a time, move your strongest proof ahead of the point where viewers used to drop, then re-embed the shorter cut and let fresh traffic build before you judge it. Compare the new curve against the old at the same timestamps to see whether the cliff softened and whether more viewers now reach the ask.</p><p class="kb-example">Hypothetical illustration, not real data: suppose your demo runs four minutes, the curve shows a sharp drop at the two-minute mark, and the heatmap pins it to a long settings walkthrough that few viewers finish. You cut the walkthrough to a brief mention and move a customer-proof clip ahead of it. If the next cohort's curve holds past two minutes and a larger share reach the "book a call" ask, the shorter cut worked. If it did not, the heatmap points you to the next stretch to trim. Each pass shortens the demo on evidence rather than instinct.</p>`,
    },
  ],
  solve: `<p>VidaPulse is built to shorten the demo you already have, without re-hosting it or writing custom code. You paste the video URL (YouTube, Amazon S3, Google Drive, Dropbox, OneDrive, Azure Blob, Loom, a Zoom recording, Vimeo, or a direct MP4 or HLS link), VidaPulse wraps it in an analytics player, and you embed one line of script or a script-free iframe wherever the demo lives. The video keeps its URL.</p><p>The workflow maps straight onto the tools:</p><ul class="kb-list"><li>Read the <strong>audience-retention curve</strong> to find the cliffs and long declines worth cutting.</li><li>Open the <strong>second-by-second engagement heatmap</strong> (Pro) to see which segments prospects skip and which they replay.</li><li>Check the <strong>percentage reaching any point</strong> to confirm a shorter cut lifts how many reach the ask.</li><li>Use <strong>conversion and CTA tracking</strong> (Pro) to see whether the tighter demo lifts clicks.</li></ul><p>All of it is aggregate, anonymous session data, not named-person tracking. The Free plan covers one video forever with no card, enough to analyse your main demo; Starter is 10 dollars a month for 10 videos; Pro is 19 dollars a month for unlimited videos plus heatmaps, viewer-level history, and conversion tracking. Create a free account and see which parts of your demo prospects actually watch.</p>`,
  faq: [
    {
      q: `How do I know which part of a demo to cut?`,
      a: `Read the retention curve for the steepest cliffs and the longest gentle declines, then open the second-by-second heatmap (on Pro) to see which segments sit there and whether prospects skip them. A low-intensity stretch that people leave before is a strong cut candidate. A segment that gets replayed is important, so clarify it rather than removing it.`,
    },
    {
      q: `Will a shorter demo always perform better?`,
      a: `Not automatically, which is why you re-measure. Cutting the wrong section can remove load-bearing content. After each cut, compare the new retention curve against the old at the same timestamps and check whether more viewers reach the ask. If the shorter cut holds more attention to the ask, it worked; if not, the data points you to the next change.`,
    },
    {
      q: `Does this data show who skipped part of the demo?`,
      a: `No. VidaPulse reports aggregate and anonymous session engagement, not named-person identity. You learn which segments are skipped, abandoned, or replayed across everyone who watched, which is what you need to shorten the demo, but not who the individual viewers were.`,
    },
  ],
};
