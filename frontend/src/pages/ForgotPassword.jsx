import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';

export default function ForgotPassword() {
  const [email,   setEmail]   = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [sent,    setSent]    = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (err) {
      // Only show an error for network/server failures — not for "email not found"
      // (the backend always returns 200 to avoid leaking account existence)
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

        {sent ? (
          /* Success state */
          <div className="text-center py-2">
            <div className="w-14 h-14 bg-green-900/40 border border-green-700/50 rounded-full
                            flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-gray-50 mb-2">Check your email</h2>
            <p className="text-sm text-gray-400 mb-6">
              If an account exists for <span className="text-gray-200">{email}</span>,
              we've sent a reset link. It expires in 1 hour.
            </p>
            <p className="text-xs text-gray-500">
              Didn't receive it? Check your spam folder or{' '}
              <button
                onClick={() => { setSent(false); setEmail(''); }}
                className="text-amber-500 hover:text-amber-400 transition-colors"
              >
                try again
              </button>.
            </p>
          </div>
        ) : (
          /* Form state */
          <>
            <h1 className="text-xl font-bold text-gray-50 mb-1">Forgot your password?</h1>
            <p className="text-sm text-gray-400 mb-6">
              Enter your email and we'll send you a reset link.
            </p>

            {error && (
              <div className="mb-4 px-4 py-3 bg-red-900/40 border border-red-700/50 rounded-lg text-red-300 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Email address</label>
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

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-amber-500/50
                           text-gray-900 font-semibold text-sm rounded-lg py-2.5
                           transition-colors disabled:cursor-not-allowed"
              >
                {loading ? 'Sending…' : 'Send reset link'}
              </button>
            </form>
          </>
        )}

        <div className="mt-6 text-center">
          <Link to="/login" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
            ← Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
