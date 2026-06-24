module.exports = {
  metaTitle: `How do agencies A/B test client VSLs? | VidaPulse`,
  metaDescription: `Agencies A/B test client VSLs by wrapping each version, splitting traffic by UTM, and comparing retention, reach-to-offer, and conversions to pick the winner.`,
  answer: `Agencies A/B test client VSLs by wrapping each version as its own analytics player, sending comparable traffic to each, and comparing them on the same three measures: retention, reach-to-offer, and conversions. Because VidaPulse needs no re-hosting, you can test whatever versions the client already has on whatever host they use. The winner is the version that gets more viewers to the offer and more of them to convert — decided on data, not taste.`,
  sections: [
    {
      h2: `Set up each version as its own video`,
      html: `<p>A clean test starts with each version tracked separately. You paste the URL of version A and the URL of version B, and VidaPulse wraps each one in its own analytics player with no re-hosting — both can live wherever the client already keeps them, whether YouTube, Amazon S3, Google Drive, Dropbox, OneDrive, Azure Blob, Loom, a Zoom recording, Vimeo, or a direct MP4 or HLS link.</p><p>Name the two consistently so the comparison stays obvious — for example client name plus "VSL v1" and "VSL v2." Each video keeps its own retention curve, reach-to-offer, and conversions, so the two versions never blend in the data. That separation is what lets you read a difference between them with confidence rather than untangling a single mixed dataset.</p>`,
    },
    {
      h2: `Split traffic cleanly`,
      html: `<p>A comparison is only fair if each version sees comparable traffic. The cleanest way to keep the split honest is with UTMs: tag the links pointing to each version so VidaPulse's source attribution can confirm each one received traffic from the same campaigns and sources. If one version is fed by cold ads and the other by warm email, any difference you see is about the audience, not the video.</p><p>Run the two versions over the same window so seasonality and campaign timing affect both equally, and let enough viewers through each before reading the result — a difference on a handful of views is noise. Decide the test length and traffic split before you start, so you are not tempted to call a winner early because one version jumped ahead in the first day.</p>`,
    },
    {
      h2: `Compare on three measures`,
      html: `<p>Judge the versions on the same three numbers every time, in this order:</p><ul class="kb-list"><li><strong>Retention</strong> — which version holds more viewers, read from the retention curve, and where each one loses them.</li><li><strong>Reach-to-offer</strong> — which version gets a higher share of viewers to the moment the offer appears, from the percentage-reaching-any-point metric.</li><li><strong>Conversions</strong> — which version turns more of those viewers into the action that matters, from conversion and CTA tracking (Pro).</li></ul><p>Read them together rather than in isolation. A version can win on early retention but lose on reach-to-offer, or hold fewer viewers yet convert more of the ones who stay. The version that moves more people all the way to the offer and to the action is the one that earns the client revenue, so conversions are the tie-breaker when the engagement metrics disagree.</p>`,
    },
    {
      h2: `Pinpoint why one version won`,
      html: `<p>Picking a winner is useful; understanding why it won is what makes the next test better. Lay the two retention curves side by side to see where they diverge, then use the second-by-second engagement heatmap (Pro) on each version to pin the difference to a specific line or change. That tells you which edit actually moved the numbers.</p><p class="kb-example">Hypothetical illustration, not real data: two versions of a client VSL might differ only in the opening fifteen seconds. If the new open holds more viewers past that point and lifts reach-to-offer while the rest of the video is identical, the heatmap and curves would show the gain appearing right after the changed open — strong evidence the open was the cause.</p><p>Record the result against your baseline, keep the winner live, and feed what you learned into the next version. Export or screenshot the comparison so the client sees the decision was made on evidence.</p>`,
    },
  ],
  solve: `<p>VidaPulse makes version testing straightforward because each version is just another wrapped video, with no re-hosting. You paste each version's existing URL (YouTube, Amazon S3, Google Drive, Dropbox, OneDrive, Azure Blob, Loom, a Zoom recording, Vimeo, or a direct MP4/HLS link), VidaPulse wraps each in its own analytics player, and you embed with one line of script or a script-free iframe.</p>
<p>To run and read an A/B test you use:</p>
<ul class="kb-list"><li>The <strong>audience-retention curve</strong> on each version to compare where viewers stay and leave.</li>
<li>The <strong>percentage of viewers who reach any point</strong> to compare reach-to-offer.</li>
<li><strong>Conversion and CTA tracking</strong> (Pro) to compare the action that drives revenue.</li>
<li><strong>UTM and source attribution</strong> to keep the traffic split fair across versions.</li>
<li>The <strong>second-by-second engagement heatmap</strong> (Pro) to pin down why one version won.</li></ul>
<p>Each video keeps its own analytics so the two versions never blend, and you can export or screenshot the comparison for the client. No personal data is collected. The Pro plan's unlimited videos let you run as many version tests as you like across every client, with no per-video cap on how many variants you wrap. Create a free VidaPulse account and wrap two versions of a client VSL to start your first test.</p>`,
  faq: [
    {
      q: `How do I keep two VSL versions from blending in the data?`,
      a: `Wrap each version as its own video — each keeps a separate retention curve, reach-to-offer, and conversion record, so they never mix. Name them consistently, for example "VSL v1" and "VSL v2" under the client, and tag the links to each with UTMs so source attribution confirms each saw comparable traffic. The separation is what lets you read a real difference between the versions.`,
    },
    {
      q: `Which metric decides the winner?`,
      a: `Compare retention, reach-to-offer, and conversions together, but treat conversions as the tie-breaker, since that is what earns the client revenue. A version can win on early retention yet lose on reach-to-offer, or hold fewer viewers yet convert more of the ones who stay. The version that moves more people all the way to the offer and to the action is the one to keep live.`,
    },
    {
      q: `Can I afford to test many versions across clients?`,
      a: `Yes. The Pro plan covers unlimited videos, so wrapping extra variants does not run you into a per-video cap, and conversion tracking plus the second-by-second heatmap are included for reading each test precisely. One account can hold every version for every client, which makes continuous version testing a standard part of your process rather than an occasional exception.`,
    },
  ],
};
