import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

/**
 * Register — self-signup for new subscribers (free plan).
 * Route: /register
 */
export default function Register() {
  const navigate = useNavigate();
  const { refetch } = useAuth();

  const [name,      setName]      = useState('');
  const [email,     setEmail]     = useState('');
  const [password,  setPassword]  = useState('');
  const [confirm,   setConfirm]   = useState('');
  const [showPw,    setShowPw]    = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');

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
      await api.post('/auth/register', { name: name.trim(), email: email.trim(), password });
      await refetch();
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message ?? 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // Password strength score
  const pw = password;
  const strength = [pw.length >= 8, pw.length >= 12, /[A-Z]/.test(pw), /[0-9]/.test(pw), /[^A-Za-z0-9]/.test(pw)].filter(Boolean).length;
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very strong'][strength];
  const strengthColor = ['', 'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-emerald-500', 'bg-emerald-400'][strength];
  const strengthText  = ['', 'text-red-400', 'text-orange-400', 'text-amber-400', 'text-emerald-400', 'text-emerald-300'][strength];

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

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            {/* Name */}
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-medium">Full name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ganga Narayan Das"
                required
                disabled={loading}
                autoComplete="name"
                className="w-full bg-gray-700 border border-gray-600 focus:border-amber-500
                           text-gray-100 placeholder-gray-500 text-sm rounded-lg
                           px-3 py-2.5 focus:outline-none transition-colors"
              />
            </div>

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
              disabled={loading || !name || !email || !password || password !== confirm}
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
