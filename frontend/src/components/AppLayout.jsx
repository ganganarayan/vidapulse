import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';

/**
 * AppLayout
 *
 * Persistent left sidebar + content area used by all authenticated pages
 * EXCEPT VideoDetail (which is full-width by design).
 *
 * Usage:
 *   <AppLayout>
 *     <YourPageContent />
 *   </AppLayout>
 */
export default function AppLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-900 flex">
      <AppSidebar />
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// AppSidebar
// ─────────────────────────────────────────────────────────────────────────

function AppSidebar() {
  const { user, isImpersonating } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);

  const isAdmin = user?.role === 'admin' || user?.plan === 'admin_lifetime';

  async function handleSignOut() {
    setSigningOut(true);
    try { await api.post('/auth/logout'); } catch (_) {}
    navigate('/login', { replace: true });
  }

  function active(path, exact = false) {
    return exact
      ? location.pathname === path
      : location.pathname === path || location.pathname.startsWith(path + '/');
  }

  return (
    <aside className="w-56 flex-shrink-0 border-r border-gray-800 flex flex-col">

      {/* Logo */}
      <div className="px-5 py-4 border-b border-gray-800">
        <Link to="/dashboard" className="flex items-center gap-2 group">
          {/* ▶︎ = U+25B6 + U+FE0E forces text (not emoji) rendering */}
          <span className="text-amber-500 text-xl leading-none select-none">{'▶︎'}</span>
          <span className="text-base font-bold text-amber-500 tracking-tight">VidaPulse</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5">
        <SidebarItem
          to="/dashboard"
          icon={<VideosIcon />}
          label="Videos"
          active={active('/dashboard', true)}
        />
        <SidebarItem
          to="/account"
          icon={<SettingsIcon />}
          label="Settings"
          active={active('/account')}
        />

        {isAdmin && (
          <>
            <div className="mt-5 mb-1.5 px-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Admin
            </div>
            <SidebarItem
              to="/admin/users"
              icon={<UsersIcon />}
              label="Users"
              active={active('/admin/users')}
            />
            <SidebarItem
              to="/admin/webhook"
              icon={<WebhookIcon />}
              label="Webhook"
              active={active('/admin/webhook')}
            />
            <SidebarItem
              to="/admin/onboarding"
              icon={<HeartIcon />}
              label="Onboarding"
              active={active('/admin/onboarding')}
            />
          </>
        )}
      </nav>

      {/* User / plan section */}
      <div className="px-4 py-4 border-t border-gray-800">
        {user && (
          <div className="flex flex-col gap-1">
            <PlanChip plan={user.plan} displayName={user.plan_display_name} />
            <p className="text-xs font-medium text-gray-300 truncate mt-1">
              {isImpersonating ? '(Admin view)' : (user.name || user.email)}
            </p>
            <p className="text-xs text-gray-600 truncate">{user.email}</p>
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="mt-2 text-left text-xs text-gray-500 hover:text-red-400 transition-colors"
            >
              {signingOut ? 'Signing out…' : 'Sign out'}
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// SidebarItem
// ─────────────────────────────────────────────────────────────────────────

function SidebarItem({ to, icon, label, active }) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                  ${active
                    ? 'bg-amber-500/15 text-amber-400'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                  }`}
    >
      <span className="flex-shrink-0 w-4 h-4">{icon}</span>
      {label}
    </Link>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// PlanChip
// ─────────────────────────────────────────────────────────────────────────

function PlanChip({ plan, displayName }) {
  const classes = {
    free          : 'bg-gray-700/60 text-gray-300 border-gray-600',
    starter       : 'bg-amber-500/10 text-amber-300 border-amber-500/30',
    pro           : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30',
    admin_lifetime: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
  };
  return (
    <span className={`inline-block px-2 py-0.5 text-xs font-medium border rounded-full ${classes[plan] ?? classes.free}`}>
      {displayName ?? plan}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Sidebar icons (16×16, stroke-based)
// ─────────────────────────────────────────────────────────────────────────

function VideosIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
    >
      <polygon points="23 7 16 12 23 17 23 7" />
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function WebhookIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
    >
      <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11A2.99 2.99 0 0 0 18 8a3 3 0 1 0 0-6 3 3 0 0 0-3 3c0 .24.04.47.09.7L8.04 9.81A3 3 0 0 0 6 9a3 3 0 1 0 0 6 3 3 0 0 0 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65a3 3 0 1 0 3-3z" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}
