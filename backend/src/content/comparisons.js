'use strict';

/**
 * Competitor comparison pages, one per brand, served on the marketing domain
 * at /<slug> (e.g. vidapulse.io/wistia-alternative).
 *
 * The rule for every page: be honest. Each table has rows we win, rows that are
 * a tie, and rows the competitor wins (themWins). A comparison that only lists
 * our wins reads as an ad and gets ignored by buyers and by AI answer engines.
 *
 * Competitor prices are deliberately NOT quoted: they change often and a wrong
 * number is worse than none. Pages point the reader at the competitor's own
 * pricing page instead. VidaPulse prices are injected live from the pricing
 * service at render time (INR in India, USD elsewhere).
 *
 * Adding a page = adding an entry here. The route, the landing "Compare"
 * section, the footer links and the sitemap entry all derive from this list.
 *
 * Writing rules: no em dashes; dates DD-MM-YYYY.
 */

const UPDATED = '14-11-2026';           // what a person reads
const UPDATED_ISO = '2026-11-14';       // what the sitemap reads

const COMPARISONS = [
  {
    slug: 'vidalytics-alternative',
    name: 'Vidalytics',
    kb: null,
    card: 'A VSL host with a conversion player. VidaPulse reads the VSL where it already lives.',
    title: 'Vidalytics Alternative for VSL Analytics Without Re-hosting',
    description: 'VidaPulse against Vidalytics: where each one wins, what you give up by moving, and why VidaPulse measures your VSL without hosting it.',
    lede: 'Vidalytics is built for VSLs and it shows: a conversion-focused player, autoplay, CTAs and drop-off graphs, all on videos you upload to Vidalytics. VidaPulse does one narrower job. It measures the VSL you already host, on YouTube, S3, Drive or your own player, and shows the exact second buyers leave, at one flat price per account.',
    sections: [
      {
        h2: 'Host and player, or a measuring layer',
        p: [
          'Vidalytics is a video host. To get its analytics and its player features you upload the VSL to Vidalytics and swap your embed for theirs. If your funnel is new, that is a reasonable trade.',
          'VidaPulse never takes the file. You paste the link to the video you already run, put one script tag on the page, and the data starts. Nothing in a funnel that already converts has to change.',
        ],
      },
      {
        h2: 'What changes when you measure instead of migrate',
        bullets: [
          'No re-upload and no new player to QA on every funnel page',
          'No billing tied to plays or bandwidth: one flat price per account',
          'The same dashboard across YouTube, S3, Drive, Dropbox, MP4 and HLS sources',
          'UTM and source attribution per viewer, so you see which ad set produced the people who stayed',
        ],
      },
    ],
    rows: [
      { label: 'Do I have to upload the video?', us: 'No. Paste the link to the video you already host.', them: 'Yes. Videos are hosted on Vidalytics.' },
      { label: 'How it is billed', us: 'One flat price per account, by number of videos.', them: 'Plan tiers with usage limits. Check their pricing page for current figures.' },
      { label: 'Exact drop-off second and heatmap', us: 'Yes, second by second, from Starter.', them: 'Yes, drop-off and engagement graphs.', tie: true },
      { label: 'UTM and source attribution', us: 'Yes, every UTM field plus referrer, on Growth.', them: 'Yes, traffic segmentation.', tie: true },
      { label: 'Server-side pixel forwarding', us: 'Yes, on Growth.', them: 'Pixel and integration support. Check their docs for server-side.' },
      { label: 'Conversion-optimised player (smart autoplay, resume play)', us: 'No. We measure your player, we do not replace it.', them: 'Yes. This is their core strength.', themWins: true },
      { label: 'In-video CTAs, email gates and chapters', us: 'Not the focus.', them: 'Yes, built into the player.', themWins: true },
      { label: 'A/B split testing of videos', us: 'Side-by-side video comparison on Growth, not a traffic splitter.', them: 'Yes, native split testing.', themWins: true },
      { label: 'Free plan', us: 'Yes. 1 video, free forever, no card.', them: 'Check their pricing page.' },
    ],
    betterWhen: 'Vidalytics is the better buy if you want a player that is built to lift conversions by itself: smart autoplay, in-video CTAs, email gates and native split tests. If you are happy to host there and want those levers, choose it. Choose VidaPulse when the video already lives somewhere you trust and the question is only where buyers drop.',
    faqs: [
      { q: 'Is VidaPulse a Vidalytics alternative?', a: 'For measurement, yes. For the conversion player, no. VidaPulse shows the exact drop-off second, the heatmap and source attribution on a VSL you already host. It does not replace the player or add autoplay and CTA features.' },
      { q: 'Can I keep my VSL on YouTube or S3?', a: 'Yes. That is the point. VidaPulse reads YouTube, Amazon S3, Google Drive, Dropbox, OneDrive, Azure Blob, direct MP4 and HLS links. Nothing is uploaded.' },
      { q: 'Can I use both?', a: 'You do not need to. If a VSL is already on Vidalytics, its own analytics cover it. VidaPulse fits the videos that live elsewhere.' },
    ],
  },
  {
    slug: 'wistia-alternative',
    name: 'Wistia',
    kb: 'vidapulse-vs-wistia',
    card: 'An all-in-one video host and marketing suite. VidaPulse is only the analytics, on video you host anywhere.',
    title: 'Wistia Alternative for Sales-Video Analytics',
    description: 'VidaPulse against Wistia: hosting and a branded player versus deep retention analytics on the video you already host. Where each one wins.',
    lede: 'Wistia is one of the best video marketing platforms there is: hosting, a branded player, lead capture, recording tools and strong analytics in one place. VidaPulse is not trying to be that. It adds second-by-second retention analytics to a sales video you already host somewhere else, without moving it.',
    sections: [
      {
        h2: 'Where your video lives decides this',
        p: [
          'With Wistia, the video is uploaded to Wistia and served through its player, and the analytics come with that player. You get one managed home for your video library.',
          'With VidaPulse, the video stays where it is. You paste the link, embed one script tag, and read the drop-off curve. If hosting is already solved, you are only buying the part you need.',
        ],
      },
      {
        h2: 'What VidaPulse adds for a sales video',
        bullets: [
          'The exact second buyers leave, and whether they ever reached the offer',
          'UTM and source attribution per viewer, tied to conversion tracking on Growth',
          'Server-side pixel forwarding so the ad platform learns from people who watched',
          'One flat price per account, not per seat',
        ],
      },
    ],
    rows: [
      { label: 'Do I have to upload the video?', us: 'No. Works on video hosted anywhere.', them: 'Yes. Videos are hosted on Wistia.' },
      { label: 'Second-by-second heatmap', us: 'Yes, from Starter.', them: 'Yes, including per-viewer heatmaps.', tie: true },
      { label: 'Audience-retention curve', us: 'Yes.', them: 'Yes.', tie: true },
      { label: 'UTM and source attribution', us: 'Yes, on Growth.', them: 'Yes, via its marketing integrations.', tie: true },
      { label: 'Server-side pixel forwarding', us: 'Yes, on Growth.', them: 'Check their docs.' },
      { label: 'Branded, customisable player', us: 'Analytics player with custom controls, not a brand suite.', them: 'Yes, a highly customisable branded player.', themWins: true },
      { label: 'In-player lead capture', us: 'Not the focus.', them: 'Yes, email capture forms in the player.', themWins: true },
      { label: 'Recording, editing and channels', us: 'No.', them: 'Yes, creation tools and video channels.', themWins: true },
      { label: 'Marketing automation connectors', us: 'Webhooks and API on Scale.', them: 'Native HubSpot, Marketo and other connectors.', themWins: true },
      { label: 'Free plan', us: 'Yes. 1 video, free forever, no card.', them: 'Check their pricing page.' },
    ],
    betterWhen: 'Wistia is the better buy when you want one platform for hosting, a branded player, in-player lead capture, creation tools and deep marketing integrations, and can budget for it. Choose VidaPulse when your sales video already lives somewhere you are happy with and you only need to know where buyers leave.',
    faqs: [
      { q: 'Is VidaPulse a Wistia alternative?', a: 'Only for the analytics part. If you need hosting, a branded player and creation tools, Wistia is the right tool. If you only want retention analytics on a video you already host, VidaPulse does that job on its own.' },
      { q: 'Do I have to move my videos?', a: 'No. VidaPulse reads YouTube, S3, Google Drive, Dropbox, OneDrive, Azure Blob, MP4 and HLS links where they already live.' },
      { q: 'Does VidaPulse have heatmaps like Wistia?', a: 'Yes, second-by-second engagement heatmaps from the Starter plan, plus a retention curve and replay detection.' },
    ],
  },
  {
    slug: 'vidyard-alternative',
    name: 'Vidyard',
    kb: 'vidapulse-vs-vidyard',
    card: 'A sales-team video platform billed per seat. VidaPulse is one flat price for the whole account.',
    title: 'Vidyard Alternative for VSL and Demo Analytics',
    description: 'VidaPulse against Vidyard: per-seat sales video tooling versus flat-priced analytics on the VSL or demo you already run. Where each one wins.',
    lede: 'Vidyard is built for sales reps: record a personalised video, send it, get notified when the prospect watches, and log it in the CRM. VidaPulse is built for the funnel: paid traffic lands on a VSL or demo page and you need to know the exact second those buyers leave.',
    sections: [
      {
        h2: 'One-to-one outreach or one-to-many funnels',
        p: [
          'Vidyard shines when each video goes to one named prospect and a rep follows up. Its value is the recording workflow, the viewer notification and the CRM sync, and it is priced per user.',
          'VidaPulse is for the video that thousands of anonymous visitors see from an ad. It never asks who the viewer is, collects no personal data, and charges one price for the whole team.',
        ],
      },
      {
        h2: 'What a funnel team gets from VidaPulse',
        bullets: [
          'The exact drop-off second and a heatmap across every visitor',
          'UTM attribution, so you see which campaign produced the viewers who stayed',
          'No migration: works on the video you already host',
          'No per-seat bill as the team grows',
        ],
      },
    ],
    rows: [
      { label: 'Do I have to upload the video?', us: 'No.', them: 'Yes. Videos are hosted on Vidyard.' },
      { label: 'How it is billed', us: 'One flat price per account.', them: 'Per user. Check their pricing page.' },
      { label: 'Drop-off and retention for anonymous funnel traffic', us: 'Yes, second by second.', them: 'Yes, video analytics included.', tie: true },
      { label: 'UTM and source attribution', us: 'Yes, every UTM field, on Growth.', them: 'Check their docs.' },
      { label: 'Personal data collected about viewers', us: 'None. Anonymous viewer IDs only.', them: 'Identifies known viewers, which is the point for sales outreach.' },
      { label: 'Screen and webcam recording', us: 'No.', them: 'Yes, a core feature.', themWins: true },
      { label: 'Real-time "your prospect is watching" alerts', us: 'No.', them: 'Yes.', themWins: true },
      { label: 'Native CRM integrations', us: 'Webhooks and API on Scale.', them: 'Yes, Salesforce, HubSpot and others.', themWins: true },
      { label: 'Free plan', us: 'Yes. 1 video, free forever, no card.', them: 'Check their pricing page.' },
    ],
    betterWhen: 'Vidyard is the better buy for sales teams sending personalised videos to named prospects who need recording, watch alerts and CRM logging. Choose VidaPulse when the video is a VSL or demo behind paid traffic and the question is where the audience drops.',
    faqs: [
      { q: 'Is VidaPulse a Vidyard alternative?', a: 'For funnel analytics, yes. For rep-to-prospect video outreach, no. VidaPulse has no recorder and no CRM sync.' },
      { q: 'Why is VidaPulse not priced per seat?', a: 'Because funnel analytics is shared by the whole team. Everyone sees the same data, so charging per login only punishes growth.' },
      { q: 'Does VidaPulse identify who watched?', a: 'No. The tracker collects no personally identifiable information. It counts unique viewers with an anonymous ID.' },
    ],
  },
  {
    slug: 'vimeo-analytics-alternative',
    name: 'Vimeo',
    kb: 'vidapulse-vs-vimeo-analytics',
    card: 'A great host with engagement stats on paid tiers. VidaPulse adds funnel analytics on top of Vimeo or anywhere else.',
    title: 'Vimeo Analytics Alternative for Sales Videos',
    description: 'VidaPulse against Vimeo analytics: a video host with built-in stats versus sales-funnel analytics that also works on Vimeo videos.',
    lede: 'Vimeo is an excellent place to host video, with a clean ad-free player, privacy controls, live streaming and engagement stats on its paid plans. Its analytics are about the video. VidaPulse is about the funnel: the drop-off second, the source of each viewer and whether they reached the offer.',
    sections: [
      {
        h2: 'You do not have to choose',
        p: [
          'VidaPulse reads Vimeo videos through the player itself, so you can keep hosting on Vimeo and add VidaPulse on top. The same goes for YouTube, S3, Drive and direct files, which means one dashboard across every source.',
        ],
      },
      {
        h2: 'What VidaPulse adds on top of Vimeo',
        bullets: [
          'UTM and referrer attribution for every viewer session',
          'Conversion tracking and server-side pixel forwarding on Growth',
          'The same heatmap and drop-off view for videos that are not on Vimeo',
        ],
      },
    ],
    rows: [
      { label: 'Do I have to upload the video?', us: 'No. Works on Vimeo and every other source.', them: 'Yes, to Vimeo.' },
      { label: 'Engagement graph', us: 'Yes, second by second, from Starter.', them: 'Yes, on paid plans.', tie: true },
      { label: 'UTM and source attribution per viewer', us: 'Yes, on Growth.', them: 'Basic traffic sources.' },
      { label: 'Conversion tracking and pixel forwarding', us: 'Yes, on Growth.', them: 'Check their docs.' },
      { label: 'Videos from YouTube, S3 or Drive in the same dashboard', us: 'Yes.', them: 'No. Vimeo-hosted only.' },
      { label: 'Hosting, ad-free player and privacy controls', us: 'No. We do not host.', them: 'Yes. Their core strength.', themWins: true },
      { label: 'Live streaming, review and collaboration tools', us: 'No.', them: 'Yes.', themWins: true },
      { label: 'Free plan', us: 'Yes. 1 video, free forever, no card.', them: 'Yes, a basic free plan.', tie: true },
    ],
    betterWhen: 'Vimeo is the better buy when you need a host: a reliable ad-free player, privacy settings, live streaming and review tools. Its stats are enough if you only want views and engagement on Vimeo videos. Add VidaPulse when the video is part of a paid funnel and you need attribution and conversions.',
    faqs: [
      { q: 'Does VidaPulse work with Vimeo videos?', a: 'Yes. Keep hosting on Vimeo and paste the link into VidaPulse. Nothing is re-uploaded.' },
      { q: 'Is Vimeo analytics enough for a VSL?', a: 'It tells you how the video is watched. It does not tell you which ad produced the viewers who stayed, or whether they converted. That is the gap VidaPulse fills.' },
    ],
  },
  {
    slug: 'youtube-analytics-alternative',
    name: 'YouTube Analytics',
    kb: 'vidapulse-vs-youtube-analytics',
    card: 'Free and aggregated across all of YouTube. VidaPulse shows what happens on your own sales page.',
    title: 'YouTube Analytics Alternative for Embedded Sales Videos',
    description: 'VidaPulse against YouTube Analytics: aggregated channel stats versus per-page, per-campaign analytics for a YouTube video embedded in your funnel.',
    lede: 'YouTube Analytics is free and genuinely good at what it is for: how a video performs across all of YouTube. When the same video is embedded on your sales page, its numbers blend every viewer from every place together. VidaPulse measures only the people on your page, and where they came from.',
    sections: [
      {
        h2: 'Your page, not all of YouTube',
        p: [
          'A VSL hosted on YouTube gets watched in search, in suggested videos and on your landing page. YouTube Analytics reports those together. You cannot tell how buyers from one ad campaign watched on your page.',
          'VidaPulse wraps the same YouTube video on your page and records only those sessions, with the UTM and referrer of each one. Keep YouTube as the host: nothing moves.',
        ],
      },
    ],
    rows: [
      { label: 'Price', us: 'Free on 1 video, paid plans after.', them: 'Free.', themWins: true },
      { label: 'Do I have to move the video?', us: 'No. Keep it on YouTube.', them: 'No.', tie: true },
      { label: 'Retention for viewers on your sales page only', us: 'Yes.', them: 'No. Aggregated across all of YouTube.' },
      { label: 'UTM campaign attribution per viewer', us: 'Yes, on Growth.', them: 'No.' },
      { label: 'Conversion tracking after the video', us: 'Yes, on Growth.', them: 'No.' },
      { label: 'Search, discovery and subscriber analytics', us: 'No.', them: 'Yes. Built for channel growth.', themWins: true },
      { label: 'Revenue and audience demographics for creators', us: 'No.', them: 'Yes.', themWins: true },
    ],
    betterWhen: 'YouTube Analytics is all you need if the goal is channel growth: views, search, subscribers and creator revenue. It is free and nothing else sees that data. Add VidaPulse when a YouTube video is embedded in a paid funnel and you need to know how that traffic watched.',
    faqs: [
      { q: 'Can I keep my video on YouTube?', a: 'Yes. VidaPulse wraps the YouTube video on your page. The video stays on YouTube.' },
      { q: 'Why do my YouTube retention numbers differ from VidaPulse?', a: 'YouTube counts every viewer everywhere. VidaPulse counts only sessions on the pages where you embedded it. Paid funnel traffic usually watches differently from YouTube browsers.' },
    ],
  },
  {
    slug: 'hotjar-alternative',
    name: 'Hotjar',
    kb: 'vidapulse-vs-hotjar',
    card: 'Page heatmaps and recordings. VidaPulse sees inside the video, which page tools cannot.',
    title: 'Hotjar Alternative for Video Engagement',
    description: 'VidaPulse against Hotjar: page heatmaps and session recordings versus second-by-second analytics inside the video on that page.',
    lede: 'Hotjar is excellent at the page: click and scroll heatmaps, session recordings, funnels and on-site surveys. What it cannot see is what happens inside an embedded video player. On a VSL page that is the part that matters most, and it is the only part VidaPulse measures.',
    sections: [
      {
        h2: 'The page and the video are different questions',
        p: [
          'Hotjar answers "did people scroll, click and leave the page". VidaPulse answers "at which second of the video did they stop watching, and did they reach the offer". Many teams run both, because they do not overlap.',
        ],
      },
    ],
    rows: [
      { label: 'Second-by-second engagement inside the video', us: 'Yes.', them: 'No. The video player is a black box to page tools.' },
      { label: 'Did the viewer reach the offer in the video?', us: 'Yes.', them: 'No.' },
      { label: 'UTM attribution', us: 'Yes, on Growth.', them: 'Yes, filter recordings by source.', tie: true },
      { label: 'Click and scroll heatmaps of the page', us: 'No.', them: 'Yes. Their core strength.', themWins: true },
      { label: 'Session recordings', us: 'No.', them: 'Yes.', themWins: true },
      { label: 'On-site surveys and feedback', us: 'No.', them: 'Yes.', themWins: true },
      { label: 'Free plan', us: 'Yes. 1 video, free forever.', them: 'Yes, a basic free plan.', tie: true },
    ],
    betterWhen: 'Hotjar is the right tool for understanding the page: layout, clicks, scroll depth, recordings and visitor feedback. It is not a replacement for video analytics, and VidaPulse is not a replacement for it. On a VSL page, run both.',
    faqs: [
      { q: 'Can Hotjar track video engagement?', a: 'Not inside the player. It can show a click on the play button, but not which seconds were watched, skipped or replayed.' },
      { q: 'Do VidaPulse and Hotjar conflict?', a: 'No. They measure different things and can run on the same page.' },
    ],
  },
  {
    slug: 'google-analytics-video-alternative',
    name: 'Google Analytics',
    kb: 'vidapulse-vs-google-analytics',
    card: 'Free milestone events at 10, 25, 50 and 75 percent. VidaPulse shows every second.',
    title: 'Google Analytics Alternative for Video Tracking',
    description: 'VidaPulse against Google Analytics video tracking: coarse progress milestones versus the exact second buyers drop off your sales video.',
    lede: 'Google Analytics 4 is free and it is where your whole site is measured. Its built-in video tracking fires a handful of progress milestones for embedded YouTube videos. That tells you roughly how many people got halfway. It does not tell you the exact second they left, and it does not cover a video on S3 or your own player without custom tagging.',
    sections: [
      {
        h2: 'Milestones or the exact second',
        p: [
          'A drop between the 25 and 50 percent milestones on a 20-minute VSL is a five-minute window. You still have to guess which sentence lost them. VidaPulse shows the curve second by second, so the fix is obvious.',
          'Keep GA4 for the site. Add VidaPulse for the video.',
        ],
      },
    ],
    rows: [
      { label: 'Price', us: 'Free on 1 video, paid plans after.', them: 'Free.', themWins: true },
      { label: 'Video granularity', us: 'Every second, with replays split from first watches.', them: 'Start, 10, 25, 50, 75 percent and complete.' },
      { label: 'Non-YouTube sources (S3, Drive, MP4, HLS)', us: 'Yes, out of the box.', them: 'Needs custom event tagging.' },
      { label: 'Engagement heatmap', us: 'Yes, from Starter.', them: 'No.' },
      { label: 'UTM attribution', us: 'Yes, on Growth.', them: 'Yes.', tie: true },
      { label: 'Whole-site analytics, funnels and Google Ads integration', us: 'No.', them: 'Yes. Their core strength.', themWins: true },
    ],
    betterWhen: 'Google Analytics is the right tool for the whole site and for ad-platform reporting, and it is free. Its video milestones are enough if you only need a rough completion rate. Add VidaPulse when the sales video carries the funnel and you need the exact drop-off.',
    faqs: [
      { q: 'Does GA4 track video?', a: 'Yes, for embedded YouTube videos it can fire start, progress and complete events at fixed milestones. Other sources need custom tagging.' },
      { q: 'Can I use VidaPulse and GA4 together?', a: 'Yes. Most teams keep GA4 for the site and use VidaPulse for the video.' },
    ],
  },
];

const BY_SLUG = new Map(COMPARISONS.map((c) => [c.slug, c]));

module.exports = { COMPARISONS, BY_SLUG, UPDATED, UPDATED_ISO };
