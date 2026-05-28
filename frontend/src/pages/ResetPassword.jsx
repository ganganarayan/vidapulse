import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

export default function ResetPassword() {
  const { refetch } = useAuth();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [email,        setEmail]        = useState('');   // fetched from token
  const [password,     setPassword]     = useState('');
  const [confirm,      setConfirm]      = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm,  setShowConfirm]  = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState('');

  // Fetch the email for this token so we can:
  //  1. Show "Resetting password for: user@example.com" (good UX)
  //  2. Include a name="email" input so ALL browsers associate the new
  //     password with the correct account and show "Save password?"
  useEffect(() => {
    if (!token) return;
    api.get(`/auth/reset-token-email?token=${encodeURIComponent(token)}`)
      .then(res => setEmail(res.data.email ?? ''))
      .catch(() => {}); // silent — email field just stays empty
  }, [token]);

  function strength(pw) {
    let s = 0;
    if (pw.length >= 8)                      s++;
    if (/[A-Z]/.test(pw) || /\d/.test(pw))  s++;
    if (pw.length >= 12)                     s++;
    return s;
  }

  const pw_strength   = strength(password);
  const strengthLabel = ['', 'Weak', 'Good', 'Strong'][pw_strength];
  const strengthColor = ['', 'bg-red-500', 'bg-amber-500', 'bg-green-500'][pw_strength];

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('Missing token — please use the link from your email.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      await refetch();
      // Hard navigation so the browser detects the password form submission
      // and shows the native "Save password?" prompt on all browsers.
      window.location.replace('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center px-4 py-12">

      {/* Logo */}
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="text-amber-500 text-3xl">▶</span>
          <span className="text-2xl font-bold text-amber-500 tracking-tight">VidaPulse</span>
        </div>
      </div>

      {/* Card */}
      <div className="w-full max-w-md bg-gray-800 border border-gray-700 rounded-2xl p-8 shadow-xl">
        <h1 className="text-xl font-bold text-gray-50 mb-1">Reset your password</h1>
        <p className="text-sm text-gray-400 mb-6">Enter a new password for your account.</p>

        {/* Error banner */}
        {error && (
          <div className="mb-4 px-4 py-3 bg-red-900/40 border border-red-700/50 rounded-lg text-red-300 text-sm">
            {error}{' '}
            {(error.includes('expired') || error.includes('Invalid')) && (
              <Link to="/forgot-password" className="text-amber-400 hover:text-amber-300 underline ml-1">
                Request a new link
              </Link>
            )}
          </div>
        )}

        {!token && !error && (
          <div className="mb-4 px-4 py-3 bg-amber-900/30 border border-amber-700/50 rounded-lg text-amber-300 text-sm">
            No token found. Please use the link from your reset email.
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

          {/*
            Hidden email field — critical for cross-browser password saving.
            Safari iOS, Firefox, and Edge use name="email" + autocomplete="email"
            to know which account the new password belongs to. Without this,
            most mobile browsers silently skip the "Save password?" prompt.
          */}
          <input
            type="email"
            name="email"
            autoComplete="email"
            value={email}
            readOnly
            aria-hidden="true"
            tabIndex={-1}
            style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', height: 0 }}
          />

          {/* Account indicator — visible only once email is loaded */}
          {email && (
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-700/50 border border-gray-700 rounded-lg">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                className="text-gray-500 flex-shrink-0">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              <span className="text-xs text-gray-400 truncate">{email}</span>
            </div>
          )}

          {/* New password */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">New password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="new-password"
                autoComplete="new-password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 text-gray-100
                           placeholder-gray-500 rounded-lg px-3.5 py-2.5 pr-10 text-sm
                           focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="Minimum 8 characters"
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
            {password.length > 0 && (
              <div className="mt-2 flex items-center gap-2">
                <div className="flex gap-1 flex-1">
                  {[1, 2, 3].map(i => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        i <= pw_strength ? strengthColor : 'bg-gray-600'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs text-gray-400">{strengthLabel}</span>
              </div>
            )}
          </div>

          {/* Confirm password */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Confirm password</label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                name="confirm-password"
                autoComplete="new-password"
                required
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                className={`w-full bg-gray-700 border text-gray-100
                            placeholder-gray-500 rounded-lg px-3.5 py-2.5 pr-10 text-sm
                            focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent
                            ${confirm && password !== confirm ? 'border-red-500' : 'border-gray-600'}`}
                placeholder="Re-enter your password"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                tabIndex={-1}
              >
                {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
            {confirm && password !== confirm && (
              <p className="mt-1 text-xs text-red-400">Passwords do not match</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !token}
            className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-amber-500/50
                       text-gray-900 font-semibold text-sm rounded-lg py-2.5
                       transition-colors disabled:cursor-not-allowed mt-1"
          >
            {loading ? 'Saving…' : 'Reset Password & Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link to="/login" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
            ← Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Icons ────────────────────────────────────────────────────────────────────

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
