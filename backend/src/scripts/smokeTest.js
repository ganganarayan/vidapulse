#!/usr/bin/env node
'use strict';

/**
 * VidaPulse — End-to-End Smoke Test  (Step 17)
 *
 * Validates the critical API surface without a test framework.
 * Run with:  node src/scripts/smokeTest.js
 *
 * Environment variables (optional):
 *   BASE_URL   — defaults to http://localhost:3001
 *   TEST_JWT   — a valid JWT cookie value; enables authenticated test cases
 *   ADMIN_JWT  — a valid admin JWT; enables admin-route test cases
 *
 * Exit codes:
 *   0 — all checks passed
 *   1 — one or more checks failed
 */

const BASE_URL  = process.env.BASE_URL  || 'http://localhost:3001';
const TEST_JWT  = process.env.TEST_JWT  || '';
const ADMIN_JWT = process.env.ADMIN_JWT || '';

// ─────────────────────────────────────────────────────────────────────────
// Tiny test harness
// ─────────────────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function ok(name, condition, detail = '') {
  if (condition) {
    console.log(`  ✓  ${name}`);
    passed++;
  } else {
    console.error(`  ✗  ${name}${detail ? `  →  ${detail}` : ''}`);
    failed++;
  }
}

async function get(path, cookieJwt = '') {
  const headers = { 'Accept': 'application/json' };
  if (cookieJwt) headers['Cookie'] = `vp_token=${cookieJwt}`;
  const res = await fetch(`${BASE_URL}${path}`, { headers });
  let body = {};
  try { body = await res.json(); } catch { /* non-JSON */ }
  return { status: res.status, body };
}

async function post(path, payload = {}, cookieJwt = '') {
  const headers = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
  if (cookieJwt) headers['Cookie'] = `vp_token=${cookieJwt}`;
  const res = await fetch(`${BASE_URL}${path}`, {
    method : 'POST',
    headers,
    body   : JSON.stringify(payload),
  });
  let body = {};
  try { body = await res.json(); } catch { /* non-JSON */ }
  return { status: res.status, body };
}

// ─────────────────────────────────────────────────────────────────────────
// Test suites
// ─────────────────────────────────────────────────────────────────────────

async function testPublicRoutes() {
  console.log('\n── Public routes ─────────────────────────────────────────');

  // Health
  const health = await get('/api/health');
  ok('GET /api/health → 200',          health.status === 200);
  ok('Health body has status field',   health.body?.status != null);

  // Unknown route → 404
  const unknown = await get('/api/does-not-exist');
  ok('GET /api/unknown → 404',         unknown.status === 404);
  ok('404 body has error field',       unknown.body?.error != null);
}

async function testAuthGuards() {
  console.log('\n── Auth guards (no cookie) ────────────────────────────────');

  const routes = [
    '/api/user/me',
    '/api/videos',
    '/api/admin/webhook-settings',
    '/api/admin/onboarding-health',
  ];

  for (const route of routes) {
    const r = await get(route);
    ok(`GET ${route} without auth → 401`, r.status === 401);
  }
}

async function testAuthRouteValidation() {
  console.log('\n── Auth route input validation ────────────────────────────');

  // POST /api/auth/login — missing fields
  const loginNoBody = await post('/api/auth/login', {});
  ok('POST /api/auth/login empty body → 400',
    loginNoBody.status === 400);

  // POST /api/auth/login — bad email format
  const loginBadEmail = await post('/api/auth/login', {
    email   : 'not-an-email',
    password: 'anypassword',
  });
  ok('POST /api/auth/login invalid email → 400',
    loginBadEmail.status === 400);
}

async function testPlanGates() {
  if (!TEST_JWT) {
    console.log('\n── Plan gates (skipped — no TEST_JWT) ────────────────────');
    return;
  }

  console.log('\n── Plan gates (authenticated) ─────────────────────────────');

  // /api/videos/:id/heatmap without a Pro plan → 403
  // Use a fake UUID — will 404 or 403 depending on plan
  const heatmap = await get('/api/videos/00000000-0000-0000-0000-000000000000/heatmap', TEST_JWT);
  ok('GET /videos/:id/heatmap non-Pro → 403 or 404',
    heatmap.status === 403 || heatmap.status === 404,
    `got ${heatmap.status}`
  );
  if (heatmap.status === 403) {
    ok('Plan-gate 403 has structured error', heatmap.body?.error === 'plan_limit');
    ok('Plan-gate 403 has feature field',    heatmap.body?.feature === 'heatmap');
    ok('Plan-gate 403 has upgrade_url',      typeof heatmap.body?.upgrade_url === 'string');
  }
}

async function testVideoValidation() {
  if (!TEST_JWT) {
    console.log('\n── Video CRUD validation (skipped — no TEST_JWT) ─────────');
    return;
  }

  console.log('\n── Video CRUD validation ──────────────────────────────────');

  // POST /api/videos — missing url
  const noUrl = await post('/api/videos', {}, TEST_JWT);
  ok('POST /api/videos no URL → 400', noUrl.status === 400);

  // POST /api/videos — bad url
  const badUrl = await post('/api/videos', { url: 'not-a-url' }, TEST_JWT);
  ok('POST /api/videos invalid URL → 400', badUrl.status === 400);
}

async function testAnalyticsRoutes() {
  console.log('\n── Analytics ingestion (public) ───────────────────────────');

  // POST /api/analytics/session — missing video_id → 400
  const noVideoId = await post('/api/analytics/session', { viewer_cookie: 'vp-test-uuid' });
  ok('POST /api/analytics/session no video_id → 400',  noVideoId.status === 400);

  // POST /api/analytics/session — missing viewer_cookie → 400
  const noCookie = await post('/api/analytics/session', { video_id: '00000000-0000-0000-0000-000000000000' });
  ok('POST /api/analytics/session no viewer_cookie → 400', noCookie.status === 400);

  // POST /api/analytics/session — unknown video → 404
  const badVideo = await post('/api/analytics/session', {
    video_id     : '00000000-0000-0000-0000-000000000000',
    viewer_cookie: 'vp-smoke-test-viewer',
  });
  ok('POST /api/analytics/session unknown video → 404',  badVideo.status === 404);
  ok('404 response has error field',                     badVideo.body?.error != null);

  // POST /api/analytics/ping — always responds 200 (even with bad data)
  const ping = await post('/api/analytics/ping', {});
  ok('POST /api/analytics/ping always → 200',            ping.status === 200);
  ok('Ping response has ok field',                       ping.body?.ok === true);

  // OPTIONS preflight — CORS support
  const cors = await fetch(`${BASE_URL}/api/analytics/session`, { method: 'OPTIONS' });
  ok('OPTIONS /api/analytics/session → 204',             cors.status === 204);
}

async function testAdminRoutes() {
  if (!ADMIN_JWT) {
    console.log('\n── Admin routes (skipped — no ADMIN_JWT) ─────────────────');
    return;
  }

  console.log('\n── Admin routes ───────────────────────────────────────────');

  const ws = await get('/api/admin/webhook-settings', ADMIN_JWT);
  ok('GET /api/admin/webhook-settings → 200', ws.status === 200);
  ok('Response has settings key',            ws.body?.settings != null);
  ok('Response has governor key',            ws.body?.governor != null);
  ok('Response has queue_depth',             typeof ws.body?.queue_depth === 'number');

  const oh = await get('/api/admin/onboarding-health', ADMIN_JWT);
  ok('GET /api/admin/onboarding-health → 200', oh.status === 200);
  ok('Response has funnel key',              oh.body?.funnel != null);
  ok('Response has timing key',             oh.body?.timing != null);
  ok('Response has recent_users array',     Array.isArray(oh.body?.recent_users));

  // GET /api/admin/users — paginated subscriber list
  const ul = await get('/api/admin/users', ADMIN_JWT);
  ok('GET /api/admin/users → 200',           ul.status === 200);
  ok('Response has users array',             Array.isArray(ul.body?.users));
  ok('Response has pagination object',       ul.body?.pagination != null);
  ok('Pagination has total field',           typeof ul.body?.pagination?.total === 'number');

  // GET /api/admin/impersonation-log
  const il = await get('/api/admin/impersonation-log', ADMIN_JWT);
  ok('GET /api/admin/impersonation-log → 200', il.status === 200);
  ok('Response has log array',               Array.isArray(il.body?.log));
  ok('Response has pagination object',       il.body?.pagination != null);
}

async function testImpersonationSecurity() {
  console.log('\n── Impersonation security guards ─────────────────────────');

  // POST /impersonate/end without any auth → 401
  const noAuth = await post('/api/admin/impersonate/end', {});
  ok('POST /impersonate/end no auth → 401',          noAuth.status === 401);

  // POST /impersonate/:id without admin JWT → 401
  const noAuthStart = await post('/api/admin/impersonate/00000000-0000-0000-0000-000000000000', {});
  ok('POST /impersonate/:id no auth → 401',          noAuthStart.status === 401);

  if (TEST_JWT) {
    // POST /impersonate/:id with subscriber JWT → 403
    const subStart = await post(
      '/api/admin/impersonate/00000000-0000-0000-0000-000000000000',
      { reason: 'test' },
      TEST_JWT,
    );
    ok('POST /impersonate/:id with subscriber JWT → 403', subStart.status === 403);

    // GET /admin/users with subscriber JWT → 403
    const subUsers = await get('/api/admin/users', TEST_JWT);
    ok('GET /admin/users with subscriber JWT → 403', subUsers.status === 403);
  } else {
    console.log('  (subscriber-JWT checks skipped — no TEST_JWT)');
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Runner
// ─────────────────────────────────────────────────────────────────────────

(async () => {
  console.log(`\nVidaPulse Smoke Test`);
  console.log(`Target: ${BASE_URL}`);
  console.log(`Auth token: ${TEST_JWT ? 'provided' : 'not set'}`);
  console.log(`Admin token: ${ADMIN_JWT ? 'provided' : 'not set'}`);

  try {
    await testPublicRoutes();
    await testAuthGuards();
    await testAuthRouteValidation();
    await testPlanGates();
    await testVideoValidation();
    await testAnalyticsRoutes();
    await testAdminRoutes();
    await testImpersonationSecurity();
  } catch (err) {
    console.error('\nFATAL — test runner threw unexpectedly:', err.message);
    process.exit(1);
  }

  const total = passed + failed;
  console.log(`\n─────────────────────────────────────────────────────────`);
  console.log(`Results: ${passed}/${total} passed  ${failed > 0 ? `· ${failed} FAILED` : '✓ all clear'}`);

  if (failed > 0) {
    console.error('\nOne or more checks failed. Review output above.');
    process.exit(1);
  } else {
    console.log('\nAll checks passed.');
    process.exit(0);
  }
})();
