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

<!-- standing-rules:begin (shared across every repo; edit here and it is copied, do not reword per repo) -->
## Standing instructions

These used to live only on the owner's Windows PC, so a cloud session never saw
them. They are committed here on purpose: a cloud session starts from a fresh
clone and gets nothing that was only configured on a machine.

### Branching and environments

- Exactly two long-lived branches: **main** (production line) and **orbitq**
  (staging). Never master; if a repo still has one, rename it to main.
- The staging branch is always named orbitq and the staging service is the
  *-staging service.

### Build and deploy: auto-push to staging, never build locally

- **Auto-push to staging without asking.** Anything built or changed goes to the
  staging branch automatically: commit and push as the final step of the work,
  then verify on staging. Do not ask whether to push. Main/prod stays gated.
- **No builds in the session, local or cloud.** Never next build, docker or
  npm run build, never start the server, never rely on "it works in my
  sandbox". The Railway environment differs from a laptop *and* from a cloud
  container, so a passing run in the session proves nothing about production.
  Write the code to the files; the app is verified on staging.
  (prisma generate for codegen and tsc --noEmit for a typecheck are allowed:
  they compile and verify types, they do not build or run the app. Unit tests
  are fine too.)
- **Static syntax-check every changed file before committing** (this is not a
  build): node --check for changed JS/MJS, an EJS compile check for changed
  templates, a typecheck for TypeScript projects. A syntax or type error must
  never reach a staging commit.
- Flow: commit to staging, deploy staging, verify on the live staging URL
  (GET /api/version matches the pushed SHA). Then, **only when the owner
  explicitly says so**, fast-forward main, deploy prod, verify. "Push to main"
  means that whole flow; never touch main or prod unprompted.
- No exceptions and no editorialising. Do not decide a change is a runtime
  no-op and skip the push. Consistency over cleverness.

### Deploy polling

Record each build's duration. On the next deploy do not start polling at once:
wait about (last build duration + 10 seconds) before the first status check,
then poll at modest intervals until it is Online. Most of the build window
should carry zero polls.

### Status colours and formatting

- Signal state with coloured dots: 🟢 green = OK / success / safe,
  🟡 yellow = not OK / needs attention / caution, 🔴 red = dangerous /
  destructive / blocked.
- The owner's chat theme renders inline code spans in red, which reads as
  danger. Avoid backticks for branch names, file paths, commit hashes and
  commands written in prose: use plain text, bold, or markdown file links.
  Keep backticks for real code and copy-paste commands.

### Dates and times: Indian format everywhere

- Every timestamp a human reads is DD-MM-YYYY, and DD-MM-YYYY HH:MM (24-hour)
  when the time matters. UI, tables, exports, CSV columns, PDFs, emails,
  WhatsApp, logs people read. MM-DD-YYYY is never acceptable.
- **Never leave the locale to the runtime.** toLocaleString() or
  toLocaleDateString() with no locale, or with undefined, renders in the
  server's or browser's locale, which on Railway is US order. Never ship a bare
  one: always go through the project's own formatter.
- Times are IST (UTC+05:30) computed from a fixed offset, not from the host's
  timezone (the server runs UTC). A new project gets the same formatter helper
  before its first date is rendered.
- Machine-to-machine fields (JSON payloads, APIs, DB columns, round-trip export
  bodies) stay ISO-8601 UTC. This rule is about what a person reads.

### Configuration lives in the app, not in env

All user- and tenant-scoped configuration (SMTP and email keys, API keys,
sheets, schedules) lives in the app's own settings UI and its tenant config
table. Environment variables are only for platform infrastructure. A cloud
session has no .env and does not need one: do not ask for keys, and do not add
an env var for something the settings UI owns.

### Writing

- **No em dashes.** Never write the U+2014 character in code, UI text, commit
  messages or chat. Grep the changed files before committing.
- Be concise. End every reply with a token footer: this-turn in and out
  (estimated), cumulative, context-window fullness, and a continue-versus-new-chat
  nudge. Before a task or phase, give a tentative token estimate, proceed
  without asking, then log estimate against actual and calibrate (gut estimates
  run about 2 to 3 times the objective per-turn counter).
<!-- standing-rules:end -->

### This repo

Staging branch: orbitq. Production branch: main. Several feat/* branches exist; they are not long-lived.
