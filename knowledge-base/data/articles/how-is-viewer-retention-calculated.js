module.exports = {
  metaTitle: `How is viewer retention calculated? | VidaPulse`,
  metaDescription: `Viewer retention is the percentage of viewers still watching at each timestamp relative to those who started, measured per second and based on unique viewers.`,
  answer: `Viewer retention is calculated as the percentage of viewers still watching at each point in a video, relative to everyone who started it. If 100 people press play and 60 are still watching at the one-minute mark, retention at that point is 60 percent. It is measured continuously along the timeline, usually second by second, so you get a curve rather than a single number, and it is based on unique viewers so replays do not inflate it.`,
  sections: [
    {
      h2: `The basic formula`,
      html: `<p>Retention at any moment is a ratio: the number of viewers still watching at that timestamp, divided by the number who started the video, expressed as a percentage. The denominator is fixed at the start, the count of people who pressed play, and the numerator shrinks as people leave.</p><p>Because the starting group is the baseline, retention almost always begins at or near 100 percent and only goes down or holds flat from there. Once a viewer leaves at a given second, they no longer count toward the numerator at any later second, which is why the line never recovers the way a heatmap can.</p><p class="kb-example">Example: suppose 200 people start your video. At the 30-second mark, 150 are still watching, so retention is 75 percent. At 90 seconds, 80 remain, so retention is 40 percent. At the point where you make your offer, 50 remain, so 25 percent of your original audience is there to hear it. Each of those is the same calculation applied at a different timestamp.</p>`,
    },
    {
      h2: `Why it is measured per second`,
      html: `<p>A single average, like "average watch time: 47 seconds," hides where the leaving actually happens. Two videos can share the same average while one loses half its viewers in a sudden cliff and the other sheds them in a slow, even drift. Those are different problems with different fixes, and only per-second measurement tells them apart.</p><p>Measuring retention at each second produces a curve across the whole runtime instead of one figure. Read left to right, that curve shows the exact moments where attention falls off: a steep vertical drop marks a moment many people quit at once, while a gentle downward slope marks steady, gradual loss. The finer the resolution, the more precisely you can tie a drop to a specific sentence or section rather than a vague "somewhere in the middle."</p>`,
    },
    {
      h2: `Unique viewers, not replays`,
      html: `<p>Retention should describe people, not playbacks. If it counted every play event, a single enthusiastic viewer who rewinds the same section five times could make that section look far more popular than it is, and the percentages would stop meaning "share of your audience."</p><p>To avoid that, retention is calculated on <strong>unique viewers</strong>. Each distinct person is counted once toward the baseline, typically identified by a first-party cookie or a localStorage ID rather than by personal data. Replays and rewinds by someone already counted do not add new people to the calculation. This is also why retention and a heatmap differ: the retention curve only ever falls as unique viewers leave, while a heatmap can rise again later because it captures replay intensity. The retention curve answers "how many distinct people are still here?", which is the honest measure of how far your audience travels.</p>`,
    },
    {
      h2: `What can skew a retention reading`,
      html: `<p>The calculation is simple, but a few real-world factors can distort what the curve seems to say, and it is worth knowing them before you act on a number:</p><ul class="kb-list"><li><strong>Small sample sizes</strong> — with only a handful of viewers, one person leaving moves the percentage sharply, so early curves can look dramatic for no real reason. Wait for enough viewers before drawing conclusions.</li><li><strong>Autoplay and mixed traffic</strong> — if a video starts automatically, many "starts" are people who never intended to watch, which can depress early retention compared with a video people deliberately click to play.</li><li><strong>Source differences</strong> — viewers from a cold ad and viewers from your own email list behave very differently. Blending them into one curve can hide the fact that one source retains well and another bleeds out instantly.</li><li><strong>Seeking and skipping</strong> — viewers who jump ahead or scrub around can complicate a naive count, which is why measurement focuses on whether each second was actually watched rather than simply where the playhead landed.</li></ul><p>None of these break the method; they just mean you should read retention alongside viewer counts and source data rather than treating a single curve as the whole story.</p>`,
    },
  ],
  solve: `<p>VidaPulse calculates viewer retention on a video you already host, with no re-hosting. You paste any video URL, from YouTube, Amazon S3, Google Drive, Dropbox, OneDrive, Azure Blob, Loom, a Zoom recording, Vimeo, or a direct MP4 or HLS file, and VidaPulse wraps it in an analytics player you embed with one line of script or a script-free iframe.</p><p>It does the calculation the way it should be done:</p><ul class="kb-list"><li>Retention is plotted as a <strong>per-second curve</strong>, so you see the exact timestamps where viewers leave, not just an average.</li><li>It is based on <strong>unique viewers</strong>, identified by a first-party cookie or localStorage ID, so replays do not inflate the percentages and no personal data is collected.</li><li>The <strong>second-by-second heatmap</strong> (Pro) sits alongside the curve and distinguishes first watches from replays, so you can see both how many people remain and how intensely each second is watched.</li><li><strong>Source attribution</strong> lets you separate retention by UTM or channel, so a strong segment is not masked by a weak one.</li></ul><p>You can start free: the Free plan covers one video forever with no card. Create a free account, analyze one of your own videos, and read its real retention curve, including the percentage of viewers who reach your offer.</p>`,
  faq: [
    {
      q: `What does 60 percent retention at one minute mean?`,
      a: `It means that of everyone who started the video, 60 percent were still watching at the one-minute mark. Retention is always measured relative to the people who pressed play, so it starts near 100 percent and falls as viewers leave.`,
    },
    {
      q: `Does rewatching a video count twice in retention?`,
      a: `No. Retention in VidaPulse is based on unique viewers, each counted once by a first-party ID, so replays and rewinds by the same person do not inflate the percentages. Replay intensity shows up in the heatmap instead, which can rise again later in the video.`,
    },
    {
      q: `Why does my retention curve look erratic?`,
      a: `Usually small sample size. With few viewers, one person leaving swings the percentage a lot, so early curves can look jagged. Autoplay traffic and blending very different sources can also distort it. Wait for enough viewers and segment by source before drawing conclusions.`,
    },
  ],
};
