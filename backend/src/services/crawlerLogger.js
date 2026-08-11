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
function crawlerLogger(req, res, next) {
  const bot = detectBot(req.headers['user-agent'] || '');
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
  next();
}

module.exports = { crawlerLogger, detectBot };
