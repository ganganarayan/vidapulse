# VidaPulse — build & deploy rules

Stack note: backend is Node/Express with raw-SQL migrations (NOT Prisma).
Frontend is React + Vite (JS/JSX — no TypeScript, no ESLint configured).
So the checks below map to what actually exists in this repo.

## Branch model
- `main`   = PRODUCTION  (app.vidapulse.io) — real users + ad traffic.
- `orbitq` = STAGING     (orbitq.vidapulse.io).
- Flow: build on a branch → push `orbitq` → test on staging → promote to `main`.
- Never push `main` without an explicit OK.

## Before EVERY commit
1. `npm run verify`   (root — runs backend syntax check + frontend production build)

If it fails:
- STOP
- Fix the issue
- Re-run `npm run verify`
- Do NOT commit until it passes

## Before EVERY deployment
1. `npm run verify`
2. Verify required env vars are set on the target Railway service
   (e.g. WEBHOOK_SECRET, JWT_SECRET, GOOGLE_CLIENT_ID/SECRET, RAZORPAY_*,
    APP_URL, DATABASE_URL)
3. Check pending SQL migrations: `cd backend && npm run migrate:status`
   (migrations run automatically on boot via src/db/migrate.js)
4. Deploy to STAGING (`orbitq`) first
5. Smoke-test the core flows on staging: signup (password + magic-link),
   login, and the contact webhook firing in Admin → Contact Webhook Log
6. Promote to PRODUCTION (`main`)

## If a PRODUCTION deployment fails
- Roll back IMMEDIATELY to the last green deployment
  (Railway → service → Deployments → last Active → ⋯ → Rollback;
   instant, no rebuild). Or `git revert` + push `main`.
- Restore service FIRST.
- Investigate root cause SECOND.

Note: a Railway BUILD failure does not take production down — the last good
build keeps serving. A roll back is still required for any deploy that goes
live and misbehaves.
