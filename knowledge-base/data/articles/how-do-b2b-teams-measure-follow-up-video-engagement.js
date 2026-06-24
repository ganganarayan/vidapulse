module.exports = {
  metaTitle: `How do B2B teams measure follow-up video engagement? | VidaPulse`,
  metaDescription: `B2B teams measure post-meeting follow-up video engagement with watch depth, replays, and reach-to-CTA — aggregate, anonymous data that complements the CRM.`,
  answer: `B2B teams measure follow-up video engagement by reading how far prospects watch the recap or next-step video, what they replay, and what share reach the closing ask. After a meeting, that tells you whether the message survived the room and whether the deal is still warm enough to push. The data is aggregate and anonymous, not named-person tracking, so it complements your CRM rather than telling you which specific buyer watched.`,
  sections: [
    {
      h2: `Why the follow-up video is worth measuring`,
      html: `<p>The follow-up video is the touch that happens after the meeting ends and before the next one is booked. It might recap what you covered, answer an objection that came up, or restate the next step for the wider buying group who were not in the room. It does real work, yet most teams send it and hear nothing back, so they never learn whether it landed.</p><p>Measuring it closes that gap. Instead of guessing whether your recap was watched or ignored, you get the shape of attention across everyone who opened it: how deep they got, which parts they revisited, and whether they made it to your ask. That is the difference between a follow-up you send into the void and one you can actually learn from.</p>`,
    },
    {
      h2: `The three signals that matter most`,
      html: `<p>You do not need every metric to read a follow-up. Three carry most of the meaning.</p><ul class="kb-list"><li><strong>Watch depth.</strong> The retention curve and average watch time show how far prospects get before they leave. A recap watched to the end reads very differently from one abandoned in the first fifteen seconds.</li><li><strong>Replays.</strong> Segments that get rewound often mark the points the buying group worked to understand or wanted to share, which is useful context for your next conversation.</li><li><strong>Reach-to-CTA.</strong> The percentage still watching when your next-step ask appears tells you whether the "reply to book" or "here's the proposal" moment was even heard.</li></ul><p>Read together, these answer the practical question after any meeting: did the follow-up keep the deal warm, or did it stall?</p>`,
    },
    {
      h2: `The honest limit on what you learn`,
      html: `<p>It matters to be precise about what this measurement is and is not. VidaPulse reports aggregate and anonymous session engagement. It does not identify which named person or company watched your follow-up, and it is not a person-level prospecting or sales-intelligence tool.</p><p>So you will not get an alert that a specific stakeholder watched the recap twice last night, and you should not promise your team that you can see that. What you get is behaviour without identity: how far people watched, what they replayed, and whether they reached the ask. That tells you whether the follow-up is doing its job, which is genuinely useful, but the identity of the deal and who to contact next still lives in your CRM. Treating an anonymous engagement signal as if it named individuals leads to bad calls and broken promises.</p>`,
    },
    {
      h2: `Turning the read into a next move`,
      html: `<p>A measured follow-up should change what you do next, not just sit in a dashboard. Strong watch depth and a healthy reach-to-CTA suggest the deal is still warm and the ask was heard, so you follow your normal cadence with confidence. A steep early drop suggests the recap missed, so you might shorten it or lead with the one point the prospect actually cared about.</p><p class="kb-example">Hypothetical illustration, not real data: suppose you send a post-meeting recap and the retention curve shows most viewers reaching the closing ask, with several replays around the integration section you demoed. As an aggregate signal, that says the recap landed and integration is the sticky topic, so you lead your next touch with integration detail and keep the deal moving. What the data does not tell you is which named stakeholder watched, so you still use your CRM to decide who to follow up with and when. The engagement shaped the message; the CRM owns the identity.</p>`,
    },
  ],
  solve: `<p>VidaPulse measures your follow-up videos without re-hosting them or making you change tools. You paste the video URL (YouTube, Amazon S3, Google Drive, Dropbox, OneDrive, Azure Blob, Loom, a Zoom recording, Vimeo, or a direct MP4 or HLS link), VidaPulse wraps it in an analytics player, and you embed one line of script or a script-free iframe wherever the recap lives. The video keeps its URL, so a Loom or Zoom recording you would send anyway becomes measurable.</p><p>From there the read is direct:</p><ul class="kb-list"><li>Use the <strong>audience-retention curve</strong> and <strong>average watch time</strong> to gauge watch depth on the recap.</li><li>Watch <strong>replays vs first watches</strong> to see which parts the buying group revisited.</li><li>Check the <strong>percentage reaching any point</strong> for reach-to-CTA, the share that survive to your next-step ask.</li><li>Open the <strong>second-by-second heatmap</strong> (Pro) to pin exactly which lines hold or lose attention.</li></ul><p>Every layer is aggregate and anonymous, not named-person tracking, so it complements your CRM rather than replacing it. The Free plan covers one video forever with no card, enough to measure your main recap template; Starter is 10 dollars a month for 10 videos; Pro is 19 dollars a month for unlimited videos plus heatmaps, viewer-level history, and conversion tracking. Create a free account and see whether your follow-up videos keep deals warm.</p>`,
  faq: [
    {
      q: `What should I measure first on a post-meeting follow-up video?`,
      a: `Start with reach-to-CTA, the percentage of viewers still watching when your next-step ask appears, because it tells you whether the ask was even heard. Then read watch depth and replays for which parts of the recap landed. Together they give an honest, aggregate read on whether the follow-up kept the deal warm.`,
    },
    {
      q: `Can I see which stakeholder watched my follow-up?`,
      a: `No. VidaPulse reports aggregate and anonymous session engagement, not named-person identity. You learn how far people watched, what they replayed, and whether they reached the ask, which is what you need to judge the follow-up, but the identity of who to contact next still lives in your CRM.`,
    },
    {
      q: `Does this work with a Loom or Zoom recording I send anyway?`,
      a: `Yes. You paste the existing Loom or Zoom recording URL and VidaPulse wraps it in an analytics player without re-hosting, so the recap you would send regardless becomes measurable. You then read watch depth, replays, and reach-to-CTA on the same video, all as aggregate anonymous data.`,
    },
  ],
};
