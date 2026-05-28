'use strict';

/**
 * Promotion Service
 *
 * Manages promotion_videos — admin-added videos that appear pinned at the
 * top of subscriber dashboards based on plan-tier visibility settings.
 *
 * Visibility tiers:
 *   noshow  — admin only (rank 99)
 *   free    — free + starter + pro (rank 0+)
 *   starter — starter + pro        (rank 1+)
 *   pro     — pro only             (rank 2+)
 */

const { pool }   = require('../config/database');
const logger     = require('../config/logger');
const { fetchDuration } = require('./durationService');

// ── Plan / visibility maps ────────────────────────────────────────────────

const PLAN_RANK = { free: 0, starter: 1, pro: 2, admin_lifetime: 99 };
const VISIBILITY_MIN_RANK = { noshow: 99, free: 0, starter: 1, pro: 2 };
const VALID_VISIBILITY = new Set(['noshow', 'free', 'starter', 'pro']);

// ── Video URL helpers (mirrors videos.js) ────────────────────────────────

const IFRAME_SOURCES = new Set(['youtube', 'vimeo', 'loom', 'zoom', 'google_drive']);
const DIRECT_SOURCES = new Set(['hls_stream', 'mp4_direct', 'amazon_s3', 'azure_blob']);

function detectSourceType(rawUrl) {
  try {
    const { hostname, pathname } = new URL(rawUrl);
    const host = hostname.replace(/^www\./, '').toLowerCase();
    if (host === 'youtube.com' || host === 'youtu.be')       return 'youtube';
    if (host === 'vimeo.com')                                 return 'vimeo';
    if (host === 'loom.com' || host.endsWith('.loom.com'))   return 'loom';
    if (host === 'zoom.us'  || host.endsWith('.zoom.us'))    return 'zoom';
    if (host === 'drive.google.com')                          return 'google_drive';
    if (host === 'dropbox.com')                               return 'dropbox';
    if (host.endsWith('.amazonaws.com'))                      return 'amazon_s3';
    if (host.endsWith('.blob.core.windows.net'))              return 'azure_blob';
    const ext = pathname.split('.').pop().toLowerCase();
    if (['mp4','webm','mov','avi','mkv','flv'].includes(ext)) return 'mp4_direct';
    if (['m3u8','m3u'].includes(ext))                         return 'hls_stream';
    return 'other';
  } catch { return 'other'; }
}

function generateDefaultTitle(rawUrl) {
  try {
    const { hostname } = new URL(rawUrl);
    const host = hostname.replace(/^www\./, '').toLowerCase();
    if (host === 'youtube.com' || host === 'youtu.be') return 'YouTube Video';
    if (host === 'vimeo.com')                           return 'Vimeo Video';
    if (host === 'loom.com' || host.endsWith('.loom.com')) return 'Loom Recording';
    if (host === 'zoom.us'  || host.endsWith('.zoom.us'))  return 'Zoom Recording';
    if (host === 'drive.google.com') return 'Google Drive Video';
    return 'Promotion Video';
  } catch { return 'Promotion Video'; }
}

// ─────────────────────────────────────────────────────────────────────────
// PUBLIC API
// ─────────────────────────────────────────────────────────────────────────

/**
 * All promotion videos — for the admin panel.
 * Includes video stats and per-video hidden-count.
 */
async function getAdminPromotionVideos() {
  const { rows } = await pool.query(`
    SELECT
      pv.id,
      pv.video_id,
      pv.visibility,
      pv.sort_order,
      pv.created_at,
      v.title,
      v.original_url,
      v.source_type,
      v.thumbnail_url,
      v.duration_seconds,
      v.processing_status,
      v.using_iframe_fallback,
      COALESCE(s.total_views,  0) AS total_views,
      COALESCE(s.unique_views, 0) AS unique_views,
      (SELECT COUNT(*)::int
         FROM promotion_video_hidden pvh
        WHERE pvh.promotion_video_id = pv.id) AS hidden_count
    FROM promotion_videos pv
    JOIN videos v ON v.id = pv.video_id
    LEFT JOIN LATERAL (
      SELECT COUNT(*)                   AS total_views,
             COUNT(DISTINCT viewer_id)  AS unique_views
        FROM analytics_sessions
       WHERE video_id = v.id
    ) s ON TRUE
    WHERE v.is_active = TRUE
    ORDER BY pv.sort_order ASC, pv.created_at ASC
  `);
  return rows;
}

/**
 * Promotion videos visible to a specific subscriber.
 * Filters by plan rank and removes admin-hidden entries for that user.
 */
async function getVisiblePromotionVideos(userId, userPlan) {
  const userRank = PLAN_RANK[userPlan] ?? 0;

  const { rows } = await pool.query(`
    SELECT
      pv.id               AS promotion_id,
      pv.visibility,
      pv.sort_order,
      v.id,
      v.title,
      v.original_url,
      v.source_type,
      v.thumbnail_url,
      v.duration_seconds,
      v.processing_status,
      v.using_iframe_fallback,
      v.playable_url,
      v.insight_status,
      v.story_status,
      COALESCE(s.total_views,          0) AS total_views,
      COALESCE(s.unique_views,         0) AS unique_views,
      COALESCE(s.total_viewers,        0) AS total_viewers,
      COALESCE(s.uniq_viewers,         0) AS unique_session_viewers
    FROM promotion_videos pv
    JOIN videos v ON v.id = pv.video_id
    LEFT JOIN LATERAL (
      SELECT
        COUNT(*)                                               AS total_views,
        COUNT(DISTINCT viewer_id)                              AS unique_views,
        COUNT(*) FILTER (WHERE play_count > 0)                 AS total_viewers,
        COUNT(DISTINCT viewer_id) FILTER (WHERE play_count > 0) AS uniq_viewers
      FROM analytics_sessions
      WHERE video_id = v.id
    ) s ON TRUE
    WHERE v.is_active = TRUE
      AND pv.id NOT IN (
            SELECT promotion_video_id
              FROM promotion_video_hidden
             WHERE user_id = $1
          )
      AND CASE pv.visibility
            WHEN 'free'    THEN $2 >= 0
            WHEN 'starter' THEN $2 >= 1
            WHEN 'pro'     THEN $2 >= 2
            ELSE                 $2 >= 99
          END
    ORDER BY pv.sort_order ASC, pv.created_at ASC
  `, [userId, userRank]);

  return rows;
}

/**
 * Creates a video entry owned by the admin + the promotion_videos record.
 * Starts as visibility = 'noshow' so the admin can preview before publishing.
 */
async function createPromotionVideo(adminUserId, url, titleOverride) {
  const sourceType      = detectSourceType(url);
  const isIframe        = IFRAME_SOURCES.has(sourceType);
  const isDirect        = DIRECT_SOURCES.has(sourceType);
  const isReadyNow      = isIframe || isDirect;
  const processingStatus = isReadyNow ? 'completed' : 'pending';
  const playableUrl     = isReadyNow ? url : null;
  const title           = titleOverride?.trim() || generateDefaultTitle(url);

  // Fetch duration non-blocking
  const durationSeconds = await fetchDuration(url, sourceType).catch(() => null);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: [video] } = await client.query(
      `INSERT INTO videos
         (user_id, title, original_url, source_type,
          processing_status, using_iframe_fallback, playable_url,
          duration_seconds, insight_status, story_status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'pending','pending')
       RETURNING id, title, original_url, source_type, playable_url,
                 thumbnail_url, duration_seconds, processing_status,
                 using_iframe_fallback, created_at`,
      [adminUserId, title, url, sourceType, processingStatus,
       isIframe, playableUrl, durationSeconds ?? null]
    );

    const { rows: [promo] } = await client.query(
      `INSERT INTO promotion_videos (video_id, visibility, sort_order)
       VALUES ($1, 'noshow',
         COALESCE((SELECT MAX(sort_order) + 1 FROM promotion_videos), 0))
       RETURNING id, visibility, sort_order, created_at`,
      [video.id]
    );

    // Queue background processing job (best-effort)
    await client.query(
      `INSERT INTO video_processing_jobs (video_id, job_type, status)
       VALUES ($1, 'initial_resolve', 'pending')
       ON CONFLICT DO NOTHING`,
      [video.id]
    ).catch(() => {});

    await client.query('COMMIT');

    logger.info(`[promotion] Created promotion video ${promo.id} (video ${video.id}) by admin ${adminUserId}`);

    // Explicit mapping — do NOT spread promo+video together because video.id
    // would overwrite promo.id, breaking all subsequent visibility/reorder/delete calls.
    return {
      id                   : promo.id,
      promotion_id         : promo.id,
      video_id             : video.id,
      visibility           : promo.visibility,
      sort_order           : promo.sort_order,
      created_at           : promo.created_at,
      title                : video.title,
      original_url         : video.original_url,
      source_type          : video.source_type,
      playable_url         : video.playable_url,
      thumbnail_url        : video.thumbnail_url,
      duration_seconds     : video.duration_seconds,
      processing_status    : video.processing_status,
      using_iframe_fallback: video.using_iframe_fallback,
      total_views          : 0,
      unique_views         : 0,
      hidden_count         : 0,
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Rename the underlying video title for a promotion video.
 */
async function renamePromotionVideo(promoId, title) {
  const trimmed = title?.trim();
  if (!trimmed) throw new Error('title is required');
  const { rows: [row] } = await pool.query(
    `UPDATE videos SET title = $1, updated_at = NOW()
      WHERE id = (SELECT video_id FROM promotion_videos WHERE id = $2)
      RETURNING id, title`,
    [trimmed, promoId]
  );
  return row ?? null;
}

/**
 * Update visibility tier of a promotion video.
 */
async function updateVisibility(promoId, visibility) {
  if (!VALID_VISIBILITY.has(visibility)) throw new Error('Invalid visibility value');
  const { rows: [row] } = await pool.query(
    `UPDATE promotion_videos
        SET visibility = $1, updated_at = NOW()
      WHERE id = $2
  RETURNING id, visibility, sort_order, video_id`,
    [visibility, promoId]
  );
  return row ?? null;
}

/**
 * Bulk reorder. orderedIds = array of promotion_video IDs in desired display order.
 */
async function reorderPromotionVideos(orderedIds) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (let i = 0; i < orderedIds.length; i++) {
      await client.query(
        `UPDATE promotion_videos SET sort_order = $1, updated_at = NOW() WHERE id = $2`,
        [i, orderedIds[i]]
      );
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Delete a promotion video (soft-deletes the underlying video too).
 */
async function deletePromotionVideo(promoId) {
  const { rows: [row] } = await pool.query(
    `DELETE FROM promotion_videos WHERE id = $1 RETURNING video_id`,
    [promoId]
  );
  if (row?.video_id) {
    await pool.query(`UPDATE videos SET is_active = FALSE WHERE id = $1`, [row.video_id]);
    logger.info(`[promotion] Deleted promotion ${promoId} (video ${row.video_id})`);
  }
  return !!row;
}

/**
 * Admin: hide or unhide a specific promotion video for a specific user.
 */
async function setUserPromoHidden(userId, promoId, hidden) {
  if (hidden) {
    await pool.query(
      `INSERT INTO promotion_video_hidden (user_id, promotion_video_id)
       VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [userId, promoId]
    );
  } else {
    await pool.query(
      `DELETE FROM promotion_video_hidden
        WHERE user_id = $1 AND promotion_video_id = $2`,
      [userId, promoId]
    );
  }
}

/**
 * Returns the Set of promotion_video IDs hidden for a user.
 */
async function getUserPromoHiddenIds(userId) {
  const { rows } = await pool.query(
    `SELECT promotion_video_id FROM promotion_video_hidden WHERE user_id = $1`,
    [userId]
  );
  return new Set(rows.map(r => r.promotion_video_id));
}

module.exports = {
  getAdminPromotionVideos,
  getVisiblePromotionVideos,
  createPromotionVideo,
  renamePromotionVideo,
  updateVisibility,
  reorderPromotionVideos,
  deletePromotionVideo,
  setUserPromoHidden,
  getUserPromoHiddenIds,
};
