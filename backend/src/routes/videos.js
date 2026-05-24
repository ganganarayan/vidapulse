'use strict';

/**
 * Videos routes — /api/videos/*
 *
 *   GET  /api/videos          — list user's active videos (newest first)
 *   POST /api/videos          — create a new video tracking entry
 *   GET  /api/videos/:id      — single video detail
 *   PATCH /api/videos/:id     — update title / description
 *   DELETE /api/videos/:id    — soft-delete (is_active = FALSE)
 */

const express                    = require('express');
const { z }                      = require('zod');
const router                     = express.Router();
const { pool }                   = require('../config/database');
const logger                     = require('../config/logger');
const { requireAuth }            = require('../middleware/requireAuth');
const { planGate, videoLimitGate } = require('../middleware/planGate');
const { emitEvent }              = require('../services/behavioralEventService');

// ─────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────

/**
 * Sources that need no server-side URL resolution — the original URL IS the
 * playable URL. Processing is considered immediately complete for all of these.
 *
 * IFRAME_SOURCES   — embedded via <iframe> (YouTube, Vimeo, …)
 * DIRECT_SOURCES   — played directly by the browser (<video> or HLS.js)
 *
 * Both sets are marked processing_status = 'completed' on creation.
 * Only sources outside both sets (dropbox, onedrive, other) are queued for
 * async resolution by a background worker.
 */
const IFRAME_SOURCES  = new Set(['youtube', 'vimeo', 'loom', 'zoom', 'google_drive']);
const DIRECT_SOURCES  = new Set(['hls_stream', 'mp4_direct', 'amazon_s3', 'azure_blob']);

/**
 * Detect the source_type ENUM value from a video URL.
 * Must match the video_source_type ENUM in the database.
 */
function detectSourceType(rawUrl) {
  try {
    const { hostname, pathname } = new URL(rawUrl);
    const host = hostname.replace(/^www\./, '').toLowerCase();

    if (host === 'youtube.com' || host === 'youtu.be')      return 'youtube';
    if (host === 'vimeo.com')                                return 'vimeo';
    if (host === 'loom.com' || host.endsWith('.loom.com'))  return 'loom';
    if (host === 'zoom.us'  || host.endsWith('.zoom.us'))   return 'zoom';
    if (host === 'drive.google.com')                         return 'google_drive';
    if (host === 'dropbox.com')                              return 'dropbox';
    if (host === 'onedrive.live.com' || host === '1drv.ms') return 'onedrive';
    if (host.endsWith('.amazonaws.com') || host === 's3.amazonaws.com') return 'amazon_s3';
    if (host.endsWith('.blob.core.windows.net'))             return 'azure_blob';

    const ext = pathname.split('.').pop().toLowerCase();
    if (['mp4', 'webm', 'mov', 'avi', 'mkv', 'flv'].includes(ext)) return 'mp4_direct';
    if (['m3u8', 'm3u'].includes(ext))                               return 'hls_stream';

    return 'other';
  } catch {
    return 'other';
  }
}

/**
 * Generate a human-readable default title from the URL when the user
 * doesn't provide one. Only used as a fallback — the frontend lets the
 * user rename it after creation.
 */
function generateDefaultTitle(rawUrl) {
  try {
    const { hostname, pathname } = new URL(rawUrl);
    const host = hostname.replace(/^www\./, '').toLowerCase();

    if (host === 'youtube.com' || host === 'youtu.be') return 'YouTube Video';
    if (host === 'vimeo.com')                           return 'Vimeo Video';
    if (host === 'loom.com' || host.endsWith('.loom.com')) return 'Loom Recording';
    if (host === 'zoom.us'  || host.endsWith('.zoom.us'))  return 'Zoom Recording';
    if (host === 'drive.google.com')                    return 'Google Drive Video';
    if (host === 'dropbox.com')                         return 'Dropbox Video';

    // Fall back to the last path segment, cleaned up
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length > 0) {
      const last = segments[segments.length - 1];
      // Remove file extension and replace hyphens/underscores with spaces
      return last
        .replace(/\.[^.]+$/, '')
        .replace(/[-_]+/g, ' ')
        .slice(0, 100)
        || 'My Video';
    }
    return 'My Video';
  } catch {
    return 'My Video';
  }
}

// ─────────────────────────────────────────────────────────────────────────
// GET /api/videos
//
// Returns the user's active, non-archived videos newest-first.
// Includes enough fields for the video list cards.
// ─────────────────────────────────────────────────────────────────────────

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT id,
              title,
              description,
              original_url,
              source_type,
              thumbnail_url,
              total_plays,
              unique_viewers,
              avg_watch_pct,
              processing_status,
              insight_status,
              story_status,
              primary_drop_off_second,
              primary_drop_off_pct,
              created_at,
              updated_at
       FROM   videos
       WHERE  user_id    = $1
         AND  is_active  = TRUE
         AND  is_archived = FALSE
       ORDER  BY created_at DESC
       LIMIT  100`,
      [req.user.id]
    );

    return res.json({ videos: rows });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────
// POST /api/videos
//
// Creates a new video tracking entry.
//   1. Validates URL format
//   2. Checks plan video limit (videoLimitGate middleware)
//   3. Detects source_type from URL
//   4. Inserts video + processing job
//   5. Stamps users.first_video_id if this is the user's first video
//   6. Emits first_video_added behavioral event (non-blocking)
//
// Body: { url: string, title?: string }
// ─────────────────────────────────────────────────────────────────────────

const createVideoSchema = z.object({
  url  : z.string()
    .url('Must be a valid URL')
    .max(2000)
    .refine(
      (u) => u.startsWith('https://') || u.startsWith('http://'),
      { message: 'URL must start with https:// or http://' }
    )
    .refine(
      (u) => {
        // Block dangerous/non-video protocols: data:, javascript:, blob:, ftp:, file:
        const lower = u.toLowerCase();
        return !lower.startsWith('data:') &&
               !lower.startsWith('javascript:') &&
               !lower.startsWith('blob:') &&
               !lower.startsWith('file:') &&
               !lower.startsWith('ftp:');
      },
      { message: 'URL protocol not allowed' }
    ),
  title: z.string().min(1).max(500).optional(),
});

router.post('/', requireAuth, videoLimitGate, async (req, res, next) => {
  try {
    const parseResult = createVideoSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error : 'Validation failed',
        fields: parseResult.error.flatten().fieldErrors,
      });
    }

    const { url, title } = parseResult.data;
    const sourceType     = detectSourceType(url);
    const videoTitle     = (title?.trim()) || generateDefaultTitle(url);

    // Sources that need no server-side processing — mark as completed
    // immediately so the frontend skips the animation and shows the dashboard.
    const isIframe         = IFRAME_SOURCES.has(sourceType);
    const isDirect         = DIRECT_SOURCES.has(sourceType);
    const isReadyNow       = isIframe || isDirect;
    const processingStatus = isReadyNow ? 'completed' : 'pending';
    const playableUrl      = isReadyNow ? url : null;
    const usingIframe      = isIframe;

    // ── Insert video ──────────────────────────────────────────────────────
    const { rows: [video] } = await pool.query(
      `INSERT INTO videos
         (user_id, title, original_url, source_type,
          processing_status, using_iframe_fallback, playable_url,
          insight_status, story_status)
       VALUES
         ($1, $2, $3, $4, $5, $6, $7, 'pending', 'pending')
       RETURNING
         id, title, original_url, source_type, playable_url, thumbnail_url,
         total_plays, unique_viewers, avg_watch_pct,
         processing_status, using_iframe_fallback,
         insight_status, story_status,
         created_at`,
      [req.user.id, videoTitle, url, sourceType, processingStatus, usingIframe, playableUrl]
    );

    logger.info(`[videos] Created video ${video.id} (${sourceType}) for user ${req.user.id}`);

    // ── Queue processing job (non-blocking) ───────────────────────────────
    // A future background worker will resolve the playable URL + metadata.
    pool.query(
      `INSERT INTO video_processing_jobs (video_id, job_type, status)
       VALUES ($1, 'initial_resolve', 'pending')`,
      [video.id]
    ).catch(err =>
      logger.error(`[videos] Failed to queue processing job for ${video.id}: ${err.message}`)
    );

    // ── Stamp first_video_id on the user (non-blocking) ───────────────────
    pool.query(
      `UPDATE users
       SET first_video_id = $1, updated_at = NOW()
       WHERE id = $2 AND first_video_id IS NULL`,
      [video.id, req.user.id]
    ).then(({ rowCount }) => {
      if (rowCount > 0) {
        // This IS the user's first video — emit the behavioral event
        emitEvent(req.user.id, 'first_video_added', video.id, {
          video_id   : video.id,
          video_url  : url,
          source_type: sourceType,
          title      : videoTitle,
        });
      }
    }).catch(err =>
      logger.error(`[videos] first_video_id stamp failed for user ${req.user.id}: ${err.message}`)
    );

    return res.status(201).json({ video });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────
// GET /api/videos/:id
//
// Returns full detail for a single video. Verifies ownership.
// ─────────────────────────────────────────────────────────────────────────

router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT id,
              title,
              description,
              original_url,
              source_type,
              playable_url,
              thumbnail_url,
              duration_seconds,
              total_plays,
              unique_viewers,
              avg_watch_pct,
              processing_status,
              processing_error,
              insight_status,
              insight_generated_at,
              story_status,
              story_generated_at,
              primary_drop_off_second,
              primary_drop_off_pct,
              is_archived,
              created_at,
              updated_at
       FROM   videos
       WHERE  id       = $1
         AND  user_id  = $2
         AND  is_active = TRUE`,
      [req.params.id, req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Video not found' });
    }

    let video = rows[0];

    // Self-heal: if a directly-playable source is stuck in 'pending' (created
    // before DIRECT_SOURCES was introduced), promote it to 'completed' now so
    // the frontend skips the processing animation on this and every future visit.
    if (
      video.processing_status === 'pending' &&
      (IFRAME_SOURCES.has(video.source_type) || DIRECT_SOURCES.has(video.source_type))
    ) {
      const { rows: [healed] } = await pool.query(
        `UPDATE videos
         SET processing_status = 'completed',
             playable_url      = COALESCE(playable_url, original_url),
             updated_at        = NOW()
         WHERE id = $1
         RETURNING id, title, description, original_url, source_type, playable_url,
                   thumbnail_url, duration_seconds, total_plays, unique_viewers,
                   avg_watch_pct, processing_status, processing_error,
                   insight_status, insight_generated_at, story_status, story_generated_at,
                   primary_drop_off_second, primary_drop_off_pct,
                   is_archived, created_at, updated_at`,
        [video.id]
      );
      if (healed) {
        logger.info(`[videos] self-healed processing_status for ${video.id} (${video.source_type})`);
        video = healed;
      }
    }

    return res.json({ video });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────
// PATCH /api/videos/:id
//
// Update title and/or description. Verifies ownership.
// ─────────────────────────────────────────────────────────────────────────

const updateVideoSchema = z.object({
  title      : z.string().min(1).max(500).optional(),
  description: z.string().max(5000).optional(),
}).strict();

router.patch('/:id', requireAuth, async (req, res, next) => {
  try {
    const parseResult = updateVideoSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error : 'Validation failed',
        fields: parseResult.error.flatten().fieldErrors,
      });
    }

    const updates = parseResult.data;
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const setClauses = [];
    const values     = [];
    let   paramIdx   = 1;

    if (updates.title !== undefined) {
      setClauses.push(`title = $${paramIdx++}`);
      values.push(updates.title);
    }
    if (updates.description !== undefined) {
      setClauses.push(`description = $${paramIdx++}`);
      values.push(updates.description);
    }
    setClauses.push(`updated_at = NOW()`);

    // WHERE clause params
    values.push(req.params.id);   // video id
    values.push(req.user.id);     // ownership check

    const { rows } = await pool.query(
      `UPDATE videos
       SET    ${setClauses.join(', ')}
       WHERE  id = $${paramIdx} AND user_id = $${paramIdx + 1} AND is_active = TRUE
       RETURNING id, title, description, updated_at`,
      values
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Video not found' });
    }

    return res.json({ video: rows[0] });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────
// DELETE /api/videos/:id
//
// Soft-delete: sets is_active = FALSE. Data is retained for analytics.
// Verifies ownership.
// ─────────────────────────────────────────────────────────────────────────

router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const { rowCount } = await pool.query(
      `UPDATE videos
       SET    is_active  = FALSE,
              updated_at = NOW()
       WHERE  id       = $1
         AND  user_id  = $2
         AND  is_active = TRUE`,
      [req.params.id, req.user.id]
    );

    if (rowCount === 0) {
      return res.status(404).json({ error: 'Video not found' });
    }

    logger.info(`[videos] Soft-deleted video ${req.params.id} for user ${req.user.id}`);
    return res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────
// GET /api/videos/:id/insights
//
// Returns all non-dismissed insights for the video, primary first.
// Also returns the video's current insight_status so the frontend can
// show the correct empty state.
// ─────────────────────────────────────────────────────────────────────────

router.get('/:id/insights', requireAuth, async (req, res, next) => {
  try {
    // Ownership check
    const { rows: [video] } = await pool.query(
      `SELECT id, insight_status
       FROM   videos
       WHERE  id        = $1
         AND  user_id   = $2
         AND  is_active = TRUE`,
      [req.params.id, req.user.id]
    );

    if (!video) return res.status(404).json({ error: 'Video not found' });

    const { rows: insights } = await pool.query(
      `SELECT id,
              insight_type,
              severity,
              timestamp_seconds,
              headline,
              body,
              action_prompt,
              metric_value,
              metric_label,
              is_primary,
              generated_at
       FROM   video_insights
       WHERE  video_id     = $1
         AND  is_dismissed = FALSE
       ORDER  BY is_primary DESC,
                 CASE severity
                   WHEN 'critical'    THEN 1
                   WHEN 'warning'     THEN 2
                   WHEN 'opportunity' THEN 3
                   ELSE               4
                 END,
                 generated_at DESC`,
      [req.params.id]
    );

    return res.json({
      insights,
      insight_status: video.insight_status,
    });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────
// PATCH /api/videos/:id/insights/:insightId/dismiss
//
// Soft-hides an insight card. The row is retained for analytics;
// is_dismissed = TRUE removes it from subsequent GET /insights responses.
// ─────────────────────────────────────────────────────────────────────────

router.patch('/:id/insights/:insightId/dismiss', requireAuth, async (req, res, next) => {
  try {
    const insightId = parseInt(req.params.insightId, 10);
    if (isNaN(insightId)) {
      return res.status(400).json({ error: 'Invalid insight ID' });
    }

    const { rowCount } = await pool.query(
      `UPDATE video_insights
       SET    is_dismissed = TRUE
       WHERE  id       = $1
         AND  video_id = $2
         AND  user_id  = $3`,
      [insightId, req.params.id, req.user.id]
    );

    if (rowCount === 0) {
      return res.status(404).json({ error: 'Insight not found' });
    }

    return res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────
// GET /api/videos/:id/stories
//
// Returns all non-stale viewer story cards for a video.
// No plan gate at the API level — the story engine already only generates
// stories for features the user's plan supports. The frontend handles
// locked-card display for plan-upgrade prompts.
// ─────────────────────────────────────────────────────────────────────────

router.get('/:id/stories', requireAuth, async (req, res, next) => {
  try {
    // Ownership check
    const { rows: [video] } = await pool.query(
      `SELECT id, story_status, story_generated_at
       FROM   videos
       WHERE  id        = $1
         AND  user_id   = $2
         AND  is_active = TRUE`,
      [req.params.id, req.user.id]
    );

    if (!video) return res.status(404).json({ error: 'Video not found' });

    const { rows: stories } = await pool.query(
      `SELECT id,
              story_type,
              headline,
              detail,
              interpretation,
              session_id,
              viewer_count,
              generated_at
       FROM   viewer_stories
       WHERE  video_id = $1
         AND  is_stale = FALSE
       ORDER  BY CASE story_type
                   WHEN 'most_engaged'        THEN 1
                   WHEN 'common_drop_pattern' THEN 2
                   WHEN 'source_pattern'      THEN 3
                   WHEN 'mobile_pattern'      THEN 4
                   ELSE                            5
                 END`,
      [req.params.id]
    );

    return res.json({
      stories,
      story_status      : video.story_status,
      story_generated_at: video.story_generated_at,
    });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────
// GET /api/videos/:id/heatmap
//
// Returns per-second engagement data for the heatmap visualisation.
// Requires the "heatmap" feature (Pro plan). Verifies ownership.
//
// Response:
//   {
//     heatmap          : [{ second_bucket, first_watches, replays }],
//     drop_off_second  : number | null,
//     drop_off_pct     : number | null,   -- 0–100
//     duration_seconds : number | null,
//     total_viewers    : number | null,
//   }
// ─────────────────────────────────────────────────────────────────────────

router.get('/:id/heatmap', requireAuth, planGate('heatmap'), async (req, res, next) => {
  try {
    // Ownership check + pull cached drop-off / duration from the video row
    const { rows: [video] } = await pool.query(
      `SELECT id,
              duration_seconds,
              primary_drop_off_second,
              primary_drop_off_pct,
              unique_viewers
       FROM   videos
       WHERE  id        = $1
         AND  user_id   = $2
         AND  is_active = TRUE`,
      [req.params.id, req.user.id]
    );

    if (!video) return res.status(404).json({ error: 'Video not found' });

    // Per-second aggregate rows — may be empty for new videos
    const { rows: heatmap } = await pool.query(
      `SELECT second_bucket,
              first_watches,
              replays
       FROM   analytics_heatmap_aggregate
       WHERE  video_id = $1
       ORDER  BY second_bucket ASC`,
      [req.params.id]
    );

    return res.json({
      heatmap,
      drop_off_second : video.primary_drop_off_second,
      drop_off_pct    : video.primary_drop_off_pct,
      duration_seconds: video.duration_seconds,
      total_viewers   : video.unique_viewers,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
