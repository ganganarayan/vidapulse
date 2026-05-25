'use strict';
import React, { useEffect, useState, useRef } from 'react';
import api from '../../lib/api';
import FeatureWall from '../upgrade/FeatureWall';

/**
 * HeatmapSection — Wistia-style engagement heatmap.
 *
 * Visual design:
 *  - Dense per-second bars (200 target buckets)
 *  - Heat-gradient colors: blue (low) → cyan → green → amber → red (high)
 *  - Stacked: first_watches (solid) + replays (lighter overlay on top)
 *  - Hover tooltip: second + viewer count + replays
 *  - Stats row: avg retention, total viewers, primary drop-off
 *  - Color scale legend at bottom
 *
 * Pro-only. Non-Pro users see a blurred fake chart behind FeatureWall.
 */

// ─────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────

const PRO_PLANS      = new Set(['pro', 'admin_lifetime']);
const TARGET_BUCKETS = 200;

const FAKE_DROP_OFF_PCT = 43;
const FAKE_DURATION_S   = 312;

// ─────────────────────────────────────────────────────────────────────────
// Heat color function
// Interpolates through: blue → cyan → green → amber → red
// ─────────────────────────────────────────────────────────────────────────

const COLOR_STOPS = [
  [0.00, [30,  64, 175]],   // blue-700
  [0.25, [6,  182, 212]],   // cyan-500
  [0.50, [16, 185, 129]],   // emerald-500
  [0.75, [245,158,  11]],   // amber-500
  [1.00, [239, 68,  68]],   // red-500
];

function heatColor(t) {
  // Clamp
  const v = Math.max(0, Math.min(1, t));
  // Find surrounding stops
  let lo = COLOR_STOPS[0];
  let hi = COLOR_STOPS[COLOR_STOPS.length - 1];
  for (let i = 0; i < COLOR_STOPS.length - 1; i++) {
    if (v >= COLOR_STOPS[i][0] && v <= COLOR_STOPS[i + 1][0]) {
      lo = COLOR_STOPS[i];
      hi = COLOR_STOPS[i + 1];
      break;
    }
  }
  const frac = lo[0] === hi[0] ? 0 : (v - lo[0]) / (hi[0] - lo[0]);
  const r = Math.round(lo[1][0] + frac * (hi[1][0] - lo[1][0]));
  const g = Math.round(lo[1][1] + frac * (hi[1][1] - lo[1][1]));
  const b = Math.round(lo[1][2] + frac * (hi[1][2] - lo[1][2]));
  return `rgb(${r},${g},${b})`;
}

// ─────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────

function formatTime(seconds) {
  if (seconds == null || isNaN(seconds)) return '';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function bucketData(rows, durationSeconds, targetBuckets = TARGET_BUCKETS) {
  if (!rows || rows.length === 0 || !durationSeconds) return [];
  const bucketSize = Math.max(1, durationSeconds / targetBuckets);
  const numBuckets = Math.ceil(durationSeconds / bucketSize);
  const acc = Array.from({ length: numBuckets }, () => ({
    first_watches: 0,
    replays      : 0,
  }));
  rows.forEach(({ second_bucket, first_watches, replays }) => {
    const idx = Math.min(Math.floor(second_bucket / bucketSize), numBuckets - 1);
    acc[idx].first_watches += Number(first_watches) || 0;
    acc[idx].replays       += Number(replays)       || 0;
  });
  return acc.map(b => ({ ...b, total: b.first_watches + b.replays }));
}

function generateFakeData(numBuckets = TARGET_BUCKETS) {
  return Array.from({ length: numBuckets }, (_, i) => {
    const t     = i / numBuckets;
    const decay = Math.exp(-2.8 * t) * 0.88 + 0.06;
    const bump  = 0.18 * Math.exp(-((t - 0.36) ** 2) / 0.007);
    const noise = Math.sin(i * 6.1 + 1.4) * 0.03 + Math.cos(i * 11.7) * 0.015;
    const total = Math.max(0.04, Math.min(1.0, decay + bump + noise));
    return { total, first_watches: total * 0.72, replays: total * 0.28 };
  });
}

// ─────────────────────────────────────────────────────────────────────────
// HeatmapSection — main export
// ─────────────────────────────────────────────────────────────────────────

export default function HeatmapSection({ videoId, video, userPlan }) {
  const isPro = PRO_PLANS.has(userPlan);

  const [status,   setStatus]   = useState('idle');
  const [heatData, setHeatData] = useState(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (!isPro || !videoId) return;
    let cancelled = false;
    setStatus('loading');
    api.get(`/videos/${videoId}/heatmap`)
      .then(res => {
        if (cancelled) return;
        const { heatmap, drop_off_second, drop_off_pct, duration_seconds, total_viewers } = res.data;
        if (!heatmap || heatmap.length === 0) { setStatus('empty'); return; }
        setHeatData({ heatmap, drop_off_second, drop_off_pct, duration_seconds, total_viewers });
        setStatus('loaded');
      })
      .catch(() => { if (!cancelled) setStatus('error'); });
    return () => { cancelled = true; };
  }, [videoId, isPro, retryKey]);

  return (
    <div>
      {/* Section header */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-amber-500 text-sm" aria-hidden="true">〰</span>
        <h2 className="text-base font-semibold text-gray-200">Engagement Heatmap</h2>
        {isPro && status === 'loaded' && heatData?.total_viewers > 0 && (
          <span className="ml-auto text-xs text-gray-600">
            {heatData.total_viewers.toLocaleString()} viewer{heatData.total_viewers !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {!isPro ? (
        <FeatureWall feature="heatmap" requiredPlan="pro" currentPlan={userPlan} minHeight="220px">
          <FakeHeatmapChart />
        </FeatureWall>
      ) : (
        <ProContent status={status} heatData={heatData} onRetry={() => setRetryKey(k => k + 1)} />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// ProContent
// ─────────────────────────────────────────────────────────────────────────

function ProContent({ status, heatData, onRetry }) {
  if (status === 'idle' || status === 'loading') return <HeatmapSkeleton />;

  if (status === 'error') {
    return (
      <div className="bg-gray-800/30 border border-gray-700/40 rounded-xl px-5 py-7 text-center">
        <p className="text-sm text-gray-400 mb-3">Could not load heatmap data.</p>
        <button
          onClick={onRetry}
          className="text-xs text-amber-400 hover:text-amber-300 transition-colors
                     px-3 py-1.5 border border-amber-500/30 rounded-lg"
        >
          Try again
        </button>
      </div>
    );
  }

  if (status === 'empty') {
    return (
      <div className="bg-gray-800/30 border border-gray-700/40 border-dashed rounded-xl px-5 py-8 text-center">
        <p className="text-sm text-gray-500">No heatmap data yet.</p>
        <p className="text-xs text-gray-600 mt-1">The chart fills in once viewers start watching.</p>
      </div>
    );
  }

  const { heatmap, drop_off_second, drop_off_pct, duration_seconds, total_viewers } = heatData;
  const buckets = bucketData(heatmap, duration_seconds, TARGET_BUCKETS);

  const computedDropOffPct = (() => {
    if (drop_off_second != null && duration_seconds) {
      return (drop_off_second / duration_seconds) * 100;
    }
    if (drop_off_pct != null) {
      return drop_off_pct > 1 ? drop_off_pct : drop_off_pct * 100;
    }
    return null;
  })();

  return (
    <WistiaHeatmapChart
      buckets={buckets}
      dropOffPct={computedDropOffPct}
      dropOffSecond={drop_off_second}
      durationSeconds={duration_seconds}
      totalViewers={total_viewers}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────
// WistiaHeatmapChart — the main visual component
// ─────────────────────────────────────────────────────────────────────────

function WistiaHeatmapChart({ buckets, dropOffPct, dropOffSecond, durationSeconds, totalViewers }) {
  const [hoverIdx, setHoverIdx] = useState(null);
  const chartRef  = useRef(null);

  const maxTotal = Math.max(...buckets.map(b => b.total), 1);

  const avgRetention = buckets.length > 0
    ? Math.round(buckets.reduce((s, b) => s + b.total / maxTotal, 0) / buckets.length * 100)
    : 0;

  function handleMouseMove(e) {
    if (!chartRef.current) return;
    const rect = chartRef.current.getBoundingClientRect();
    const idx  = Math.floor((e.clientX - rect.left) / rect.width * buckets.length);
    setHoverIdx(Math.max(0, Math.min(buckets.length - 1, idx)));
  }

  const hoverBucket = hoverIdx != null ? buckets[hoverIdx] : null;
  const hoverSecond = (hoverIdx != null && durationSeconds)
    ? (hoverIdx / buckets.length) * durationSeconds
    : null;

  return (
    <div className="bg-gray-900/50 border border-gray-700/50 rounded-xl overflow-hidden">

      {/* ── Stats row ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-6 px-5 py-3.5 border-b border-gray-800/60">
        <StatPill label="Avg. Retention" value={`${avgRetention}%`} color="#34d399" />
        {totalViewers > 0 && (
          <StatPill label="Total Viewers" value={totalViewers.toLocaleString()} color="#818cf8" />
        )}
        {dropOffSecond != null && durationSeconds > 0 && (
          <div className="ml-auto">
            <StatPill label="Primary Drop-off" value={formatTime(dropOffSecond)} color="#f87171" />
          </div>
        )}
      </div>

      {/* ── Chart area ─────────────────────────────────────────────── */}
      <div className="px-4 pt-3 pb-0">

        {/* Hover tooltip line */}
        <div className="h-6 flex items-center mb-1">
          {hoverBucket ? (
            <span className="text-xs text-gray-400">
              {hoverSecond != null && (
                <span className="text-gray-500 mr-2 font-mono">{formatTime(hoverSecond)}</span>
              )}
              <span className="font-semibold text-gray-200">
                {Math.round(hoverBucket.first_watches)} viewer{Math.round(hoverBucket.first_watches) !== 1 ? 's' : ''}
              </span>
              {hoverBucket.replays > 0.5 && (
                <span className="text-gray-500 ml-2">
                  + {Math.round(hoverBucket.replays)} replay{Math.round(hoverBucket.replays) !== 1 ? 's' : ''}
                </span>
              )}
            </span>
          ) : (
            <span className="text-xs text-gray-600">Hover to inspect</span>
          )}
        </div>

        {/* Bar area */}
        <div
          ref={chartRef}
          className="relative flex items-end cursor-crosshair"
          style={{ height: '200px' }}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverIdx(null)}
        >
          {/* Horizontal grid lines */}
          {[25, 50, 75].map(pct => (
            <div
              key={pct}
              className="absolute inset-x-0 pointer-events-none"
              style={{ bottom: `${pct}%`, height: '1px', backgroundColor: 'rgba(55,65,81,0.6)' }}
            />
          ))}

          {/* Bars */}
          {buckets.map((b, i) => {
            const t         = b.total / maxTotal;
            const heightPct = Math.max(t * 100, 1.5);
            const color     = heatColor(t);
            const isHovered = i === hoverIdx;
            const replayPct = b.total > 0 ? (b.replays / b.total) * 100 : 0;

            return (
              <div
                key={i}
                className="relative flex flex-col justify-end transition-opacity duration-75"
                style={{
                  flex   : '1 1 0%',
                  height : `${heightPct}%`,
                  opacity: hoverIdx != null && !isHovered ? 0.55 : 1,
                }}
              >
                <div
                  style={{
                    position       : 'absolute',
                    inset          : 0,
                    backgroundColor: color,
                  }}
                />
                {/* Replay overlay */}
                {replayPct > 0 && (
                  <div
                    style={{
                      position       : 'absolute',
                      top            : 0,
                      left           : 0,
                      right          : 0,
                      height         : `${replayPct}%`,
                      backgroundColor: 'rgba(255,255,255,0.22)',
                    }}
                  />
                )}
              </div>
            );
          })}

          {/* Drop-off line */}
          {dropOffPct != null && (
            <div
              className="absolute top-0 bottom-0 z-10 pointer-events-none"
              style={{ left: `${dropOffPct}%` }}
            >
              <div
                className="absolute top-0 bottom-0"
                style={{ width: '2px', backgroundColor: '#ef4444', opacity: 0.85, left: '-1px' }}
              />
              {/* Pulsing dot */}
              <div className="absolute -top-1" style={{ left: '-6px', width: '13px', height: '13px' }}>
                <span className="absolute inset-0 rounded-full bg-red-500/30 animate-ping" />
                <span className="absolute rounded-full bg-red-500" style={{ inset: '3.5px' }} />
              </div>
            </div>
          )}
        </div>

        {/* Time axis */}
        <TimeAxis
          durationSeconds={durationSeconds}
          dropOffPct={dropOffPct}
          dropOffSecond={dropOffSecond}
        />
      </div>

      {/* ── Color legend ───────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-3 border-t border-gray-800/50">
        <span className="text-[10px] text-gray-600 font-medium whitespace-nowrap">Low engagement</span>
        <div
          className="flex-1 h-2 rounded-full"
          style={{
            background: 'linear-gradient(to right, rgb(30,64,175), rgb(6,182,212), rgb(16,185,129), rgb(245,158,11), rgb(239,68,68))',
          }}
        />
        <span className="text-[10px] text-gray-600 font-medium whitespace-nowrap">High engagement</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// StatPill — compact stat display in the stats row
// ─────────────────────────────────────────────────────────────────────────

function StatPill({ label, value, color }) {
  return (
    <div>
      <p className="text-[10px] text-gray-500 uppercase tracking-wider leading-none mb-1">
        {label}
      </p>
      <p className="text-base font-bold" style={{ color }}>
        {value}
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// TimeAxis
// ─────────────────────────────────────────────────────────────────────────

function TimeAxis({ durationSeconds, dropOffPct, dropOffSecond }) {
  const dur = durationSeconds || 0;
  const dropOffTooCloseToEdge =
    dropOffPct != null && (dropOffPct < 8 || dropOffPct > 92);

  return (
    <div className="relative h-7 mt-1 mb-2 select-none" aria-hidden="true">
      <span className="absolute bottom-0 left-0 text-[10px] text-gray-600 font-mono">0:00</span>

      {dur > 0 && (
        <>
          {[0.25, 0.5, 0.75].map(frac => (
            <span
              key={frac}
              className="absolute bottom-0 text-[10px] text-gray-700 font-mono -translate-x-1/2"
              style={{ left: `${frac * 100}%` }}
            >
              {formatTime(dur * frac)}
            </span>
          ))}
          <span className="absolute bottom-0 right-0 text-[10px] text-gray-600 font-mono">
            {formatTime(dur)}
          </span>
        </>
      )}

      {dropOffPct != null && dropOffSecond != null && !dropOffTooCloseToEdge && (
        <span
          className="absolute bottom-0 text-[10px] text-red-400 font-medium font-mono -translate-x-1/2"
          style={{ left: `${dropOffPct}%` }}
        >
          {formatTime(dropOffSecond)}
        </span>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// FakeHeatmapChart — for non-Pro FeatureWall preview
// ─────────────────────────────────────────────────────────────────────────

function FakeHeatmapChart() {
  const buckets = generateFakeData(TARGET_BUCKETS);
  return (
    <WistiaHeatmapChart
      buckets={buckets}
      dropOffPct={FAKE_DROP_OFF_PCT}
      dropOffSecond={Math.round(FAKE_DURATION_S * FAKE_DROP_OFF_PCT / 100)}
      durationSeconds={FAKE_DURATION_S}
      totalViewers={142}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────
// HeatmapSkeleton
// ─────────────────────────────────────────────────────────────────────────

function HeatmapSkeleton() {
  return (
    <div className="bg-gray-800/40 border border-gray-700/40 rounded-xl overflow-hidden animate-pulse">
      <div className="h-12 border-b border-gray-700/40 px-5 flex items-center gap-6">
        <div className="h-4 w-20 bg-gray-700/60 rounded" />
        <div className="h-4 w-24 bg-gray-700/50 rounded" />
      </div>
      <div className="px-4 pt-3 pb-2">
        <div className="relative flex items-end gap-px" style={{ height: '200px' }}>
          {Array.from({ length: 50 }, (_, i) => {
            const t = i / 50;
            const h = Math.max(8, Math.exp(-2.2 * t) * 70 + 10 + Math.sin(i * 2.3) * 5);
            return (
              <div
                key={i}
                className="flex-1 bg-gray-700/40"
                style={{ height: `${h}%` }}
              />
            );
          })}
        </div>
        <div className="flex justify-between mt-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-2 w-8 bg-gray-700/30 rounded" />
          ))}
        </div>
      </div>
      <div className="h-10 border-t border-gray-700/40" />
    </div>
  );
}
