'use strict';

module.exports = {
  metaTitle: `Why are viewers leaving my video? | VidaPulse`,
  metaDescription: `Viewers leave for common reasons — weak hook, slow middle, wrong length, irrelevance, or friction. Find your specific drop point instead of guessing.`,
  answer: `Viewers usually leave a video for one of five reasons: a weak hook that loses them in the first seconds, a slow middle that drags, a runtime longer than the payoff justifies, content that does not match what they expected, or friction like an autoplay-muted start. But the reason that matters is yours, not the general list — and you find it by reading an audience-retention curve to see exactly where your viewers leave, then zooming in to see what is on screen at that second. Guessing wastes edits; the curve tells you which moment to fix.`,
  sections: [
    {
      h2: `The five common reasons viewers leave`,
      html: `<p>Most exits trace back to a short list of causes. Knowing them helps you read your own data faster:</p>
<ul class="kb-list"><li><strong>A weak hook.</strong> The first few seconds fail to promise anything worth staying for, so viewers decide instantly the video is not for them. This produces the steepest drop on most curves.</li>
<li><strong>A slow middle.</strong> The body drags — a long setup, a tangent, a repeated point, or a stretch that asks for patience without giving a reason to keep watching.</li>
<li><strong>The wrong length.</strong> The runtime outlasts the payoff. Even good content loses people to time alone; every extra minute is another chance to leave.</li>
<li><strong>Irrelevance.</strong> The video does not match what the viewer expected when they clicked — an ad or headline promised one thing and the video delivers another.</li>
<li><strong>Friction.</strong> Practical barriers: a muted autoplay start they never unmute, a slow load, or an opening that demands effort before delivering value.</li></ul>`,
    },
    {
      h2: `Why guessing from the list is not enough`,
      html: `<p>The list tells you what <em>could</em> be wrong. It cannot tell you what <em>is</em> wrong with your video. A weak hook and a slow middle call for opposite fixes, and editing the wrong one wastes effort while the real leak keeps bleeding viewers. Worse, your instinct about where people leave is often off — founders routinely assume viewers reach the offer when most never get close.</p>
<p>So the goal is not to pick a reason from the list and hope. It is to find <em>your</em> drop point first, then match it to a cause. The reasons above become a diagnosis aid once you know where on the timeline your viewers actually quit.</p>`,
    },
    {
      h2: `Find your specific drop point`,
      html: `<p>The one report that shows where viewers leave is the <strong>audience-retention curve</strong>. It plots the percentage of viewers still watching at each second, so every steep fall marks a spot where people left in numbers. Read it for cliffs, not the gentle slope that every video has.</p>
<ol><li><strong>Open the retention curve</strong> and scan for the steepest downward segments.</li>
<li><strong>Note where each cliff sits</strong> — the very start, the middle, or just before your offer. Position is the biggest clue to cause.</li>
<li><strong>Zoom in with a second-by-second engagement heatmap</strong> (a Pro feature) to pin the exact second and see what is on screen there.</li></ol>
<p>View counts cannot do this. Total views and unique viewers only tell you how many started, never when they left — so they can never explain why people leave.</p>`,
    },
    {
      h2: `Match the drop to the cause`,
      html: `<p>Where the cliff falls usually tells you which reason you are dealing with:</p>
<ul class="kb-list"><li><strong>A cliff in the first seconds</strong> almost always means a weak hook, an ad-to-video mismatch, or sound-off friction — rarely your offer.</li>
<li><strong>A cliff in the body</strong> points to a slow middle: a part that drags or loses the thread. These are often the easiest to fix, because the edit is usually "cut or tighten this."</li>
<li><strong>Steady loss across a long video with no single sharp cliff</strong> points to length — the video simply outlasts the payoff.</li>
<li><strong>A drop just before your offer</strong> is the most costly, because those viewers came the furthest. It often means the run-up lost its pull or the transition into the ask felt abrupt.</li></ul>
<p class="kb-example">Hypothetical illustration: if your curve falls from 100% to 45% in the first eight seconds and then holds steady, your problem is the hook, not the middle — so you rewrite the opening and leave the body alone this round.</p>`,
    },
    {
      h2: `Fix one thing and re-measure`,
      html: `<p>Once you know your drop point and its likely cause, change one thing and check whether it worked:</p>
<ol><li><strong>Pick the single steepest drop</strong> — the one losing the most viewers — and address only it this round.</li>
<li><strong>Make one focused edit:</strong> a stronger hook, a tightened middle, a shorter cut, or a clearer match to the ad that brought viewers in.</li>
<li><strong>Republish and run real traffic</strong> until the curve stabilizes.</li>
<li><strong>Compare the new curve to the old.</strong> If the cliff shrinks, keep the change; if it does not move, you found the wrong cause and look again.</li></ol>
<p>Changing one variable at a time lets the data tell you whether you were right — the difference between fixing your video and guessing at it.</p>`,
    },
  ],
  solve: `<p>VidaPulse turns "why are viewers leaving?" from a guess into a reading you can act on. You paste any video URL from wherever it already lives (YouTube, Amazon S3, Google Drive, Dropbox, OneDrive, Azure Blob, Loom, a Zoom recording, Vimeo, or a direct MP4/HLS), VidaPulse wraps it in an analytics player, and you embed it with one line of script or a script-free iframe on your page. No re-hosting — your video stays where it is.</p>
<p>Then you can name the cause instead of guessing it:</p>
<ul class="kb-list"><li>The <strong>audience-retention curve</strong> shows the steepest drops from your real viewers, so you see exactly where they leave.</li>
<li>The <strong>second-by-second engagement heatmap</strong> (Pro) pins the exact second so you can match the drop to what is on screen.</li>
<li><strong>Average watch time</strong> and the <strong>percentage of viewers who reach any point</strong> tell you whether length or an early cliff is the bigger problem.</li>
<li><strong>UTM and source attribution</strong> help you check whether a particular ad or channel sends viewers who leave fast — a sign of an expectation mismatch.</li></ul>
<p>Because the tracking lives in the embedded player, you measure all of this on the page where your video really runs. No personal data is collected. Create a free VidaPulse account, wrap your own video, and read the curve to find the one drop point worth fixing first.</p>`,
  faq: [
    {
      q: `What's the most common reason viewers leave a video?`,
      a: `For most videos it is a weak hook — the first few seconds fail to promise anything worth staying for, producing the steepest drop on the curve. But the most common reason in general is not necessarily yours. Read your own audience-retention curve to see where your viewers actually leave, then match that spot to a cause rather than assuming the typical one.`,
    },
    {
      q: `Can I find why viewers leave from view counts?`,
      a: `No. View counts and unique viewers only tell you how many people started the video, never when or where they left, so they cannot explain why. To find your reason you need an audience-retention curve to locate the drop and, ideally, a second-by-second heatmap to see what is on screen when viewers quit.`,
    },
    {
      q: `How do I know if it's the length or the content?`,
      a: `Read the shape of the curve. A single steep cliff at one spot points to a content problem at that moment — a weak hook or a dragging section. Steady loss across a long video with no sharp cliff points to length: the video simply outlasts the payoff. Average watch time relative to runtime confirms which pattern you have.`,
    },
  ],
};
