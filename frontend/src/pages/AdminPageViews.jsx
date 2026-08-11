'use strict';
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';

/**
 * AdminPageViews — /admin/page-views
 *
 * Human-vs-bot page views on the landing page + KB, with UTM source /
 * campaign, top pages, and country breakdowns. Fed by the /api/pageview
 * beacon embedded in landing/index.html and every KB page.
 */

export default function AdminPageViews() {
  const navigate = useNavigate();
  const [days,    setDays]    = useState(30);
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback((d) => {
    setLoading(true);
    api.get(`/admin/page-views?days=${d}`)
      .then(r => setData(r.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(days); }, [load, days]);

  const t = data?.totals ?? {};

  return (
    <AdminShell title="Page Views" onBack={() => navigate('/admin/users')}>
      <div className="max-w-5xl mx-auto flex flex-col gap-6">

        {/* Header + window */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-lg font-bold text-gray-100">Traffic — Landing page &amp; KB</h2>
            <p className="text-sm text-gray-400 mt-0.5">
              Where real (human) visitors come from, and what they view.
            </p>
          </div>
          <div className="flex gap-1 bg-gray-800/60 border border-gray-700/50 rounded-lg p-1">
            {[7, 30, 90].map(d => (
              <button key={d} onClick={() => setDays(d)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  days === d ? 'bg-amber-500/15 text-amber-400' : 'text-gray-400 hover:text-gray-200'}`}>
                {d}d
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm text-gray-500">Loading…</div>
        ) : !data ? (
          <div className="py-12 text-center text-sm text-gray-400">Could not load page-view data.</div>
        ) : (
          <>
            {/* Totals */}
            <div className="grid grid-cols-3 gap-3">
              <Stat label="Human views"  value={(t.human_views ?? 0).toLocaleString()} accent="text-emerald-400" />
              <Stat label="Unique humans" value={(t.human_ips ?? 0).toLocaleString()}  accent="text-sky-400" />
              <Stat label="Bot views"    value={(t.bot_views ?? 0).toLocaleString()}   accent="text-gray-400" />
            </div>

            {(t.human_views ?? 0) === 0 && (
              <div className="px-4 py-3 bg-amber-500/8 border border-amber-500/20 rounded-lg text-xs text-amber-300/90">
                No human page views recorded yet in this window. Traffic will appear here once visitors
                (not just crawlers) hit the landing page or KB with the new beacon live.
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <BreakdownTable title="By UTM source"   rows={data.by_source}   keyName="utm_source"   />
              <BreakdownTable title="By campaign"      rows={data.by_campaign} keyName="utm_campaign" />
              <BreakdownTable title="Top pages"        rows={data.top_pages}   keyName="path"          mono />
              <BreakdownTable title="By country"       rows={data.by_country}  keyName="country_code" />
            </div>
          </>
        )}
      </div>
    </AdminShell>
  );
}

function Stat({ label, value, accent }) {
  return (
    <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-4">
      <p className="text-[10px] uppercase tracking-wider text-gray-500">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${accent}`}>{value}</p>
    </div>
  );
}

function BreakdownTable({ title, rows, keyName, mono }) {
  const total = (rows ?? []).reduce((s, r) => s + (r.views ?? 0), 0);
  return (
    <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl overflow-hidden">
      <div className="px-4 py-2.5 border-b border-gray-700/50">
        <h3 className="text-xs font-bold text-gray-200 uppercase tracking-wider">{title}</h3>
      </div>
      {(!rows || rows.length === 0) ? (
        <div className="px-4 py-6 text-center text-xs text-gray-500">No data yet.</div>
      ) : (
        <div className="divide-y divide-gray-700/30 max-h-72 overflow-y-auto">
          {rows.map((r, i) => (
            <div key={i} className="px-4 py-2 flex items-center justify-between gap-3">
              <span className={`text-xs text-gray-300 truncate ${mono ? 'font-mono text-[11px]' : ''}`} title={r[keyName]}>
                {r[keyName] || '—'}
              </span>
              <span className="text-xs font-bold text-amber-400 flex-shrink-0">
                {(r.views ?? 0).toLocaleString()}
                {total > 0 && (
                  <span className="ml-1.5 text-[10px] font-normal text-gray-500">
                    {Math.round((r.views / total) * 100)}%
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AdminShell({ title, children, onBack }) {
  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <header className="border-b border-gray-800 px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {onBack && (
            <button onClick={onBack}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-200 transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
              </svg>
              Admin
            </button>
          )}
          <h1 className="text-sm font-semibold text-gray-300">{title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-amber-500 select-none">{'▶︎'}</span>
          <span className="font-bold text-amber-500 tracking-tight text-sm">VidaPulse</span>
          <span className="ml-2 px-2 py-0.5 text-[10px] font-medium bg-emerald-500/10
                           text-emerald-300 border border-emerald-500/20 rounded-full">Admin</span>
        </div>
      </header>
      <div className="flex-1 px-4 sm:px-6 py-8">{children}</div>
    </div>
  );
}
