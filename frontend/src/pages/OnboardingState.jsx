import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';

/**
 * OnboardingState — /admin/onboarding-state
 *
 * Admin-only view of the raw onboarding_state milestone timestamps.
 * Shows the funnel counts (Registrations → Logins → Video Added → Embed
 * Generated → Tracking Activated → Purchases) with conversion %, plus a
 * per-user table of the actual timestamps.
 *
 * No computed "stage" helper — this just displays the stored data.
 */

// Funnel steps in order, mapped to the counts keys returned by the API.
const FUNNEL = [
  { key: 'registered',         label: 'Registrations',      color: 'bg-gray-600'     },
  { key: 'logged_in',          label: 'Logins',             color: 'bg-sky-500'      },
  { key: 'video_added',        label: 'Video Added',        color: 'bg-amber-500'    },
  { key: 'embed_generated',    label: 'Embed Generated',    color: 'bg-orange-500'   },
  { key: 'tracking_activated', label: 'Tracking Activated', color: 'bg-violet-500'   },
  { key: 'paid',               label: 'Purchases',          color: 'bg-emerald-500'  },
];

// Per-user table columns mapped to the timestamp fields.
const COLUMNS = [
  { key: 'signed_up_at',                label: 'Registered' },
  { key: 'first_login_at',              label: 'Logged in' },
  { key: 'first_video_added_at',        label: 'Video added' },
  { key: 'first_embed_generated_at',    label: 'Embed' },
  { key: 'first_tracking_activated_at', label: 'Tracking' },
  { key: 'converted_to_paid_at',        label: 'Paid' },
];

export default function OnboardingState() {
  const navigate = useNavigate();
  const [loading,    setLoading]    = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [data,       setData]       = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setFetchError('');
    try {
      const { data: res } = await api.get('/admin/onboarding-state');
      setData(res);
    } catch (err) {
      if (err.response?.status === 403) {
        navigate('/dashboard');
      } else {
        setFetchError('Could not load onboarding state data.');
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <AdminShell title="Onboarding State" onBack={() => navigate('/dashboard')}>
        <PageSkeleton />
      </AdminShell>
    );
  }
  if (fetchError) {
    return (
      <AdminShell title="Onboarding State" onBack={() => navigate('/dashboard')}>
        <div className="text-center py-20">
          <p className="text-gray-400 text-sm mb-4">{fetchError}</p>
          <button
            onClick={load}
            className="px-4 py-2 bg-gray-800 border border-gray-700 text-sm text-gray-200 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </AdminShell>
    );
  }

  const counts = data?.counts ?? {};
  const users  = data?.users  ?? [];
  const registered = counts.registered || 0;

  return (
    <AdminShell title="Onboarding State" onBack={() => navigate('/dashboard')}>
      <div className="max-w-4xl mx-auto flex flex-col gap-8">

        {/* ── Funnel ──────────────────────────────────────────────────── */}
        <section>
          <SectionHeader
            title="Onboarding Funnel"
            subtitle="Each milestone counts once per user. % of registrations, and step-to-step conversion."
          />
          <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl overflow-hidden">
            {FUNNEL.map((step, idx) => {
              const count    = counts[step.key] ?? 0;
              const prev     = idx === 0 ? count : (counts[FUNNEL[idx - 1].key] ?? 0);
              const pctReg   = registered > 0 ? Math.round((count / registered) * 100) : 0;
              const pctStep  = idx === 0 ? 100 : (prev > 0 ? Math.round((count / prev) * 100) : 0);
              const barWidth = Math.max(pctReg, 2);

              return (
                <div
                  key={step.key}
                  className={`flex items-center gap-4 px-5 py-3.5 ${idx > 0 ? 'border-t border-gray-700/40' : ''}`}
                >
                  <span className="w-5 text-right text-xs text-gray-400 flex-shrink-0">{idx + 1}</span>
                  <span className="w-40 text-sm text-gray-300 flex-shrink-0">{step.label}</span>

                  <div className="flex-1 h-5 bg-gray-900/50 rounded overflow-hidden">
                    <div
                      className={`h-full ${step.color} rounded transition-all duration-500 flex items-center justify-end pr-2`}
                      style={{ width: `${barWidth}%` }}
                    >
                      {barWidth > 12 && (
                        <span className="text-[10px] font-medium text-white/80">{pctReg}%</span>
                      )}
                    </div>
                  </div>

                  {/* Step-to-step conversion */}
                  <span className="w-16 text-right text-xs tabular-nums text-gray-500 flex-shrink-0">
                    {idx === 0 ? '—' : `${pctStep}%`}
                  </span>

                  {/* Absolute count */}
                  <span className="w-16 text-right text-sm tabular-nums text-gray-300 flex-shrink-0">
                    {count.toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="text-[11px] text-gray-500 mt-2 px-1">
            Right column = users who reached this step ÷ users at the previous step.
          </p>
        </section>

        {/* ── Per-user timestamps ─────────────────────────────────────── */}
        <section>
          <SectionHeader title="Users" subtitle={`Latest activity first · showing ${users.length}`} />
          <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl overflow-hidden">
            {users.length === 0 ? (
              <p className="px-5 py-6 text-sm text-gray-400 text-center">No users yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700/50">
                      <th className="text-left px-4 py-2.5 text-xs text-gray-500 font-medium whitespace-nowrap">User</th>
                      <th className="text-left px-4 py-2.5 text-xs text-gray-500 font-medium whitespace-nowrap">Plan</th>
                      {COLUMNS.map(c => (
                        <th key={c.key} className="text-left px-4 py-2.5 text-xs text-gray-500 font-medium whitespace-nowrap">
                          {c.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u, idx) => (
                      <tr
                        key={u.user_id}
                        className={`transition-colors hover:bg-gray-700/20 ${idx > 0 ? 'border-t border-gray-700/30' : ''}`}
                      >
                        <td className="px-4 py-2.5">
                          <p className="text-gray-200 font-medium truncate max-w-[180px]">{u.name || '—'}</p>
                          <p className="text-xs text-gray-500 truncate max-w-[180px]">{u.email}</p>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="text-xs text-gray-400 capitalize">{(u.plan || '').replace('_', ' ')}</span>
                        </td>
                        {COLUMNS.map(c => (
                          <td key={c.key} className="px-4 py-2.5 text-xs whitespace-nowrap">
                            {u[c.key]
                              ? <span className="text-emerald-400" title={new Date(u[c.key]).toLocaleString()}>{fmtDate(u[c.key])}</span>
                              : <span className="text-gray-600">—</span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

      </div>
    </AdminShell>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────

function fmtDate(ts) {
  try {
    return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  } catch {
    return '—';
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Shared sub-components (same AdminShell style as OnboardingHealth)
// ─────────────────────────────────────────────────────────────────────────

function AdminShell({ title, children, onBack }) {
  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <header className="border-b border-gray-800 px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-200 transition-colors"
            >
              <BackIcon />
              Dashboard
            </button>
          )}
          <h1 className="text-sm font-semibold text-gray-300">{title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-amber-500 select-none">{'▶︎'}</span>
          <span className="font-bold text-amber-500 tracking-tight text-sm">VidaPulse</span>
          <span className="ml-2 px-2 py-0.5 text-[10px] font-medium bg-emerald-500/10
                           text-emerald-300 border border-emerald-500/20 rounded-full">
            Admin
          </span>
        </div>
      </header>
      <div className="flex-1 px-4 sm:px-6 py-10">
        {children}
      </div>
    </div>
  );
}

function SectionHeader({ title, subtitle }) {
  return (
    <div className="mb-3">
      <h2 className="text-sm font-semibold text-gray-300">{title}</h2>
      {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="max-w-4xl mx-auto animate-pulse flex flex-col gap-8">
      <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6">
        <div className="h-3 w-32 bg-gray-700/60 rounded mb-5" />
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="flex items-center gap-4 py-3 border-t border-gray-700/30 first:border-0">
            <div className="h-3 w-4 bg-gray-700/50 rounded" />
            <div className="h-3 w-36 bg-gray-700/50 rounded" />
            <div className="flex-1 h-5 bg-gray-700/30 rounded" />
            <div className="h-3 w-10 bg-gray-700/40 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

function BackIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}
