'use strict';

/**
 * Knowledge Base — category definitions.
 *
 * The 7 approved categories. Order here = display order on the hub.
 * Each category becomes one page at:
 *     /video-analytics-guide/<slug>
 *
 * Fields:
 *   slug            URL segment (also the key questions reference via `cat`)
 *   title           Human title (sentence case)
 *   eyebrow         Small uppercase label shown above the title
 *   metaTitle       <title> tag
 *   metaDescription <meta name="description"> — unique, ~150 chars
 *   blurb           One-line summary used on the hub card
 *   intro           1–2 short paragraphs shown at the top of the category page
 */

module.exports = [
  {
    slug: 'vsl-optimization',
    title: 'VSL optimization',
    eyebrow: 'VSL optimization',
    metaTitle: 'VSL Optimization — Why VSLs Stop Converting & How to Fix Them | VidaPulse',
    metaDescription:
      'Diagnose why your video sales letter is not converting: find drop-off points, measure retention, see what percentage of viewers reach your offer, and fix the weakest part.',
    blurb: 'Find why your VSL loses viewers before the offer — and fix it.',
    intro:
      'A video sales letter rarely fails because of the offer. It fails because most viewers leave before they ever reach it. These guides show you how to measure VSL retention second by second, locate the exact moment people drop off, and rewrite the weakest part first.',
  },
  {
    slug: 'video-analytics',
    title: 'Video analytics',
    eyebrow: 'Video analytics',
    metaTitle: 'Video Analytics Explained — Retention, Heatmaps & the Metrics That Matter | VidaPulse',
    metaDescription:
      'Understand video analytics: audience retention, average watch time, retention curves, and which engagement metrics actually predict conversions for marketing videos.',
    blurb: 'What the numbers mean — retention, watch time, and the metrics that matter.',
    intro:
      'Video analytics tells you not just how many people pressed play, but how far they watched, where they lost interest, and which moments held attention. This section explains the core metrics and how to read them so they guide real decisions.',
  },
  {
    slug: 'revenue-analytics',
    title: 'Revenue analytics',
    eyebrow: 'Revenue leak detection',
    metaTitle: 'Revenue Leak Detection — What Video Drop-off Costs You | VidaPulse',
    metaDescription:
      'Find and quantify the revenue you lose to video drop-off: calculate what VSL drop-offs cost, spot revenue leaks in your funnel, and turn retention into sales.',
    blurb: 'Find and quantify the revenue your video drop-off is costing you.',
    intro:
      'Every viewer who leaves before your offer is revenue you already paid to acquire and then lost in silence. This section shows how to find the revenue leaks in your video funnel, put a real number on what drop-off costs you, and turn retention into booked calls and sales.',
  },
  {
    slug: 'funnel-analytics',
    title: 'Funnel analytics',
    eyebrow: 'Funnel optimization',
    metaTitle: 'Funnel Analytics — Find Video Funnel Drop-offs & Fix Them | VidaPulse',
    metaDescription:
      'Analyze your video sales funnel end to end: find the biggest drop-off, measure engagement at each step, and fix the leaks that stop leads from booking or buying.',
    blurb: 'Analyze your video sales funnel and find the biggest leak.',
    intro:
      'A funnel is only as strong as its weakest step. These guides show how to analyze a video sales funnel end to end — where attention drops, why leads stall before booking or checkout, and how to fix the one step that is costing you the most.',
  },
  {
    slug: 'industries',
    title: 'Industries',
    eyebrow: 'By industry',
    metaTitle: 'Video Analytics by Industry — Coaches, Consultants, Agencies, SaaS, B2B | VidaPulse',
    metaDescription:
      'How coaches, consultants, agencies, SaaS teams, and B2B sales use video retention analytics to find drop-offs, book more calls, and convert more leads.',
    blurb: 'How your industry uses video retention to win more business.',
    intro:
      'VidaPulse works the same way for everyone, but the questions differ by business. These guides map video retention analytics to specific industries — coaches, consultants, agencies, SaaS, and B2B sales teams — so you can see exactly how to use it for your own funnel.',
  },
  {
    slug: 'guides',
    title: 'Guides',
    eyebrow: 'Step-by-step guides',
    metaTitle: 'Video Analytics & VSL Guides — How to Track, Measure & Improve | VidaPulse',
    metaDescription:
      'Practical, step-by-step guides: how to optimize a VSL, improve retention, track video engagement on any page, and set up VidaPulse without writing code.',
    blurb: 'Practical, step-by-step playbooks you can act on today.',
    intro:
      'Actionable playbooks that take you from problem to fix. Each guide is written for marketers and founders — no jargon, no code required — and shows exactly what to measure and what to change.',
  },
  {
    slug: 'glossary',
    title: 'Glossary',
    eyebrow: 'Definitions',
    metaTitle: 'Video Analytics Glossary — Retention, Heatmaps, Drop-off & More | VidaPulse',
    metaDescription:
      'Plain-English definitions of the video analytics terms that matter: audience retention, video heatmap, retention curve, drop-off point, average watch time and more.',
    blurb: 'Plain-English definitions of every term, in one place.',
    intro:
      'Short, precise definitions of the terms used across this guide. Each one answers a single "what is…" question directly, then links to the deeper articles where the concept is applied.',
  },
  {
    slug: 'use-cases',
    title: 'Use cases',
    eyebrow: 'For your business',
    metaTitle: 'Video Analytics for Coaches, B2B & Product Marketers | VidaPulse',
    metaDescription:
      'How coaches, B2B sales teams, and B2C product marketers use viewer retention data to lift VSL conversions, fix funnels, and turn video views into booked calls and sales.',
    blurb: 'How coaches, B2B sales, and product marketers use retention data.',
    intro:
      'VidaPulse is built for people who use video to sell — coaches running VSLs, B2B teams sending demo videos, and product marketers driving sign-ups. These pages map the analytics to your specific funnel. (VidaPulse is not a live-streaming or course-hosting tool.)',
  },
  {
    slug: 'comparisons',
    title: 'Comparisons',
    eyebrow: 'Compare & choose',
    metaTitle: 'VidaPulse vs Wistia, Vidyard, Vimeo & YouTube Analytics | VidaPulse',
    metaDescription:
      'Honest comparisons of VidaPulse against Wistia, Vidyard, Vimeo Analytics, YouTube Analytics and Google Analytics — and the best video analytics tools for coaches.',
    blurb: 'VidaPulse vs Wistia, Vidyard, Vimeo, YouTube and more.',
    intro:
      'Where VidaPulse fits next to the better-known tools. The short version: most analytics platforms make you re-host your video on them first. VidaPulse measures viewer retention on the video you already have, wherever it lives.',
  },
  {
    slug: 'pricing',
    title: 'Pricing & value',
    eyebrow: 'Is it worth it?',
    metaTitle: 'Is Video Analytics Worth It? Cost & Value | VidaPulse',
    metaDescription:
      'Is video analytics worth paying for? What it costs, free vs paid, when you actually need it, and how to tell if VidaPulse pays for itself on your VSL or product video.',
    blurb: 'Is video analytics worth it — and what it costs.',
    intro:
      'Before paying for anything, it helps to know whether it earns its keep. These pages cover what video analytics costs, free vs paid, when you actually need it, and how to judge whether VidaPulse pays for itself on your videos.',
  },
  {
    slug: 'switching',
    title: 'Switching & alternatives',
    eyebrow: 'Switching tools',
    metaTitle: 'Switching Video Analytics Tools — From Wistia, Vidyard & More | VidaPulse',
    metaDescription:
      'Thinking of switching video analytics tools? When Wistia or Vidyard is too expensive, how to move, and how to get retention heatmaps without re-hosting your videos.',
    blurb: 'Outgrowing Wistia or Vidyard? How and when to switch.',
    intro:
      'If your current tool is too expensive or makes you re-host everything, you have options. These guides cover when to switch, how to move to VidaPulse without migrating your videos, and how to get the retention data you need for less.',
  },
  {
    slug: 'video-formats',
    title: 'Video formats',
    eyebrow: 'By video type',
    metaTitle: 'Analytics by Video Type — VSL, Demo, Explainer, Sales & More | VidaPulse',
    metaDescription:
      'How to measure and improve each type of marketing video: VSLs, demos, explainers, sales videos, product videos, ad landing-page videos, and testimonials.',
    blurb: 'Analytics tailored to each type of marketing video.',
    intro:
      'Different videos do different jobs, so they need different things measured. These guides map retention analytics to each format — VSLs, demos, explainers, sales, product, ad and testimonial videos — and what good looks like for each.',
  },
  {
    slug: 'benchmarks',
    title: 'Metrics & benchmarks',
    eyebrow: 'What is good?',
    metaTitle: 'Video Metrics & Benchmarks — Good Play Rate, Watch Time & More | VidaPulse',
    metaDescription:
      'What counts as a good play rate, completion rate, average watch time, drop-off rate, and VSL conversion rate — and how to benchmark your own video performance.',
    blurb: 'What a "good" number actually looks like.',
    intro:
      'Everyone wants to know if their numbers are good. The honest answer is that it depends, but there are useful ranges and, more importantly, a way to benchmark against your own baseline. These pages cover the key video metrics and how to read them.',
  },
  {
    slug: 'questions',
    title: 'Questions',
    eyebrow: 'Quick answers',
    metaTitle: 'Video Analytics Questions Answered — Drop-off, Sales & Setup | VidaPulse',
    metaDescription:
      'Direct answers to the questions people actually ask about video: where viewers stop watching, why ads get clicks but no sales, and how to track any video.',
    blurb: 'Direct answers to the exact questions people ask.',
    intro:
      'The exact questions marketers ask about video performance — answered directly. Grouped by what you are trying to find out: where viewers drop off, why traffic is not converting, and how VidaPulse works with your setup.',
  },
];
