module.exports = {
  metaTitle: `Why are my product or service registrations not converting? | VidaPulse`,
  metaDescription: `Product or service registrations usually stall because the video before the form loses people. Check if they watch, how far they get, and reach the CTA.`,
  answer: `If your product or service registrations are not converting, the cause is usually the video before the form, not the form itself. The video is supposed to convince people to register, and most of them leave it before it ever makes the case. So the honest test is three questions: do they watch, how far do they get, and do they reach the CTA. Answer those with retention data and the reason for the stall stops being a mystery.`,
  sections: [
    {
      h2: `The form is rarely the problem; the video before it usually is`,
      html: `<p>When registrations stall, the instinct is to tweak the form: fewer fields, a different button color, new headline copy. Sometimes that helps a little. But the form only converts people who arrive at it already convinced, and convincing is the video's job. If the video in front of the form loses people before it persuades them, the form was always going to underperform, no matter how clean it is.</p><p>This is why registration problems are usually mid-funnel, not bottom-funnel. People did not reject your offer at the form; they never got persuaded enough to reach it with intent. The fix is upstream, in the video, and you cannot find it by staring at the form.</p>`,
    },
    {
      h2: `Question one: do they actually watch?`,
      html: `<p>Before anything else, find out whether visitors press play at all. This single check splits the problem cleanly. If most people never start the video, the issue is upstream of the message entirely: the video is buried on the page, the surrounding copy does not make it worth playing, or nothing signals that watching is the path to registering.</p><p>You measure this with play rate, the share of people who saw the video and actually started it. A low play rate means no script rewrite will help, because the script is not being heard. You fix the page and the reason to play before you touch the content.</p>`,
    },
    {
      h2: `Question two: how far do they get?`,
      html: `<p>If people do press play but registrations still stall, the message is leaking somewhere in the middle. Now you need the exact spot, because the moment they quit is the moment your video stopped moving them toward registering.</p><p>The audience-retention curve answers this directly. It shows the share still watching at each second, so the steepest drop is your prime suspect. Pair it with the percentage of viewers who reach the point where you make the case for registering. If that percentage is low, the problem is not your offer or your form, it is that almost nobody is still watching when you ask.</p><p class="kb-example">Hypothetical illustration, not real data: imagine 500 visitors hit the page. If 380 press play but only 70 reach the part of the video that explains why to register, the video is leaking in the middle, long before the form is even in view. Polishing the form would change almost nothing.</p>`,
    },
    {
      h2: `Question three: do they reach the CTA?`,
      html: `<p>The last check is whether viewers who stay actually arrive at the call to action and act on it. There are two distinct failures hiding here, and they need opposite fixes.</p><ul class="kb-list"><li><strong>They never reach the CTA.</strong> If most viewers leave before the registration ask appears, they were never asked. Either move the ask earlier so convinced viewers can act when they are ready, or fix the drops in front of it so more people survive to that moment.</li><li><strong>They reach the CTA but do not click.</strong> If viewers get to the ask but do not act, persuasion may have worked and the friction is at the step itself, an unclear next action, a slow or confusing handoff to the form, or an ask that demands too much.</li></ul><p>Conversion and CTA tracking tells these apart by showing whether viewers who reach the ask click through. Read it next to the retention curve and "registrations are not converting" turns into a precise sentence: viewers stop watching at this moment, or viewers reach the ask and do not click. That is the difference between guessing and diagnosing.</p>`,
    },
  ],
  solve: `<p>VidaPulse answers all three questions, do they watch, how far they get, and whether they reach the CTA, on the exact video that sits in front of your registration form, without re-hosting it. You paste your existing video URL from wherever it lives (YouTube, Amazon S3, Google Drive, Dropbox, OneDrive, Azure Blob, Loom, Zoom recording, Vimeo, a direct MP4 or HLS link, and more), VidaPulse wraps it in an analytics player, and you embed one line of script or a script-free iframe on your page. No re-uploading.</p><p>Then you diagnose the stall instead of guessing at the form:</p><ul class="kb-list"><li>Check <strong>play rate</strong> to see whether visitors even start the video.</li><li>Read the <strong>audience-retention curve</strong> to find where they leave and the percentage who reach the case for registering.</li><li>Use the <strong>second-by-second engagement heatmap</strong> (Pro) to tie each drop to a specific section.</li><li>Turn on <strong>conversion and CTA tracking</strong> to see whether viewers who reach the ask click through to the form.</li><li>Split by <strong>UTM and source attribution</strong> to tell a message problem from a traffic problem.</li></ul><p>If you need it, viewer-level history (Pro) lets you follow how individual visitors moved through the video. No PII is collected. To start, create a free VidaPulse account, wrap the video in front of your form, and see whether people watch, how far they get, and whether they reach the ask, before you blame the form or your traffic.</p>`,
  faq: [
    {
      q: `Should I simplify my registration form first?`,
      a: `Only after you confirm people are reaching it. Registrations usually stall because the video in front of the form loses people before it persuades them, not because the form has too many fields. Check play rate, retention, and whether viewers reach the CTA first, then simplify the form if the data points there.`,
    },
    {
      q: `How do I tell a traffic problem from a video problem?`,
      a: `Split your retention and CTA data by UTM and source attribution. If people from every source drop at the same point in the video, it is a video problem. If only one campaign converts poorly while others reach the ask fine, the issue is more likely a mismatch between that traffic and the video.`,
    },
    {
      q: `People reach my CTA but still do not register. What now?`,
      a: `That points to friction at the step itself rather than weak persuasion. Look at the handoff from the video to the form: is the next action clear, fast, and asking only for what you need? Conversion and CTA tracking confirms they reached the ask, so the fix is in the registration step, not the script.`,
    },
  ],
};
