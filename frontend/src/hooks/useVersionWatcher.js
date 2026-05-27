import { useEffect, useRef } from 'react';
import api from '../lib/api';

const POLL_INTERVAL_MS = 60_000; // check every 60 s

/**
 * useVersionWatcher
 *
 * Polls GET /api/version every 60 s.  When the server's `started_at`
 * timestamp changes (new Railway deploy → process restart), the hook
 * calls window.location.reload(true) so the user automatically gets
 * the latest frontend build without having to refresh manually.
 *
 * First poll just records the baseline — it never triggers a reload
 * on the initial page load, only on subsequent changes.
 *
 * Mount this once in App.jsx so it runs for the entire session.
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
          // First successful response — store baseline, do not reload
          baselineRef.current = serverVersion;
        } else if (serverVersion !== baselineRef.current) {
          // Version changed: new deploy detected → reload to pick up new bundles
          if (!cancelled) {
            window.location.reload(true);
          }
        }
      } catch {
        // Network blip or server restarting mid-deploy — skip silently
      }
    }

    // Check on mount, then on a fixed interval
    check();
    const timer = setInterval(check, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []); // runs once per mount
}
