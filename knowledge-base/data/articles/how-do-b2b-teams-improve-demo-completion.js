module.exports = {
  metaTitle: `How do B2B teams improve demo completion? | VidaPulse`,
  metaDescription: `B2B teams improve demo completion by finding where viewers drop on the retention curve, tightening those sections, and re-measuring so more reach the ask.`,
  answer: `B2B teams improve demo completion with a simple loop: find where prospects drop, tighten the sections that lose them, and re-measure to confirm the change worked. The audience-retention curve shows the drops, the second-by-second heatmap pins each one to a line, and the percentage reaching the ask tells you whether completion actually improved. Repeat until more viewers finish. The data is aggregate and anonymous, not named-person tracking.`,
  sections: [
    {
      h2: `What "completion" should mean for a demo`,
      html: `<p>Completion is worth defining before you chase it. For a B2B demo, the number that matters is not whether viewers reach the final frame, it is whether they reach the next-step ask. A prospect who watches your case, hits "book a call," and never sees the closing card has completed the part that moves pipeline. So treat reach-to-CTA, the percentage still watching when your ask appears, as your real completion metric.</p><p>Framed that way, improving completion is a concrete goal: get a larger share of viewers to the ask. That turns a vague wish for "more engagement" into something you can measure before and after every change.</p>`,
    },
    {
      h2: `Step one: find the drops`,
      html: `<p>Start with the audience-retention curve, which plots the share of viewers still watching at each second. Read it for the steepest cliffs, the timestamps where a cohort quit together, and for long gentle declines that slowly bleed viewers before the ask. These are the moments standing between your prospects and completion.</p><p>On Pro, the second-by-second engagement heatmap turns "people leave around here" into "people leave when the demo switches to a long settings walkthrough." It pins each drop to a specific line, transition, or screen, and shows replays, so you can tell a confusing-but-important moment from a section that simply loses people. No personal data is collected at any layer.</p>`,
    },
    {
      h2: `Step two: tighten what loses them`,
      html: `<p>Once you know where viewers drop, the fix is usually one of a few moves. A slow opening that loses people early calls for leading with the outcome instead of the agenda. A mid-demo cliff usually means a section runs long or drifts into detail nobody asked for, so tighten or cut it. A drop right before the ask means the demo overstays, so shorten the run-up so the ask arrives while attention is still there.</p><p>Change one thing at a time. If you rewrite the opening, move a section, and cut a tangent all at once, you will not know which edit helped. Isolating changes keeps the loop honest and tells you which moves actually improve completion.</p>`,
    },
    {
      h2: `Step three: re-measure to confirm`,
      html: `<p>An edit is a hypothesis until the data confirms it. Re-embed the updated demo, let fresh traffic build, then compare the new retention curve against the old at the same timestamps. Did the cliff soften? Did the percentage reaching the ask rise? Those two questions tell you whether completion genuinely improved or just moved the drop elsewhere.</p><p class="kb-example">Hypothetical illustration, not real data: suppose the curve shows a sharp drop at ninety seconds, the heatmap pins it to a pricing-config tangent, and only a small share reach the ask. You cut the tangent and move proof earlier. If the next cohort's curve holds past ninety seconds and a larger share reach the ask, completion improved. If the drop simply shifted to a new timestamp, the heatmap points you to the next section to tighten. Each loop lifts completion on evidence rather than instinct.</p>`,
    },
  ],
  solve: `<p>VidaPulse runs this find-tighten-remeasure loop on the demo you already have, without re-hosting it or writing code. You paste the video URL (YouTube, Amazon S3, Google Drive, Dropbox, OneDrive, Azure Blob, Loom, a Zoom recording, Vimeo, or a direct MP4 or HLS link), VidaPulse wraps it in an analytics player, and you embed one line of script or a script-free iframe wherever the demo lives. The video keeps its URL.</p><p>The loop maps straight onto the tools:</p><ul class="kb-list"><li>Read the <strong>audience-retention curve</strong> to find the cliffs and declines that block completion.</li><li>Open the <strong>second-by-second engagement heatmap</strong> (Pro) to pin each drop to a specific line.</li><li>Track the <strong>percentage reaching any point</strong> as your completion metric, the share that reach the ask.</li><li>Use <strong>conversion and CTA tracking</strong> (Pro) to confirm whether higher completion lifts clicks on the ask.</li></ul><p>All of it is aggregate, anonymous session data, not named-person tracking. The Free plan covers one video forever with no card, enough to analyse your main demo; Starter is 10 dollars a month for 10 videos; Pro is 19 dollars a month for unlimited videos plus heatmaps, viewer-level history, and conversion tracking. Create a free account and see how many prospects finish your demo.</p>`,
  faq: [
    {
      q: `What counts as completing a demo video?`,
      a: `For pipeline, the useful definition is reaching the next-step ask, not the final frame. A prospect who reaches your "book a call" moment has completed the part that matters, even if they leave before the closing card. So track the percentage of viewers still watching when your ask appears, and treat lifting that number as the goal.`,
    },
    {
      q: `How many changes should I make before re-measuring?`,
      a: `One at a time. If you rewrite the opening, cut a tangent, and move a section together, you will not know which edit helped or hurt. Make a single change, re-embed, let fresh traffic build, then compare the new retention curve against the old at the same timestamps. Isolated changes keep the loop honest.`,
    },
    {
      q: `Does improving completion tell me who finished the demo?`,
      a: `No. VidaPulse reports aggregate and anonymous session engagement, not named-person identity. You learn what share of viewers reach the ask and where the rest drop, which is what you need to improve completion, but not who the individual viewers were. For identity you still rely on your CRM.`,
    },
  ],
};
