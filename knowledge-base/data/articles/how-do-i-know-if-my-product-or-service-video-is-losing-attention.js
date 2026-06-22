module.exports = {
  metaTitle: `How do I know if my product or service video is losing attention? | VidaPulse`,
  metaDescription: `You know your product or service video is losing attention by reading the retention curve and heatmap for early cliffs and mid-video sag, then confirming.`,
  answer: `You know your product or service video is losing attention by reading its retention curve and heatmap, not by watching it yourself or trusting view counts. The two telltale shapes are an early cliff, a steep drop in the first seconds, and a mid-video sag, a long slide where interest quietly drains. Each points to a different cause and a different fix. Confirm what you see by checking how the same drop behaves across enough viewers and across sources before you change anything.`,
  sections: [
    {
      h2: `Why view counts cannot tell you this`,
      html: `<p>A high view count feels like proof the video is working, but it only proves people pressed play. It says nothing about whether they kept watching, reached the point that matters, or quit ten seconds in. A video can have thousands of views and lose almost everyone before it makes its case, and the view count would never reveal it.</p><p>To know whether you are losing attention, you need to see the shape of consumption: how many viewers are still watching at each second. That is the audience-retention curve, and it turns a vague worry into a specific, readable fact. The y-axis is the share of viewers still watching; the x-axis is time. Flat stretches are healthy attention; downward slopes and cliffs are attention leaving.</p>`,
    },
    {
      h2: `Sign one: the early cliff`,
      html: `<p>The first and most expensive leak is an early cliff, a steep drop in the opening seconds. On the curve it looks like the line falling off a ledge right at the start. It means viewers are quitting before the video says anything worth staying for, often because the open is slow, generic, or does not match what made them click.</p><p>This sign matters most because every later moment of the video only reaches the viewers who survive the open. If half your audience is gone in the first 10 to 15 seconds, the rest of your video, however good, is playing to a half-empty room. An early cliff is almost always the first thing to confirm and fix.</p>`,
    },
    {
      h2: `Sign two: the mid-video sag`,
      html: `<p>The second pattern is subtler: a long, steady downhill slide somewhere in the middle, or a sharp drop partway through. This is the mid-video sag. The hook landed, viewers stayed for a while, and then attention drained, usually during a section that runs long, repeats a point, or asks for patience without giving a reason to keep watching.</p><p>The mid-video sag is dangerous because it happens after viewers were interested, which makes it easy to miss. They did not bounce; they drifted. On a product or service video, the sag often sits right where you explain a feature, tell the backstory, or build up to the offer, exactly the parts you most need people to reach.</p><p class="kb-example">Example: Suppose your curve holds steady through a strong open, then slides from roughly 1:20 to 2:05 before flattening again. That 45-second slide is your sag. It tells you the segment in that window is where interest is leaking, so that is the only part you investigate first, not the whole video.</p>`,
    },
    {
      h2: `Confirm the drop before you act on it`,
      html: `<p>A single odd-looking session is not a pattern. Before you re-shoot or rewrite, confirm that the drop is real and consistent.</p><ul class="kb-list"><li><strong>Wait for enough viewers.</strong> Read the curve once it is built from real traffic, not a handful of sessions, so you trust the shape over noise. Total and unique viewer counts tell you how much weight the curve carries.</li><li><strong>Pinpoint it with the heatmap.</strong> The second-by-second engagement heatmap (Pro) shows which exact moments get skipped or abandoned, so you can tie the drop to a specific sentence or scene rather than a rough timestamp.</li><li><strong>Check it across sources.</strong> Split the curve by UTM and source attribution. If the drop appears for every source, it is the video; if it only shows for one campaign, the issue may be a mismatch between that traffic and the video.</li><li><strong>Look at replays.</strong> A spike in replays around the drop can mean confusion, viewers rewinding to re-understand, which is a different fix than pure boredom.</li></ul><p>Once you have confirmed where and for whom the drop happens, you have a specific target. Change that one section, then read the curve again to see whether the cliff or sag actually flattened.</p>`,
    },
  ],
  solve: `<p>VidaPulse shows you whether your product or service video is losing attention, and exactly where, on the video you already have, without re-hosting it. You paste your existing video URL from wherever it lives (YouTube, Amazon S3, Google Drive, Dropbox, OneDrive, Azure Blob, Loom, Zoom recording, Vimeo, a direct MP4 or HLS link, and more), VidaPulse wraps it in an analytics player, and you embed one line of script or a script-free iframe on your page. The video stays put and keeps its URL.</p><p>Then the signs become readable instead of guessed:</p><ul class="kb-list"><li>Read the <strong>audience-retention curve</strong> to spot an early cliff or a mid-video sag and the timestamp of each.</li><li>Use the <strong>second-by-second engagement heatmap</strong> (Pro) to tie a drop to a specific sentence or scene.</li><li>Check <strong>total and unique viewers</strong> so you trust the curve's shape, and <strong>replays vs first-time watches</strong> to tell confusion from boredom.</li><li>Confirm with <strong>average watch time</strong> and the <strong>percentage reaching any point</strong> to see how many survive to the parts that matter.</li><li>Split by <strong>UTM and source attribution</strong> to confirm whether the drop is the video or one traffic source.</li></ul><p>No PII is collected. To start, create a free VidaPulse account, wrap your own product or service video, and read its retention curve, the honest answer to whether it is losing attention and where.</p>`,
  faq: [
    {
      q: `How many viewers do I need before I trust the retention curve?`,
      a: `Enough that the curve is stable rather than a handful of sessions. Watch the total and unique viewer counts: once new sessions stop changing the shape meaningfully, the curve is reliable. Acting on two or three sessions risks chasing noise instead of a real drop.`,
    },
    {
      q: `What is the difference between an early cliff and a mid-video sag?`,
      a: `An early cliff is a steep drop in the first seconds, meaning viewers quit before the video earns their attention, usually a slow or mismatched open. A mid-video sag is a slower slide later on, meaning interest drained during a section that ran long or lost momentum. They need different fixes, so it matters which one you have.`,
    },
    {
      q: `Could a drop mean confusion rather than boredom?`,
      a: `Yes. If you see a spike in replays around the drop, viewers may be rewinding to re-understand something, which signals confusion rather than disinterest. The second-by-second heatmap helps you see exactly which moment gets rewatched so you can clarify it rather than just cut it.`,
    },
  ],
};
