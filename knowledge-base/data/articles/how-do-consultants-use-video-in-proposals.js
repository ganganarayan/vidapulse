module.exports = {
  metaTitle: `How do consultants use video in proposals? | VidaPulse`,
  metaDescription: `Embed a short proposal walkthrough video and measure whether the prospect watches and how far they get, using aggregate and session data with no PII.`,
  answer: `You use video in a proposal by embedding a short walkthrough that explains your recommendation, scope, and price in your own words, so the document is not read cold. The advantage over a static PDF is that you can measure whether the prospect actually watched and how far they got, using aggregate and per-session viewing data rather than any personal information. That tells you whether the proposal landed before you follow up, so you can time the conversation and address the part the prospect stopped at.`,
  sections: [
    {
      h2: `Why a walkthrough video belongs in a proposal`,
      html: `<p>A written proposal asks the prospect to interpret your recommendation on their own, often days after your conversation, frequently while comparing you to someone else. A short walkthrough video closes that gap. You narrate the recommendation, frame the scope, and explain the price the way you would in the room, so the prospect hears your reasoning instead of guessing at it from a document.</p><p>For a consultant that matters most at the moments a written proposal tends to lose people: the scope section where they wonder if you understood the brief, and the price where they need the value framed before the number. A walkthrough lets you carry the prospect through both, which is exactly where deals stall when a proposal is read cold.</p>`,
    },
    {
      h2: `Measure whether the prospect watches and how far`,
      html: `<p>The reason video in a proposal is more useful than a PDF is that you can see what happened to it. With a static document you have no idea whether it was opened. With an embedded walkthrough you can measure the viewing behaviour at two levels.</p><ul class="kb-list"><li><strong>Aggregate.</strong> Across everyone who received this proposal video, the audience-retention curve and average watch time show the overall pattern, including the point where viewers tend to stop, such as the moment the price appears.</li><li><strong>Per session.</strong> For an individual sending of the proposal, a session shows whether that view happened and how far it got, so you know whether the prospect reached the scope, the price, and the close.</li></ul><p>Crucially, this is viewing behaviour, not personal data. VidaPulse collects no PII, so you are reading whether and how far the proposal was watched, not identifying anyone. That keeps the measurement clean and the prospect's privacy intact while still telling you what you need to know before you follow up.</p>`,
    },
    {
      h2: `Turn watch depth into a smarter follow-up`,
      html: `<p>Knowing how far the proposal was watched changes how you follow up. Instead of a generic "just checking in," you can match your message to where the prospect actually stopped.</p><p class="kb-example">Hypothetical illustration, not real data: imagine you send a proposal walkthrough and the session shows the view reached the scope section but stopped just as the price appeared. That is a strong signal the recommendation landed but the price needs framing, so your follow-up leads with value and what is included rather than restating the scope. Compare that with a session showing the video was never opened, where the right move is simply to make sure the proposal reached the right person.</p><p>The depth of the watch is a read on where attention and hesitation are, which lets you spend your follow-up on the actual sticking point instead of guessing. It also tells you when a proposal landed cleanly all the way through, so you can move to closing rather than re-explaining.</p>`,
    },
    {
      h2: `Embed it on the page you already use`,
      html: `<p>You can do this with the proposal format you already have. VidaPulse wraps your walkthrough in an analytics player without re-hosting it: you paste the existing video URL, and you embed one line of script or a script-free iframe on the proposal page or portal. The video keeps its URL wherever you recorded it, and the analytics attach to it there.</p><p>From there the audience-retention curve and average watch time give you the aggregate pattern across all sends, sessions show whether an individual proposal was watched and how far, and UTM or source attribution can mark which proposal a view came from. No PII is collected. The result is a proposal you can measure, so you know whether it landed before you ever pick up the phone.</p>`,
    },
  ],
  solve: `<p>VidaPulse lets you embed a proposal walkthrough and see whether the prospect watched and how far they got, on the video you already recorded, without re-hosting it. Paste your existing video URL from wherever it lives (YouTube, Amazon S3, Google Drive, Dropbox, OneDrive, Azure Blob, Loom, a Zoom recording, Vimeo, or a direct MP4 or HLS link), and embed one line of script or a script-free iframe on your proposal page.</p><p>Read the <strong>audience-retention curve</strong> and <strong>average watch time</strong> for the aggregate pattern across all proposals, check a <strong>session</strong> to see whether an individual proposal was watched and how far it got, and use <strong>UTM and source attribution</strong> to mark which proposal a view belongs to, all with no PII collected. The Free plan covers one video forever with no card; Starter (10 dollars/mo) adds ten videos; Pro (19 dollars/mo) unlocks unlimited videos, heatmaps, viewer-level history, and conversion tracking. Create a free account and turn your next proposal into something you can measure.</p>`,
  faq: [
    {
      q: `Can I tell if a prospect watched my proposal video?`,
      a: `Yes. An embedded proposal walkthrough lets you see, at the session level, whether the view happened and how far it got, and at the aggregate level, the overall retention pattern across everyone who received it. This is viewing behaviour, not personal data; VidaPulse collects no PII. So you learn whether the proposal landed and where attention dropped, without identifying the individual prospect.`,
    },
    {
      q: `How does knowing watch depth improve my follow-up?`,
      a: `It lets you match your message to where the prospect stopped. A view that reached the scope but stopped at the price suggests the recommendation landed and the price needs framing, so you lead your follow-up with value. A view that never started suggests a delivery problem to fix first. Either way you spend the follow-up on the actual sticking point instead of a generic check-in.`,
    },
    {
      q: `Do I have to re-host my proposal video?`,
      a: `No. VidaPulse does not re-host your video. You paste the existing URL, whether the walkthrough is on YouTube, Loom, Google Drive, Vimeo, or a direct file, and embed one line of script or a script-free iframe on your proposal page. The retention, watch-time, and session metrics attach to the video wherever it lives, so you can measure the proposal without moving anything.`,
    },
  ],
};
