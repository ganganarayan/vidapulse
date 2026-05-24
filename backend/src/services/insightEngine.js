'use strict';

/**
 * Insight Engine — Step 3
 *
 * Runs as a background job after analytics data accumulates.
 * Called by: video analytics ingestion (after play events), scheduled jobs.
 *
 * For each video it:
 *   1. Fetches all analytics data relevant to the user's plan
 *   2. Runs applicable insight rules (plan-gated)
 *   3. Upserts results into video_insights
 *   4. Selects one insight as is_primary (the wow moment card)
 *   5. Creates in_app_notifications rows for each new insight
 *   6. Emits wow_moment_seen (one-time) if this is the user's first insight
 *   7. Updates videos.insight_status + insight_generated_at
 *
 * ── Plan gating ──────────────────────────────────────────────────────────
 *   Free    : low_play_rate, high_play_rate, top_domain_source
 *   Starter : + completion_champion, low_completion, mobile_majority,
 *               mobile_drop, geographic_concentration
 *   Pro     : + drop_off_moment, engagement_spike, dead_zone,
 *               returning_viewers, utm_top_source, funnel_drop,
 *               cta_performance
 *
 * ── Minimum data threshold ───────────────────────────────────────────────
 *   Rules only fire when there is enough data to be meaningful.
 *   Each rule declares its own MIN_SESSIONS constant.
 *   If no rule fires (not enough data), the video stays insight_status='pending'
 *   and the engine retries on the next invocation.
 *
 * ── Idempotency ──────────────────────────────────────────────────────────
 *   Uses ON CONFLICT on the functional unique index:
 *     (video_id, insight_type, COALESCE(timestamp_seconds, -1))
 *   Re-running the engine updates existing rows rather than duplicating them.
 *   in_app_notifications are only written for truly NEW insights (not updates).
 *
 * ── Never throws ─────────────────────────────────────────────────────────
 *   All errors are logged. The engine never crashes the calling context.
 */

const { pool }                = require('../config/database');
const logger                  = require('../config/logger');
const { emitEvent }           = require('./behavioralEventService');
const env                     = require('../config/env');

// ── Minimum session counts before a rule fires ────────────────────────────
const MIN_SESSIONS_BASIC     = 5;   // play_rate, domain
const MIN_SESSIONS_HEATMAP   = 10;  // drop_off, dead_zone, engagement_spike
const MIN_SESSIONS_SEGMENT   = 8;   // mobile, geo (need split to be meaningful)
const MIN_SESSIONS_VIEWER    = 10;  // returning_viewers
const MIN_SESSIONS_UTM       = 8;   // utm_top_source
const MIN_SESSIONS_FUNNEL    = 10;  // funnel_drop, cta_performance

// ── Features that belong to each plan tier ───────────────────────────────
const PLAN_FEATURES = {
  free   : new Set(['total_plays','play_rate','unique_visitors','domain_tracking','embed_code']),
  starter: new Set(['total_plays','play_rate','unique_visitors','domain_tracking','embed_code',
                    'geography','device_breakdown','avg_time_watched']),
  pro    : new Set(['total_plays','play_rate','unique_visitors','domain_tracking','embed_code',
                    'geography','device_breakdown','avg_time_watched',
                    'heatmap','viewer_level','audience_segmentation',
                    'conversion_tracking','events','reports','alerts']),
  admin_lifetime: new Set(['total_plays','play_rate','unique_visitors','domain_tracking',
                            'embed_code','geography','device_breakdown','avg_time_watched',
                            'heatmap','viewer_level','audience_segmentation',
                            'conversion_tracking','events','reports','alerts']),
};

// ── Priority order for is_primary selection, per plan ────────────────────
// First rule in the list that FIRES wins is_primary = TRUE.
const PRIMARY_PRIORITY = {
  free: [
    'low_play_rate', 'high_play_rate', 'top_domain_source',
  ],
  starter: [
    'mobile_drop', 'geographic_concentration', 'low_completion',
    'completion_champion', 'mobile_majority',
    'low_play_rate', 'high_play_rate', 'top_domain_source',
  ],
  pro: [
    'drop_off_moment', 'engagement_spike', 'dead_zone',
    'returning_viewers', 'funnel_drop', 'cta_performance', 'utm_top_source',
    'mobile_drop', 'geographic_concentration', 'low_completion',
    'completion_champion', 'mobile_majority',
    'low_play_rate', 'high_play_rate', 'top_domain_source',
  ],
  admin_lifetime: [
    'drop_off_moment', 'engagement_spike', 'dead_zone',
    'returning_viewers', 'funnel_drop', 'cta_performance', 'utm_top_source',
    'mobile_drop', 'geographic_concentration', 'low_completion',
    'completion_champion', 'mobile_majority',
    'low_play_rate', 'high_play_rate', 'top_domain_source',
  ],
};

// ── Template key mapping: insight_type → template_key ────────────────────
const TEMPLATE_KEY_MAP = {
  low_play_rate            : 'play_rate_low',
  high_play_rate           : 'play_rate_high',
  top_domain_source        : 'play_rate_high',  // closest available template
  completion_champion      : 'completion_champion',
  low_completion           : 'play_rate_low',   // same "not performing" theme
  mobile_majority          : 'mobile_gap',
  mobile_drop              : 'mobile_gap',
  geographic_concentration : 'geography_surprise',
  drop_off_moment          : 'drop_off_moment',
  engagement_spike         : 'engagement_spike',
  dead_zone                : 'dead_zone',
  returning_viewers        : 'returning_viewers',
  utm_top_source           : 'play_rate_high',  // closest "source discovery" template
  funnel_drop              : 'dead_zone',        // closest "drop" template
  cta_performance          : 'completion_champion',
};

// ─────────────────────────────────────────────────────────────────────────
// PUBLIC API
// ─────────────────────────────────────────────────────────────────────────

/**
 * Run the insight engine for a single video.
 *
 * @param {string} videoId - UUID of the video to analyse
 * @returns {Promise<{ insightsGenerated: number, primaryInsight: string|null }>}
 */
async function runForVideo(videoId) {
  try {
    // ── 0. Load video + user + plan ───────────────────────────────────
    const { rows: [videoRow] } = await pool.query(
      `SELECT v.id, v.user_id, v.title, v.duration_seconds,
              v.total_plays, v.unique_viewers, v.avg_watch_pct,
              u.wow_moment_seen,
              p.name AS plan_name
       FROM   videos v
       JOIN   users  u ON u.id = v.user_id
       JOIN   plans  p ON p.id = u.plan_id
       WHERE  v.id = $1 AND v.is_active = TRUE`,
      [videoId]
    );

    if (!videoRow) {
      logger.warn(`[insightEngine] Video ${videoId} not found or inactive`);
      return { insightsGenerated: 0, primaryInsight: null };
    }

    const planFeatures  = PLAN_FEATURES[videoRow.plan_name] || PLAN_FEATURES.free;
    const priorityList  = PRIMARY_PRIORITY[videoRow.plan_name] || PRIMARY_PRIORITY.free;
    const userId        = videoRow.user_id;

    // Mark video as generating
    await pool.query(
      `UPDATE videos SET insight_status = 'generating', updated_at = NOW() WHERE id = $1`,
      [videoId]
    );

    // ── 1. Run all applicable rules ───────────────────────────────────
    const fired = [];   // array of insight objects that passed their threshold

    // FREE RULES ─────────────────────────────────────────────────────
    if (planFeatures.has('play_rate')) {
      const r = await _rulePlayRate(videoId, videoRow);
      if (r) fired.push(r);
    }

    if (planFeatures.has('domain_tracking')) {
      const r = await _ruleTopDomainSource(videoId, videoRow);
      if (r) fired.push(r);
    }

    // STARTER RULES ──────────────────────────────────────────────────
    if (planFeatures.has('avg_time_watched')) {
      const r = await _ruleCompletion(videoId, videoRow);
      if (r) fired.push(r);
    }

    if (planFeatures.has('device_breakdown')) {
      const mobile = await _ruleMobile(videoId, videoRow);
      if (mobile) fired.push(mobile);
    }

    if (planFeatures.has('geography')) {
      const r = await _ruleGeography(videoId, videoRow);
      if (r) fired.push(r);
    }

    // PRO RULES ──────────────────────────────────────────────────────
    if (planFeatures.has('heatmap')) {
      const heatmap = await _ruleHeatmap(videoId, videoRow);
      fired.push(...heatmap);  // may yield drop_off_moment, engagement_spike, dead_zone
    }

    if (planFeatures.has('viewer_level')) {
      const r = await _ruleReturningViewers(videoId, videoRow);
      if (r) fired.push(r);
    }

    if (planFeatures.has('audience_segmentation')) {
      const r = await _ruleUtmTopSource(videoId, videoRow);
      if (r) fired.push(r);
    }

    if (planFeatures.has('conversion_tracking')) {
      const funnel = await _ruleFunnelAndCta(videoId, videoRow);
      fired.push(...funnel);
    }

    if (fired.length === 0) {
      await pool.query(
        `UPDATE videos SET insight_status = 'pending', updated_at = NOW() WHERE id = $1`,
        [videoId]
      );
      logger.debug(`[insightEngine] No rules fired for video ${videoId} — not enough data yet`);
      return { insightsGenerated: 0, primaryInsight: null };
    }

    // ── 2. Determine which insight is primary ─────────────────────────
    const firedTypes   = new Set(fired.map(r => r.insight_type));
    const primaryType  = priorityList.find(t => firedTypes.has(t)) || fired[0].insight_type;

    // ── 3. Upsert all insights into video_insights ────────────────────
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const newInsightTypes = [];  // track which are genuinely new (for notifications)

      for (const insight of fired) {
        const isPrimary = insight.insight_type === primaryType;

        // Check if this insight already exists (for notification dedup)
        const existsCheck = await client.query(
          `SELECT id FROM video_insights
           WHERE video_id = $1
             AND insight_type = $2
             AND COALESCE(timestamp_seconds, -1) = COALESCE($3, -1)
           LIMIT 1`,
          [videoId, insight.insight_type, insight.timestamp_seconds ?? null]
        );
        const isNew = existsCheck.rows.length === 0;

        await client.query(
          `INSERT INTO video_insights
             (video_id, user_id, insight_type, severity, timestamp_seconds,
              headline, body, action_prompt, metric_value, metric_label,
              is_primary, data_snapshot)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
           ON CONFLICT (video_id, insight_type, (COALESCE(timestamp_seconds, -1)))
           DO UPDATE SET
             severity      = EXCLUDED.severity,
             headline      = EXCLUDED.headline,
             body          = EXCLUDED.body,
             action_prompt = EXCLUDED.action_prompt,
             metric_value  = EXCLUDED.metric_value,
             metric_label  = EXCLUDED.metric_label,
             is_primary    = EXCLUDED.is_primary,
             data_snapshot = EXCLUDED.data_snapshot,
             generated_at  = NOW()`,
          [
            videoId,
            userId,
            insight.insight_type,
            insight.severity,
            insight.timestamp_seconds ?? null,
            insight.headline,
            insight.body,
            insight.action_prompt,
            insight.metric_value ?? null,
            insight.metric_label ?? null,
            isPrimary,
            JSON.stringify(insight.data_snapshot),
          ]
        );

        if (isNew) newInsightTypes.push(insight);
      }

      // Reset is_primary on all other rows for this video (only one can be primary)
      await client.query(
        `UPDATE video_insights
         SET is_primary = FALSE
         WHERE video_id = $1 AND insight_type != $2`,
        [videoId, primaryType]
      );

      // ── 4. Write in_app_notifications for new insights ─────────────
      for (const insight of newInsightTypes) {
        const dashboardUrl = `${env.APP_URL}/dashboard/videos/${videoId}/analytics`;
        const templateKey  = TEMPLATE_KEY_MAP[insight.insight_type] || 'multiple_insights';
        const { t1, t2 }   = _teaserVars(insight.insight_type);

        await client.query(
          `INSERT INTO in_app_notifications
             (user_id, video_id, insight_type, template_key, headline, dashboard_url,
              teaser_variable_1, teaser_variable_2)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
          [
            userId,
            videoId,
            insight.insight_type,
            templateKey,
            insight.headline,
            dashboardUrl,
            t1,
            t2,
          ]
        );
      }

      // ── 5. Cache primary drop-off on videos table (heatmap fast-read) ──
      const primaryInsight = fired.find(r => r.insight_type === primaryType);
      if (primaryInsight?.insight_type === 'drop_off_moment' && primaryInsight.timestamp_seconds != null) {
        await client.query(
          `UPDATE videos
           SET primary_drop_off_second = $1,
               primary_drop_off_pct    = $2,
               updated_at              = NOW()
           WHERE id = $3`,
          [primaryInsight.timestamp_seconds, primaryInsight.metric_value, videoId]
        );
      }

      // ── 6. Mark video complete ──────────────────────────────────────
      await client.query(
        `UPDATE videos
         SET insight_status       = 'complete',
             insight_generated_at = NOW(),
             updated_at           = NOW()
         WHERE id = $1`,
        [videoId]
      );

      await client.query('COMMIT');
      logger.info(`[insightEngine] ✓ ${fired.length} insights for video ${videoId} | primary=${primaryType} | new=${newInsightTypes.length}`);

    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    // ── 7. Emit wow_moment_seen (one-time, non-blocking) ─────────────
    // Fires the first time this user gets ANY insight on ANY video.
    if (!videoRow.wow_moment_seen && fired.length > 0) {
      emitEvent(userId, 'wow_moment_seen', videoId, {
        insight_type : primaryType,
        headline     : fired.find(r => r.insight_type === primaryType)?.headline,
        plan         : videoRow.plan_name,
      });
      // Mark wow_moment_seen on users table immediately (don't wait for event)
      pool.query(
        `UPDATE users SET wow_moment_seen = TRUE, updated_at = NOW() WHERE id = $1`,
        [userId]
      ).catch(e => logger.error(`[insightEngine] Failed to set wow_moment_seen: ${e.message}`));
    }

    return { insightsGenerated: fired.length, primaryInsight: primaryType };

  } catch (err) {
    // Never propagate — engine must not crash analytics ingestion
    logger.error(`[insightEngine] Failed for video ${videoId}: ${err.message}`);
    pool.query(
      `UPDATE videos SET insight_status = 'failed', updated_at = NOW() WHERE id = $1`,
      [videoId]
    ).catch(() => {});
    return { insightsGenerated: 0, primaryInsight: null };
  }
}

// ─────────────────────────────────────────────────────────────────────────
// INSIGHT RULES
// Each rule returns an insight object, or null if the threshold isn't met.
// Heatmap rules return an array (may yield multiple insights).
// ─────────────────────────────────────────────────────────────────────────

// ── FREE ─────────────────────────────────────────────────────────────────

/**
 * low_play_rate / high_play_rate
 * Source: analytics_daily_stats (play_rate), analytics_sessions count
 */
async function _rulePlayRate(videoId, video) {
  const { rows } = await pool.query(
    `SELECT COUNT(*)::int                                       AS session_count,
            AVG(play_rate)                                      AS avg_play_rate
     FROM   analytics_daily_stats
     WHERE  video_id = $1
       AND  total_plays > 0`,
    [videoId]
  );
  const row = rows[0];
  if (!row || row.session_count < MIN_SESSIONS_BASIC) return null;

  const rate = parseFloat(row.avg_play_rate) || 0;

  if (rate < 30) {
    return {
      insight_type    : 'low_play_rate',
      severity        : rate < 15 ? 'critical' : 'warning',
      timestamp_seconds: null,
      headline        : 'Most visitors are not pressing play',
      body            : 'Your video is loading but a large share of visitors leave without watching. This usually means the thumbnail, title, or page context isn\'t compelling enough to start the video.',
      action_prompt   : 'Try changing your thumbnail or adding a stronger hook text above the video.',
      metric_value    : Math.round(rate),
      metric_label    : '% play rate',
      data_snapshot   : { play_rate: rate, session_count: row.session_count },
    };
  }

  if (rate > 70) {
    return {
      insight_type    : 'high_play_rate',
      severity        : 'info',
      timestamp_seconds: null,
      headline        : 'Strong play rate — your visitors want to watch',
      body            : 'More than 70% of visitors who land on your video press play. This suggests your thumbnail, title, or surrounding content is doing a strong job of compelling people to watch.',
      action_prompt   : 'Keep this context consistent across your other videos to replicate the result.',
      metric_value    : Math.round(rate),
      metric_label    : '% play rate',
      data_snapshot   : { play_rate: rate, session_count: row.session_count },
    };
  }

  return null;  // 30–70% is healthy baseline, no insight needed
}

/**
 * top_domain_source
 * Source: analytics_sessions.domain
 */
async function _ruleTopDomainSource(videoId, video) {
  const { rows } = await pool.query(
    `SELECT domain,
            COUNT(*) AS play_count,
            SUM(COUNT(*)) OVER () AS total_plays
     FROM   analytics_sessions
     WHERE  video_id = $1
       AND  domain IS NOT NULL
       AND  domain != ''
     GROUP  BY domain
     ORDER  BY play_count DESC
     LIMIT  1`,
    [videoId]
  );
  if (!rows.length || rows[0].total_plays < MIN_SESSIONS_BASIC) return null;

  const top  = rows[0];
  const pct  = Math.round((top.play_count / top.total_plays) * 100);
  if (pct < 50) return null;  // not dominant enough

  return {
    insight_type    : 'top_domain_source',
    severity        : 'info',
    timestamp_seconds: null,
    headline        : `${pct}% of plays come from one source`,
    body            : `The majority of your video plays are coming from a single domain. This means your audience discovery is concentrated — great for understanding your core traffic, but consider diversifying distribution for resilience.`,
    action_prompt   : 'Embed this video on additional pages or share it in other channels to broaden your reach.',
    metric_value    : pct,
    metric_label    : '% plays from top domain',
    data_snapshot   : { domain: top.domain, pct, total_plays: top.total_plays },
  };
}

// ── STARTER ──────────────────────────────────────────────────────────────

/**
 * completion_champion / low_completion
 * Source: analytics_sessions.avg_watch_pct
 */
async function _ruleCompletion(videoId, video) {
  const { rows } = await pool.query(
    `SELECT COUNT(*)::int  AS session_count,
            AVG(avg_watch_pct) AS avg_pct
     FROM   analytics_sessions
     WHERE  video_id = $1`,
    [videoId]
  );
  const row = rows[0];
  if (!row || row.session_count < MIN_SESSIONS_BASIC) return null;

  const pct = parseFloat(row.avg_pct) || 0;

  if (pct > 60) {
    return {
      insight_type    : 'completion_champion',
      severity        : 'info',
      timestamp_seconds: null,
      headline        : 'Viewers are watching most of your video',
      body            : 'Your average viewer watches past the halfway point — this is a strong signal that your content holds attention throughout. Most videos struggle to retain viewers past the first third.',
      action_prompt   : 'This video is performing well. Consider making similar content or embedding it more prominently.',
      metric_value    : Math.round(pct),
      metric_label    : '% average completion',
      data_snapshot   : { avg_pct: pct, session_count: row.session_count },
    };
  }

  if (pct < 30) {
    return {
      insight_type    : 'low_completion',
      severity        : pct < 15 ? 'critical' : 'warning',
      timestamp_seconds: null,
      headline        : 'Most viewers leave before the halfway point',
      body            : 'Your average viewer watches less than 30% of the video. This suggests the opening isn\'t delivering on the promise of the title or thumbnail, or the pacing is too slow to hold attention.',
      action_prompt   : 'Review the first 60 seconds of your video. A stronger opening hook typically lifts overall completion rates significantly.',
      metric_value    : Math.round(pct),
      metric_label    : '% average completion',
      data_snapshot   : { avg_pct: pct, session_count: row.session_count },
    };
  }

  return null;
}

/**
 * mobile_majority / mobile_drop
 * Source: analytics_sessions.device_type, avg_watch_pct
 */
async function _ruleMobile(videoId, video) {
  const { rows } = await pool.query(
    `SELECT device_type,
            COUNT(*)::int      AS session_count,
            AVG(avg_watch_pct) AS avg_pct
     FROM   analytics_sessions
     WHERE  video_id = $1
     GROUP  BY device_type`,
    [videoId]
  );
  if (!rows.length) return null;

  const total    = rows.reduce((s, r) => s + r.session_count, 0);
  if (total < MIN_SESSIONS_SEGMENT) return null;

  const mobile   = rows.find(r => r.device_type === 'mobile');
  const desktop  = rows.find(r => r.device_type === 'desktop');

  const mobilePct = mobile ? Math.round((mobile.session_count / total) * 100) : 0;

  // Mobile drop gap check (higher priority)
  if (mobile && desktop) {
    const mobileAvg  = parseFloat(mobile.avg_pct)  || 0;
    const desktopAvg = parseFloat(desktop.avg_pct) || 0;
    const gap        = desktopAvg - mobileAvg;

    if (gap >= 20 && mobile.session_count >= 3) {
      return {
        insight_type    : 'mobile_drop',
        severity        : gap >= 35 ? 'warning' : 'opportunity',
        timestamp_seconds: null,
        headline        : 'Mobile viewers leave significantly earlier than desktop',
        body            : 'There is a meaningful gap in completion rate between mobile and desktop viewers. This often means the player experience on smaller screens, slow mobile connections, or vertical viewing context is causing early drop-off.',
        action_prompt   : 'Check how your video looks and loads on a mobile device. Consider shortening the video or adding mobile-specific captions.',
        metric_value    : Math.round(gap),
        metric_label    : '% completion gap (desktop vs mobile)',
        data_snapshot   : { mobile_avg_pct: mobileAvg, desktop_avg_pct: desktopAvg, gap, mobile_pct: mobilePct },
      };
    }
  }

  // Mobile majority check (lower priority)
  if (mobilePct > 60) {
    return {
      insight_type    : 'mobile_majority',
      severity        : 'info',
      timestamp_seconds: null,
      headline        : 'Most of your viewers watch on mobile',
      body            : `${mobilePct}% of sessions come from mobile devices. This means your player settings, thumbnail design, and video format should be optimised for portrait and small-screen viewing.`,
      action_prompt   : 'Ensure your player is set to autoplay muted on mobile, and that your thumbnail text is legible at small sizes.',
      metric_value    : mobilePct,
      metric_label    : '% mobile sessions',
      data_snapshot   : { mobile_pct: mobilePct, total_sessions: total },
    };
  }

  return null;
}

/**
 * geographic_concentration
 * Source: analytics_sessions.country_code, country_name
 */
async function _ruleGeography(videoId, video) {
  const { rows } = await pool.query(
    `SELECT country_name,
            COUNT(*)::int AS session_count,
            SUM(COUNT(*)) OVER () AS total
     FROM   analytics_sessions
     WHERE  video_id = $1
       AND  country_code IS NOT NULL
     GROUP  BY country_name
     ORDER  BY session_count DESC
     LIMIT  1`,
    [videoId]
  );
  if (!rows.length || rows[0].total < MIN_SESSIONS_SEGMENT) return null;

  const top = rows[0];
  const pct = Math.round((top.session_count / top.total) * 100);
  if (pct < 70) return null;

  return {
    insight_type    : 'geographic_concentration',
    severity        : 'info',
    timestamp_seconds: null,
    headline        : `${pct}% of your audience is from one country`,
    body            : `The vast majority of your viewers are watching from ${top.country_name}. This tells you a lot about your distribution channels and the language and cultural context of your audience.`,
    action_prompt   : 'If you want to expand internationally, consider adding subtitles or distributing through channels popular in other regions.',
    metric_value    : pct,
    metric_label    : `% viewers from ${top.country_name}`,
    data_snapshot   : { country: top.country_name, pct, total: top.total },
  };
}

// ── PRO ───────────────────────────────────────────────────────────────────

/**
 * drop_off_moment / engagement_spike / dead_zone
 * Source: analytics_heatmap_aggregate
 * Returns an array — may yield 1, 2, or 3 insights.
 */
async function _ruleHeatmap(videoId, video) {
  const results = [];

  const { rows: buckets } = await pool.query(
    `SELECT second_bucket,
            first_watches + replays AS total_views,
            first_watches,
            replays
     FROM   analytics_heatmap_aggregate
     WHERE  video_id = $1
     ORDER  BY second_bucket ASC`,
    [videoId]
  );
  if (buckets.length < MIN_SESSIONS_HEATMAP) return results;

  const peakViews = Math.max(...buckets.map(b => b.first_watches));
  if (peakViews < MIN_SESSIONS_HEATMAP) return results;

  // ── drop_off_moment: the second with the steepest sustained viewer loss ──
  // Look for the 5-second window with the largest drop from peak
  let maxDrop = 0;
  let dropSecond = null;

  for (let i = 1; i < buckets.length; i++) {
    const before = buckets[i - 1].first_watches;
    const after  = buckets[i].first_watches;
    if (before > 0 && after < before) {
      const dropPct = ((before - after) / peakViews) * 100;
      if (dropPct > maxDrop) {
        maxDrop = dropPct;
        dropSecond = buckets[i].second_bucket;
      }
    }
  }

  if (dropSecond !== null && maxDrop >= 15) {
    const viewsAtDrop = buckets.find(b => b.second_bucket === dropSecond)?.first_watches || 0;
    const retentionPct = Math.round((viewsAtDrop / peakViews) * 100);

    results.push({
      insight_type    : 'drop_off_moment',
      severity        : maxDrop >= 40 ? 'critical' : 'warning',
      timestamp_seconds: dropSecond,
      headline        : `${100 - retentionPct}% of viewers leave around the ${_formatSeconds(dropSecond)} mark`,
      body            : 'This is the moment in your video where you lose the most viewers in a short window. Something at this point — a transition, a topic shift, pacing, or a technical issue — is causing people to stop watching.',
      action_prompt   : 'Watch your video from 30 seconds before this point. Look for a slow section, an awkward cut, or a moment where the value delivery stalls.',
      metric_value    : Math.round(maxDrop),
      metric_label    : '% viewers lost at this moment',
      data_snapshot   : { second: dropSecond, drop_pct: maxDrop, retention_pct: retentionPct, peak_views: peakViews },
    });
  }

  // ── engagement_spike: second with unusually high replay count ──────────
  const avgReplays = buckets.reduce((s, b) => s + b.replays, 0) / buckets.length;
  let maxSpike = 0;
  let spikeSecond = null;

  for (const bucket of buckets) {
    if (bucket.replays > avgReplays * 3 && bucket.replays > maxSpike) {
      maxSpike    = bucket.replays;
      spikeSecond = bucket.second_bucket;
    }
  }

  if (spikeSecond !== null) {
    results.push({
      insight_type    : 'engagement_spike',
      severity        : 'opportunity',
      timestamp_seconds: spikeSecond,
      headline        : `Viewers rewatch the ${_formatSeconds(spikeSecond)} mark more than anywhere else`,
      body            : 'A disproportionate number of viewers rewind and rewatch this specific moment. This usually means a key piece of information, a compelling claim, or an emotionally resonant moment is here.',
      action_prompt   : 'Identify what makes this moment special. Consider adding a call-to-action or chapter marker here to capitalise on the attention.',
      metric_value    : maxSpike,
      metric_label    : 'replays at this second',
      data_snapshot   : { second: spikeSecond, replays: maxSpike, avg_replays: avgReplays },
    });
  }

  // ── dead_zone: consecutive 30-second window with <10% of peak viewers ───
  const threshold = peakViews * 0.1;
  let deadStart = null;
  let deadEnd   = null;
  let longestDead = 0;
  let longestStart = null;
  let longestEnd   = null;
  let currentRun = 0;

  for (const bucket of buckets) {
    if (bucket.first_watches < threshold) {
      if (deadStart === null) deadStart = bucket.second_bucket;
      deadEnd = bucket.second_bucket;
      currentRun++;
      if (currentRun > longestDead) {
        longestDead  = currentRun;
        longestStart = deadStart;
        longestEnd   = deadEnd;
      }
    } else {
      deadStart  = null;
      deadEnd    = null;
      currentRun = 0;
    }
  }

  if (longestDead >= 30 && longestStart !== null) {
    results.push({
      insight_type    : 'dead_zone',
      severity        : 'opportunity',
      timestamp_seconds: longestStart,
      headline        : `Almost nobody watches the ${_formatSeconds(longestStart)}–${_formatSeconds(longestEnd)} section`,
      body            : 'There is a section of your video that viewers consistently skip or abandon. This dead zone suggests the content here is not delivering value — it may be repetitive, slow, or off-topic.',
      action_prompt   : 'Consider cutting this section entirely or moving its most valuable content earlier in the video.',
      metric_value    : longestEnd - longestStart,
      metric_label    : 'seconds of dead zone',
      data_snapshot   : { start: longestStart, end: longestEnd, duration: longestEnd - longestStart, threshold_pct: 10 },
    });
  }

  return results;
}

/**
 * returning_viewers
 * Source: analytics_sessions, viewers
 */
async function _ruleReturningViewers(videoId, video) {
  const { rows } = await pool.query(
    `SELECT COUNT(DISTINCT viewer_id)::int                  AS unique_viewers,
            COUNT(*)::int                                   AS total_sessions,
            COUNT(*) FILTER (WHERE play_count > 1)::int     AS repeat_sessions
     FROM   analytics_sessions
     WHERE  video_id = $1`,
    [videoId]
  );
  const row = rows[0];
  if (!row || row.total_sessions < MIN_SESSIONS_VIEWER) return null;

  const repeatPct = Math.round((row.repeat_sessions / row.total_sessions) * 100);
  if (repeatPct < 20) return null;

  return {
    insight_type    : 'returning_viewers',
    severity        : 'info',
    timestamp_seconds: null,
    headline        : `${repeatPct}% of sessions are from viewers who came back`,
    body            : 'A significant share of your sessions come from people who have watched this video before. Returning viewers are a strong signal of content quality and relevance — they chose to watch again.',
    action_prompt   : 'Consider creating a follow-up video for this audience. Returning viewers are your most engaged segment.',
    metric_value    : repeatPct,
    metric_label    : '% returning viewer sessions',
    data_snapshot   : { repeat_pct: repeatPct, repeat_sessions: row.repeat_sessions, total_sessions: row.total_sessions },
  };
}

/**
 * utm_top_source
 * Source: analytics_sessions.utm_source
 */
async function _ruleUtmTopSource(videoId, video) {
  const { rows } = await pool.query(
    `SELECT utm_source,
            COUNT(*)::int AS session_count,
            SUM(COUNT(*)) OVER () AS total
     FROM   analytics_sessions
     WHERE  video_id = $1
       AND  utm_source IS NOT NULL
       AND  utm_source != ''
     GROUP  BY utm_source
     ORDER  BY session_count DESC
     LIMIT  1`,
    [videoId]
  );
  if (!rows.length || rows[0].total < MIN_SESSIONS_UTM) return null;

  const top = rows[0];
  const pct = Math.round((top.session_count / top.total) * 100);
  if (pct < 50) return null;

  return {
    insight_type    : 'utm_top_source',
    severity        : 'info',
    timestamp_seconds: null,
    headline        : `One traffic source drives the majority of plays`,
    body            : `A single distribution channel is responsible for more than half of your tracked plays. This is useful for attribution — you know what's working — but also means you have concentration risk if that channel changes.`,
    action_prompt   : 'Invest in at least one additional distribution channel to reduce dependency on a single source.',
    metric_value    : pct,
    metric_label    : '% plays from top UTM source',
    data_snapshot   : { utm_source: top.utm_source, pct, total: top.total },
  };
}

/**
 * funnel_drop / cta_performance
 * Source: funnel_steps, conversion_events, cta_overlays
 * Returns an array.
 */
async function _ruleFunnelAndCta(videoId, video) {
  const results = [];

  // Funnel drop: biggest inter-step drop > 60%
  const { rows: funnelRows } = await pool.query(
    `SELECT fs.id AS step_id,
            fs.name AS step_name,
            fs.position,
            COUNT(DISTINCT ce.viewer_id)::int AS conversions
     FROM   funnels       f
     JOIN   funnel_steps  fs ON fs.funnel_id = f.id
     LEFT   JOIN conversion_events ce ON ce.step_id = fs.id
     WHERE  f.video_id = $1
       AND  f.is_active = TRUE
     GROUP  BY fs.id, fs.name, fs.position
     ORDER  BY fs.position ASC`,
    [videoId]
  );

  if (funnelRows.length >= 2) {
    let maxDrop = 0;
    let dropStep = null;

    for (let i = 1; i < funnelRows.length; i++) {
      const before = funnelRows[i - 1].conversions;
      const after  = funnelRows[i].conversions;
      if (before > MIN_SESSIONS_FUNNEL && after < before) {
        const dropPct = ((before - after) / before) * 100;
        if (dropPct > maxDrop) {
          maxDrop  = dropPct;
          dropStep = funnelRows[i].step_name;
        }
      }
    }

    if (maxDrop >= 60 && dropStep) {
      results.push({
        insight_type    : 'funnel_drop',
        severity        : maxDrop >= 80 ? 'critical' : 'warning',
        timestamp_seconds: null,
        headline        : 'Most viewers who reach your call-to-action don\'t act on it',
        body            : `There is a large drop-off at a key funnel step. This means viewers are engaged enough to reach this point but something about the offer, timing, or presentation is preventing conversion.`,
        action_prompt   : 'Try moving this step earlier in the video, or simplifying the action required. A lower-commitment CTA at this point may convert better.',
        metric_value    : Math.round(maxDrop),
        metric_label    : '% drop at funnel step',
        data_snapshot   : { step: dropStep, drop_pct: maxDrop },
      });
    }
  }

  // CTA performance
  const { rows: ctaRows } = await pool.query(
    `SELECT SUM(click_count)::int AS total_clicks,
            COUNT(DISTINCT s.id)::int AS total_sessions
     FROM   cta_overlays c
     JOIN   analytics_sessions s ON s.video_id = c.video_id
     WHERE  c.video_id = $1
       AND  c.is_active = TRUE`,
    [videoId]
  );
  const cta = ctaRows[0];
  if (cta && cta.total_sessions >= MIN_SESSIONS_FUNNEL) {
    const ctaRate = Math.round((cta.total_clicks / cta.total_sessions) * 100);
    results.push({
      insight_type    : 'cta_performance',
      severity        : ctaRate >= 10 ? 'info' : 'opportunity',
      timestamp_seconds: null,
      headline        : ctaRate >= 10
        ? 'Your call-to-action is performing above average'
        : 'Your call-to-action has room to improve',
      body            : `Your CTA gets ${ctaRate}% click rate from viewers. The typical benchmark for video CTAs is 8–12%. ${ctaRate >= 8 ? 'You\'re within or above that range.' : 'There may be an opportunity to improve placement, timing, or copy.'}`,
      action_prompt   : ctaRate < 8
        ? 'Try repositioning your CTA to appear just after a high-engagement moment.'
        : 'Keep this CTA placement — it\'s working well.',
      metric_value    : ctaRate,
      metric_label    : '% CTA click rate',
      data_snapshot   : { clicks: cta.total_clicks, sessions: cta.total_sessions, rate: ctaRate },
    });
  }

  return results;
}

// ─────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────

/** Format seconds into M:SS string for human-readable headlines */
function _formatSeconds(s) {
  const m = Math.floor(s / 60);
  const sec = String(s % 60).padStart(2, '0');
  return `${m}:${sec}`;
}

/**
 * Return qualitative teaser variables for each insight type.
 * NO numbers, percentages, or timestamps — these go in the email subject line.
 */
function _teaserVars(insightType) {
  const map = {
    low_play_rate            : { t1: 'your visitors',    t2: 'pressing play' },
    high_play_rate           : { t1: 'your hook',        t2: '' },
    top_domain_source        : { t1: 'one source',       t2: 'your traffic' },
    completion_champion      : { t1: 'your viewers',     t2: 'the end' },
    low_completion           : { t1: 'the first half',   t2: '' },
    mobile_majority          : { t1: 'mobile',           t2: '' },
    mobile_drop              : { t1: 'mobile',           t2: 'desktop' },
    geographic_concentration : { t1: 'one country',      t2: 'your audience' },
    drop_off_moment          : { t1: 'a specific moment',t2: 'your video' },
    engagement_spike         : { t1: 'this moment',      t2: '' },
    dead_zone                : { t1: 'a section',        t2: 'nobody watches' },
    returning_viewers        : { t1: 'your fans',        t2: 'coming back' },
    utm_top_source           : { t1: 'one channel',      t2: 'your plays' },
    funnel_drop              : { t1: 'your funnel',      t2: 'the drop' },
    cta_performance          : { t1: 'your CTA',         t2: '' },
  };
  return map[insightType] || { t1: '', t2: '' };
}

// ─────────────────────────────────────────────────────────────────────────
// BATCH RUNNER — for scheduled jobs / manual triggers
// ─────────────────────────────────────────────────────────────────────────

/**
 * Run the insight engine for all videos that are pending or have stale insights.
 * Called by the scheduled job runner (Step 6).
 *
 * @param {{ staleDays?: number }} [options]
 * @returns {Promise<void>}
 */
async function runPendingVideos(options = {}) {
  const staleDays = options.staleDays ?? 1;

  try {
    const { rows: videos } = await pool.query(
      `SELECT v.id
       FROM   videos v
       WHERE  v.is_active = TRUE
         AND  v.is_archived = FALSE
         AND  v.total_plays >= $1
         AND (
           v.insight_status = 'pending'
           OR v.insight_status = 'failed'
           OR (
             v.insight_status = 'complete'
             AND v.insight_generated_at < NOW() - ($2 || ' days')::INTERVAL
           )
         )
       ORDER  BY v.total_plays DESC
       LIMIT  50`,
      [MIN_SESSIONS_BASIC, staleDays]
    );

    if (videos.length === 0) return;

    logger.info(`[insightEngine] Batch run: ${videos.length} videos to process`);

    for (const video of videos) {
      await runForVideo(video.id);
    }

    logger.info(`[insightEngine] Batch run complete`);

  } catch (err) {
    logger.error(`[insightEngine] Batch run failed: ${err.message}`);
  }
}

module.exports = { runForVideo, runPendingVideos };
