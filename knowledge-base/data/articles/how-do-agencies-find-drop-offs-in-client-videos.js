module.exports = {
  metaTitle: `How do agencies find drop-offs in client videos? | VidaPulse`,
  metaDescription: `Agencies find drop-offs in client videos with the retention curve and heatmap — pinpoint the exact moment viewers leave, then recommend a targeted fix.`,
  answer: `Agencies find drop-offs in client videos by reading the audience-retention curve to locate the steepest declines, then using the second-by-second engagement heatmap to pin the exact moment viewers leave. The curve shows where attention falls; the heatmap shows the precise second so you can tie the drop to a specific line, claim, or pacing choice. Once you know the moment, you can recommend a targeted fix instead of a vague rewrite — and re-measure on fresh traffic to confirm it worked.`,
  sections: [
    {
      h2: `Start with the retention curve`,
      html: `<p>The audience-retention curve is where every drop-off investigation begins. The y-axis is the share of viewers still watching; the x-axis is time. Flat stretches mean the message is holding; steep cliffs are where viewers walk out. For each client video, find the two or three steepest drops and note their timestamps — those are the moments costing the client viewers.</p><p>Then read the one number that frames the whole video: what percentage of viewers are still watching when the offer or call to action appears. If that reach-to-offer figure is low, the drop-offs upstream are the client's real problem, and no amount of polishing the offer will fix it. The curve tells you whether to look before the ask or at the ask itself.</p>`,
    },
    {
      h2: `Pin the exact second with the heatmap`,
      html: `<p>A curve tells you roughly where viewers leave; the second-by-second engagement heatmap (Pro) tells you exactly when, and shows which moments get replayed versus skipped. That precision is the difference between "the middle is weak" and "viewers leave at 0:48, right when the long backstory starts." You cannot recommend a confident fix from the first; you can from the second.</p><p>The heatmap is also where you separate a confusing moment from a boring one. A spot that viewers replay may be unclear and worth clarifying; a spot they abandon is losing them outright and needs cutting or rewriting. Reading both together turns a drop on the curve into a specific, defensible recommendation.</p>`,
    },
    {
      h2: `Read the pattern, then recommend the fix`,
      html: `<p>Different drop-off shapes point to different causes, and naming the cause is what lets you tell the client what to change:</p><ul class="kb-list"><li><strong>A sharp drop in the first seconds</strong> means the open is not paying off the promise that brought viewers in. Recommend cutting the intro and stating who the video is for.</li><li><strong>A mid-video sag</strong> usually marks a long backstory or a vague stretch. Recommend tightening that one segment, not rewriting the whole script.</li><li><strong>A drop right at the offer</strong> means the transition into the ask is too abrupt or the value is not yet built. Recommend strengthening the run-up.</li><li><strong>A low play rate with a healthy curve</strong> points away from the video entirely — that is a thumbnail or page problem, not a script problem.</li></ul>`,
    },
    {
      h2: `Rule out traffic before you blame the video`,
      html: `<p>Not every drop-off is the video's fault. Sometimes one campaign sends colder or differently-primed viewers, and the same opening that holds one audience falls flat for another. Before you tell a client to recut the video, check whether the drop is uniform across sources or concentrated in one.</p><p class="kb-example">Hypothetical illustration, not real data: suppose a client video keeps half its viewers to the offer from one source but only a fifth from another. The video is the same, so the difference is the audience-to-video match, not the script. The fix there is to align that campaign's promise with what the video delivers, not to rewrite the video for everyone.</p><p>UTM and source attribution lets you split the retention curve by where viewers came from, so you recommend the right fix — a video edit, or a campaign-message change — instead of guessing.</p>`,
    },
  ],
  solve: `<p>VidaPulse shows you exactly where a client's video loses viewers, on whatever host the client already uses, with no re-hosting. You paste the existing video URL (YouTube, Amazon S3, Google Drive, Dropbox, OneDrive, Azure Blob, Loom, a Zoom recording, Vimeo, or a direct MP4/HLS link), VidaPulse wraps it in an analytics player, and you embed it with one line of script or a script-free iframe. The video keeps its URL.</p>
<p>To find and explain the drop-off you can use:</p>
<ul class="kb-list"><li>The <strong>audience-retention curve</strong> — the steepest drops and the reach-to-offer number.</li>
<li>The <strong>second-by-second engagement heatmap</strong> (Pro) — the exact moment viewers leave, plus replays versus first watches.</li>
<li><strong>Play rate and average watch time</strong> — to separate an attention problem from a page problem.</li>
<li><strong>UTM and source attribution</strong> — to tell a video problem from a traffic mismatch.</li>
<li><strong>Viewer-level history</strong> (Pro) — to follow how individual viewers moved through the video.</li></ul>
<p>You can export or screenshot the curve and heatmap straight into a client recommendation. No personal data is collected. Create a free VidaPulse account, wrap a client's video, and pull the retention curve to find the exact moment it loses viewers before you recommend a single change.</p>`,
  faq: [
    {
      q: `What is the fastest way to find where a client video loses viewers?`,
      a: `Read the retention curve first and find the steepest drop, then use the second-by-second heatmap to pin the exact second. The curve shows roughly where attention falls; the heatmap shows the precise moment so you can tie it to a specific line. That two-step read gives you a confident, specific recommendation instead of a vague rewrite.`,
    },
    {
      q: `Do I need the heatmap, or is the retention curve enough?`,
      a: `The curve is enough to locate a drop and read reach-to-offer, and it is available on all plans. The second-by-second engagement heatmap (Pro) adds the exact moment and shows replays versus skips, which is what lets you tie a drop to a specific line and recommend a precise fix. For agency work where you have to justify a change to a client, the heatmap detail is worth it.`,
    },
    {
      q: `How do I know the drop is the video and not the traffic?`,
      a: `Split the retention curve by source with UTM and source attribution. If the drop is uniform across campaigns, it is the video — recommend an edit. If one source drops far harder than others at the same point, it is likely an audience-to-video mismatch, and the fix is aligning that campaign's promise with the video rather than recutting the video for everyone.`,
    },
  ],
};
