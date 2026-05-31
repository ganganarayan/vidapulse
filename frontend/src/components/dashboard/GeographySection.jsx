'use strict';
import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import { BreakdownChart, BreakdownSkeleton } from './DevicesSection';
import PlanTierBadge from '../PlanTierBadge';

/**
 * GeographySection — country breakdown of viewers.
 * Uses GET /api/videos/:id/analytics/breakdown?by=country
 * Shows top 10 countries.
 */

// Accent colors cycling for countries
const COUNTRY_COLORS = [
  '#f59e0b', '#818cf8', '#34d399', '#f87171',
  '#38bdf8', '#c084fc', '#2dd4bf', '#facc15',
  '#fb923c', '#a78bfa',
];

export default function GeographySection({ videoId, userPlan }) {
  const [status, setStatus] = useState('loading');
  const [data,   setData]   = useState([]);
  const [total,  setTotal]  = useState(0);

  useEffect(() => {
    if (!videoId) return;
    let cancelled = false;
    setStatus('loading');

    api.get(`/videos/${videoId}/analytics/breakdown`, { params: { by: 'country' } })
      .then(res => {
        if (cancelled) return;
        setData(res.data.data ?? []);
        setTotal(res.data.total ?? 0);
        setStatus('loaded');
      })
      .catch(() => { if (!cancelled) setStatus('error'); });

    return () => { cancelled = true; };
  }, [videoId]);

  // Build colorMap from country names dynamically
  const colorMap = Object.fromEntries(
    data.map((d, i) => [d.label, COUNTRY_COLORS[i % COUNTRY_COLORS.length]])
  );

  return (
    <div className="px-4 sm:px-6 py-4 sm:py-6 min-w-0">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mb-1">
            Audience
          </p>
          <h2 className="text-2xl font-bold text-gray-50 flex items-center gap-2">Geography <PlanTierBadge plan="starter" userPlan={userPlan} /></h2>
          <p className="text-xs text-gray-400 mt-1">
            Where in the world your viewers are watching from.
          </p>
        </div>
        {total > 0 && status === 'loaded' && (
          <div className="flex-shrink-0 text-right">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Total Sessions</p>
            <p className="text-xl font-bold text-gray-200">{total.toLocaleString()}</p>
          </div>
        )}
      </div>

      {/* Content card */}
      <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl overflow-hidden">
        {status === 'loading' && <BreakdownSkeleton rows={7} />}

        {status === 'error' && (
          <div className="py-14 text-center">
            <p className="text-sm text-gray-400">Could not load geography data.</p>
          </div>
        )}

        {status === 'loaded' && (
          data.length === 0 ? (
            <div className="py-14 text-center">
              <p className="text-sm text-gray-400">No location data yet.</p>
              <p className="text-xs text-gray-400 mt-1">
                Country data appears once viewers start watching.
              </p>
            </div>
          ) : (
            <>
              {/* Top country highlight */}
              {data[0] && (
                <div className="px-6 pt-5 pb-4 border-b border-gray-700/50">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                      style={{ backgroundColor: `${COUNTRY_COLORS[0]}20` }}
                    >
                      🌍
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Top Country</p>
                      <p className="text-base font-bold text-gray-100">{data[0].label}</p>
                    </div>
                    <div className="ml-auto text-right">
                      <p
                        className="text-2xl font-bold"
                        style={{ color: COUNTRY_COLORS[0] }}
                      >
                        {Number(data[0].pct).toFixed(1)}%
                      </p>
                      <p className="text-xs text-gray-500">
                        {data[0].count.toLocaleString()} session{data[0].count !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* All countries list */}
              <BreakdownChart data={data} colorMap={colorMap} />
            </>
          )
        )}
      </div>
    </div>
  );
}
