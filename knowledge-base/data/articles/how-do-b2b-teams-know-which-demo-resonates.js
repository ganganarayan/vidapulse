module.exports = {
  metaTitle: `How do B2B teams know which demo resonates? | VidaPulse`,
  metaDescription: `B2B teams find the demo that resonates by comparing versions on retention and reach-to-CTA — the one that holds attention and reaches the ask wins.`,
  answer: `B2B teams know which demo resonates by comparing versions on two things: retention, how well each holds attention, and reach-to-CTA, what share of viewers survive to the ask. The version that keeps a flatter curve and lands more viewers at the next-step ask is the one resonating. The comparison runs on aggregate, anonymous engagement, so you judge the content across all viewers rather than tracking which named prospect watched which cut.`,
  sections: [
    {
      h2: `What "resonates" means in data terms`,
      html: `<p>"Resonates" sounds soft, but it has a measurable shape. A demo that resonates holds attention; its retention curve stays relatively flat through the key sections instead of cliffing early. And it carries that attention all the way to the point that matters; a strong share of viewers are still watching when the next-step ask appears. Attention held and attention delivered to the ask, together, is what resonance looks like in the numbers.</p><p>Defining it this way turns a matter of taste into a decision you can make on evidence. Instead of arguing about which demo "feels" stronger, you compare two curves and two reach-to-CTA figures and let the version that holds more people and lands more of them at the ask win.</p>`,
    },
    {
      h2: `Compare versions on the same two metrics`,
      html: `<p>To pick a winner, put each demo version on its own analytics player and compare them on the same pair of metrics. Retention is the first read: line up the curves and see which one holds a larger share of viewers through the body, and where each one loses people. Reach-to-CTA is the decider: the percentage still watching at your ask tells you which version actually delivers viewers to the next step.</p><p>The two together matter because either alone can mislead. A demo can hold attention but bury the ask so late that few reach it, or it can be short enough that everyone reaches the ask but no one was engaged on the way. The version that wins on both is the one resonating, and it is the one worth making the default.</p>`,
    },
    {
      h2: `Use the heatmap to learn why one wins`,
      html: `<p>Knowing which demo resonates is useful; knowing why is what makes the next version better. On Pro, the second-by-second engagement heatmap shows per-second intensity and replays, so you can see which exact moments in the winning version held viewers and which moments in the losing version shed them.</p><p>That turns a verdict into a lesson. Maybe the winner leads with a customer outcome and the loser opens with setup; maybe the winner shows the product live where the loser describes it. Replays add another layer: a segment rewound repeatedly often marks the point prospects care most about, which you can lead with in the next cut or address head-on in conversation. No personal data is collected at any layer; you are reading behaviour, not identity.</p>`,
    },
    {
      h2: `Make it the default, then keep iterating`,
      html: `<p>Once one version clearly wins on retention and reach-to-CTA across enough traffic, make it your standard demo and retire the weaker cut. Then keep going. The winner becomes the control for the next comparison, where you test a tighter section, an earlier proof point, or a clearer ask against it.</p><p class="kb-example">Hypothetical illustration, not real data: suppose version A walks through features in order and version B leads with the outcome and shows the live product early. If B's retention curve holds flatter through the body and a larger share of B's viewers reach the ask, B resonates more, and you ship it. The heatmap might show B's early outcome moment is where it pulls ahead, so the next version doubles down on that. All of this reads from aggregate, anonymous engagement; the data shows which content resonated across viewers, never which named prospect preferred which version.</p>`,
    },
  ],
  solve: `<p>VidaPulse lets you compare demo versions without re-hosting any of them. You paste each version's video URL (YouTube, Amazon S3, Google Drive, Dropbox, OneDrive, Azure Blob, Loom, a Zoom recording, Vimeo, or a direct MP4 or HLS link), VidaPulse wraps each in its own analytics player, and you embed one line of script or a script-free iframe wherever the demo lives. Each version keeps its URL and gathers its own engagement.</p><p>The decision maps onto the tools:</p><ul class="kb-list"><li>Compare each version's <strong>audience-retention curve</strong> to see which holds attention through the body.</li><li>Check the <strong>percentage reaching any point</strong> for reach-to-CTA, which version delivers more viewers to the ask.</li><li>Open the <strong>second-by-second heatmap</strong> (Pro) to learn why the winner wins, including which moments get replayed.</li><li>Use <strong>conversion and CTA tracking</strong> (Pro) to confirm the resonant version also converts better.</li></ul><p>Everything is aggregate and anonymous, not named-person tracking, so you judge the content on behaviour across all viewers. The Free plan covers one video forever with no card; Starter is 10 dollars a month for 10 videos, room for several versions; Pro is 19 dollars a month for unlimited videos plus heatmaps, viewer-level history, and conversion tracking. Create a free account and find the demo that resonates.</p>`,
  faq: [
    {
      q: `What is the clearest way to tell which demo resonates?`,
      a: `Compare versions on retention and reach-to-CTA. The version with the flatter retention curve through the body and the higher share of viewers reaching the next-step ask is the one resonating. Looking at both prevents a misleading read, since one metric alone can flatter a demo that holds attention but buries the ask, or vice versa.`,
    },
    {
      q: `How do I learn why one demo beats another, not just that it does?`,
      a: `Use the second-by-second engagement heatmap on Pro. It shows which exact moments held viewers in the winner and shed them in the loser, plus which segments get replayed. That turns the verdict into a lesson you can apply to the next version, like leading with the outcome moment that pulled the winner ahead.`,
    },
    {
      q: `Does comparing demos reveal which prospect preferred which version?`,
      a: `No. VidaPulse reports aggregate and anonymous session engagement, so you see how each version performed across all viewers, not which named person or company watched which cut. That is what a content comparison needs; you are deciding which demo to ship, not identifying individual viewers.`,
    },
  ],
};
