module.exports = {
  metaTitle: `How do agencies audit a client VSL? | VidaPulse`,
  metaDescription: `Agencies audit a client VSL with a repeatable pass: read the retention curve, pin drops with the heatmap, and check reach-to-offer — no re-hosting required.`,
  answer: `Agencies audit a client VSL by running the same three-part pass on every video: read the audience-retention curve to find where viewers leave, use the second-by-second heatmap to pin each drop to a specific line, and check the reach-to-offer percentage to see how many viewers ever hear the ask. Because VidaPulse wraps the client's existing video with no re-hosting, the audit runs on the real video on the real page. The output is not opinion — it is a list of exact timestamps where the video loses people, ranked by how much it costs.`,
  sections: [
    {
      h2: `Start with the retention curve`,
      html: `<p>The audience-retention curve is the spine of any VSL audit. It shows what share of viewers are still watching at each point in the video, so the shape tells you where attention holds and where it falls away. Read it from the front: a sharp early drop usually means the open is not earning the next few seconds, while a long steady slope through the middle points to pacing that loses people gradually.</p><p>Note the steepest drops in order of size, not order of appearance. The biggest fall is where the video leaks the most viewers, and it is where your audit should focus first. Pair the curve with average watch time and play rate so you know both how far the typical viewer gets and how many even start. This first read gives you a short list of moments worth investigating, before you look at a single line of the script.</p>`,
    },
    {
      h2: `Pin each drop with the heatmap`,
      html: `<p>A drop on the curve tells you when viewers leave; the second-by-second engagement heatmap (Pro) tells you exactly where. It marks the moments viewers replay, skip, or abandon down to the second, so you can line a fall up against the specific sentence, claim, or transition that caused it.</p><p>This is the difference between "the middle sags" and "we lose a third of viewers at the price reveal at two minutes ten." The second is auditable — the client can open the video, watch that moment, and see the problem for themselves. Walk each major drop from the curve through the heatmap until every one is tied to a concrete spot in the video. Skips and rewinds are signal too: a heavily replayed section is working, and a skipped one is a candidate to cut.</p>`,
    },
    {
      h2: `Check reach-to-offer`,
      html: `<p>A VSL exists to deliver an offer, so the most important number in the audit is how many viewers actually reach it. The percentage-reaching-any-point metric lets you mark the moment the offer or call to action appears and read the share of viewers who get that far. Everything before the offer is setup; this number tells you how much of that setup is working.</p><ul class="kb-list"><li><strong>Find the offer timestamp</strong> and read the reach percentage at that point.</li><li><strong>Compare it to the steep drops</strong> upstream — the drops that sit before the offer are the ones costing you reach.</li><li><strong>Note the gap</strong> between viewers who start and viewers who reach the offer, since that gap is the audit's headline.</li></ul><p>A video can have great early retention and still fail if almost no one reaches the ask. Reach-to-offer keeps the audit honest about what the VSL is supposed to do.</p>`,
    },
    {
      h2: `Turn the audit into a ranked action list`,
      html: `<p>An audit is only useful if it ends in priorities. Combine the three readings into a single ranked list: each major drop, its exact timestamp from the heatmap, and its effect on reach-to-offer. The drop that sits just before the offer and sheds the most viewers goes to the top, because fixing it has the largest effect on how many people hear the ask.</p><p class="kb-example">Hypothetical illustration, not real data: an audit might show a client VSL holds most viewers through the open, sags hard at a long backstory around the ninety-second mark, and arrives at the offer with only a quarter of viewers still watching. The ranked list would put the ninety-second backstory first, because tightening it is what would lift reach-to-offer the most.</p><p>Use UTM and source attribution to confirm the pattern is not an artefact of one traffic source. Then hand the client a list they can act on, with each item tied to a timestamp and a number rather than a hunch.</p>`,
    },
  ],
  solve: `<p>VidaPulse gives you everything an audit needs on the client's existing video, with no re-hosting. You paste the video's current URL (YouTube, Amazon S3, Google Drive, Dropbox, OneDrive, Azure Blob, Loom, a Zoom recording, Vimeo, or a direct MP4/HLS link), VidaPulse wraps it in an analytics player, and you embed it with one line of script or a script-free iframe. The audit runs on the real video on the real page — nothing is moved or converted.</p>
<p>For a repeatable VSL audit you use:</p>
<ul class="kb-list"><li>The <strong>audience-retention curve, average watch time, and play rate</strong> to find where viewers leave.</li>
<li>The <strong>second-by-second engagement heatmap</strong> (Pro) to pin each drop to an exact line.</li>
<li>The <strong>percentage of viewers who reach any point</strong> to read reach-to-offer.</li>
<li><strong>UTM and source attribution</strong> to confirm the pattern across traffic sources.</li>
<li><strong>Viewer-level history</strong> (Pro) for a deeper look at how individual sessions behave.</li></ul>
<p>You can export or screenshot any view to drop the audit straight into a client report. No personal data is collected. The Pro plan covers unlimited videos plus heatmaps and viewer-level history, so you can audit every client VSL on one account. Create a free VidaPulse account, wrap a client's video, and show them exactly where it loses viewers.</p>`,
  faq: [
    {
      q: `What does a complete VSL audit actually produce?`,
      a: `A ranked list of the moments where the video loses viewers, each tied to an exact timestamp and its effect on reach-to-offer. You get there by reading the retention curve to find the drops, using the second-by-second heatmap to pin each one to a specific line, and checking how many viewers reach the offer. The result is auditable evidence, not opinion — the client can open the video and watch the flagged moments.`,
    },
    {
      q: `Do I need the heatmap to audit a VSL?`,
      a: `You can run a useful audit from the retention curve and reach-to-offer alone, which are available across plans. The second-by-second engagement heatmap, on the Pro plan, makes the audit far more precise by pinning each drop to the exact second and showing where viewers replay or skip. For agency work where you need to point the client to a specific line, the heatmap is worth it.`,
    },
    {
      q: `Can I audit videos hosted on different platforms?`,
      a: `Yes. You paste whatever URL the client already uses — YouTube, S3, Vimeo, Drive, Dropbox, OneDrive, Azure Blob, Loom, a Zoom recording, or a direct MP4/HLS link — and VidaPulse wraps it in an analytics player. Nothing is re-hosted, so you can audit a roster of client VSLs on mixed hosts the same way, all from one account.`,
    },
  ],
};
