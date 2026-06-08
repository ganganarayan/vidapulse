import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';

/**
 * ImpersonationBanner
 *
 * Fixed top banner displayed whenever an admin is inside a subscriber's account.
 * - Non-dismissable
 * - z-[9999] — sits above all modals and overlays
 * - Shows who is being viewed and the elapsed session time
 * - "Exit Account" calls endImpersonation() and redirects to /admin/users
 *
 * Rendered once at the App root level (inside <AuthProvider>).
 * Invisible when isImpersonating is false.
 */
export default function ImpersonationBanner() {
  const { isImpersonating, impersonationTarget, endImpersonation } = useAuth();
  const [elapsed,  setElapsed]  = useState(0);   // seconds since banner mounted
  const [exiting,  setExiting]  = useState(false);
  const bannerRef = useRef(null);

  // The banner is position:fixed, so it would overlap page content (e.g. the
  // "Add Video" button). While it's shown, offset the page by the banner's
  // actual height — re-measured on resize since the bar wraps on small screens.
  useEffect(() => {
    if (!isImpersonating) return;

    const apply = () => {
      const h = bannerRef.current?.offsetHeight ?? 0;
      document.body.style.paddingTop = h ? `${h}px` : '';
    };
    apply();

    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(apply) : null;
    if (ro && bannerRef.current) ro.observe(bannerRef.current);
    window.addEventListener('resize', apply);

    return () => {
      document.body.style.paddingTop = '';
      if (ro) ro.disconnect();
      window.removeEventListener('resize', apply);
    };
  }, [isImpersonating]);

  // Elapsed timer — resets whenever a new impersonation session starts
  useEffect(() => {
    if (!isImpersonating) {
      setElapsed(0);
      return;
    }

    setElapsed(0);
    const id = setInterval(() => setElapsed(s => s + 1), 1000);
    return () => clearInterval(id);
  }, [isImpersonating]);

  if (!isImpersonating) return null;

  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;
  const timeStr = h > 0
    ? `${h}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`
    : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

  async function handleExit() {
    if (exiting) return;
    setExiting(true);
    try {
      await endImpersonation();
      // endImpersonation() re-fetches user as admin; redirect to admin panel
      window.location.href = '/admin/users';
    } catch (err) {
      // Even on error, endImpersonation() clears local state.
      // Redirect anyway — the user will see their admin dashboard.
      console.error('[ImpersonationBanner] endImpersonation error:', err);
      window.location.href = '/admin/users';
    }
  }

  const targetName  = impersonationTarget?.name  ?? impersonationTarget?.email ?? 'subscriber';
  const targetEmail = impersonationTarget?.email ?? '';
  const targetPlan  = impersonationTarget?.plan  ?? '';

  return (
    <div
      ref={bannerRef}
      className="fixed top-0 left-0 right-0 z-[9999] bg-red-700 text-white shadow-lg"
      role="alert"
      aria-live="polite"
    >
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between gap-4 flex-wrap">

        {/* Left: identity info */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Warning icon */}
          <svg className="w-5 h-5 flex-shrink-0 text-red-200" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>

          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span className="font-semibold text-sm whitespace-nowrap">Admin Mode</span>
            <span className="text-red-300 text-sm hidden sm:inline">—</span>
            <span className="text-sm truncate">
              Viewing as{' '}
              <span className="font-bold">{targetName}</span>
              {targetEmail && targetEmail !== targetName && (
                <span className="text-red-200 ml-1">({targetEmail})</span>
              )}
              {targetPlan && (
                <span className="ml-2 px-1.5 py-0.5 bg-red-900 rounded text-xs uppercase tracking-wide">
                  {targetPlan}
                </span>
              )}
            </span>
          </div>
        </div>

        {/* Right: timer + exit button */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-red-200 text-sm font-mono tabular-nums">
            {timeStr}
          </span>

          <button
            onClick={handleExit}
            disabled={exiting}
            className="
              px-4 py-1.5 rounded text-sm font-semibold
              bg-white text-red-700 hover:bg-red-50
              disabled:opacity-60 disabled:cursor-not-allowed
              transition-colors duration-150
              flex items-center gap-2
            "
          >
            {exiting ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-red-700 border-t-transparent rounded-full animate-spin" />
                Exiting…
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Exit Account
              </>
            )}
          </button>
        </div>
      </div>

      {/* Thin animated stripe at the bottom to make it feel alive */}
      <div className="h-0.5 bg-red-500 opacity-60" />
    </div>
  );
}
