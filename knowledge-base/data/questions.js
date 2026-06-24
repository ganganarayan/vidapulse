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
  // Competitive alternatives — page/session tools (honest "for video funnels" framing)
  { q: 'VidaPulse vs Hotjar for video funnels',       cat: 'comparisons', slug: 'vidapulse-vs-hotjar',       group: 'vs page & session tools' },
  { q: 'VidaPulse vs Lucky Orange for video funnels', cat: 'comparisons', slug: 'vidapulse-vs-lucky-orange', group: 'vs page & session tools' },
  { q: 'VidaPulse vs Mouseflow for video funnels',    cat: 'comparisons', slug: 'vidapulse-vs-mouseflow',    group: 'vs page & session tools' },
  { q: 'VidaPulse vs FullStory for video funnels',    cat: 'comparisons', slug: 'vidapulse-vs-fullstory',    group: 'vs page & session tools' },
  { q: 'Video analytics vs session replay',           cat: 'comparisons', slug: 'video-analytics-vs-session-replay', group: 'vs page & session tools' },
  { q: 'Do I need a heatmap tool or video analytics?', cat: 'comparisons', slug: 'do-i-need-a-heatmap-tool-or-video-analytics', group: 'vs page & session tools' },
  { q: 'Best tools to find video drop-offs',          cat: 'comparisons', slug: 'best-tools-to-find-video-drop-offs', group: 'Alternatives & best-of' },
  { q: 'Best funnel analytics tools',                 cat: 'comparisons', slug: 'best-funnel-analytics-tools', group: 'Alternatives & best-of' },
  { q: 'Best video analytics for VSLs',               cat: 'comparisons', slug: 'best-video-analytics-for-vsls', group: 'Alternatives & best-of' },
  { q: 'Best tools to measure VSL performance',       cat: 'comparisons', slug: 'best-tools-to-measure-vsl-performance', group: 'Alternatives & best-of' },

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

  // ── Revenue analytics (high buying intent) ──────────────────────
  { q: 'What is revenue leak detection?',                       cat: 'revenue-analytics', slug: 'what-is-revenue-leak-detection' },
  { q: 'How much revenue am I losing from video drop-offs?',    cat: 'revenue-analytics', slug: 'how-much-revenue-am-i-losing-from-video-drop-offs' },
  { q: 'How do I find revenue leaks in my funnel?',             cat: 'revenue-analytics', slug: 'how-do-i-find-revenue-leaks-in-my-funnel' },
  { q: 'How do I calculate the cost of video drop-off?',        cat: 'revenue-analytics', slug: 'how-do-i-calculate-the-cost-of-video-drop-off' },
  { q: 'Can video retention predict sales?',                    cat: 'revenue-analytics', slug: 'can-video-retention-predict-sales' },
  { q: 'Does watch time correlate with revenue?',               cat: 'revenue-analytics', slug: 'does-watch-time-correlate-with-revenue' },
  { q: 'How do I increase VSL revenue?',                        cat: 'revenue-analytics', slug: 'how-do-i-increase-vsl-revenue' },
  { q: 'Why are my leads not buying?',                          cat: 'revenue-analytics', slug: 'why-are-my-leads-not-buying' },
  { q: 'Which part of my VSL loses the most revenue?',          cat: 'revenue-analytics', slug: 'which-part-of-my-vsl-loses-the-most-revenue' },
  { q: 'How do I turn video views into revenue?',               cat: 'revenue-analytics', slug: 'how-do-i-turn-video-views-into-revenue' },
  { q: 'What is video marketing ROI?',                          cat: 'revenue-analytics', slug: 'what-is-video-marketing-roi' },
  { q: 'How do I plug revenue leaks in a VSL?',                 cat: 'revenue-analytics', slug: 'how-do-i-plug-revenue-leaks-in-a-vsl' },

  // ── Funnel analytics (high buying intent) ───────────────────────
  { q: 'What is funnel analytics?',                             cat: 'funnel-analytics', slug: 'what-is-funnel-analytics' },
  { q: 'How do I analyze a sales funnel?',                      cat: 'funnel-analytics', slug: 'how-do-i-analyze-a-sales-funnel' },
  { q: 'How do I find funnel drop-offs?',                       cat: 'funnel-analytics', slug: 'how-do-i-find-funnel-drop-offs' },
  { q: 'What is a funnel drop-off rate?',                       cat: 'funnel-analytics', slug: 'what-is-a-funnel-drop-off-rate' },
  { q: 'How do I measure funnel engagement?',                   cat: 'funnel-analytics', slug: 'how-do-i-measure-funnel-engagement' },
  { q: 'What is video funnel optimization?',                    cat: 'funnel-analytics', slug: 'what-is-video-funnel-optimization' },
  { q: 'How do I optimize a video sales funnel?',              cat: 'funnel-analytics', slug: 'how-do-i-optimize-a-video-sales-funnel' },
  { q: 'Why do people leave before checkout?',                  cat: 'funnel-analytics', slug: 'why-do-people-leave-before-checkout' },
  { q: 'How do I improve my call booking rate?',               cat: 'funnel-analytics', slug: 'how-do-i-improve-call-booking-rate' },
  { q: 'How do I track a video sales funnel?',                 cat: 'funnel-analytics', slug: 'how-do-i-track-a-video-sales-funnel' },
  { q: 'What is landing page video analytics?',                 cat: 'funnel-analytics', slug: 'landing-page-video-analytics' },
  { q: 'What is product video launch analytics?',              cat: 'funnel-analytics', slug: 'product-video-launch-analytics' },

  // ── Industries (industry-specific use, high intent) ─────────────
  // Coaches
  { q: 'Video analytics for coaches',                          cat: 'industries', slug: 'for-coaches', group: 'For coaches' },
  { q: 'How do coaches find where their VSL loses clients?',   cat: 'industries', slug: 'how-do-coaches-find-where-vsls-lose-clients', group: 'For coaches' },
  { q: 'How do coaches turn video views into booked calls?',   cat: 'industries', slug: 'how-do-coaches-turn-views-into-booked-calls', group: 'For coaches' },
  { q: 'What retention rate should a coaching VSL aim for?',    cat: 'industries', slug: 'what-retention-rate-should-a-coaching-vsl-aim-for', group: 'For coaches' },
  { q: 'How do coaches test changes to their VSL?',            cat: 'industries', slug: 'how-do-coaches-test-vsl-changes', group: 'For coaches' },
  // Consultants
  { q: 'Video analytics for consultants',                      cat: 'industries', slug: 'for-consultants', group: 'For consultants' },
  { q: 'How do consultants track sales video performance?',    cat: 'industries', slug: 'how-do-consultants-track-sales-video-performance', group: 'For consultants' },
  { q: 'How do consultants get more discovery calls from video?', cat: 'industries', slug: 'how-do-consultants-get-more-discovery-calls', group: 'For consultants' },
  { q: 'Why do consulting prospects leave the VSL early?',      cat: 'industries', slug: 'why-do-consulting-prospects-leave-early', group: 'For consultants' },
  { q: 'How do consultants prove video ROI?',                  cat: 'industries', slug: 'how-do-consultants-prove-video-roi', group: 'For consultants' },
  // Agencies
  { q: 'Video analytics for agencies',                         cat: 'industries', slug: 'for-agencies', group: 'For agencies' },
  { q: 'How do agencies report video performance to clients?', cat: 'industries', slug: 'how-do-agencies-report-video-performance-to-clients', group: 'For agencies' },
  { q: 'How do agencies track client VSLs at scale?',          cat: 'industries', slug: 'how-do-agencies-track-client-vsls-at-scale', group: 'For agencies' },
  { q: 'How do agencies find drop-offs in client videos?',     cat: 'industries', slug: 'how-do-agencies-find-drop-offs-in-client-videos', group: 'For agencies' },
  { q: 'How do agencies prove video results to clients?',      cat: 'industries', slug: 'how-do-agencies-prove-video-results-to-clients', group: 'For agencies' },
  // SaaS
  { q: 'Video analytics for SaaS',                             cat: 'industries', slug: 'for-saas', group: 'For SaaS' },
  { q: 'How do SaaS teams track demo video engagement?',       cat: 'industries', slug: 'how-do-saas-teams-track-demo-video-engagement', group: 'For SaaS' },
  { q: 'How do SaaS teams find drop-offs in product videos?',  cat: 'industries', slug: 'how-do-saas-teams-find-drop-offs-in-product-videos', group: 'For SaaS' },
  { q: 'How does video retention affect SaaS sign-ups?',       cat: 'industries', slug: 'how-does-video-retention-affect-saas-signups', group: 'For SaaS' },
  { q: 'How do SaaS teams measure landing page video engagement?', cat: 'industries', slug: 'how-do-saas-teams-measure-landing-page-video-engagement', group: 'For SaaS' },
  // B2B sales
  { q: 'Video analytics for B2B sales teams',                  cat: 'industries', slug: 'for-b2b-sales', group: 'For B2B sales' },
  { q: 'How do B2B teams track sales video engagement?',       cat: 'industries', slug: 'how-do-b2b-teams-track-sales-video-engagement', group: 'For B2B sales' },
  { q: 'How do B2B reps know if prospects watch their demos?', cat: 'industries', slug: 'how-do-b2b-reps-know-if-prospects-watch-demos', group: 'For B2B sales' },
  { q: 'How does video engagement affect B2B pipeline?',       cat: 'industries', slug: 'how-does-video-engagement-affect-b2b-pipeline', group: 'For B2B sales' },
  { q: 'How do B2B teams find drop-offs in demo videos?',      cat: 'industries', slug: 'how-do-b2b-teams-find-drop-offs-in-demo-videos', group: 'For B2B sales' },

  // ── Industries — deepening wave (more supporting per industry) ──
  // Coaches
  { q: 'What makes a coaching VSL convert?',                   cat: 'industries', slug: 'what-makes-a-coaching-vsl-convert', group: 'For coaches' },
  { q: 'How long should a coaching VSL be?',                   cat: 'industries', slug: 'how-long-should-a-coaching-vsl-be', group: 'For coaches' },
  { q: 'How do coaches improve their VSL hook?',              cat: 'industries', slug: 'how-do-coaches-improve-their-vsl-hook', group: 'For coaches' },
  { q: 'How do coaches track which ads bring buyers?',         cat: 'industries', slug: 'how-do-coaches-track-which-ads-bring-buyers', group: 'For coaches' },
  { q: 'How do coaches measure VSL ROI?',                      cat: 'industries', slug: 'how-do-coaches-measure-vsl-roi', group: 'For coaches' },
  // Consultants
  { q: 'What makes a consulting sales video convert?',         cat: 'industries', slug: 'what-makes-a-consulting-sales-video-convert', group: 'For consultants' },
  { q: 'How long should a consulting sales video be?',         cat: 'industries', slug: 'how-long-should-a-consulting-sales-video-be', group: 'For consultants' },
  { q: 'How do consultants qualify leads with video?',         cat: 'industries', slug: 'how-do-consultants-qualify-leads-with-video', group: 'For consultants' },
  { q: 'How do consultants reduce call no-shows with video?',  cat: 'industries', slug: 'how-do-consultants-reduce-call-no-shows-with-video', group: 'For consultants' },
  { q: 'How do consultants track which content books calls?',  cat: 'industries', slug: 'how-do-consultants-track-which-content-books-calls', group: 'For consultants' },
  // Agencies
  { q: 'How do agencies audit a client VSL?',                  cat: 'industries', slug: 'how-do-agencies-audit-a-client-vsl', group: 'For agencies' },
  { q: 'How do agencies benchmark client video performance?', cat: 'industries', slug: 'how-do-agencies-benchmark-client-video-performance', group: 'For agencies' },
  { q: 'How do agencies improve client VSL conversion?',       cat: 'industries', slug: 'how-do-agencies-improve-client-vsl-conversion', group: 'For agencies' },
  { q: 'How do agencies set up video tracking for clients?',   cat: 'industries', slug: 'how-do-agencies-set-up-video-tracking-for-clients', group: 'For agencies' },
  { q: 'How do agencies justify video retainers?',             cat: 'industries', slug: 'how-do-agencies-justify-video-retainers', group: 'For agencies' },
  // SaaS
  { q: 'What makes a SaaS demo video convert?',                cat: 'industries', slug: 'what-makes-a-saas-demo-video-convert', group: 'For SaaS' },
  { q: 'How do SaaS teams improve demo completion rate?',      cat: 'industries', slug: 'how-do-saas-teams-improve-demo-completion-rate', group: 'For SaaS' },
  { q: 'How do SaaS teams A/B test product videos?',           cat: 'industries', slug: 'how-do-saas-teams-ab-test-product-videos', group: 'For SaaS' },
  { q: 'How do SaaS teams track video on pricing pages?',      cat: 'industries', slug: 'how-do-saas-teams-track-video-on-pricing-pages', group: 'For SaaS' },
  { q: 'How do SaaS teams tie video engagement to trials?',    cat: 'industries', slug: 'how-do-saas-teams-tie-video-engagement-to-trials', group: 'For SaaS' },
  // B2B sales
  { q: 'What makes a B2B demo video effective?',               cat: 'industries', slug: 'what-makes-a-b2b-demo-video-effective', group: 'For B2B sales' },
  { q: 'How do B2B teams shorten demo videos using data?',     cat: 'industries', slug: 'how-do-b2b-teams-shorten-demo-videos-using-data', group: 'For B2B sales' },
  { q: 'How do B2B teams use video engagement as a signal?',   cat: 'industries', slug: 'how-do-b2b-teams-use-video-engagement-as-a-signal', group: 'For B2B sales' },
  { q: 'How do B2B teams improve demo completion?',            cat: 'industries', slug: 'how-do-b2b-teams-improve-demo-completion', group: 'For B2B sales' },
  { q: 'How do B2B teams track video across the sales cycle?', cat: 'industries', slug: 'how-do-b2b-teams-track-video-across-the-sales-cycle', group: 'For B2B sales' },
];
