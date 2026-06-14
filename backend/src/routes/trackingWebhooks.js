'use strict';

/**
 * Per-user tracking webhook CRUD — /api/tracking-webhooks/*
 *
 * Subscriber-owned (each row scoped to user_id = req.user.id). These receive
 * VIEWER engagement events for the subscriber's own videos — completely
 * separate from the admin-owned platform event_webhooks.
 *
 * Creating requires the Pro gate (video_tracking feature). Listing/editing/
 * deleting only require auth + ownership (you can always see/remove your own).
 */

const express = require('express');
const router  = express.Router();
const { pool } = require('../config/database');
const logger   = require('../config/logger');
const { requireAuth } = require('../middleware/requireAuth');
const { planGate }    = require('../middleware/planGate');

// HTTPS + SSRF guard (mirrors the platform webhook validator).
function _validUrl(u) {
  const s = String(u || '').trim();
  if (!s)            return 'URL is required';
  if (s.length > 2000) return 'URL too long';
  let host;
  try {
    const parsed = new URL(s);
    if (parsed.protocol !== 'https:') return 'Must use HTTPS';
    host = parsed.hostname.toLowerCase();
  } catch {
    return 'Enter a valid URL';
  }
  if (
    host === 'localhost' || host === '0.0.0.0' || host === '::1' ||
    host.startsWith('127.') || host.startsWith('10.') || host.startsWith('192.168.') ||
    host.startsWith('169.254.') || /^172\.(1[6-9]|2\d|3[01])\./.test(host)
  ) return 'Must point to a public external host';
  return null;
}

// GET /api/tracking-webhooks — the caller's own webhooks
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, url, status, created_at FROM tracking_webhooks
       WHERE user_id = $1 ORDER BY created_at ASC`,
      [req.user.id]
    );
    return res.json({ webhooks: rows });
  } catch (err) { next(err); }
});

// POST /api/tracking-webhooks — add (Pro)
router.post('/', requireAuth, planGate('video_tracking'), async (req, res, next) => {
  try {
    const url = String(req.body?.url || '').trim();
    const err = _validUrl(url);
    if (err) return res.status(400).json({ error: 'Validation Error', message: err });

    try {
      const { rows: [row] } = await pool.query(
        `INSERT INTO tracking_webhooks (user_id, url) VALUES ($1, $2)
         RETURNING id, url, status, created_at`,
        [req.user.id, url]
      );
      logger.info(`[tracking-webhooks] created for user ${req.user.id}`);
      return res.status(201).json({ ok: true, webhook: row });
    } catch (e) {
      if (e.code === '23505') return res.status(409).json({ error: 'Conflict', message: 'You already have a webhook for that URL.' });
      throw e;
    }
  } catch (err) { next(err); }
});

// PATCH /api/tracking-webhooks/:id — update url and/or status (own rows only)
router.patch('/:id', requireAuth, async (req, res, next) => {
  try {
    const sets = [];
    const vals = [];
    let p = 1;

    if (req.body?.url !== undefined) {
      const err = _validUrl(req.body.url);
      if (err) return res.status(400).json({ error: 'Validation Error', message: err });
      sets.push(`url = $${p++}`); vals.push(String(req.body.url).trim());
    }
    if (req.body?.status !== undefined) {
      sets.push(`status = $${p++}`); vals.push(req.body.status === 'inactive' ? 'inactive' : 'active');
    }
    if (!sets.length) return res.status(400).json({ error: 'Nothing to update' });

    sets.push('updated_at = NOW()');
    vals.push(req.params.id);
    vals.push(req.user.id);

    try {
      const { rows: [row] } = await pool.query(
        `UPDATE tracking_webhooks SET ${sets.join(', ')}
         WHERE id = $${p} AND user_id = $${p + 1}
         RETURNING id, url, status, created_at`,
        vals
      );
      if (!row) return res.status(404).json({ error: 'Not found' });
      return res.json({ ok: true, webhook: row });
    } catch (e) {
      if (e.code === '23505') return res.status(409).json({ error: 'Conflict', message: 'You already have a webhook for that URL.' });
      if (e.code === '22P02') return res.status(400).json({ error: 'Invalid id' });
      throw e;
    }
  } catch (err) { next(err); }
});

// DELETE /api/tracking-webhooks/:id — own rows only
router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const { rowCount } = await pool.query(
      `DELETE FROM tracking_webhooks WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );
    if (rowCount === 0) return res.status(404).json({ error: 'Not found' });
    return res.json({ ok: true });
  } catch (e) {
    if (e.code === '22P02') return res.status(400).json({ error: 'Invalid id' });
    next(e);
  }
});

module.exports = router;
