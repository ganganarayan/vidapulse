'use strict';
import React, { useEffect, useState, useRef } from 'react';
import api from '../../lib/api';
import FeatureWall from '../upgrade/FeatureWall';

/**
 * HeatmapSection — Beautiful engagement retention chart.
 *
 * Visual design:
 *  - SVG area chart with smooth curve (cubic bezier)
 *  - Multi-gradient fill: deep green at top → amber → crimson as viewers drop
 *  - Y-axis: % viewers retained (0–100%)
 *  - X-axis: video duration timestamps
 *  - Animated draw-in on load
 *  - Hover crosshair with tooltip
 *  - Stats row: avg retention, peak drop-off, total viewers
 *
 * Pro-only. Non-Pro users see a blurred fake chart behind FeatureWall.
 */

const PRO_PLANS      = new Set(['pro', 'admin_lifetime']);
const FAKE_DURATION_S = 312;

// ─────────────────────────────────────────────────────────────────────────
// Color helpers
// ─────────────────────────────────────────────────────────────────────────

// Multi-stop gradient for the area fill
// High retention = emerald, mid = amber, low = rose/crimson
function retentionColor(pct) {
  // pct = 0..100
  const t = Math.max(0, Math.min(1, pct / 100));
  const stops = [
    [0.00, [239, 68,  68]],   // rose-500  — very low
    [0.25, [251, 146, 60]],   // orange-400
    [0.50, [234, 179,  8]],   // amber-500
    [0.75, [ 52, 211,153]],   // emerald-400
    [1.00, [ 16, 185,129]],   // emerald-500 — full retention
  ];
  let lo = stops[0], hi = stops[stops.length - 1];
  for (let i = 0; i < stops.length - 1; i++) {
    if (t >= stops[i][0] && t <= stops[i + 1][0]) { lo = stops[i]; hi = stops[i + 1]; break; }
  }
  const f = lo[0] === hi[0] ? 0 : (t - lo[0]) / (hi[0] - lo[0]);
  const lerp = (a, b) => Math.round(a + f * (b - a));
  return `rgb(${lerp(lo[1][0],hi[1][0])},${lerp(lo[1][1],hi[1][1])},${lerp(lo[1][2],hi[1][2])})`;
}

function formatTime(s) {
  if (s == null || isNaN(s)) return '';
  const m = Math.floor(s / 60), sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2,'0')}`;
}

// ─────────────────────────────────────────────────────────────────────────
// Bucket / downsample helpers
// ─────────────────────────────────────────────────────────────────────────

function bucketRetention(heatmap, durationSeconds, targetBuckets = 200) {
  if (!heatmap || heatmap.length === 0 || !durationSeconds) return [];
  const bucketSize = Math.max(1, durationSeconds / targetBuckets);
  const numBuckets = Math.ceil(durationSeconds / bucketSize);
  const acc = new Array(numBuckets).fill(0);
  let counts = new Array(numBuckets).fill(0);

  heatmap.forEach(({ second_bucket, first_watches, replays }) => {
    const idx = Math.min(Math.floor(second_bucket / bucketSize), numBuckets - 1);
    acc[idx]    += (Number(first_watches) + Number(replays)) || 0;
    counts[idx] += 1;
  });

  // Average within each bucket
  const bucketed = acc.map((v, i) => counts[i] > 0 ? v / counts[i] : 0);
  const peak = Math.max(...bucketed, 1);

  return bucketed.map((v, i) => ({
    second: i * bucketSize,
    pct   : Math.min(100, (v / peak) * 100),
    total : v,
  }));
}

function generateFakeRetention(n = 200) {
  return Array.from({ length: n }, (_, i) => {
    const t     = i / n;
    const pct   = Math.max(2, Math.min(100,
      100 * (Math.exp(-2.5 * t) * 0.82 + 0.05 +
      0.14 * Math.exp(-((t - 0.3) ** 2) / 0.01) +
      Math.sin(i * 5.7) * 0.02)
    ));
    return { second: t * FAKE_DURATION_S, pct, total: pct };
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
        const { heatmap, drop_off_second, duration_seconds, total_viewers } = res.data;
        if (!heatmap || heatmap.length === 0) { setStatus('empty'); return; }
        setHeatData({ heatmap, drop_off_second, duration_seconds, total_viewers });
        setStatus('loaded');
      })
      .catch(() => { if (!cancelled) setStatus('error'); });
    return () => { cancelled = true; };
  }, [videoId, isPro, retryKey]);

  if (!isPro) {
    return (
      <FeatureWall feature="heatmap" requiredPlan="pro" currentPlan={userPlan} minHeight="260px">
        <RetentionChart buckets={generateFakeRetention()} durationSeconds={FAKE_DURATION_S} totalViewers={142} fake />
      </FeatureWall>
    );
  }

  if (status === 'idle' || status === 'loading') return <HeatmapSkeleton />;

  if (status === 'error') {
    return (
      <div className="bg-gray-800/30 border border-gray-700/40 rounded-xl px-5 py-7 text-center">
        <p className="text-sm text-gray-400 mb-3">Could not load heatmap data.</p>
        <button onClick={() => setRetryKey(k => k + 1)}
          className="text-xs text-amber-400 hover:text-amber-300 px-3 py-1.5 border border-amber-500/30 rounded-lg">
          Try again
        </button>
      </div>
    );
  }

  if (status === 'empty') {
    return (
      <div className="bg-gray-800/30 border border-gray-700/40 border-dashed rounded-xl px-5 py-8 text-center">
        <p className="text-sm text-gray-500">No heatmap data yet.</p>
        <p className="text-xs text-gray-600 mt-1">Chart fills in as viewers watch.</p>
      </div>
    );
  }

  const { heatmap, drop_off_second, duration_seconds, total_viewers } = heatData;
  const buckets = bucketRetention(heatmap, duration_seconds, 200);

  return (
    <RetentionChart
      buckets={buckets}
      durationSeconds={duration_seconds}
      totalViewers={total_viewers}
      dropOffSecond={drop_off_second}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────
// RetentionChart — the main SVG visualisation
// ─────────────────────────────────────────────────────────────────────────

const CHART_H  = 220;   // chart drawing height px
const Y_LABELS = [0, 25, 50, 75, 100];

function RetentionChart({ buckets, durationSeconds, totalViewers, dropOffSecond, fake = false }) {
  const svgRef      = useRef(null);
  const [hoverX,    setHoverX]    = useState(null);  // 0..1 fraction
  const [animated,  setAnimated]  = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 60);
    return () => clearTimeout(t);
  }, []);

  if (!buckets || buckets.length === 0) return null;

  const W = 100; // viewBox width units (%)
  const H = 100; // viewBox height units (%)
  const PAD_L = 8;  // left padding (for Y labels)
  const PAD_B = 8;  // bottom padding (for X labels)
  const CHART_W = W - PAD_L;
  const CHART_H_SVG = H - PAD_B;

  // Map bucket index to SVG coordinates
  const n = buckets.length;
  const pts = buckets.map((b, i) => {
    const x = PAD_L + (i / (n - 1)) * CHART_W;
    const y = CHART_H_SVG - (b.pct / 100) * CHART_H_SVG;
    return { x, y, pct: b.pct, second: b.second };
  });

  // Smooth cubic bezier path
  function smoothPath(points) {
    if (points.length < 2) return '';
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cpx  = (prev.x + curr.x) / 2;
      d += ` C ${cpx} ${prev.y} ${cpx} ${curr.y} ${curr.x} ${curr.y}`;
    }
    return d;
  }

  // Downsample for performance (max 120 points for path)
  const step   = Math.max(1, Math.floor(n / 120));
  const sampled = pts.filter((_, i) => i % step === 0 || i === n - 1);

  const linePath = smoothPath(sampled);
  // Area fill: close to bottom
  const areaPath = linePath
    + ` L ${sampled[sampled.length - 1].x} ${CHART_H_SVG}`
    + ` L ${PAD_L} ${CHART_H_SVG} Z`;

  // Gradient stops derived from sampled points
  const gradientStops = sampled.map((p, i) => ({
    offset: `${((p.x - PAD_L) / CHART_W * 100).toFixed(1)}%`,
    color : retentionColor(p.pct),
    opacity: 0.55,
  }));

  // Hover logic
  function handleMouseMove(e) {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width;
    setHoverX(Math.max(0, Math.min(1, relX)));
  }

  // Find hover bucket
  let hoverBucket = null;
  let hoverSvgX   = null;
  if (hoverX !== null && buckets.length > 0) {
    const hIdx = Math.round(hoverX * (buckets.length - 1));
    hoverBucket = buckets[Math.max(0, Math.min(buckets.length - 1, hIdx))];
    const p     = pts[Math.max(0, Math.min(pts.length - 1, hIdx))];
    hoverSvgX   = p?.x;
  }

  // Average retention
  const avgRetention = buckets.length > 0
    ? Math.round(buckets.reduce((s, b) => s + b.pct, 0) / buckets.length)
    : 0;

  return (
    <div className="bg-gray-900/60 border border-gray-700/50 rounded-2xl overflow-hidden shadow-xl">

      {/* ── Stats row ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-6 px-5 py-4 border-b border-gray-800/60">
        <StatPill label="Avg Retention"   value={`${avgRetention}%`}                            color="#10b981" />
        {totalViewers > 0 && (
          <StatPill label="Total Viewers" value={totalViewers.toLocaleString()}                  color="#818cf8" />
        )}
        {dropOffSecond != null && durationSeconds > 0 && (
          <StatPill label="Peak Drop-off" value={formatTime(dropOffSecond)} color="#f87171" className="ml-auto" />
        )}
        {hoverBucket && (
          <div className="ml-auto text-right">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider leading-none mb-1 font-mono">
              {formatTime(hoverBucket.second)}
            </p>
            <p className="text-base font-bold" style={{ color: retentionColor(hoverBucket.pct) }}>
              {Math.round(hoverBucket.pct)}%
            </p>
          </div>
        )}
      </div>

      {/* ── SVG chart ─────────────────────────────────────────────────── */}
      <div className="px-2 pt-3 pb-1 select-none">
        <div className="flex">
          {/* Y-axis labels */}
          <div className="flex flex-col justify-between items-end pr-2 text-[9px] text-gray-500 font-mono"
               style={{ height: `${CHART_H}px`, minWidth: '28px' }}>
            {[...Y_LABELS].reverse().map(v => (
              <span key={v}>{v}%</span>
            ))}
          </div>

          {/* Chart SVG */}
          <div className="flex-1 relative" style={{ height: `${CHART_H}px` }}>
            <svg
              ref={svgRef}
              viewBox={`0 0 100 ${H}`}
              preserveAspectRatio="none"
              className="absolute inset-0 w-full h-full cursor-crosshair"
              onMouseMove={handleMouseMove}
              onMouseLeave={() => setHoverX(null)}
            >
              <defs>
                {/* Horizontal gradient for area fill */}
                <linearGradient id="retentionAreaGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  {gradientStops.map((s, i) => (
                    <stop key={i} offset={s.offset} stopColor={s.color} stopOpacity={s.opacity} />
                  ))}
                </linearGradient>

                {/* Vertical fade gradient (top opaque → bottom transparent) */}
                <linearGradient id="retentionFadeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%"   stopColor="white" stopOpacity="0.12" />
                  <stop offset="100%" stopColor="white" stopOpacity="0.0"  />
                </linearGradient>

                {/* Clip path for animated draw-in */}
                <clipPath id="retentionClip">
                  <rect x="0" y="0" width={animated ? '100' : '0'} height="100"
                    style={{ transition: 'width 1.4s cubic-bezier(0.22,1,0.36,1)' }} />
                </clipPath>
              </defs>

              {/* Grid lines at 25 / 50 / 75 */}
              {[25, 50, 75].map(pct => {
                const y = CHART_H_SVG - (pct / 100) * CHART_H_SVG;
                return (
                  <line key={pct} x1={PAD_L} y1={y} x2={W} y2={y}
                    stroke="rgba(55,65,81,0.5)" strokeWidth="0.4" />
                );
              })}

              {/* Area fill */}
              <path d={areaPath} fill="url(#retentionAreaGrad)" clipPath="url(#retentionClip)" />
              {/* Vertical fade sheen over area */}
              <path d={areaPath} fill="url(#retentionFadeGrad)" clipPath="url(#retentionClip)" />

              {/* Stroke line on top */}
              <path
                d={linePath}
                fill="none"
                stroke="url(#retentionLineGrad)"
                strokeWidth="0.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                clipPath="url(#retentionClip)"
              />
              {/* Line gradient (separate def so it goes top→bottom for the stroke) */}
              <defs>
                <linearGradient id="retentionLineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  {gradientStops.map((s, i) => (
                    <stop key={i} offset={s.offset} stopColor={s.color} stopOpacity="1" />
                  ))}
                </linearGradient>
              </defs>

              {/* Hover crosshair */}
              {hoverSvgX != null && hoverBucket && (
                <>
                  <line
                    x1={hoverSvgX} y1={0} x2={hoverSvgX} y2={CHART_H_SVG}
                    stroke="rgba(255,255,255,0.18)" strokeWidth="0.5" strokeDasharray="2 2"
                  />
                  <circle
                    cx={hoverSvgX}
                    cy={CHART_H_SVG - (hoverBucket.pct / 100) * CHART_H_SVG}
                    r="1.2"
                    fill={retentionColor(hoverBucket.pct)}
                    stroke="rgba(255,255,255,0.7)"
                    strokeWidth="0.4"
                  />
                </>
              )}

              {/* Drop-off marker */}
              {dropOffSecond != null && durationSeconds > 0 && (() => {
                const doX = PAD_L + (dropOffSecond / durationSeconds) * CHART_W;
                return (
                  <line x1={doX} y1={0} x2={doX} y2={CHART_H_SVG}
                    stroke="rgba(248,113,113,0.5)" strokeWidth="0.6" strokeDasharray="1.5 1.5" />
                );
              })()}
            </svg>
          </div>
        </div>

        {/* X-axis time labels */}
        <div className="flex justify-between pl-8 mt-1 text-[9px] text-gray-500 font-mono">
          <span>0:00</span>
          {durationSeconds > 0 && [0.25, 0.5, 0.75].map(f => (
            <span key={f}>{formatTime(durationSeconds * f)}</span>
          ))}
          <span>{formatTime(durationSeconds)}</span>
        </div>
      </div>

      {/* ── Color gradient legend ─────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-5 py-3 border-t border-gray-800/50">
        <span className="text-[10px] text-gray-500 font-medium">Low retention</span>
        <div className="flex-1 h-1.5 rounded-full" style={{
          background: 'linear-gradient(to right, rgb(239,68,68), rgb(251,146,60), rgb(234,179,8), rgb(52,211,153), rgb(16,185,129))',
        }} />
        <span className="text-[10px] text-gray-500 font-medium">High retention</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// StatPill
// ─────────────────────────────────────────────────────────────────────────

function StatPill({ label, value, color, className = '' }) {
  return (
    <div className={className}>
      <p className="text-[10px] text-gray-500 uppercase tracking-wider leading-none mb-1">{label}</p>
      <p className="text-base font-bold" style={{ color }}>{value}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// HeatmapSkeleton
// ─────────────────────────────────────────────────────────────────────────

function HeatmapSkeleton() {
  return (
    <div className="bg-gray-800/40 border border-gray-700/40 rounded-2xl overflow-hidden animate-pulse">
      <div className="h-14 border-b border-gray-700/40 px-5 flex items-center gap-8">
        <div className="h-4 w-20 bg-gray-700/60 rounded" />
        <div className="h-4 w-16 bg-gray-700/50 rounded" />
      </div>
      <div className="px-3 pt-3 pb-1">
        <div className="flex">
          <div className="w-7 flex flex-col justify-between py-1 pr-1 gap-1">
            {[...Array(5)].map((_, i) => <div key={i} className="h-2 w-full bg-gray-700/30 rounded" />)}
          </div>
          <div className="flex-1 h-[220px] bg-gray-800/60 rounded-lg relative overflow-hidden">
            {/* Fake retention curve shape */}
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full opacity-30">
              <path d="M 0 10 C 15 15 25 45 40 55 C 55 65 65 68 100 72 L 100 100 L 0 100 Z"
                fill="url(#skeletonGrad)" />
              <defs>
                <linearGradient id="skeletonGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%"   stopColor="#10b981" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.2" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
        <div className="flex justify-between pl-8 mt-2">
          {[...Array(5)].map((_, i) => <div key={i} className="h-2 w-8 bg-gray-700/30 rounded" />)}
        </div>
      </div>
      <div className="h-10 border-t border-gray-700/40" />
    </div>
  );
}
