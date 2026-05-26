'use strict';
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../lib/api';
import { useWebhookAlerts } from '../hooks/useWebhookAlerts';

/**
 * AdminWebhookLog — /admin/webhook-log
 *
 * Tabular view of every outbound contact webhook fire.
 * Left side  : sent_at · URL · params sent (contact info + event_type)
 * Right side : response_at · status · response_body / error
 */

export default function AdminWebhookLog() {
  const navigate = useNavigate();

  const [log,       setLog]       = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [fetchError,setFetchError]= useState('');
  const [filter,    setFilter]    = useState('');   // '' | 'sent' | 'failed'
  const [page,      setPage]      = useState(1);
  const [pagination,setPagination]= useState(null);

  // Live pause/queue status
  const webhookAlerts = useWebhookAlerts({ enabled: true });
  const [resolving,   setResolving]   = useState('');
  const [resolveMsg,  setResolveMsg]  = useState('');

  const load = useCallback(async (pg = 1, status = '') => {
    setLoading(true);
    setFetchError('');
    try {
      const params = new URLSearchParams({ page: pg, limit: 50 });
      if (status === 'sent' || status === 'failed') params.set('status', status);
      const { data } = await api.get(`/admin/contact-webhook-log?${params}`);
      setLog(data.log ?? []);
      setPagination(data.pagination ?? null);
    } catch (err) {
      if (err.response?.status === 403) {
        navigate('/dashboard');
      } else {
        setFetchError('Could not load webhook log. Check your connection.');
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => { load(1, filter); }, [load, filter]);

  function handleFilterChange(val) {
    setFilter(val);
    setPage(1);
  }

  function handlePage(newPage) {
    setPage(newPage);
    load(newPage, filter);
  }

  async function handleResend() {
    setResolving('resend');
    setResolveMsg('');
    try {
      const { data } = await api.post('/admin/contact-webhook/resend-queued');
      if (data.nowPaused) {
        setResolveMsg(`Resend failed again after ${data.sent} — webhook re-paused. Fix the endpoint first.`);
      } else {
        setResolveMsg(`✓ Resent ${data.sent} of ${data.total} queued webhooks successfully.`);
      }
      await webhookAlerts.refresh();
      load(1, filter);
    } catch {
      setResolveMsg('Resend request failed. Check your connection.');
    } finally {
      setResolving('');
    }
  }

  async function handleUnpause() {
    setResolving('unpause');
    setResolveMsg('');
    try {
      await api.post('/admin/contact-webhook/unpause');
      setResolveMsg('Unpaused. No queued events were resent — they remain in the queue.');
      await webhookAlerts.refresh();
    } catch {
      setResolveMsg('Failed to unpause.');
    } finally {
      setResolving('');
    }
  }

  return (
    <AdminShell title="Contact Webhook Log" onBack={() => navigate('/admin/webhook')}>
      <div className="max-w-7xl mx-auto flex flex-col gap-6">

        {/* ── Paused Alert Banner ───────────────────────────────────── */}
        {webhookAlerts.paused && (
          <div className="bg-red-500/8 border border-red-500/30 rounded-xl p-5">
            <div className="flex items-start gap-3">
              <span className="text-red-400 text-xl flex-shrink-0 mt-0.5">⚠</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-red-300">Contact webhook is paused</p>
                {webhookAlerts.pausedAt && (
                  <p className="text-xs text-red-400/70 mt-0.5">
                    Paused {new Date(webhookAlerts.pausedAt).toLocaleString('en-GB', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}
                  </p>
                )}
                {webhookAlerts.pausedReason && (
                  <p className="text-xs text-red-400/60 mt-1 font-mono break-all">{webhookAlerts.pausedReason}</p>
                )}
                {webhookAlerts.queuedCount > 0 && (
                  <p className="text-xs text-amber-300 mt-2">
                    <strong>{webhookAlerts.queuedCount}</strong> event{webhookAlerts.queuedCount !== 1 ? 's' : ''} queued — filter by "Queued" below to see them.
                  </p>
                )}
                <div className="flex items-center gap-2 mt-4 flex-wrap">
                  <button
                    onClick={handleResend}
                    disabled={!!resolving || webhookAlerts.queuedCount === 0}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50
                               text-xs font-semibold text-gray-900 rounded-lg transition-colors"
                  >
                    {resolving === 'resend'
                      ? 'Resending…'
                      : `✓ I've fixed the issue — resend ${webhookAlerts.queuedCount > 0 ? webhookAlerts.queuedCount : ''} queued`}
                  </button>
                  <button
                    onClick={handleUnpause}
                    disabled={!!resolving}
                    className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 disabled:opacity-50
                               text-xs font-medium text-gray-200 rounded-lg border border-gray-600 transition-colors"
                  >
                    {resolving === 'unpause' ? 'Unpausing…' : 'Unpause only'}
                  </button>
                  <Link to="/admin/webhook" className="text-xs text-gray-400 hover:text-gray-200 transition-colors">
                    ← Webhook settings
                  </Link>
                </div>
                {resolveMsg && (
                  <p className={`text-xs mt-3 ${resolveMsg.startsWith('✓') ? 'text-emerald-400' : 'text-red-400'}`}>
                    {resolveMsg}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            {[
              { val: '',       label: 'All'         },
              { val: 'sent',   label: '✓ Sent'      },
              { val: 'failed', label: '✕ Failed'    },
              { val: 'queued', label: '⏸ Queued', badge: webhookAlerts.queuedCount || null },
            ].map(({ val, label, badge }) => (
              <button
                key={val}
                onClick={() => handleFilterChange(val)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors
                  ${filter === val
                    ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                    : 'bg-gray-800 text-gray-400 border-gray-700 hover:text-gray-200 hover:border-gray-600'
                  }`}
              >
                {label}
                {badge != null && (
                  <span className="min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                    {badge}
                  </span>
                )}
              </button>
            ))}
          </div>
          <button
            onClick={() => load(page, filter)}
            className="p-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-400
                       hover:text-gray-200 hover:border-gray-600 transition-colors"
            title="Refresh"
          >
            <RefreshIcon spinning={loading} />
          </button>
        </div>

        {fetchError && (
          <div className="bg-red-500/5 border border-red-500/20 rounded-lg px-4 py-3">
            <p className="text-sm text-red-300">{fetchError}</p>
          </div>
        )}

        {/* Table */}
        {loading && log.length === 0 ? (
          <LoadingSkeleton />
        ) : log.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-2">
            <p className="text-sm text-gray-400">No webhook log entries found.</p>
            {filter && <p className="text-xs text-gray-500">Try clearing the filter.</p>}
          </div>
        ) : (
          <div className="rounded-xl border border-gray-700/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-800/70 border-b border-gray-700/50">
                  <tr>
                    <th className="text-left px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider w-[140px]">Sent At</th>
                    <th className="text-left px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Contact / Event</th>
                    <th className="text-left px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider hidden lg:table-cell">URL Sent To</th>
                    <th className="text-left px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider w-[90px]">Status</th>
                    <th className="text-left px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Response</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60 bg-gray-900">
                  {log.map(row => (
                    <LogRow key={row.id} row={row} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.total_pages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">
              Page {pagination.page} of {pagination.total_pages}
              {' '}·{' '}
              {pagination.total.toLocaleString()} total entries
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePage(page - 1)}
                disabled={!pagination.has_prev}
                className="px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-700 text-xs
                           text-gray-400 hover:text-gray-200 disabled:opacity-40 transition-colors"
              >
                ← Prev
              </button>
              <button
                onClick={() => handlePage(page + 1)}
                disabled={!pagination.has_next}
                className="px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-700 text-xs
                           text-gray-400 hover:text-gray-200 disabled:opacity-40 transition-colors"
              >
                Next →
              </button>
            </div>
          </div>
        )}

      </div>
    </AdminShell>
  );
}

// ─── Log Row ──────────────────────────────────────────────────────────────────

function LogRow({ row }) {
  const [expanded, setExpanded] = useState(false);
  const params = typeof row.params_sent === 'object' ? row.params_sent : {};

  const sentDate  = row.sent_at     ? new Date(row.sent_at)     : null;
  const respDate  = row.response_at ? new Date(row.response_at) : null;

  return (
    <>
      <tr
        className="hover:bg-gray-800/20 transition-colors cursor-pointer"
        onClick={() => setExpanded(e => !e)}
      >
        {/* Sent At */}
        <td className="px-4 py-3 align-top">
          <div className="text-xs text-gray-400 tabular-nums leading-tight">
            {sentDate ? (
              <>
                <div>{sentDate.toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'2-digit' })}</div>
                <div className="text-gray-600">{sentDate.toLocaleTimeString('en-GB')}</div>
              </>
            ) : '—'}
          </div>
        </td>

        {/* Contact / Event */}
        <td className="px-4 py-3 align-top">
          <div className="flex flex-col gap-0.5">
            <span className="text-gray-200 text-xs font-medium">
              {params.contact_name || row.user_name || '—'}
            </span>
            <span className="text-gray-500 text-xs truncate max-w-[200px]">
              {params.contact_email || row.user_email || '—'}
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <EventBadge eventKey={row.event_key} />
              {params.contact_plan && (
                <PlanBadge plan={params.contact_plan} />
              )}
            </div>
          </div>
        </td>

        {/* URL */}
        <td className="px-4 py-3 align-top hidden lg:table-cell">
          <span className="text-gray-500 text-xs font-mono truncate max-w-[220px] block" title={row.url_sent_to}>
            {row.url_sent_to ? shortenUrl(row.url_sent_to) : '—'}
          </span>
        </td>

        {/* Status */}
        <td className="px-4 py-3 align-top">
          <StatusBadge status={row.status} code={row.response_status} errorMsg={row.error_message} />
        </td>

        {/* Response */}
        <td className="px-4 py-3 align-top">
          <div className="flex flex-col gap-0.5">
            {respDate && (
              <span className="text-gray-600 text-[11px] tabular-nums">
                {respDate.toLocaleTimeString('en-GB')}
              </span>
            )}
            {row.error_message ? (
              <span className="text-red-400 text-xs truncate max-w-[200px]" title={row.error_message}>
                {row.error_message.slice(0, 80)}
              </span>
            ) : row.response_body ? (
              <span className="text-gray-500 text-xs truncate max-w-[200px]" title={row.response_body}>
                {row.response_body.slice(0, 60)}
              </span>
            ) : (
              <span className="text-gray-700 text-xs">—</span>
            )}
          </div>
        </td>
      </tr>

      {/* Expanded detail row */}
      {expanded && (
        <tr className="bg-gray-800/30">
          <td colSpan={5} className="px-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* Left: Request details */}
              <div className="bg-gray-900/60 border border-gray-700/50 rounded-lg p-4">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-3">
                  Request
                </p>
                <div className="space-y-2 text-xs">
                  <DetailRow label="Sent at"    value={sentDate ? sentDate.toLocaleString('en-GB') : '—'} />
                  <DetailRow label="URL"        value={row.url_sent_to || '—'} mono />
                  <DetailRow label="Event"      value={row.event_key} mono />
                  <div className="border-t border-gray-700/50 pt-2 mt-2">
                    <p className="text-gray-600 text-[10px] uppercase tracking-wider mb-1.5">Params sent</p>
                    {Object.entries(params).map(([k, v]) => (
                      <DetailRow key={k} label={k} value={String(v)} mono small />
                    ))}
                  </div>
                </div>
              </div>

              {/* Right: Response details */}
              <div className="bg-gray-900/60 border border-gray-700/50 rounded-lg p-4">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-3">
                  Response
                </p>
                <div className="space-y-2 text-xs">
                  <DetailRow label="Received at" value={respDate ? respDate.toLocaleString('en-GB') : '—'} />
                  <DetailRow label="HTTP status" value={row.response_status ? String(row.response_status) : '—'} mono />
                  <DetailRow label="Status"      value={row.status} />
                  {row.error_message && (
                    <div className="mt-2">
                      <p className="text-gray-600 text-[10px] uppercase tracking-wider mb-1">Error</p>
                      <p className="text-red-400 text-xs font-mono break-all leading-relaxed">
                        {row.error_message}
                      </p>
                    </div>
                  )}
                  {row.response_body && (
                    <div className="mt-2">
                      <p className="text-gray-600 text-[10px] uppercase tracking-wider mb-1">Body</p>
                      <p className="text-gray-400 text-xs font-mono break-all leading-relaxed max-h-24 overflow-y-auto">
                        {row.response_body}
                      </p>
                    </div>
                  )}
                  {!row.error_message && !row.response_body && (
                    <p className="text-gray-700 text-xs">No response body</p>
                  )}
                </div>
              </div>

            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status, code, errorMsg }) {
  const color = status === 'sent'
    ? 'text-emerald-400'
    : status === 'queued'
      ? 'text-amber-400'
      : 'text-red-400';
  const icon  = status === 'sent' ? '✓' : status === 'queued' ? '⏸' : '✕';

  // For failed entries with no HTTP code (status=0), show Timeout or Network error
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
        <span className="text-[10px] text-gray-600 tabular-nums">HTTP {code}</span>
      )}
      {networkLabel && (
        <span className="text-[10px] text-orange-400 font-medium">{networkLabel}</span>
      )}
    </div>
  );
}

function EventBadge({ eventKey }) {
  if (!eventKey) return null;
  const label = eventKey.replace(/_/g, ' ');
  const isAuth = eventKey === 'login' || eventKey === 'registration';
  return (
    <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-medium
      ${isAuth
        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
        : 'bg-gray-700/50 text-gray-400 border border-gray-700'
      }`}>
      {label}
    </span>
  );
}

function PlanBadge({ plan }) {
  const colors = {
    free   : 'bg-gray-700/60 text-gray-400 border-gray-600',
    starter: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    pro    : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  };
  return (
    <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium border ${colors[plan] ?? colors.free}`}>
      {plan}
    </span>
  );
}

function DetailRow({ label, value, mono = false, small = false }) {
  return (
    <div className="flex gap-2">
      <span className={`text-gray-600 flex-shrink-0 ${small ? 'text-[10px] w-28' : 'w-24'}`}>
        {label}
      </span>
      <span className={`text-gray-300 break-all ${mono ? 'font-mono text-[11px]' : ''}`}>
        {value}
      </span>
    </div>
  );
}

function shortenUrl(url) {
  try {
    const u = new URL(url);
    return u.hostname + (u.pathname.length > 20 ? u.pathname.slice(0, 20) + '…' : u.pathname);
  } catch {
    return url.slice(0, 40);
  }
}

// ─── Admin Shell ──────────────────────────────────────────────────────────────

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
              <BackIcon />
              Webhook Settings
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

// ─── Skeleton & Icons ─────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="rounded-xl border border-gray-700/50 overflow-hidden animate-pulse">
      <div className="bg-gray-800/70 h-10 border-b border-gray-700/50" />
      {[1,2,3,4,5].map(i => (
        <div key={i} className="px-4 py-4 border-b border-gray-800/60 flex gap-4">
          <div className="h-8 w-28 bg-gray-800/60 rounded" />
          <div className="h-8 flex-1 bg-gray-800/40 rounded" />
          <div className="h-8 w-20 bg-gray-800/60 rounded" />
          <div className="h-8 w-32 bg-gray-800/40 rounded" />
        </div>
      ))}
    </div>
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

function BackIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}
