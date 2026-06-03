import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

// ── OAuth error messages ──────────────────────────────────────
const OAUTH_ERRORS = {
  google_cancelled     : 'Google sign-in was cancelled.',
  oauth_state_mismatch : 'Sign-in failed (security check). Please try again.',
  oauth_failed         : 'Sign-in failed. Please try again.',
};

export default function Login() {
  const [searchParams] = useSearchParams();
  const { refetch } = useAuth();

  const [email,         setEmail]         = useState('');
  const [password,      setPassword]      = useState('');
  const [showPassword,  setShowPassword]  = useState(false);
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState('');
  const [googleEnabled, setGoogleEnabled] = useState(false);

  // Deactivated-account restore flow
  const [deactivated, setDeactivated] = useState(null); // { name, message } | null
  const [restoring,   setRestoring]   = useState(false);
  const [restoredMsg, setRestoredMsg] = useState('');

  // Pick up an OAuth restore token (deactivated account via Google) or error.
  useEffect(() => {
    const restoreToken = searchParams.get('restore_token');
    if (restoreToken) {
      const name = searchParams.get('name');
      setDeactivated({
        name,
        token  : restoreToken,
        message: 'Your account has been deactivated. Would you like to restore it?',
      });
      return;
    }
    const errKey = searchParams.get('error');
    if (errKey && OAUTH_ERRORS[errKey]) setError(OAUTH_ERRORS[errKey]);
  }, [searchParams]);

  // Check which providers are configured on the server
  useEffect(() => {
    api.get('/auth/providers')
      .then(res => setGoogleEnabled(!!res.data.google))
      .catch(() => {});
  }, []);

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/login', { email, password });
      // Refetch user BEFORE navigating — the httpOnly cookie is now set and
      // AuthContext needs to load the user so ProtectedRoute lets us through.
      await refetch();
      // Hard navigation so the browser detects the password form submission
      // and shows the native "Save password?" prompt.
      window.location.replace('/dashboard');
    } catch (err) {
      const data = err.response?.data;
      // Deactivated account (correct password) — offer self-service restore.
      if (data?.deactivated) {
        setDeactivated({ name: data.name, message: data.message });
        setLoading(false);
        return;
      }
      // Server returns { error: '...' } for both 401 and first-login 400
      const msg = data?.error || data?.message || 'Something went wrong. Please try again.';
      setError(msg);
      setLoading(false);
    }
  }

  async function handleRestore() {
    setRestoring(true);
    setError('');
    try {
      // OAuth restore uses the short-lived token; email/password uses credentials.
      const { data } = deactivated?.token
        ? await api.post('/auth/restore-token', { token: deactivated.token })
        : await api.post('/auth/restore-account', { email, password });
      setRestoredMsg(`${data.name || 'Account'} restored`);
      await refetch();
      setTimeout(() => window.location.replace('/dashboard'), 900);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Could not restore. Please try again.');
      setRestoring(false);
      setDeactivated(null);
    }
  }

  function handleGoogleLogin() {
    window.location.href = '/api/auth/oauth/google';
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center px-4 py-12">

      {/* Logo */}
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="text-amber-500 text-3xl">▶</span>
          <span className="text-2xl font-bold text-amber-500 tracking-tight">VidaPulse</span>
        </div>
        <p className="text-gray-400 text-sm">Video Analytics for Coaches, Creators &amp; Educators</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-md bg-gray-800 border border-gray-700 rounded-2xl p-8 shadow-xl">
        <h1 className="text-xl font-bold text-gray-50 mb-6">Welcome to VidaPulse</h1>

        {/* Error banner */}
        {error && (
          <div className="mb-4 px-4 py-3 bg-red-900/40 border border-red-700/50 rounded-lg text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Deactivated → restore prompt */}
        {deactivated && !restoredMsg && (
          <div className="mb-4 px-4 py-4 bg-amber-900/30 border border-amber-700/50 rounded-lg">
            <p className="text-amber-200 text-sm mb-3">{deactivated.message}</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleRestore}
                disabled={restoring}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
              >
                {restoring ? 'Restoring…' : 'Yes, restore'}
              </button>
              <button
                type="button"
                onClick={() => setDeactivated(null)}
                disabled={restoring}
                className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
              >
                No
              </button>
            </div>
          </div>
        )}

        {/* Restored confirmation */}
        {restoredMsg && (
          <div className="mb-4 px-4 py-3 bg-emerald-900/30 border border-emerald-700/50 rounded-lg text-emerald-200 text-sm flex items-center gap-2">
            <span>✓</span> {restoredMsg}
          </div>
        )}

        {/* Google OAuth — only shown when configured on the server */}
        {googleEnabled && (
          <>
            <div className="mb-5">
              <button
                onClick={handleGoogleLogin}
                className="flex items-center justify-center gap-3 w-full py-2.5 px-4
                           bg-white text-gray-800 font-medium text-sm rounded-lg
                           hover:bg-gray-100 transition-colors"
              >
                <GoogleIcon />
                Continue with Google
              </button>
            </div>

            <div className="relative mb-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-700" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-gray-800 px-3 text-gray-500">or sign in with email</span>
              </div>
            </div>
          </>
        )}

        {/* Email/password form — autocomplete attributes enable browser password saving */}
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Email address
            </label>
            <input
              type="email"
              name="email"
              autoComplete="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 text-gray-100
                         placeholder-gray-500 rounded-lg px-3.5 py-2.5 text-sm
                         focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-medium text-gray-300">Password</label>
              <Link
                to="/forgot-password"
                className="text-xs text-amber-500 hover:text-amber-400 transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 text-gray-100
                           placeholder-gray-500 rounded-lg px-3.5 py-2.5 pr-10 text-sm
                           focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-amber-500/50
                       text-gray-900 font-semibold text-sm rounded-lg py-2.5
                       transition-colors disabled:cursor-not-allowed mt-1"
          >
            {loading ? 'Signing in…' : 'Continue'}
          </button>
        </form>

        {/* Sign up note */}
        <p className="mt-5 text-center text-xs text-gray-500">
          Don't have an account?{' '}
          <Link to="/register" className="text-amber-400 hover:text-amber-300 font-medium transition-colors">
            Create free account →
          </Link>
        </p>

      </div>
    </div>
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────

function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );
}

// ── Brand SVG icon ────────────────────────────────────────────

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  );
}
