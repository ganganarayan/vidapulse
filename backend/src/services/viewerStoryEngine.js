'use strict';

/**
 * Viewer Story Engine — Step 4
 *
 * Generates 4 narrative story cards per video from aggregated viewer data.
 * Runs after the insight engine — called by the same scheduled job batch runner.
 *
 * Stories are written to the viewer_stories table (UNIQUE on video_id + story_type).
 * The upsert pattern marks all existing rows is_stale = TRUE before regenerating,
 * then clears is_stale on each upserted row. Old stories that no longer have
 * sufficient data remain stale and are hidden from the UI.
 *
 * ── 4 story types ────────────────────────────────────────────────────────
 *   most_engaged        — the single most engaged viewer session (anchor: session_id)
 *   common_drop_pattern — the modal viewer journey (where most people stop)
 *   source_pattern      — how viewer behaviour differs by traffic source
 *   mobile_pattern      — specific habits of mobile vs desktop viewers
 *
 * ── Plan gating ──────────────────────────────────────────────────────────
 *   most_engaged        → requires viewer_level (Pro)
 *   common_drop_pattern → requires heatmap (Pro)
 *   source_pattern      → requires audience_segmentation (Pro)
 *   mobile_pattern      → requires device_breakdown (Starter+)
 *
 * ── Never throws ─────────────────────────────────────────────────────────
 *   All errors are caught and logged. Engine never crashes the calling context.
 */

const { pool }  = require('../config/database');
const logger    = require('../config/logger');

// Minimum sessions before a story is worth telling
const MIN_SESSIONS_STORY    = 5;
const MIN_SESSIONS_SEGMENT  = 4;   // per-segment minimum for source/mobile splits

// Plan feature sets (mirrors insightEngine.js — keep in sync)
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

// ─────────────────────────────────────────────────────────────────────────
// PUBLIC API
// ─────────────────────────────────────────────────────────────────────────

/**
 * Run the story engine for a single video.
 *
 * @param {string} videoId
 * @returns {Promise<{ storiesGenerated: number }>}
 */
async function runForVideo(videoId) {
  try {
    // ── Load video + plan ─────────────────────────────────────────────
    const { rows: [videoRow] } = await pool.query(
      `SELECT v.id, v.title, v.duration_seconds, v.total_plays,
              p.name AS plan_name
       FROM   videos v
       JOIN   users  u ON u.id = v.user_id
       JOIN   plans  p ON p.id = u.plan_id
       WHERE  v.id = $1 AND v.is_active = TRUE`,
      [videoId]
    );

    if (!videoRow) {
      logger.warn(`[storyEngine] Video ${videoId} not found or inactive`);
      return { storiesGenerated: 0 };
    }

    const planFeatures = PLAN_FEATURES[videoRow.plan_name] || PLAN_FEATURES.free;

    // ── Check total sessions threshold ────────────────────────────────
    const { rows: [countRow] } = await pool.query(
      `SELECT COUNT(*)::int AS total FROM analytics_sessions WHERE video_id = $1`,
      [videoId]
    );
    if (countRow.total < MIN_SESSIONS_STORY) {
      logger.debug(`[storyEngine] Not enough sessions for video ${videoId} (${countRow.total}/${MIN_SESSIONS_STORY})`);
      return { storiesGenerated: 0 };
    }

    // ── Mark all existing stories as stale ────────────────────────────
    await pool.query(
      `UPDATE viewer_stories SET is_stale = TRUE WHERE video_id = $1`,
      [videoId]
    );

    // ── Generate applicable stories ───────────────────────────────────
    const generated = [];

    if (planFeatures.has('viewer_level')) {
      const s = await _storyMostEngaged(videoId, videoRow);
      if (s) { await _upsertStory(videoId, s); generated.push('most_engaged'); }
    }

    if (planFeatures.has('heatmap')) {
      const s = await _storyCommonDropPattern(videoId, videoRow);
      if (s) { await _upsertStory(videoId, s); generated.push('common_drop_pattern'); }
    }

    if (planFeatures.has('audience_segmentation')) {
      const s = await _storySourcePattern(videoId, videoRow);
      if (s) { await _upsertStory(videoId, s); generated.push('source_pattern'); }
    }

    if (planFeatures.has('device_breakdown')) {
      const s = await _storyMobilePattern(videoId, videoRow);
      if (s) { await _upsertStory(videoId, s); generated.push('mobile_pattern'); }
    }

    // ── Mark video story status ───────────────────────────────────────
    await pool.query(
      `UPDATE videos
       SET story_status       = $1,
           story_generated_at = NOW(),
           updated_at         = NOW()
       WHERE id = $2`,
      [generated.length > 0 ? 'complete' : 'pending', videoId]
    );

    logger.info(`[storyEngine] ✓ ${generated.length} stories for video ${videoId}: [${generated.join(', ')}]`);
    return { storiesGenerated: generated.length };

  } catch (err) {
    logger.error(`[storyEngine] Failed for video ${videoId}: ${err.message}`);
    pool.query(
      `UPDATE videos SET story_status = 'failed', updated_at = NOW() WHERE id = $1`,
      [videoId]
    ).catch(() => {});
    return { storiesGenerated: 0 };
  }
}

/**
 * Run the story engine for all videos with completed insights but pending stories.
 * Called by the Step 6 scheduled job runner after runPendingVideos().
 */
async function runPendingVideos(options = {}) {
  const staleDays = options.staleDays ?? 1;

  try {
    const { rows: videos } = await pool.query(
      `SELECT v.id
       FROM   videos v
       WHERE  v.is_active    = TRUE
         AND  v.is_archived  = FALSE
         AND  v.insight_status = 'complete'
         AND (
           v.story_status = 'pending'
           OR v.story_status = 'failed'
           OR (
             v.story_status = 'complete'
             AND v.story_generated_at < NOW() - ($1 || ' days')::INTERVAL
           )
         )
       ORDER  BY v.total_plays DESC
       LIMIT  50`,
      [staleDays]
    );

    if (videos.length === 0) return;

    logger.info(`[storyEngine] Batch run: ${videos.length} videos to process`);
    for (const video of videos) {
      await runForVideo(video.id);
    }
    logger.info(`[storyEngine] Batch run complete`);

  } catch (err) {
    logger.error(`[storyEngine] Batch run failed: ${err.message}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────
// STORY GENERATORS
// ─────────────────────────────────────────────────────────────────────────

/**
 * STORY 1: most_engaged
 *
 * Finds the single most engaged session and builds a story about that viewer.
 * Engagement score = max_watch_pct (weight 40%) + replay bonus + completion bonus.
 * The session_id is stored as an anchor so the UI can deep-link to it.
 *
 * Requires: viewer_level (Pro)
 */
async function _storyMostEngaged(videoId, video) {
  const { rows } = await pool.query(
    `SELECT
       s.id                    AS session_id,
       s.device_type,
       s.country_name,
       s.city,
       s.utm_source,
       s.domain,
       s.total_watch_seconds,
       s.max_watch_pct,
       s.avg_watch_pct,
       s.play_count,
       s.seek_count,
       s.reached_end,
       s.started_muted,
       s.unmuted_at_seconds,
       s.final_playback_speed,
       s.started_at,
       -- Engagement score (not stored, just for ranking)
       (
         s.max_watch_pct * 0.4
         + CASE WHEN s.play_count > 1 THEN 20 ELSE 0 END
         + CASE WHEN s.play_count > 2 THEN 10 ELSE 0 END
         + CASE WHEN s.reached_end    THEN 30 ELSE 0 END
         + CASE WHEN s.seek_count > 3 THEN 10 ELSE 0 END
       ) AS score,
       -- Average score across all sessions (for comparison)
       AVG(s.max_watch_pct * 0.4 + CASE WHEN s.reached_end THEN 30 ELSE 0 END)
         OVER () AS avg_score,
       COUNT(*) OVER () AS total_sessions
     FROM analytics_sessions s
     WHERE s.video_id = $1
     ORDER BY score DESC
     LIMIT 1`,
    [videoId]
  );

  if (!rows.length) return null;
  const top = rows[0];

  // Build context fragments
  const deviceLabel   = top.device_type === 'mobile'  ? 'their phone'
                      : top.device_type === 'tablet'  ? 'a tablet'
                      : top.device_type === 'desktop' ? 'a desktop'
                      : 'their device';

  const locationPart  = top.city && top.country_name
                      ? `from ${top.city}, ${top.country_name}`
                      : top.country_name
                      ? `from ${top.country_name}`
                      : '';

  const sourcePart    = top.utm_source
                      ? `via ${top.utm_source}`
                      : top.domain
                      ? `from ${top.domain}`
                      : 'via a direct link';

  const watchedPart   = top.reached_end
                      ? 'watched all the way to the end'
                      : `watched ${Math.round(top.max_watch_pct)}% of the video`;

  const replayPart    = top.play_count > 2
                      ? ` and came back to watch it ${top.play_count} times`
                      : top.play_count === 2
                      ? ' and watched it twice'
                      : '';

  const mutePart      = !top.started_muted
                      ? ' They started with sound on — no persuasion needed.'
                      : top.unmuted_at_seconds != null
                      ? ` They unmuted after ${Math.round(top.unmuted_at_seconds)} seconds.`
                      : '';

  const speedPart     = top.final_playback_speed && top.final_playback_speed !== 1.0
                      ? ` They watched at ${top.final_playback_speed}× speed.`
                      : '';

  const seekPart      = top.seek_count > 5
                      ? ` They seeked through ${top.seek_count} times — suggesting they were actively searching for specific information.`
                      : top.seek_count > 2
                      ? ` They rewound or skipped a few times during viewing.`
                      : '';

  const headline = top.reached_end && top.play_count >= 2
    ? 'One viewer loved this video enough to watch it more than once'
    : top.reached_end
    ? 'One viewer gave this video their complete attention'
    : `One viewer stands out as your most engaged session`;

  const detail =
    `Someone watching on ${deviceLabel}${locationPart ? ' ' + locationPart : ''}, `
    + `arriving ${sourcePart}, ${watchedPart}${replayPart}.`
    + mutePart + speedPart + seekPart;

  const gapVsAvg = Math.round(top.score - top.avg_score);
  const interpretation = gapVsAvg > 20
    ? `This viewer's engagement is significantly above your average session. They represent exactly the kind of audience member this video is designed to reach. Understanding where they came from and what device they used can help you attract more viewers like them.`
    : `This viewer's session was your strongest, though the gap with your average is modest. Overall, your audience is fairly consistent in how they engage with this content.`;

  return {
    story_type    : 'most_engaged',
    headline,
    detail,
    interpretation,
    session_id    : top.session_id,
    viewer_count  : parseInt(top.total_sessions, 10),
  };
}

/**
 * STORY 2: common_drop_pattern
 *
 * Describes the modal viewer journey — where most people stop watching.
 * Divides sessions into quartile bands (0–25%, 25–50%, 50–75%, 75–100%, 100%)
 * and identifies the most common stopping point.
 *
 * Requires: heatmap (Pro)
 */
async function _storyCommonDropPattern(videoId, video) {
  const { rows } = await pool.query(
    `SELECT
       CASE
         WHEN max_watch_pct >= 95         THEN 'completed'
         WHEN max_watch_pct >= 75         THEN 'q4'
         WHEN max_watch_pct >= 50         THEN 'q3'
         WHEN max_watch_pct >= 25         THEN 'q2'
         ELSE                                  'q1'
       END AS band,
       COUNT(*)::int AS viewers,
       ROUND(AVG(max_watch_pct), 1) AS avg_pct_in_band
     FROM analytics_sessions
     WHERE video_id = $1
     GROUP BY band
     ORDER BY viewers DESC`,
    [videoId]
  );

  if (!rows.length) return null;

  const total     = rows.reduce((s, r) => s + r.viewers, 0);
  if (total < MIN_SESSIONS_STORY) return null;

  const topBand   = rows[0];
  const topPct    = Math.round((topBand.viewers / total) * 100);
  const completed = rows.find(r => r.band === 'completed');
  const completedPct = completed ? Math.round((completed.viewers / total) * 100) : 0;

  // Human labels for each band
  const bandLabel = {
    q1       : 'within the first quarter',
    q2       : 'around the halfway point',
    q3       : 'in the third quarter',
    q4       : 'near the end but not quite finishing',
    completed: 'all the way to the end',
  };

  const headline = topBand.band === 'completed'
    ? `${completedPct}% of your viewers watch this video to completion`
    : `Most viewers stop ${bandLabel[topBand.band] || 'early'} — this is your audience pattern`;

  const detail = topBand.band === 'completed'
    ? `${topPct}% of your sessions result in the viewer reaching the end. `
      + `Another ${rows.find(r => r.band === 'q4')?.viewers ?? 0} viewers made it past the 75% mark. `
      + `Only ${total - (completed?.viewers ?? 0) - (rows.find(r => r.band === 'q4')?.viewers ?? 0)} viewers stopped in the first half.`
    : `${topPct}% of your viewers (${topBand.viewers} out of ${total}) stop ${bandLabel[topBand.band] ?? 'early'}. `
      + `${completedPct}% make it all the way to the end. `
      + `The remaining viewers are distributed across the other sections.`;

  const interpretation = topBand.band === 'completed'
    ? `A high completion rate is one of the strongest signals of content quality. Viewers who finish a video are far more likely to convert, remember the message, and take action. This video is performing at the level your highest-value audience needs.`
    : topBand.band === 'q1'
    ? `Losing the majority of viewers in the first quarter almost always points to a mismatch between what the thumbnail or title promised and what the video delivers. The opening 30–60 seconds needs to answer "why should I keep watching?" immediately.`
    : topBand.band === 'q2'
    ? `Viewers who make it halfway are interested but something in the middle of your video is failing to maintain momentum. This is often a transition, a slower section, or a moment where the value delivery pauses.`
    : topBand.band === 'q3'
    ? `Making it three-quarters through is strong engagement. The drop at this stage often comes from a long outro, a summary section that viewers skip once they have the core message, or a CTA that appears too late.`
    : `Nearly finishing but not completing is sometimes driven by autoplay ending behaviour, a long credits section, or a closing segment that doesn't add new value. Consider shortening the last section.`;

  return {
    story_type   : 'common_drop_pattern',
    headline,
    detail,
    interpretation,
    session_id   : null,
    viewer_count : total,
  };
}

/**
 * STORY 3: source_pattern
 *
 * Compares viewer behaviour across traffic sources (UTM or domain).
 * Finds the highest and lowest performing sources by completion rate
 * and builds a story about the difference.
 *
 * Requires: audience_segmentation (Pro)
 */
async function _storySourcePattern(videoId, video) {
  const { rows } = await pool.query(
    `SELECT
       COALESCE(NULLIF(utm_source, ''), NULLIF(domain, ''), 'direct') AS source,
       COUNT(*)::int                                      AS sessions,
       ROUND(AVG(max_watch_pct), 1)                       AS avg_watch_pct,
       COUNT(*) FILTER (WHERE reached_end = TRUE)::int    AS completions,
       ROUND(
         COUNT(*) FILTER (WHERE reached_end = TRUE)::numeric
         / NULLIF(COUNT(*), 0) * 100, 1
       )                                                  AS completion_rate
     FROM analytics_sessions
     WHERE video_id = $1
     GROUP BY source
     HAVING COUNT(*) >= $2
     ORDER BY sessions DESC
     LIMIT 5`,
    [videoId, MIN_SESSIONS_SEGMENT]
  );

  if (rows.length < 2) return null;  // need at least 2 sources to compare

  // Find best and worst by avg_watch_pct
  const sorted  = [...rows].sort((a, b) => parseFloat(b.avg_watch_pct) - parseFloat(a.avg_watch_pct));
  const best    = sorted[0];
  const worst   = sorted[sorted.length - 1];
  const gap     = parseFloat(best.avg_watch_pct) - parseFloat(worst.avg_watch_pct);
  const total   = rows.reduce((s, r) => s + r.sessions, 0);

  if (gap < 10) {
    // Sources behave similarly — still a story, just a different one
    const topSource = rows[0];
    return {
      story_type   : 'source_pattern',
      headline     : `Your viewers behave consistently regardless of where they came from`,
      detail       : `Across all tracked sources — including ${rows.map(r => r.source).join(', ')} — your audience watches a similar amount of the video. The most active source is ${topSource.source} with ${topSource.sessions} sessions.`,
      interpretation: `Consistent behaviour across sources is a sign that your content delivers on its promise regardless of how it is discovered. This gives you flexibility to distribute in new channels without worrying about mismatched audiences.`,
      session_id   : null,
      viewer_count : total,
    };
  }

  const headline = `Viewers from ${best.source} watch significantly more than those from ${worst.source}`;

  const detail =
    `Viewers arriving from ${best.source} watch an average of ${best.avg_watch_pct}% of the video, `
    + `with ${best.completion_rate}% completing it. `
    + `In contrast, viewers from ${worst.source} average only ${worst.avg_watch_pct}% — a gap of ${Math.round(gap)} percentage points. `
    + `${rows[0].source} sends the most traffic with ${rows[0].sessions} sessions tracked.`;

  const interpretation = parseFloat(best.completion_rate) > 50
    ? `The ${best.source} audience is highly aligned with your content — they arrive already interested and leave satisfied. This is your highest-quality traffic source. Prioritising this channel for distribution will likely produce stronger results than spreading equally.`
    : `There is a clear difference in how different audiences engage with this content. Consider whether the ${worst.source} audience has different expectations — a tailored landing page or different thumbnail for that traffic source may close the gap.`;

  return {
    story_type   : 'source_pattern',
    headline,
    detail,
    interpretation,
    session_id   : null,
    viewer_count : total,
  };
}

/**
 * STORY 4: mobile_pattern
 *
 * Builds a narrative specifically about how mobile viewers behave.
 * Compares mobile vs desktop on: completion, unmute rate, peak hour, speed.
 *
 * Requires: device_breakdown (Starter+)
 */
async function _storyMobilePattern(videoId, video) {
  const { rows } = await pool.query(
    `SELECT
       device_type,
       COUNT(*)::int                                              AS sessions,
       ROUND(AVG(max_watch_pct), 1)                              AS avg_watch_pct,
       COUNT(*) FILTER (WHERE reached_end = TRUE)::int           AS completions,
       COUNT(*) FILTER (
         WHERE started_muted = FALSE OR unmuted_at_seconds IS NOT NULL
       )::int                                                    AS unmuted_sessions,
       ROUND(AVG(final_playback_speed), 2)                       AS avg_speed,
       EXTRACT(HOUR FROM AVG(started_at AT TIME ZONE 'UTC'))     AS avg_hour_utc
     FROM analytics_sessions
     WHERE video_id = $1
       AND device_type IN ('mobile', 'desktop')
     GROUP BY device_type
     HAVING COUNT(*) >= $2`,
    [videoId, MIN_SESSIONS_SEGMENT]
  );

  if (!rows.length) return null;

  const mobile  = rows.find(r => r.device_type === 'mobile');
  const desktop = rows.find(r => r.device_type === 'desktop');

  if (!mobile) {
    // No mobile sessions — still tell the story from the desktop perspective
    if (!desktop || desktop.sessions < MIN_SESSIONS_SEGMENT) return null;
    return {
      story_type   : 'mobile_pattern',
      headline     : 'Your audience is almost entirely desktop viewers',
      detail       : `All ${desktop.sessions} tracked sessions came from desktop devices. This is unusual — most video platforms see a majority of mobile traffic. It may indicate your video is embedded on a desktop-first page, or your audience is a professional one that works primarily at a desk.`,
      interpretation: `A desktop-dominant audience typically has longer attention spans and faster internet connections. You can take advantage of this with longer content, higher resolution, and richer player interactions that are harder to use on a phone.`,
      session_id   : null,
      viewer_count : desktop.sessions,
    };
  }

  const total       = rows.reduce((s, r) => s + r.sessions, 0);
  const mobilePct   = Math.round((mobile.sessions / total) * 100);
  const mobileAvg   = parseFloat(mobile.avg_watch_pct);
  const desktopAvg  = desktop ? parseFloat(desktop.avg_watch_pct) : null;
  const gap         = desktopAvg !== null ? desktopAvg - mobileAvg : 0;

  const mobileUnmutePct = mobile.sessions > 0
    ? Math.round((mobile.unmuted_sessions / mobile.sessions) * 100)
    : 0;
  const desktopUnmutePct = desktop && desktop.sessions > 0
    ? Math.round((desktop.unmuted_sessions / desktop.sessions) * 100)
    : null;

  const hourLabel = (h) => {
    if (h === null || h === undefined) return 'throughout the day';
    const hNum = Math.round(h);
    if (hNum >= 6  && hNum < 12) return 'morning';
    if (hNum >= 12 && hNum < 17) return 'afternoon';
    if (hNum >= 17 && hNum < 21) return 'evening';
    return 'late at night';
  };

  const headline = gap >= 20
    ? `Mobile viewers are having a noticeably different experience`
    : mobilePct >= 60
    ? `${mobilePct}% of your audience watches on mobile — and here is how they behave`
    : `Your mobile and desktop viewers are surprisingly similar`;

  let detail = `${mobilePct}% of your sessions come from mobile devices (${mobile.sessions} sessions). `
    + `Mobile viewers watch an average of ${mobileAvg}% of the video`;

  if (desktopAvg !== null) {
    detail += gap > 5
      ? `, compared to ${desktopAvg}% on desktop — a ${Math.round(Math.abs(gap))} point gap.`
      : `, almost identical to desktop viewers at ${desktopAvg}%.`;
  } else {
    detail += `.`;
  }

  detail += ` ${mobileUnmutePct}% of mobile sessions include sound`
    + (desktopUnmutePct !== null ? ` (vs ${desktopUnmutePct}% on desktop).` : `.`);

  if (mobile.avg_hour_utc !== null) {
    detail += ` Mobile viewers tend to watch in the ${hourLabel(mobile.avg_hour_utc)}.`;
  }

  if (mobile.avg_speed && parseFloat(mobile.avg_speed) > 1.1) {
    detail += ` Mobile viewers watch at an average speed of ${parseFloat(mobile.avg_speed).toFixed(1)}×.`;
  }

  const interpretation = gap >= 30
    ? `The significant drop in completion on mobile suggests a friction point specific to smaller screens — this could be slow load times, a player size that's hard to interact with, or content that requires a larger screen to follow. Fixing the mobile experience could meaningfully lift overall completion.`
    : mobileUnmutePct < 30
    ? `A majority of mobile viewers watch without sound. This is common in public or shared spaces. If your video relies heavily on spoken content without captions, a large portion of your mobile audience may be missing your core message.`
    : mobilePct >= 60 && gap < 15
    ? `Your mobile audience is both large and engaged — they watch nearly as much as desktop viewers despite the smaller screen. This is a strong signal that your content format works well for mobile consumption. Continue optimising for this audience.`
    : `Mobile and desktop viewers are behaving consistently, which suggests the player experience is well-optimised across devices. Maintaining this consistency as you add content will be key to retaining both audience types.`;

  return {
    story_type   : 'mobile_pattern',
    headline,
    detail,
    interpretation,
    session_id   : null,
    viewer_count : total,
  };
}

// ─────────────────────────────────────────────────────────────────────────
// DB UPSERT HELPER
// ─────────────────────────────────────────────────────────────────────────

async function _upsertStory(videoId, story) {
  await pool.query(
    `INSERT INTO viewer_stories
       (video_id, story_type, headline, detail, interpretation, session_id, viewer_count, is_stale)
     VALUES ($1, $2, $3, $4, $5, $6, $7, FALSE)
     ON CONFLICT (video_id, story_type) DO UPDATE SET
       headline       = EXCLUDED.headline,
       detail         = EXCLUDED.detail,
       interpretation = EXCLUDED.interpretation,
       session_id     = EXCLUDED.session_id,
       viewer_count   = EXCLUDED.viewer_count,
       is_stale       = FALSE,
       generated_at   = NOW()`,
    [
      videoId,
      story.story_type,
      story.headline,
      story.detail,
      story.interpretation,
      story.session_id ?? null,
      story.viewer_count,
    ]
  );
}

module.exports = { runForVideo, runPendingVideos };
