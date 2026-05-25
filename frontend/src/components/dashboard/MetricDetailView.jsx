'use strict';
import React, { useState, useEffect, useRef } from 'react';
import api from '../../lib/api';

/**
 * MetricDetailView
 *
 * Shows a time-series line chart for a single metric, with a date-range
 * picker (defaulting to "All time" from the video's creation date).
 *
 * Props:
 *   videoId — string
 *   metric  — one of: plays|viewers|avg_watch|play_rate|completion|dropoff|watch_time|rewatches
 *   video   — video object (used for created_at default range)
 */

// ─────────────────────────────────────────────────────────────────────────
// Metric configuration
// ─────────────────────────────────────────────────────────────────────────

const METRIC_CONFIG = {
  plays: {
    label: 'Total Plays', yLabel: 'Plays',
    backendKey: 'plays', accentColor: '#f59e0b',
    desc: 'How many times your video was played each day.',
    totalLabel: 'Total Plays',
    format: n => Math.round(n).toLocaleString(),
    yTickFormat: n => compactNum(n),
  },
  viewers: {
    label: 'Unique Viewers', yLabel: 'Viewers',
    backendKey: 'viewers', accentColor: '#818cf8',
    desc: 'Distinct viewers tracked by browser cookie each day.',
    totalLabel: 'Total Unique',
    format: n => Math.round(n).toLocaleString(),
    yTickFormat: n => compactNum(n),
  },
  avg_watch: {
    label: 'Avg. Watch %', yLabel: 'Watch %',
    backendKey: 'avg_watch', accentColor: '#34d399',
    desc: 'Average percentage of the video that viewers watched each day.',
    totalLabel: 'Period Avg.',
    format: n => `${Number(n).toFixed(1)}%`,
    yTickFormat: n => `${Number(n).toFixed(0)}%`,
  },
  play_rate: {
    label: 'Play Rate', yLabel: 'Plays',
    backendKey: 'plays', accentColor: '#c084fc',
    desc: 'Daily plays — compare with viewers to gauge your play-rate trend.',
    totalLabel: 'Total Plays',
    format: n => Math.round(n).toLocaleString(),
    yTickFormat: n => compactNum(n),
  },
  completion: {
    label: 'Completion Rate', yLabel: 'Completions',
    backendKey: 'completions', accentColor: '#2dd4bf',
    desc: 'Sessions where the viewer reached the end of the video.',
    totalLabel: 'Total Completions',
    format: n => Math.round(n).toLocaleString(),
    yTickFormat: n => compactNum(n),
  },
  dropoff: {
    label: 'Drop-off Rate', yLabel: 'Sessions',
    backendKey: 'plays', accentColor: '#f87171',
    desc: 'Daily play sessions — sessions without completions indicate drop-off.',
    totalLabel: 'Total Sessions',
    format: n => Math.round(n).toLocaleString(),
    yTickFormat: n => compactNum(n),
  },
  watch_time: {
    label: 'Watch Time', yLabel: 'Minutes',
    backendKey: 'watch_seconds', accentColor: '#38bdf8',
    desc: 'Total watch time accumulated each day (in minutes).',
    totalLabel: 'Total Time',
    format: n => {
      const mins = Math.round(n / 60);
      return mins >= 60 ? `${(mins / 60).toFixed(1)} hr` : `${mins} min`;
    },
    yTickFormat: n => `${Math.round(n / 60)}m`,
  },
  rewatches: {
    label: 'Re-watches', yLabel: 'Plays',
    backendKey: 'plays', accentColor: '#facc15',
    desc: 'Daily plays — plays beyond unique viewers indicate re-watches.',
    totalLabel: 'Total Plays',
    format: n => Math.round(n).toLocaleString(),
    yTickFormat: n => compactNum(n),
  },
};

const RANGE_PRESETS = [
  { label: '7d',  days: 7   },
  { label: '30d', days: 30  },
  { label: '90d', days: 90  },
  { label: '1yr', days: 365 },
  { label: 'All', days: null },
];

// ─────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────

function toISODate(d) { return d.toISOString().slice(0, 10); }

function compactNum(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}k`;
  return Number(n.toFixed(1)).toLocaleString();
}

function fmtDate(dateStr) {
  if (!dateStr) return '';
  // PostgreSQL ::date columns arrive as ISO strings like "2026-05-25T00:00:00.000Z".
  // Appending 'T00:00:00' would break them, so just parse directly and force UTC
  // to avoid timezone off-by-one (e.g. May 24 in UTC displayed as May 23 locally).
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return String(dateStr).slice(0, 10);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
}

// ─────────────────────────────────────────────────────────────────────────
// MetricDetailView — main export
// ─────────────────────────────────────────────────────────────────────────

export default function MetricDetailView({ videoId, metric, video }) {
  const cfg       = METRIC_CONFIG[metric];
  const [rangeIdx, setRangeIdx] = useState(4); // default: All time

  const videoCreated = video?.created_at
    ? new Date(video.created_at)
    : new Date(Date.now() - 365 * 86400e3);

  const today  = new Date();
  const preset = RANGE_PRESETS[rangeIdx];
  const from   = toISODate(preset.days
    ? new Date(today.getTime() - preset.days * 86400e3)
    : videoCreated);
  const to     = toISODate(today);

  const [status, setStatus] = useState('loading');
  const [data,   setData]   = useState([]);
  const [total,  setTotal]  = useState(null);

  useEffect(() => {
    if (!videoId || !cfg) return;
    let cancelled = false;
    setStatus('loading');
    setData([]);
    api.get(`/videos/${videoId}/analytics/daily`, {
      params: { metric: cfg.backendKey, from, to },
    })
      .then(res => {
        if (cancelled) return;
        setData(res.data.data ?? []);
        setTotal(res.data.total);
        setStatus('loaded');
      })
      .catch(() => { if (!cancelled) setStatus('error'); });
    return () => { cancelled = true; };
  }, [videoId, cfg?.backendKey, from, to]);

  if (!cfg) return null;

  const hasData = status === 'loaded' && data.length > 0;

  return (
    <div className="px-6 py-6 min-w-0">
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mb-1">
            Metric Analysis
          </p>
          <h2 className="text-2xl font-bold text-gray-50">{cfg.label}</h2>
          <p className="text-xs text-gray-600 mt-1 max-w-sm">{cfg.desc}</p>
        </div>

        {/* ── Date range picker ─────────────────────────────────────── */}
        <div className="flex items-center gap-0.5 bg-gray-800/80 border border-gray-700 rounded-lg p-1 flex-shrink-0">
          {RANGE_PRESETS.map((p, idx) => (
            <button
              key={idx}
              onClick={() => setRangeIdx(idx)}
              className={`px-2.5 py-1.5 text-xs font-semibold rounded transition-colors
                ${rangeIdx === idx
                  ? 'bg-amber-500 text-gray-900'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/60'
                }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Summary stat ──────────────────────────────────────────────── */}
      {hasData && total != null && (
        <div className="mb-6">
          <div
            className="inline-flex flex-col rounded-xl px-5 py-3 border"
            style={{
              backgroundColor : `${cfg.accentColor}18`,
              borderColor     : `${cfg.accentColor}35`,
            }}
          >
            <span className="text-[10px] text-gray-400 uppercase tracking-wider">
              {cfg.totalLabel}
            </span>
            <span
              className="text-3xl font-bold tabular-nums mt-0.5"
              style={{ color: cfg.accentColor }}
            >
              {cfg.format(total)}
            </span>
          </div>
        </div>
      )}

      {/* ── Chart card ────────────────────────────────────────────────── */}
      <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl overflow-hidden">
        {status === 'loading' && <ChartSkeleton />}

        {status === 'error' && (
          <div className="py-16 text-center">
            <p className="text-sm text-gray-400">Could not load data.</p>
          </div>
        )}

        {status === 'loaded' && (
          data.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-sm text-gray-500">No data in this period.</p>
              <p className="text-xs text-gray-600 mt-1">Try a wider date range.</p>
            </div>
          ) : (
            <LineChart data={data} cfg={cfg} metricKey={metric} />
          )
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// LineChart — SVG time-series chart
// ─────────────────────────────────────────────────────────────────────────

function LineChart({ data, cfg, metricKey }) {
  const [hoverIdx, setHoverIdx] = useState(null);
  const svgRef = useRef(null);

  const VW = 800, VH = 290;
  const PAD = { t: 20, r: 20, b: 48, l: 62 };
  const IW  = VW - PAD.l - PAD.r;
  const IH  = VH - PAD.t - PAD.b;

  const values  = data.map(d => Number(d.value));
  const maxVal  = Math.max(...values, 1);

  function xOf(i) {
    return PAD.l + (data.length <= 1 ? IW / 2 : (i / (data.length - 1)) * IW);
  }
  function yOf(v) {
    return PAD.t + (1 - Math.max(0, Number(v)) / maxVal) * IH;
  }

  const pts      = data.map((d, i) => [xOf(i), yOf(d.value)]);
  const linePath = pts.map(([x, y], i) =>
    `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`
  ).join(' ');
  const areaPath = pts.length > 0
    ? `${linePath} L ${pts[pts.length-1][0].toFixed(1)} ${(PAD.t+IH).toFixed(1)}`
      + ` L ${pts[0][0].toFixed(1)} ${(PAD.t+IH).toFixed(1)} Z`
    : '';

  const yTickCount  = 5;
  const yTickValues = Array.from({ length: yTickCount + 1 }, (_, i) => ({
    v: (maxVal / yTickCount) * i,
    y: yOf((maxVal / yTickCount) * i),
  }));

  const maxXLabels  = Math.min(8, data.length);
  const xLabelIdxs  = data.length <= maxXLabels
    ? data.map((_, i) => i)
    : Array.from({ length: maxXLabels }, (_, k) =>
        Math.round((k / (maxXLabels - 1)) * (data.length - 1)));

  function handleSvgMouseMove(e) {
    if (!svgRef.current) return;
    const rect  = svgRef.current.getBoundingClientRect();
    const scale = VW / rect.width;
    const relX  = (e.clientX - rect.left) * scale - PAD.l;
    if (data.length <= 1) { setHoverIdx(0); return; }
    const idx = Math.round((relX / IW) * (data.length - 1));
    setHoverIdx(Math.max(0, Math.min(data.length - 1, idx)));
  }

  const gradId = `ldv-${metricKey}`;
  const hPt    = hoverIdx != null ? pts[hoverIdx] : null;

  // Tooltip left offset in %, relative to the inner chart width
  const tooltipLeftPct = hoverIdx != null
    ? ((xOf(hoverIdx) - PAD.l) / IW * 100)
    : 0;

  return (
    <div className="relative p-5" onMouseLeave={() => setHoverIdx(null)}>
      {/* ── Floating tooltip ─────────────────────────────────────── */}
      {hoverIdx != null && data[hoverIdx] && (
        <div
          className="absolute z-10 pointer-events-none"
          style={{
            left     : `calc(${PAD.l / VW * 100}% + ${tooltipLeftPct * IW / VW}%)`,
            top      : '12px',
            transform: 'translateX(-50%)',
          }}
        >
          <div className="bg-gray-900 border border-gray-600/70 rounded-lg px-3 py-2 shadow-2xl text-xs whitespace-nowrap">
            <p className="text-gray-400">{fmtDate(data[hoverIdx].date)}</p>
            <p className="font-bold mt-0.5" style={{ color: cfg.accentColor }}>
              {cfg.format(data[hoverIdx].value)}
            </p>
          </div>
        </div>
      )}

      <svg
        ref={svgRef}
        viewBox={`0 0 ${VW} ${VH}`}
        className="w-full select-none"
        style={{ height: '265px' }}
        onMouseMove={handleSvgMouseMove}
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={cfg.accentColor} stopOpacity="0.28" />
            <stop offset="100%" stopColor={cfg.accentColor} stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Y grid lines + labels */}
        {yTickValues.map(({ v, y }, i) => (
          <g key={i}>
            <line
              x1={PAD.l} y1={y} x2={PAD.l + IW} y2={y}
              stroke="#4b5563" strokeWidth="0.5"
              strokeDasharray={i === 0 ? undefined : '4 4'}
            />
            <text
              x={PAD.l - 8} y={y}
              textAnchor="end" dominantBaseline="middle"
              fill="#9ca3af" fontSize="11" fontFamily="system-ui,sans-serif"
            >
              {cfg.yTickFormat(v)}
            </text>
          </g>
        ))}

        {/* Hover vertical guide */}
        {hoverIdx != null && (
          <line
            x1={xOf(hoverIdx)} y1={PAD.t}
            x2={xOf(hoverIdx)} y2={PAD.t + IH}
            stroke="#4b5563" strokeWidth="1" strokeDasharray="4 4"
          />
        )}

        {/* Area fill */}
        {areaPath && <path d={areaPath} fill={`url(#${gradId})`} />}

        {/* Line */}
        {linePath && (
          <path
            d={linePath} fill="none"
            stroke={cfg.accentColor} strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round"
          />
        )}

        {/* Individual dots for small datasets */}
        {data.length <= 30 && pts.map(([x, y], i) => (
          <circle
            key={i} cx={x} cy={y}
            r={i === hoverIdx ? 5 : 2.5}
            fill={cfg.accentColor}
            stroke={i === hoverIdx ? '#0f172a' : 'none'}
            strokeWidth="2"
          />
        ))}

        {/* Hover dot (always visible when hovering) */}
        {hPt && (
          <circle
            cx={hPt[0]} cy={hPt[1]} r="5"
            fill={cfg.accentColor} stroke="#0f172a" strokeWidth="2"
          />
        )}

        {/* X axis baseline */}
        <line
          x1={PAD.l} y1={PAD.t + IH}
          x2={PAD.l + IW} y2={PAD.t + IH}
          stroke="#4b5563" strokeWidth="1"
        />

        {/* X axis date labels */}
        {xLabelIdxs.map(i => (
          <text
            key={i} x={xOf(i)} y={VH - 8}
            textAnchor="middle"
            fill="#9ca3af" fontSize="10" fontFamily="system-ui,sans-serif"
          >
            {fmtDate(data[i].date)}
          </text>
        ))}
      </svg>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// ChartSkeleton
// ─────────────────────────────────────────────────────────────────────────

function ChartSkeleton() {
  return (
    <div className="p-5 animate-pulse">
      <div className="flex items-end gap-px" style={{ height: '230px' }}>
        {Array.from({ length: 30 }, (_, i) => (
          <div
            key={i}
            className="flex-1 bg-gray-700/40 rounded-t"
            style={{ height: `${Math.max(12, 55 + Math.sin(i * 0.9) * 30 + Math.cos(i * 0.3) * 15)}%` }}
          />
        ))}
      </div>
      <div className="flex justify-between mt-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-2 w-12 bg-gray-700/30 rounded" />
        ))}
      </div>
    </div>
  );
}
