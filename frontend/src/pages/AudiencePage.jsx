'use strict';
import React, { useEffect, useMemo, useState } from 'react';
import { Link }         from 'react-router-dom';
import AppLayout        from '../components/AppLayout';
import { useAuth }      from '../contexts/AuthContext';
import { useUpgrade }   from '../contexts/UpgradeContext';
import api              from '../lib/api';

/**
 * AudiencePage — /audience
 *
 * Unified view of audience data across all videos:
 *   - 3 stat cards: Unique Viewers, Countries, Device Types
 *   - Recent Viewers table (Starter+ only)
 */

// ── Helpers ───────────────────────────────────────────────────────────────

function fmtWatchTime(secs) {
  if (!secs || secs <= 0) return '0s';
  const s = Math.round(secs);
  if (s < 60)  return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60)  return `${m}m ${s % 60}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

function fmtRelTime(iso) {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60)                return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60)                return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)                return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30)                return `${d}d ago`;
  const mo = Math.floor(d / 30);
  return `${mo}mo ago`;
}

const DEVICE_LABELS = {
  desktop: 'Desktop',
  mobile : 'Mobile',
  tablet : 'Tablet',
  tv     : 'TV',
  unknown: '—',
};

// Country code → flag emoji (works via regional indicator Unicode pairs)
function countryFlag(code) {
  if (!code || code.length !== 2) return '';
  return String.fromCodePoint(
    ...code.toUpperCase().split('').map(c => 0x1F1E6 + c.charCodeAt(0) - 65)
  );
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function AudiencePage() {
  const { user }        = useAuth();
  const { showUpgrade } = useUpgrade();

  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    api.get('/user/audience')
      .then(r => setData(r.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [user?.id]);

  // Client-side filtering of the viewer list
  const filtered = useMemo(() => {
    if (!data?.viewers?.length) return [];
    const q = search.trim().toLowerCase();
    if (!q) return data.viewers;
    return data.viewers.filter(v =>
      v.short_id?.toLowerCase().includes(q)      ||
      v.country_name?.toLowerCase().includes(q)  ||
      v.device_type?.toLowerCase().includes(q)   ||
      v.video_title?.toLowerCase().includes(q)
    );
  }, [data?.viewers, search]);

  const stats = data?.stats ?? { unique_viewers: 0, countries: 0, device_types: 0 };
  const gated = data?.gated ?? false;

  return (
    <AppLayout>
      {/* ── Page header ─────────────────────────────────────────────── */}
      <div className="border-b border-gray-800 px-6 py-3.5 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <AudienceHeaderIcon />
          <h1 className="text-sm font-semibold text-gray-200">Audience</h1>
        </div>
      </div>

      <main className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !data ? (
          <div className="flex items-center justify-center py-32 text-gray-500 text-sm">
            Failed to load audience data. Try refreshing.
          </div>
        ) : (
          <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col gap-8">

            {/* ── Stat cards ──────────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard
                label="Unique Viewers"
                value={stats.unique_viewers.toLocaleString()}
                icon={<ViewersIcon />}
              />
              <StatCard
                label="Countries"
                value={stats.countries.toLocaleString()}
                icon={<GlobeIcon />}
              />
              <StatCard
                label="Device Types"
                value={stats.device_types.toLocaleString()}
                icon={<DeviceIcon />}
              />
            </div>

            {/* ── Recent Viewers ──────────────────────────────────── */}
            <div>
              <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex-shrink-0">
                  Recent Viewers
                </h2>
                {!gated && (
                  <div className="relative flex-shrink-0">
                    <SearchIcon />
                    <input
                      type="text"
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      placeholder="Search viewers, country, video…"
                      className="pl-8 pr-3 py-1.5 bg-gray-800/60 border border-gray-700/60
                                 rounded-lg text-sm text-gray-200 placeholder-gray-500
                                 focus:outline-none focus:border-amber-500/50 focus:ring-1
                                 focus:ring-amber-500/20 w-64 transition-colors"
                    />
                  </div>
                )}
              </div>

              {/* Plan gate — free users see upgrade prompt */}
              {gated ? (
                <GatedTablePrompt onUpgrade={() => showUpgrade('starter')} plan={user?.plan} />
              ) : (
                <ViewerTable viewers={filtered} search={search} />
              )}
            </div>

          </div>
        )}
      </main>
    </AppLayout>
  );
}

// ── StatCard ──────────────────────────────────────────────────────────────

function StatCard({ label, value, icon }) {
  return (
    <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{label}</span>
        <span className="text-gray-400">{icon}</span>
      </div>
      <p className="text-2xl font-bold text-gray-50 tabular-nums">{value}</p>
    </div>
  );
}

// ── ViewerTable ───────────────────────────────────────────────────────────

function ViewerTable({ viewers, search }) {
  if (!viewers.length) {
    return (
      <div className="bg-gray-800/20 border border-gray-700/40 rounded-xl px-6 py-12 text-center">
        {search ? (
          <p className="text-sm text-gray-500">No viewers match <span className="text-gray-300">"{search}"</span></p>
        ) : (
          <p className="text-sm text-gray-500">No viewer data yet. Share your videos to start seeing audience activity.</p>
        )}
      </div>
    );
  }

  return (
    <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-700/60">
              <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Viewer</th>
              <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Country</th>
              <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Device</th>
              <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Video</th>
              <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Watch Time</th>
              <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Last Seen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700/40">
            {viewers.map(v => (
              <tr key={v.viewer_id} className="hover:bg-gray-800/40 transition-colors">
                {/* Viewer ID */}
                <td className="px-4 py-3 font-mono text-xs text-gray-400 whitespace-nowrap">
                  <span className="text-gray-400 text-[10px] mr-0.5">#</span>
                  <span className="text-gray-300">{v.short_id}</span>
                </td>
                {/* Country */}
                <td className="px-4 py-3 whitespace-nowrap">
                  {v.country_name ? (
                    <span className="flex items-center gap-1.5 text-xs text-gray-300">
                      <span className="text-sm leading-none">{countryFlag(v.country_code)}</span>
                      {v.country_name}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">—</span>
                  )}
                </td>
                {/* Device */}
                <td className="px-4 py-3 whitespace-nowrap">
                  <DeviceBadge type={v.device_type} />
                </td>
                {/* Video */}
                <td className="px-4 py-3 max-w-[200px]">
                  <Link
                    to={`/dashboard/videos/${v.video_id}`}
                    className="text-xs text-gray-300 hover:text-amber-400 transition-colors truncate block"
                    title={v.video_title}
                  >
                    {v.video_title || 'Untitled'}
                  </Link>
                </td>
                {/* Watch Time */}
                <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-400 tabular-nums">
                  {fmtWatchTime(v.watch_seconds)}
                </td>
                {/* Last Seen */}
                <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500" title={v.last_seen}>
                  {fmtRelTime(v.last_seen)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── DeviceBadge ───────────────────────────────────────────────────────────

const DEVICE_BADGE_CLS = {
  desktop: 'text-blue-300 bg-blue-500/10 border-blue-500/20',
  mobile : 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20',
  tablet : 'text-violet-300 bg-violet-500/10 border-violet-500/20',
  tv     : 'text-amber-300 bg-amber-500/10 border-amber-500/20',
  unknown: 'text-gray-500 bg-gray-700/30 border-gray-600/30',
};

function DeviceBadge({ type }) {
  const key = type in DEVICE_BADGE_CLS ? type : 'unknown';
  const cls = DEVICE_BADGE_CLS[key];
  const label = DEVICE_LABELS[key] ?? '—';
  return (
    <span className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-medium border ${cls}`}>
      {label}
    </span>
  );
}

// ── GatedTablePrompt ──────────────────────────────────────────────────────

function GatedTablePrompt({ onUpgrade, plan }) {
  return (
    <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl overflow-hidden">
      {/* Blurred table preview */}
      <div className="relative">
        <div className="blur-sm select-none pointer-events-none px-4 py-3 border-b border-gray-700/60 flex gap-8">
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider w-24">Viewer</span>
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider w-20">Country</span>
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider w-16">Device</span>
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider w-32">Video</span>
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider w-20">Watch Time</span>
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Last Seen</span>
        </div>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="blur-sm select-none pointer-events-none px-4 py-3 border-b border-gray-700/30 flex gap-8">
            <span className="w-24 h-3 bg-gray-700/50 rounded" />
            <span className="w-20 h-3 bg-gray-700/40 rounded" />
            <span className="w-16 h-3 bg-gray-700/40 rounded" />
            <span className="w-32 h-3 bg-gray-700/40 rounded" />
            <span className="w-12 h-3 bg-gray-700/30 rounded" />
            <span className="w-16 h-3 bg-gray-700/30 rounded" />
          </div>
        ))}

        {/* Overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/70 backdrop-blur-[1px] gap-3 px-4 text-center">
          <span className="inline-block px-3 py-1 text-xs font-bold text-amber-300
                           bg-amber-500/10 border border-amber-500/25 rounded-full uppercase tracking-wider">
            Starter Feature
          </span>
          <p className="text-sm text-gray-300 max-w-xs">
            Upgrade to Starter to see your viewers — who watched, from where, and on what device.
          </p>
          <button
            onClick={onUpgrade}
            className="mt-1 px-6 py-2 bg-amber-500 hover:bg-amber-400 text-gray-900
                       text-sm font-bold rounded-lg transition-colors shadow-lg shadow-amber-500/20"
          >
            Upgrade to Starter →
          </button>
          <p className="text-xs text-gray-400">
            You are on the <span className="text-gray-400 capitalize">{plan ?? 'Free'}</span> plan
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Icons (inline SVGs) ───────────────────────────────────────────────────

const I = (d, extra = {}) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
       className="w-4 h-4" {...extra}>
    {d}
  </svg>
);

function AudienceHeaderIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
         className="w-4 h-4 text-gray-400">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  );
}

function ViewersIcon() {
  return I(<><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>);
}

function GlobeIcon() {
  return I(<><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></>);
}

function DeviceIcon() {
  return I(<><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></>);
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
         className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none">
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  );
}
