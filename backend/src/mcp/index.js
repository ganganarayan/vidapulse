'use strict';

/**
 * Internal MCP endpoint: POST /mcp-internal (Streamable HTTP, stateless).
 *
 * NOT public. Every request must carry X-Service-Secret equal to
 * GATEWAY_SERVICE_SECRET (timing-safe compare); anything else gets a 401
 * before the MCP layer runs. Unset secret = every call rejected (fails closed).
 *
 * The gateway names the end user with X-User-Email. Tool calls resolve that
 * email to an active VidaPulse account; none found = tool error "no_account".
 * tools/list needs only the secret.
 *
 * Plan limits reuse middleware/planGate.js (PLAN_RANK, FEATURE_PLAN_REQUIREMENTS,
 * checkVideoLimit). A gated tool returns tool error "plan_limit" with the
 * plan needed. Analytics reuse services/videoAnalytics.js, so the numbers match
 * the dashboard. Only the caller's own videos are visible.
 *
 * createMcpRouter(deps) takes its collaborators so tests can pass fakes.
 */

const express = require('express');
const crypto  = require('crypto');
const { z }   = require('zod');
const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { StreamableHTTPServerTransport } = require('@modelcontextprotocol/sdk/server/streamableHttp.js');

const { PLAN_RANK, FEATURE_PLAN_REQUIREMENTS, checkVideoLimit } = require('../middleware/planGate');
const va = require('../services/videoAnalytics');

const PLAN_LABEL = { free: 'Free', starter: 'Starter', pro: 'Growth', admin_lifetime: 'Admin' };

// ── helpers ────────────────────────────────────────────────────────────────

function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || !a || !b) return false;
  const ha = crypto.createHash('sha256').update(a).digest();
  const hb = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
}

const ok   = (data) => ({ content: [{ type: 'text', text: JSON.stringify(data) }] });
const fail = (data) => ({ isError: true, content: [{ type: 'text', text: JSON.stringify(data) }] });

const num = (v, d = 1) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  const f = 10 ** d;
  return Math.round(n * f) / f;
};

/** null when the user's plan includes the feature, else the plan_limit error body. */
function planLimit(user, feature) {
  if (user.plan === 'admin_lifetime') return null;
  const required = FEATURE_PLAN_REQUIREMENTS[feature] ?? null;
  if (!required) return null;
  if ((PLAN_RANK[user.plan] ?? 0) >= (PLAN_RANK[required] ?? 99)) return null;
  return {
    error              : 'plan_limit',
    feature,
    required_plan      : required,
    required_plan_label: PLAN_LABEL[required] || required,
    current_plan       : user.plan,
  };
}

async function findUserByEmail(db, email) {
  const { rows: [u] } = await db.query(
    `SELECT u.id, u.email, u.role, u.is_active, u.plan_expires_at,
            COALESCE(p.name::text, 'free') AS plan
     FROM   users u
     LEFT JOIN plans p ON p.id = u.plan_id
     WHERE  LOWER(u.email) = $1
     LIMIT  1`,
    [email]
  );
  return u && u.is_active ? u : null;
}

async function getOwnedVideo(db, userId, videoId) {
  const { rows: [v] } = await db.query(
    `SELECT v.id, v.title, v.duration_seconds, v.total_plays, v.avg_watch_pct, v.created_at,
            (SELECT COUNT(*) FROM analytics_sessions s
              WHERE s.video_id = v.id AND s.play_count > 0) AS total_players
     FROM   videos v
     WHERE  v.id = $1 AND v.user_id = $2 AND v.is_active = TRUE`,
    [videoId, userId]
  );
  return v || null;
}

/** Summary metrics; avg watch time is held back below Starter (avg_time_watched). */
async function videoSummary(db, user, video) {
  const s       = (await va.getSessionStats(db, video.id)) || {};
  const played  = Number(s.played_sessions) || 0;
  const out = {
    id             : video.id,
    title          : video.title,
    plays          : Number(video.total_plays) || 0,
    completion_rate: played ? num((Number(s.completed_views) / played) * 100) : 0,
  };
  const lock = planLimit(user, 'avg_time_watched');
  if (lock) {
    out.locked = { avg_watch_time: lock.required_plan };
  } else {
    out.avg_watch_seconds = played ? num(Number(s.total_watch_seconds_sum) / played) : 0;
    out.avg_watch_pct     = num(video.avg_watch_pct);
  }
  return out;
}

async function retentionCurve(db, video) {
  const duration = video.duration_seconds ? parseFloat(video.duration_seconds) : null;
  const rows     = await va.getMaxPctCounts(db, video.id);
  return { duration, curve: va.buildRetentionCurve(rows, video.total_players, duration) };
}

const videoId = z.string().uuid().describe('Video id (UUID) from list_videos');

// ── server ─────────────────────────────────────────────────────────────────

function buildServer(deps, ctx) {
  const { db, logger } = deps;
  const server = new McpServer({ name: 'vidapulse-internal', version: '1.0.0' });

  let userPromise = null;
  const resolveUser = () => {
    if (!userPromise) userPromise = ctx.email ? findUserByEmail(db, ctx.email) : Promise.resolve(null);
    return userPromise;
  };

  /** Wrap a tool: resolve the account, log, turn unexpected errors into a compact error. */
  const withUser = (name, fn) => async (args) => {
    let user;
    try { user = await resolveUser(); }
    catch (err) {
      logger.error(`[mcp] user lookup failed: ${err.message}`);
      return fail({ error: 'internal_error' });
    }
    if (!user) return fail({ error: 'no_account' });
    logger.info(`[mcp] ${name} by user ${user.id}`);
    try { return await fn(user, args || {}); }
    catch (err) {
      logger.error(`[mcp] ${name} failed for user ${user.id}: ${err.message}`);
      return fail({ error: 'internal_error' });
    }
  };

  const READ = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false };

  server.registerTool('get_entitlement', {
    title      : 'Get entitlement',
    description: 'The caller\'s VidaPulse plan. Returns {active, plan, plan_label}. active is false when the paid period has expired.',
    inputSchema: {},
    annotations: READ,
  }, withUser('get_entitlement', async (user) => {
    const active = !user.plan_expires_at || new Date(user.plan_expires_at) > new Date();
    return ok({ active, plan: user.plan, plan_label: PLAN_LABEL[user.plan] || user.plan });
  }));

  server.registerTool('list_videos', {
    title      : 'List videos',
    description: 'The caller\'s active (non-archived) videos, newest first, max 100. Returns {videos:[{id,title,plays,created_at}]}.',
    inputSchema: {},
    annotations: READ,
  }, withUser('list_videos', async (user) => {
    const { rows } = await db.query(
      `SELECT id, title, total_plays, created_at
       FROM   videos
       WHERE  user_id = $1 AND is_active = TRUE AND is_archived = FALSE
       ORDER  BY created_at DESC
       LIMIT  100`,
      [user.id]
    );
    return ok({
      videos: rows.map(r => ({
        id: r.id, title: r.title, plays: Number(r.total_plays) || 0,
        created_at: r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at,
      })),
    });
  }));

  server.registerTool('get_video_summary', {
    title      : 'Get video summary',
    description: 'Headline metrics for one video: plays, completion_rate (% of players who reached the end), avg_watch_seconds and avg_watch_pct. On the Free plan avg watch time is omitted and listed under locked with the plan needed.',
    inputSchema: { video_id: videoId },
    annotations: READ,
  }, withUser('get_video_summary', async (user, { video_id }) => {
    const video = await getOwnedVideo(db, user.id, video_id);
    if (!video) return fail({ error: 'not_found' });
    return ok(await videoSummary(db, user, video));
  }));

  server.registerTool('get_retention_curve', {
    title      : 'Get retention curve',
    description: 'Audience retention for one video: % of players still watching at each point, at most 50 points from start to end. Returns {duration_seconds, players, points:[{second,pct}]}. Starter plan or above.',
    inputSchema: { video_id: videoId },
    annotations: READ,
  }, withUser('get_retention_curve', async (user, { video_id }) => {
    const lock = planLimit(user, 'heatmap');
    if (lock) return fail(lock);
    const video = await getOwnedVideo(db, user.id, video_id);
    if (!video) return fail({ error: 'not_found' });
    const { duration, curve } = await retentionCurve(db, video);
    return ok({
      duration_seconds: duration,
      players         : Number(video.total_players) || 0,
      points          : va.downsample(curve, 50).map(p => ({ second: num(p.second), pct: p.pct })),
    });
  }));

  server.registerTool('get_dropoff_points', {
    title      : 'Get drop-off points',
    description: 'The 5 moments where the most viewers leave one video, biggest first. Returns {dropoffs:[{second, pct_lost}]}; pct_lost is percentage points of the audience lost at that moment. Starter plan or above.',
    inputSchema: { video_id: videoId },
    annotations: READ,
  }, withUser('get_dropoff_points', async (user, { video_id }) => {
    const lock = planLimit(user, 'heatmap');
    if (lock) return fail(lock);
    const video = await getOwnedVideo(db, user.id, video_id);
    if (!video) return fail({ error: 'not_found' });
    const { duration, curve } = await retentionCurve(db, video);
    return ok({ duration_seconds: duration, dropoffs: va.topDropoffs(curve, 5) });
  }));

  server.registerTool('compare_videos', {
    title      : 'Compare two videos',
    description: 'get_video_summary metrics for two videos side by side. Returns {a:{...}, b:{...}}.',
    inputSchema: { video_id_a: videoId, video_id_b: videoId },
    annotations: READ,
  }, withUser('compare_videos', async (user, { video_id_a, video_id_b }) => {
    const [va1, vb1] = await Promise.all([
      getOwnedVideo(db, user.id, video_id_a),
      getOwnedVideo(db, user.id, video_id_b),
    ]);
    if (!va1 || !vb1) return fail({ error: 'not_found', missing: [!va1 && video_id_a, !vb1 && video_id_b].filter(Boolean) });
    const [a, b] = await Promise.all([videoSummary(db, user, va1), videoSummary(db, user, vb1)]);
    return ok({ a, b });
  }));

  server.registerTool('get_embed_snippet', {
    title      : 'Get embed snippet',
    description: 'The HTML embed code for one video (script-free responsive iframe, same as the dashboard\'s "Copy embed code"). Returns {video_id, html}.',
    inputSchema: { video_id: videoId },
    annotations: READ,
  }, withUser('get_embed_snippet', async (user, { video_id }) => {
    const lock = planLimit(user, 'embed_code');
    if (lock) return fail(lock);
    const video = await getOwnedVideo(db, user.id, video_id);
    if (!video) return fail({ error: 'not_found' });
    return ok({ video_id: video.id, html: va.embedSnippet(video.id, deps.appUrl) });
  }));

  server.registerTool('add_video', {
    title      : 'Add video',
    description: 'Adds a video (by public URL) to the caller\'s account so VidaPulse tracks it. Writes data: call with confirm=true only after the user has approved. Fails with plan_limit when the plan\'s video limit is reached. Returns {video:{id,title,source_type,processing_status}}.',
    inputSchema: {
      url    : z.string().max(2000).describe('Public video URL (YouTube, Vimeo, Loom, MP4, ...)'),
      title  : z.string().min(1).max(500).describe('Title shown in VidaPulse'),
      confirm: z.boolean().describe('Must be true; the user has approved adding this video'),
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  }, withUser('add_video', async (user, { url, title, confirm }) => {
    if (confirm !== true) return fail({ error: 'confirmation_required', message: 'Call again with confirm=true once the user approves.' });
    const parsed = deps.createVideoSchema.safeParse({ url, title });
    if (!parsed.success) return fail({ error: 'invalid_input', fields: parsed.error.flatten().fieldErrors });
    const denied = await deps.checkVideoLimit(db, user);
    if (denied) {
      return fail({ error: 'plan_limit', ...denied, required_plan_label: PLAN_LABEL[denied.required_plan] || denied.required_plan });
    }
    const v = await deps.createVideo(user.id, parsed.data);
    return ok({ video: { id: v.id, title: v.title, source_type: v.source_type, processing_status: v.processing_status } });
  }));

  return server;
}

// ── router ─────────────────────────────────────────────────────────────────

function defaultDeps() {
  const env    = require('../config/env');
  const videos = require('../routes/videos');
  return {
    db               : require('../config/database').pool,
    logger           : require('../config/logger'),
    getSecret        : () => env.GATEWAY_SERVICE_SECRET,
    appUrl           : env.APP_URL,
    checkVideoLimit,
    createVideo      : videos.createVideoForUser,
    createVideoSchema: videos.createVideoSchema,
  };
}

function rpcError(res, status, code, message) {
  return res.status(status).json({ jsonrpc: '2.0', error: { code, message }, id: null });
}

function createMcpRouter(overrides = {}) {
  const deps   = { ...defaultDeps(), ...overrides };
  const router = express.Router();

  // Service auth first, for every method.
  router.use((req, res, next) => {
    if (!safeEqual(req.get('x-service-secret'), deps.getSecret())) {
      deps.logger.warn(`[mcp] rejected: bad or missing X-Service-Secret from ${req.ip}`);
      return rpcError(res, 401, -32001, 'unauthorized');
    }
    next();
  });

  router.post('/', async (req, res) => {
    const email     = String(req.get('x-user-email') || '').trim().toLowerCase() || null;
    const server    = buildServer(deps, { email });
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
    res.on('close', () => { transport.close(); server.close(); });
    try {
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (err) {
      deps.logger.error(`[mcp] request failed: ${err.message}`);
      if (!res.headersSent) rpcError(res, 500, -32603, 'internal_error');
    }
  });

  // Stateless server: no SSE stream, no sessions to delete.
  router.all('/', (_req, res) => rpcError(res, 405, -32000, 'method_not_allowed'));

  return router;
}

module.exports = { createMcpRouter, planLimit, PLAN_LABEL };
