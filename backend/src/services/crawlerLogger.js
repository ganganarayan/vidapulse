'use strict';

/**
 * crawlerLogger — Express middleware that records which bots/crawlers browse
 * the app, aggregated per bot per day in crawler_log (see migration 049).
 *
 * Fire-and-forget: never blocks the request, never throws. Only known bot
 * user-agents are logged; real human traffic is ignored.
 */

const { pool } = require('../config/database');
const logger   = require('../config/logger');

// Ordered so the more specific name wins. Each entry: [regex, display name].
const BOT_PATTERNS = [
  [/googlebot/i,            'Googlebot'],
  [/bingbot|bingpreview/i,  'Bingbot'],
  [/applebot/i,             'Applebot'],
  [/yandex/i,               'YandexBot'],
  [/baidu/i,                'Baiduspider'],
  [/duckduck/i,             'DuckDuckBot'],
  [/gptbot/i,               'GPTBot (OpenAI)'],
  [/oai-searchbot/i,        'OAI-SearchBot'],
  [/claudebot|anthropic/i,  'ClaudeBot (Anthropic)'],
  [/ccbot/i,                'CCBot (Common Crawl)'],
  [/perplexitybot/i,        'PerplexityBot'],
  [/facebookexternalhit/i,  'Facebook'],
  [/slackbot/i,             'Slackbot'],
  [/twitterbot/i,           'Twitterbot'],
  [/linkedinbot/i,          'LinkedInBot'],
  [/whatsapp/i,             'WhatsApp'],
  [/telegrambot/i,          'TelegramBot'],
  [/discordbot/i,           'Discordbot'],
  [/semrush/i,              'SemrushBot'],
  [/ahrefs/i,               'AhrefsBot'],
  [/mj12bot/i,              'MJ12bot'],
  [/dotbot/i,               'DotBot'],
  [/petalbot/i,             'PetalBot'],
  [/bytespider/i,           'Bytespider'],
  [/censys/i,               'Censys'],
  [/palo alto|expanse|cortex/i, 'Palo Alto Scan'],
  [/wp-includes|wlwmanifest|xmlrpc/i, 'WordPress vuln-scan'],
  // Generic fallbacks last
  [/bot\b|crawler|spider|slurp|scan|monitor|preview|headless|python-requests|curl|wget|go-http/i, 'Other bot'],
];

function detectBot(ua) {
  if (!ua) return null;
  for (const [re, name] of BOT_PATTERNS) {
    if (re.test(ua)) return name;
  }
  return null;
}

function clientIp(req) {
  return req.headers['cf-connecting-ip']
      || (req.headers['x-forwarded-for'] || '').split(',')[0].trim()
      || req.ip || null;
}

/** Express middleware — logs bot requests, passes everything through. */
// True for actual page requests worth counting per-link (KB pages, homepage,
// embeds, app routes). Skips API, static assets, and asset file extensions so
// path_hits stays a clean "which link had how many views" table.
function isPageRequest(req) {
  if (req.method !== 'GET') return false;
  const p = req.path || '';
  if (p.startsWith('/api') || p.startsWith('/assets') || p.startsWith('/kb-assets')) return false;
  if (/\.(css|js|mjs|json|map|png|jpe?g|svg|gif|ico|webp|avif|woff2?|ttf|eot|txt|xml)$/i.test(p)) return false;
  return true;
}

function crawlerLogger(req, res, next) {
  const bot = detectBot(req.headers['user-agent'] || '');

  // Per-bot daily aggregate (which crawlers are browsing).
  if (bot) {
    pool.query(
      `INSERT INTO crawler_log (bot_name, day, hits, last_path, last_ip, last_seen)
       VALUES ($1, CURRENT_DATE, 1, $2, $3, NOW())
       ON CONFLICT (bot_name, day) DO UPDATE
         SET hits      = crawler_log.hits + 1,
             last_path = EXCLUDED.last_path,
             last_ip   = EXCLUDED.last_ip,
             last_seen = NOW()`,
      [bot, (req.originalUrl || req.path || '').slice(0, 500), clientIp(req)]
    ).catch(err => logger.debug(`[crawler] log failed: ${err.message}`));
  }

  // Per-link daily aggregate (which link had how many hits — incl. crawlers).
  if (isPageRequest(req)) {
    const path = (req.path || '/').slice(0, 500);
    pool.query(
      `INSERT INTO path_hits (path, day, hits, bot_hits, last_seen)
       VALUES ($1, CURRENT_DATE, 1, $2, NOW())
       ON CONFLICT (path, day) DO UPDATE
         SET hits      = path_hits.hits + 1,
             bot_hits  = path_hits.bot_hits + $2,
             last_seen = NOW()`,
      [path, bot ? 1 : 0]
    ).catch(err => logger.debug(`[path_hits] log failed: ${err.message}`));
  }

  next();
}

module.exports = { crawlerLogger, detectBot };
