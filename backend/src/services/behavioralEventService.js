'use strict';

/**
 * Behavioral Event Service
 *
 * Single public function: emitEvent(userId, eventKey, videoId?, payload?)
 *
 * Called anywhere in the codebase when a user reaches a behavioral milestone
 * or triggers a plan gate. Writes to behavioral_events + updates onboarding_state
 * inside one database transaction, then returns immediately.
 *
 * The webhook sender (Step 5) polls behavioral_events every 30 seconds and
 * fires the POST to the single URL stored in webhook_settings.
 *
 * ── Idempotency rules ───────────────────────────────────────────────────
 *   ONE_TIME_USER_EVENTS   — skip if any row exists for (user_id, event_key)
 *   VIDEO_MILESTONE_EVENTS — skip if video_milestones row exists for
 *                            (video_id, milestone_key); also in ONE_TIME for user
 *   WEEKLY_CAP_EVENTS      — skip if row exists for (user_id, event_key)
 *                            within the last 7 days
 *   All others             — always emit
 *
 * ── CRITICAL ────────────────────────────────────────────────────────────
 *   This function NEVER throws and NEVER rejects.
 *   User-facing API responses must not fail because of a behavioral event.
 */

const { pool }   = require('../config/database');
const logger     = require('../config/logger');
const { fireContactWebhook, fireStageWebhook } = require('./contactWebhookSender');

// ── Event classification ──────────────────────────────────────────────────

// Events that fire the CRM contact webhook.
// Keep this list short — only genuine lead/conversion events belong here.
// Upgrade-intent signals (pro_feature_attempted, free_limit_hit, etc.) are
// internal-only: they feed the admin funnel dashboard but must NEVER trigger
// CRM automations before a payment is actually completed.
// Payment success events (plan_upgraded_to_starter, plan_upgraded_to_pro, etc.)
// will be added here once the payment flow is wired.
const CRM_WEBHOOK_EVENTS = new Set([
  'user_signed_up',
  'user_restored',           // a deactivated account self-restored (or admin-restored)
  'inactivity_reminder_10d', // 10 days before auto-deactivation
  'inactivity_reminder_3d',  // 3 days before auto-deactivation
  'user_deactivated',        // auto-deactivated after 180 days idle
]);

// Onboarding "stage" milestones that POST to their OWN dedicated Divine Leads
// webhook URL (configured per-event in Admin → Webhook Settings). These are
// one-time per user (see ONE_TIME_USER_EVENTS) so each milestone reaches the
// CRM exactly once. Independent of CRM_WEBHOOK_EVENTS above — user_signed_up
// appears in both: its existing main contact webhook stays untouched, and the
// stage webhook only fires when a signup URL is configured.
const STAGE_WEBHOOK_EVENTS = new Set([
  'user_signed_up',
  'user_logged_in',
  'first_video_added',
  'embed_generated',
  'tracking_activated',
]);

// One-time per user: skip if a row already exists in behavioral_events
const ONE_TIME_USER_EVENTS = new Set([
  'user_signed_up',
  'user_logged_in',
  'first_video_added',
  'embed_generated',
  'tracking_activated',
  'wow_moment_seen',
  'first_analytics_milestone',
  'twenty_viewers_milestone',
  'fifty_viewers_milestone',
  'converted_to_paid',
]);

// Max once per 7 days per user
const WEEKLY_CAP_EVENTS = new Set([
  'no_return_after_wow',
]);

// These events also write a deduplication row to video_milestones.
// Map: eventKey → milestone_key stored in video_milestones.milestone_key
//
// NOTE: 'video_plays_milestone' is NOT in this map — its milestone_key is
// built dynamically from payload.plays_count (plays_10, plays_20, plays_50,
// plays_100, plays_200, …). See emitEvent() below.
const VIDEO_MILESTONE_MAP = {
  'first_analytics_milestone': 'viewers_10',
  'twenty_viewers_milestone':  'viewers_20',
  'fifty_viewers_milestone':   'viewers_50',
};

// ─────────────────────────────────────────────────────────────────────────
// PUBLIC API
// ─────────────────────────────────────────────────────────────────────────

/**
 * Emit a behavioral event.
 *
 * Transaction sequence:
 *   1. Video-level milestone dedup  (video_milestones INSERT — conflict = skip)
 *   2. User-level one-time dedup    (behavioral_events SELECT — exists = skip)
 *   3. Weekly frequency cap check   (behavioral_events SELECT — recent = skip)
 *   4. INSERT into behavioral_events
 *   5. Upsert onboarding_state row + apply milestone updates
 *   6. COMMIT
 *
 * @param {string}      userId   - User UUID
 * @param {string}      eventKey - One of the defined event keys (see comments in migration 004)
 * @param {string|null} [videoId]  - Related video UUID, or null
 * @param {Object}      [payload]  - Event-specific data included in the webhook envelope
 */
async function emitEvent(userId, eventKey, videoId = null, payload = {}) {
  try {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // ── 1. Video-level milestone deduplication ──────────────────
      // Resolve milestone key — static for viewer milestones, dynamic for play milestones
      let milestoneKey = VIDEO_MILESTONE_MAP[eventKey] || null;
      if (eventKey === 'video_plays_milestone' && payload.plays_count) {
        milestoneKey = `plays_${payload.plays_count}`;
      }
      if (milestoneKey && videoId) {
        try {
          await client.query(
            `INSERT INTO video_milestones (video_id, milestone_key) VALUES ($1, $2)`,
            [videoId, milestoneKey]
          );
        } catch (e) {
          if (e.code === '23505') {
            // UNIQUE violation — milestone already fired for this video
            await client.query('ROLLBACK');
            logger.debug(`[behavioralEvents] Skip: milestone ${milestoneKey} already fired for video ${videoId}`);
            return;
          }
          throw e;
        }
      }

      // ── 2. User-level one-time event deduplication ─────────────
      if (ONE_TIME_USER_EVENTS.has(eventKey)) {
        const { rows } = await client.query(
          `SELECT id FROM behavioral_events
           WHERE user_id = $1 AND event_key = $2
           LIMIT 1`,
          [userId, eventKey]
        );
        if (rows.length > 0) {
          await client.query('ROLLBACK');
          logger.debug(`[behavioralEvents] Skip duplicate one-time event: ${eventKey} for user ${userId}`);
          return;
        }
      }

      // ── 3. Weekly frequency cap ─────────────────────────────────
      if (WEEKLY_CAP_EVENTS.has(eventKey)) {
        const { rows } = await client.query(
          `SELECT id FROM behavioral_events
           WHERE user_id = $1
             AND event_key = $2
             AND created_at > NOW() - INTERVAL '7 days'
           LIMIT 1`,
          [userId, eventKey]
        );
        if (rows.length > 0) {
          await client.query('ROLLBACK');
          return;
        }
      }

      // ── 4. Write behavioral event ───────────────────────────────
      const { rows: [eventRow] } = await client.query(
        `INSERT INTO behavioral_events (user_id, event_key, video_id, payload)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [userId, eventKey, videoId || null, JSON.stringify(payload)]
      );

      // ── 5. Update onboarding_state ──────────────────────────────
      await _updateOnboardingState(client, userId, eventKey, payload);

      await client.query('COMMIT');
      logger.info(`[behavioralEvents] ✓ ${eventKey} | user=${userId} | event_id=${eventRow.id}`);

      // Fire contact webhook only for genuine CRM lead/conversion events.
      // Upgrade-intent clicks (pro_feature_attempted, free_limit_hit, etc.)
      // are intentionally excluded — only successful payments will be added later.
      if (CRM_WEBHOOK_EVENTS.has(eventKey)) {
        fireContactWebhook(userId, eventKey).catch(() => {});
      }

      // Onboarding stage milestones → their own dedicated per-event webhook URL.
      // Fires once (this code is only reached after the one-time dedup passes).
      if (STAGE_WEBHOOK_EVENTS.has(eventKey)) {
        fireStageWebhook(userId, eventKey).catch(() => {});
      }

    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    // Never propagate — behavioral events must not block user-facing responses
    logger.error(`[behavioralEvents] Failed to emit "${eventKey}" for user ${userId}: ${err.message}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────
// ONBOARDING STATE UPDATES
// Per-event column updates inside the same transaction as the event INSERT.
// ─────────────────────────────────────────────────────────────────────────

async function _updateOnboardingState(client, userId, eventKey, payload = {}) {
  // Ensure the row exists — safe to call on every event
  await client.query(
    `INSERT INTO onboarding_state (user_id, signed_up_at)
     VALUES ($1, NOW())
     ON CONFLICT (user_id) DO NOTHING`,
    [userId]
  );

  switch (eventKey) {

    case 'user_signed_up':
      await client.query(
        `UPDATE onboarding_state
         SET signed_up_at = NOW(),
             current_step = 'signed_up',
             updated_at   = NOW()
         WHERE user_id = $1`,
        [userId]
      );
      break;

    case 'user_logged_in':
      // First successful login. COALESCE so the timestamp is only ever set once.
      await client.query(
        `UPDATE onboarding_state
         SET first_login_at = COALESCE(first_login_at, NOW()),
             updated_at     = NOW()
         WHERE user_id = $1`,
        [userId]
      );
      break;

    case 'embed_generated':
      await client.query(
        `UPDATE onboarding_state
         SET first_embed_generated_at = COALESCE(first_embed_generated_at, NOW()),
             current_step             = 'embed_generated',
             updated_at               = NOW()
         WHERE user_id = $1`,
        [userId]
      );
      break;

    case 'tracking_activated':
      await client.query(
        `UPDATE onboarding_state
         SET first_tracking_activated_at = COALESCE(first_tracking_activated_at, NOW()),
             current_step                = 'tracking_activated',
             updated_at                  = NOW()
         WHERE user_id = $1`,
        [userId]
      );
      break;

    case 'first_video_added':
      await client.query(
        `UPDATE onboarding_state
         SET first_video_added_at        = NOW(),
             video_added                 = TRUE,
             current_step                = 'first_video_added',
             hours_signup_to_first_video =
               EXTRACT(EPOCH FROM (NOW() - COALESCE(signed_up_at, NOW()))) / 3600.0,
             updated_at                  = NOW()
         WHERE user_id = $1`,
        [userId]
      );
      break;

    case 'wow_moment_seen':
      await client.query(
        `UPDATE onboarding_state
         SET wow_moment_seen_at         = NOW(),
             wow_moment_seen            = TRUE,
             current_step               = 'wow_moment_seen',
             hours_signup_to_wow_moment =
               EXTRACT(EPOCH FROM (NOW() - COALESCE(signed_up_at, NOW()))) / 3600.0,
             updated_at                 = NOW()
         WHERE user_id = $1`,
        [userId]
      );
      break;

    case 'first_analytics_milestone':
      await client.query(
        `UPDATE onboarding_state
         SET milestone_10_viewers_at = COALESCE(milestone_10_viewers_at, NOW()),
             current_step            = 'first_analytics_milestone',
             updated_at              = NOW()
         WHERE user_id = $1`,
        [userId]
      );
      break;

    case 'twenty_viewers_milestone':
      await client.query(
        `UPDATE onboarding_state
         SET milestone_20_viewers_at = COALESCE(milestone_20_viewers_at, NOW()),
             current_step            = 'twenty_viewers_milestone',
             updated_at              = NOW()
         WHERE user_id = $1`,
        [userId]
      );
      break;

    case 'fifty_viewers_milestone':
      await client.query(
        `UPDATE onboarding_state
         SET milestone_50_viewers_at = COALESCE(milestone_50_viewers_at, NOW()),
             current_step            = 'fifty_viewers_milestone',
             updated_at              = NOW()
         WHERE user_id = $1`,
        [userId]
      );
      break;

    case 'video_plays_milestone':
      // Only stamp the 100-play milestone column; 200, 300, … are tracked in
      // behavioral_events + video_milestones only (no dedicated column needed)
      if (payload.plays_count === 100) {
        await client.query(
          `UPDATE onboarding_state
           SET milestone_100_plays_at = COALESCE(milestone_100_plays_at, NOW()),
               updated_at             = NOW()
           WHERE user_id = $1`,
          [userId]
        );
      }
      break;

    case 'upgrade_page_visited':
      await client.query(
        `UPDATE onboarding_state
         SET upgrade_page_visited_at = COALESCE(upgrade_page_visited_at, NOW()),
             updated_at              = NOW()
         WHERE user_id = $1`,
        [userId]
      );
      break;

    case 'free_limit_hit':
      await client.query(
        `UPDATE onboarding_state
         SET free_limit_hit_at = COALESCE(free_limit_hit_at, NOW()),
             free_limit_hit    = TRUE,
             limit_hit_count   = limit_hit_count + 1,
             updated_at        = NOW()
         WHERE user_id = $1`,
        [userId]
      );
      break;

    case 'pro_feature_attempted':
      await client.query(
        `UPDATE onboarding_state
         SET pro_feature_attempted_at = COALESCE(pro_feature_attempted_at, NOW()),
             pro_feature_attempted    = TRUE,
             limit_hit_count          = limit_hit_count + 1,
             updated_at               = NOW()
         WHERE user_id = $1`,
        [userId]
      );
      break;

    case 'converted_to_paid':
      await client.query(
        `UPDATE onboarding_state
         SET converted_to_paid_at    = NOW(),
             current_step            = 'converted_to_paid',
             hours_wow_to_paid       = CASE
               WHEN wow_moment_seen_at IS NOT NULL
               THEN EXTRACT(EPOCH FROM (NOW() - wow_moment_seen_at)) / 3600.0
               ELSE NULL
             END,
             hours_limit_hit_to_paid = CASE
               WHEN free_limit_hit_at IS NOT NULL
               THEN EXTRACT(EPOCH FROM (NOW() - free_limit_hit_at)) / 3600.0
               ELSE NULL
             END,
             updated_at              = NOW()
         WHERE user_id = $1`,
        [userId]
      );
      break;

    // These events have no onboarding_state columns to update:
    //   no_return_after_wow    — tracked via behavioral_events only
    //   payment_failed         — tracked via behavioral_events only
    //   password_reset_requested — transactional, not a funnel milestone
    default:
      break;
  }
}

// ─────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────

/**
 * Returns true if a video's total play count should trigger a plays milestone.
 *
 * Thresholds: 10, 20, 50, then every 100 from 100 onward (100, 200, 300, …).
 *
 * Usage (analytics event handler):
 *   if (isPlayMilestone(newTotalPlays)) {
 *     emitEvent(userId, 'video_plays_milestone', videoId, { plays_count: newTotalPlays });
 *   }
 *
 * @param  {number} count - The video's updated total_plays value
 * @returns {boolean}
 */
function isPlayMilestone(count) {
  if ([10, 20, 50].includes(count)) return true;
  if (count >= 100 && count % 100 === 0) return true;
  return false;
}

module.exports = { emitEvent, isPlayMilestone };
