module.exports = {
  metaTitle: `How do coaches test changes to their VSL? | VidaPulse`,
  metaDescription: `Coaches test VSL changes by setting a baseline, changing one thing, and comparing retention and bookings against it, running the loop until the curve holds.`,
  answer: `Coaches test changes to their VSL with a simple loop: measure a baseline, change exactly one thing, then compare retention and bookings against that baseline. Changing several things at once tells you nothing, because you cannot attribute the result to any single edit. The disciplined version is to fix the steepest drop before your booking ask, re-measure the same way, and keep what improves reach-to-offer and booked calls. Repeat until the curve holds and the calendar fills.`,
  sections: [
    {
      h2: `Set a baseline before you change anything`,
      html: `<p>You cannot tell whether an edit helped if you never recorded where you started. So the first step is not editing; it is measuring. Let your current VSL run as-is and capture the numbers you will judge future versions against.</p><ul class="kb-list"><li><strong>The retention curve.</strong> The shape over time, and especially the timestamp and steepness of the worst drop before your booking ask.</li><li><strong>Reach-to-offer.</strong> The percentage of viewers still watching when the ask appears.</li><li><strong>CTA clicks and booked calls.</strong> What share of prospects who reach the ask actually click through.</li></ul><p>Give the baseline enough viewers to be meaningful rather than reading into a handful of sessions. This is the reference point for everything that follows; without it, every change is guesswork dressed up as progress.</p>`,
    },
    {
      h2: `Change one thing at a time`,
      html: `<p>The cardinal rule of testing is isolation. If you rewrite the open, cut the backstory, and move the ask all in one new version, and bookings rise, you have no idea which edit did it, or whether one helped while another hurt. Change a single element, then compare.</p><p>Pick the edit that targets your worst drop. If the retention curve shows a cliff in the first fifteen seconds, the open is the candidate; if it sags in the middle, that one section is. Make a focused change to just that part, leave the rest of the VSL alone, and let the new version gather a comparable number of viewers before you read the result.</p>`,
    },
    {
      h2: `Compare retention and bookings against the baseline`,
      html: `<p>When the new version has enough data, lay its numbers next to the baseline. Look at the same metrics, in the same order, so the comparison is honest.</p><p class="kb-example">Hypothetical illustration, not real data: suppose your baseline had a steep cliff at minute one, with one in five viewers reaching the ask. You rewrite only the open. The new version shows the early cliff is now a gentle slope and one in three reaches the ask, and CTA clicks rise with it. That is a clear win you can keep. If the cliff just moved later instead of shrinking, the open improved but a new weak spot surfaced, which becomes your next test.</p><p>Always check bookings, not only retention. A change that lifts watch time but does not move CTA clicks or booked calls has not done the job that matters. Retention is the leading signal; bookings are the verdict.</p>`,
    },
    {
      h2: `Run the loop`,
      html: `<p>One test rarely finishes the work. Optimising a VSL is a loop you run repeatedly: measure, change one thing, compare, keep or revert, then attack the next worst drop. Each pass tightens a different section and pushes more prospects toward the ask.</p><ul class="kb-list"><li><strong>Keep what wins.</strong> If retention and bookings both improve, lock the change in and make it the new baseline.</li><li><strong>Revert what loses.</strong> If the new version is worse or flat, roll back, and you have still learned something about your audience.</li><li><strong>Move to the next drop.</strong> Once the worst cliff is fixed, the next-steepest becomes your target, and the loop continues.</li></ul><p>This beats redesigning the whole VSL from scratch, because each step is measured and reversible, and you always know which edit moved the number.</p>`,
    },
  ],
  solve: `<p>VidaPulse gives you the measurement that makes the test loop possible, on the video you already use, with no re-hosting. You paste your existing video URL from wherever it lives (YouTube, Amazon S3, Google Drive, Dropbox, OneDrive, Azure Blob, Loom, a Zoom recording, Vimeo, or a direct MP4 or HLS link), VidaPulse wraps it in an analytics player, and you embed one line of script or a script-free iframe on your page.</p><p>Then you run each pass of the loop with real numbers:</p><ul class="kb-list"><li>Set a baseline with the <strong>audience-retention curve</strong>, <strong>percentage reaching any point</strong>, and <strong>average watch time</strong>.</li><li>Pinpoint the section to change with the <strong>second-by-second engagement heatmap</strong> (Pro).</li><li>Compare versions on the same metrics, and confirm the win with <strong>conversion and CTA tracking</strong>.</li><li>Use <strong>UTM and source attribution</strong> so you compare like traffic, not a quiet week against a busy one.</li><li>Lean on <strong>segmentation</strong> (Pro) to check that a change helps the prospects you actually want to enroll.</li></ul><p>The Free plan covers one video forever with no card, enough to baseline and test your main VSL; Starter (ten dollars a month) adds ten videos; Pro (nineteen dollars a month) unlocks unlimited videos, the second-level heatmap, viewer-level history, segmentation, and conversion tracking. No PII is collected. Create a free VidaPulse account and see where your VSL loses clients, then test your way to a curve that holds.</p>`,
  faq: [
    {
      q: `How do I test a VSL change without an A/B testing tool?`,
      a: `You do not need formal split testing to learn. Set a baseline on your current VSL, change one thing, let the new version gather a comparable number of viewers, then compare retention and bookings against the baseline. The discipline of changing one element at a time is what makes the result readable, with or without an A/B tool.`,
    },
    {
      q: `Why should I change only one thing at a time?`,
      a: `Because if you change several and the result moves, you cannot tell which edit caused it, or whether one helped while another hurt. Isolating a single change to your worst drop lets you attribute the outcome cleanly, keep what wins, and revert what loses without confusing yourself.`,
    },
    {
      q: `How long should I run each test?`,
      a: `Long enough to gather a meaningful number of viewers rather than reading into a few sessions. Compare versions with similar traffic, ideally from the same sources, so a difference in retention or bookings reflects your edit and not a change in who happened to watch.`,
    },
  ],
};
