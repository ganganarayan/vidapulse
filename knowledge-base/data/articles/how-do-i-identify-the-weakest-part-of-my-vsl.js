'use strict';

module.exports = {
  metaTitle: `How do I identify the weakest part of my VSL? | VidaPulse`,
  metaDescription: `Find the weakest part of your VSL by reading the steepest drop on the retention curve, confirming the second on the heatmap, then rewriting that section first.`,
  answer: `You identify the weakest part of your VSL by finding the steepest drop on the audience-retention curve, then confirming the exact second on a second-by-second heatmap. The steepest cliff is where you lose the most viewers in the shortest span, so it is the section doing the most damage. Rewrite that one part first, republish, and re-measure to confirm the drop shrank. The loop is always the same: measure, change one thing, measure again.`,
  sections: [
    {
      h2: `The weakest part is the steepest drop, not your least favorite line`,
      html: `<p>Most people pick the weakest part of their VSL by feel. They rewatch it, wince at a line they never liked, and rewrite that. The problem is that your taste and your viewers' behavior often disagree. The line you dislike may be holding attention fine, while the section quietly bleeding viewers is one you never suspected.</p>
<p>The weakest part is defined by the audience, not by you. It is the moment where the most viewers leave in the shortest span, and that has a precise signature on the data: the steepest downward segment of your retention curve. Find that cliff and you have found the section costing you the most, regardless of how you feel about the writing.</p>
<p>This reframing matters because it removes opinion from the diagnosis. You are no longer arguing about what is good; you are reading where people leave.</p>`,
    },
    {
      h2: `Step 1: read the retention curve for the steepest drop`,
      html: `<p>The audience-retention curve plots the percentage of viewers still watching at each second. It only ever goes down or holds flat, so every downward step is a record of people quitting at that exact moment. Your job is to find the sharpest step.</p>
<ol><li><strong>Get a stable curve.</strong> Let real traffic run through the video until the shape settles, not just a handful of sessions. A curve built on ten views can mislead you.</li>
<li><strong>Ignore the gentle slope.</strong> Every video loses viewers steadily; that slow decline is normal and not your target. Run your eye past it.</li>
<li><strong>Find the steepest cliff.</strong> Look for the near-vertical fall where many viewers leave in a short span. That is your candidate for the weakest part.</li>
<li><strong>Rank the top two or three.</strong> Note the steepest drops in order. You will fix the worst one first, but knowing the runners-up tells you what comes next.</li></ol>
<p>At the end of this step you have a rough location: the weakest part lives in this region of the timeline. Now you need to make it exact.</p>`,
    },
    {
      h2: `Step 2: confirm the exact second on the heatmap`,
      html: `<p>The retention curve points you to roughly where the bleed is. It is not precise enough to tell you which sentence or visual triggered it. For that you need the second-by-second engagement heatmap, which resolves down to individual seconds.</p>
<p>Zoom into the region the curve flagged and find the exact second the drop begins. Then go to that second in your video and look at what is actually happening: the specific line being spoken, the visual on screen, the transition that just occurred. This is the difference between "people leave somewhere in the middle" and "people leave the moment I start the three-minute backstory." Only the second one is fixable.</p>
<p class="kb-example">Hypothetical illustration: the curve shows a steep fall around the 1:40 mark. The heatmap narrows it to 1:38, and at 1:38 you find the start of a long tangent about how the product was built. Now you know exactly what to cut, not just that something in the middle is wrong.</p>`,
    },
    {
      h2: `Step 3: rewrite that section first`,
      html: `<p>With the exact second identified and the cause in front of you, rewrite that one section before touching anything else. Resist the urge to do a full overhaul. The whole point of isolating the weakest part is to fix it in a way you can measure.</p>
<ul class="kb-list"><li><strong>Cut or tighten.</strong> If the drop is a slow stretch, the fix is usually to trim it: remove the tangent, shorten the setup, delete the repeated point.</li>
<li><strong>Add a forward pull.</strong> If viewers leave because the section gives no reason to stay, plant a reason to keep watching for what comes next.</li>
<li><strong>Match intent.</strong> If the drop is at the open, make the first line pay off the hook that brought viewers in.</li></ul>
<p>Change only the weakest section this round. Leave the rest of the video alone. That discipline is what lets you attribute any change in the curve to this specific edit instead of wondering which of five changes mattered.</p>`,
    },
    {
      h2: `Step 4: measure, change, remeasure`,
      html: `<p>An edit is a hypothesis, not a result. You believe rewriting the weakest section will shrink the drop, but you do not know until you re-measure. So close the loop.</p>
<ol><li><strong>Republish</strong> the edited version on the same page where your VSL runs.</li>
<li><strong>Run real traffic</strong> through it until the new curve stabilizes.</li>
<li><strong>Lay the new curve next to the old one</strong> at the same timestamp. If the cliff got shallower, the edit worked. If it did not move, you fixed the wrong cause and should look again at what happens at that second.</li>
<li><strong>Move to the next steepest drop</strong> and repeat the whole process.</li></ol>
<p>This is the engine behind every VSL that gets better over time: measure the weakest part, change one thing, measure again. Each round flattens one more drop and pushes a larger share of viewers toward your offer. Done repeatedly, it turns a leaky VSL into one that holds.</p>`,
    },
  ],
  solve: `<p>VidaPulse is built to make this exact diagnosis fast. You paste your existing video URL from wherever it already lives (YouTube, Amazon S3, Google Drive, Dropbox, OneDrive, Azure Blob, Loom, a Zoom recording, Vimeo, or a direct MP4/HLS link), VidaPulse wraps it in an analytics player, and you embed it with one line of script or a script-free iframe. There is no re-hosting; your VSL stays where it is and keeps its URL.</p>
<p>From there, each step in this guide is a built-in report:</p>
<ul class="kb-list"><li>The <strong>audience-retention curve</strong> shows the steepest drop, so you find the weakest part by data instead of by taste (Step 1).</li>
<li>The <strong>second-by-second engagement heatmap</strong> (Pro) pins the drop to the exact second, so you tie it to a specific line or visual (Step 2).</li>
<li>Because the tracking lives in the embedded player, you can republish an edit and compare the new curve directly against the old one at the same timestamp (Step 4).</li>
<li><strong>Average watch time</strong> and the <strong>percentage of viewers who reach any point</strong> confirm the section's cost and whether your fix moved more viewers toward the offer.</li></ul>
<p>No personal data is collected. To start, create a free VidaPulse account, wrap your own VSL, and read the curve to find your weakest section before you rewrite anything.</p>`,
  faq: [
    {
      q: `How do I know which part of my VSL is weakest?`,
      a: `Read the audience-retention curve and find the steepest downward segment. That cliff is where the most viewers leave in the shortest span, which makes it the section doing the most damage, regardless of how you feel about the writing. Then confirm the exact second on a second-by-second heatmap so you can tie the drop to a specific line or visual rather than a vague region.`,
    },
    {
      q: `Should I rewrite the whole VSL or just the weakest part?`,
      a: `Just the weakest part, one section at a time. If you rewrite everything at once and the curve moves, you will not know which change did it, so you cannot repeat the win or undo any harm. Fix the steepest drop first, republish, and re-measure. Then move to the next steepest drop. The loop is slower per round but far faster at actually improving the video.`,
    },
    {
      q: `Why not just trust my gut on which section is weak?`,
      a: `Because your taste and your viewers' behavior often disagree. The line you dislike may be holding attention fine, while the section quietly losing viewers is one you never suspected. The retention curve replaces opinion with evidence: it shows exactly where people leave, so you fix the part that is actually costing you instead of the part that merely bothers you.`,
    },
  ],
};
