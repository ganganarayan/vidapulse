'use strict';

module.exports = {
  metaTitle: `Why do viewers leave in the first 3 seconds? | VidaPulse`,
  metaDescription: `Viewers quit a VSL fastest in the opening seconds. See why the first 3 seconds decide everything, the common causes, and how to fix the early drop-off.`,
  answer: `Viewers leave in the first 3 seconds because that is where they decide whether the video is worth their time, and cold ad traffic decides almost instantly. The opening is the steepest part of any retention curve: more people leave per second here than anywhere else. The usual causes are a slow or branded intro, no immediate promise, a mismatch between the ad and the video, and sound or load friction. Fix the first three seconds and every number downstream improves.`,
  sections: [
    {
      h2: `Why the first 3 seconds matter most`,
      html: `<p>Every retention curve has one universal shape: a sharp cliff at the very start, then a gentler slope. The first few seconds lose more viewers per second than any other stretch of the video. If you only have time to fix one part of your VSL, fix the opening — it is where the largest, fastest drop happens.</p>
<p>This is even harsher for cold ad traffic. Someone who clicked an ad and landed on your page has no relationship with you, no patience, and a back button one tap away. They are not deciding whether to buy yet — they are deciding, in about the time it takes to read this sentence, whether to keep watching at all. Warm traffic gives you a little grace. Cold traffic gives you almost none.</p>
<p class="kb-example">Hypothetical illustration: if 1,000 people start your VSL and 300 are gone by the 3-second mark, you have lost 30% of your audience before your message even begins. No headline, offer, or call to action downstream can recover a viewer who already left.</p>`,
    },
    {
      h2: `What actually causes the first-3-seconds drop`,
      html: `<p>The early cliff is rarely about your offer — it is about friction in the opening. The most common causes:</p>
<ul class="kb-list"><li><strong>A slow or branded intro.</strong> A logo animation, a music sting, or "Hi, my name is…" spends your most valuable seconds on something the viewer did not come for.</li>
<li><strong>No instant promise.</strong> If the first words do not signal what the viewer gets by staying, there is no reason to stay.</li>
<li><strong>Ad-to-video mismatch.</strong> The ad promised one thing; the video opens on something visually or tonally different. The viewer feels they clicked the wrong thing and leaves.</li>
<li><strong>Sound and autoplay friction.</strong> Many viewers arrive with sound off. If your opening only works with audio, a muted viewer sees nothing worth watching.</li>
<li><strong>Slow load.</strong> If the player is still buffering when attention peaks, the viewer never reaches your first second at all.</li></ul>
<p>Notice that none of these are about the quality of your argument. They are about whether the viewer ever stays long enough to hear it.</p>`,
    },
    {
      h2: `How to know your own first-3-seconds drop`,
      html: `<p>You do not have to guess. The answer is in the first few bars of your audience-retention curve. Read the very start of the curve — the segment covering roughly the first three seconds — and look at how far it has already fallen. A steep, near-vertical drop in those opening bars is the early cliff, measured on your real video rather than assumed.</p>
<p>Pair the curve with a second-by-second engagement heatmap and you can see exactly where the bleed happens: a hard fall on the very first second points to load or autoplay friction, while a fall a beat or two in usually means the opening itself failed to earn the next second. The point is to replace "I think the intro is fine" with a number you can watch.</p>`,
    },
    {
      h2: `Concrete fixes for the opening`,
      html: `<p>Once you can see the cliff, the fixes are direct:</p>
<ul class="kb-list"><li><strong>Open on the promise.</strong> Lead with the single biggest thing the viewer gets. State it in the first sentence, before anything else.</li>
<li><strong>Cut the logo intro.</strong> Move branding to the end. The opening seconds are for the viewer, not for you.</li>
<li><strong>Match the ad's hook.</strong> Open with the same words, claim, or visual the ad used. Continuity tells the viewer they are in the right place.</li>
<li><strong>Caption for sound-off.</strong> Put your opening promise on screen as text so a muted viewer gets it instantly.</li>
<li><strong>Tighten load and start.</strong> Make sure the player starts fast and the first frame is already saying something.</li></ul>
<p>Change one thing at a time so you can tell which change moved the curve. The opening is short enough that small edits — a different first line, a cut logo — can shift the early-retention number noticeably.</p>`,
    },
  ],
  solve: `<p>VidaPulse shows you the first-seconds cliff on your own video instead of leaving you to guess. Paste any video URL — YouTube, Vimeo, a direct MP4, Amazon S3, Google Drive, Loom, a Zoom recording, and more — and VidaPulse wraps it in an analytics player. Your video stays exactly where it lives; there is no re-hosting and no re-uploading.</p>
<p>From there, the audience-retention curve and the second-by-second heatmap (Pro) make the opening visible. You can read the early bars to see precisely how much you lose in the first three seconds, then test a new opening and watch whether the early-retention number actually moves:</p>
<ul class="kb-list"><li>See the exact shape of your opening cliff on real viewer data, not assumptions.</li>
<li>Swap the first line or cut the intro, then compare the new curve against the old one.</li>
<li>Confirm the fix carried downstream — more viewers past the first seconds means more viewers reaching your offer.</li></ul>
<p>The tracker collects no PII, and you can start on the Free plan with one video to measure your own opening before changing anything.</p>`,
  faq: [
    {
      q: `Is a sharp drop in the first 3 seconds normal?`,
      a: `Some early drop is normal on every video — the opening is always the steepest part of the curve. The question is how steep. A near-vertical fall in the first seconds, especially on cold ad traffic, usually signals fixable friction like a slow intro, a mismatch with the ad, or sound-off problems rather than a bad offer.`,
    },
    {
      q: `Does this only affect ad traffic?`,
      a: `It hits ad traffic hardest because cold viewers have the least patience, but the early cliff appears on warm traffic too. The fix is the same: open on the promise instead of an intro, and make the first seconds work with the sound off.`,
    },
    {
      q: `How do I tell whether it is the opening or the load time?`,
      a: `Look at where the drop lands. A fall on the very first second often points to slow load or autoplay friction, since viewers never really reach your content. A fall a beat or two in usually means the opening itself failed to earn the next second. The retention curve and heatmap show you which.`,
    },
  ],
  related: ['why-is-my-vsl-not-converting', 'how-to-improve-vsl-retention', 'how-to-find-video-drop-off-points'],
};
