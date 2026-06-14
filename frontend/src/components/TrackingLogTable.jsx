'use strict';
import React, { useState } from 'react';

/**
 * TrackingLogTable — shared READ-ONLY table for the viewer-plane fire log.
 *
 * One row per fire: every Meta-pixel fire (kind='pixel') and every
 * tracking-webhook fire (kind='webhook'). No action buttons — click a row to
 * expand its full payload + response.
 *
 * Used by:
 *   • TrackingLogs       (subscriber, own rows)         — showOwner=false
 *   • AdminTrackingLogs  (admin, all users' rows)       — showOwner=true
 *
 * Sorting is server-side: clicking a sortable heading calls onSort(key).
 * The parent toggles asc/desc and re-fetches. Sortable keys must match the
 * backend whitelist: date | video | event | type | status.
 *
 * Props:
 *   rows      — array of log rows from the API
 *   sort      — active sort key
 *   dir       — 'asc' | 'desc'
 *   onSort    — (key) => void
 *   showOwner — include the Owner column (admin view)
 */
export default function TrackingLogTable({ rows = [], sort, dir, onSort, showOwner = false }) {
  const colCount = showOwner ? 7 : 6;

  return (
    <div className="rounded-xl border border-gray-700/50 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-800/70 border-b border-gray-700/50">
            <tr>
              <SortHeader label="Date / Time" col="date"   sort={sort} dir={dir} onSort={onSort} className="w-[140px]" />
              <SortHeader label="Video"       col="video"  sort={sort} dir={dir} onSort={onSort} />
              <SortHeader label="Event"       col="event"  sort={sort} dir={dir} onSort={onSort} />
              <SortHeader label="Type"        col="type"   sort={sort} dir={dir} onSort={onSort} className="w-[90px]" />
              <SortHeader label="Destination" col="dest"   sort={sort} dir={dir} onSort={onSort} className="hidden lg:table-cell" />
              <SortHeader label="Status"      col="status" sort={sort} dir={dir} onSort={onSort} className="w-[110px]" />
              {showOwner && (
                <SortHeader label="Owner"     col="owner"  sort={sort} dir={dir} onSort={onSort} />
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/60 bg-gray-900">
            {rows.map(row => (
              <LogRow key={row.id} row={row} showOwner={showOwner} colCount={colCount} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Sortable header cell ───────────────────────────────────────────────────

function SortHeader({ label, col, sort, dir, onSort, className = '' }) {
  const active = sort === col;
  return (
    <th
      onClick={() => onSort?.(col)}
      className={`text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wider cursor-pointer select-none
                  transition-colors ${active ? 'text-amber-300' : 'text-gray-400 hover:text-gray-200'} ${className}`}
      title={`Sort by ${label}`}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <SortArrow active={active} dir={dir} />
      </span>
    </th>
  );
}

function SortArrow({ active, dir }) {
  if (!active) return <span className="text-gray-600 text-[10px]">↕</span>;
  return <span className="text-amber-300 text-[10px]">{dir === 'asc' ? '▲' : '▼'}</span>;
}

// ─── Log row ────────────────────────────────────────────────────────────────

function LogRow({ row, showOwner, colCount }) {
  const [expanded, setExpanded] = useState(false);
  const when = row.created_at ? new Date(row.created_at) : null;
  const payload = row.payload && typeof row.payload === 'object' ? row.payload : null;

  // Destination: pixel → Meta event; webhook → endpoint URL
  const destination = row.kind === 'pixel'
    ? (row.meta_event || '—')
    : (row.url ? shortenUrl(row.url) : '—');

  return (
    <>
      <tr
        className="hover:bg-gray-800/30 transition-colors cursor-pointer"
        onClick={() => setExpanded(e => !e)}
      >
        {/* Date / Time */}
        <td className="px-4 py-3 align-top">
          <div className="text-xs text-gray-300 tabular-nums leading-tight">
            {when ? (
              <>
                <div>{when.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}</div>
                <div className="text-gray-500">{when.toLocaleTimeString('en-GB')}</div>
              </>
            ) : '—'}
          </div>
        </td>

        {/* Video */}
        <td className="px-4 py-3 align-top">
          <span className="text-gray-200 text-sm truncate max-w-[220px] block" title={row.video_title || row.video_id || ''}>
            {row.video_title || (row.video_id ? '(untitled)' : '—')}
          </span>
        </td>

        {/* Event */}
        <td className="px-4 py-3 align-top">
          <EventBadge eventKey={row.event_key} />
        </td>

        {/* Type */}
        <td className="px-4 py-3 align-top">
          <KindBadge kind={row.kind} />
        </td>

        {/* Destination */}
        <td className="px-4 py-3 align-top hidden lg:table-cell">
          <span className="text-gray-400 text-xs font-mono truncate max-w-[240px] block" title={row.kind === 'webhook' ? row.url : row.meta_event}>
            {destination}
          </span>
        </td>

        {/* Status */}
        <td className="px-4 py-3 align-top">
          <StatusBadge status={row.status} code={row.response_status} errorMsg={row.error_message} />
        </td>

        {/* Owner (admin only) */}
        {showOwner && (
          <td className="px-4 py-3 align-top">
            <span className="text-gray-400 text-xs truncate max-w-[180px] block" title={row.owner_email || ''}>
              {row.owner_email || '—'}
            </span>
          </td>
        )}
      </tr>

      {/* Expanded payload */}
      {expanded && (
        <tr className="bg-gray-800/30">
          <td colSpan={colCount} className="px-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* Details */}
              <div className="bg-gray-900/60 border border-gray-700/50 rounded-lg p-4">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Fire details</p>
                <div className="space-y-2 text-xs">
                  <DetailRow label="Time"   value={when ? when.toLocaleString('en-GB') : '—'} />
                  <DetailRow label="Type"   value={row.kind} mono />
                  <DetailRow label="Event"  value={row.event_key} mono />
                  {row.kind === 'pixel' ? (
                    <DetailRow label="Meta event" value={row.meta_event || '—'} mono />
                  ) : (
                    <DetailRow label="URL" value={row.url || '—'} mono />
                  )}
                  <DetailRow label="Status" value={row.status} />
                  {row.response_status != null && row.response_status > 0 && (
                    <DetailRow label="HTTP" value={String(row.response_status)} mono />
                  )}
                  {row.video_title && <DetailRow label="Video" value={row.video_title} />}
                  {showOwner && row.owner_email && <DetailRow label="Owner" value={row.owner_email} mono />}
                  {row.error_message && (
                    <div className="mt-2">
                      <p className="text-gray-400 text-[10px] uppercase tracking-wider mb-1">Error</p>
                      <p className="text-red-400 text-xs font-mono break-all leading-relaxed">{row.error_message}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Payload */}
              <div className="bg-gray-900/60 border border-gray-700/50 rounded-lg p-4">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">
                  {row.kind === 'pixel' ? 'Pixel payload' : 'Webhook payload'}
                </p>
                {payload ? (
                  <pre className="text-[11px] text-gray-300 font-mono leading-relaxed whitespace-pre-wrap break-all max-h-64 overflow-y-auto">
                    {JSON.stringify(payload, null, 2)}
                  </pre>
                ) : (
                  <p className="text-gray-600 text-xs">No payload recorded.</p>
                )}
              </div>

            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ─── Badges & helpers ───────────────────────────────────────────────────────

function KindBadge({ kind }) {
  const isPixel = kind === 'pixel';
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border
      ${isPixel
        ? 'bg-violet-500/15 text-violet-300 border-violet-500/25'
        : 'bg-cyan-500/15 text-cyan-300 border-cyan-500/25'}`}>
      {isPixel ? '◆ Pixel' : '➜ Webhook'}
    </span>
  );
}

function StatusBadge({ status, code, errorMsg }) {
  const ok = status === 'fired' || status === 'sent';
  const color = ok ? 'text-emerald-400' : 'text-red-400';
  const icon  = ok ? '✓' : '✕';

  const isNetworkFail = status === 'failed' && (!code || code === 0);
  const networkLabel  = isNetworkFail
    ? (errorMsg?.toLowerCase().includes('timeout') ? 'Timeout' : 'Network error')
    : null;

  return (
    <div className="flex flex-col gap-0.5">
      <span className={`inline-flex items-center gap-1 text-[11px] font-medium ${color}`}>
        {icon} {status}
      </span>
      {code != null && code > 0 && (
        <span className="text-[10px] text-gray-400 tabular-nums">HTTP {code}</span>
      )}
      {networkLabel && (
        <span className="text-[10px] text-orange-400 font-medium">{networkLabel}</span>
      )}
    </div>
  );
}

function EventBadge({ eventKey }) {
  if (!eventKey) return <span className="text-gray-600 text-xs">—</span>;
  return (
    <span className="inline-block px-1.5 py-0.5 rounded text-[11px] font-mono font-medium
                     bg-gray-700/50 text-gray-300 border border-gray-700">
      {String(eventKey).replace(/_/g, ' ')}
    </span>
  );
}

function DetailRow({ label, value, mono = false }) {
  return (
    <div className="flex gap-2">
      <span className="text-gray-400 flex-shrink-0 w-24">{label}</span>
      <span className={`text-gray-200 break-all ${mono ? 'font-mono text-[11px]' : ''}`}>{value}</span>
    </div>
  );
}

function shortenUrl(url) {
  try {
    const u = new URL(url);
    return u.hostname + (u.pathname.length > 20 ? u.pathname.slice(0, 20) + '…' : u.pathname);
  } catch {
    return String(url).slice(0, 40);
  }
}
