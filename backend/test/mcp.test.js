'use strict';

/**
 * Tests for the internal MCP endpoint (src/mcp/index.js).
 * Run: npm test   (node:test, no database: the db is a stub)
 */

process.env.APP_URL      = process.env.APP_URL      || 'https://app.example.test';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgres://stub:stub@127.0.0.1:1/stub';
process.env.LOG_LEVEL    = 'error';

const { test, before, after } = require('node:test');
const assert  = require('node:assert/strict');
const express = require('express');
const { z }   = require('zod');
const { createMcpRouter } = require('../src/mcp');

const SECRET = 'test-secret-0123456789';
const VIDEO  = '11111111-1111-4111-8111-111111111111';

const USERS = {
  'free@example.test'   : { id: 'u-free',    email: 'free@example.test',    role: 'subscriber', is_active: true,  plan_expires_at: null, plan: 'free' },
  'starter@example.test': { id: 'u-starter', email: 'starter@example.test', role: 'subscriber', is_active: true,  plan_expires_at: null, plan: 'starter' },
  'gone@example.test'   : { id: 'u-gone',    email: 'gone@example.test',    role: 'subscriber', is_active: false, plan_expires_at: null, plan: 'pro' },
};

const db = {
  async query(sql, params) {
    if (sql.includes('FROM   users u')) return { rows: USERS[params[0]] ? [USERS[params[0]]] : [] };
    if (sql.includes('COUNT(*) AS video_count')) return { rows: [{ video_count: params[0] === 'u-free' ? '1' : '0' }] };
    if (sql.includes('FROM   videos v')) {
      return { rows: [{ id: VIDEO, title: 'VSL', duration_seconds: 100, total_plays: 10, avg_watch_pct: 40, total_players: 4, created_at: new Date() }] };
    }
    if (sql.includes('AS bucket')) return { rows: [{ bucket: 10, cnt: 2 }, { bucket: 100, cnt: 2 }] };
    if (sql.includes('played_sessions')) {
      return { rows: [{ play_rate_pct: 50, completed_views: 2, total_watch_seconds_sum: 200, unique_viewers_who_played: 4, played_sessions: 4 }] };
    }
    throw new Error('unexpected query: ' + sql.slice(0, 60));
  },
};

let created = 0;
const quiet = { info() {}, warn() {}, error() {}, debug() {} };
let secret = SECRET;
let server, base;

before(async () => {
  const app = express();
  app.use(express.json());
  app.use('/mcp-internal', createMcpRouter({
    db,
    logger           : quiet,
    getSecret        : () => secret,
    appUrl           : 'https://app.example.test',
    createVideoSchema: z.object({ url: z.string().url(), title: z.string().optional() }),
    createVideo      : async () => { created++; return { id: VIDEO, title: 'x', source_type: 'youtube', processing_status: 'completed' }; },
  }));
  await new Promise(r => { server = app.listen(0, '127.0.0.1', r); });
  base = `http://127.0.0.1:${server.address().port}/mcp-internal`;
});

after(() => new Promise(r => server.close(r)));

async function rpc(body, headers = {}) {
  const res = await fetch(base, {
    method : 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream', ...headers },
    body   : JSON.stringify({ jsonrpc: '2.0', id: 1, ...body }),
  });
  const text = await res.text();
  return { status: res.status, json: text ? JSON.parse(text) : null };
}

async function callTool(name, args, email) {
  const r = await rpc({ method: 'tools/call', params: { name, arguments: args } },
    { 'x-service-secret': SECRET, ...(email ? { 'x-user-email': email } : {}) });
  assert.equal(r.status, 200);
  const result = r.json.result;
  return { isError: !!result.isError, data: JSON.parse(result.content[0].text) };
}

// ── auth rejection ─────────────────────────────────────────────────────────

test('rejects a request without X-Service-Secret', async () => {
  const r = await rpc({ method: 'tools/list' });
  assert.equal(r.status, 401);
  assert.equal(r.json.error.message, 'unauthorized');
});

test('rejects a wrong X-Service-Secret', async () => {
  const r = await rpc({ method: 'tools/list' }, { 'x-service-secret': 'nope' });
  assert.equal(r.status, 401);
});

test('rejects everything when GATEWAY_SERVICE_SECRET is unset', async () => {
  secret = null;
  try {
    const r = await rpc({ method: 'tools/list' }, { 'x-service-secret': '' });
    assert.equal(r.status, 401);
    const r2 = await rpc({ method: 'tools/list' }, { 'x-service-secret': 'null' });
    assert.equal(r2.status, 401);
  } finally { secret = SECRET; }
});

test('GET is not allowed (stateless server)', async () => {
  const res = await fetch(base, { headers: { 'x-service-secret': SECRET } });
  assert.equal(res.status, 405);
});

// ── tool list ──────────────────────────────────────────────────────────────

test('lists all 8 tools with annotations', async () => {
  const r = await rpc({ method: 'tools/list' }, { 'x-service-secret': SECRET });
  assert.equal(r.status, 200);
  const tools = r.json.result.tools;
  assert.deepEqual(tools.map(t => t.name).sort(), [
    'add_video', 'compare_videos', 'get_dropoff_points', 'get_embed_snippet',
    'get_entitlement', 'get_retention_curve', 'get_video_summary', 'list_videos',
  ]);
  for (const t of tools) {
    assert.ok(t.description, `${t.name} has a description`);
    assert.equal(typeof t.annotations.readOnlyHint, 'boolean', `${t.name} readOnlyHint`);
    assert.equal(typeof t.annotations.destructiveHint, 'boolean', `${t.name} destructiveHint`);
    assert.equal(t.annotations.readOnlyHint, t.name !== 'add_video');
  }
});

// ── no_account ─────────────────────────────────────────────────────────────

test('unknown email returns no_account', async () => {
  const r = await callTool('get_entitlement', {}, 'nobody@example.test');
  assert.equal(r.isError, true);
  assert.equal(r.data.error, 'no_account');
});

test('missing X-User-Email returns no_account', async () => {
  const r = await callTool('list_videos', {});
  assert.equal(r.data.error, 'no_account');
});

test('deactivated account returns no_account', async () => {
  const r = await callTool('get_entitlement', {}, 'gone@example.test');
  assert.equal(r.data.error, 'no_account');
});

test('email match is case-insensitive', async () => {
  const r = await callTool('get_entitlement', {}, 'Starter@Example.TEST');
  assert.equal(r.isError, false);
  assert.deepEqual(r.data, { active: true, plan: 'starter', plan_label: 'Starter' });
});

// ── plan_limit ─────────────────────────────────────────────────────────────

test('free plan: retention curve returns plan_limit needing starter', async () => {
  const r = await callTool('get_retention_curve', { video_id: VIDEO }, 'free@example.test');
  assert.equal(r.isError, true);
  assert.equal(r.data.error, 'plan_limit');
  assert.equal(r.data.required_plan, 'starter');
  assert.equal(r.data.current_plan, 'free');
});

test('free plan: drop-off points returns plan_limit needing starter', async () => {
  const r = await callTool('get_dropoff_points', { video_id: VIDEO }, 'free@example.test');
  assert.equal(r.data.error, 'plan_limit');
  assert.equal(r.data.required_plan, 'starter');
});

test('free plan at its video limit: add_video returns plan_limit and creates nothing', async () => {
  const before = created;
  const r = await callTool('add_video', { url: 'https://youtu.be/abc', title: 'T', confirm: true }, 'free@example.test');
  assert.equal(r.data.error, 'plan_limit');
  assert.equal(r.data.required_plan, 'starter');
  assert.equal(r.data.video_limit, 1);
  assert.equal(created, before);
});

test('free plan: summary hides avg watch time behind starter', async () => {
  const r = await callTool('get_video_summary', { video_id: VIDEO }, 'free@example.test');
  assert.equal(r.isError, false);
  assert.equal(r.data.plays, 10);
  assert.equal(r.data.completion_rate, 50);
  assert.deepEqual(r.data.locked, { avg_watch_time: 'starter' });
  assert.equal(r.data.avg_watch_seconds, undefined);
});

// ── happy paths ────────────────────────────────────────────────────────────

test('starter plan: retention curve is at most 50 points and falls', async () => {
  const r = await callTool('get_retention_curve', { video_id: VIDEO }, 'starter@example.test');
  assert.equal(r.isError, false);
  assert.ok(r.data.points.length <= 50);
  assert.equal(r.data.points[0].pct, 100);
  for (let i = 1; i < r.data.points.length; i++) assert.ok(r.data.points[i].pct <= r.data.points[i - 1].pct);
});

test('starter plan: drop-off points are top 5, biggest first', async () => {
  const r = await callTool('get_dropoff_points', { video_id: VIDEO }, 'starter@example.test');
  assert.ok(r.data.dropoffs.length <= 5);
  assert.deepEqual(r.data.dropoffs[0], { second: 11, pct_lost: 50 });
});

test('add_video without confirm=true writes nothing', async () => {
  const before = created;
  const r = await callTool('add_video', { url: 'https://youtu.be/abc', title: 'T', confirm: false }, 'starter@example.test');
  assert.equal(r.data.error, 'confirmation_required');
  assert.equal(created, before);
});

test('add_video with confirm=true under the limit creates the video', async () => {
  const before = created;
  const r = await callTool('add_video', { url: 'https://youtu.be/abc', title: 'T', confirm: true }, 'starter@example.test');
  assert.equal(r.isError, false);
  assert.equal(r.data.video.id, VIDEO);
  assert.equal(created, before + 1);
});

test('embed snippet points at the app origin', async () => {
  const r = await callTool('get_embed_snippet', { video_id: VIDEO }, 'free@example.test');
  assert.ok(r.data.html.includes(`https://app.example.test/embed/${VIDEO}`));
});
