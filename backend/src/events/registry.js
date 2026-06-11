'use strict';

/**
 * Event Registry — the SINGLE source of truth for VidaPulse's event vocabulary.
 *
 * Mirrors the Assess360 pattern (one catalog of event definitions), adapted to
 * VidaPulse's stack (plain JS, no Prisma enum). Replaces the scattered Sets that
 * used to live in behavioralEventService.
 *
 * IMPORTANT — naming: `event_name` is intentionally IDENTICAL to the existing
 * snake_case `event_key` (e.g. "user_signed_up"). The outbound webhook payload
 * already sends `contact.event_type = <event_key>` and the live Divine Leads /
 * MyAppZ automations branch on those exact values — renaming would break them.
 * `display_name` carries the human label for the admin UI.
 *
 * Each entry:
 *   key            internal + public event name (snake_case, stable)
 *   display_name   human label (admin UI)
 *   description    what it means / when it fires
 *   category       grouping for the UI
 *   one_time       true → fires at most once per user (dedup in emitEvent)
 *   reserved       true → defined but NOT emitted yet (future producer)
 *   payload_schema lightweight field descriptor { field: 'type — note' } (docs/preview)
 */

const EVENTS = [
  // ── Account lifecycle ────────────────────────────────────────────────────
  {
    key: 'user_signed_up',
    display_name: 'Registration',
    description: 'A new account was created (self-signup, OAuth, or webhook).',
    category: 'Lifecycle',
    one_time: true,
    payload_schema: { signup_source: 'string', email: 'string', plan: 'string' },
  },
  {
    key: 'user_logged_in',
    display_name: 'First Login',
    description: "First successful login for the user (deduped — later logins don't fire).",
    category: 'Lifecycle',
    one_time: true,
    payload_schema: { login_method: 'string — password | google' },
  },
  {
    key: 'user_restored',
    display_name: 'Account Restored',
    description: 'A deactivated account was reactivated (self-service or admin).',
    category: 'Lifecycle',
    one_time: false,
    payload_schema: { email: 'string', restored_by: 'string' },
  },
  {
    key: 'inactivity_reminder_10d',
    display_name: 'Inactivity Reminder (10d)',
    description: '10 days before auto-deactivation for inactivity.',
    category: 'Lifecycle',
    one_time: false,
    payload_schema: { email: 'string', days_until_deactivation: 'number' },
  },
  {
    key: 'inactivity_reminder_3d',
    display_name: 'Inactivity Reminder (3d)',
    description: '3 days before auto-deactivation for inactivity.',
    category: 'Lifecycle',
    one_time: false,
    payload_schema: { email: 'string', days_until_deactivation: 'number' },
  },
  {
    key: 'user_deactivated',
    display_name: 'Account Deactivated',
    description: 'Account auto-deactivated after 180 days idle.',
    category: 'Lifecycle',
    one_time: false,
    payload_schema: { email: 'string', reason: 'string' },
  },

  // ── Onboarding funnel ─────────────────────────────────────────────────────
  {
    key: 'first_video_added',
    display_name: 'First Video Added',
    description: "The user's video count went 0 → 1.",
    category: 'Onboarding',
    one_time: true,
    payload_schema: { video_id: 'string', video_url: 'string', source_type: 'string', title: 'string' },
  },
  {
    key: 'embed_generated',
    display_name: 'Embed Generated',
    description: 'The user generated/copied an embed snippet for the first time.',
    category: 'Onboarding',
    one_time: true,
    payload_schema: { video_id: 'string' },
  },
  {
    key: 'tracking_activated',
    display_name: 'Tracking Activated',
    description: 'First real play received from any of the user\'s embedded videos.',
    category: 'Onboarding',
    one_time: true,
    payload_schema: { video_id: 'string' },
  },
  {
    key: 'wow_moment_seen',
    display_name: 'Wow Moment Seen',
    description: 'The user first viewed the primary insight ("wow moment") card.',
    category: 'Onboarding',
    one_time: true,
    payload_schema: { video_id: 'string' },
  },
  {
    key: 'first_analytics_milestone',
    display_name: '10 Viewers Milestone',
    description: 'A video reached 10 unique viewers.',
    category: 'Engagement',
    one_time: true,
    payload_schema: { video_id: 'string', viewers_count: 'number' },
  },
  {
    key: 'twenty_viewers_milestone',
    display_name: '20 Viewers Milestone',
    description: 'A video reached 20 unique viewers.',
    category: 'Engagement',
    one_time: true,
    payload_schema: { video_id: 'string', viewers_count: 'number' },
  },
  {
    key: 'fifty_viewers_milestone',
    display_name: '50 Viewers Milestone',
    description: 'A video reached 50 unique viewers.',
    category: 'Engagement',
    one_time: true,
    payload_schema: { video_id: 'string', viewers_count: 'number' },
  },
  {
    key: 'video_plays_milestone',
    display_name: 'Plays Milestone',
    description: 'A video crossed a plays threshold (10/20/50/100/200…). Deduped per video.',
    category: 'Engagement',
    one_time: false,
    payload_schema: { video_id: 'string', plays_count: 'number' },
  },

  // ── Upgrade intent (internal — NOT delivered to CRM by default) ────────────
  {
    key: 'free_limit_hit',
    display_name: 'Free Limit Hit',
    description: 'A free user hit a plan limit (upgrade-intent signal).',
    category: 'Upgrade Intent',
    one_time: false,
    payload_schema: {},
  },
  {
    key: 'pro_feature_attempted',
    display_name: 'Pro Feature Attempted',
    description: 'A user tried to use a Pro-gated feature.',
    category: 'Upgrade Intent',
    one_time: false,
    payload_schema: { feature: 'string' },
  },
  {
    key: 'upgrade_page_visited',
    display_name: 'Upgrade Page Visited',
    description: 'The user opened the upgrade/pricing page.',
    category: 'Upgrade Intent',
    one_time: false,
    payload_schema: {},
  },
  {
    key: 'converted_to_paid',
    display_name: 'Converted To Paid',
    description: 'The user upgraded to a paid plan.',
    category: 'Billing',
    one_time: true,
    payload_schema: { plan: 'string' },
  },

  // ── Billing / subscription ─────────────────────────────────────────────────
  {
    key: 'plan_upgraded',
    display_name: 'Plan Upgraded',
    description: 'A payment confirmed a plan change.',
    category: 'Billing',
    one_time: false,
    payload_schema: { plan: 'string' },
  },
  {
    key: 'plan_expired',
    display_name: 'Plan Expired',
    description: 'A paid plan reached its expiry.',
    category: 'Billing',
    one_time: false,
    payload_schema: {},
  },
  {
    key: 'subscription_payment_failed',
    display_name: 'Payment Failed',
    description: 'A subscription payment attempt failed.',
    category: 'Billing',
    one_time: false,
    payload_schema: {},
  },
  {
    key: 'subscription_cancelled',
    display_name: 'Subscription Cancelled',
    description: 'A subscription was cancelled.',
    category: 'Billing',
    one_time: false,
    payload_schema: {},
  },

  // ── Re-engagement ──────────────────────────────────────────────────────────
  {
    key: 'no_return_after_wow',
    display_name: 'No Return After Wow',
    description: "User saw the wow moment but didn't return (weekly-capped).",
    category: 'Re-engagement',
    one_time: false,
    payload_schema: {},
  },

  // ── Reserved (DEFINED, not yet emitted) — future video/VSL producers ───────
  { key: 'vsl_view',        display_name: 'VSL View',        description: 'Embedded video started playing (reserved).',      category: 'Video (reserved)', one_time: false, reserved: true, payload_schema: { video_id: 'string' } },
  { key: 'vsl_25',          display_name: 'VSL 25%',         description: 'Viewer reached 25% of the video (reserved).',     category: 'Video (reserved)', one_time: false, reserved: true, payload_schema: { video_id: 'string' } },
  { key: 'vsl_50',          display_name: 'VSL 50%',         description: 'Viewer reached 50% of the video (reserved).',     category: 'Video (reserved)', one_time: false, reserved: true, payload_schema: { video_id: 'string' } },
  { key: 'vsl_75',          display_name: 'VSL 75%',         description: 'Viewer reached 75% of the video (reserved).',     category: 'Video (reserved)', one_time: false, reserved: true, payload_schema: { video_id: 'string' } },
  { key: 'vsl_100',         display_name: 'VSL 100%',        description: 'Viewer completed the video (reserved).',          category: 'Video (reserved)', one_time: false, reserved: true, payload_schema: { video_id: 'string' } },
  { key: 'video_published', display_name: 'Video Published', description: 'A video was published (reserved).',                category: 'Video (reserved)', one_time: false, reserved: true, payload_schema: { video_id: 'string' } },
  { key: 'video_archived',  display_name: 'Video Archived',  description: 'A video was archived (reserved).',                 category: 'Video (reserved)', one_time: false, reserved: true, payload_schema: { video_id: 'string' } },
];

// Fast lookup by key.
const BY_KEY = new Map(EVENTS.map((e) => [e.key, e]));

/** One-time event keys (replaces the old hardcoded ONE_TIME_USER_EVENTS set). */
const ONE_TIME_KEYS = new Set(EVENTS.filter((e) => e.one_time).map((e) => e.key));

/** @returns {object|null} the registry entry for an event key, or null. */
function getEvent(key) {
  return BY_KEY.get(key) || null;
}

/** @returns {boolean} true when the event is one-time-per-user. */
function isOneTime(key) {
  return ONE_TIME_KEYS.has(key);
}

/** @returns {string} the human display name (falls back to the key). */
function displayName(key) {
  return BY_KEY.get(key)?.display_name || key;
}

/** All registry entries (e.g. for the admin UI event picker). */
function listEvents({ includeReserved = true } = {}) {
  return includeReserved ? EVENTS.slice() : EVENTS.filter((e) => !e.reserved);
}

module.exports = {
  EVENTS,
  ONE_TIME_KEYS,
  getEvent,
  isOneTime,
  displayName,
  listEvents,
};
