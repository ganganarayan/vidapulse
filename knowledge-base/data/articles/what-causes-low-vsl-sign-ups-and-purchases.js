module.exports = {
  metaTitle: `What causes low VSL sign-ups and purchases? | VidaPulse`,
  metaDescription: `Low VSL sign-ups trace to three causes: viewers never reach the offer, weak offer placement, or CTA friction. Retention data isolates which one is yours.`,
  answer: `Low VSL sign-ups and purchases usually trace to one of three causes: viewers never reach the offer, the offer is placed too late or buried, or there is friction at the CTA itself. They look identical from the outside, flat results, but they need opposite fixes. Retention data isolates which one is yours by showing how far viewers get and whether they act when they reach the ask. Diagnose the cause before you change the offer, because the offer is rarely what is broken.`,
  sections: [
    {
      h2: `Cause one: viewers never reach the offer`,
      html: `<p>This is the most common cause by far, and the most overlooked. If most viewers leave the VSL before the offer appears, they were never asked to sign up or buy. The low result is not rejection; it is absence. You can have a brilliant offer and it changes nothing for people who already closed the tab.</p><p>The audience-retention curve makes this visible immediately. Find the timestamp where your offer begins, then read the curve at that exact point to see what share of viewers are still watching. If that number is small, you have found your problem: the offer is being heard by almost no one. The fix is not a better offer, it is getting more viewers to survive to the moment you make it, by repairing the drops in front of it.</p>`,
    },
    {
      h2: `Cause two: weak or late offer placement`,
      html: `<p>Sometimes viewers do reach the offer, but it is placed where it cannot do its job. Two versions of this show up repeatedly.</p><ul class="kb-list"><li><strong>The offer is buried.</strong> The reason to sign up or buy is real, but it is surrounded by backstory, setup, and tangents, so interested viewers drift away before they hear it clearly. The pitch is there; it is just lost in noise.</li><li><strong>The offer comes too late.</strong> Value is built well, but the call to action is parked at the very end, past the point where most people have already left. Viewers who were ready to act earlier had nowhere to do it.</li></ul><p>Both show up on the curve as a meaningful drop happening before, or right around, where the offer sits. If the steepest decline lands just before your pitch, the offer is arriving after you have already lost the people it was meant for. The fix is to move the offer earlier or tighten the run-up so the pitch lands while viewers are still there.</p>`,
    },
    {
      h2: `Cause three: friction at the CTA itself`,
      html: `<p>The third cause is the most frustrating because the persuasion worked. Viewers reach the call to action, they are convinced, and then the path to act is unclear, slow, or demands too much. Convinced buyers leak out at the very last step.</p><p>Retention alone cannot reveal this one, because these viewers stayed to the end; the curve looks fine. You need conversion and CTA tracking to see whether viewers who reach the ask actually click it. A healthy retention curve combined with a low CTA-click rate is the signature of friction at the ask, not a content problem at all.</p><p class="kb-example">Hypothetical illustration, not real data: imagine 400 viewers press play. If only 50 reach the offer, cause one is your problem. If 250 reach the offer but the steepest drop sits right before it, cause two. If 250 reach the offer and only 8 click the CTA, cause three. Same flat sales, three different breaks, each pointing somewhere else.</p>`,
    },
    {
      h2: `How retention data isolates the cause`,
      html: `<p>The whole point of reading the data is to stop treating "low sign-ups" as one problem and start treating it as a specific, located one. Two readings together do almost all the work.</p><ol><li><strong>Read the retention curve at the offer.</strong> Find the offer's timestamp and the percentage of viewers still watching there. A low percentage means cause one; a sharp drop right before the offer means cause two.</li><li><strong>Read CTA-click against retention.</strong> If many viewers reach the ask but few click, that is cause three, friction at the CTA, even when the curve looks healthy.</li></ol><p>Once you know which cause is yours, the fix is obvious and you fix one thing, then re-measure. Repair the run-up if viewers never reach the offer; move or tighten the offer if it is buried or late; simplify the ask if convinced viewers do not click. Changing the offer when the real cause is reach or friction is how good VSLs get rewritten and still do not convert.</p>`,
    },
  ],
  solve: `<p>VidaPulse isolates which of the three causes is killing your VSL sign-ups and purchases, on the video you already use, without re-hosting it. You paste your existing video URL from wherever it lives (YouTube, Amazon S3, Google Drive, Dropbox, OneDrive, Azure Blob, Loom, Zoom recording, Vimeo, a direct MP4 or HLS link, and more), VidaPulse wraps it in an analytics player, and you embed one line of script or a script-free iframe on your page. The video keeps its URL.</p><p>Then each cause becomes a reading, not a guess:</p><ul class="kb-list"><li>Read the <strong>audience-retention curve</strong> and the <strong>percentage reaching any point</strong> to see whether viewers even reach the offer (cause one) or drop right before it (cause two).</li><li>Use the <strong>second-by-second engagement heatmap</strong> (Pro) to find whether the offer is buried in a weak section.</li><li>Turn on <strong>conversion and CTA tracking</strong> to expose friction at the ask, cause three, even when retention looks fine.</li><li>Check <strong>play rate</strong> and <strong>average watch time</strong> to rule out an attention problem before the offer.</li><li>Split by <strong>UTM and source attribution</strong> to tell a video problem from a traffic problem.</li></ul><p>No PII is collected. To start, create a free VidaPulse account, wrap your own VSL, and read the curve at your offer and the CTA-click rate, the two numbers that tell you which cause to fix first.</p>`,
  faq: [
    {
      q: `Should I rewrite my offer if my VSL is not converting?`,
      a: `Not until you confirm viewers actually reach it. The most common cause of low VSL sign-ups is that most viewers leave before the offer appears, so they never heard it. Read your retention curve at the offer's timestamp first. If few viewers reach it, fix the drops in front of the offer rather than the offer itself.`,
    },
    {
      q: `My retention curve looks fine but sales are still low. Why?`,
      a: `That is the signature of friction at the CTA. Viewers stayed to the end, so persuasion worked, but something at the ask, an unclear next step or a slow handoff, stops them from acting. Use conversion and CTA tracking to confirm a low click rate despite healthy retention, then simplify the ask.`,
    },
    {
      q: `How do I tell whether the offer is buried or just too late?`,
      a: `Look at where the steepest drop sits relative to your offer. A long slide through the section just before the offer suggests it is buried in weak content; a curve that holds until the very end where the offer sits suggests it arrives too late for viewers who were ready earlier. The heatmap helps pinpoint which.`,
    },
  ],
};
