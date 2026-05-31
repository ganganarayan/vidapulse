'use strict';

/**
 * durationService — fetch video duration (seconds) from the original URL.
 *
 * Supports: youtube, vimeo, loom
 * Falls back to null for unsupported platforms (zoom, dropbox, etc.).
 *
 * All functions time-out and never throw — callers always get number|null.
 * Uses Node 18+ built-in fetch (no external dependencies required).
 */

const logger = require('../config/logger');

const TIMEOUT_MS = 6000; // 6 s max per external request

// ─────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────

/**
 * fetchDuration(url, sourceType) → Promise<number|null>
 *
 * Returns duration in whole seconds, or null if unavailable / timed out.
 */
async function fetchDuration(url, sourceType) {
  try {
    switch (sourceType) {
      case 'youtube':      return await withTimeout(fetchYouTubeDuration(url),      TIMEOUT_MS);
      case 'vimeo':        return await withTimeout(fetchVimeoDuration(url),        TIMEOUT_MS);
      case 'loom':         return await withTimeout(fetchLoomDuration(url),         TIMEOUT_MS);
      case 'google_drive': return await withTimeout(fetchGoogleDriveDuration(url),  TIMEOUT_MS);
      default:             return null;
    }
  } catch (err) {
    logger.warn(`[duration] ${sourceType} fetch failed for ${url}: ${err.message}`);
    return null;
  }
}

module.exports = { fetchDuration };

// ─────────────────────────────────────────────────────────────────────────
// YouTube — parse lengthSeconds from the embedded page JSON
// No API key required; works with built-in fetch.
// ─────────────────────────────────────────────────────────────────────────

function extractYouTubeVideoId(url) {
  try {
    const u = new URL(url);
    // https://www.youtube.com/watch?v=VIDEO_ID
    if (u.searchParams.has('v')) return u.searchParams.get('v');
    // https://youtu.be/VIDEO_ID
    if (u.hostname === 'youtu.be') return u.pathname.slice(1).split('?')[0];
    // https://www.youtube.com/embed/VIDEO_ID or shorts/VIDEO_ID
    const m = u.pathname.match(/\/(?:embed|shorts)\/([a-zA-Z0-9_-]{11})/);
    if (m) return m[1];
  } catch { /* ignore */ }
  return null;
}

async function fetchYouTubeDuration(url) {
  const videoId = extractYouTubeVideoId(url);
  if (!videoId) return null;

  const controller = new AbortController();
  const res = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
    signal : controller.signal,
    headers: {
      'User-Agent'     : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
    },
  });
  if (!res.ok) return null;

  const html = await res.text();

  // Primary: "lengthSeconds":"1234"
  let m = html.match(/"lengthSeconds":"(\d+)"/);
  if (m) return parseInt(m[1], 10);

  // Fallback: approxDurationMs
  m = html.match(/"approxDurationMs":"(\d+)"/);
  if (m) return Math.round(parseInt(m[1], 10) / 1000);

  return null;
}

// ─────────────────────────────────────────────────────────────────────────
// Vimeo — free oEmbed endpoint returns duration directly
// ─────────────────────────────────────────────────────────────────────────

async function fetchVimeoDuration(url) {
  const res = await fetch(
    `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}`
  );
  if (!res.ok) return null;
  const data = await res.json();
  return (data.duration && data.duration > 0) ? parseInt(data.duration, 10) : null;
}

// ─────────────────────────────────────────────────────────────────────────
// Loom — oEmbed may carry duration on some recordings
// ─────────────────────────────────────────────────────────────────────────

async function fetchLoomDuration(url) {
  const res = await fetch(
    `https://www.loom.com/v1/oembed?url=${encodeURIComponent(url)}`
  );
  if (!res.ok) return null;
  const data = await res.json();
  return (data.duration && data.duration > 0) ? parseInt(data.duration, 10) : null;
}

// ─────────────────────────────────────────────────────────────────────────
// Google Drive — extract duration from the viewer page HTML
// Works for public "anyone with link" video files; no API key required.
// Google Drive embeds metadata in the initial HTML for video files.
// ─────────────────────────────────────────────────────────────────────────

async function fetchGoogleDriveDuration(url) {
  try {
    const { pathname } = new URL(url);
    const match = pathname.match(/\/file\/d\/([^/?#]+)/);
    if (!match) return null;

    const fileId = match[1];

    // Try the viewer page — Google Drive includes video metadata in the
    // initial page JSON for public video files.
    const viewUrl = `https://drive.google.com/file/d/${fileId}/view`;
    const res = await fetch(viewUrl, {
      redirect: 'follow',
      headers: {
        'User-Agent'     : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
        'Accept'         : 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });
    if (!res.ok) return null;

    const html = await res.text();

    // Pattern 1: "durationMillis":"12345"  (most common in page JSON blobs)
    let m = html.match(/"durationMillis":"(\d+)"/);
    if (m) return Math.round(parseInt(m[1], 10) / 1000);

    // Pattern 2: durationMillis without quotes around value
    m = html.match(/"durationMillis":(\d+)/);
    if (m) return Math.round(parseInt(m[1], 10) / 1000);

    // Pattern 3: og:video:duration meta tag (seconds)
    m = html.match(/property="og:video:duration"\s+content="(\d+)"/);
    if (!m) m = html.match(/content="(\d+)"\s+property="og:video:duration"/);
    if (m) {
      const val = parseInt(m[1], 10);
      // og:video:duration is in seconds; sanity-check it's not milliseconds
      return val > 0 ? val : null;
    }

    return null;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Helper — wrap a promise with a hard timeout
// ─────────────────────────────────────────────────────────────────────────

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise(resolve => setTimeout(() => resolve(null), ms)),
  ]);
}
