import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate }             from 'react-router-dom';
import { useAuth }                            from '../contexts/AuthContext';
import { pixelTrack }                         from '../lib/pixel';

/**
 * PaymentSuccess — /payment/:plan
 *
 * Razorpay redirects here after a successful subscription payment.
 * The plan hasn't been activated yet at this point — the Razorpay webhook
 * fires asynchronously (usually within a few seconds).
 *
 * This page:
 *   1. Shows a "Payment received, activating your plan…" spinner
 *   2. Polls GET /api/user/me every 3 seconds (via AuthContext.refetch)
 *   3. When user.plan matches the expected plan → shows success screen
 *   4. Auto-redirects to /dashboard after 3 seconds
 *   5. Times out after 90 seconds and shows a "contact support" message
 *      (webhook may have been delayed — plan will activate shortly)
 */

const PLAN_LABELS = {
  starter: 'Starter',
  pro    : 'Pro',
};

// INR values matched to plan pricing
const PLAN_VALUES = {
  starter: 999,
  pro    : 1999,
};

const POLL_INTERVAL_MS = 3_000;   // poll every 3 s
const TIMEOUT_MS       = 90_000;  // give up after 90 s
const REDIRECT_DELAY   = 3_000;   // redirect 3 s after success

export default function PaymentSuccess() {
  const { plan }              = useParams();
  const { user, refetch }     = useAuth();
  const navigate              = useNavigate();

  const [phase,   setPhase]   = useState('polling'); // 'polling' | 'success' | 'timeout'
  const [seconds, setSeconds] = useState(0);

  const timedOut  = useRef(false);
  const activated = useRef(false);

  const planLabel = PLAN_LABELS[plan] ?? plan;

  useEffect(() => {
    // ── Poll until plan matches ────────────────────────────────────────────
    const pollInterval = setInterval(async () => {
      if (timedOut.current || activated.current) return;

      try {
        await refetch();
        // refetch updates AuthContext — the check below runs on next render
      } catch {
        // ignore network errors — keep polling
      }
    }, POLL_INTERVAL_MS);

    // ── Timeout ──────────────────────────────────────────────────────────
    const timeoutTimer = setTimeout(() => {
      if (!activated.current) {
        timedOut.current = true;
        setPhase('timeout');
        clearInterval(pollInterval);
      }
    }, TIMEOUT_MS);

    // ── Seconds counter (for UX — "Checking your account… 12s") ─────────
    const secondsInterval = setInterval(() => {
      setSeconds(s => s + 1);
    }, 1_000);

    return () => {
      clearInterval(pollInterval);
      clearTimeout(timeoutTimer);
      clearInterval(secondsInterval);
    };
  }, [refetch]);

  // Check if plan has been activated after each refetch
  useEffect(() => {
    if (activated.current || timedOut.current) return;
    if (!user) return;

    const planMatches =
      user.plan === plan ||
      (plan === 'pro' && user.plan === 'admin_lifetime');

    if (planMatches) {
      activated.current = true;
      setPhase('success');

      // Fire Meta Pixel Purchase event once plan is confirmed
      pixelTrack('Purchase', {
        value        : PLAN_VALUES[plan] ?? 0,
        currency     : 'INR',
        content_name : `VidaPulse ${planLabel} Plan`,
      });

      // Auto-redirect to dashboard after 3 s
      const t = setTimeout(() => navigate('/dashboard', { replace: true }), REDIRECT_DELAY);
      return () => clearTimeout(t);
    }
  }, [user, plan, navigate]);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md text-center">

        {phase === 'polling' && (
          <>
            <div className="w-16 h-16 mx-auto mb-6 border-4 border-amber-500 border-t-transparent
                            rounded-full animate-spin" />
            <h1 className="text-xl font-bold text-gray-100 mb-2">Activating your plan…</h1>
            <p className="text-sm text-gray-400 mb-1">
              Payment received. Waiting for confirmation from Razorpay.
            </p>
            <p className="text-xs text-gray-600">{seconds}s</p>
          </>
        )}

        {phase === 'success' && (
          <>
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-emerald-500/10
                            flex items-center justify-center">
              <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor"
                strokeWidth="2.5" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-100 mb-2">
              Welcome to {planLabel}!
            </h1>
            <p className="text-sm text-gray-400 mb-6">
              Your {planLabel} plan is now active. Redirecting to your dashboard…
            </p>
            <button
              onClick={() => navigate('/dashboard', { replace: true })}
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-gray-900
                         font-semibold text-sm rounded-lg transition-colors"
            >
              Go to Dashboard
            </button>
          </>
        )}

        {phase === 'timeout' && (
          <>
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-amber-500/10
                            flex items-center justify-center">
              <svg className="w-8 h-8 text-amber-400" fill="none" stroke="currentColor"
                strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-100 mb-2">Almost there</h1>
            <p className="text-sm text-gray-400 mb-2">
              Your payment was received. Plan activation is taking a little longer than usual.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Your {planLabel} plan will be active within a few minutes. Try refreshing the page.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="px-5 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200
                           text-sm rounded-lg transition-colors"
              >
                Refresh
              </button>
              <button
                onClick={() => navigate('/dashboard', { replace: true })}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-gray-900
                           font-semibold text-sm rounded-lg transition-colors"
              >
                Go to Dashboard
              </button>
            </div>
            <p className="mt-4 text-xs text-gray-600">
              If your plan hasn't activated in 10 minutes, please{' '}
              <button
                onClick={() => navigate('/help')}
                className="text-amber-500/80 hover:text-amber-400 transition-colors"
              >
                contact support
              </button>
              .
            </p>
          </>
        )}

      </div>
    </div>
  );
}
