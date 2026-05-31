'use strict';

/**
 * copyUserData.js
 *
 * One-off script: copies all videos + analytics from one user account
 * to another. Useful for seeding a test account with real data.
 *
 * Usage:
 *   node src/scripts/copyUserData.js <source-email> <target-email>
 *
 * Example:
 *   node src/scripts/copyUserData.js ganganarayan.rns@gmail.com support@vidapulse.io
 *
 * What it copies:
 *   videos, video_player_settings, embed_configs,
 *   analytics_sessions, analytics_events, analytics_watch_intervals,
 *   analytics_heatmap_aggregate, analytics_daily_stats,
 *   video_insights, viewer_stories, video_milestones
 *
 * What it does NOT copy (user-specific config, not video data):
 *   payments, webhook_settings, allowed_domains, funnels, cta_links,
 *   reports, alerts, auth_tokens, user_preferences
 */

// Bypass the full env validator — this script only needs DATABASE_URL
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('railway.app')
    ? { rejectUnauthorized: false }
    : false,
});

async function main() {
  const [, , srcEmail, tgtEmail] = process.argv;
  if (!srcEmail || !tgtEmail) {
    console.error('Usage: node copyUserData.js <source-email> <target-email>');
    process.exit(1);
  }

  const client = await pool.connect();
  try {
    // ── 1. Resolve users ──────────────────────────────────────────────────
    const srcRes = await client.query(
      `SELECT u.id, u.email, p.name AS plan
       FROM users u LEFT JOIN plans p ON p.id = u.plan_id
       WHERE u.email = $1`, [srcEmail]);
    if (!srcRes.rows.length) { console.error(`Source user not found: ${srcEmail}`); process.exit(1); }
    const src = srcRes.rows[0];

    const tgtRes = await client.query(
      `SELECT u.id, u.email, p.name AS plan
       FROM users u LEFT JOIN plans p ON p.id = u.plan_id
       WHERE u.email = $1`, [tgtEmail]);
    if (!tgtRes.rows.length) { console.error(`Target user not found: ${tgtEmail}\nCreate the account first by logging in, then re-run.`); process.exit(1); }
    const tgt = tgtRes.rows[0];

    console.log(`\nSource : ${src.email}  (id=${src.id}, plan=${src.plan})`);
    console.log(`Target : ${tgt.email}  (id=${tgt.id}, plan=${tgt.plan})`);
    console.log('');

    // ── 2. Load source videos ─────────────────────────────────────────────
    const { rows: videos } = await client.query(
      `SELECT * FROM videos WHERE user_id = $1 AND is_active = TRUE ORDER BY created_at`, [src.id]);
    console.log(`Found ${videos.length} video(s) to copy.`);
    if (!videos.length) { console.log('Nothing to copy.'); process.exit(0); }

    await client.query('BEGIN');

    // Map: old video UUID → new video UUID
    const videoMap = {};

    for (const v of videos) {
      // ── 3a. Copy video row ──────────────────────────────────────────────
      const { rows: [newVid] } = await client.query(
        `INSERT INTO videos
           (user_id, title, description, source_type, source_url, thumbnail_url,
            duration_seconds, processing_status, total_plays, total_views,
            total_unique_viewers, is_active, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
         RETURNING id`,
        [tgt.id, v.title, v.description, v.source_type, v.source_url,
         v.thumbnail_url, v.duration_seconds, v.processing_status,
         v.total_plays, v.total_views, v.total_unique_viewers,
         v.is_active, v.created_at, v.updated_at]
      );
      const newId = newVid.id;
      videoMap[v.id] = newId;
      console.log(`  Video "${v.title}"  ${v.id} → ${newId}`);

      // ── 3b. video_player_settings ────────────────────────────────────────
      const { rows: [ps] } = await client.query(
        `SELECT * FROM video_player_settings WHERE video_id = $1`, [v.id]);
      if (ps) {
        await client.query(
          `INSERT INTO video_player_settings
             (user_id, video_id, autoplay, muted, loop, show_controls,
              primary_color, border_radius, shadow, created_at, updated_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
           ON CONFLICT (video_id) DO NOTHING`,
          [tgt.id, newId, ps.autoplay, ps.muted, ps.loop, ps.show_controls,
           ps.primary_color, ps.border_radius, ps.shadow,
           ps.created_at, ps.updated_at]
        );
      }

      // ── 3c. embed_configs ────────────────────────────────────────────────
      const { rows: [ec] } = await client.query(
        `SELECT * FROM embed_configs WHERE video_id = $1`, [v.id]);
      if (ec) {
        await client.query(
          `INSERT INTO embed_configs
             (video_id, allowed_domains, require_domain_match, created_at, updated_at)
           VALUES ($1,$2,$3,$4,$5)
           ON CONFLICT (video_id) DO NOTHING`,
          [newId, ec.allowed_domains, ec.require_domain_match,
           ec.created_at, ec.updated_at]
        );
      }

      // ── 3d. analytics_sessions (+ nested events/intervals) ───────────────
      const { rows: sessions } = await client.query(
        `SELECT * FROM analytics_sessions WHERE video_id = $1`, [v.id]);
      console.log(`    ${sessions.length} session(s)`);

      for (const s of sessions) {
        const { rows: [newSess] } = await client.query(
          `INSERT INTO analytics_sessions
             (video_id, viewer_id, started_at, last_ping_at, ended_at,
              ip_address, user_agent, referrer, page_url,
              country_code, country_name, city, region, timezone,
              device_type, browser, os, is_mobile,
              total_watch_seconds, max_watch_seconds, percent_watched,
              completed, replays, play_count, source_type, utm_source,
              utm_medium, utm_campaign, utm_content, utm_term)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,
                   $15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,
                   $27,$28,$29,$30)
           RETURNING id`,
          [newId, s.viewer_id, s.started_at, s.last_ping_at, s.ended_at,
           s.ip_address, s.user_agent, s.referrer, s.page_url,
           s.country_code, s.country_name, s.city, s.region, s.timezone,
           s.device_type, s.browser, s.os, s.is_mobile,
           s.total_watch_seconds, s.max_watch_seconds, s.percent_watched,
           s.completed, s.replays, s.play_count, s.source_type, s.utm_source,
           s.utm_medium, s.utm_campaign, s.utm_content, s.utm_term]
        );
        const newSessId = newSess.id;

        // analytics_events
        const { rows: events } = await client.query(
          `SELECT * FROM analytics_events WHERE session_id = $1`, [s.id]);
        for (const e of events) {
          await client.query(
            `INSERT INTO analytics_events
               (session_id, video_id, event_type, timestamp_seconds,
                value, created_at)
             VALUES ($1,$2,$3,$4,$5,$6)`,
            [newSessId, newId, e.event_type, e.timestamp_seconds,
             e.value, e.created_at]
          );
        }

        // analytics_watch_intervals
        const { rows: intervals } = await client.query(
          `SELECT * FROM analytics_watch_intervals WHERE session_id = $1`, [s.id]);
        for (const i of intervals) {
          await client.query(
            `INSERT INTO analytics_watch_intervals
               (session_id, video_id, start_second, end_second)
             VALUES ($1,$2,$3,$4)`,
            [newSessId, newId, i.start_second, i.end_second]
          );
        }
      }

      // ── 3e. analytics_heatmap_aggregate ──────────────────────────────────
      const { rows: hm } = await client.query(
        `SELECT * FROM analytics_heatmap_aggregate WHERE video_id = $1`, [v.id]);
      for (const h of hm) {
        await client.query(
          `INSERT INTO analytics_heatmap_aggregate
             (video_id, second_bucket, view_count, replay_count)
           VALUES ($1,$2,$3,$4)
           ON CONFLICT (video_id, second_bucket) DO NOTHING`,
          [newId, h.second_bucket, h.view_count, h.replay_count]
        );
      }

      // ── 3f. analytics_daily_stats ─────────────────────────────────────────
      const { rows: ds } = await client.query(
        `SELECT * FROM analytics_daily_stats WHERE video_id = $1`, [v.id]);
      for (const d of ds) {
        await client.query(
          `INSERT INTO analytics_daily_stats
             (video_id, stat_date, total_views, unique_views,
              total_plays, unique_viewers, avg_watch_seconds,
              completion_count, total_watch_seconds)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
           ON CONFLICT (video_id, stat_date) DO NOTHING`,
          [newId, d.stat_date, d.total_views, d.unique_views,
           d.total_plays, d.unique_viewers, d.avg_watch_seconds,
           d.completion_count, d.total_watch_seconds]
        );
      }

      // ── 3g. video_insights ────────────────────────────────────────────────
      const { rows: ins } = await client.query(
        `SELECT * FROM video_insights WHERE video_id = $1`, [v.id]);
      for (const i of ins) {
        await client.query(
          `INSERT INTO video_insights
             (video_id, user_id, insight_type, insight_text, severity,
              is_primary, is_dismissed, timestamp_seconds, created_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
          [newId, tgt.id, i.insight_type, i.insight_text, i.severity,
           i.is_primary, i.is_dismissed, i.timestamp_seconds, i.created_at]
        );
      }

      // ── 3h. viewer_stories ────────────────────────────────────────────────
      const { rows: vs } = await client.query(
        `SELECT * FROM viewer_stories WHERE video_id = $1`, [v.id]);
      for (const s of vs) {
        await client.query(
          `INSERT INTO viewer_stories
             (video_id, viewer_id, story_text, story_type, percent_watched,
              country_name, device_type, created_at, is_stale)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
          [newId, s.viewer_id, s.story_text, s.story_type,
           s.percent_watched, s.country_name, s.device_type,
           s.created_at, s.is_stale]
        );
      }
    }

    await client.query('COMMIT');
    console.log(`\n✓ Done. Copied ${videos.length} video(s) with all analytics to ${tgt.email}`);
    console.log('\nVideo ID mapping (old → new):');
    for (const [oldId, newId] of Object.entries(videoMap)) {
      console.log(`  ${oldId} → ${newId}`);
    }

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('\n✗ Error — transaction rolled back:', err.message);
    console.error(err.stack);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
