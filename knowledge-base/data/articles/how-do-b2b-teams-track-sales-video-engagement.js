module.exports = {
  metaTitle: `How do B2B teams track sales video engagement? | VidaPulse`,
  metaDescription: `B2B teams track sales video engagement by wrapping any hosted demo in an analytics player and reading retention, watch depth, replays, and reach-to-CTA.`,
  answer: `B2B teams track sales video engagement by wrapping their existing demo or sales video in an analytics player and embedding it on any page, then reading how far prospects watch, where attention drops, which moments get replayed, and what share reach the next-step ask. There is no re-hosting and no code; the video keeps its URL. The data is aggregate and anonymous session engagement, not the identity of who watched.`,
  sections: [
    {
      h2: `What "engagement" actually means on a sales video`,
      html: `<p>Engagement is not a single number, and that is the point. A play counts as a play whether the prospect watched four seconds or four minutes, so play counts alone tell you almost nothing about whether your case landed. Real engagement is the shape of attention across the whole video: where it holds, where it falls away, and what people go back to.</p><p>For a B2B sales video the engagement worth tracking breaks into a few honest questions. How far do prospects get before they leave? Do they reach the part that answers their main objection? Which segment do they rewind? And of the people who survive to your ask, how many act on it? Each of those is measurable, and together they tell you far more than a reply rate ever will.</p>`,
    },
    {
      h2: `The signals you read on an embedded sales video`,
      html: `<p>Once the video is wrapped in an analytics player, each session feeds a small set of signals you can act on.</p><ul class="kb-list"><li><strong>Audience-retention curve.</strong> The share still watching at each second. The shape shows what holds and where prospects walk out.</li><li><strong>Percentage reaching any point.</strong> What share survive to your differentiator, your pricing, or your "book a call" ask.</li><li><strong>Replays vs first watches.</strong> Which segments get rewound, often a sign of a sticky or confusing point worth raising directly.</li><li><strong>Average watch time and play rate.</strong> Whether prospects start, and how deep they typically reach.</li><li><strong>Conversion and CTA tracking</strong> (Pro). Of those who reach the ask, how many click through.</li><li><strong>Source attribution.</strong> Which sequence, email, or page sends prospects who actually watch, read through UTM and source data.</li></ul><p>On Pro you also get a second-by-second engagement heatmap and viewer-level session history, which pin each drop to a specific line. No personally identifying data is collected.</p>`,
    },
    {
      h2: `How tracking gets set up`,
      html: `<p>The setup is paste-and-go, which is why sales and revenue-ops teams can run it without engineering. You do not move or re-upload the video.</p><ol><li>Paste your existing video URL. VidaPulse wraps it in an analytics player without re-hosting the file. It works with YouTube, Amazon S3, Google Drive, Dropbox, OneDrive, Azure Blob, Loom, Zoom recordings, Vimeo, and direct MP4 or HLS links.</li><li>Copy the embed: a one-line script, or a script-free iframe for builders that block custom scripts.</li><li>Paste it where the video appears, on your sales page, a deal room, a microsite, or wherever you send prospects, and publish.</li></ol><p>From that point every session is recorded and the dashboard turns viewing into signals you can read.</p>`,
    },
    {
      h2: `Reading the data without overreading it`,
      html: `<p>The discipline is to read patterns, not single sessions, and to remember what the data is. It is aggregate and anonymous: it tells you how prospects behave collectively, not which named person watched. A handful of plays is noise; let enough traffic run through that the curve is stable before you draw conclusions.</p><p class="kb-example">Hypothetical illustration, not real data: suppose your async demo is sent across a sequence. If the retention curve falls sharply right after the intro, the opening is too slow and few ever reach your value. If most reach the ask but the CTA click share is small, persuasion held and the ask is the weak point. Same lukewarm responses, two different fixes, both readable from the engagement data.</p>`,
    },
  ],
  solve: `<p>VidaPulse is built to track exactly this without re-hosting your video or writing code. You paste the URL, VidaPulse wraps it in an analytics player, and you embed one line of script or a script-free iframe wherever the sales video appears. The video keeps its original home and URL.</p><p>Because the player records the viewing, you get the full engagement picture in one place: the <strong>audience-retention curve</strong>, <strong>percentage reaching any point</strong>, <strong>replays vs first watches</strong>, the <strong>second-by-second heatmap</strong> (Pro), <strong>conversion and CTA tracking</strong> (Pro), plus average watch time, play rate, total and unique viewers, geography, device and browser, and UTM or source attribution. All of it is aggregate and anonymous session data, not person-level identity.</p><p>You can start free: the Free plan covers one video with no card, enough to track your main demo. Starter is 10 dollars a month for 10 videos, and Pro is 19 dollars a month for unlimited videos plus heatmaps, viewer-level history, and conversion tracking. Create a free account and see how far prospects watch your sales videos.</p>`,
  faq: [
    {
      q: `Do we need to re-upload our sales videos to track engagement?`,
      a: `No. VidaPulse wraps your existing video by its URL and works with hosts like YouTube, S3, Google Drive, Dropbox, OneDrive, Azure Blob, Loom, Zoom recordings, Vimeo, and direct MP4 or HLS links. The file stays where it is and keeps its URL; you only add the analytics player around it.`,
    },
    {
      q: `Does tracking engagement tell us who watched?`,
      a: `No. The data is aggregate and anonymous session engagement, built on first-party identifiers, not named-person tracking. You can see how far people watch, what they replay, and whether they reach your ask, but not the identity of the prospect or company behind a view.`,
    },
    {
      q: `Can a sales team set this up without engineering?`,
      a: `Yes. You paste a video URL, copy a one-line script or a script-free iframe, and paste it where the video appears. It works on common page builders and custom HTML, so there is no engineering ticket required to start tracking.`,
    },
  ],
};
