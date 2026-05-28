'use strict';
import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import PlanTierBadge from '../PlanTierBadge';

/**
 * DevicesSection — device-type breakdown (Desktop / Mobile / Tablet).
 * Uses GET /api/videos/:id/analytics/breakdown?by=device
 */

const DEVICE_COLORS = {
  Desktop: '#f59e0b',
  Mobile : '#818cf8',
  Tablet : '#34d399',
  Unknown: '#6b7280',
};

const DEVICE_ICONS = {
  Desktop: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  ),
  Mobile: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="14" height="20" rx="2" />
      <line x1="12" y1="18" x2="12.01" y2="18" />
    </svg>
  ),
  Tablet: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <line x1="12" y1="18" x2="12.01" y2="18" />
    </svg>
  ),
};

export default function DevicesSection({ videoId }) {
  const [status, setStatus] = useState('loading');
  const [data,   setData]   = useState([]);

  useEffect(() => {
    if (!videoId) return;
    let cancelled = false;
    setStatus('loading');

    api.get(`/videos/${videoId}/analytics/breakdown`, { params: { by: 'device' } })
      .then(res => {
        if (cancelled) return;
        setData(res.data.data ?? []);
        setStatus('loaded');
      })
      .catch(() => { if (!cancelled) setStatus('error'); });

    return () => { cancelled = true; };
  }, [videoId]);

  return (
    <div className="px-6 py-6 min-w-0">
      {/* Header */}
      <div className="mb-6">
        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mb-1">
          Audience
        </p>
        <h2 className="text-2xl font-bold text-gray-50 flex items-center gap-2">Devices <PlanTierBadge plan="starter" /></h2>
        <p className="text-xs text-gray-400 mt-1">
          How your viewers are watching — desktop, mobile, or tablet.
        </p>
      </div>

      {/* Content card */}
      <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl overflow-hidden">
        {status === 'loading' && <BreakdownSkeleton rows={3} />}

        {status === 'error' && (
          <div className="py-14 text-center">
            <p className="text-sm text-gray-400">Could not load device data.</p>
          </div>
        )}

        {status === 'loaded' && (
          data.length === 0 ? (
            <div className="py-14 text-center">
              <p className="text-sm text-gray-400">No device data yet.</p>
              <p className="text-xs text-gray-400 mt-1">
                Data appears once viewers start watching.
              </p>
            </div>
          ) : (
            <BreakdownChart
              data={data}
              colorMap={DEVICE_COLORS}
              iconMap={DEVICE_ICONS}
            />
          )
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Shared: BreakdownChart
// ─────────────────────────────────────────────────────────────────────────

export function BreakdownChart({ data, colorMap = {}, iconMap = {} }) {
  const maxCount = Math.max(...data.map(d => d.count), 1);

  return (
    <div className="p-6 flex flex-col gap-4">
      {/* Donut summary row */}
      <div className="flex items-center gap-4 flex-wrap mb-2">
        {data.map(({ label, pct }) => {
          const color = colorMap[label] ?? '#6b7280';
          return (
            <div key={label} className="flex items-center gap-2">
              <span
                className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: color }}
              />
              <span className="text-xs text-gray-400">{label}</span>
              <span className="text-xs font-semibold text-gray-200">
                {Number(pct).toFixed(1)}%
              </span>
            </div>
          );
        })}
      </div>

      {/* Horizontal bars */}
      {data.map(({ label, count, pct }) => {
        const color    = colorMap[label] ?? '#6b7280';
        const widthPct = (count / maxCount) * 100;
        const icon     = iconMap[label];

        return (
          <div key={label}>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                {icon && (
                  <span style={{ color }} className="flex-shrink-0">{icon}</span>
                )}
                <span className="text-sm font-semibold text-gray-200">{label}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400">
                  {count.toLocaleString()} session{count !== 1 ? 's' : ''}
                </span>
                <span className="text-sm font-bold w-14 text-right" style={{ color }}>
                  {Number(pct).toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="h-3 bg-gray-700/50 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${widthPct}%`, backgroundColor: color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Shared: BreakdownSkeleton
// ─────────────────────────────────────────────────────────────────────────

export function BreakdownSkeleton({ rows = 5 }) {
  return (
    <div className="p-6 flex flex-col gap-5 animate-pulse">
      {[...Array(rows)].map((_, i) => (
        <div key={i}>
          <div className="flex items-center justify-between mb-1.5">
            <div className="h-4 w-24 bg-gray-700/40 rounded" />
            <div className="h-4 w-14 bg-gray-700/30 rounded" />
          </div>
          <div className="h-2.5 bg-gray-700/30 rounded-full">
            <div
              className="h-full bg-gray-600/40 rounded-full"
              style={{ width: `${40 + Math.random() * 50}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
