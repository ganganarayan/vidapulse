module.exports = {
  metaTitle: `How do B2B teams use video in outbound? | VidaPulse`,
  metaDescription: `B2B teams use a hosted video link in outbound and read aggregate engagement — watch depth, replays, reach-to-CTA — as a soft signal that complements the CRM.`,
  answer: `B2B teams use video in outbound by sending a hosted, analytics-wrapped video link in their sequences, then reading aggregate engagement on it: how deep prospects watch, what they replay, and what share reach the ask. That tells you whether the outbound video is working and gives a soft read on collective interest. It does not identify which named prospect watched, so it complements your CRM and sequencing tools rather than replacing them.`,
  sections: [
    {
      h2: `Send a link, not just an attachment`,
      html: `<p>Most outbound video dies as an attachment or a raw file with no feedback loop; you send it and never know if it played. Sending a hosted link instead changes that. The same video, wrapped in an analytics player, becomes a destination you can measure, so the outbound touch stops being a black box.</p><p>You can drop that link into the same places you already work: a cold email, a sequence step, a LinkedIn message, or a personalised landing page. Because the video keeps its original URL and nothing is re-hosted, you are not changing your assets or your process, just adding a measurement layer to a link you were going to send anyway.</p>`,
    },
    {
      h2: `Read engagement as a soft signal`,
      html: `<p>Once the link is out, the engagement on it is a signal worth reading. Watch depth, from the retention curve and average watch time, shows how far prospects get before they leave. Replays mark the moments people work to understand. Reach-to-CTA, the share still watching at your ask, shows whether the next step was even heard. Together they describe the shape of attention across everyone in the campaign, which is far richer than "the email was opened."</p><p>Used this way, video engagement behaves like any soft signal in outbound: one input that shapes how you prioritise and what you say next, not proof on its own. Strong aggregate engagement on an outbound video suggests the message is landing and interest is real; weak engagement suggests the hook or the length needs work.</p>`,
    },
    {
      h2: `The honest limit: aggregate, not named-person ID`,
      html: `<p>This is the part outbound teams most often get wrong, so it is worth stating plainly. VidaPulse does not identify which named person or company watched your outbound video. It uses anonymous first-party identifiers and reports aggregate and session-level engagement, not the identity of the human or account behind a view. It is not a person-level prospecting or sales-intelligence tool.</p><p>So you will not get an alert that a specific prospect at a specific account watched your video, and you should not build your outbound around the idea that you can see that. What you get is behaviour without identity: how far people watch, where they drop, what they replay, and whether they reach the ask. That answers "is this outbound video working and is interest there," not "who is interested." The identity of who to contact, and when, still lives in your CRM and sequencing tools.</p>`,
    },
    {
      h2: `Let engagement shape the sequence, let the CRM own identity`,
      html: `<p>Because the signal is anonymous, its job is to make your outbound content sharper and give you a soft read on interest, while your CRM keeps owning who and when. At the content level, engagement tells you which outbound video earns attention, so you double down on the hook that holds people and fix the one that loses them. At the motion level, aggregate engagement on a campaign is a soft read on collective interest that can inform how you sequence and where you invest.</p><p class="kb-example">Hypothetical illustration, not real data: suppose an outbound video in a cold sequence shows decent watch depth but a sharp drop right before the "reply to book" ask. As a signal, that says the message holds but the run-up to the ask is too long, so you tighten it and move the ask earlier in the next version. The video engagement shaped the content; it did not tell you which named prospects watched, so your CRM and sequencing tool still decide who gets the next touch. The two work together because they measure different things.</p>`,
    },
  ],
  solve: `<p>VidaPulse turns any outbound video into a measurable link without re-hosting it. You paste the video URL (YouTube, Amazon S3, Google Drive, Dropbox, OneDrive, Azure Blob, Loom, a Zoom recording, Vimeo, or a direct MP4 or HLS link), VidaPulse wraps it in an analytics player, and you share the link or embed one line of script or a script-free iframe on a landing page. The video keeps its URL, so the Loom or hosted clip you already send in sequences becomes measurable.</p><p>From there you read outbound engagement and act on it:</p><ul class="kb-list"><li>Use the <strong>audience-retention curve</strong> and <strong>average watch time</strong> to gauge watch depth.</li><li>Check the <strong>percentage reaching any point</strong> for reach-to-CTA, the share that survive to your ask.</li><li>Watch <strong>replays vs first watches</strong> to see which moments prospects work to understand.</li><li>Use <strong>UTM and source attribution</strong> to tie engagement back to the campaign or sequence step it came from.</li></ul><p>Every layer is aggregate and anonymous, not named-person tracking, so it complements your CRM and sequencing tools rather than replacing them. The Free plan covers one video forever with no card; Starter is 10 dollars a month for 10 videos; Pro is 19 dollars a month for unlimited videos plus second-by-second heatmaps, viewer-level history, and conversion tracking. Create a free account and see how your outbound videos actually perform.</p>`,
  faq: [
    {
      q: `Can I tell which prospect watched my outbound video?`,
      a: `No. VidaPulse reports aggregate and anonymous session engagement, not named-person identity. You learn how far people watched, what they replayed, and whether they reached the ask across the whole campaign, but not which named person or company watched. For identity and who to contact next, you still rely on your CRM and sequencing tools.`,
    },
    {
      q: `How does video help an outbound sequence if it does not name viewers?`,
      a: `It sharpens your content and gives a soft read on interest. Aggregate engagement tells you which outbound video holds attention and reaches the ask, so you keep the hook that works and fix the one that loses people. The collective signal can inform how you sequence and where you invest, alongside the named signals your CRM already tracks.`,
    },
    {
      q: `Do I have to re-host my video to track it in outbound?`,
      a: `No. You paste the existing video URL and VidaPulse wraps it in an analytics player without re-hosting, so the link you already send in your sequence becomes measurable. The video keeps its URL, and you read aggregate, anonymous engagement on the same asset you were sending anyway.`,
    },
  ],
};
