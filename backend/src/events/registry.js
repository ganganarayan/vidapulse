'use strict';

/**
 * Event Registry — the SINGLE source of truth for VidaPulse's event vocabulary.
 *
 * Two planes (kept strictly separate downstream):
 *   - scope: 'platform'  → VidaPulse's own funnel/lifecycle events about a
 *                          subscriber. Route to event_webhooks (admin-owned).
 *   - scope: 'viewer'    → engagement events about a subscriber's VIEWERS on
 *                          their embedded videos. Route to the owner's pixel +
 *                          tracking_webhooks (subscriber-owned).
 *
 * Delivery frequency is DATA, not scattered code:
 *   - 'once'              → at most once per user, ever (dedup via behavioral_events).
 *   - 'once_per_session'  → at most once per viewer session (dedup via
 *                           tracking_session_events). Meta Pixel still fires
 *                           every occurrence; only WEBHOOK delivery is deduped.
 *   - 'many'              → fires every occurrence.
 *
 * NAMING: `key` is the snake_case event name used everywhere (DB, payload
 * `contact.event_type`, webhook routing). Live CRM automations branch on these
 * exact values — never rename. `display_name` is the human label for the UI.
 */

const EVENTS = [
  // ── Account lifecycle (platform) ──────────────────────────────────────────
  { key: 'user_signed_up',          display_name: 'Registration',              description: 'A new account was created (self-signup, OAuth, or webhook).',          category: 'Lifecycle',     scope: 'platform', frequency: 'once', payload_schema: { signup_source: 'string', email: 'string', plan: 'string' } },
  { key: 'user_logged_in',          display_name: 'First Login',               description: "First successful login (deduped — later logins don't fire).",          category: 'Lifecycle',     scope: 'platform', frequency: 'once', payload_schema: { login_method: 'string' } },
  { key: 'user_restored',           display_name: 'Account Restored',          description: 'A deactivated account was reactivated.',                                category: 'Lifecycle',     scope: 'platform', frequency: 'many', payload_schema: { email: 'string', restored_by: 'string' } },
  { key: 'inactivity_reminder_10d', display_name: 'Inactivity Reminder (10d)', description: '10 days before auto-deactivation.',                                     category: 'Lifecycle',     scope: 'platform', frequency: 'many', payload_schema: { email: 'string', days_until_deactivation: 'number' } },
  { key: 'inactivity_reminder_3d',  display_name: 'Inactivity Reminder (3d)',  description: '3 days before auto-deactivation.',                                      category: 'Lifecycle',     scope: 'platform', frequency: 'many', payload_schema: { email: 'string', days_until_deactivation: 'number' } },
  { key: 'user_deactivated',        display_name: 'Account Deactivated',       description: 'Account auto-deactivated after 180 days idle.',                         category: 'Lifecycle',     scope: 'platform', frequency: 'many', payload_schema: { email: 'string', reason: 'string' } },

  // ── Onboarding funnel (platform) ──────────────────────────────────────────
  { key: 'first_video_added',       display_name: 'First Video Added',         description: "The user's video count went 0 → 1.",                                    category: 'Onboarding',    scope: 'platform', frequency: 'once', payload_schema: { video_id: 'string', source_type: 'string' } },
  { key: 'embed_generated',         display_name: 'Embed Generated',           description: 'The user generated/copied an embed snippet for the first time.',        category: 'Onboarding',    scope: 'platform', frequency: 'once', payload_schema: { video_id: 'string' } },
  { key: 'tracking_activated',      display_name: 'Tracking Activated',        description: "First real play received from any of the user's embedded videos.",       category: 'Onboarding',    scope: 'platform', frequency: 'once', payload_schema: { video_id: 'string' } },
  { key: 'wow_moment_seen',         display_name: 'Wow Moment Seen',           description: 'The user first viewed the primary insight card.',                       category: 'Onboarding',    scope: 'platform', frequency: 'once', payload_schema: { video_id: 'string' } },
  { key: 'first_analytics_milestone', display_name: '10 Viewers Milestone',    description: 'A video reached 10 unique viewers.',                                    category: 'Engagement',    scope: 'platform', frequency: 'once', payload_schema: { video_id: 'string', viewers_count: 'number' } },
  { key: 'twenty_viewers_milestone',  display_name: '20 Viewers Milestone',    description: 'A video reached 20 unique viewers.',                                    category: 'Engagement',    scope: 'platform', frequency: 'once', payload_schema: { video_id: 'string', viewers_count: 'number' } },
  { key: 'fifty_viewers_milestone',   display_name: '50 Viewers Milestone',    description: 'A video reached 50 unique viewers.',                                    category: 'Engagement',    scope: 'platform', frequency: 'once', payload_schema: { video_id: 'string', viewers_count: 'number' } },
  { key: 'video_plays_milestone',     display_name: 'Plays Milestone',         description: 'A video crossed a plays threshold (deduped per video).',                 category: 'Engagement',    scope: 'platform', frequency: 'many', payload_schema: { video_id: 'string', plays_count: 'number' } },

  // ── Upgrade intent (platform, internal) ───────────────────────────────────
  { key: 'free_limit_hit',          display_name: 'Free Limit Hit',            description: 'A free user hit a plan limit (upgrade-intent signal).',                  category: 'Upgrade Intent', scope: 'platform', frequency: 'many', payload_schema: {} },
  { key: 'pro_feature_attempted',   display_name: 'Pro Feature Attempted',     description: 'A user tried to use a Pro-gated feature.',                              category: 'Upgrade Intent', scope: 'platform', frequency: 'many', payload_schema: { feature: 'string' } },
  { key: 'upgrade_page_visited',    display_name: 'Upgrade Page Visited',      description: 'The user opened the upgrade/pricing page.',                             category: 'Upgrade Intent', scope: 'platform', frequency: 'many', payload_schema: {} },
  { key: 'converted_to_paid',       display_name: 'Converted To Paid',         description: 'The user upgraded to a paid plan.',                                     category: 'Billing',        scope: 'platform', frequency: 'once', payload_schema: { plan: 'string' } },

  // ── Billing / subscription (platform) ─────────────────────────────────────
  { key: 'plan_upgraded',             display_name: 'Plan Upgraded',           description: 'A payment confirmed a plan change.',                                    category: 'Billing',        scope: 'platform', frequency: 'many', payload_schema: { plan: 'string' } },
  { key: 'plan_expired',              display_name: 'Plan Expired',            description: 'A paid plan reached its expiry.',                                       category: 'Billing',        scope: 'platform', frequency: 'many', payload_schema: {} },
  { key: 'subscription_payment_failed', display_name: 'Payment Failed',        description: 'A subscription payment attempt failed.',                                category: 'Billing',        scope: 'platform', frequency: 'many', payload_schema: {} },
  { key: 'subscription_cancelled',    display_name: 'Subscription Cancelled',  description: 'A subscription was cancelled.',                                         category: 'Billing',        scope: 'platform', frequency: 'many', payload_schema: {} },

  // ── Re-engagement (platform) ──────────────────────────────────────────────
  { key: 'no_return_after_wow',     display_name: 'No Return After Wow',       description: "User saw the wow moment but didn't return (weekly-capped).",            category: 'Re-engagement',  scope: 'platform', frequency: 'many', payload_schema: {} },

  // ── VIEWER plane — engagement on a subscriber's embedded videos ───────────
  // Pixel fires EVERY occurrence (client-side). Webhook delivery follows `frequency`.
  { key: 'vsl_view',    display_name: 'VSL View',  description: 'A viewer started playing the embedded video.',  category: 'Video', scope: 'viewer', frequency: 'once_per_session', payload_schema: { video_id: 'string' } },
  { key: 'vsl_25',      display_name: 'VSL 25%',   description: 'A viewer reached 25% of the video.',            category: 'Video', scope: 'viewer', frequency: 'once_per_session', payload_schema: { video_id: 'string' } },
  { key: 'vsl_50',      display_name: 'VSL 50%',   description: 'A viewer reached 50% of the video.',            category: 'Video', scope: 'viewer', frequency: 'once_per_session', payload_schema: { video_id: 'string' } },
  { key: 'vsl_75',      display_name: 'VSL 75%',   description: 'A viewer reached 75% of the video.',            category: 'Video', scope: 'viewer', frequency: 'once_per_session', payload_schema: { video_id: 'string' } },
  { key: 'vsl_100',     display_name: 'VSL 100%',  description: 'A viewer completed the video.',                 category: 'Video', scope: 'viewer', frequency: 'once_per_session', payload_schema: { video_id: 'string' } },
  { key: 'cta_clicked', display_name: 'CTA Clicked', description: 'A viewer clicked a CTA on the embedded video.', category: 'Video', scope: 'viewer', frequency: 'many',            payload_schema: { video_id: 'string', cta_name: 'string' } },

  // ── Reserved (DEFINED, not emitted yet) ───────────────────────────────────
  { key: 'video_published', display_name: 'Video Published', description: 'A video was published (reserved).', category: 'Video (reserved)', scope: 'viewer', frequency: 'many', reserved: true, payload_schema: { video_id: 'string' } },
  { key: 'video_archived',  display_name: 'Video Archived',  description: 'A video was archived (reserved).',  category: 'Video (reserved)', scope: 'viewer', frequency: 'many', reserved: true, payload_schema: { video_id: 'string' } },
];

// Fast lookup by key.
const BY_KEY = new Map(EVENTS.map((e) => [e.key, e]));

/** One-time-per-user keys (frequency === 'once') — derived, not hardcoded. */
const ONE_TIME_KEYS = new Set(EVENTS.filter((e) => e.frequency === 'once').map((e) => e.key));

/** @returns {object|null} the registry entry for an event key, or null. */
function getEvent(key) {
  return BY_KEY.get(key) || null;
}

/** @returns {boolean} true when the event is one-time-per-user. */
function isOneTime(key) {
  return ONE_TIME_KEYS.has(key);
}

/** @returns {'once'|'once_per_session'|'many'} delivery frequency (defaults 'many'). */
function getFrequency(key) {
  return BY_KEY.get(key)?.frequency || 'many';
}

/** @returns {'platform'|'viewer'|null} the event's plane. */
function getScope(key) {
  return BY_KEY.get(key)?.scope || null;
}

/** @returns {string} the human display name (falls back to the key). */
function displayName(key) {
  return BY_KEY.get(key)?.display_name || key;
}

/** All registry entries (optionally filtered by scope / reserved). */
function listEvents({ includeReserved = true, scope = null } = {}) {
  return EVENTS.filter((e) => (includeReserved || !e.reserved) && (!scope || e.scope === scope));
}

module.exports = {
  EVENTS,
  ONE_TIME_KEYS,
  getEvent,
  isOneTime,
  getFrequency,
  getScope,
  displayName,
  listEvents,
};
