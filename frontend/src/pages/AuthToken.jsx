'use strict';
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

/**
 * AuthToken — /auth?token=<magic_link_token>
 *
 * Consumes a single-use magic link token, logs the user in, and
 * redirects to /dashboard.  Shows a skippable "set a password" nudge
 * when the user has no password yet (created via magic_link flow).
 */
export default function AuthToken() {
  const [searchParams]               = useSearchParams();
  const navigate                     = useNavigate();
  const { refetch }                  = useAuth();

  const [status,    setStatus]    = useState('checking'); // checking | success | expired | invalid | deactivated
  const [pwNudge,   setPwNudge]   = useState(false);

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('invalid');
      return;
    }

    let cancelled = false;
    api.post('/auth/magic-link/consume', { token })
      .then(async ({ data }) => {
        if (cancelled) return;
        await refetch();
        if (!data.password_set) setPwNudge(true);
        setStatus('success');
        // Short pause so the nudge is readable, then redirect
        setTimeout(() => {
          if (!cancelled) navigate('/dashboard', { replace: true });
        }, data.password_set ? 800 : 3500);
      })
      .catch(err => {
        if (cancelled) return;
        const reason = err.response?.data?.reason ?? 'invalid';
        setStatus(reason === 'expired' ? 'expired' : reason === 'deactivated' ? 'deactivated' : 'invalid');
      });

    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">

        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-10">
          <span className="text-amber-500 text-2xl select-none">{'▶︎'}</span>
          <span className="text-xl font-bold text-amber-500 tracking-tight">VidaPulse</span>
        </div>

        {/* ── Checking ───────────────────────────────────────── */}
        {status === 'checking' && (
          <div className="flex flex-col items-center gap-4">
            <span className="w-8 h-8 border-2 border-gray-600 border-t-amber-500 rounded-full animate-spin" />
            <p className="text-sm text-gray-400">Signing you in…</p>
          </div>
        )}

        {/* ── Success ────────────────────────────────────────── */}
        {status === 'success' && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/15 border border-emerald-500/30
                            flex items-center justify-center text-emerald-400 text-xl">✓</div>
            <p className="text-base font-semibold text-gray-100">You're in!</p>
            {pwNudge ? (
              <div className="bg-amber-500/8 border border-amber-500/25 rounded-xl p-4 text-left mt-2">
                <p className="text-sm text-amber-300 font-medium mb-1">Want a password for direct login?</p>
                <p className="text-xs text-gray-400 mb-3">
                  You signed in via a magic link. Add a password in Settings to log in directly next time.
                </p>
                <div className="flex items-center gap-3">
                  <Link
                    to="/account"
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-gray-900
                               font-semibold text-xs rounded-lg transition-colors"
                  >
                    Set a password
                  </Link>
                  <Link
                    to="/dashboard"
                    className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    Skip for now
                  </Link>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-400">Redirecting to your dashboard…</p>
            )}
          </div>
        )}

        {/* ── Expired ────────────────────────────────────────── */}
        {status === 'expired' && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/25
                            flex items-center justify-center text-amber-400 text-xl">⏱</div>
            <p className="text-base font-semibold text-gray-100">Link expired</p>
            <p className="text-sm text-gray-400">
              Magic links are valid for 24 hours. Request a new one or sign in directly.
            </p>
            <Link
              to="/signin"
              className="mt-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-gray-900
                         font-semibold text-sm rounded-lg transition-colors"
            >
              Sign in
            </Link>
          </div>
        )}

        {/* ── Invalid ────────────────────────────────────────── */}
        {(status === 'invalid') && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/25
                            flex items-center justify-center text-red-400 text-xl">✕</div>
            <p className="text-base font-semibold text-gray-100">Invalid link</p>
            <p className="text-sm text-gray-400">
              This link has already been used or is not valid.
            </p>
            <Link
              to="/signin"
              className="mt-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-gray-900
                         font-semibold text-sm rounded-lg transition-colors"
            >
              Sign in
            </Link>
          </div>
        )}

        {/* ── Deactivated ────────────────────────────────────── */}
        {status === 'deactivated' && (
          <div className="flex flex-col items-center gap-4">
            <p className="text-base font-semibold text-gray-100">Account deactivated</p>
            <p className="text-sm text-gray-400">
              Your account has been deactivated. Use the sign-in page to restore it.
            </p>
            <Link
              to="/login"
              className="mt-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-gray-900
                         font-semibold text-sm rounded-lg transition-colors"
            >
              Go to sign in
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}
