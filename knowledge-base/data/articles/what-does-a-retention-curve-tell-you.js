module.exports = {
  metaTitle: `What does a retention curve tell you? | VidaPulse`,
  metaDescription: `A retention curve tells you where a video wins and loses attention. Learn to read the early cliff, plateaus, rewatch bumps, and the drop at the offer.`,
  answer: `A retention curve tells you where your video wins and loses attention by plotting the percentage of viewers still watching at each moment. Its shape is the message: a steep early cliff means the opening fails, long flat plateaus mean a section is holding people, small bumps mean viewers are rewatching, and a drop right at the offer means people leave when you ask. Reading the shape turns vague impressions into specific, fixable problems with exact timestamps.`,
  sections: [
    {
      h2: `How to read the shape, not the number`,
      html: `<p>A retention curve starts near 100 percent, with everyone who pressed play, and falls as viewers leave. Because it is measured along the timeline, the useful information is in the <strong>shape</strong>, not in any single point. Where the line drops fast, you are losing people quickly; where it stays flat, you are holding them; where it dips and recovers, something is being rewatched.</p><p>Read it left to right like a story of attention. Steep sections are moments of mass exit. Flat sections are moments that earn their place. The slope at any point tells you the rate of loss, and the rate of loss is what points you to the edit. The goal is not to memorize percentages but to recognize a handful of recurring shapes, each of which means something specific about your video.</p>`,
    },
    {
      h2: `The early cliff`,
      html: `<p>The most common and most costly shape is a sharp drop in the first few seconds, a near-vertical cliff before the curve settles. This is the opening failing to do its one job: confirm to viewers that they are in the right place and that staying is worth it.</p><p>An early cliff usually means one of a few things: the first seconds are slow or generic, the hook does not match what brought the viewer there, or there is a mismatch between the thumbnail or ad and the actual content. It is the highest-leverage drop on the entire curve, because everyone who leaves here never sees anything else you made. Fix the cliff first; a great middle and a great offer are worthless to people who already left in second three.</p><p class="kb-example">Example: a curve that falls from 100 percent to 55 percent in the first eight seconds, then levels off, is telling you that nearly half your audience decided within moments that the video was not for them. The problem is the opening, not the body.</p>`,
    },
    {
      h2: `Plateaus and the gentle slide`,
      html: `<p>Once past the opening, the healthiest shape is a <strong>plateau</strong>: a long, nearly flat stretch where the line barely descends. A plateau means that section is holding attention, viewers are following, and the content is pulling its weight. The flatter and longer the plateau, the stronger that part of the video.</p><p>The opposite is the <strong>gentle slide</strong>: a steady, even downward slope with no single cliff. A slide rarely points to one broken moment; instead it usually means the content is slowly losing people because it drags, repeats itself, or takes too long to get to the point. The fix is not a single cut but tightening and pace. When you compare plateaus against slides, you can see exactly which sections are carrying the video and which are quietly leaking it.</p>`,
    },
    {
      h2: `Bumps, and the drop at the offer`,
      html: `<p>Two more shapes carry specific meaning. The first is a <strong>small bump</strong>, a spot where the curve briefly rises or flattens against the general downward trend. Because a true retention curve based on unique viewers does not normally go back up, a visible bump signals <strong>rewatching</strong>: viewers are scrubbing back to replay a moment. That is a strong signal of either a compelling point worth leaning into or something confusing enough that people needed a second look. Pairing the curve with a heatmap, which is built to show replay intensity, tells you which.</p><p>The second is the <strong>drop at the offer</strong>: a sharp decline right at the timestamp where you make your call to action. This tells you people are leaving precisely when you ask for the sale. It may mean the transition into the offer is jarring, the ask comes before you have earned it, or the pitch itself gives people a reason to go. Whatever the cause, the curve has located it to the second, so you know exactly which moment to rewrite.</p>`,
    },
  ],
  solve: `<p>VidaPulse draws a retention curve for a video you already host, with no re-hosting. You paste any video URL, from YouTube, Amazon S3, Google Drive, Dropbox, OneDrive, Azure Blob, Loom, a Zoom recording, Vimeo, or a direct MP4 or HLS file, and VidaPulse wraps it in an analytics player you embed with one line of script or a script-free iframe.</p><p>Then it gives you everything you need to read the shape:</p><ul class="kb-list"><li>A <strong>per-second retention curve</strong> so the early cliff, plateaus, slides, and the drop at the offer all show up at their exact timestamps.</li><li>The <strong>percentage of viewers reaching any point</strong>, so you can quantify how many survive each section.</li><li>The <strong>second-by-second heatmap</strong> (Pro) to confirm whether a bump is genuine rewatching, since it distinguishes first watches from replays.</li><li><strong>Source attribution</strong> to compare curves by UTM or channel, so warm and cold traffic are not blended into one misleading line.</li></ul><p>Unique viewers are counted by a first-party ID with no personal data collected. You can start free: the Free plan covers one video forever with no card. Create a free account, analyze one of your own videos, and read its real curve, from the opening cliff to the moment of the offer.</p>`,
  faq: [
    {
      q: `What does a steep early drop in a retention curve mean?`,
      a: `It means the opening is failing to hold viewers. A sharp cliff in the first few seconds usually points to a slow or generic start, a hook that does not match what brought viewers in, or a mismatch with the thumbnail or ad. It is the highest-leverage problem to fix because everyone who leaves there sees nothing else.`,
    },
    {
      q: `Why would a retention curve briefly go up?`,
      a: `A small bump against the downward trend usually means viewers are rewatching that moment. Since a unique-viewer curve does not normally rise, a bump signals replays, which point to either a compelling point or something confusing. Check it against the heatmap, which is built to show replay intensity.`,
    },
    {
      q: `What does a drop at the call to action tell me?`,
      a: `It tells you people are leaving exactly when you ask for the sale. The transition into the offer may be jarring, the ask may come before you have earned it, or the pitch itself may give people a reason to go. The curve locates it to the second, so you know which moment to rewrite.`,
    },
  ],
};
