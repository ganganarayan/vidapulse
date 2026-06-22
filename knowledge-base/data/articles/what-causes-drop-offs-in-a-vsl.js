'use strict';

module.exports = {
  metaTitle: `What causes drop-offs in a VSL? | VidaPulse`,
  metaDescription: `VSL drop-offs come from weak first seconds, a slow middle, a pre-price cliff, or tech friction. Learn each cause and how to find which one is hurting you.`,
  answer: `VSL drop-offs usually come from one of four causes: weak first seconds that lose viewers before the promise lands, a slow middle where backstory drags, a cliff just before the price or offer, and technical friction like slow loading or sound-off playback. Each leaves a different shape on the audience-retention curve, so you do not have to guess. Read where the steep drops fall on the timeline and the location tells you which cause is most likely hurting you.`,
  sections: [
    {
      h2: `Weak first seconds`,
      html: `<p>The opening is where the steepest single drop almost always lives. In the first few seconds a viewer decides whether this video is worth their time, and they decide fast. A slow logo animation, a "hey, before we get started," or any throat-clearing spends the most expensive seconds in the entire video on nothing.</p>
<p>The other common opening failure is a mismatch. When traffic arrives from an ad or a link with a specific hook and the first line does not pay that hook off, the viewer feels they are in the wrong place and leaves. They never reject the offer; they reject the first sentence.</p>
<p>On the curve this shows up as a near-vertical fall right at the start. If a large share of viewers is gone within the first ten to fifteen seconds, the open is your leak, and it is the one to fix first because every later improvement only matters for people who stay past it.</p>`,
    },
    {
      h2: `A slow middle`,
      html: `<p>Once the hook lands, attention is fragile. The most common mid-video killer is a backstory or setup that runs too long. The viewer came for the promise in the open, and instead they get origin stories, throat-clearing context, or a point repeated three ways. Interested people quietly drift off while you are still warming up.</p>
<p>This is rarely about disagreement. Mid-video viewers leave out of impatience, not objection. The section asks them to wait without giving them a reason to, so they stop waiting.</p>
<p class="kb-example">Hypothetical illustration: a VSL holds steady through a strong open, then slides from 60% down to 35% across a one-minute stretch of backstory in the middle. That long downhill slide is the slow middle bleeding viewers a few at a time, and it is the section to tighten.</p>
<p>On the curve, a slow middle looks like a long downhill slide or a cliff somewhere in the body, away from both the open and the offer.</p>`,
    },
    {
      h2: `A pre-price cliff`,
      html: `<p>The most expensive drop is the one right before the offer or the price reveal, because the viewers leaving there came the furthest. They survived the open and the middle and were closest to converting, and you lost them at the worst possible moment.</p>
<p>A pre-price cliff usually means the transition into the ask felt abrupt, or the value was not clear enough yet to justify the price that just appeared. The viewer senses the pitch coming, has not been convinced the outcome is worth it, and exits before the number lands. Sometimes it is simpler: the offer arrives before viewers are ready, so the gap between "interesting" and "buy now" is too wide to cross.</p>
<p>On the curve this is a sharp fall just before your call to action begins. Because these are your most-qualified viewers, even a small pre-price cliff is worth more attention than a larger drop earlier in the video.</p>`,
    },
    {
      h2: `Technical friction`,
      html: `<p>Not every drop-off is about the script. Some viewers leave because the experience failed them before the content ever had a chance. Technical friction is easy to overlook because you, the owner, rarely experience it.</p>
<ul class="kb-list"><li><strong>Slow loading.</strong> If the player takes too long to start, viewers abandon before the first frame. This often hides inside the first-seconds cliff and gets blamed on the open when the real cause is load time.</li>
<li><strong>Sound-off playback.</strong> Many viewers, especially on mobile, start with audio muted. A VSL that relies entirely on voice with nothing on screen to hold a silent viewer loses them in the opening seconds.</li>
<li><strong>Device or browser issues.</strong> A player that behaves badly on certain devices or browsers can produce drops that look like content problems but cluster around a specific segment of your audience.</li></ul>
<p>Tech friction tends to concentrate at the very start and can mimic a weak open, which is why it is worth ruling out before you rewrite a single line.</p>`,
    },
    {
      h2: `How to find which cause is hurting you`,
      html: `<p>The four causes leave different signatures, so finding yours is a matter of reading the curve and confirming the exact second. Work through it in order:</p>
<ol><li><strong>Open the audience-retention curve.</strong> It plots the share of viewers still watching at each second, so every steep step is a record of people leaving at that moment.</li>
<li><strong>Locate the steepest drop and note where it falls.</strong> At the very start points to a weak open or tech friction; in the body points to a slow middle; just before the offer points to a pre-price cliff.</li>
<li><strong>Confirm the exact second with the heatmap.</strong> A second-by-second engagement heatmap lets you tie the drop to a specific line, visual, or moment rather than a vague region.</li>
<li><strong>Rule out tech before rewriting.</strong> If the drop is at the very start, check load time, sound-off behavior, and device or browser patterns first, because those are not script problems.</li>
<li><strong>Fix one cause and re-measure.</strong> Change the single weakest moment, republish, and compare the new curve against the old. If the drop shrinks, you found the cause; if it does not move, look again.</li></ol>
<p>The location of the drop names the cause, and the heatmap confirms it. From there it is the same loop every time: read, pinpoint, fix one thing, re-measure.</p>`,
    },
  ],
  solve: `<p>VidaPulse lets you see which of these causes is actually hurting your VSL instead of guessing. You paste your existing video URL from wherever it already lives (YouTube, Amazon S3, Google Drive, Dropbox, OneDrive, Azure Blob, Loom, a Zoom recording, Vimeo, or a direct MP4/HLS link), VidaPulse wraps it in an analytics player, and you embed it with one line of script or a script-free iframe. There is no re-hosting; your VSL stays where it is and keeps its URL.</p>
<p>Then each cause becomes visible:</p>
<ul class="kb-list"><li>The <strong>audience-retention curve</strong> shows where the steep drops fall, and the location separates a weak open from a slow middle from a pre-price cliff.</li>
<li>The <strong>second-by-second engagement heatmap</strong> (Pro) pins the drop to the exact second so you tie it to a specific line or moment.</li>
<li><strong>Device and browser</strong> breakdowns plus <strong>play rate</strong> help you spot technical friction that mimics a weak open.</li>
<li>The <strong>percentage of viewers who reach any point</strong> tells you how costly a pre-price cliff really is, since those viewers came the furthest.</li></ul>
<p>No personal data is collected. To start, create a free VidaPulse account, wrap your own VSL, and read the curve to see which drop-off cause is costing you the most.</p>`,
  faq: [
    {
      q: `What is the most common cause of VSL drop-off?`,
      a: `The weak open. The steepest single drop on most retention curves is in the first few seconds, where viewers decide almost instantly whether to stay. Slow intros, throat-clearing, and a first line that does not match the ad or link that brought them are the usual culprits. Fix the open first, because every later improvement only helps the viewers who stay past it.`,
    },
    {
      q: `How do I tell a content drop-off from a technical one?`,
      a: `Look at where the drop sits and rule out tech at the start. Technical friction like slow loading or sound-off playback concentrates at the very beginning and can mimic a weak open. Before rewriting the script, check load time, muted-playback behavior, and whether the drop clusters on specific devices or browsers. If those are clean and the drop is still there, treat it as a content problem.`,
    },
    {
      q: `Which drop-off should I fix first?`,
      a: `Usually the open, because it is the largest and gates everything after it. The exception is a pre-price cliff: a drop right before the offer costs you your most-qualified viewers, the ones who came the furthest, so even a smaller cliff there can be worth more than a larger one earlier. Read the curve, weigh size against how close to the offer the drop sits, and fix the costliest one first.`,
    },
  ],
};
