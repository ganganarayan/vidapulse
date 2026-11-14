'use strict';

/**
 * pricing.js: the single source of plan prices.
 *
 * Visitors in India (by IP) see and pay INR; everyone else sees and pays USD.
 * Yearly billing = 10 x monthly (2 months free). Amounts here are whole
 * currency units; Razorpay gets them x100 (paise / cents).
 *
 * Nothing here is configured by the owner: checkout creates the matching
 * Razorpay plan from these numbers (see razorpayService.getOrCreatePlan).
 */

const geoip = require('geoip-lite');

const MONTHLY = {
  USD: { starter: 29,   pro: 79,   scale: 199,  pro_founding: 59   },
  INR: { starter: 1499, pro: 3999, scale: 9999, pro_founding: 2999 },
};
const YEARLY_MULTIPLIER = 10;          // pay 10 months, get 12
const CYCLES     = ['monthly', 'yearly'];
const CURRENCIES = ['USD', 'INR'];

/** Real client IP, honouring Cloudflare and reverse-proxy headers. */
function clientIp(req) {
  const cf = req.headers['cf-connecting-ip'];
  if (cf) return String(cf).trim();
  const xff = req.headers['x-forwarded-for'];
  if (xff) return String(xff).split(',')[0].trim();
  return req.ip || null;
}

/** ISO country of the requester (e.g. 'IN'), or null when unknown. */
function countryForReq(req) {
  const cfCountry = req.headers['cf-ipcountry'];
  if (cfCountry && /^[A-Z]{2}$/i.test(cfCountry) && cfCountry !== 'XX') return cfCountry.toUpperCase();
  const ip = clientIp(req);
  if (!ip) return null;
  try { return geoip.lookup(ip.replace(/^::ffff:/i, ''))?.country || null; }
  catch { return null; }
}

/** 'INR' for India, 'USD' for everyone else (and when the lookup fails). */
function currencyForReq(req) {
  return countryForReq(req) === 'IN' ? 'INR' : 'USD';
}

function normCycle(c)    { return c === 'yearly' ? 'yearly' : 'monthly'; }
function normCurrency(c) { return String(c || '').toUpperCase() === 'INR' ? 'INR' : 'USD'; }

/** Price in whole units for a price key ('starter'|'pro'|'pro_founding'|'scale'). */
function price(key, currency, cycle) {
  const m = MONTHLY[normCurrency(currency)][key];
  if (m == null) throw new Error(`Unknown price key: ${key}`);
  return normCycle(cycle) === 'yearly' ? m * YEARLY_MULTIPLIER : m;
}

/** Display label: '$29', '$290', '₹1,499', '₹14,990' (Indian digit grouping). */
function label(amount, currency) {
  if (normCurrency(currency) === 'INR') {
    const s = String(Math.round(amount));
    const last3 = s.slice(-3);
    const rest  = s.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    return '₹' + (rest ? rest + ',' + last3 : last3);
  }
  return '$' + Math.round(amount).toLocaleString('en-US');
}

/** Full price table for one currency, both cycles, with labels. */
function table(currency) {
  const cur = normCurrency(currency);
  const out = { currency: cur, symbol: cur === 'INR' ? '₹' : '$', yearly_multiplier: YEARLY_MULTIPLIER, plans: {} };
  for (const key of Object.keys(MONTHLY[cur])) {
    out.plans[key] = {};
    for (const cycle of CYCLES) {
      const amt = price(key, cur, cycle);
      out.plans[key][cycle] = { amount: amt, label: label(amt, cur) };
    }
  }
  return out;
}

module.exports = {
  MONTHLY, YEARLY_MULTIPLIER, CYCLES, CURRENCIES,
  clientIp, countryForReq, currencyForReq,
  normCycle, normCurrency, price, label, table,
};
