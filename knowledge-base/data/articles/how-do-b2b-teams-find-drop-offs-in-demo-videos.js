module.exports = {
  metaTitle: `How do B2B teams find drop-offs in demo videos? | VidaPulse`,
  metaDescription: `B2B teams find demo drop-offs by reading the retention curve for the steepest cliffs, then the second-by-second heatmap to pin each drop to a specific line.`,
  answer: `B2B teams find drop-offs in demo videos by reading the audience-retention curve for the steepest cliffs, then opening the second-by-second engagement heatmap to pin each cliff to a specific line or moment. The curve tells you where prospects leave; the heatmap tells you which line lost them. With that you can cut the dead stretch, move proof earlier, and tighten the demo so more viewers reach the ask. The data is aggregate and anonymous, not named-person tracking.`,
  sections: [
    {
      h2: `Start with the retention curve`,
      html: `<p>The retention curve is your map. It plots the share of viewers still watching at each second, so the whole demo becomes a single shape you can read at a glance. A healthy demo holds a relatively flat line through its key sections; a leaking one shows steep cliffs where groups of prospects quit at the same moment.</p><p>Read it for the biggest drops first, not the gentle decline. Some falloff is normal across any video. What you are hunting is the cliff: the timestamp where the line drops sharply, because that marks a specific moment that pushed a cohort out. Note the seconds where those cliffs sit; that is where the demo is failing, and it is where the heatmap earns its keep.</p>`,
    },
    {
      h2: `Pin the drop with the heatmap`,
      html: `<p>The curve tells you where, the second-by-second engagement heatmap tells you what. On Pro, the heatmap shows per-second intensity including replays, so you can land on the exact line, transition, or screen that coincides with the cliff in the curve.</p><p>This is the difference between "people leave around the two-minute mark" and "people leave the moment the demo switches to a long settings walkthrough." The first is a vague hunch; the second is an editable problem. Replays in the heatmap matter too: a segment that is rewound repeatedly often signals confusion or an important point, which is useful context for both the edit and the next conversation. No personal data is collected at any layer.</p>`,
    },
    {
      h2: `Common shapes and what they mean`,
      html: `<p>Drop-off patterns tend to repeat across B2B demos, and the shape suggests the cause.</p><ul class="kb-list"><li><strong>An early cliff in the first thirty seconds.</strong> The opening is too slow or too generic; prospects bail before any value. Lead with the outcome, not the agenda.</li><li><strong>A mid-demo slide.</strong> A section runs long or drifts into detail the prospect did not ask for. Tighten or cut it.</li><li><strong>A drop right before the ask.</strong> The demo overstays its welcome; people leave just before the "book a call" moment. Shorten the run-up.</li><li><strong>Heavy replays on one segment.</strong> Not a drop but a sticky point. Clarify it in the video or address it head-on in follow-up.</li></ul><p>You do not need to interpret these in isolation; the curve plus the heatmap plus the percentage reaching the ask usually make the cause obvious.</p>`,
    },
    {
      h2: `Fix, then confirm`,
      html: `<p>Finding the drop is half the work; confirming the fix is the other half. Make one change, re-embed the updated demo, and let fresh traffic build before you judge it. Compare the new curve against the old at the same timestamp to see whether the cliff softened and whether more viewers now reach the ask.</p><p class="kb-example">Hypothetical illustration, not real data: suppose the curve shows a sharp drop at ninety seconds, and the heatmap pins it to a long pricing-config tangent. You cut the tangent and move a customer-proof clip earlier. If the next cohort's curve holds past ninety seconds and a larger share reach the ask, the edit worked. If not, the heatmap points you to the next suspect line. Each pass tightens the demo on evidence rather than instinct.</p>`,
    },
  ],
  solve: `<p>VidaPulse is built to find these drop-offs on the demo you already have, without re-hosting it or writing code. You paste the video URL (YouTube, Amazon S3, Google Drive, Dropbox, OneDrive, Azure Blob, Loom, a Zoom recording, Vimeo, or a direct MP4 or HLS link), VidaPulse wraps it in an analytics player, and you embed one line of script or a script-free iframe wherever the demo lives. The video keeps its URL.</p><p>The workflow maps straight onto the tools:</p><ul class="kb-list"><li>Read the <strong>audience-retention curve</strong> to spot the steepest cliffs.</li><li>Open the <strong>second-by-second engagement heatmap</strong> (Pro) to pin each cliff to a specific line, including which segments get replayed.</li><li>Check the <strong>percentage reaching any point</strong> to see how the drop affects who reaches your ask.</li><li>Use <strong>conversion and CTA tracking</strong> (Pro) to confirm whether tightening the demo lifts clicks.</li></ul><p>All of it is aggregate, anonymous session data, not named-person tracking. The Free plan covers one video forever with no card, enough to analyse your main demo; Starter is 10 dollars a month for 10 videos; Pro is 19 dollars a month for unlimited videos plus heatmaps, viewer-level history, and conversion tracking. Create a free account and see where prospects drop off in your demo.</p>`,
  faq: [
    {
      q: `What is the fastest way to find where a demo loses prospects?`,
      a: `Read the audience-retention curve and look for the steepest cliff, not the gentle decline. The cliff marks the timestamp where a cohort quit together. Then open the second-by-second heatmap to see which exact line or transition sits at that moment, which turns a vague hunch into an editable problem.`,
    },
    {
      q: `Do I need the heatmap, or is the curve enough?`,
      a: `The curve finds where the drop happens; the heatmap (on Pro) tells you what caused it by pinning the drop to a specific line and showing replays. The curve alone narrows it to a region; the heatmap makes the fix concrete. For tightening a demo line by line, both together are far more useful.`,
    },
    {
      q: `Does finding drop-offs reveal who left the demo?`,
      a: `No. VidaPulse reports aggregate and anonymous session engagement, not named-person identity. You learn at which moment prospects disengage and which line lost them, which is what you need to fix the demo, but not who the individual viewers were.`,
    },
  ],
};
