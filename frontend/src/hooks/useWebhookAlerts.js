/**
 * useWebhookAlerts — polls GET /api/admin/contact-webhook-status every 30 s.
 *
 * Returns { paused, pausedAt, pausedReason, queuedCount, failedCount, loading, refresh }
 *
 * When `paused` transitions from false → true (i.e. a new failure is detected),
 * this hook fires a browser OS notification if the user has granted permission.
 *
 * Only polls when `enabled` is true (pass `enabled={isAdmin}` to skip for
 * non-admin users).
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import api from '../lib/api';

const POLL_INTERVAL_MS = 30_000;

export function useWebhookAlerts({ enabled = true } = {}) {
  const [state, setState] = useState({
    paused      : false,
    pausedAt    : null,
    pausedReason: null,
    queuedCount : 0,
    failedCount : 0,
    loading     : true,
  });

  // Track previous paused state to detect transitions
  const prevPausedRef = useRef(false);
  // Track if we've ever fetched (avoids false "new failure" on mount when already paused)
  const firstFetchRef = useRef(true);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    try {
      const { data } = await api.get('/admin/contact-webhook-status');
      const nowPaused = !!data.paused;

      // Detect fresh failure: was OK, now paused — AND it's not the very first load
      if (!firstFetchRef.current && !prevPausedRef.current && nowPaused) {
        _triggerBrowserNotification(data.queued_count ?? 0);
      }

      prevPausedRef.current = nowPaused;
      firstFetchRef.current  = false;

      setState({
        paused      : nowPaused,
        pausedAt    : data.paused_at    ?? null,
        pausedReason: data.paused_reason ?? null,
        queuedCount : data.queued_count  ?? 0,
        failedCount : data.failed_count  ?? 0,
        loading     : false,
      });
    } catch {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [enabled]);

  // Initial load + periodic poll
  useEffect(() => {
    if (!enabled) return;
    refresh();
    const id = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [enabled, refresh]);

  return { ...state, refresh };
}

// ── Browser OS notification ──────────────────────────────────────────────

function _triggerBrowserNotification(queuedCount) {
  if (!('Notification' in window)) return;

  const body = queuedCount > 0
    ? `${queuedCount} webhook${queuedCount !== 1 ? 's' : ''} queued. Go to Admin → Webhook Log to resend.`
    : 'Go to Admin → Webhook Log to review and resend.';

  if (Notification.permission === 'granted') {
    _showNotification(body);
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission().then(perm => {
      if (perm === 'granted') _showNotification(body);
    });
  }
}

function _showNotification(body) {
  try {
    const n = new Notification('⚠ VidaPulse — Contact webhook failed', {
      body,
      icon : '/favicon.ico',
      tag  : 'vidapulse-webhook-failure', // replaces previous notification with same tag
    });
    // Auto-close after 10 s
    setTimeout(() => n.close(), 10_000);
  } catch (_) {}
}
