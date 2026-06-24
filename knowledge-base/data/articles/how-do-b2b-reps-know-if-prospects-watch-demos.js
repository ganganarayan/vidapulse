module.exports = {
  metaTitle: `How do B2B reps know if prospects watch their demos? | VidaPulse`,
  metaDescription: `B2B reps see aggregate, anonymous engagement on a hosted demo: how far prospects watch, where they drop, and what they replay, not which named person watched.`,
  answer: `B2B reps know how prospects engage with a demo by wrapping the video in an analytics player and reading aggregate, anonymous session engagement: how far people watch, where attention drops, which moments get replayed, and what share reach the next-step ask. Honestly, that is the limit of it. VidaPulse does not tell you which named person or company watched; it measures behaviour, not identity. That is still enough to tell a demo that lands from one that quietly loses people.`,
  sections: [
    {
      h2: `The honest answer first`,
      html: `<p>It is worth being clear up front, because reps often expect a video tool to name the watcher. VidaPulse does not do that. It uses anonymous first-party identifiers and reports aggregate and session-level engagement, not the identity of the human or account behind a view. It will not tell you "the buyer at Acme watched your demo twice last night."</p><p>What it tells you is behaviour. How far sessions got, where they dropped, what they replayed, and whether they reached your ask. That is a different and narrower kind of knowledge than a named-account intent tool, and pretending otherwise sets the wrong expectation. The good news is that behaviour is exactly what you need to improve the demo itself and read collective interest.</p>`,
    },
    {
      h2: `What you can tell from a hosted demo`,
      html: `<p>Plenty, once the video is wrapped in an analytics player. Each session feeds signals you can read.</p><ul class="kb-list"><li><strong>How far prospects watch.</strong> The audience-retention curve shows the share still watching at each second, so you see where attention holds and where it falls away.</li><li><strong>Whether they reach the ask.</strong> The percentage reaching any point tells you what share survive to your pricing, your differentiator, or your "book a call" moment.</li><li><strong>What they go back to.</strong> Replays vs first watches surface the segments people rewind, often a sign of a sticky or important point.</li><li><strong>Whether they start at all.</strong> Play rate and average watch time separate an open-but-unwatched demo from one that genuinely held attention.</li><li><strong>Whether watching led to action.</strong> Conversion and CTA tracking (Pro) show if viewers who reached the ask clicked through.</li></ul><p>On Pro, the second-by-second heatmap and viewer-level session history tie a drop to a specific line and let you follow how individual sessions moved, still without any personal data.</p>`,
    },
    {
      h2: `What you cannot tell, and what to use instead`,
      html: `<p>You cannot attach a name to a view, and you cannot answer "did this specific buyer watch" from VidaPulse alone. Because identifiers are anonymous, the data answers "how do prospects behave" rather than "who is this prospect." If your motion genuinely needs named-account, person-level "who watched" intelligence, that is the job of your CRM and a person-level prospecting or intent platform, not an aggregate engagement tool.</p><p>The two are complements, not substitutes. Use VidaPulse to learn whether the demo lands, where it loses people, and what to fix, and use your CRM and account tools to track named buyers. Confusing the roles leads to disappointment; using each for what it is good at gives you both a better demo and a working pipeline view.</p>`,
    },
    {
      h2: `Turning what you can see into better demos`,
      html: `<p>The practical payoff is that you stop sending demos blind. When you can see where attention falls away, you can move your strongest point earlier, cut the dead stretch, and shorten the run-up to the ask.</p><p class="kb-example">Hypothetical illustration, not real data: suppose a recorded demo is sent across an outbound sequence. If the retention curve shows most sessions leaving before the integrations segment, that proof is buried too late, and moving it forward may lift how many reach your ask. You learned nothing about who watched, but you learned exactly what to change, which is what moves the next batch of replies.</p>`,
    },
  ],
  solve: `<p>VidaPulse lets reps read engagement on the demo they already record, without re-hosting it or writing code. You paste the video URL from wherever it lives (YouTube, Amazon S3, Google Drive, Dropbox, OneDrive, Azure Blob, Loom, a Zoom recording, Vimeo, or a direct MP4 or HLS link), VidaPulse wraps it in an analytics player, and you embed one line of script or a script-free iframe wherever you send prospects. The video keeps its URL.</p><p>From there you can see how far prospects watch and what they engage with, all as aggregate, anonymous session data:</p><ul class="kb-list"><li>The <strong>audience-retention curve</strong> and <strong>percentage reaching any point</strong> for watch depth and reach to your ask.</li><li><strong>Replays vs first watches</strong> for the moments prospects revisit.</li><li>The <strong>second-by-second heatmap</strong> and <strong>viewer-level session history</strong> (Pro) to pin drops to a line.</li><li><strong>Conversion and CTA tracking</strong> (Pro) to see if reaching the ask led to a click.</li></ul><p>Keep the boundary in mind: this is behaviour, not identity, so it complements your CRM rather than replacing it. The Free plan covers one video forever with no card; Starter is 10 dollars a month for 10 videos; Pro is 19 dollars a month for unlimited videos plus heatmaps, viewer-level history, and conversion tracking. Create a free account and see how far prospects watch your demos.</p>`,
  faq: [
    {
      q: `Can a rep see which named prospect watched a demo?`,
      a: `No. VidaPulse reports aggregate and anonymous session engagement built on first-party identifiers, not named-person or named-account identity. You can see how far people watch, where they drop, and what they replay, but not who the watcher is. For named-buyer tracking, use your CRM and a person-level intent tool.`,
    },
    {
      q: `Then what is the point of tracking demo engagement?`,
      a: `To improve the demo and read collective interest. Knowing where prospects disengage, what they replay, and what share reach your ask tells you exactly what to fix, which lifts how the next batch of prospects responds, even though you never learn who individually watched.`,
    },
    {
      q: `Does VidaPulse work with the demo videos we already have?`,
      a: `Yes. You paste the existing video URL and VidaPulse wraps it in an analytics player, with no re-uploading. It works with YouTube, Amazon S3, Google Drive, Dropbox, OneDrive, Azure Blob, Loom, Zoom recordings, Vimeo, and direct MP4 or HLS links, embedded with one line of script or a script-free iframe.`,
    },
  ],
};
