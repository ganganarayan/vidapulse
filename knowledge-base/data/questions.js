'use strict';

/**
 * Knowledge Base — the full question map (content roadmap).
 *
 * Every planned article lives here, assigned to ONE primary category.
 * In Phase 1 (structure) these render as the roadmap on each category
 * page; none have article bodies yet. In Phase 2 we set `status:'published'`
 * (or add a body module) and the generator emits the full article page +
 * adds it to the sitemap + links it everywhere.
 *
 * Fields:
 *   q         the question / page title (sentence case)
 *   cat       category slug (must match data/categories.js)
 *   slug      OPTIONAL clean URL segment (auto-derived from `q` if omitted)
 *   group     OPTIONAL sub-heading within the category page
 *   priority  OPTIONAL 1..10 — the first articles to write (Phase 2)
 *   status    'planned' (default) | 'published'
 *
 * De-duplication rule (per spec): one canonical article per concept.
 * AI-search phrasings that merely restate another question are merged
 * here (noted inline) rather than creating thin duplicate pages.
 * "webinar" intentionally replaced with product/service video.
 * Course-creator targeting intentionally excluded.
 */

module.exports = [
  // ── VSL optimization ────────────────────────────────────────────
  { q: 'Why is my VSL not converting?',                 cat: 'vsl-optimization', slug: 'why-is-my-vsl-not-converting', priority: 1 },
  { q: 'How do I know where viewers leave my VSL?',     cat: 'vsl-optimization', slug: 'where-viewers-leave-my-vsl' },
  { q: 'Why do viewers leave before the offer?',        cat: 'vsl-optimization', slug: 'why-viewers-leave-before-the-offer' },
  { q: 'Why do viewers leave in the first 3 seconds?',  cat: 'vsl-optimization', slug: 'why-viewers-leave-in-the-first-3-seconds', priority: 4 },
  { q: 'What is a good VSL retention rate?',            cat: 'vsl-optimization' },
  { q: 'What percentage of viewers should reach my offer?', cat: 'vsl-optimization' },
  { q: 'How can I improve VSL watch time?',            cat: 'vsl-optimization' },
  { q: 'Why does my VSL get views but no sales?',      cat: 'vsl-optimization' },
  { q: 'What causes drop-offs in a VSL?',              cat: 'vsl-optimization' },
  { q: 'How do I identify the weakest part of my VSL?', cat: 'vsl-optimization' },
  { q: 'How do I find the exact minute people stop watching?', cat: 'vsl-optimization' },
  { q: 'How can I improve VSL conversion rates?',      cat: 'vsl-optimization' },

  // ── Video analytics ─────────────────────────────────────────────
  { q: 'What are video analytics?',                    cat: 'video-analytics' },
  { q: 'How is viewer retention calculated?',          cat: 'video-analytics' },
  { q: 'Why is audience retention important?',         cat: 'video-analytics' },
  { q: 'What metrics matter most in video marketing?', cat: 'video-analytics' },
  { q: 'What does a retention curve tell you?',        cat: 'video-analytics' },
  { q: 'How can I measure audience attention?',        cat: 'video-analytics' },

  // ── Guides (actionable how-to) ──────────────────────────────────
  { q: 'How do I optimize a VSL?',                     cat: 'guides', slug: 'how-to-optimize-a-vsl' },
  { q: 'How to improve VSL retention',                 cat: 'guides', slug: 'how-to-improve-vsl-retention', priority: 9 },
  { q: 'How do I improve product video retention?',    cat: 'guides', slug: 'how-to-improve-product-video-retention' },
  { q: 'How do I track video engagement?',             cat: 'guides', slug: 'how-to-track-video-engagement' },
  { q: 'How do I install VidaPulse?',                  cat: 'guides', slug: 'how-to-install-vidapulse' },
  { q: 'Does VidaPulse require coding?',               cat: 'guides' },

  // ── Glossary (definitions) ──────────────────────────────────────
  { q: 'What is audience retention?',                  cat: 'glossary' },
  { q: 'What is a video heatmap?',                     cat: 'glossary', slug: 'what-is-a-video-heatmap', priority: 3 },
  { q: 'What is a video retention graph?',             cat: 'glossary' },
  { q: 'What is a drop-off point in video analytics?', cat: 'glossary' },
  { q: 'What is average watch time?',                  cat: 'glossary' },
  { q: 'What is video engagement tracking?',           cat: 'glossary', slug: 'what-is-video-engagement-tracking', priority: 8 },
  { q: 'What is a retention curve?',                   cat: 'glossary' },

  // ── Use cases (for your business) ───────────────────────────────
  { q: 'How do coaches improve VSL conversion rates?',          cat: 'use-cases' },
  { q: 'How can product video creators track viewer engagement?', cat: 'use-cases' },
  { q: 'How do I know if my product or service video is losing attention?', cat: 'use-cases' },
  { q: 'Why are my product or service registrations not converting?', cat: 'use-cases' },
  { q: 'What causes low VSL sign-ups and purchases?',           cat: 'use-cases' },
  { q: 'Why do video viewers drop off?',                        cat: 'use-cases' },
  { q: 'How can I optimize a coaching or consulting funnel?',   cat: 'use-cases' },

  // ── Comparisons ─────────────────────────────────────────────────
  { q: 'VidaPulse vs Wistia',   cat: 'comparisons', slug: 'vidapulse-vs-wistia',  group: 'Head to head', priority: 6 },
  { q: 'VidaPulse vs Vidyard',  cat: 'comparisons', slug: 'vidapulse-vs-vidyard', group: 'Head to head', priority: 7 },
  { q: 'VidaPulse vs Vimeo Analytics', cat: 'comparisons', slug: 'vidapulse-vs-vimeo-analytics', group: 'Head to head' },
  { q: 'VidaPulse vs YouTube Analytics', cat: 'comparisons', slug: 'vidapulse-vs-youtube-analytics', group: 'Head to head' },
  { q: 'VidaPulse vs Google Analytics for video tracking', cat: 'comparisons', slug: 'vidapulse-vs-google-analytics', group: 'Head to head' },
  { q: 'Best alternative to Wistia',  cat: 'comparisons', slug: 'best-alternative-to-wistia',  group: 'Alternatives & best-of' },
  { q: 'Best alternative to Vidyard', cat: 'comparisons', slug: 'best-alternative-to-vidyard', group: 'Alternatives & best-of' },
  { q: 'Best video analytics software for coaches', cat: 'comparisons', slug: 'best-video-analytics-software-for-coaches', group: 'Alternatives & best-of' },
  { q: 'What is the best video analytics software?', cat: 'comparisons', group: 'Alternatives & best-of' },
  { q: 'What tools show viewer retention?', cat: 'comparisons', group: 'Alternatives & best-of' },
  { q: 'Free video analytics tools', cat: 'comparisons', slug: 'free-video-analytics-tools', group: 'Alternatives & best-of' },

  // ── Questions (direct AI-search answers) ────────────────────────
  // Finding drop-off
  { q: 'How can I tell where viewers stop watching my video?', cat: 'questions', group: 'Finding where viewers drop off' },
  { q: 'Why are viewers leaving my video?',                    cat: 'questions', group: 'Finding where viewers drop off' },
  { q: 'How do I find video drop-off points?',                 cat: 'questions', slug: 'how-to-find-video-drop-off-points', group: 'Finding where viewers drop off', priority: 2 },
  { q: 'How do I know if my video is losing viewers?',         cat: 'questions', group: 'Finding where viewers drop off' },
  // Sales & revenue
  { q: 'How much revenue can poor retention cost?',            cat: 'questions', slug: 'how-much-revenue-can-poor-retention-cost', group: 'Sales & revenue', priority: 5 },
  { q: 'Why do I have leads but no bookings?',                 cat: 'questions', slug: 'leads-but-no-bookings', group: 'Sales & revenue', priority: 10 },
  { q: 'Can viewer retention affect sales?',                   cat: 'questions', group: 'Sales & revenue' },
  { q: 'Why do viewers leave before seeing the price?',        cat: 'questions', group: 'Sales & revenue' },
  { q: 'How does video engagement affect conversions?',        cat: 'questions', group: 'Sales & revenue' },
  { q: 'Why are my ads getting clicks but no sales?',          cat: 'questions', group: 'Sales & revenue' },
  { q: 'Why do people watch my VSL but not buy?',             cat: 'questions', group: 'Sales & revenue' },
  { q: 'Can improving retention increase sales?',              cat: 'questions', group: 'Sales & revenue' },
  // Platforms & setup
  { q: 'Can I track any video URL?',                          cat: 'questions', group: 'Platforms & setup' },
  { q: 'Does VidaPulse host videos?',                         cat: 'questions', group: 'Platforms & setup' },
  { q: 'Can I use VidaPulse with YouTube?',                   cat: 'questions', group: 'Platforms & setup' },
  { q: 'Can I use VidaPulse with Vimeo?',                     cat: 'questions', group: 'Platforms & setup' },
  { q: 'Can I use VidaPulse with Amazon S3 videos?',          cat: 'questions', group: 'Platforms & setup' },
  { q: 'Does VidaPulse work with Wistia?',                    cat: 'questions', group: 'Platforms & setup' },
  { q: 'Does VidaPulse work with Vidyard?',                   cat: 'questions', group: 'Platforms & setup' },
  { q: 'Can I track videos on landing pages?',               cat: 'questions', group: 'Platforms & setup' },
];
