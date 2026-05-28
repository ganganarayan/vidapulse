'use strict';
import React, { useState, useEffect } from 'react';
import api from '../../lib/api';

/**
 * DomainsSection
 *
 * Shows which domains have embedded / played this video.
 * Uses GET /api/videos/:id/analytics/breakdown?by=domain
 * Free-tier feature — no plan gate.
 *
 * Props:
 *   videoId — UUID of the video
 */

const COLORS = ['#818cf8','#34d399','#f59e0b','#f87171','#38bdf8','#c084fc','#2dd4bf','#facc15','#fb923c'];

export default function DomainsSection({ videoId }) {
  const [status, setStatus] = useState('loading');
  const [data,   setData]   = useState([]);
  const [total,  setTotal]  = useState(0);

  useEffect(() => {
    if (!videoId) return;
    let cancelled = false;
    setStatus('loading');
    api.get(`/videos/${videoId}/analytics/breakdown`, { params: { by: 'domain' } })
      .then(res => {
        if (cancelled) return;
        setData(res.data.data ?? []);
        setTotal(res.data.total ?? 0);
        setStatus('loaded');
      })
      .catch(() => { if (!cancelled) setStatus('error'); });
    return () => { cancelled = true; };
  }, [videoId]);

  return (
    <div className="px-6 py-6">
      {/* Header */}
      <div className="mb-6">
        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mb-1">
          Metrics
        </p>
        <h2 className="text-2xl font-bold text-gray-50">Embed Domains</h2>
        <p className="text-xs text-gray-400 mt-1">
          Which pages and domains your video is embedded on.
        </p>
      </div>

      {/* Content card */}
      <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl overflow-hidden">
        {/* Card header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700/40">
          <div className="flex items-center gap-2">
            <span className="text-base">🌐</span>
            <div>
              <p className="text-sm font-semibold text-gray-200">Embed Domain</p>
              <p className="text-xs text-gray-500">Which of your pages the video is embedded on</p>
            </div>
          </div>
          {status === 'loaded' && total > 0 && (
            <span className="text-xs text-gray-500 flex-shrink-0">
              {total.toLocaleString()} sessions
            </span>
          )}
        </div>

        {/* Body */}
        {status === 'loading' && <DomainsSkeleton />}

        {status === 'error' && (
          <div className="px-5 py-5 text-xs text-gray-500 text-center">
            Could not load domain data.
          </div>
        )}

        {status === 'loaded' && (
          data.length === 0 || data.every(d => d.label === '(direct)') ? (
            <div className="px-5 py-7 text-center">
              <p className="text-2xl mb-2">🌐</p>
              <p className="text-sm text-gray-400 font-medium mb-1">No embed data yet</p>
              <p className="text-xs text-gray-600 max-w-xs mx-auto">
                Once your video is embedded on a page and played, you'll see which domains drive the most views.
              </p>
            </div>
          ) : (
            <div className="px-5 py-4">
              {data.map((d, i) => {
                const color    = COLORS[i % COLORS.length];
                const widthPct = data.length > 0
                  ? (d.count / Math.max(...data.map(x => x.count), 1)) * 100
                  : 0;
                return (
                  <div key={d.label} className="mb-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-300 truncate max-w-[65%]">{d.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">{d.count.toLocaleString()}</span>
                        <span className="text-sm font-bold w-12 text-right" style={{ color }}>
                          {d.pct.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="h-2 bg-gray-700/50 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${widthPct}%`, backgroundColor: color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>
    </div>
  );
}

function DomainsSkeleton() {
  return (
    <div className="px-5 py-4 animate-pulse">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="mb-4">
          <div className="flex justify-between mb-1.5">
            <div className="h-3 bg-gray-700/60 rounded" style={{ width: `${35 + i * 10}%` }} />
            <div className="h-3 w-16 bg-gray-700/40 rounded" />
          </div>
          <div className="h-2 bg-gray-700/30 rounded-full" />
        </div>
      ))}
    </div>
  );
}
