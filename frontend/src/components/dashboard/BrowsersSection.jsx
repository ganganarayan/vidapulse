'use strict';
import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import { BreakdownChart, BreakdownSkeleton } from './DevicesSection';
import PlanTierBadge from '../PlanTierBadge';

/**
 * BrowsersSection — browser breakdown of viewer sessions.
 * Uses GET /api/videos/:id/analytics/breakdown?by=browser
 */

const BROWSER_COLORS = {
  Chrome       : '#34d399',
  Safari       : '#818cf8',
  Firefox      : '#fb923c',
  Edge         : '#38bdf8',
  Opera        : '#f87171',
  Samsung      : '#2dd4bf',
  'Samsung Internet': '#2dd4bf',
  Unknown      : '#6b7280',
};

// Simple browser icon (generic globe fallback)
function BrowserIcon({ name }) {
  const colorMap = {
    Chrome  : '#34d399',
    Safari  : '#818cf8',
    Firefox : '#fb923c',
    Edge    : '#38bdf8',
  };
  const color = colorMap[name] ?? '#6b7280';
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color}
      strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

// Fallback colors for unlisted browsers
const FALLBACK_COLORS = [
  '#f59e0b', '#c084fc', '#facc15', '#a78bfa', '#fb923c',
];

export default function BrowsersSection({ videoId }) {
  const [status, setStatus] = useState('loading');
  const [data,   setData]   = useState([]);

  useEffect(() => {
    if (!videoId) return;
    let cancelled = false;
    setStatus('loading');

    api.get(`/videos/${videoId}/analytics/breakdown`, { params: { by: 'browser' } })
      .then(res => {
        if (cancelled) return;
        setData(res.data.data ?? []);
        setStatus('loaded');
      })
      .catch(() => { if (!cancelled) setStatus('error'); });

    return () => { cancelled = true; };
  }, [videoId]);

  // Build colorMap — use known colors, fall back to cycling palette
  let fallbackIdx = 0;
  const colorMap = Object.fromEntries(
    data.map(({ label }) => {
      const color = BROWSER_COLORS[label] ?? FALLBACK_COLORS[fallbackIdx++ % FALLBACK_COLORS.length];
      return [label, color];
    })
  );

  const iconMap = Object.fromEntries(
    data.map(({ label }) => [label, <BrowserIcon key={label} name={label} />])
  );

  return (
    <div className="px-6 py-6 min-w-0">
      {/* Header */}
      <div className="mb-6">
        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mb-1">
          Audience
        </p>
        <h2 className="text-2xl font-bold text-gray-50 flex items-center gap-2">Browsers <PlanTierBadge plan="starter" /></h2>
        <p className="text-xs text-gray-400 mt-1">
          Which browsers your viewers use to watch your video.
        </p>
      </div>

      {/* Content card */}
      <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl overflow-hidden">
        {status === 'loading' && <BreakdownSkeleton rows={5} />}

        {status === 'error' && (
          <div className="py-14 text-center">
            <p className="text-sm text-gray-400">Could not load browser data.</p>
          </div>
        )}

        {status === 'loaded' && (
          data.length === 0 ? (
            <div className="py-14 text-center">
              <p className="text-sm text-gray-500">No browser data yet.</p>
              <p className="text-xs text-gray-600 mt-1">
                Data appears once viewers start watching.
              </p>
            </div>
          ) : (
            <BreakdownChart data={data} colorMap={colorMap} iconMap={iconMap} />
          )
        )}
      </div>
    </div>
  );
}
