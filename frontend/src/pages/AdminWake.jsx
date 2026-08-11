'use strict';
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';

/**
 * AdminWake — /admin/wake
 *
 * External wake trigger + log. Hit GET /api/wake from a bookmark, phone
 * shortcut, or uptime monitor to wake a sleeping Railway instance. Every hit
 * is logged; this page shows the wake URL to bookmark and the recent log.
 */

export default function AdminWake() {
  const navigate = useNavigate();
  const origin   = typeof window !== 'undefined' ? window.location.origin : '';
  const wakeUrl  = `${origin}/api/wake?source=bookmark`;

  const [events,   setEvents]   = useState([]);
  const [total,    setTotal]    = useState(0);
  const [lastWake, setLastWake] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [copied,   setCopied]   = useState(false);
  const [pinging,  setPinging]  = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api.get('/admin/wake-log')
      .then(r => {
        setEvents(r.data.events ?? []);
        setTotal(r.data.total ?? 0);
        setLastWake(r.data.last_wake_at ?? null);
      })
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  function copyUrl() {
    navigator.clipboard.writeText(wakeUrl)
      .then(() => { setCopied(true); setTimeout(() => setCopied(false), 2500); })
      .catch(() => {});
  }

  async function triggerNow() {
    setPinging(true);
    try {
      await api.get('/wake?source=admin-panel');
      setTimeout(load, 400); // give the insert a moment
    } catch { /* ignore */ }
    finally { setPinging(false); }
  }

  return (
    <AdminShell title="Wake" onBack={() => navigate('/admin/users')}>
      <div className="max-w-4xl mx-auto flex flex-col gap-6">

        {/* Intro */}
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-5">
          <h2 className="text-lg font-bold text-gray-100">Wake VidaPulse</h2>
          <p className="text-sm text-gray-400 mt-1 leading-relaxed">
            Opening the URL below wakes a sleeping instance — the request itself does the waking.
            Bookmark it, add it to a phone shortcut, or point an uptime monitor at it. Every hit is logged here.
          </p>
        </div>

        {/* Wake URL + actions */}
        <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-5">
          <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">Wake URL</p>
          <div className="flex items-center gap-2 flex-wrap">
            <code className="flex-1 min-w-0 text-xs text-amber-300/80 font-mono bg-gray-900/50
                             border border-gray-700/60 rounded-lg px-3 py-2.5 break-all">
              {wakeUrl}
            </code>
            <button
              onClick={copyUrl}
              className="px-3 py-2.5 bg-gray-700 hover:bg-gray-600 border border-gray-600
                         text-xs text-gray-200 rounded-lg transition-colors"
            >
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button
              onClick={triggerNow}
              disabled={pinging}
              className="px-3 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:bg-amber-500/40
                         text-gray-900 text-xs font-semibold rounded-lg transition-colors"
            >
              {pinging ? 'Waking…' : 'Trigger wake now'}
            </button>
          </div>
          <p className="text-[11px] text-gray-500 mt-2">
            Tip: add <code className="text-gray-400">&amp;source=phone</code> or
            <code className="text-gray-400"> &amp;note=morning</code> to label where a wake came from.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-4">
            <p className="text-[10px] uppercase tracking-wider text-gray-500">Total wakes logged</p>
            <p className="text-2xl font-bold text-gray-100 mt-1">{total.toLocaleString()}</p>
          </div>
          <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-4">
            <p className="text-[10px] uppercase tracking-wider text-gray-500">Last wake</p>
            <p className="text-sm font-semibold text-gray-200 mt-1.5">
              {lastWake ? new Date(lastWake).toLocaleString() : '—'}
            </p>
          </div>
        </div>

        {/* Log */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-200">Wake Log</h3>
            <button onClick={load} className="text-xs text-amber-400 hover:text-amber-300">Refresh</button>
          </div>
          {loading ? (
            <div className="py-10 text-center text-sm text-gray-500">Loading…</div>
          ) : events.length === 0 ? (
            <div className="py-10 text-center bg-gray-800/30 border border-gray-700/50 rounded-xl">
              <p className="text-sm text-gray-400">No wake pings yet.</p>
              <p className="text-xs text-gray-500 mt-1">Open the wake URL above to record the first one.</p>
            </div>
          ) : (
            <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl overflow-hidden overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-gray-500 border-b border-gray-700/50">
                    <th className="px-3 py-2.5 font-semibold">#</th>
                    <th className="px-3 py-2.5 font-semibold">Time</th>
                    <th className="px-3 py-2.5 font-semibold">Source</th>
                    <th className="px-3 py-2.5 font-semibold">IP</th>
                    <th className="px-3 py-2.5 font-semibold">User Agent</th>
                    <th className="px-3 py-2.5 font-semibold">Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/30">
                  {events.map((e, i) => (
                    <tr key={e.id} className="text-gray-300 hover:bg-gray-800/40">
                      <td className="px-3 py-2 text-gray-500">{events.length - i}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-gray-400">
                        {new Date(e.created_at).toLocaleString()}
                      </td>
                      <td className="px-3 py-2 font-medium text-gray-200">{e.source || '—'}</td>
                      <td className="px-3 py-2 font-mono text-[10px] text-gray-400">{e.ip || '—'}</td>
                      <td className="px-3 py-2 text-gray-500 max-w-xs truncate" title={e.user_agent || ''}>
                        {e.user_agent || '—'}
                      </td>
                      <td className="px-3 py-2 text-gray-400">{e.note || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  );
}

function AdminShell({ title, children, onBack }) {
  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <header className="border-b border-gray-800 px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-200 transition-colors"
            >
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
                           text-emerald-300 border border-emerald-500/20 rounded-full">
            Admin
          </span>
        </div>
      </header>
      <div className="flex-1 px-4 sm:px-6 py-8">
        {children}
      </div>
    </div>
  );
}
