import { useEffect, useRef } from 'react';
import api from '../lib/api';

/**
 * useVersionWatcher
 *
 * Detects a new Railway deploy (server `started_at` changes) and reloads
 * the page so the user gets the latest frontend build.
 *
 * IMPORTANT: this intentionally does NOT poll on a fixed interval. A 60 s
 * poll from every open tab was constant inbound traffic that prevented the
 * Railway instance from ever sleeping. Instead we check only:
 *   • once on mount, and
 *   • when the tab regains focus / becomes visible again.
 * That still catches new deploys the moment a user returns to the tab,
 * without a permanent idle heartbeat.
 */
export function useVersionWatcher() {
  const baselineRef = useRef(null); // null = "not yet recorded"

  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        const { data } = await api.get('/version');
        const serverVersion = data?.started_at;
        if (!serverVersion) return;

        if (baselineRef.current === null) {
          baselineRef.current = serverVersion;        // first response = baseline
        } else if (serverVersion !== baselineRef.current && !cancelled) {
          window.location.reload(true);               // new deploy → reload
        }
      } catch {
        // Network blip or server restarting mid-deploy — skip silently
      }
    }

    check(); // once on mount

    // Re-check only when the user comes back to the tab (event-driven, not polled)
    function onVisible() { if (document.visibilityState === 'visible') check(); }
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', check);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', check);
    };
  }, []); // runs once per mount
}
