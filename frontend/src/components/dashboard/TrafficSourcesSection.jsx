'use strict';
import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import { BreakdownChart, BreakdownSkeleton } from './DevicesSection';

/**
 * TrafficSourcesSection
 *
 * Full viewer breakdown: Devices, Browsers, Geography + UTM tracking.
 * Uses GET /api/videos/:id/analytics/breakdown?by=<key>
 */

// Audience panels (device, browser, geography) shown first
const AUDIENCE_PANELS = [
  {
    key  : 'device',
    label: 'Devices',
    desc : 'Desktop, mobile, and tablet breakdown',
    icon : '💻',
    colors: ['#34d399','#818cf8','#f59e0b','#f87171','#38bdf8'],
  },
  {
    key  : 'browser',
    label: 'Browsers',
    desc : 'Which browser viewers are using',
    icon : '🌐',
    colors: ['#38bdf8','#f59e0b','#f87171','#818cf8','#34d399','#c084fc'],
  },
  {
    key  : 'country',
    label: 'Countries',
    desc : 'Where in the world your viewers are watching from',
    icon : '🌍',
    colors: ['#f59e0b','#818cf8','#34d399','#f87171','#38bdf8','#c084fc','#2dd4bf'],
  },
  {
    key  : 'city',
    label: 'Cities',
    desc : 'City-level viewer location breakdown',
    icon : '📍',
    colors: ['#fb923c','#818cf8','#34d399','#f87171','#38bdf8','#c084fc','#2dd4bf'],
  },
];

const UTM_PANELS = [
  {
    key  : 'referrer',
    label: 'Referrer Domain',
    desc : 'Where visitors came from (referring website)',
    icon : '🔗',
    colors: ['#f59e0b','#818cf8','#34d399','#f87171','#38bdf8','#c084fc','#2dd4bf','#facc15','#fb923c'],
  },
  {
    key  : 'domain',
    label: 'Embed Domain',
    desc : 'Which of your pages the video is embedded on',
    icon : '🌐',
    colors: ['#818cf8','#34d399','#f59e0b','#f87171','#38bdf8','#c084fc','#2dd4bf','#facc15','#fb923c'],
  },
  {
    key  : 'utm_source',
    label: 'UTM Source',
    desc : 'Traffic source (e.g. google, newsletter, facebook)',
    icon : '◈',
    colors: ['#38bdf8','#818cf8','#34d399','#f59e0b','#f87171','#c084fc','#2dd4bf','#facc15','#fb923c'],
  },
  {
    key  : 'utm_medium',
    label: 'UTM Medium',
    desc : 'Marketing medium (e.g. email, cpc, social)',
    icon : '◈',
    colors: ['#34d399','#f59e0b','#818cf8','#f87171','#38bdf8','#c084fc','#2dd4bf','#facc15','#fb923c'],
  },
  {
    key  : 'utm_campaign',
    label: 'UTM Campaign',
    desc : 'Campaign name (e.g. spring-sale, launch-2026)',
    icon : '◈',
    colors: ['#c084fc','#34d399','#f59e0b','#818cf8','#f87171','#38bdf8','#2dd4bf','#facc15','#fb923c'],
  },
  {
    key  : 'utm_term',
    label: 'UTM Term',
    desc : 'Paid search keywords',
    icon : '◈',
    colors: ['#2dd4bf','#c084fc','#34d399','#f59e0b','#818cf8','#f87171','#38bdf8','#facc15','#fb923c'],
  },
  {
    key  : 'utm_content',
    label: 'UTM Content',
    desc : 'Ad variant or link identifier',
    icon : '◈',
    colors: ['#facc15','#2dd4bf','#c084fc','#34d399','#f59e0b','#818cf8','#f87171','#38bdf8','#fb923c'],
  },
];

// ─────────────────────────────────────────────────────────────────────────
// Single panel
// ─────────────────────────────────────────────────────────────────────────

function UtmPanel({ videoId, panel }) {
  const [status, setStatus] = useState('loading');
  const [data,   setData]   = useState([]);
  const [total,  setTotal]  = useState(0);

  useEffect(() => {
    if (!videoId) return;
    let cancelled = false;
    setStatus('loading');
    api.get(`/videos/${videoId}/analytics/breakdown`, { params: { by: panel.key } })
      .then(res => {
        if (cancelled) return;
        setData(res.data.data ?? []);
        setTotal(res.data.total ?? 0);
        setStatus('loaded');
      })
      .catch(() => { if (!cancelled) setStatus('error'); });
    return () => { cancelled = true; };
  }, [videoId, panel.key]);

  const colorMap = Object.fromEntries(
    data.map((d, i) => [d.label, panel.colors[i % panel.colors.length]])
  );

  // Only show panel if there's meaningful data (not all "(none)" or single "(direct)" entry)
  const hasMeaningfulData = data.some(d => d.label !== '(none)' && d.label !== '(direct)');

  return (
    <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl overflow-hidden">
      {/* Panel header */}
      <div className="flex items-start justify-between gap-2 px-5 pt-4 pb-3">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm">{panel.icon}</span>
            <h3 className="text-sm font-semibold text-gray-200">{panel.label}</h3>
          </div>
          <p className="text-xs text-gray-500">{panel.desc}</p>
        </div>
        {status === 'loaded' && total > 0 && (
          <span className="text-xs text-gray-500 flex-shrink-0 mt-0.5">
            {total.toLocaleString()} sessions
          </span>
        )}
      </div>

      {/* Content */}
      {status === 'loading' && <BreakdownSkeleton rows={3} />}

      {status === 'error' && (
        <div className="px-5 pb-4 text-xs text-gray-500">Could not load data.</div>
      )}

      {status === 'loaded' && (
        data.length === 0 || !hasMeaningfulData ? (
          <div className="px-5 pb-5 pt-1">
            <div className="flex items-center gap-2 py-3 border border-dashed border-gray-700/50 rounded-lg px-4">
              <span className="text-gray-600 text-sm">—</span>
              <span className="text-xs text-gray-600">
                {panel.key.startsWith('utm') ? 'No UTM parameters tracked yet' : 'No data yet'}
              </span>
            </div>
          </div>
        ) : (
          <div className="px-5 pb-4 pt-1">
            {data.map((d, i) => {
              const color    = panel.colors[i % panel.colors.length];
              const widthPct = data.length > 0 ? (d.count / Math.max(...data.map(x => x.count), 1)) * 100 : 0;
              return (
                <div key={d.label} className="mb-3">
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
  );
}

// ─────────────────────────────────────────────────────────────────────────
// TrafficSourcesSection — main export
// ─────────────────────────────────────────────────────────────────────────

export default function TrafficSourcesSection({ videoId }) {
  return (
    <div className="px-6 py-6 min-w-0">
      {/* Header */}
      <div className="mb-6">
        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mb-1">
          Audience
        </p>
        <h2 className="text-2xl font-bold text-gray-50">Traffic Sources</h2>
        <p className="text-xs text-gray-400 mt-1">
          Where your viewers are coming from, how they browse, and which campaigns drive the most engagement.
        </p>
      </div>

      {/* ── Audience: Device / Browser / Geography ────────────────────── */}
      <div className="mb-3">
        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mb-3">
          Viewer Profile
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {AUDIENCE_PANELS.map(panel => (
            <UtmPanel key={panel.key} videoId={videoId} panel={panel} />
          ))}
        </div>
      </div>

      <div className="h-px bg-gray-800/60 my-6" />

      {/* ── UTM parameters ────────────────────────────────────────────── */}
      <div>
        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mb-3">
          UTM Parameters
        </p>

        {/* UTM tip */}
        <div className="mb-4 flex items-start gap-3 bg-indigo-500/8 border border-indigo-500/20 rounded-xl px-4 py-3">
          <span className="text-indigo-400 mt-0.5 flex-shrink-0">◈</span>
          <div>
            <p className="text-xs font-medium text-indigo-300 mb-0.5">Add UTM parameters to your links</p>
            <p className="text-xs text-gray-400 leading-relaxed">
              Append <code className="bg-gray-800 px-1 py-0.5 rounded text-indigo-300 text-[11px]">?utm_source=email&amp;utm_medium=newsletter&amp;utm_campaign=launch</code> to the page
              URL where your video is embedded to see granular source breakdowns here.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {UTM_PANELS.map(panel => (
            <UtmPanel key={panel.key} videoId={videoId} panel={panel} />
          ))}
        </div>
      </div>
    </div>
  );
}
