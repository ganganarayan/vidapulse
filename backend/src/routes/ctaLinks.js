'use strict';

/**
 * CTA Links API — /api/cta-links
 *
 * Manages per-video CTA tracking links (Pro plan only).
 * Each link stores a button name, optional page name, and destination URL.
 * Tracking URL: GET /api/analytics/cta/link/:ctaLinkId  (in analytics.js)
 *
 *   GET    /api/cta-links/video/:videoId  — list CTA links for a video
 *   POST   /api/cta-links                 — create a new CTA link
 *   DELETE /api/cta-links/:id             — delete a CTA link
 */

const express        = require('express');
const router         = express.Router();
const { pool }       = require('../config/database');
const { requireAuth }= require('../middleware/requireAuth');

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

// ── GET /api/cta-links/video/:videoId ────────────────────────────────────
// List all CTA links for a video. Video must belong to the authenticated user.
// Available on all plans (read-only access for future reference).

router.get('/video/:videoId', requireAuth, async (req, res, next) => {
  try {
    const { rows: [video] } = await pool.query(
      `SELECT id FROM videos WHERE id = $1 AND user_id = $2 AND is_active = TRUE`,
      [req.params.videoId, req.user.id]
    );
    if (!video) return res.status(404).json({ error: 'video_not_found' });

    const { rows } = await pool.query(
      `SELECT id, cta_name, page_name, destination_url, created_at
       FROM   video_cta_links
       WHERE  video_id = $1
       ORDER  BY created_at ASC`,
      [req.params.videoId]
    );
    return res.json({ cta_links: rows });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/cta-links ──────────────────────────────────────────────────
// Create a new CTA tracking link. Pro plan required.
//
// Body:
//   video_id        UUID    — required
//   cta_name        string  — required ("Buy Now", "Sign Up", etc.)
//   page_name       string  — optional ("Sales Page", "Email Funnel")
//   destination_url string  — required (http:// or https://)

router.post('/', requireAuth, async (req, res, next) => {
  try {
    if (!await requirePro(req.user.id, res)) return;

    const { video_id, cta_name, page_name, destination_url } = req.body ?? {};

    if (!video_id)             return res.status(400).json({ error: 'video_id required' });
    if (!cta_name?.trim())     return res.status(400).json({ error: 'cta_name required' });
    if (!destination_url?.trim()) return res.status(400).json({ error: 'destination_url required' });

    const safeDest = destination_url.trim();
    if (!safeDest.startsWith('http://') && !safeDest.startsWith('https://')) {
      return res.status(400).json({ error: 'destination_url must start with http:// or https://' });
    }

    // Verify video belongs to this user
    const { rows: [video] } = await pool.query(
      `SELECT id FROM videos WHERE id = $1 AND user_id = $2 AND is_active = TRUE`,
      [video_id, req.user.id]
    );
    if (!video) return res.status(404).json({ error: 'video_not_found' });

    const { rows: [ctaLink] } = await pool.query(
      `INSERT INTO video_cta_links (video_id, cta_name, page_name, destination_url)
       VALUES ($1, $2, $3, $4)
       RETURNING id, cta_name, page_name, destination_url, created_at`,
      [
        video_id,
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

// ── DELETE /api/cta-links/:id ────────────────────────────────────────────
// Delete a CTA link. The link must belong to a video owned by this user.

router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    // Use USING to join videos and verify ownership in a single DELETE
    const { rowCount } = await pool.query(
      `DELETE FROM video_cta_links c
       USING  videos v
       WHERE  c.id       = $1
         AND  c.video_id = v.id
         AND  v.user_id  = $2`,
      [req.params.id, req.user.id]
    );
    if (rowCount === 0) return res.status(404).json({ error: 'not_found' });
    return res.json({ deleted: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
