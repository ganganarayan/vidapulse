import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../lib/api';

// ── OAuth error messages ──────────────────────────────────────
const OAUTH_ERRORS = {
  google_not_configured   : 'Google sign-in is not yet available.',
  microsoft_not_configured: 'Microsoft sign-in is not yet available.',
  google_cancelled        : 'Google sign-in was cancelled.',
  microsoft_cancelled     : 'Microsoft sign-in was cancelled.',
  oauth_state_mismatch    : 'Sign-in failed (security check). Please try again.',
  oauth_failed            : 'Sign-in failed. Please try again.',
};

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [email,     setEmail]     = useState('');
  const [password,  setPassword]  = useState('');
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [providers, setProviders] = useState({ google: false, microsoft: false });

  // Pick up any OAuth error from query params
  useEffect(() => {
    const errKey = searchParams.get('error');
    if (errKey && OAUTH_ERRORS[errKey]) setError(OAUTH_ERRORS[errKey]);
  }, [searchParams]);

  // Ask the backend which OAuth providers are configured
  useEffect(() => {
    api.get('/auth/providers')
      .then(res => setProviders(res.data))
      .catch(() => {}); // silently ignore — buttons just won't show
  }, []);

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/login', { email, password });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleGoogleLogin() {
    // Redirect to backend — backend handles the OAuth flow and redirects back
    window.location.href = '/api/auth/oauth/google';
  }

  function handleMicrosoftLogin() {
    window.location.href = '/api/auth/oauth/microsoft';
  }

  const showOAuth = providers.google || providers.microsoft;

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
        <h1 className="text-xl font-bold text-gray-50 mb-6">Welcome back</h1>

        {/* Error banner */}
        {error && (
          <div className="mb-4 px-4 py-3 bg-red-900/40 border border-red-700/50 rounded-lg text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* OAuth buttons */}
        {showOAuth && (
          <>
            <div className="flex flex-col gap-3 mb-5">
              {providers.google && (
                <button
                  onClick={handleGoogleLogin}
                  className="flex items-center justify-center gap-3 w-full py-2.5 px-4
                             bg-white text-gray-800 font-medium text-sm rounded-lg
                             hover:bg-gray-100 transition-colors"
                >
                  <GoogleIcon />
                  Continue with Google
                </button>
              )}
              {providers.microsoft && (
                <button
                  onClick={handleMicrosoftLogin}
                  className="flex items-center justify-center gap-3 w-full py-2.5 px-4
                             bg-white text-gray-800 font-medium text-sm rounded-lg
                             hover:bg-gray-100 transition-colors"
                >
                  <MicrosoftIcon />
                  Continue with Microsoft
                </button>
              )}
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

        {/* Email/password form */}
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Email address
            </label>
            <input
              type="email"
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
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 text-gray-100
                         placeholder-gray-500 rounded-lg px-3.5 py-2.5 text-sm
                         focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-amber-500/50
                       text-gray-900 font-semibold text-sm rounded-lg py-2.5
                       transition-colors disabled:cursor-not-allowed mt-1"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        {/* Sign up note */}
        <p className="mt-5 text-center text-xs text-gray-500">
          Don't have an account?{' '}
          {showOAuth
            ? <span className="text-gray-400">Sign up with Google or Microsoft above.</span>
            : <span className="text-gray-400">Contact support to get access.</span>
          }
        </p>
      </div>
    </div>
  );
}

// ── Brand SVG icons ───────────────────────────────────────────

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

function MicrosoftIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg">
      <rect x="1"  y="1"  width="9" height="9" fill="#f25022"/>
      <rect x="11" y="1"  width="9" height="9" fill="#00a4ef"/>
      <rect x="1"  y="11" width="9" height="9" fill="#7fba00"/>
      <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
    </svg>
  );
}
