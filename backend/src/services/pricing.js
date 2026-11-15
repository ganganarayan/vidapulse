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

// geoip-lite is required lazily (inside countryForReq) so this module can be
// loaded without it, e.g. by scripts/export-static.js on Cloudflare Pages,
// which installs only ejs.

const MONTHLY = {
  USD: { starter: 29,   pro: 79,   scale: 199,  pro_founding: 59   },
  INR: { starter: 1499, pro: 3999, scale: 9999, pro_founding: 2999 },
};
// pro_founding: legacy price of the closed founding offer. Kept only so
// renewals of existing founding subscriptions are recognised; never offered,
// never listed in table().
const LEGACY_KEYS = new Set(['pro_founding']);
const YEARLY_MULTIPLIER = 10;          // pay 10 months, get 12

// GST: INR (India) prices are shown exclusive of GST and charged with 18% GST
// added. USD (customers outside India, export of services) is charged at the
// plan price. GST_RATE is the only place the rate lives.
const GST_RATE  = 0.18;
const GST_LABEL = '+ 18% GST';
/** Tax rate applied on top of the plan price for a currency (0.18 for INR, 0 for USD). */
function taxRate(currency) { return normCurrency(currency) === 'INR' ? GST_RATE : 0; }
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
  try { return require('geoip-lite').lookup(ip.replace(/^::ffff:/i, ''))?.country || null; }
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

/**
 * What the customer is actually charged for a plan, in the smallest unit
 * (paise / cents): the plan price plus GST for INR. Razorpay plans bill this.
 */
function chargeMinor(key, currency, cycle) {
  const base = price(key, currency, cycle) * 100;
  return Math.round(base * (1 + taxRate(currency)));
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

/** Label for a charged amount that may carry paise: '₹1,768.82', '$79'. */
function chargeLabel(amount, currency) {
  const whole = Math.floor(amount);
  const frac  = Math.round((amount - whole) * 100);
  return label(whole, currency) + (frac ? '.' + String(frac).padStart(2, '0') : '');
}

/** Full price table for one currency, both cycles, with labels. */
function table(currency) {
  const cur = normCurrency(currency);
  const rate = taxRate(cur);
  const out = {
    currency: cur, symbol: cur === 'INR' ? '₹' : '$', yearly_multiplier: YEARLY_MULTIPLIER,
    // Shown next to INR prices; null when no tax is added (USD).
    tax: rate ? { rate, label: GST_LABEL } : null,
    plans: {},
  };
  for (const key of Object.keys(MONTHLY[cur])) {
    if (LEGACY_KEYS.has(key)) continue;
    out.plans[key] = {};
    for (const cycle of CYCLES) {
      const amt = price(key, cur, cycle);
      const charge = chargeMinor(key, cur, cycle) / 100;   // incl. GST for INR
      out.plans[key][cycle] = { amount: amt, label: label(amt, cur), charge, charge_label: chargeLabel(charge, cur) };
    }
  }
  return out;
}

module.exports = {
  MONTHLY, YEARLY_MULTIPLIER, CYCLES, CURRENCIES, GST_RATE, GST_LABEL, taxRate, chargeMinor,
  clientIp, countryForReq, currencyForReq,
  normCycle, normCurrency, price, label, table,
};
