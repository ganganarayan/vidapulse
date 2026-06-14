'use strict';

/**
 * CTA Links API — /api/cta-links
 *
 * Account-level CTA tracking links (Pro plan only).
 * Links are NOT tied to a specific video — they belong to the user account.
 * Max 20 links per user at any time.
 *
 * Deleting a link does NOT remove its events from analytics_events.
 * The event's metadata (cta_link_id, cta_name, etc.) is preserved in the
 * events log permanently.
 *
 *   GET    /api/cta-links       — list all CTA links for the authenticated user
 *   POST   /api/cta-links       — create a new CTA link (max 20 per account)
 *   DELETE /api/cta-links/:id   — delete a CTA link (events are retained)
 */

const express         = require('express');
const router          = express.Router();
const { pool }        = require('../config/database');
const { requireAuth } = require('../middleware/requireAuth');

const MAX_CTA_LINKS = 20;

// ── Pro plan check helper ────────────────────────────────────────────────

async function requirePro(userId, res) {
  const { rows: [row] } = await pool.query(
    `SELECT p.name AS plan_name
     FROM   users u
     JOIN   plans p ON p.id = u.plan_id
     WHERE  u.id = $1`,
    [userId]
  );
  const isPro = row?.plan_name === 'pro' || row?.plan_name === 'admin_lifetime';
  if (!isPro) {
    res.status(403).json({
      error  : 'pro_required',
      message: 'CTA tracking links require a Pro plan.',
    });
  }
  return isPro;
}

// ── GET /api/cta-links ───────────────────────────────────────────────────
// List all CTA links for the authenticated user.

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      // Clicks come from cta_click_logs — the canonical store the redirect
      // handler (/api/analytics/cta/link/:id) writes to. (Old analytics_events
      // cta_click rows were backfilled into cta_click_logs by migration 034.)
      `SELECT c.id, c.cta_name, c.page_name, c.destination_url, c.created_at,
              (SELECT COUNT(*)::int
                 FROM cta_click_logs l
                WHERE l.cta_link_id = c.id) AS clicks,
              (SELECT MAX(l.occurred_at)
                 FROM cta_click_logs l
                WHERE l.cta_link_id = c.id) AS last_click_at
       FROM   video_cta_links c
       WHERE  c.user_id = $1
       ORDER  BY c.created_at ASC`,
      [req.user.id]
    );
    return res.json({
      cta_links: rows,
      total    : rows.length,
      limit    : MAX_CTA_LINKS,
    });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/cta-links ──────────────────────────────────────────────────
// Create a new account-level CTA tracking link. Pro plan required.
// Max MAX_CTA_LINKS links per user — returns 400 if limit is reached.
//
// Body:
//   cta_name        string  — required ("Buy Now", "Sign Up", etc.)
//   page_name       string  — optional ("Sales Page", "Email Funnel")
//   destination_url string  — required (http:// or https://)

router.post('/', requireAuth, async (req, res, next) => {
  try {
    if (!await requirePro(req.user.id, res)) return;

    // Enforce 20-link cap
    const { rows: [cnt] } = await pool.query(
      `SELECT COUNT(*) AS n FROM video_cta_links WHERE user_id = $1`,
      [req.user.id]
    );
    if (Number(cnt.n) >= MAX_CTA_LINKS) {
      return res.status(400).json({
        error  : 'limit_reached',
        message: `You can have at most ${MAX_CTA_LINKS} CTA tracking links. Delete an existing link to add a new one.`,
      });
    }

    const { cta_name, page_name, destination_url } = req.body ?? {};

    if (!cta_name?.trim())        return res.status(400).json({ error: 'cta_name required' });
    if (!destination_url?.trim()) return res.status(400).json({ error: 'destination_url required' });

    const safeDest = destination_url.trim();
    if (!safeDest.startsWith('http://') && !safeDest.startsWith('https://')) {
      return res.status(400).json({ message: 'Destination must start with https://' });
    }

    const { rows: [ctaLink] } = await pool.query(
      `INSERT INTO video_cta_links (user_id, cta_name, page_name, destination_url)
       VALUES ($1, $2, $3, $4)
       RETURNING id, cta_name, page_name, destination_url, created_at`,
      [
        req.user.id,
        cta_name.trim().slice(0, 200),
        page_name?.trim().slice(0, 200) || null,
        safeDest.slice(0, 2000),
      ]
    );
    return res.status(201).json({ cta_link: ctaLink });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/cta-links/clicks ────────────────────────────────────────────
// Full per-click log across all of the user's CTA links, newest first, read
// from the canonical cta_click_logs table (where the redirect handler records
// every click). Survives link deletion — past clicks stay in the log.
// Each row: timestamp, button (cta_name), page, device, browser, country, city,
// destination, and viewer_id (the first-party vp_cta_vid cookie).

router.get('/clicks', requireAuth, async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 500, 2000);
    const { rows } = await pool.query(
      `SELECT l.occurred_at,
              l.cta_name,
              l.page_name,
              l.device,
              l.browser,
              l.country,
              l.city,
              l.destination_url,
              l.viewer_id
       FROM   cta_click_logs l
       WHERE  l.user_id = $1
       ORDER  BY l.occurred_at DESC
       LIMIT  $2`,
      [req.user.id, limit]
    );
    return res.json({ clicks: rows, total: rows.length });
  } catch (err) {
    next(err);
  }
});

// ── DELETE /api/cta-links/:id ────────────────────────────────────────────
// Delete a CTA link. Ownership verified via user_id.
// Analytics events that recorded this link's clicks are NOT deleted —
// they remain permanently in the events log.

router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const { rowCount } = await pool.query(
      `DELETE FROM video_cta_links WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );
    if (rowCount === 0) return res.status(404).json({ error: 'not_found' });
    return res.json({ deleted: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
