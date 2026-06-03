import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { pixelTrack } from '../lib/pixel';
import { getLeadSource, clearLeadSource } from '../lib/leadSource';

/**
 * Register — self-signup for new subscribers (free plan).
 * Route: /register
 */
export default function Register() {
  const navigate = useNavigate();
  const { refetch } = useAuth();
  const [searchParams] = useSearchParams();

  // Prefill email from the link (?email=...) — forwarded by the CTA tracking
  // redirect from the landing opt-in / Thank-You button / registration email.
  const prefillEmail = (searchParams.get('email') || '').trim();

  const [email,     setEmail]     = useState(prefillEmail);
  const [password,  setPassword]  = useState('');
  const [confirm,   setConfirm]   = useState('');
  const [showPw,    setShowPw]    = useState(false);
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState('');
  const [googleEnabled, setGoogleEnabled] = useState(false);
  // While true we show a spinner instead of the form — covers the existing-
  // account lookup and the redirect to Google for known Google accounts.
  const [checking,      setChecking]      = useState(!!prefillEmail);
  // 'register' (new account) | 'signin' (prefilled email already has a password account)
  const [mode,          setMode]          = useState('register');

  useEffect(() => {
    api.get('/auth/providers')
      .then(res => setGoogleEnabled(!!res.data.google))
      .catch(() => {});
  }, []);

  // When the email is prefilled, check whether it already belongs to a Google
  // account. If so, send the user straight through Google OAuth → dashboard
  // (no password form). Otherwise reveal the password form.
  useEffect(() => {
    if (!prefillEmail) return;
    let cancelled = false;
    api.get(`/auth/email-status?email=${encodeURIComponent(prefillEmail)}`)
      .then(({ data }) => {
        if (cancelled) return;
        if (data?.google) {
          // Keep the spinner up — we're leaving the SPA for Google.
          window.location.href =
            `/api/auth/oauth/google?login_hint=${encodeURIComponent(prefillEmail)}`;
          return;
        }
        // Existing password account → show sign-in instead of register.
        if (data?.exists) setMode('signin');
        setChecking(false);
      })
      .catch(() => { if (!cancelled) setChecking(false); });
    return () => { cancelled = true; };
  }, [prefillEmail]);

  function handleGoogleSignup() {
    window.location.href = '/api/auth/oauth/google';
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/register', {
        email      : email.trim(),
        password,
        lead_source: getLeadSource() || undefined,
      });
      clearLeadSource();
      await refetch();
      pixelTrack('StartTrial');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message ?? 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // Sign-in for a prefilled email that already has a password account.
  async function handleSignIn(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email: email.trim(), password });
      await refetch();
      navigate(data.redirect || '/dashboard', { replace: true });
    } catch (err) {
      // Deactivated account → hand off to the full login page (restore flow lives there).
      if (err.response?.status === 403 && err.response?.data?.deactivated) {
        navigate(`/login?email=${encodeURIComponent(email.trim())}`, { replace: true });
        return;
      }
      setError(err.response?.data?.error ?? err.response?.data?.message ?? 'Sign in failed. Please try again.');
      setLoading(false);
    }
  }

  // Password strength score
  const pw = password;
  const strength = [pw.length >= 8, pw.length >= 12, /[A-Z]/.test(pw), /[0-9]/.test(pw), /[^A-Za-z0-9]/.test(pw)].filter(Boolean).length;
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very strong'][strength];
  const strengthColor = ['', 'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-emerald-500', 'bg-emerald-400'][strength];
  const strengthText  = ['', 'text-red-400', 'text-orange-400', 'text-amber-400', 'text-emerald-400', 'text-emerald-300'][strength];

  // Checking the prefilled email (and possibly redirecting to Google) — show a
  // spinner instead of flashing the password form.
  if (checking) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center px-4 gap-4">
        <div className="flex items-center gap-2">
          <span className="text-amber-500 text-2xl select-none">{'▶︎'}</span>
          <span className="text-xl font-bold text-amber-500 tracking-tight">VidaPulse</span>
        </div>
        <span className="w-6 h-6 border-2 border-gray-600 border-t-amber-500 rounded-full animate-spin" />
        <p className="text-sm text-gray-400">Checking your account…</p>
      </div>
    );
  }

  // Prefilled email already has a password account → sign in (not register).
  if (mode === 'signin') {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm">

          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <span className="text-amber-500 text-2xl select-none">{'▶︎'}</span>
            <span className="text-xl font-bold text-amber-500 tracking-tight">VidaPulse</span>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8">
            <h1 className="text-xl font-bold text-gray-50 mb-1">Welcome back</h1>
            <p className="text-sm text-gray-400 mb-6">You already have an account — just enter your password to continue.</p>

            {error && (
              <div className="mb-4 px-4 py-3 bg-red-900/30 border border-red-700/40 rounded-lg text-red-300 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSignIn} className="flex flex-col gap-4">
              {/* Email — locked, from the link */}
              <div>
                <label className="block text-xs text-gray-400 mb-1.5 font-medium">Email address</label>
                <input
                  type="email"
                  value={email}
                  readOnly
                  autoComplete="email"
                  className="w-full bg-gray-800 border border-gray-700 text-gray-400 text-sm rounded-lg
                             px-3 py-2.5 focus:outline-none cursor-not-allowed"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs text-gray-400 mb-1.5 font-medium">Password</label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Your password"
                    required
                    autoFocus
                    disabled={loading}
                    autoComplete="current-password"
                    className="w-full bg-gray-700 border border-gray-600 focus:border-amber-500
                               text-gray-100 placeholder-gray-500 text-sm rounded-lg
                               px-3 py-2.5 pr-10 focus:outline-none transition-colors"
                  />
                  <button type="button" onClick={() => setShowPw(v => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                    {showPw ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !password}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 disabled:bg-amber-500/40
                           text-gray-900 font-semibold text-sm rounded-lg transition-colors
                           disabled:cursor-not-allowed mt-1"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-gray-900/40 border-t-gray-900 rounded-full animate-spin" />
                    Signing in…
                  </span>
                ) : 'Sign in'}
              </button>
            </form>

            <p className="text-center text-xs text-gray-500 mt-5">
              <Link to="/login" className="text-amber-400 hover:text-amber-300 font-medium transition-colors">
                Forgot password?
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <span className="text-amber-500 text-2xl select-none">{'▶︎'}</span>
          <span className="text-xl font-bold text-amber-500 tracking-tight">VidaPulse</span>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8">
          <h1 className="text-xl font-bold text-gray-50 mb-1">Create your account</h1>
          <p className="text-sm text-gray-400 mb-6">Free forever. No credit card required.</p>

          {error && (
            <div className="mb-4 px-4 py-3 bg-red-900/30 border border-red-700/40 rounded-lg text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* Google OAuth — only shown when configured on the server */}
          {googleEnabled && (
            <>
              <div className="mb-5">
                <button
                  type="button"
                  onClick={handleGoogleSignup}
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
                  <span className="bg-gray-800 px-3 text-gray-500">or sign up with email</span>
                </div>
              </div>
            </>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            {/* Email */}
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-medium">Email address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                disabled={loading}
                autoComplete="email"
                className="w-full bg-gray-700 border border-gray-600 focus:border-amber-500
                           text-gray-100 placeholder-gray-500 text-sm rounded-lg
                           px-3 py-2.5 focus:outline-none transition-colors"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-medium">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  required
                  disabled={loading}
                  autoComplete="new-password"
                  className="w-full bg-gray-700 border border-gray-600 focus:border-amber-500
                             text-gray-100 placeholder-gray-500 text-sm rounded-lg
                             px-3 py-2.5 pr-10 focus:outline-none transition-colors"
                />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                  {showPw ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>

              {/* Strength bar */}
              {password.length > 0 && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex gap-1 flex-1">
                    {[1,2,3,4,5].map(i => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= strength ? strengthColor : 'bg-gray-700'}`} />
                    ))}
                  </div>
                  <span className={`text-xs font-medium flex-shrink-0 ${strengthText}`}>{strengthLabel}</span>
                </div>
              )}
            </div>

            {/* Confirm */}
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-medium">Confirm password</label>
              <input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Repeat password"
                required
                disabled={loading}
                autoComplete="new-password"
                className={`w-full bg-gray-700 border focus:outline-none
                            text-gray-100 placeholder-gray-500 text-sm rounded-lg
                            px-3 py-2.5 transition-colors
                            ${confirm && confirm !== password
                              ? 'border-red-500/60 focus:border-red-500'
                              : 'border-gray-600 focus:border-amber-500'
                            }`}
              />
              {confirm && confirm !== password && (
                <p className="text-xs text-red-400 mt-1">Passwords do not match</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !email || !password || password !== confirm}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 disabled:bg-amber-500/40
                         text-gray-900 font-semibold text-sm rounded-lg transition-colors
                         disabled:cursor-not-allowed mt-1"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-gray-900/40 border-t-gray-900 rounded-full animate-spin" />
                  Creating account…
                </span>
              ) : 'Create free account'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-5">
          Already have an account?{' '}
          <Link to="/login" className="text-amber-400 hover:text-amber-300 font-medium transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

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

function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  );
}
function EyeOffIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );
}
