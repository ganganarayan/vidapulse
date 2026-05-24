import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../lib/api';

export default function SetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [password,  setPassword]  = useState('');
  const [confirm,   setConfirm]   = useState('');
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');

  // Simple password strength: 0–3
  function strength(pw) {
    let s = 0;
    if (pw.length >= 8)                      s++;
    if (/[A-Z]/.test(pw) || /\d/.test(pw))  s++;
    if (pw.length >= 12)                     s++;
    return s;
  }

  const pw_strength = strength(password);
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
      await api.post('/auth/set-password', { token, password });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
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
        <h1 className="text-xl font-bold text-gray-50 mb-1">Set your password</h1>
        <p className="text-sm text-gray-400 mb-6">Choose a password to secure your VidaPulse account.</p>

        {/* Error banner */}
        {error && (
          <div className="mb-4 px-4 py-3 bg-red-900/40 border border-red-700/50 rounded-lg text-red-300 text-sm">
            {error}
          </div>
        )}

        {!token && !error && (
          <div className="mb-4 px-4 py-3 bg-amber-900/30 border border-amber-700/50 rounded-lg text-amber-300 text-sm">
            No token found. Please use the link from your welcome email.
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">New password</label>
            <input
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 text-gray-100
                         placeholder-gray-500 rounded-lg px-3.5 py-2.5 text-sm
                         focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="Minimum 8 characters"
            />
            {/* Strength bar */}
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

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Confirm password</label>
            <input
              type="password"
              autoComplete="new-password"
              required
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              className={`w-full bg-gray-700 border text-gray-100
                          placeholder-gray-500 rounded-lg px-3.5 py-2.5 text-sm
                          focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent
                          ${confirm && password !== confirm ? 'border-red-500' : 'border-gray-600'}`}
              placeholder="Re-enter your password"
            />
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
            {loading ? 'Setting password…' : 'Set Password & Sign In'}
          </button>
        </form>

        <p className="mt-5 text-center text-xs text-gray-500">
          Link expired?{' '}
          <Link to="/forgot-password" className="text-amber-500 hover:text-amber-400 transition-colors">
            Request a new one
          </Link>
        </p>
      </div>
    </div>
  );
}
