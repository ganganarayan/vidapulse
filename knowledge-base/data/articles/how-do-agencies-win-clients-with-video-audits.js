module.exports = {
  metaTitle: `How do agencies win clients with video audits? | VidaPulse`,
  metaDescription: `Agencies win clients by running a free retention audit of a prospect's VSL — show exactly where it loses viewers and reach-to-offer, then propose the fix.`,
  answer: `Agencies win clients by turning a free retention audit into a sales tool: you wrap the prospect's existing video, read the retention curve and reach-to-offer, and show them exactly where their VSL leaks viewers before they have paid you anything. Because VidaPulse needs no re-hosting, you can audit a prospect's real video on its real page without their login or their files. The audit replaces a generic pitch with specific, timestamped evidence — which is far harder to say no to than an opinion.`,
  sections: [
    {
      h2: `Why a free audit beats a pitch`,
      html: `<p>A prospect has heard every agency claim "we improve conversion." What they have rarely seen is someone open their own video and point to the exact second it loses a third of its viewers. A free retention audit does that. Instead of arguing that you could help, you show a specific, measurable problem on the asset they already care about most — and a problem you can name is a problem you can be hired to fix.</p><p>The audit also flips the dynamic of the sales conversation. You are no longer asking the prospect to trust a promise; you are handing them evidence and letting the numbers make the case. That positions you as a diagnostician rather than a vendor, which is exactly the footing you want when you propose a retainer.</p>`,
    },
    {
      h2: `Run the audit on their existing video`,
      html: `<p>The reason this works as a fast sales motion is that you do not need anything from the prospect to start. You take the public URL of the video they already run and paste it into VidaPulse, which wraps it in an analytics player with no re-hosting. The video can live anywhere — YouTube, Amazon S3, Google Drive, Dropbox, OneDrive, Azure Blob, Loom, a Zoom recording, Vimeo, or a direct MP4 or HLS link.</p><p>To gather real data you place the wrapped player behind tracking with one line of script or a script-free iframe and send a sample of traffic to it, or you run it on your own test page. You are not asking for the prospect's hosting access, their CMS, or their files — which removes the usual friction that kills a free-audit offer before it starts.</p>`,
    },
    {
      h2: `Build the audit around two numbers`,
      html: `<p>Keep the audit tight so the prospect can absorb it in one sitting. Two readings carry most of the weight:</p><ul class="kb-list"><li><strong>The retention curve</strong> — where viewers leave, with the steepest drops ranked by size so the biggest leak is obvious.</li><li><strong>Reach-to-offer</strong> — the percentage of viewers who make it to the moment the offer or call to action appears, using the percentage-reaching-any-point metric.</li></ul><p>The pairing is what lands. A video can hold attention early and still fail if almost nobody reaches the ask, and reach-to-offer makes that gap impossible to ignore. On the Pro plan, the second-by-second engagement heatmap lets you pin each drop to the exact line that caused it, so the audit moves from "the middle sags" to "you lose viewers at this specific claim."</p>`,
    },
    {
      h2: `Turn findings into a proposal`,
      html: `<p>An audit only wins the account if it ends in a clear next step. Close the audit with a short ranked list — each major drop, its timestamp, and its effect on reach-to-offer — followed by what you would do about the top one or two items. The fixes are the work; the audit is the reason to hire you for it.</p><p class="kb-example">Hypothetical illustration, not real data: an audit of a prospect's VSL might show strong early retention, a hard drop during a long backstory, and an offer reached by only a quarter of viewers. The proposal would lead with "tighten the backstory to lift reach-to-offer," tied to the exact timestamp — a concrete first project rather than a vague engagement.</p><p>Export or screenshot the audit views so the prospect keeps the evidence after the call. Even if they do not sign immediately, they now associate a clear, measured improvement with your name.</p>`,
    },
  ],
  solve: `<p>VidaPulse makes the free audit fast because nothing has to be re-hosted. You paste the prospect's existing video URL (YouTube, Amazon S3, Google Drive, Dropbox, OneDrive, Azure Blob, Loom, a Zoom recording, Vimeo, or a direct MP4/HLS link), VidaPulse wraps it in an analytics player, and you put it behind tracking with one line of script or a script-free iframe. The audit runs on the real video, not a copy.</p>
<p>For an audit that wins accounts you use:</p>
<ul class="kb-list"><li>The <strong>audience-retention curve, average watch time, and play rate</strong> to find where the video loses viewers.</li>
<li>The <strong>percentage of viewers who reach any point</strong> to show reach-to-offer.</li>
<li>The <strong>second-by-second engagement heatmap</strong> (Pro) to pin each drop to an exact line.</li>
<li><strong>UTM and source attribution</strong> to confirm the pattern across traffic sources.</li>
<li><strong>Viewer-level history and conversion tracking</strong> (Pro) when the prospect wants to see the full picture.</li></ul>
<p>You can export or screenshot any view to leave the audit with the prospect. No personal data is collected. The Free plan lets you wrap one video to run your first audit, and the Pro plan's unlimited videos plus heatmaps let you audit prospects continuously as a standing part of your sales process. Create a free VidaPulse account and run an audit on your next prospect's VSL.</p>`,
  faq: [
    {
      q: `Can I audit a prospect's video without their permission or access?`,
      a: `You can wrap any video by its URL with no re-hosting and no login to the prospect's accounts, so you never need their hosting or CMS access. To collect real viewing data you do need the wrapped player to be seen by traffic — either by placing it on a page you run or by the prospect sending some traffic to it. The point is that starting the audit costs the prospect nothing and asks for nothing from their systems.`,
    },
    {
      q: `What should a sales audit actually include?`,
      a: `Keep it to two readings the prospect can grasp quickly: the retention curve showing where viewers leave, ranked by the size of each drop, and reach-to-offer showing how many viewers make it to the ask. On Pro, add the second-by-second heatmap to pin the biggest drop to a specific line. End with a short ranked list and the first fix you would make, so the audit leads naturally into a proposal.`,
    },
    {
      q: `Which plan do I need to run audits for prospects?`,
      a: `You can run a single audit on the Free plan, which covers one video. For a steady sales process where you audit many prospects, the Pro plan's unlimited videos let you wrap as many prospect VSLs as you like, and its second-by-second heatmap and conversion tracking make each audit far more precise. There is no per-video cap forcing you to choose which prospects to audit.`,
    },
  ],
};
