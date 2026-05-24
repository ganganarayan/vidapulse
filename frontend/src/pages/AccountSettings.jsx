import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';

export default function AccountSettings() {
  const { user, isImpersonating } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      await api.post('/auth/logout');
    } catch (_) {}
    navigate('/login', { replace: true });
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header — matches DashboardHeader */}
      <header className="border-b border-gray-800 px-4 sm:px-6 py-3 flex items-center justify-between flex-shrink-0">
        <Link to="/dashboard" className="flex items-center gap-2">
          <span className="text-amber-500 text-xl">▶</span>
          <span className="text-lg font-bold text-amber-500 tracking-tight">VidaPulse</span>
        </Link>

        <div className="flex items-center gap-3">
          {user && (
            <div className="flex items-center gap-2">
              <span className="hidden sm:block text-sm text-gray-400">{isImpersonating ? 'Admin' : user.name}</span>
              <button
                onClick={handleLogout}
                className="text-xs text-gray-500 hover:text-gray-300 transition-colors px-2 py-1 rounded-md hover:bg-gray-800"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-10">
        {/* Back link */}
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors mb-8"
        >
          <ChevronLeftIcon />
          Back to Dashboard
        </Link>

        <h1 className="text-2xl font-bold text-gray-50 mb-8">Account Settings</h1>

        {/* Account access log card */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <div className="flex items-start gap-4">
            {/* Lock icon */}
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <LockIcon />
            </div>

            <div>
              <h2 className="text-base font-semibold text-gray-100 mb-1">Account access log</h2>
              <p className="text-sm text-gray-400 leading-relaxed">
                A full history of admin access to your account will appear here.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function LockIcon() {
  return (
    <svg
      width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      className="text-amber-500"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function ChevronLeftIcon() {
  return (
    <svg
      width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
    >
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}
