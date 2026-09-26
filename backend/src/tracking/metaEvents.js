'use strict';

/**
 * Meta event-name helpers — shared by the embed (browser pixel), the CAPI
 * sender, and the settings validator so all three read one mapping the same way.
 *
 * A mapping cell is a COMMA-SEPARATED LIST, e.g. "vsl_view, ViewContent".
 * One VidaPulse event therefore fans out to N Meta events, each fired as its
 * own pixel call and its own CAPI event (back to back), each with its own
 * event_id so browser + server copies of the SAME name deduplicate in Meta.
 */

/** Meta's standard events — anything else is a custom event (trackCustom). */
const STANDARD_EVENTS = new Set([
  'AddPaymentInfo', 'AddToCart', 'AddToWishlist', 'CompleteRegistration', 'Contact',
  'CustomizeProduct', 'Donate', 'FindLocation', 'InitiateCheckout', 'Lead', 'PageView',
  'Purchase', 'Schedule', 'Search', 'StartTrial', 'SubmitApplication', 'Subscribe',
  'ViewContent',
]);

/** Hard cap per VidaPulse event — one viewer milestone can't become a flood. */
const MAX_META_EVENTS = 5;

/** Max length of one Meta event name. */
const MAX_NAME_LEN = 40;

/**
 * Parse a mapping cell into an ordered, de-duplicated list of Meta event names.
 * Accepts a comma-separated string (or an array, for forward compatibility).
 * Names are sanitised to Meta's allowed charset; empties are dropped.
 *
 * @param {string|string[]|null|undefined} raw
 * @returns {string[]}
 */
function parseMetaEvents(raw) {
  if (!raw) return [];
  const parts = Array.isArray(raw) ? raw : String(raw).split(',');
  const out   = [];
  for (const part of parts) {
    const name = String(part).trim().replace(/[^A-Za-z0-9_]/g, '').slice(0, MAX_NAME_LEN);
    if (!name) continue;
    if (out.includes(name)) continue;          // same name twice = one event
    out.push(name);
    if (out.length >= MAX_META_EVENTS) break;
  }
  return out;
}

/** Canonical storage form for a mapping cell — "A, B, C". */
function normalizeMetaEvents(raw) {
  return parseMetaEvents(raw).join(', ');
}

/** @returns {boolean} true when Meta owns this name (fbq('track', …)). */
function isStandardEvent(name) {
  return STANDARD_EVENTS.has(name);
}

/**
 * The event_id for ONE meta event inside a fire.
 *
 * Meta deduplicates on (event_name, event_id), so each name in the list needs
 * its own id — the browser and the server must derive it identically from the
 * base id the browser minted for that fire.
 *
 * @param {string} baseId    per-fire id from the embed
 * @param {string} metaEvent the Meta event name
 */
function metaEventId(baseId, metaEvent) {
  return `${baseId}:${metaEvent}`;
}

module.exports = {
  STANDARD_EVENTS,
  MAX_META_EVENTS,
  parseMetaEvents,
  normalizeMetaEvents,
  isStandardEvent,
  metaEventId,
};
