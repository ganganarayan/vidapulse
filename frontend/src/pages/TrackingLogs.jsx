'use strict';
import React, { useEffect, useState, useCallback } from 'react';
import AppLayout        from '../components/AppLayout';
import FeatureGate      from '../components/FeatureGate';
import TrackingLogTable from '../components/TrackingLogTable';
import api from '../lib/api';

/**
 * TrackingLogs — /tracking-logs  (subscriber, Pro-gated)
 *
 * READ-ONLY, account-wide log of every Meta-pixel fire and every tracking-webhook
 * fire across ALL of the user's videos. Scoped server-side to the caller — a
 * subscriber only ever sees their own data. No actions; click a row for payload.
 */
export default function TrackingLogs() {
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
      const { data } = await api.get(`/tracking-logs?${params}`);
      setRows(data.log ?? []);
      setPagination(data.pagination ?? null);
    } catch {
      setError('Could not load the tracking log. Check your connection and try again.');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [page, sort, dir]);

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
    <AppLayout>
      <FeatureGate required="pro" feature="Tracking Logs">
        <div className="flex flex-col h-full">

          {/* Header */}
          <div className="border-b border-gray-800 px-6 py-4 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-4">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                <PulseIcon />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-50">Tracking Logs</h1>
                <p className="text-xs text-gray-400 mt-0.5">
                  Every Meta&nbsp;Pixel fire and every webhook fire from your tracked videos. Click a row for the full payload.
                </p>
              </div>
            </div>
            <button
              onClick={load}
              className="p-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-400
                         hover:text-gray-200 hover:border-gray-600 transition-colors"
              title="Refresh"
            >
              <RefreshIcon spinning={loading} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6">
            {error && (
              <div className="bg-red-500/5 border border-red-500/20 rounded-lg px-4 py-3 mb-4">
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            {loading && rows.length === 0 ? (
              <div className="flex items-center justify-center py-24 gap-2 text-gray-500 text-sm">
                <span className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                Loading tracking log…
              </div>
            ) : rows.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 gap-2 text-center">
                <p className="text-sm text-gray-300">No tracking activity yet.</p>
                <p className="text-xs text-gray-500 max-w-md">
                  Once you enable tracking on a video and viewers start watching, every pixel fire and
                  webhook fire will appear here.
                </p>
              </div>
            ) : (
              <>
                <TrackingLogTable
                  rows={rows}
                  sort={sort}
                  dir={dir}
                  onSort={handleSort}
                  showOwner={false}
                />

                {/* Pagination */}
                {pagination && pagination.total_pages > 1 && (
                  <div className="flex items-center justify-between mt-4">
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
        </div>
      </FeatureGate>
    </AppLayout>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────

function PulseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
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
