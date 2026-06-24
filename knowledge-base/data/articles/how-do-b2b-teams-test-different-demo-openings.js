module.exports = {
  metaTitle: `How do B2B teams test different demo openings? | VidaPulse`,
  metaDescription: `B2B teams test demo openings by running two versions and comparing early retention — which first thirty seconds holds more prospects past the opening cliff.`,
  answer: `B2B teams test different demo openings by running each version on its own analytics player and comparing early retention, the share of prospects still watching through the first thirty to sixty seconds. The opening that holds more viewers past the early cliff is the one earning attention. Because the data is aggregate and anonymous, you compare the shape of attention across viewers, not which named person watched which version.`,
  sections: [
    {
      h2: `Why the opening is where demos are won or lost`,
      html: `<p>The first thirty seconds of a demo decide whether the rest gets watched. A slow agenda, a long company intro, or a generic "thanks for your time" gives prospects a reason to leave before any value appears, and the retention curve shows that as a steep early cliff. The opening that leads with the outcome the prospect came for tends to hold the line instead.</p><p>That makes the opening the highest-leverage thing to test. You are not rewriting the whole demo; you are changing the first few lines and watching whether more people survive them. Small changes at the front compound, because every viewer you keep past the opening is a viewer who can still reach your ask.</p>`,
    },
    {
      h2: `Set up a clean comparison`,
      html: `<p>To test fairly, change one thing at a time. Create two versions of the demo that differ only in the opening: same body, same ask, different first thirty to sixty seconds. Put each version on its own analytics player so each accrues its own retention curve, then drive comparable traffic to both, whether that is alternating which version you send or splitting a campaign.</p><p>The cleaner the setup, the more you can trust the read. If version A also has a shorter body or a different CTA, you cannot tell whether the opening or something else moved the numbers. Isolate the opening, give each version enough views to settle, and let the early part of the curve do the talking.</p>`,
    },
    {
      h2: `Read early retention, not total views`,
      html: `<p>The metric that decides an opening test is early retention, not how many people clicked play. Line up the two retention curves and look at the same early timestamps on each.</p><ul class="kb-list"><li><strong>The first-thirty-seconds hold.</strong> Which version keeps a larger share of viewers through the opening? A softer early cliff means the opening is doing its job.</li><li><strong>Where each cliff sits.</strong> If one version drops at ten seconds and the other holds to forty, the difference is the opening, not chance.</li><li><strong>Reach past the opening.</strong> The percentage still watching once the demo proper begins shows how many viewers each opening actually delivered into the body.</li></ul><p>On Pro, the second-by-second heatmap lets you pin exactly which line in the weaker opening sheds viewers, so the losing version still teaches you something for the next round.</p>`,
    },
    {
      h2: `Pick a winner, then test the next thing`,
      html: `<p>Once one opening clearly holds more viewers past the early cliff across enough traffic, make it the default and move on. Testing openings is iterative: the winner of this round becomes the control for the next, where you might test a sharper outcome statement, a faster jump to the live product, or a different proof point up front.</p><p class="kb-example">Hypothetical illustration, not real data: suppose opening A begins with a thirty-second company overview and opening B opens by showing the end result the product delivers. If B's retention curve holds noticeably more viewers through the first minute and more of them reach the body, B wins, and you ship it. The data shows the shape of attention across all viewers, not which named prospects watched A or B, so you read the aggregate and let the curves decide. Then you test B against an even tighter cold open in the next round.</p>`,
    },
  ],
  solve: `<p>VidaPulse makes opening tests practical because you do not re-host anything. You paste each version's video URL (YouTube, Amazon S3, Google Drive, Dropbox, OneDrive, Azure Blob, Loom, a Zoom recording, Vimeo, or a direct MP4 or HLS link), VidaPulse wraps each in its own analytics player, and you embed one line of script or a script-free iframe wherever you send the demo. Each version keeps its URL and accrues its own data.</p><p>The comparison maps onto the tools:</p><ul class="kb-list"><li>Read each version's <strong>audience-retention curve</strong> and compare the first-thirty-seconds hold side by side.</li><li>Check the <strong>percentage reaching any point</strong> to see how many viewers each opening delivers into the body.</li><li>Open the <strong>second-by-second heatmap</strong> (Pro) to pin which line in the weaker opening sheds viewers.</li><li>Use <strong>UTM and source attribution</strong> to keep traffic comparable between the two versions.</li></ul><p>All of it is aggregate, anonymous session data, not named-person tracking, so you compare openings on behaviour, not identity. The Free plan covers one video forever with no card; Starter is 10 dollars a month for 10 videos, room for several test versions; Pro is 19 dollars a month for unlimited videos plus heatmaps, viewer-level history, and conversion tracking. Create a free account and find the opening that holds more prospects.</p>`,
  faq: [
    {
      q: `How many demo openings should I test at once?`,
      a: `Two at a time keeps the read clean. Run one variable, the opening, with everything else held constant, and compare early retention between the two versions. Once a clear winner emerges across enough traffic, make it the control and test the next opening against it. Testing too many versions at once thins the data and muddies the comparison.`,
    },
    {
      q: `Which metric decides an opening test?`,
      a: `Early retention, the share of viewers still watching through the first thirty to sixty seconds, decides it. The opening with the softer early cliff and more viewers reaching the body is winning attention. Total views or play count do not settle it, because they measure who clicked, not who stayed once the opening began.`,
    },
    {
      q: `Does an opening test tell me who watched each version?`,
      a: `No. VidaPulse reports aggregate and anonymous session engagement, so you see the retention curve and reach for each version across all viewers, not which named person or company watched which opening. That is exactly what an opening test needs, since you are judging the content, not identifying individuals.`,
    },
  ],
};
