'use strict';

/**
 * VidaPulse Backend — Express application entry point.
 *
 * Startup sequence:
 *   1. Load and validate environment variables (exits if any missing)
 *   2. Apply Express middleware (security, CORS, logging, body parsing)
 *   3. Mount API routes
 *   4. In production: serve React frontend build as static files
 *   5. Register global error handler (must be last)
 *   6. Test database connection
 *   7. Run pending database migrations
 *   8. Start listening on PORT
 *
 * Railway.app deploys this file via: "startCommand": "cd backend && npm start"
 * Health check: GET /api/health (monitored by Railway)
 */

// env.js MUST be the first import — it validates all required env vars
// and exits immediately if any are missing, before any other code runs.
const env    = require('./config/env');
const logger = require('./config/logger');

const express      = require('express');
const cors         = require('cors');
const helmet       = require('helmet');
const morgan       = require('morgan');
const cookieParser = require('cookie-parser');
const path         = require('path');

const { testConnection } = require('./config/database');
const { runMigrations  } = require('./db/migrate');
const routes             = require('./routes');
const embedRoutes        = require('./routes/embed');
const { errorHandler   } = require('./middleware/errorHandler');
const webhookSender      = require('./services/webhookSender');
const scheduledJobs      = require('./services/scheduledJobs');

// ─────────────────────────────────────────────────────────────
// Express app configuration
// ─────────────────────────────────────────────────────────────

const app = express();

// ── Security headers (helmet sets Content-Security-Policy, etc.) ──
app.use(helmet({
  // Relax CSP in development so the React dev server works
  contentSecurityPolicy: env.NODE_ENV === 'production',
}));

// ── CORS ─────────────────────────────────────────────────────
// Derives allowed origins from APP_URL so no code change is needed
// when the domain changes. E.g. APP_URL=https://app.vidapulse.io
// → allows app / root / www / orbitq on that domain automatically.
// Also keeps .in origins during any transition period.
function buildAllowedOrigins() {
  try {
    const base = new URL(env.APP_URL); // e.g. https://app.vidapulse.io
    const host = base.hostname.replace(/^[^.]+\./, ''); // vidapulse.io
    const proto = base.protocol; // https:
    return [
      `${proto}//app.${host}`,
      `${proto}//${host}`,
      `${proto}//www.${host}`,
      `${proto}//orbitq.${host}`,
    ];
  } catch {
    return ['https://app.vidapulse.io', 'https://vidapulse.io'];
  }
}

const allowedOrigins = env.NODE_ENV === 'production' ? buildAllowedOrigins() : '*';

app.use(cors({
  origin     : allowedOrigins,
  credentials: true,
  methods    : ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-webhook-secret'],
}));

// ── Trust Railway's reverse proxy ────────────────────────────
// Required so req.ip returns the real client IP (not Railway's proxy IP).
app.set('trust proxy', 1);

// ─────────────────────────────────────────────────────────────
// Legacy domain redirect — vidapulse.in → vidapulse.io (301 permanent)
//
// The .in domain is being retired in favour of .io. Every request on any
// .in host (apex, www., app., orbitq.) is permanently redirected to the
// SAME subdomain + path + query on .io, so links and SEO consolidate onto
// the live domain. Runs before all routes/static so nothing on .in is
// served directly. (Requires the .in domains to point at this Railway
// service via custom domain + DNS; otherwise the request never arrives.)
// ─────────────────────────────────────────────────────────────
app.use((req, res, next) => {
  const host = req.hostname || '';
  if (host === 'vidapulse.in' || host.endsWith('.vidapulse.in')) {
    const sub = host.slice(0, host.length - 'vidapulse.in'.length); // '' | 'app.' | 'www.' | 'orbitq.'
    return res.redirect(301, `https://${sub}vidapulse.io${req.originalUrl}`);
  }
  next();
});

// ── HTTP request logging ──────────────────────────────────────
// 'combined' = Apache-style log (good for production log aggregation)
// 'dev'      = colorized short log (good for local development)
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ── Cookie parsing ────────────────────────────────────────────
// Required for reading httpOnly JWT cookie (vp_token) and OAuth state cookie
app.use(cookieParser());

// ── Body parsing ──────────────────────────────────────────────
// verify captures the raw Buffer so Razorpay webhook signature
// validation can use req.rawBody (HMAC-SHA256 over the literal body bytes).
app.use(express.json({
  limit : '1mb',
  verify: (req, _res, buf) => { req.rawBody = buf; },
}));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ─────────────────────────────────────────────────────────────
// Embed route — public, no auth, must come before API + static
// GET /embed/:videoId → self-contained HTML player + tracking
// ─────────────────────────────────────────────────────────────

app.use('/embed', embedRoutes);

// ─────────────────────────────────────────────────────────────
// API routes (always mounted, on all domains)
// ─────────────────────────────────────────────────────────────

app.use('/api', routes);

// ─────────────────────────────────────────────────────────────
// Static file serving in production
//
// Domain routing (checked via req.hostname):
//   vidapulse.io / www.vidapulse.io  →  landing/index.html (marketing page)
//   app.vidapulse.io                 →  frontend/dist/     (React dashboard)
//   localhost / unknown              →  React dashboard (dev fallback)
//
// Railway runs a single service on one port, so both domains point to the
// same process. We differentiate them by inspecting the Host header.
// ─────────────────────────────────────────────────────────────

if (env.NODE_ENV === 'production') {
  const landingDir     = path.join(__dirname, '../../landing');
  const frontendDist   = path.join(__dirname, '../../frontend/dist');
  // Build landing domains from APP_URL (e.g. vidapulse.io + www.vidapulse.io)
  // plus keep .in entries during transition
  const _appHost       = (() => { try { return new URL(env.APP_URL).hostname.replace(/^[^.]+\./, ''); } catch { return 'vidapulse.io'; } })();
  const landingDomains = new Set([_appHost, `www.${_appHost}`]);

  // ─────────────────────────────────────────────────────────────
  // Knowledge Base — static, AI-crawlable HTML on the APP domain
  //
  //   /video-analytics-guide            → hub
  //   /video-analytics-guide/<cat>      → category pages
  //   /video-analytics-guide/<cat>/<q>  → article pages (Phase 2)
  //   /robots.txt, /sitemap.xml         → crawler directives
  //   /questions, /learn                → 301 → the hub
  //
  // Pre-generated by `node knowledge-base/generate.js` into
  // knowledge-base/public/. Mounted BEFORE the React static handler so
  // these URLs return real HTML (not the SPA shell) for AI crawlers.
  // Only the production app host is indexable — staging/preview hosts
  // get a Disallow robots.txt + X-Robots-Tag:noindex so they never rank.
  // ─────────────────────────────────────────────────────────────
  const kbDir        = path.join(__dirname, '../../knowledge-base/public');
  const kbRoot       = path.resolve(kbDir);
  const kbAssets     = express.static(kbDir);
  const prodAppHost  = `app.${_appHost}`;            // e.g. app.vidapulse.io
  const KB_HUB       = '/video-analytics-guide';
  const KB_ALIASES   = new Set(['/questions', '/learn']);
  const sitemapUrl   = `${env.APP_URL.replace(/\/+$/, '')}/sitemap.xml`;

  function kbRobotsTxt(indexable) {
    if (!indexable) return 'User-agent: *\nDisallow: /\n';
    const aiBots = ['GPTBot', 'ChatGPT-User', 'OAI-SearchBot', 'ClaudeBot',
      'anthropic-ai', 'PerplexityBot', 'CCBot', 'Google-Extended', 'Googlebot',
      'Applebot', 'Applebot-Extended', 'bingbot', 'DuckDuckBot', 'Bytespider', 'YouBot'];
    return [
      '# robots.txt — app.vidapulse.io',
      'User-agent: *',
      'Allow: /',
      'Disallow: /api/',
      '',
      '# AI / LLM crawlers — explicitly allowed',
      aiBots.map((b) => `User-agent: ${b}\nAllow: /`).join('\n\n'),
      '',
      `Sitemap: ${sitemapUrl}`,
      '',
    ].join('\n');
  }

  app.use((req, res, next) => {
    if (landingDomains.has(req.hostname)) return next();   // app domain only
    let p = req.path;
    if (p.length > 1) p = p.replace(/\/+$/, '');           // ignore trailing slash
    const indexable = req.hostname === prodAppHost;

    // robots.txt — host-aware so staging/preview hosts are never indexed.
    if (p === '/robots.txt') {
      return res.type('text/plain').send(kbRobotsTxt(indexable));
    }
    // Alternate hub URLs 301 → the canonical guide hub.
    if (KB_ALIASES.has(p)) return res.redirect(301, KB_HUB);

    // Static KB assets + sitemap (no filename collisions here).
    if (p === '/sitemap.xml' || p.startsWith('/kb-assets/')) {
      if (!indexable) res.setHeader('X-Robots-Tag', 'noindex');
      return kbAssets(req, res, next);
    }

    // KB HTML pages — map clean URL → <path>.html with a containment guard.
    if (p === KB_HUB || p.startsWith(KB_HUB + '/')) {
      const rel = (p === KB_HUB ? 'video-analytics-guide' : decodeURIComponent(p.slice(1))) + '.html';
      const filePath = path.resolve(kbRoot, rel);
      if (filePath !== kbRoot && !filePath.startsWith(kbRoot + path.sep)) return next();
      if (!indexable) res.setHeader('X-Robots-Tag', 'noindex');
      return res.sendFile(filePath, (err) => {
        if (err) res.status(404).type('text/plain').send('Not found');
      });
    }

    next();
  });

  // Serve landing page static assets (CSS, images, favicon, etc.)
  // Only for requests on the marketing domain
  app.use((req, res, next) => {
    if (landingDomains.has(req.hostname)) {
      return express.static(landingDir)(req, res, next);
    }
    next();
  });

  // Serve React dashboard static assets for app subdomain.
  // index.html gets no-cache so the browser always checks for the latest
  // version after a deploy. Hashed JS/CSS bundles can be cached long-term
  // (Vite embeds a content hash in every bundle filename).
  app.use((req, res, next) => {
    if (!landingDomains.has(req.hostname)) {
      return express.static(frontendDist, {
        setHeaders(res, filePath) {
          if (filePath.endsWith('index.html')) {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.setHeader('Pragma',  'no-cache');
            res.setHeader('Expires', '0');
          }
        },
      })(req, res, next);
    }
    next();
  });

  // Catch-all: serve the correct index.html based on the domain.
  // For React Router — any unmatched path on the app subdomain serves
  // index.html so client-side routing works (e.g. /login, /dashboard/videos).
  app.get('*', (req, res) => {
    if (landingDomains.has(req.hostname)) {
      res.sendFile(path.join(landingDir, 'index.html'));
    } else {
      // No-cache so users always get the freshest entry point after a deploy
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma',  'no-cache');
      res.setHeader('Expires', '0');
      res.sendFile(path.join(frontendDist, 'index.html'));
    }
  });
}

// ── Global error handler (MUST be last middleware) ──────────
app.use(errorHandler);

// ─────────────────────────────────────────────────────────────
// Server startup
// ─────────────────────────────────────────────────────────────

async function start() {
  logger.info('');
  logger.info('[server] ══════════════════════════════════════');
  logger.info('[server]   VidaPulse Backend — Starting up...');
  logger.info('[server] ══════════════════════════════════════');
  logger.info(`[server] Environment : ${env.NODE_ENV}`);
  logger.info(`[server] App URL     : ${env.APP_URL}`);
  logger.info(`[server] Port        : ${env.PORT}`);
  logger.info('');

  try {
    // ── Step 1: Bind the HTTP port immediately ────────────────────────────
    // IMPORTANT: app.listen() MUST run before the DB connection test.
    //
    // Railway starts the healthcheck the moment the container boots and
    // marks the deploy failed if /api/health doesn't return 2xx within
    // the healthcheckTimeout window. If we wait for DB + migrations first
    // the process may crash (or simply not be listening) before the first
    // health probe fires, causing a "service unavailable" failure.
    //
    // With listen-first the health endpoint responds immediately:
    //   • 503 { database.connected: false } while DB/migrations are running
    //   • 200 { database.connected: true  } once everything is ready
    // Railway retries until it sees 200, or the window expires.
    logger.info('[server] Step 1/4 — Starting HTTP server...');
    await new Promise((resolve) => {
      app.listen(env.PORT, () => {
        logger.info(`[server] ✓ Listening on port ${env.PORT} — health check is now reachable`);
        resolve();
      });
    });

    // ── Step 2: Verify database is reachable ──────────────────────────────
    logger.info('[server] Step 2/4 — Testing database connection...');
    await testConnection();

    // ── Step 3: Apply any pending schema migrations ───────────────────────
    logger.info('[server] Step 3/4 — Running database migrations...');
    await runMigrations();

    // ── Step 4: Start background workers ─────────────────────────────────
    logger.info('[server] Step 4/4 — Starting background workers...');
    webhookSender.start();
    scheduledJobs.start();

    logger.info('');
    logger.info('[server] ✓ Fully operational!');
    logger.info(`[server]   Health check : http://localhost:${env.PORT}/api/health`);
    logger.info(`[server]   Webhook URL  : ${env.APP_URL}/api/webhook/create-user`);
    logger.info('[server] ✓ Workers started — webhook sender (30 s/60 s) · scheduled jobs (3 m/15 m/1 h)');
    logger.info('');

  } catch (err) {
    logger.error('[server] ✗ FATAL: Startup failed!');
    logger.error(`[server]   ${err.message}`);
    logger.error(err.stack);
    process.exit(1);
  }
}

// ── Graceful shutdown (Railway sends SIGTERM before replacing the container) ─
process.on('SIGTERM', () => {
  logger.info('[server] SIGTERM received — shutting down gracefully');
  webhookSender.stop();
  scheduledJobs.stop();
  process.exit(0);
});

// ── Catch unhandled promise rejections (safety net) ─────────
// These should never happen — if they do, it means we missed a try/catch.
process.on('unhandledRejection', (reason) => {
  logger.error('[server] Unhandled Promise Rejection:', reason);
  // Don't crash the server — log and continue
});

process.on('uncaughtException', (err) => {
  logger.error('[server] Uncaught Exception:', err.message);
  logger.error(err.stack);
  // Crash on uncaught exceptions — the process is in an unknown state
  process.exit(1);
});

start();
