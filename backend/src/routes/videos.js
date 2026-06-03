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
const { fetchDuration }          = require('../services/durationService');

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
// Sources that need server-side URL resolution at creation time
const RESOLVE_SOURCES = new Set(['veed', 'mega']);

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
    if (host === 'veed.io' || host.endsWith('.veed.io'))    return 'veed';
    if (host === 'mega.nz')                                  return 'mega';

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
    if (host === 'veed.io' || host.endsWith('.veed.io')) return 'Veed Video';
    if (host === 'mega.nz')                              return 'Mega Video';

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
// URL resolvers for veed.io and mega.nz
// Returns { playableUrl, notPublic }
// ─────────────────────────────────────────────────────────────────────────

const RESOLVE_TIMEOUT_MS = 6000;

async function resolveVeedUrl(url) {
  try {
    const { pathname } = new URL(url);
    // Accept /view/UUID or /view/UUID/any-title-slug
    const match = pathname.match(/\/view\/([a-f0-9-]{8,})/i);
    if (!match) return { playableUrl: null, notPublic: true };

    const videoId  = match[1];
    const embedUrl = `https://www.veed.io/embed/${videoId}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), RESOLVE_TIMEOUT_MS);
    try {
      const resp = await fetch(url, {
        method : 'GET',
        signal : controller.signal,
        redirect: 'follow',
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; VidaPulse/1.0; +https://vidapulse.com)' },
      });
      clearTimeout(timer);
      // Veed redirects private/workspace videos to /workspaces or /login
      const finalUrl = resp.url || '';
      const notPublic = !resp.ok || finalUrl.includes('/workspaces') || finalUrl.includes('/login');
      return { playableUrl: embedUrl, notPublic };
    } catch {
      clearTimeout(timer);
      // Network error or timeout — flag not_public so user sees the warning
      return { playableUrl: embedUrl, notPublic: true };
    }
  } catch {
    return { playableUrl: null, notPublic: true };
  }
}

function resolveMegaUrl(url) {
  try {
    const parsed = new URL(url);
    // Supported path forms: /file/HASH, /video/HASH, /embed/HASH
    const pathMatch = parsed.pathname.match(/\/(file|video|embed)\/([A-Za-z0-9_-]+)/);
    if (!pathMatch) return { playableUrl: null, notPublic: true };

    const fileId = pathMatch[2];
    const key    = parsed.hash; // '#KEY' — needed for client-side decryption

    // Without the decryption key the file is completely inaccessible
    if (!key || key.length < 5) return { playableUrl: null, notPublic: true };

    const embedUrl = `https://mega.nz/embed/${fileId}${key}`;
    return { playableUrl: embedUrl, notPublic: false };
  } catch {
    return { playableUrl: null, notPublic: true };
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
      `SELECT v.id,
              v.title,
              v.description,
              v.original_url,
              v.source_type,
              v.thumbnail_url,
              v.duration_seconds,
              v.total_plays,
              v.unique_viewers,
              v.avg_watch_pct,
              v.processing_status,
              v.processing_error,
              v.insight_status,
              v.story_status,
              v.primary_drop_off_second,
              v.primary_drop_off_pct,
              v.created_at,
              v.updated_at,
              COALESCE(vstats.total_views,    0)  AS total_views,
              COALESCE(vstats.unique_views,   0)  AS unique_views,
              COALESCE(vstats.total_viewers,  0)  AS total_viewers,
              COALESCE(vstats.uniq_viewers,   0)  AS unique_session_viewers
       FROM   videos v
       LEFT JOIN LATERAL (
         SELECT
           COUNT(*)                                                         AS total_views,
           COUNT(DISTINCT viewer_id)                                        AS unique_views,
           COUNT(*) FILTER (WHERE play_count > 0)                          AS total_viewers,
           COUNT(DISTINCT viewer_id) FILTER (WHERE play_count > 0)         AS uniq_viewers
         FROM analytics_sessions
         WHERE video_id = v.id
       ) vstats ON TRUE
       WHERE  v.user_id    = $1
         AND  v.is_active  = TRUE
         AND  v.is_archived = FALSE
       ORDER  BY v.created_at DESC
       LIMIT  100`,
      [req.user.id]
    );

    // ── Backfill missing durations (fire-and-forget) ──────────────────────
    // For any video that still has no duration and is a queryable platform,
    // kick off a background fetch so it appears on next page load.
    const needsDuration = rows.filter(
      v => v.duration_seconds == null && ['youtube', 'vimeo', 'loom', 'google_drive'].includes(v.source_type)
    );
    if (needsDuration.length > 0) {
      Promise.allSettled(
        needsDuration.map(v =>
          fetchDuration(v.original_url, v.source_type).then(secs => {
            if (!secs) return;
            return pool.query(
              `UPDATE videos SET duration_seconds = $1, updated_at = NOW() WHERE id = $2`,
              [secs, v.id]
            ).then(() =>
              logger.info(`[videos/list] Backfilled duration ${secs}s for video ${v.id}`)
            );
          })
        )
      ).catch(() => {});
    }

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
    const isIframe   = IFRAME_SOURCES.has(sourceType);
    const isDirect   = DIRECT_SOURCES.has(sourceType);
    const isResolve  = RESOLVE_SOURCES.has(sourceType);

    let processingStatus = 'pending';
    let processingError  = null;
    let playableUrl      = null;
    let usingIframe      = isIframe;

    if (isIframe || isDirect) {
      processingStatus = 'completed';
      playableUrl      = url;
    } else if (isResolve) {
      const resolved = sourceType === 'veed'
        ? await resolveVeedUrl(url)
        : resolveMegaUrl(url);

      playableUrl      = resolved.playableUrl;
      processingStatus = resolved.notPublic ? 'failed' : 'completed';
      processingError  = resolved.notPublic ? 'not_public' : null;
      usingIframe      = !resolved.notPublic;
    }

    // ── Fetch duration (non-blocking, best-effort) ────────────────────────
    // Run before the INSERT so the value is available immediately in the
    // response. Times out at 6 s and returns null — never blocks on failure.
    const durationSeconds = await fetchDuration(url, sourceType);
    if (durationSeconds) {
      logger.info(`[videos] Fetched duration ${durationSeconds}s for ${sourceType} (${url})`);
    }

    // ── Insert video ──────────────────────────────────────────────────────
    const { rows: [video] } = await pool.query(
      `INSERT INTO videos
         (user_id, title, original_url, source_type,
          processing_status, processing_error, using_iframe_fallback, playable_url,
          duration_seconds,
          insight_status, story_status)
       VALUES
         ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending', 'pending')
       RETURNING
         id, title, original_url, source_type, playable_url, thumbnail_url,
         duration_seconds,
         total_plays, unique_viewers, avg_watch_pct,
         processing_status, processing_error, using_iframe_fallback,
         insight_status, story_status,
         created_at`,
      [req.user.id, videoTitle, url, sourceType, processingStatus, processingError,
       usingIframe, playableUrl, durationSeconds ?? null]
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

// ── GET /api/videos/archived — archived videos list ───────────────────────────
router.get('/archived', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT v.id, v.title, v.description, v.original_url, v.source_type,
              v.thumbnail_url, v.duration_seconds, v.total_plays, v.unique_viewers,
              v.processing_status, v.is_archived, v.created_at, v.updated_at,
              0 AS total_views, 0 AS unique_views, 0 AS total_viewers, 0 AS unique_session_viewers
       FROM   videos v
       WHERE  v.user_id     = $1
         AND  v.is_active   = TRUE
         AND  v.is_archived = TRUE
       ORDER  BY v.updated_at DESC
       LIMIT  100`,
      [req.user.id]
    );
    return res.json({ videos: rows });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────────────────
// GET /api/videos/:id
//
// Returns full detail for a single video. Verifies ownership.
// ─────────────────────────────────────────────────────────────────────────

const PLAN_RANK = { free: 0, starter: 1, pro: 2, admin_lifetime: 99 };

// Admins manage promotion videos they may not own directly, so video
// ownership checks treat admins as authorized for read/analytics access.
const isAdminUser = (req) => req.user.role === 'admin' || req.user.plan === 'admin_lifetime';

/**
 * True when the video is an active promotion video visible to this user's
 * plan (and not hidden by them). Lets non-owner subscribers VIEW a promo
 * video's analytics — they can view but not edit. Uses the same inverted
 * audience-ceiling model as the promotion list.
 */
async function isPromoViewable(videoId, req) {
  const rank = PLAN_RANK[req.user.plan] ?? 0;
  try {
    const { rows: [r] } = await pool.query(
      `SELECT EXISTS (
         SELECT 1 FROM promotion_videos pv
         WHERE pv.video_id = $1
           AND NOT EXISTS (
                 SELECT 1 FROM promotion_video_hidden pvh
                 WHERE pvh.promotion_video_id = pv.id AND pvh.user_id = $2
               )
           AND ( $3 >= 99
                 OR CASE pv.visibility
                      WHEN 'free'    THEN $3 <= 0
                      WHEN 'starter' THEN $3 <= 1
                      WHEN 'pro'     THEN $3 <= 2
                      ELSE                FALSE
                    END )
       ) AS ok`,
      [videoId, req.user.id, rank]
    );
    return !!r?.ok;
  } catch (_) {
    return false;
  }
}

// Read/analytics access for non-owners: admins, or subscribers viewing a
// promo video visible to their plan. (Editing stays owner/admin-only.)
async function canViewNonOwner(videoId, req) {
  return isAdminUser(req) || await isPromoViewable(videoId, req);
}

router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const planRank = PLAN_RANK[req.user.plan] ?? 0;

    const { rows } = await pool.query(
      `SELECT v.id,
              v.title,
              v.description,
              v.original_url,
              v.source_type,
              v.playable_url,
              v.thumbnail_url,
              v.duration_seconds,
              v.total_plays,
              v.unique_viewers,
              v.avg_watch_pct,
              v.processing_status,
              v.processing_error,
              v.insight_status,
              v.insight_generated_at,
              v.story_status,
              v.story_generated_at,
              v.primary_drop_off_second,
              v.primary_drop_off_pct,
              v.is_archived,
              v.created_at,
              v.updated_at,
              -- is_promo: true when viewed by a non-owner via promotion
              (v.user_id != $2) AS is_promo,
              pv_check.promo_id AS promotion_id
       FROM   videos v
       LEFT JOIN LATERAL (
         SELECT pv.id AS promo_id
           FROM promotion_videos pv
          WHERE pv.video_id = v.id
            AND NOT EXISTS (
                  SELECT 1 FROM promotion_video_hidden pvh
                   WHERE pvh.promotion_video_id = pv.id
                     AND pvh.user_id = $2
                )
            AND (
                  $3 >= 99   -- admin sees everything (incl. noshow)
                  OR CASE pv.visibility
                       WHEN 'free'    THEN $3 <= 0
                       WHEN 'starter' THEN $3 <= 1
                       WHEN 'pro'     THEN $3 <= 2
                       ELSE                FALSE
                     END
                )
          LIMIT 1
       ) pv_check ON TRUE
       WHERE  v.id        = $1
         AND  v.is_active = TRUE
         AND  (v.user_id  = $2 OR pv_check.promo_id IS NOT NULL)`,
      [req.params.id, req.user.id, planRank]
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

    // ── Self-heal missing duration (fire-and-forget) ──────────────────────
    // If duration_seconds is still NULL for a platform we can query, fetch it
    // in the background and persist it — no need to block this response.
    if (
      video.duration_seconds == null &&
      ['youtube', 'vimeo', 'loom'].includes(video.source_type)
    ) {
      fetchDuration(video.original_url, video.source_type)
        .then(secs => {
          if (!secs) return;
          pool.query(
            `UPDATE videos SET duration_seconds = $1, updated_at = NOW() WHERE id = $2`,
            [secs, video.id]
          ).then(() =>
            logger.info(`[videos] Backfilled duration ${secs}s for video ${video.id}`)
          ).catch(() => {});
        })
        .catch(() => {});
    }

    // Attach extra session-aggregate stats (non-fatal if sessions table is empty)
    let extraStats = { play_rate_pct: 0, completed_views: 0, total_watch_seconds_sum: 0, unique_viewers_who_played: 0 };
    try {
      const { rows: [stats] } = await pool.query(
        `SELECT
           COALESCE(
             ROUND(
               COUNT(CASE WHEN play_count > 0 THEN 1 END)::numeric
               / NULLIF(COUNT(*), 0) * 100, 1
             ), 0
           )::float                                                              AS play_rate_pct,
           COUNT(CASE WHEN reached_end AND play_count > 0 THEN 1 END)::int      AS completed_views,
           COALESCE(SUM(total_watch_seconds) FILTER (WHERE play_count > 0), 0)::bigint
                                                                                AS total_watch_seconds_sum,
           COUNT(DISTINCT viewer_id) FILTER (WHERE play_count > 0)::int         AS unique_viewers_who_played
         FROM analytics_sessions
         WHERE video_id = $1`,
        [video.id]
      );
      if (stats) extraStats = stats;
    } catch (err) {
      logger.warn(`[videos] extra stats query failed for ${video.id}: ${err.message}`);
    }

    // unique_viewers_who_played is a live-computed value that overrides the cached
    // videos.unique_viewers (which may lag or have been computed without the play filter).
    const { unique_viewers_who_played, ...coreStats } = extraStats;
    return res.json({ video: { ...video, ...coreStats, unique_viewers: Number(unique_viewers_who_played) || 0, is_promo: video.is_promo ?? false } });
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

// ── PATCH /api/videos/:id/archive — toggle archive/restore ───────────────────
router.patch('/:id/archive', requireAuth, async (req, res, next) => {
  try {
    const { archive } = req.body;           // true = archive, false = restore
    const { rows: [planRow] } = await pool.query(
      `SELECT p.video_limit, p.archive_limit,
              (SELECT COUNT(*) FROM videos WHERE user_id=$1 AND is_active=TRUE AND is_archived=FALSE)::int AS live_count,
              (SELECT COUNT(*) FROM videos WHERE user_id=$1 AND is_active=TRUE AND is_archived=TRUE)::int  AS archive_count
       FROM users u JOIN plans p ON p.id = u.plan_id
       WHERE u.id = $1`,
      [req.user.id]
    );

    if (archive) {
      // Archiving: archive slot must not be full
      if (planRow.archive_limit !== null && planRow.archive_count >= planRow.archive_limit) {
        return res.status(403).json({ error: 'archive_limit' });
      }
    } else {
      // Restoring: live slot must not be full
      if (planRow.video_limit !== null && planRow.live_count >= planRow.video_limit) {
        return res.status(403).json({ error: 'plan_limit' });
      }
    }

    const { rowCount } = await pool.query(
      `UPDATE videos
       SET    is_archived = $1,
              updated_at  = NOW()
       WHERE  id       = $2
         AND  user_id  = $3
         AND  is_active = TRUE`,
      [!!archive, req.params.id, req.user.id]
    );
    if (rowCount === 0) return res.status(404).json({ error: 'Video not found' });
    logger.info(`[videos] ${archive ? 'Archived' : 'Restored'} video ${req.params.id} for user ${req.user.id}`);
    return res.json({ ok: true });
  } catch (err) { next(err); }
});

// ── POST /api/videos/:id/recheck — re-verify public accessibility ────────────
router.post('/:id/recheck', requireAuth, async (req, res, next) => {
  try {
    const { rows: [video] } = await pool.query(
      `SELECT id, original_url, source_type FROM videos WHERE id=$1 AND (user_id=$2 OR $3::boolean) AND is_active=TRUE`,
      [req.params.id, req.user.id, isAdminUser(req)]
    );
    if (!video) return res.status(404).json({ error: 'Video not found' });
    if (!RESOLVE_SOURCES.has(video.source_type)) {
      return res.status(400).json({ error: 'Recheck not supported for this source type' });
    }

    const resolved = video.source_type === 'veed'
      ? await resolveVeedUrl(video.original_url)
      : resolveMegaUrl(video.original_url);

    const { rows: [updated] } = await pool.query(
      `UPDATE videos
       SET processing_status      = $1,
           processing_error       = $2,
           playable_url           = $3,
           using_iframe_fallback  = $4,
           updated_at             = NOW()
       WHERE id = $5
       RETURNING id, processing_status, processing_error, playable_url`,
      [
        resolved.notPublic ? 'failed' : 'completed',
        resolved.notPublic ? 'not_public' : null,
        resolved.playableUrl,
        !resolved.notPublic,
        video.id,
      ]
    );
    logger.info(`[videos] Recheck ${video.id} (${video.source_type}): ${resolved.notPublic ? 'still not public' : 'now public'}`);
    return res.json({ video: updated });
  } catch (err) { next(err); }
});

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
         AND  (user_id  = $2 OR $3::boolean)
         AND  is_active = TRUE`,
      [req.params.id, req.user.id, await canViewNonOwner(req.params.id, req)]
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
         AND  (user_id  = $2 OR $3::boolean)
         AND  is_active = TRUE`,
      [req.params.id, req.user.id, await canViewNonOwner(req.params.id, req)]
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
    // Ownership check + pull cached drop-off / duration from the video row.
    // total_players = sessions where the viewer actually pressed play (play_count > 0).
    // We use this as the 100% denominator for the retention heatmap so that the
    // chart correctly shows "what % of viewers who played watched this second".
    // We do NOT use the videos.unique_viewers column because it may lag behind and
    // counts page-loads (not actual plays), causing the retention baseline to be wrong.
    const { rows: [video] } = await pool.query(
      `SELECT v.id,
              v.duration_seconds,
              v.primary_drop_off_second,
              v.primary_drop_off_pct,
              (SELECT COUNT(*)
               FROM   analytics_sessions s
               WHERE  s.video_id  = v.id
                 AND  s.play_count > 0) AS total_players
       FROM   videos v
       WHERE  v.id        = $1
         AND  (v.user_id  = $2 OR $3::boolean)
         AND  v.is_active = TRUE`,
      [req.params.id, req.user.id, await canViewNonOwner(req.params.id, req)]
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

    // If duration_seconds isn't stored yet, derive it from the highest observed
    // second bucket so the heatmap can still render for existing videos.
    let durationSeconds = video.duration_seconds ? parseFloat(video.duration_seconds) : null;
    if (!durationSeconds && heatmap.length > 0) {
      const maxBucket = Math.max(...heatmap.map(r => r.second_bucket));
      durationSeconds = maxBucket + 10; // 10-second tail buffer
    }

    return res.json({
      heatmap,
      drop_off_second : video.primary_drop_off_second,
      drop_off_pct    : video.primary_drop_off_pct,
      duration_seconds: durationSeconds,
      total_viewers   : Number(video.total_players) || 0,
    });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────
// Player settings helpers
// ─────────────────────────────────────────────────────────────────────────

const PLAYER_DEFAULTS = {
  autoplay              : false,
  autoplay_muted        : true,
  start_muted           : true,
  show_seek_bar         : true,
  show_play_pause_btn   : true,
  show_playback_speed   : true,
  show_fullscreen_btn   : true,
  show_volume_control   : true,
  show_rewind_forward   : true,
  resume_playback       : false,
  loop                  : false,
  accent_color          : '#F59E0B',
};

const PLAYER_COLS = [
  'autoplay', 'autoplay_muted', 'start_muted', 'show_seek_bar',
  'show_play_pause_btn', 'show_playback_speed', 'show_fullscreen_btn',
  'show_volume_control', 'show_rewind_forward', 'resume_playback', 'loop', 'accent_color',
];

async function fetchPlayerSettings(videoId) {
  try {
    const { rows: [row] } = await pool.query(
      `SELECT ${PLAYER_COLS.join(', ')}
       FROM   video_player_settings
       WHERE  video_id = $1`,
      [videoId]
    );
    if (!row) return { ...PLAYER_DEFAULTS };
    // Strip null values so DB nulls never override the defaults
    const cleaned = Object.fromEntries(Object.entries(row).filter(([, v]) => v != null));
    return { ...PLAYER_DEFAULTS, ...cleaned };
  } catch (_) {
    return { ...PLAYER_DEFAULTS };
  }
}

// ─────────────────────────────────────────────────────────────────────────
// GET /api/videos/:id/player-settings
// ─────────────────────────────────────────────────────────────────────────

router.get('/:id/player-settings', requireAuth, async (req, res, next) => {
  try {
    // Owner OR admin can read settings — admins manage promotion videos
    // which they may not own directly.
    const isAdmin = req.user.role === 'admin' || req.user.plan === 'admin_lifetime';
    const { rows: [video] } = await pool.query(
      `SELECT id FROM videos WHERE id=$1 AND (user_id=$2 OR $3::boolean)`,
      [req.params.id, req.user.id, isAdmin]
    );
    if (!video) return res.status(404).json({ error: 'Video not found' });
    const settings = await fetchPlayerSettings(req.params.id);
    return res.json({ settings });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────
// PATCH /api/videos/:id/player-settings
//
// Upserts ALL player settings in one shot.
// The frontend always sends the full settings object on any toggle change.
// ─────────────────────────────────────────────────────────────────────────

// Coerce null → undefined so DB nulls in boolean columns never fail validation
const nullBool = z.boolean().nullish().transform(v => v ?? undefined);

const playerSettingsSchema = z.object({
  autoplay              : nullBool,
  autoplay_muted        : nullBool,
  start_muted           : nullBool,
  show_seek_bar         : nullBool,
  show_play_pause_btn   : nullBool,
  show_playback_speed   : nullBool,
  show_fullscreen_btn   : nullBool,
  show_volume_control   : nullBool,
  show_rewind_forward   : nullBool,
  resume_playback       : nullBool,
  loop                  : nullBool,
  accent_color          : z.string().regex(/^#[0-9a-fA-F]{6}$/).nullish().transform(v => v ?? undefined),
});

router.patch('/:id/player-settings', requireAuth, async (req, res, next) => {
  try {
    const parseResult = playerSettingsSchema.safeParse(req.body);
    if (!parseResult.success) {
      const fieldErrors = parseResult.error.flatten().fieldErrors;
      logger.error(`[player-settings] validation failed for video ${req.params.id}: ${JSON.stringify(fieldErrors)}`);
      return res.status(400).json({ error: 'Validation failed', message: 'Invalid settings values', fields: fieldErrors });
    }

    // Owner OR admin can edit settings — admins manage promotion videos
    // which they may not own directly. (is_active not required.)
    const isAdmin = req.user.role === 'admin' || req.user.plan === 'admin_lifetime';
    const { rows: [video] } = await pool.query(
      `SELECT id FROM videos WHERE id=$1 AND (user_id=$2 OR $3::boolean)`,
      [req.params.id, req.user.id, isAdmin]
    );
    if (!video) return res.status(404).json({ error: 'Video not found', message: 'Video not found' });

    // Merge incoming with current defaults, then upsert the full row
    const existing = await fetchPlayerSettings(req.params.id);
    const merged   = { ...existing, ...parseResult.data };
    if (!merged.accent_color) merged.accent_color = PLAYER_DEFAULTS.accent_color;

    // Note: no user_id in INSERT — CHECK constraint forbids video_id + user_id both non-null.
    await pool.query(
      `INSERT INTO video_player_settings
         (video_id, autoplay, autoplay_muted, start_muted, show_seek_bar,
          show_play_pause_btn, show_playback_speed, show_fullscreen_btn,
          show_volume_control, show_rewind_forward, resume_playback, loop, accent_color)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       ON CONFLICT (video_id) DO UPDATE SET
         autoplay              = EXCLUDED.autoplay,
         autoplay_muted        = EXCLUDED.autoplay_muted,
         start_muted           = EXCLUDED.start_muted,
         show_seek_bar         = EXCLUDED.show_seek_bar,
         show_play_pause_btn   = EXCLUDED.show_play_pause_btn,
         show_playback_speed   = EXCLUDED.show_playback_speed,
         show_fullscreen_btn   = EXCLUDED.show_fullscreen_btn,
         show_volume_control   = EXCLUDED.show_volume_control,
         show_rewind_forward   = EXCLUDED.show_rewind_forward,
         resume_playback       = EXCLUDED.resume_playback,
         loop                  = EXCLUDED.loop,
         accent_color          = EXCLUDED.accent_color,
         updated_at            = NOW()`,
      [
        req.params.id,
        merged.autoplay, merged.autoplay_muted, merged.start_muted,
        merged.show_seek_bar, merged.show_play_pause_btn, merged.show_playback_speed,
        merged.show_fullscreen_btn, merged.show_volume_control, merged.show_rewind_forward,
        merged.resume_playback, merged.loop, merged.accent_color,
      ]
    );

    return res.json({ settings: merged });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────
// GET /api/videos/:id/analytics/daily
//
// Daily time-series for a single metric.
// Query params:
//   metric  — plays | viewers | avg_watch | completions | watch_seconds
//   from    — ISO date string (default: video created_at)
//   to      — ISO date string (default: today)
//
// Response: { data: [{ date, value }], total }
// ─────────────────────────────────────────────────────────────────────────

const DAILY_METRICS = {
  // All sessions where the embed loaded (page loads, regardless of play)
  total_views: `
    SELECT DATE_TRUNC('day', started_at AT TIME ZONE 'UTC')::date AS date,
           COUNT(*) AS value
    FROM   analytics_sessions
    WHERE  video_id = $1 AND started_at BETWEEN $2 AND $3
    GROUP  BY 1 ORDER BY 1`,

  // Distinct cookies that loaded the embed page (regardless of play)
  unique_views: `
    SELECT DATE_TRUNC('day', started_at AT TIME ZONE 'UTC')::date AS date,
           COUNT(DISTINCT viewer_id) AS value
    FROM   analytics_sessions
    WHERE  video_id = $1 AND started_at BETWEEN $2 AND $3
    GROUP  BY 1 ORDER BY 1`,

  // Sessions where play was pressed (one count per session even if replayed)
  plays: `
    SELECT DATE_TRUNC('day', started_at AT TIME ZONE 'UTC')::date AS date,
           COUNT(*) FILTER (WHERE play_count > 0) AS value
    FROM   analytics_sessions
    WHERE  video_id = $1 AND started_at BETWEEN $2 AND $3
    GROUP  BY 1 ORDER BY 1`,

  // Alias for plays — kept for backward compat
  total_viewers: `
    SELECT DATE_TRUNC('day', started_at AT TIME ZONE 'UTC')::date AS date,
           COUNT(*) FILTER (WHERE play_count > 0) AS value
    FROM   analytics_sessions
    WHERE  video_id = $1 AND started_at BETWEEN $2 AND $3
    GROUP  BY 1 ORDER BY 1`,

  // Distinct cookies that PRESSED PLAY at least once (not just loaded)
  viewers: `
    SELECT DATE_TRUNC('day', started_at AT TIME ZONE 'UTC')::date AS date,
           COUNT(DISTINCT viewer_id) FILTER (WHERE play_count > 0) AS value
    FROM   analytics_sessions
    WHERE  video_id = $1 AND started_at BETWEEN $2 AND $3
    GROUP  BY 1 ORDER BY 1`,

  // Play rate = play sessions / total sessions × 100 (per day)
  play_rate: `
    SELECT DATE_TRUNC('day', started_at AT TIME ZONE 'UTC')::date AS date,
           CASE WHEN COUNT(*) > 0
             THEN ROUND(
               COUNT(*) FILTER (WHERE play_count > 0)::numeric
               / COUNT(*) * 100, 1)
             ELSE 0
           END AS value
    FROM   analytics_sessions
    WHERE  video_id = $1 AND started_at BETWEEN $2 AND $3
    GROUP  BY 1 ORDER BY 1`,

  avg_watch: `
    SELECT DATE_TRUNC('day', started_at AT TIME ZONE 'UTC')::date AS date,
           ROUND(AVG(max_watch_pct)::numeric, 1) AS value
    FROM   analytics_sessions
    WHERE  video_id = $1 AND started_at BETWEEN $2 AND $3 AND play_count > 0
    GROUP  BY 1 ORDER BY 1`,

  completions: `
    SELECT DATE_TRUNC('day', started_at AT TIME ZONE 'UTC')::date AS date,
           COUNT(*) FILTER (WHERE reached_end = TRUE AND play_count > 0) AS value
    FROM   analytics_sessions
    WHERE  video_id = $1 AND started_at BETWEEN $2 AND $3
    GROUP  BY 1 ORDER BY 1`,

  watch_seconds: `
    SELECT DATE_TRUNC('day', started_at AT TIME ZONE 'UTC')::date AS date,
           COALESCE(SUM(total_watch_seconds), 0) AS value
    FROM   analytics_sessions
    WHERE  video_id = $1 AND started_at BETWEEN $2 AND $3 AND play_count > 0
    GROUP  BY 1 ORDER BY 1`,
};

router.get('/:id/analytics/daily', requireAuth, async (req, res, next) => {
  try {
    const { rows: [video] } = await pool.query(
      `SELECT id, created_at FROM videos WHERE id=$1 AND (user_id=$2 OR $3::boolean) AND is_active=TRUE`,
      [req.params.id, req.user.id, await canViewNonOwner(req.params.id, req)]
    );
    if (!video) return res.status(404).json({ error: 'Video not found' });

    const metric = req.query.metric ?? 'plays';
    if (!DAILY_METRICS[metric]) {
      return res.status(400).json({ error: 'Invalid metric', valid: Object.keys(DAILY_METRICS) });
    }

    // Default from = video creation date, to = today
    const from = req.query.from
      ? new Date(req.query.from)
      : new Date(video.created_at);
    const to = req.query.to
      ? new Date(req.query.to + 'T23:59:59Z')
      : new Date();

    const { rows } = await pool.query(DAILY_METRICS[metric], [req.params.id, from, to]);

    const data = rows.map(r => ({ date: r.date, value: parseFloat(r.value) || 0 }));

    // avg_watch and play_rate should report the period average, not the sum across days
    const isAvgMetric = metric === 'avg_watch' || metric === 'play_rate';
    const total = data.length === 0 ? 0 : isAvgMetric
      ? data.reduce((s, r) => s + r.value, 0) / data.length
      : data.reduce((s, r) => s + r.value, 0);

    return res.json({ data, total: Math.round(total * 10) / 10 });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────
// GET /api/videos/:id/analytics/breakdown
//
// Categorical breakdowns: device, browser, country
// Query params:  by=device | browser | country
// Response: { data: [{ label, count, pct }] }
// ─────────────────────────────────────────────────────────────────────────

router.get('/:id/analytics/breakdown', requireAuth, async (req, res, next) => {
  try {
    const { rows: [video] } = await pool.query(
      `SELECT id FROM videos WHERE id=$1 AND (user_id=$2 OR $3::boolean) AND is_active=TRUE`,
      [req.params.id, req.user.id, await canViewNonOwner(req.params.id, req)]
    );
    if (!video) return res.status(404).json({ error: 'Video not found' });

    const by = req.query.by ?? 'device';

    const BREAKDOWN_COLS = {
      device      : `COALESCE(INITCAP(device_type::text), 'Unknown')`,
      browser     : `COALESCE(NULLIF(browser,''), 'Unknown')`,
      country     : `COALESCE(NULLIF(country_name,''), NULLIF(country_code,''), 'Unknown')`,
      city        : `COALESCE(NULLIF(city,''), 'Unknown')`,
      region      : `COALESCE(NULLIF(region,''), 'Unknown')`,
      utm_source  : `COALESCE(NULLIF(utm_source,''), '(none)')`,
      utm_medium  : `COALESCE(NULLIF(utm_medium,''), '(none)')`,
      utm_campaign: `COALESCE(NULLIF(utm_campaign,''), '(none)')`,
      utm_term    : `COALESCE(NULLIF(utm_term,''), '(none)')`,
      utm_content : `COALESCE(NULLIF(utm_content,''), '(none)')`,
      // Combined ad-attribution path for the "Lead Source" panel.
      // Meta-style mapping: campaign = utm_campaign, ad set = utm_term, ad = utm_content.
      // CONCAT_WS skips empty parts, so partial tagging still produces a useful label.
      campaign_ad : `COALESCE(NULLIF(CONCAT_WS(' › ', NULLIF(utm_campaign,''), NULLIF(utm_term,''), NULLIF(utm_content,'')), ''), '(none)')`,
      referrer    : `COALESCE(NULLIF(REGEXP_REPLACE(referrer_url, '^https?://([^/]+).*$', '\\1'), ''), '(direct)')`,
      domain      : `COALESCE(NULLIF(domain,''), '(direct)')`,
    };

    const col = BREAKDOWN_COLS[by];
    if (!col) {
      return res.status(400).json({ error: 'Invalid breakdown', valid: Object.keys(BREAKDOWN_COLS) });
    }

    // UTM and referrer breakdowns include sessions with 0 plays (page loads)
    // All other breakdowns filter to actual plays only
    const playFilter = ['utm_source','utm_medium','utm_campaign','utm_term','utm_content','campaign_ad','referrer','domain'].includes(by)
      ? ''
      : 'AND play_count > 0';

    const { rows } = await pool.query(
      `SELECT ${col} AS label,
              COUNT(*) AS count
       FROM   analytics_sessions
       WHERE  video_id = $1 ${playFilter}
       GROUP  BY 1
       ORDER  BY 2 DESC
       LIMIT  25`,
      [req.params.id]
    );

    const total = rows.reduce((s, r) => s + parseInt(r.count, 10), 0);
    const data  = rows.map(r => ({
      label: r.label,
      count: parseInt(r.count, 10),
      pct  : total > 0 ? parseFloat((parseInt(r.count, 10) / total * 100).toFixed(1)) : 0,
    }));

    return res.json({ data, total });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────
// GET /api/videos/:id/cta-analytics
//
// CTA click analytics: total clicks, per-link breakdown, device/browser/
// country breakdown from analytics_events metadata JSONB.
// Pro plan only. Returns 200 with empty data if no clicks yet.
//
// Response:
//   { total_clicks, by_link: [{cta_name, clicks, pct}],
//     by_device: [{label, count, pct}],
//     by_browser: [{label, count, pct}],
//     by_country: [{label, count, pct}] }
// ─────────────────────────────────────────────────────────────────────────

router.get('/:id/cta-analytics', requireAuth, planGate('heatmap'), async (req, res, next) => {
  try {
    const { rows: [video] } = await pool.query(
      `SELECT id FROM videos WHERE id=$1 AND (user_id=$2 OR $3::boolean) AND is_active=TRUE`,
      [req.params.id, req.user.id, await canViewNonOwner(req.params.id, req)]
    );
    if (!video) return res.status(404).json({ error: 'Video not found' });

    // All CTA click logs for this video — from the independent cta_click_logs
    // table (decoupled from the video library / analytics_events).
    const { rows: events } = await pool.query(
      `SELECT cta_name, device, browser, country
       FROM   cta_click_logs
       WHERE  video_id = $1
       ORDER  BY occurred_at DESC
       LIMIT  5000`,
      [req.params.id]
    );

    const total = events.length;
    if (total === 0) {
      return res.json({ total_clicks: 0, by_link: [], by_device: [], by_browser: [], by_country: [] });
    }

    function breakdownFrom(key, fallback = 'Unknown') {
      const counts = {};
      events.forEach(e => {
        const v = e[key] || fallback;
        counts[v] = (counts[v] || 0) + 1;
      });
      return Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15)
        .map(([label, count]) => ({ label, count, pct: parseFloat((count / total * 100).toFixed(1)) }));
    }

    const byLink = breakdownFrom('cta_name', '(unnamed)');
    const byDevice = breakdownFrom('device', 'Unknown');
    const byBrowser = breakdownFrom('browser', 'Unknown');
    const byCountry = breakdownFrom('country', 'Unknown');

    return res.json({
      total_clicks: total,
      by_link     : byLink,
      by_device   : byDevice,
      by_browser  : byBrowser,
      by_country  : byCountry,
    });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────
// GET /api/videos/:id/retention
//
// Returns a viewer retention curve computed from heatmap aggregate data.
// For each second bucket: what % of the maximum-viewer second is still watching.
//
// Response: { data: [{ second, pct }], duration_seconds, total_viewers }
// ─────────────────────────────────────────────────────────────────────────

router.get('/:id/retention', requireAuth, async (req, res, next) => {
  try {
    const { rows: [video] } = await pool.query(
      `SELECT v.id,
              v.duration_seconds,
              (SELECT COUNT(DISTINCT s.viewer_id)
               FROM   analytics_sessions s
               WHERE  s.video_id   = v.id
                 AND  s.play_count > 0) AS unique_viewers
       FROM   videos v
       WHERE  v.id = $1 AND (v.user_id = $2 OR $3::boolean) AND v.is_active = TRUE`,
      [req.params.id, req.user.id, await canViewNonOwner(req.params.id, req)]
    );
    if (!video) return res.status(404).json({ error: 'Video not found' });

    const { rows: heatmap } = await pool.query(
      `SELECT second_bucket, first_watches + replays AS total
       FROM   analytics_heatmap_aggregate
       WHERE  video_id = $1
       ORDER  BY second_bucket ASC`,
      [req.params.id]
    );

    if (heatmap.length === 0) {
      return res.json({ data: [], duration_seconds: video.duration_seconds, total_viewers: Number(video.unique_viewers) || 0 });
    }

    // Max viewers at any second = the peak (usually the very first second)
    const maxViewers = Math.max(...heatmap.map(r => parseInt(r.total, 10)), 1);

    const data = heatmap.map(r => ({
      second: parseInt(r.second_bucket, 10),
      pct   : Math.min(100, Math.round(parseInt(r.total, 10) / maxViewers * 100)),
    }));

    let durationSeconds = video.duration_seconds ? parseFloat(video.duration_seconds) : null;
    if (!durationSeconds && heatmap.length > 0) {
      durationSeconds = Math.max(...heatmap.map(r => r.second_bucket)) + 5;
    }

    return res.json({ data, duration_seconds: durationSeconds, total_viewers: Number(video.unique_viewers) || 0 });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────
// GET /api/videos/:id/viewer-engagement
//
// Individual viewer engagement rows. Pro plan only.
// Returns the last 60 sessions with their watch intervals bucketed for
// a per-viewer timeline visualisation.
//
// Response: { sessions: [{ id, viewer_num, date, device, country, city,
//   max_watch_pct, play_count, reached_end, segments: [[start_pct, end_pct, pass]] }],
//   duration_seconds }
// ─────────────────────────────────────────────────────────────────────────

router.get('/:id/viewer-engagement', requireAuth, planGate('heatmap'), async (req, res, next) => {
  try {
    const { rows: [video] } = await pool.query(
      `SELECT id, duration_seconds
       FROM   videos
       WHERE  id = $1 AND (user_id = $2 OR $3::boolean) AND is_active = TRUE`,
      [req.params.id, req.user.id, await canViewNonOwner(req.params.id, req)]
    );
    if (!video) return res.status(404).json({ error: 'Video not found' });

    const durationSeconds = video.duration_seconds ? parseFloat(video.duration_seconds) : null;

    // Fetch last 60 sessions (most recent first)
    const { rows: sessions } = await pool.query(
      `SELECT s.id,
              ROW_NUMBER() OVER (ORDER BY s.started_at DESC) AS viewer_num,
              s.started_at,
              s.device_type,
              s.browser,
              s.country_name,
              s.city,
              s.max_watch_pct,
              s.play_count,
              s.reached_end
       FROM   analytics_sessions s
       WHERE  s.video_id = $1
       ORDER  BY s.started_at DESC
       LIMIT  60`,
      [req.params.id]
    );

    if (sessions.length === 0) {
      return res.json({ sessions: [], duration_seconds: durationSeconds });
    }

    const sessionIds = sessions.map(s => s.id);

    // Fetch all watch intervals for these sessions
    const { rows: intervals } = await pool.query(
      `SELECT session_id, start_second, end_second, watch_pass
       FROM   analytics_watch_intervals
       WHERE  session_id = ANY($1::uuid[])
       ORDER  BY session_id, start_second`,
      [sessionIds]
    );

    // Group intervals by session_id
    const intervalMap = {};
    for (const iv of intervals) {
      if (!intervalMap[iv.session_id]) intervalMap[iv.session_id] = [];
      intervalMap[iv.session_id].push(iv);
    }

    const dur = durationSeconds || 1;

    const result = sessions.map(s => {
      const ivs = intervalMap[s.id] || [];
      // Convert absolute seconds to [start_pct, end_pct, watch_pass] for the frontend
      const segments = ivs.map(iv => [
        Math.min(100, (parseFloat(iv.start_second) / dur) * 100),
        Math.min(100, (parseFloat(iv.end_second)   / dur) * 100),
        iv.watch_pass,
      ]).filter(([a, b]) => b > a);

      // Fallback: if no intervals stored but max_watch_pct > 0, synthesise a segment
      if (segments.length === 0 && parseFloat(s.max_watch_pct) > 0) {
        segments.push([0, parseFloat(s.max_watch_pct), 1]);
      }

      return {
        id          : s.id,
        viewer_num  : parseInt(s.viewer_num, 10),
        date        : s.started_at,
        device      : s.device_type || 'unknown',
        browser     : s.browser,
        country     : s.country_name,
        city        : s.city,
        max_watch_pct: parseFloat(s.max_watch_pct) || 0,
        play_count  : parseInt(s.play_count, 10) || 0,
        reached_end : s.reached_end,
        segments,
      };
    });

    return res.json({ sessions: result, duration_seconds: durationSeconds });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
