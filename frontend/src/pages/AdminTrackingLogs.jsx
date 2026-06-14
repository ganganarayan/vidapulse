'use strict';
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import TrackingLogTable from '../components/TrackingLogTable';

/**
 * AdminTrackingLogs — /admin/tracking-logs
 *
 * All-users VIEWER-plane fire log: every Meta-pixel fire + every tracking-webhook
 * fire across every subscriber, with the owning user shown. READ-ONLY — kept
 * separate from the platform Contact Webhook Log (different plane / visibility).
 */
export default function AdminTrackingLogs() {
  const navigate = useNavigate();

  const [rows,       setRows]       = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');

  const [page, setPage] = useState(1);
  const [sort, setSort] = useState('date');
  const [dir,  setDir]  = useState('desc');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page, limit: 50, sort, dir });
      const { data } = await api.get(`/admin/tracking-logs?${params}`);
      setRows(data.log ?? []);
      setPagination(data.pagination ?? null);
    } catch (err) {
      if (err.response?.status === 403) {
        navigate('/dashboard');
      } else {
        setError('Could not load the tracking log. Check your connection.');
        setRows([]);
      }
    } finally {
      setLoading(false);
    }
  }, [page, sort, dir, navigate]);

  useEffect(() => { load(); }, [load]);

  function handleSort(col) {
    if (col === sort) {
      setDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSort(col);
      setDir('asc');
    }
    setPage(1);
  }

  return (
    <AdminShell title="Tracking Logs — All Users" onBack={() => navigate('/admin/users')}>
      <div className="max-w-7xl mx-auto flex flex-col gap-6">

        {/* Controls */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <p className="text-xs text-gray-400 max-w-2xl leading-relaxed">
            Viewer-plane activity for every subscriber — each Meta&nbsp;Pixel fire and webhook fire across all
            tracked videos. Read-only and separate from the platform Contact Webhook Log. Click a column to sort.
          </p>
          <button
            onClick={load}
            className="p-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-400
                       hover:text-gray-200 hover:border-gray-600 transition-colors"
            title="Refresh"
          >
            <RefreshIcon spinning={loading} />
          </button>
        </div>

        {error && (
          <div className="bg-red-500/5 border border-red-500/20 rounded-lg px-4 py-3">
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {loading && rows.length === 0 ? (
          <div className="flex items-center justify-center py-24 gap-2 text-gray-500 text-sm">
            <span className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            Loading tracking log…
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-2">
            <p className="text-sm text-gray-300">No tracking activity recorded yet.</p>
            <p className="text-xs text-gray-500">Pixel and webhook fires appear here once subscribers enable tracking.</p>
          </div>
        ) : (
          <>
            <TrackingLogTable
              rows={rows}
              sort={sort}
              dir={dir}
              onSort={handleSort}
              showOwner={true}
            />

            {pagination && pagination.total_pages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">
                  Page {pagination.page} of {pagination.total_pages} · {pagination.total.toLocaleString()} total fires
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={!pagination.has_prev}
                    className="px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-700 text-xs
                               text-gray-400 hover:text-gray-200 disabled:opacity-40 transition-colors"
                  >
                    ← Prev
                  </button>
                  <button
                    onClick={() => setPage(p => p + 1)}
                    disabled={!pagination.has_next}
                    className="px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-700 text-xs
                               text-gray-400 hover:text-gray-200 disabled:opacity-40 transition-colors"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </>
        )}

      </div>
    </AdminShell>
  );
}

// ─── Admin Shell (matches AdminWebhookLog) ──────────────────────────────────

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

function RefreshIcon({ spinning }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      className={spinning ? 'animate-spin' : ''}>
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
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
