'use strict';

/**
 * Help & Support API
 *
 * GET  /api/help          — fetch help content (any authenticated user)
 * PUT  /api/help          — update help content (admin only)
 */

const express        = require('express');
const router         = express.Router();
const { pool }       = require('../config/database');
const { requireAuth }= require('../middleware/requireAuth');

const DEFAULT_SECTIONS = [
  { title: 'Getting Started', content: 'Welcome to VidaPulse! Add your first video by clicking Videos in the left panel and pasting any video URL (YouTube, Vimeo, HLS, or direct MP4). VidaPulse generates a unique embed code that you paste into your website. Analytics start flowing automatically once the first viewer watches.' },
  { title: 'Embedding the Player', content: 'Inside any video, open Share & Embed. Copy the iframe snippet and paste it into your page HTML. Every play, pause, rewatch, and drop-off is tracked automatically. Works on WordPress, Webflow, Squarespace, and any custom HTML page.' },
  { title: 'Reading the Heatmap', content: 'The Engagement Heatmap shows second-by-second viewer retention. Green = high retention. Red = low retention / viewers dropped off. Hover any bar to see the retention % at that moment. The Primary Drop-off timestamp shows where most viewers leave.' },
  { title: 'Understanding Metrics', content: 'Total Plays — how many times your video was played.\nUnique Viewers — distinct people tracked by browser cookie.\nAvg. Watch % — average percentage each viewer watched.\nCompletion Rate — % of sessions that reached the end.\nPlay Rate — plays per page load.\nRe-watches — plays minus unique viewers.\nWatch Time — total minutes accumulated across all sessions.' },
  { title: 'Geography, Devices & Browsers', content: 'The Audience section shows where your viewers are (Geography), what devices they use (Desktop / Mobile / Tablet), and which browsers. Data is collected automatically from every session.' },
  { title: 'Viewer Stories & Insights', content: 'Viewer Stories are AI-generated narratives about individual sessions. They appear once 5+ viewers have watched. Insights generate actionable recommendations once enough data is collected.' },
  { title: 'Integrations & Webhooks', content: 'Go to Account → Integrations to set up your Webhook. VidaPulse sends a POST request to your URL whenever a key event occurs (video played, viewer story generated, insight ready). Use this to connect to Zapier, Make, or your own backend.' },
  { title: 'Plan & Billing', content: 'VidaPulse offers a forever-free plan with no expiry. Paid plans unlock advanced features like the full Heatmap, Viewer Stories, AI Insights, and audience segmentation. Your plan is shown in Account Settings. Upgrades take effect immediately.' },
];

// ── GET /api/help ─────────────────────────────────────────────────────────
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT * FROM site_help ORDER BY id DESC LIMIT 1');
    if (rows.length === 0) {
      return res.json({ video_url: null, sections: DEFAULT_SECTIONS });
    }
    return res.json({ video_url: rows[0].video_url, sections: rows[0].sections });
  } catch (err) {
    next(err);
  }
});

// ── PUT /api/help ─────────────────────────────────────────────────────────
router.put('/', requireAuth, async (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.plan !== 'admin_lifetime') {
    return res.status(403).json({ error: 'Admin only' });
  }

  const { video_url = null, sections = DEFAULT_SECTIONS } = req.body ?? {};

  if (!Array.isArray(sections)) {
    return res.status(400).json({ error: 'sections must be an array' });
  }

  try {
    const existing = await pool.query('SELECT id FROM site_help LIMIT 1');

    if (existing.rows.length === 0) {
      await pool.query(
        `INSERT INTO site_help (video_url, sections, updated_by, updated_at)
         VALUES ($1, $2::jsonb, $3, NOW())`,
        [video_url || null, JSON.stringify(sections), req.user.id]
      );
    } else {
      await pool.query(
        `UPDATE site_help
         SET video_url = $1, sections = $2::jsonb,
             updated_by = $3, updated_at = NOW()
         WHERE id = $4`,
        [video_url || null, JSON.stringify(sections), req.user.id, existing.rows[0].id]
      );
    }

    return res.json({ ok: true, video_url: video_url || null, sections });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
