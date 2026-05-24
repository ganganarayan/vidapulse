import React, { useEffect, useState } from 'react';
import api from '../../lib/api';
import FeatureWall from '../upgrade/FeatureWall';

/**
 * HeatmapSection
 *
 * Renders the engagement heatmap for a video. This is a Pro-only feature.
 *
 * For non-Pro users:
 *   — Generates plausible-looking fake data locally (no API call)
 *   — Renders it blurred behind a FeatureWall upgrade prompt
 *
 * For Pro/admin_lifetime users:
 *   — Fetches GET /api/videos/:id/heatmap
 *   — Renders the real bar chart with drop-off line + pulsing dot
 *
 * Props:
 *   videoId   — string / number
 *   video     — video object (used for fallback drop-off data)
 *   userPlan  — string: 'free' | 'starter' | 'pro' | 'admin_lifetime'
 */

// ─────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────

const PRO_PLANS     = new Set(['pro', 'admin_lifetime']);
const TARGET_BUCKETS = 120; // display columns in the chart

// Fake preview configuration (non-Pro FeatureWall)
const FAKE_DROP_OFF_PCT = 43;   // drop-off line at 43% of the fake video
const FAKE_DURATION_S   = 312;  // "5:12" — makes the time axis labels render

// ─────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────

/** Format seconds as M:SS  (e.g. 312 → "5:12") */
function formatTime(seconds) {
  if (seconds == null || isNaN(seconds)) return '';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * Bin per-second heatmap rows into ~targetBuckets display columns.
 * Returns [ { total, first_watches, replays }, … ]
 */
function bucketData(rows, durationSeconds, targetBuckets = TARGET_BUCKETS) {
  if (!rows || rows.length === 0 || !durationSeconds) return [];

  const bucketSize = Math.max(1, durationSeconds / targetBuckets);
  const numBuckets = Math.ceil(durationSeconds / bucketSize);
  const acc        = Array.from({ length: numBuckets }, () => ({
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

/**
 * Generate plausible-looking fake retention data for the FeatureWall preview.
 * Curve: exponential decay base + replay bump near 36% + subtle noise.
 */
function generateFakeData(numBuckets = TARGET_BUCKETS) {
  return Array.from({ length: numBuckets }, (_, i) => {
    const t       = i / numBuckets;
    const decay   = Math.exp(-2.8 * t) * 0.88 + 0.06;
    const bump    = 0.18 * Math.exp(-((t - 0.36) ** 2) / 0.007);
    const noise   = Math.sin(i * 6.1 + 1.4) * 0.03 + Math.cos(i * 11.7) * 0.015;
    const total   = Math.max(0.04, Math.min(1.0, decay + bump + noise));
    return {
      total,
      first_watches: total * 0.72,
      replays      : total * 0.28,
    };
  });
}

// ─────────────────────────────────────────────────────────────────────────
// HeatmapSection — main export
// ─────────────────────────────────────────────────────────────────────────

export default function HeatmapSection({ videoId, video, userPlan }) {
  const isPro = PRO_PLANS.has(userPlan);

  const [status,   setStatus]   = useState('idle');  // idle | loading | loaded | empty | error
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

        if (!heatmap || heatmap.length === 0) {
          setStatus('empty');
          return;
        }

        setHeatData({ heatmap, drop_off_second, drop_off_pct, duration_seconds, total_viewers });
        setStatus('loaded');
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });

    return () => { cancelled = true; };
  }, [videoId, isPro, retryKey]);

  // Viewer count label shown in the section header
  const viewerLabel = (() => {
    if (!isPro || status !== 'loaded' || !heatData?.total_viewers) return '';
    const n = heatData.total_viewers;
    return `${n.toLocaleString()} viewer${n !== 1 ? 's' : ''}`;
  })();

  return (
    <div>
      {/* ── Section header ──────────────────────────────────────────── */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-amber-500 text-sm" aria-hidden="true">〰</span>
        <h2 className="text-base font-semibold text-gray-200">Engagement Heatmap</h2>
        {viewerLabel && (
          <span className="ml-auto text-xs text-gray-600">{viewerLabel}</span>
        )}
      </div>

      {/* ── Content ─────────────────────────────────────────────────── */}
      {!isPro ? (
        /* Non-Pro: blurred fake chart behind upgrade prompt */
        <FeatureWall
          feature="heatmap"
          requiredPlan="pro"
          currentPlan={userPlan}
          minHeight="200px"
        >
          <FakeHeatmapChart />
        </FeatureWall>
      ) : (
        /* Pro: real data states */
        <ProContent
          status={status}
          heatData={heatData}
          onRetry={() => setRetryKey(k => k + 1)}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// ProContent — state dispatcher for Pro users
// ─────────────────────────────────────────────────────────────────────────

function ProContent({ status, heatData, onRetry }) {
  if (status === 'idle' || status === 'loading') {
    return <HeatmapSkeleton />;
  }

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
      <div className="bg-gray-800/30 border border-gray-700/40 border-dashed rounded-xl
                      px-5 py-8 text-center">
        <p className="text-sm text-gray-500">No heatmap data yet.</p>
        <p className="text-xs text-gray-600 mt-1">
          The chart fills in once viewers start watching.
        </p>
      </div>
    );
  }

  // status === 'loaded'
  const { heatmap, drop_off_second, drop_off_pct, duration_seconds } = heatData;
  const displayBuckets = bucketData(heatmap, duration_seconds, TARGET_BUCKETS);

  // Compute drop-off X position.
  // Prefer second/duration computation; fall back to the stored pct column.
  const computedDropOffPct = (() => {
    if (drop_off_second != null && duration_seconds) {
      return (drop_off_second / duration_seconds) * 100;
    }
    if (drop_off_pct != null) {
      // stored value might be 0–1 decimal or 0–100 integer
      return drop_off_pct > 1 ? drop_off_pct : drop_off_pct * 100;
    }
    return null;
  })();

  return (
    <>
      <HeatmapChart
        buckets={displayBuckets}
        dropOffPct={computedDropOffPct}
        dropOffSecond={drop_off_second}
        durationSeconds={duration_seconds}
      />
      {/* Drop-off annotation below chart */}
      {computedDropOffPct != null && drop_off_second != null && (
        <p className="text-xs text-gray-600 mt-2 flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
          Primary drop-off at <span className="text-gray-400 font-medium">{formatTime(drop_off_second)}</span>
          {' '}—{' '}most viewers leave around this point.
        </p>
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// HeatmapChart — the actual bar chart
//
// Props:
//   buckets          — [ { total, first_watches, replays } ]
//   dropOffPct       — number 0–100 | null
//   dropOffSecond    — number | null  (for the time label)
//   durationSeconds  — number | null
// ─────────────────────────────────────────────────────────────────────────

function HeatmapChart({ buckets, dropOffPct, dropOffSecond, durationSeconds }) {
  if (!buckets || buckets.length === 0) return null;

  const maxTotal = Math.max(...buckets.map(b => b.total), 1);

  return (
    <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl overflow-hidden pt-4 px-4 pb-0">

      {/* ── Bar area ──────────────────────────────────────────────── */}
      <div className="relative" style={{ height: '120px' }}>

        {/* Horizontal grid lines at 25 / 50 / 75 % */}
        {[25, 50, 75].map(pct => (
          <div
            key={pct}
            className="absolute inset-x-0 h-px bg-gray-700/40 pointer-events-none"
            style={{ bottom: `${pct}%` }}
          />
        ))}

        {/* Bars */}
        {buckets.map((b, i) => {
          const leftPct   = (i / buckets.length) * 100;
          const widthPct  = 100 / buckets.length;
          const heightPct = (b.total / maxTotal) * 100;

          return (
            <div
              key={i}
              className="absolute bottom-0 bg-amber-500/45 transition-[height] duration-200"
              style={{
                left  : `${leftPct}%`,
                width : `max(${widthPct}%, 1px)`,
                height: `${heightPct}%`,
              }}
            />
          );
        })}

        {/* Drop-off vertical line */}
        {dropOffPct != null && (
          <div
            className="absolute top-0 bottom-0 w-px bg-red-500/70 z-10 pointer-events-none"
            style={{ left: `${dropOffPct}%` }}
          >
            {/* Pulsing dot at the top of the line */}
            <div className="absolute -top-0.5 -left-[5px] w-[11px] h-[11px]">
              <span className="absolute inset-0 rounded-full bg-red-500/30 animate-ping" />
              <span
                className="absolute rounded-full bg-red-500"
                style={{ inset: '3px' }}
              />
            </div>
          </div>
        )}

        {/* Baseline */}
        <div className="absolute bottom-0 inset-x-0 h-px bg-gray-700/60" />
      </div>

      {/* ── Time axis ─────────────────────────────────────────────── */}
      <TimeAxis
        durationSeconds={durationSeconds}
        dropOffPct={dropOffPct}
        dropOffSecond={dropOffSecond}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// TimeAxis
// ─────────────────────────────────────────────────────────────────────────

function TimeAxis({ durationSeconds, dropOffPct, dropOffSecond }) {
  const dur = durationSeconds || 0;

  // Hide the drop-off time label if it would collide with 0:00 or end label
  const dropOffTooCloseToEdge =
    dropOffPct != null && (dropOffPct < 8 || dropOffPct > 92);

  return (
    <div className="relative h-7 mt-1 mb-2 select-none" aria-hidden="true">
      {/* 0:00 */}
      <span className="absolute bottom-0 left-0 text-[10px] text-gray-600">
        0:00
      </span>

      {dur > 0 && (
        <>
          {/* Quarter markers */}
          {[0.25, 0.5, 0.75].map(frac => (
            <span
              key={frac}
              className="absolute bottom-0 text-[10px] text-gray-700 -translate-x-1/2"
              style={{ left: `${frac * 100}%` }}
            >
              {formatTime(dur * frac)}
            </span>
          ))}

          {/* End time */}
          <span className="absolute bottom-0 right-0 text-[10px] text-gray-600">
            {formatTime(dur)}
          </span>
        </>
      )}

      {/* Drop-off time label in red */}
      {dropOffPct != null && dropOffSecond != null && !dropOffTooCloseToEdge && (
        <span
          className="absolute bottom-0 text-[10px] text-red-400 font-medium -translate-x-1/2"
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
    <HeatmapChart
      buckets={buckets}
      dropOffPct={FAKE_DROP_OFF_PCT}
      dropOffSecond={Math.round(FAKE_DURATION_S * FAKE_DROP_OFF_PCT / 100)}
      durationSeconds={FAKE_DURATION_S}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────
// HeatmapSkeleton — loading state placeholder
// ─────────────────────────────────────────────────────────────────────────

function HeatmapSkeleton() {
  return (
    <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl pt-4 px-4 pb-4 animate-pulse">
      {/* Fake bar area */}
      <div className="relative flex items-end gap-px" style={{ height: '120px' }}>
        {Array.from({ length: 40 }, (_, i) => {
          // Roughly simulate a decay curve so the skeleton looks intentional
          const t   = i / 40;
          const h   = Math.max(0.08, Math.exp(-2.2 * t) * 0.7 + 0.1 + Math.sin(i * 2.3) * 0.05);
          return (
            <div
              key={i}
              className="flex-1 bg-gray-700/50 rounded-t-sm"
              style={{ height: `${h * 100}%` }}
            />
          );
        })}
      </div>
      {/* Fake time axis */}
      <div className="flex justify-between mt-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-2 w-8 bg-gray-700/40 rounded" />
        ))}
      </div>
    </div>
  );
}
