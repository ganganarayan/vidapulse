'use strict';
import React, { useEffect, useState, useCallback } from 'react';
import AppLayout   from '../components/AppLayout';
import FeatureGate from '../components/FeatureGate';
import api from '../lib/api';

/**
 * FunnelsPage — /funnels
 *
 * Shows a 4-step viewer funnel calculated from real analytics_sessions data.
 * Optionally filtered by a specific video.
 */
export default function FunnelsPage() {
  const [steps,    setSteps]    = useState([]);
  const [videos,   setVideos]   = useState([]);
  const [videoId,  setVideoId]  = useState('');
  const [loading,  setLoading]  = useState(true);

  const load = useCallback((vid) => {
    setLoading(true);
    const qs = vid ? `?video_id=${vid}` : '';
    api.get(`/user/funnel${qs}`)
      .then(r => {
        setSteps(r.data.steps  ?? []);
        setVideos(r.data.videos ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(''); }, [load]);

  function handleVideoChange(e) {
    const val = e.target.value;
    setVideoId(val);
    load(val);
  }

  const topCount = steps[0]?.count ?? 0;

  return (
    <AppLayout>
      <FeatureGate required="pro" feature="Funnels">
      <div className="max-w-3xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="flex items-start justify-between mb-8 gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
              <FunnelIcon />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-50">Funnels</h1>
              <p className="text-sm text-gray-400 mt-0.5">
                Map the viewer journey from page load to video completion.
              </p>
            </div>
          </div>
          {/* Video selector */}
          <select
            value={videoId}
            onChange={handleVideoChange}
            className="bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded-lg px-3 py-2
                       focus:outline-none focus:ring-2 focus:ring-amber-500/50 min-w-[180px]"
          >
            <option value="">All videos</option>
            {videos.map(v => (
              <option key={v.id} value={v.id}>{v.title}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-gray-500 text-sm py-16">
            <span className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            Calculating funnel…
          </div>
        ) : (
          <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-700/40">
              <p className="text-sm font-semibold text-gray-300">
                {videoId
                  ? videos.find(v => v.id === videoId)?.title ?? 'Video funnel'
                  : 'All videos — viewer journey'}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Based on {topCount.toLocaleString()} total session{topCount !== 1 ? 's' : ''}
              </p>
            </div>

            <div className="px-6 py-5 flex flex-col gap-5">
              {topCount === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">
                  No session data yet. Funnel will populate once viewers start watching.
                </p>
              ) : (
                steps.map((step, i) => (
                  <FunnelStep
                    key={i}
                    label={step.label}
                    count={step.count}
                    pct={step.pct}
                    topCount={topCount}
                    isFirst={i === 0}
                    dropoff={i > 0 ? steps[i - 1].pct - step.pct : 0}
                  />
                ))
              )}
            </div>
          </div>
        )}

        {/* Legend */}
        {!loading && topCount > 0 && (
          <p className="text-xs text-gray-500 mt-4 text-center">
            Percentages relative to total page loads &nbsp;·&nbsp; Hover bars for exact counts
          </p>
        )}
      </div>
      </FeatureGate>
    </AppLayout>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// FunnelStep — one row in the funnel
// ─────────────────────────────────────────────────────────────────────────

function FunnelStep({ label, count, pct, topCount, isFirst, dropoff }) {
  const barPct = topCount > 0 ? (count / topCount) * 100 : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5 gap-2">
        <span className="text-sm font-medium text-gray-200">{label}</span>
        <span className="text-sm font-bold text-gray-200 tabular-nums flex-shrink-0">
          {count.toLocaleString()}
          <span className="text-gray-500 font-normal ml-1.5">({pct}%)</span>
        </span>
      </div>
      <div className="w-full h-8 bg-gray-700/40 rounded-lg overflow-hidden relative group" title={`${count.toLocaleString()} viewers`}>
        <div
          className="h-full bg-amber-500 rounded-lg transition-all duration-500"
          style={{ width: `${Math.max(barPct, 0.5)}%` }}
        />
        {/* Hover count */}
        <span className="absolute inset-0 flex items-center px-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-xs font-semibold text-gray-900 bg-amber-400/90 px-1.5 py-0.5 rounded">
            {count.toLocaleString()} viewers
          </span>
        </span>
      </div>
      {!isFirst && dropoff > 0 && (
        <p className="text-xs text-red-400/70 mt-1">
          ↓ {dropoff}% drop-off from previous step
        </p>
      )}
    </div>
  );
}

// ─── Icon ─────────────────────────────────────────────────────────────────

function FunnelIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
    </svg>
  );
}
