import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';

/**
 * OnboardingHealth — /admin/onboarding
 *
 * Admin-only funnel health panel.
 * Shows: funnel counts, median conversion times, plan breakdown, recent user table.
 */

// Funnel step display config
const FUNNEL_STEPS = [
  { key: 'total_users',   label: 'Signed up',          color: 'bg-gray-600' },
  { key: 'added_video',   label: 'Added first video',   color: 'bg-amber-500' },
  { key: 'saw_wow',       label: 'Saw wow moment',      color: 'bg-amber-400' },
  { key: 'hit_limit',     label: 'Hit free limit',      color: 'bg-orange-500' },
  { key: 'attempted_pro', label: 'Tried Pro feature',   color: 'bg-indigo-500' },
  { key: 'converted',     label: 'Converted to paid',   color: 'bg-emerald-500' },
];

const STEP_LABELS = {
  signed_up              : 'Signed up',
  first_video_added      : 'Added first video',
  wow_moment_seen        : 'Saw wow moment',
  first_analytics_milestone: 'Hit 10 viewers',
  twenty_viewers_milestone : 'Hit 20 viewers',
  fifty_viewers_milestone  : 'Hit 50 viewers',
  free_limit_hit         : 'Hit free limit',
  pro_feature_attempted  : 'Tried Pro feature',
  converted_to_paid      : 'Converted to paid',
};

export default function OnboardingHealth() {
  const navigate = useNavigate();
  const [loading,    setLoading]    = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [data,       setData]       = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setFetchError('');
    try {
      const { data: res } = await api.get('/admin/onboarding-health');
      setData(res);
    } catch (err) {
      if (err.response?.status === 403) {
        navigate('/dashboard');
      } else {
        setFetchError('Could not load onboarding health data.');
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <AdminShell title="Behavioral Events" onBack={() => navigate('/dashboard')}><PageSkeleton /></AdminShell>;
  if (fetchError) return (
    <AdminShell title="Behavioral Events" onBack={() => navigate('/dashboard')}>
      <div className="text-center py-20">
        <p className="text-gray-400 text-sm mb-4">{fetchError}</p>
        <button onClick={load} className="px-4 py-2 bg-gray-800 border border-gray-700 text-sm text-gray-200 rounded-lg hover:bg-gray-700 transition-colors">Retry</button>
      </div>
    </AdminShell>
  );

  const { funnel, timing, plan_breakdown = [], recent_users = [] } = data;
  const total = funnel.total_users || 1; // guard div/0
  const diagnostics = data.diagnostics ?? [];

  return (
    <AdminShell title="Behavioral Events" onBack={() => navigate('/dashboard')}>
      <div className="max-w-4xl mx-auto flex flex-col gap-8">

        {diagnostics.length > 0 && (
          <div className="bg-red-500/8 border border-red-500/30 rounded-xl p-4">
            <p className="text-sm font-semibold text-red-300 mb-1">Some data could not be loaded</p>
            <ul className="text-xs text-red-400/80 font-mono break-all list-disc pl-5 space-y-0.5">
              {diagnostics.map((d, i) => <li key={i}>{d}</li>)}
            </ul>
          </div>
        )}

        {/* ── Funnel ──────────────────────────────────────────────────── */}
        <section>
          <SectionHeader title="Conversion Funnel" />
          <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl overflow-hidden">
            {FUNNEL_STEPS.map((step, idx) => {
              const isFirst  = idx === 0;
              const rawCount = isFirst ? funnel.total_users : funnel[step.key]?.count ?? 0;
              const rawPct   = isFirst ? 100               : funnel[step.key]?.pct   ?? 0;
              const barWidth = Math.max(rawPct, 2);

              return (
                <div
                  key={step.key}
                  className={`flex items-center gap-4 px-5 py-3.5
                              ${idx > 0 ? 'border-t border-gray-700/40' : ''}`}
                >
                  {/* Step number */}
                  <span className="w-5 text-right text-xs text-gray-400 flex-shrink-0">
                    {idx + 1}
                  </span>

                  {/* Label */}
                  <span className="w-44 text-sm text-gray-300 flex-shrink-0">
                    {step.label}
                  </span>

                  {/* Bar */}
                  <div className="flex-1 h-5 bg-gray-900/50 rounded overflow-hidden">
                    <div
                      className={`h-full ${step.color} rounded transition-all duration-500 flex items-center justify-end pr-2`}
                      style={{ width: `${barWidth}%` }}
                    >
                      {barWidth > 12 && (
                        <span className="text-[10px] font-medium text-white/80">
                          {rawPct}%
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Count */}
                  <span className="w-16 text-right text-sm tabular-nums text-gray-400 flex-shrink-0">
                    {rawCount.toLocaleString()}
                  </span>
                </div>
              );
            })}

            {/* Average limit hits */}
            <div className="border-t border-gray-700/40 px-5 py-3 flex items-center gap-2">
              <span className="text-xs text-gray-400">Avg limit-hit count per user who hit it:</span>
              <span className="text-xs font-semibold text-orange-400 tabular-nums">
                {Number(funnel.avg_limit_hits ?? 0).toFixed(1)}
              </span>
            </div>
          </div>
        </section>

        {/* ── Timing + Plan Breakdown ──────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

          {/* Conversion Timings */}
          <section>
            <SectionHeader title="Median Conversion Times" />
            <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl overflow-hidden">
              {[
                { label: 'Sign-up → First video', value: timing.median_signup_to_video },
                { label: 'Sign-up → Wow moment',  value: timing.median_signup_to_wow   },
                { label: 'Wow moment → Paid',     value: timing.median_wow_to_paid     },
                { label: 'Limit hit → Paid',      value: timing.median_limit_to_paid   },
              ].map((row, idx) => (
                <div
                  key={row.label}
                  className={`flex items-center justify-between px-4 py-3 text-sm
                              ${idx > 0 ? 'border-t border-gray-700/40' : ''}`}
                >
                  <span className="text-gray-400">{row.label}</span>
                  <span className="tabular-nums font-medium text-gray-200">
                    {row.value != null ? formatHours(row.value) : '—'}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Plan Breakdown */}
          <section>
            <SectionHeader title="Users by Plan" />
            <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl overflow-hidden">
              {plan_breakdown.length === 0 ? (
                <p className="px-4 py-4 text-sm text-gray-400">No data yet.</p>
              ) : (
                plan_breakdown.map((row, idx) => {
                  const planPct = Math.round((row.user_count / total) * 100);
                  const planColors = {
                    free          : 'text-gray-300',
                    starter       : 'text-amber-300',
                    pro           : 'text-indigo-300',
                    admin_lifetime: 'text-emerald-300',
                  };
                  return (
                    <div
                      key={row.plan}
                      className={`flex items-center justify-between px-4 py-3 text-sm
                                  ${idx > 0 ? 'border-t border-gray-700/40' : ''}`}
                    >
                      <span className={`font-medium capitalize ${planColors[row.plan] ?? 'text-gray-300'}`}>
                        {row.plan.replace('_', ' ')}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-400">{planPct}%</span>
                        <span className="tabular-nums text-gray-200 w-8 text-right">
                          {row.user_count.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </div>

        {/* ── Recent Users ─────────────────────────────────────────────── */}
        <section>
          <SectionHeader title="Recent Activity" subtitle="Last 25 users, sorted by latest action" />
          <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl overflow-hidden">
            {recent_users.length === 0 ? (
              <p className="px-5 py-6 text-sm text-gray-400 text-center">No users yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700/50">
                      <th className="text-left px-4 py-2.5 text-xs text-gray-500 font-medium whitespace-nowrap">User</th>
                      <th className="text-left px-4 py-2.5 text-xs text-gray-500 font-medium whitespace-nowrap">Plan</th>
                      <th className="text-left px-4 py-2.5 text-xs text-gray-500 font-medium whitespace-nowrap">Current step</th>
                      <th className="text-right px-4 py-2.5 text-xs text-gray-500 font-medium whitespace-nowrap">Limit hits</th>
                      <th className="text-left px-4 py-2.5 text-xs text-gray-500 font-medium whitespace-nowrap">Last activity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recent_users.map((u, idx) => (
                      <tr
                        key={u.user_id}
                        className={`transition-colors hover:bg-gray-700/20
                                    ${idx > 0 ? 'border-t border-gray-700/30' : ''}`}
                      >
                        <td className="px-4 py-2.5">
                          <p className="text-gray-200 font-medium truncate max-w-[160px]">
                            {u.name || '—'}
                          </p>
                          <p className="text-xs text-gray-500 truncate max-w-[160px]">
                            {u.email}
                          </p>
                        </td>
                        <td className="px-4 py-2.5">
                          <PlanBadge plan={u.plan} displayName={u.plan_display_name} />
                        </td>
                        <td className="px-4 py-2.5 text-xs text-gray-400 whitespace-nowrap">
                          {STEP_LABELS[u.current_step] ?? u.current_step}
                          {u.converted_to_paid_at && (
                            <span className="ml-1.5 text-emerald-400">✓</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums">
                          <span className={u.limit_hit_count > 0 ? 'text-orange-400 font-medium' : 'text-gray-400'}>
                            {u.limit_hit_count}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-xs text-gray-500 whitespace-nowrap">
                          {new Date(u.updated_at).toLocaleDateString('en-GB', {
                            day: 'numeric', month: 'short',
                          })}
                        </td>
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

function formatHours(hours) {
  if (hours == null) return '—';
  const h = Number(hours);
  if (h < 1)   return `${Math.round(h * 60)} min`;
  if (h < 24)  return `${h.toFixed(1)} hr`;
  const days = h / 24;
  return `${days.toFixed(1)} day${Math.round(days) !== 1 ? 's' : ''}`;
}

// ─────────────────────────────────────────────────────────────────────────
// Shared sub-components (same AdminShell from WebhookSettings)
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

function PlanBadge({ plan, displayName }) {
  const classes = {
    free          : 'bg-gray-700/60 text-gray-300 border-gray-600',
    starter       : 'bg-amber-500/10 text-amber-300 border-amber-500/30',
    pro           : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30',
    admin_lifetime: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
  };
  return (
    <span className={`px-2 py-0.5 text-[10px] font-medium border rounded-full whitespace-nowrap
                      ${classes[plan] ?? classes.free}`}>
      {displayName ?? plan}
    </span>
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
