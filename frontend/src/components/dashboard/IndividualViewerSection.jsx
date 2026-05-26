'use strict';
import React, { useEffect, useState } from 'react';
import api from '../../lib/api';
import FeatureWall from '../upgrade/FeatureWall';

/**
 * IndividualViewerSection
 *
 * Wistia-style per-viewer engagement timeline. Shows each session as a row
 * with a color-coded bar representing exactly which parts of the video they
 * watched (first watch = emerald, replays = amber, unwatched = dark rail).
 *
 * Pro-only feature.
 */

const PRO_PLANS = new Set(['pro', 'admin_lifetime']);

// Device icons (inline SVG, tiny)
const DEVICE_ICON = {
  desktop: (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
    </svg>
  ),
  mobile: (
    <svg width="9" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="14" height="20" rx="2"/><circle cx="12" cy="18" r="1" fill="currentColor"/>
    </svg>
  ),
  tablet: (
    <svg width="9" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2"/><circle cx="12" cy="18" r="1" fill="currentColor"/>
    </svg>
  ),
};

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function formatPct(p) {
  return `${Math.round(p)}%`;
}

// ─────────────────────────────────────────────────────────────────────────
// Fake data for FeatureWall preview
// ─────────────────────────────────────────────────────────────────────────

function generateFakeSessions(n = 12) {
  const devices = ['desktop', 'mobile', 'desktop', 'tablet', 'desktop', 'mobile'];
  return Array.from({ length: n }, (_, i) => {
    const maxPct = Math.max(3, 100 * (Math.exp(-1.8 * i / n) * 0.85 + 0.08));
    return {
      id        : `fake-${i}`,
      viewer_num: i + 1,
      date      : new Date(Date.now() - i * 86400000 * 1.3).toISOString(),
      device    : devices[i % devices.length],
      max_watch_pct: maxPct,
      play_count: i < 3 ? 2 : 1,
      reached_end: maxPct >= 90,
      segments  : [[0, maxPct, 1]],
    };
  });
}

// ─────────────────────────────────────────────────────────────────────────
// ViewerRow — single session row
// ─────────────────────────────────────────────────────────────────────────

function ViewerRow({ session, index }) {
  const { viewer_num, date, device, browser, country, city, max_watch_pct, play_count, reached_end, segments } = session;

  const deviceIcon  = DEVICE_ICON[device] ?? DEVICE_ICON.desktop;
  const geo         = [city, country].filter(Boolean).join(', ') || null;

  return (
    <div className="flex items-center gap-3 py-2.5 group hover:bg-gray-800/40 px-4 -mx-4 rounded-lg transition-colors duration-100">

      {/* Viewer label */}
      <div className="flex items-center gap-1.5 flex-shrink-0" style={{ minWidth: '68px' }}>
        <span className="text-gray-500 group-hover:text-gray-400 transition-colors"
          style={{ color: 'currentColor' }}>
          {deviceIcon}
        </span>
        <span className="text-xs text-gray-400 font-mono">
          {formatDate(date)}
        </span>
      </div>

      {/* Timeline bar */}
      <div className="flex-1 relative h-5 bg-gray-800/80 rounded-sm overflow-hidden border border-gray-700/40"
           style={{ minWidth: 0 }}>

        {/* Watched segments */}
        {segments && segments.length > 0 ? (
          segments.map(([start, end, pass], si) => {
            const left  = Math.max(0, Math.min(100, start));
            const width = Math.max(0, Math.min(100 - left, end - start));
            const isReplay = pass > 1;
            return (
              <div
                key={si}
                className="absolute top-0 bottom-0 rounded-[1px]"
                style={{
                  left : `${left}%`,
                  width: `${width}%`,
                  background: isReplay
                    ? 'linear-gradient(90deg, #f59e0b88, #fbbf2488)'
                    : `linear-gradient(90deg, ${getSegmentColor(start, end)})`,
                }}
              />
            );
          })
        ) : (
          /* No segments = didn't watch (page load only) */
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[9px] text-gray-600">—</span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="flex items-center gap-2 flex-shrink-0" style={{ minWidth: '60px' }}>
        {reached_end && (
          <span title="Watched to end"
            className="w-3.5 h-3.5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
            <svg width="7" height="7" viewBox="0 0 12 12" fill="none" stroke="#10b981" strokeWidth="2.5">
              <polyline points="2 6 5 9 10 3" />
            </svg>
          </span>
        )}
        {play_count > 1 && (
          <span className="text-[9px] text-amber-400/80 font-mono flex-shrink-0">×{play_count}</span>
        )}
        <span
          className="text-xs font-semibold font-mono flex-shrink-0"
          style={{ color: pctColor(max_watch_pct), minWidth: '30px', textAlign: 'right' }}
        >
          {formatPct(max_watch_pct)}
        </span>
      </div>
    </div>
  );
}

// Color for the % label based on retention level
function pctColor(pct) {
  if (pct >= 80) return '#10b981';
  if (pct >= 50) return '#34d399';
  if (pct >= 30) return '#fbbf24';
  if (pct >= 10) return '#fb923c';
  return '#6b7280';
}

// Gradient for watched segment based on how much they watched
function getSegmentColor(start, end) {
  const pct = end; // use end pct as proxy for engagement level
  if (pct >= 80) return '#10b981, #34d399';
  if (pct >= 60) return '#34d399, #6ee7b7';
  if (pct >= 40) return '#fbbf24, #fde68a';
  if (pct >= 20) return '#fb923c, #fdba74';
  return '#6b7280, #9ca3af';
}

// ─────────────────────────────────────────────────────────────────────────
// IndividualViewerSection — main export
// ─────────────────────────────────────────────────────────────────────────

export default function IndividualViewerSection({ videoId, userPlan }) {
  const isPro = PRO_PLANS.has(userPlan);

  const [status,   setStatus]   = useState('idle');
  const [data,     setData]     = useState(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (!isPro || !videoId) return;
    let cancelled = false;
    setStatus('loading');
    api.get(`/videos/${videoId}/viewer-engagement`)
      .then(res => {
        if (cancelled) return;
        setData(res.data);
        setStatus('loaded');
      })
      .catch(() => { if (!cancelled) setStatus('error'); });
    return () => { cancelled = true; };
  }, [videoId, isPro, retryKey]);

  return (
    <div>
      {/* Section header */}
      <div className="flex items-center gap-2 mb-1">
        <span className="text-indigo-400 text-sm" aria-hidden="true">≋</span>
        <h2 className="text-base font-semibold text-gray-200">Individual Viewer Engagement</h2>
        {isPro && status === 'loaded' && data?.sessions?.length > 0 && (
          <span className="ml-auto text-xs text-gray-500">
            {data.sessions.length} most recent sessions
          </span>
        )}
      </div>
      <p className="text-xs text-gray-500 mb-4">
        See exactly what each viewer watched and rewatched
      </p>

      {!isPro ? (
        <FeatureWall feature="heatmap" requiredPlan="pro" currentPlan={userPlan} minHeight="260px">
          <FakeViewerGrid />
        </FeatureWall>
      ) : (
        <ProViewerContent
          status={status}
          data={data}
          onRetry={() => setRetryKey(k => k + 1)}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// ProViewerContent
// ─────────────────────────────────────────────────────────────────────────

function ProViewerContent({ status, data, onRetry }) {
  if (status === 'idle' || status === 'loading') {
    return <ViewerGridSkeleton />;
  }

  if (status === 'error') {
    return (
      <div className="bg-gray-800/30 border border-gray-700/40 rounded-xl px-5 py-6 text-center">
        <p className="text-sm text-gray-400 mb-3">Could not load viewer data.</p>
        <button onClick={onRetry}
          className="text-xs text-amber-400 hover:text-amber-300 px-3 py-1.5 border border-amber-500/30 rounded-lg">
          Try again
        </button>
      </div>
    );
  }

  const sessions = data?.sessions ?? [];

  if (sessions.length === 0) {
    return (
      <div className="bg-gray-800/30 border border-gray-700/40 border-dashed rounded-xl px-5 py-8 text-center">
        <p className="text-sm text-gray-500">No viewer data yet.</p>
        <p className="text-xs text-gray-600 mt-1">Individual sessions appear as viewers watch.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900/50 border border-gray-700/50 rounded-2xl overflow-hidden">
      {/* Column headers */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-gray-800/60">
        <span className="text-[10px] text-gray-600 uppercase tracking-wider font-medium"
              style={{ minWidth: '68px' }}>Viewer</span>
        <div className="flex-1 flex items-center gap-2">
          {/* Timeline intensity legend */}
          <div className="flex items-center gap-1">
            <span className="w-3 h-1.5 rounded-full bg-emerald-500 inline-block" />
            <span className="text-[9px] text-gray-600">1st watch</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-1.5 rounded-full bg-amber-400 inline-block" />
            <span className="text-[9px] text-gray-600">replay</span>
          </div>
        </div>
        <span className="text-[10px] text-gray-600 uppercase tracking-wider font-medium flex-shrink-0"
              style={{ minWidth: '60px', textAlign: 'right' }}>Watched</span>
      </div>

      {/* Viewer rows */}
      <div className="px-4 py-1">
        {sessions.map((s, i) => (
          <ViewerRow key={s.id} session={s} index={i} />
        ))}
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 border-t border-gray-800/60 flex items-center gap-2">
        <span className="text-[10px] text-gray-600">
          Intensity:
        </span>
        {[['1×','#10b981'], ['2×','#fbbf24'], ['3×+','#f87171']].map(([label, color]) => (
          <span key={label} className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: color, opacity: 0.7 }} />
            <span className="text-[10px] text-gray-500">{label}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// FakeViewerGrid — shown behind FeatureWall for non-Pro
// ─────────────────────────────────────────────────────────────────────────

function FakeViewerGrid() {
  const sessions = generateFakeSessions(10);
  return (
    <div className="bg-gray-900/50 border border-gray-700/50 rounded-2xl overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-2 border-b border-gray-800/60">
        <span className="text-[10px] text-gray-600 uppercase tracking-wider font-medium" style={{ minWidth: '68px' }}>Viewer</span>
        <span className="flex-1 text-[10px] text-gray-600 uppercase tracking-wider font-medium">Timeline</span>
        <span className="text-[10px] text-gray-600 uppercase tracking-wider font-medium flex-shrink-0" style={{ minWidth: '60px', textAlign: 'right' }}>Watched</span>
      </div>
      <div className="px-4 py-1">
        {sessions.map((s, i) => <ViewerRow key={s.id} session={s} index={i} />)}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// ViewerGridSkeleton
// ─────────────────────────────────────────────────────────────────────────

function ViewerGridSkeleton() {
  return (
    <div className="bg-gray-800/40 border border-gray-700/40 rounded-2xl overflow-hidden animate-pulse">
      <div className="h-9 border-b border-gray-700/40" />
      <div className="px-4 py-2 flex flex-col gap-3">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 py-1.5">
            <div className="h-3 w-16 bg-gray-700/40 rounded" />
            <div className="flex-1 h-5 bg-gray-700/30 rounded-sm" style={{ opacity: 1 - i * 0.08 }} />
            <div className="h-3 w-10 bg-gray-700/30 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
