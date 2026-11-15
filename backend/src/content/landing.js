'use strict';

/**
 * Home page (vidapulse.io/) content that is used in more than one place.
 *
 * The page itself is backend/views/landing.ejs. It is rendered twice from the
 * same template: live by Express on Railway (backend/src/index.js) and once per
 * build by scripts/export-static.js for Cloudflare Pages. Everything both
 * renders must agree on lives here: the SEO title and description, the FAQ
 * (the visible list AND the FAQPage JSON-LD are built from this one array, so
 * they can never drift), and the JSON-LD graph with prices read from the
 * pricing service.
 *
 * Writing rules: no em dashes; any date a person reads is DD-MM-YYYY.
 */

const pricing = require('../services/pricing');

const SITE = 'https://vidapulse.io';
const APP  = 'https://app.vidapulse.io';

// Title under 60 characters, description under 155 (checked by the export).
const SEO = {
  title: 'Sales Video Analytics Without Re-hosting | VidaPulse',
  description: 'See the exact second buyers leave your VSL, demo or sales video. Play rate, drop-off and heatmaps on the video you already have. No re-hosting, no code.',
};

// The one-sentence category definition shown in the hero.
const DEFINITION = 'VidaPulse is sales-video analytics for B2B SaaS teams, lead-gen agencies and demand-gen marketers running paid traffic to a VSL or demo.';

const FAQ = [
  {
    q: 'Is VidaPulse really free?',
    a: 'Yes. VidaPulse is free forever on 1 video: no trial clock, no expiry, no credit card required. You only upgrade when you need more videos or deeper analytics like heatmaps, source attribution, and conversion tracking.',
  },
  {
    q: 'Do I have to move my video to VidaPulse?',
    a: "No. VidaPulse isn't a video host. It reads the video you already have (YouTube, S3, Google Drive, or your own player), so there's no re-uploading, no re-embedding, and no risk to a funnel that already works.",
  },
  {
    q: 'How does it track without hosting my video?',
    a: 'You paste one lightweight script onto the page your video already sits on. It wraps your existing video, starts a viewer session, and streams play, drop-off, and re-watch events to VidaPulse in real time. The video never leaves where it lives.',
  },
  {
    q: 'Do I need to install anything?',
    a: "No. It's one script tag on the page your video already sits on. It works on custom sites, ClickFunnels, GoHighLevel, WordPress, Webflow, and plain HTML.",
  },
  {
    q: 'How is VidaPulse different from Wistia, Vidyard, or Vidalytics?',
    a: 'Those are video hosts: their analytics require moving your video onto their player, and they bill by storage, bandwidth, or per seat. VidaPulse sits on top of your existing video and shows where buyers drop off, at one flat price per account.',
  },
  {
    q: "Is my viewers' data private?",
    a: 'Yes. All analytics data lives in your account, is never sold or shared, and the tracker identifies viewers by an anonymous ID: no personally identifiable information and no third-party cookies.',
  },
  {
    q: 'Who is VidaPulse for?',
    a: 'B2B SaaS teams, lead-gen and performance agencies, and high-ticket service firms running paid or owned traffic to a VSL, demo, or application video: anyone whose pipeline depends on a video converting.',
  },
];

// Plans shown on the page, in order. key = pricing-service key.
const PLANS = [
  { key: 'starter', name: 'Starter', desc: 'Up to 10 videos: adds drop-off point, engagement heatmap, average time watched, geo, device and browser breakdown.' },
  { key: 'pro',     name: 'Growth',  desc: 'Up to 20 videos: adds UTM and source segmentation, conversion tracking, server-side pixel forwarding, video comparison, AI insights, priority support.' },
  { key: 'scale',   name: 'Scale',   desc: 'Everything in Growth plus multi-user access, API access and white-label reports for agencies.' },
];

/** Both currency tables, for pages that switch currency in the browser. */
function allPrices() {
  return { USD: pricing.table('USD'), INR: pricing.table('INR') };
}

/**
 * data-* attributes carrying a plan's price in both currencies and cycles,
 * e.g. data-usd-monthly="29" data-usd-yearly="290" data-inr-monthly="1,499" ...
 * Values are digits and commas only, so they need no escaping.
 */
function priceAttrs(all, key) {
  const out = [];
  for (const cur of ['USD', 'INR']) {
    for (const cycle of ['monthly', 'yearly']) {
      out.push(`data-${cur.toLowerCase()}-${cycle}="${all[cur].plans[key][cycle].label.slice(1)}"`);
    }
  }
  return out.join(' ');
}

/**
 * JSON-LD for the home page: Organization + SoftwareApplication (with the
 * prices the page shows, in USD, the default currency) + FAQPage built from
 * the FAQ above. Returned as a string that is safe inside <script>.
 */
function jsonLd() {
  const usd = pricing.table('USD');
  const offers = [
    {
      '@type': 'Offer',
      name: 'Free',
      price: '0',
      priceCurrency: 'USD',
      description: '1 video: plays, play rate, unique visitors, domain tracking and embed. Free forever, no credit card required.',
    },
    ...PLANS.map((p) => ({
      '@type': 'Offer',
      name: p.name,
      price: String(usd.plans[p.key].monthly.amount),
      priceCurrency: 'USD',
      description: p.desc,
      priceSpecification: [
        { '@type': 'UnitPriceSpecification', price: String(usd.plans[p.key].monthly.amount), priceCurrency: 'USD', billingDuration: 'P1M', unitText: 'month' },
        { '@type': 'UnitPriceSpecification', price: String(usd.plans[p.key].yearly.amount),  priceCurrency: 'USD', billingDuration: 'P1Y', unitText: 'year' },
      ],
    })),
  ];

  const graph = [
    {
      '@type': 'Organization',
      '@id': `${SITE}/#organization`,
      name: 'VidaPulse',
      url: SITE,
      email: 'support@vidapulse.io',
      description: 'VidaPulse provides sales-video analytics for B2B SaaS teams, lead-gen and performance agencies, and high-ticket service firms that run paid traffic to a VSL, demo, or application video. It measures engagement on the video you already have, without re-hosting.',
      contactPoint: { '@type': 'ContactPoint', email: 'support@vidapulse.io', contactType: 'customer support' },
    },
    {
      '@type': 'SoftwareApplication',
      '@id': `${SITE}/#software`,
      name: 'VidaPulse',
      description: DEFINITION + ' Paste the link to the video you already have (YouTube, Amazon S3, Google Drive, Dropbox, or a direct MP4/HLS URL) and VidaPulse shows the play rate, the exact second buyers drop off, a second-level engagement heatmap, and whether viewers reach the offer. No re-hosting, no code, priced per account rather than per seat.',
      url: SITE,
      applicationCategory: 'BusinessApplication',
      applicationSubCategory: 'Video Analytics',
      operatingSystem: 'Web',
      installUrl: `${APP}/register`,
      featureList: [
        'Second-level engagement heatmaps',
        'Exact drop-off point detection',
        'Play rate and average watch time',
        'Unique viewer tracking across sessions',
        'UTM and traffic-source attribution',
        'Conversion tracking to the offer',
        'Works with YouTube, S3, Google Drive, Dropbox and direct video URLs',
        'No re-hosting of your video',
        'One flat price per account, not per seat',
      ],
      offers,
      publisher: { '@id': `${SITE}/#organization` },
    },
    {
      '@type': 'FAQPage',
      '@id': `${SITE}/#faq`,
      mainEntity: FAQ.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    },
  ];

  return JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c');
}

module.exports = { SITE, APP, SEO, DEFINITION, FAQ, PLANS, allPrices, priceAttrs, jsonLd };
