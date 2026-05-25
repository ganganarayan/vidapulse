'use strict';
import React, { useEffect, useState, useCallback } from 'react';
import AppLayout from '../components/AppLayout';
import api from '../lib/api';

/**
 * EventsPage — /events
 *
 * Real-time log of every analytics event fired across all of the user's videos.
 * Data comes from /api/user/events.
 */

const EVENT_STYLES = {
  play            : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25',
  replay          : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25',
  ended           : 'bg-teal-500/15 text-teal-300 border border-teal-500/25',
  pause           : 'bg-amber-500/15 text-amber-300 border border-amber-500/25',
  seek            : 'bg-orange-500/15 text-orange-300 border border-orange-500/25',
  mute            : 'bg-purple-500/15 text-purple-300 border border-purple-500/25',
  unmute          : 'bg-purple-500/15 text-purple-300 border border-purple-500/25',
  speed_change    : 'bg-blue-500/15 text-blue-300 border border-blue-500/25',
  fullscreen_enter: 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/25',
  fullscreen_exit : 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/25',
  buffer_start    : 'bg-yellow-500/15 text-yellow-300 border border-yellow-500/25',
  buffer_end      : 'bg-yellow-500/15 text-yellow-300 border border-yellow-500/25',
  player_error    : 'bg-red-500/15 text-red-300 border border-red-500/25',
  player_load     : 'bg-gray-600/40 text-gray-400 border border-gray-600/40',
  player_unload   : 'bg-gray-600/40 text-gray-400 border border-gray-600/40',
  video_loaded    : 'bg-gray-600/40 text-gray-400 border border-gray-600/40',
  session_heartbeat: 'bg-gray-700/40 text-gray-500 border border-gray-700/40',
  quality_change  : 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/25',
  pip_enter       : 'bg-violet-500/15 text-violet-300 border border-violet-500/25',
  pip_exit        : 'bg-violet-500/15 text-violet-300 border border-violet-500/25',
  cta_click       : 'bg-pink-500/15 text-pink-300 border border-pink-500/25',
};

function EventBadge({ type }) {
  const cls = EVENT_STYLES[type] ?? 'bg-gray-600/40 text-gray-400 border border-gray-600/40';
  const label = type?.replace(/_/g, ' ') ?? type;
  return (
    <span className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-medium font-mono ${cls}`}>
      {label}
    </span>
  );
}

function fmtTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60)  return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60)  return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h}h ago`;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function fmtAbsTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

function shortSession(uuid) {
  if (!uuid) return '—';
  return '#' + uuid.replace(/-/g, '').slice(0, 8).toUpperCase();
}

function downloadEventsCSV(events) {
  const HEADERS = ['occurred_at','event_type','video_title','session_id','video_position'];
  const esc = v => {
    if (v === null || v === undefined) return '';
    const s = String(v);
    return (s.includes(',') || s.includes('"') || s.includes('\n'))
      ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [
    HEADERS.join(','),
    ...events.map(e => HEADERS.map(h => esc(e[h])).join(',')),
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `events-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function EventsPage() {
  const [events,  setEvents]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState('');

  const load = useCallback(() => {
    setLoading(true);
    api.get('/user/events?limit=200')
      .then(r => setEvents(r.data.events ?? []))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = filter
    ? events.filter(e =>
        e.event_type?.includes(filter) ||
        e.video_title?.toLowerCase().includes(filter.toLowerCase())
      )
    : events;

  return (
    <AppLayout>
      <div className="flex flex-col h-full">

        {/* Header */}
        <div className="border-b border-gray-800 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
              <CalendarIcon />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-50">Events</h1>
              <p className="text-xs text-gray-400 mt-0.5">
                Real-time stream of every play, pause, completion, and progress event from your videos.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={filter}
              onChange={e => setFilter(e.target.value)}
              placeholder="Filter by event or video…"
              className="bg-gray-800 border border-gray-700 text-gray-200 placeholder-gray-500
                         rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2
                         focus:ring-amber-500/50 w-48"
            />
            {filtered.length > 0 && (
              <button
                onClick={() => downloadEventsCSV(filtered)}
                className="p-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-400
                           hover:text-gray-200 hover:border-gray-600 transition-colors"
                title="Download CSV"
              >
                <DownloadIcon />
              </button>
            )}
            <button
              onClick={load}
              className="p-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-400
                         hover:text-gray-200 hover:border-gray-600 transition-colors"
              title="Refresh"
            >
              <RefreshIcon spinning={loading} />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto">
          {loading && events.length === 0 ? (
            <div className="flex items-center justify-center py-24 gap-2 text-gray-500 text-sm">
              <span className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
              Loading events…
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-2">
              <p className="text-sm text-gray-400">No events found.</p>
              {filter && <p className="text-xs text-gray-500">Try clearing the filter.</p>}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-900 z-10 border-b border-gray-800">
                <tr>
                  <th className="text-left px-6 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="text-left px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Video</th>
                  <th className="text-left px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider hidden md:table-cell">Session</th>
                  <th className="text-right px-6 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {filtered.map((ev, i) => (
                  <tr key={ev.id ?? i} className="hover:bg-gray-800/30 transition-colors">
                    <td className="px-6 py-3">
                      <EventBadge type={ev.event_type} />
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-gray-200 truncate max-w-[220px] block" title={ev.video_title}>
                        {ev.video_title ?? '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-gray-500 font-mono text-xs">
                        {shortSession(ev.session_id)}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <span
                        className="text-gray-400 text-xs tabular-nums"
                        title={fmtAbsTime(ev.occurred_at)}
                      >
                        {fmtTime(ev.occurred_at)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer count */}
        {!loading && filtered.length > 0 && (
          <div className="border-t border-gray-800 px-6 py-2 flex-shrink-0">
            <p className="text-xs text-gray-500">
              Showing {filtered.length.toLocaleString()} event{filtered.length !== 1 ? 's' : ''}
              {filter ? ' (filtered)' : ' · most recent first'}
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────

function DownloadIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  );
}

function RefreshIcon({ spinning }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      className={spinning ? 'animate-spin' : ''}>
      <polyline points="23 4 23 10 17 10"/>
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
    </svg>
  );
}
