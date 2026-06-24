module.exports = {
  metaTitle: `How do B2B teams track video across the sales cycle? | VidaPulse`,
  metaDescription: `B2B teams track each video by stage — top-of-funnel demo, follow-up, recap — using retention and reach-to-CTA, all aggregate and anonymous, never person-level.`,
  answer: `B2B teams track video across the sales cycle by measuring each video against the job of its stage: a top-of-funnel demo, a mid-cycle follow-up, a post-call recap. Each one gets read on the same signals, the retention curve and the percentage reaching its ask, so you can see which stages hold attention and which leak. The data is aggregate and anonymous; VidaPulse does not identify which named person or company watched, so it complements the CRM that tracks the deal itself.`,
  sections: [
    {
      h2: `Different videos, different jobs`,
      html: `<p>Video shows up at several points in a B2B cycle, and each instance has a different job. A top-of-funnel demo has to earn attention from a cold or lightly warmed prospect and carry them to a first ask. A follow-up video sent after a thread stalls has to re-engage someone who already knows you and nudge a specific next step. A post-call recap has to reinforce the key point and keep momentum between meetings.</p><p>Because the jobs differ, the right measure differs too. You would not judge a recap by the same bar as a cold demo. Tracking video across the cycle means reading each video against what its stage is supposed to achieve, not against a single universal benchmark.</p>`,
    },
    {
      h2: `The signals that apply at every stage`,
      html: `<p>While the jobs differ, two signals travel across all of them. The audience-retention curve shows whether each video holds attention through its key sections, and the percentage reaching the ask, reach-to-CTA, shows whether viewers survive to the specific next step that stage is asking for. Together they tell you where in the cycle your video is working and where it leaks.</p><p>Supporting signals add texture. Average watch time and play rate separate an attention problem from a starting problem. Replays vs first watches flag sticky moments worth clarifying. On Pro, the second-by-second engagement heatmap pins drops to specific lines and viewer-level session history lets you follow how anonymous sessions moved through a given video. None of this collects personal data, so the same honest signals apply whether the video is at the top or the middle of the cycle.</p>`,
    },
    {
      h2: `Tracking the cycle without tracking people`,
      html: `<p>It matters that "tracking video across the sales cycle" means tracking the videos, not the individuals moving through the cycle. VidaPulse uses anonymous first-party identifiers and reports aggregate and session-level engagement, not named-person or named-account identity. It will not stitch together that a particular buyer watched your demo, then your follow-up, then your recap.</p><p>So the cycle view here is content-shaped, not person-shaped. You learn how each stage's video performs in aggregate; which one holds attention, which one loses people before its ask, which one gets replayed. That tells you where to invest your editing effort across the funnel. The deal-level journey of a named prospect through your pipeline still lives in your CRM, which VidaPulse complements rather than replaces.</p>`,
    },
    {
      h2: `Reading the cycle to invest where it counts`,
      html: `<p>Tracked this way, video becomes a set of measurable steps you can prioritise. If one stage's video reaches its ask well and another bleeds attention, you know which one to fix first, and you can compare a video's performance before and after an edit using the same retention and reach-to-CTA signals.</p><p class="kb-example">Hypothetical illustration, not real data: suppose your top-of-funnel demo holds attention and a healthy share reach its ask, but your mid-cycle follow-up video shows a steep early drop and few reach its "reply to book" ask. As an aggregate read, that says the top of your funnel is doing its job and the follow-up is the weak link, so you tighten the follow-up's opening and re-measure. You can also use UTM and source attribution to see which channel a video's views came from. What the data will not do is tell you which named prospects watched at each stage, so the CRM still owns the deal timeline.</p>`,
    },
  ],
  solve: `<p>VidaPulse lets you track every video in your cycle on the same honest signals, using the videos you already have. You paste each video's URL (YouTube, Amazon S3, Google Drive, Dropbox, OneDrive, Azure Blob, Loom, a Zoom recording, Vimeo, or a direct MP4 or HLS link), VidaPulse wraps each one in an analytics player, and you embed one line of script or a script-free iframe wherever it lives. Nothing is re-hosted, and each video keeps its URL.</p><p>Across the cycle you can read each stage and act on it:</p><ul class="kb-list"><li>Read the <strong>audience-retention curve</strong> per video to see which stages hold attention.</li><li>Track the <strong>percentage reaching any point</strong> for each video's reach-to-CTA.</li><li>Use <strong>UTM and source attribution</strong> to see where each video's views came from.</li><li>Open the <strong>second-by-second heatmap</strong> and <strong>conversion and CTA tracking</strong> (Pro) to pin drops and confirm clicks stage by stage.</li></ul><p>Every layer is aggregate and anonymous, not named-person tracking, so it complements the CRM that owns your deal timeline. The Free plan covers one video forever with no card, enough to analyse your main demo; Starter is 10 dollars a month for 10 videos, useful once you track several stages; Pro is 19 dollars a month for unlimited videos plus heatmaps, viewer-level history, and conversion tracking. Create a free account and see how far prospects watch your sales videos.</p>`,
  faq: [
    {
      q: `Can I follow one prospect's video views across the whole cycle?`,
      a: `No. VidaPulse reports aggregate and anonymous session engagement, not named-person identity, so it does not stitch a single buyer's views across your demo, follow-up, and recap. You track how each stage's video performs in aggregate. The named journey of a prospect through your pipeline lives in your CRM, which VidaPulse complements.`,
    },
    {
      q: `Should I judge every video by the same benchmark?`,
      a: `No, because each stage has a different job. A cold top-of-funnel demo, a mid-cycle follow-up, and a post-call recap are asking for different next steps from audiences at different temperatures. Read each video against what its stage should achieve, using the same signals, retention and reach-to-CTA, but with stage-appropriate expectations.`,
    },
    {
      q: `Which video should I track first?`,
      a: `Start with the one carrying the most weight in your motion, usually the top-of-funnel demo, then add the follow-up. The Free plan covers one video so you can begin with your main demo, and Starter or Pro lets you track several stages at once once you want a full-cycle view of where attention holds and where it leaks.`,
    },
  ],
};
