'use strict';
import React, { useEffect, useState, useCallback } from 'react';
import AppLayout    from '../components/AppLayout';
import FeatureGate  from '../components/FeatureGate';
import { useToast } from '../contexts/ToastContext';
import api from '../lib/api';

/**
 * ReportsPage — /reports
 *
 * Fully customisable analytics reports:
 *  - Select metrics via checkboxes
 *  - Choose date range
 *  - Generate in background (status polling)
 *  - Download CSV when ready
 *
 * Raw data exports (generate→download state machine):
 *  - Viewer Journey Export (up to 10,000 session rows)
 *  - Events Log Export (up to 50,000 event rows)
 *
 * State machine per raw export:
 *   idle    → Generate active, Download inactive
 *   working → Generating… (both disabled)
 *   ready   → Generate disabled, Download active
 *   (after download) → back to idle
 */

// ── Available metrics — grouped by category ──────────────────────────────

const METRIC_GROUPS = [
  {
    label: 'Reach',
    color: 'text-violet-400',
    metrics: [
      { key: 'total_views',    label: 'Total Views',    desc: 'Every page load where the embed appeared' },
      { key: 'unique_views',   label: 'Unique Views',   desc: 'Distinct visitors (by cookie) per video' },
      { key: 'total_viewers',  label: 'Total Viewers',  desc: 'Sessions where play was pressed' },
      { key: 'unique_viewers', label: 'Unique Viewers', desc: 'Distinct people who pressed play' },
    ],
  },
  {
    label: 'Engagement',
    color: 'text-amber-400',
    metrics: [
      { key: 'avg_watch_pct',        label: 'Avg Watch %',          desc: 'Average percentage watched per playing session' },
      { key: 'avg_watch_seconds',    label: 'Avg Watch Time (sec)', desc: 'Average seconds watched per playing session' },
      { key: 'avg_watch_per_viewer', label: 'Avg Watch / Viewer',   desc: 'Average total watch seconds per unique viewer' },
      { key: 'completion_rate',      label: 'Completion Rate %',    desc: 'Share of plays that reached the end' },
      { key: 'completed_views',      label: 'Completed Views',      desc: 'Sessions that watched through to the very end' },
      { key: 'drop_off_rate',        label: 'Drop-off Rate %',      desc: 'Share of plays that did not reach the end' },
    ],
  },
  {
    label: 'Watch Time',
    color: 'text-emerald-400',
    metrics: [
      { key: 'total_watch_seconds', label: 'Total Watch Time (sec)', desc: 'Cumulative seconds watched across all sessions' },
      { key: 'total_watch_minutes', label: 'Total Watch Time (min)', desc: 'Cumulative minutes watched across all sessions' },
      { key: 'play_rate',           label: 'Play Rate %',            desc: 'Share of page loads that resulted in a play' },
    ],
  },
  {
    label: 'Behavior',
    color: 'text-sky-400',
    metrics: [
      { key: 'total_plays',  label: 'Total Plays',   desc: 'All play events including replays' },
      { key: 'replay_count', label: 'Replay Count',  desc: 'Times viewers hit play more than once on the same video' },
      { key: 'replay_rate',  label: 'Replay Rate %', desc: 'Replays as a percentage of total viewers who played' },
      { key: 'pause_count',  label: 'Pause Count',   desc: 'Total pause events across all sessions' },
      { key: 'seek_count',   label: 'Seek Count',    desc: 'Total scrub / seek events across all sessions' },
      { key: 'cta_clicks',   label: 'CTA Clicks',    desc: 'Total CTA link click events within the video player' },
    ],
  },
];

// Flat list for metric toggle logic and count display
const ALL_METRICS = METRIC_GROUPS.flatMap(g => g.metrics);

const DATE_RANGES = [
  { key: '7_days',  label: 'Last 7 days' },
  { key: '30_days', label: 'Last 30 days' },
  { key: '90_days', label: 'Last 90 days' },
  { key: 'all_time',label: 'All time' },
];

const DEFAULT_METRICS  = ['total_views', 'unique_viewers', 'avg_watch_pct', 'play_rate'];
const POLL_INTERVAL_MS = 3000;

// ── Status helpers ───────────────────────────────────────────────────────

const STATUS_META = {
  pending    : { label: 'Queued',      color: 'text-yellow-400',  bg: 'bg-yellow-500/10 border-yellow-500/20', spin: true  },
  processing : { label: 'Generating…', color: 'text-blue-400',    bg: 'bg-blue-500/10 border-blue-500/20',     spin: true  },
  completed  : { label: 'Ready',       color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', spin: false },
  failed     : { label: 'Failed',      color: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/20',       spin: false },
};

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

/**
 * Derive the UI state for a raw export button pair.
 * idle    — no pending report, show Generate
 * working — pending/processing report, show Generating…
 * ready   — completed and not yet downloaded, show Download
 */
function getExportState(latestReport, downloaded) {
  if (!latestReport || latestReport.status === 'failed' || downloaded) return 'idle';
  if (latestReport.status === 'pending' || latestReport.status === 'processing') return 'working';
  if (latestReport.status === 'completed') return 'ready';
  return 'idle';
}

// ─────────────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const { showToast } = useToast();

  // ── Builder state ────────────────────────────────────────────────────
  const [selectedMetrics, setSelectedMetrics] = useState(new Set(DEFAULT_METRICS));
  const [dateRange,       setDateRange]       = useState('30_days');
  const [reportTitle,     setReportTitle]     = useState('');
  const [generating,      setGenerating]      = useState(false);

  // ── Report list ───────────────────────────────────────────────────────
  const [reports,         setReports]         = useState([]);
  const [listLoading,     setListLoading]     = useState(true);

  // ── Raw export "downloaded" flags ─────────────────────────────────────
  // Set true after a successful download; reset false when a new export is queued.
  const [vjDownloaded, setVjDownloaded] = useState(false);
  const [evDownloaded, setEvDownloaded] = useState(false);

  // ── Load report list ─────────────────────────────────────────────────

  const loadList = useCallback(() => {
    api.get('/reports/list')
      .then(r => setReports(r.data.reports ?? []))
      .catch(() => {})
      .finally(() => setListLoading(false));
  }, []);

  useEffect(() => { loadList(); }, [loadList]);

  // ── Auto-poll while any report is pending/processing ──────────────────

  useEffect(() => {
    const hasActive = reports.some(r => r.status === 'pending' || r.status === 'processing');
    if (!hasActive) return;
    const id = setInterval(() => {
      api.get('/reports/list')
        .then(r => setReports(r.data.reports ?? []))
        .catch(() => {});
    }, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [reports]);

  // ── Derived: split reports by kind ────────────────────────────────────

  const customReports = reports.filter(r => r.kind === 'custom');

  const latestVj = reports
    .filter(r => r.kind === 'viewer_journey')
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0] ?? null;

  const latestEv = reports
    .filter(r => r.kind === 'events_log')
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0] ?? null;

  const vjState = getExportState(latestVj, vjDownloaded);
  const evState = getExportState(latestEv, evDownloaded);

  // ── Toggle metric checkbox ─────────────────────────────────────────────

  function toggleMetric(key) {
    setSelectedMetrics(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  // ── Generate custom report ─────────────────────────────────────────────

  async function generate() {
    if (selectedMetrics.size === 0) {
      showToast('Select at least one metric', 'error');
      return;
    }
    const title = reportTitle.trim() ||
      `${DATE_RANGES.find(d => d.key === dateRange)?.label} Report`;
    setGenerating(true);
    try {
      await api.post('/reports/generate', {
        title,
        metrics   : [...selectedMetrics],
        date_range: dateRange,
        kind      : 'custom',
      });
      showToast('Report queued — generating in the background');
      setReportTitle('');
      loadList();
    } catch (err) {
      showToast(err.response?.data?.error ?? 'Could not queue report', 'error');
    } finally {
      setGenerating(false);
    }
  }

  // ── Generate raw export ────────────────────────────────────────────────

  async function generateRawExport(kind) {
    // Reset the "downloaded" flag so the state machine starts fresh
    if (kind === 'viewer_journey') setVjDownloaded(false);
    else setEvDownloaded(false);
    try {
      await api.post('/reports/generate', { kind });
      showToast('Export queued — generating in the background');
      loadList();
    } catch (err) {
      showToast(err.response?.data?.error ?? 'Could not queue export', 'error');
    }
  }

  // ── Download a report (custom or raw export) ──────────────────────────

  async function downloadReport(id, onSuccess) {
    try {
      const response = await fetch(`/api/reports/download/${id}`, { credentials: 'include' });
      if (!response.ok) throw new Error('Download failed');
      const blob = await response.blob();
      const url  = window.URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      const cd   = response.headers.get('Content-Disposition') ?? '';
      const fn   = cd.match(/filename="?([^"]+)"?/)?.[1] ?? `report-${id.slice(0, 8)}.csv`;
      a.download = fn;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      onSuccess?.();
      showToast('Download started');
    } catch {
      showToast('Download failed', 'error');
    }
  }

  return (
    <AppLayout>
      <FeatureGate required="pro" feature="Reports">
      <div className="max-w-2xl mx-auto px-6 py-8 space-y-8">

        {/* ── Page header ─────────────────────────────────────────────── */}
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
            <ReportIcon />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-50">Reports</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              Build a custom analytics report or export raw data on demand.
            </p>
          </div>
        </div>

        {/* ── Report builder ──────────────────────────────────────────── */}
        <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl overflow-hidden">

          <div className="px-5 py-3.5 border-b border-gray-700/40">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Build a Report</p>
          </div>

          <div className="px-5 py-5 space-y-5">

            {/* Report title (optional) */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Report name <span className="text-gray-500 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={reportTitle}
                onChange={e => setReportTitle(e.target.value)}
                placeholder="e.g. April video performance"
                className="w-full bg-gray-900/60 border border-gray-700 rounded-lg px-3 py-2
                           text-sm text-gray-200 placeholder-gray-600
                           focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              />
            </div>

            {/* Date range */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-2">
                Date range
              </label>
              <div className="flex flex-wrap gap-2">
                {DATE_RANGES.map(dr => (
                  <button
                    key={dr.key}
                    onClick={() => setDateRange(dr.key)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      dateRange === dr.key
                        ? 'bg-amber-500 text-gray-900'
                        : 'bg-gray-700/60 text-gray-400 hover:text-gray-200 hover:bg-gray-700 border border-gray-600'
                    }`}
                  >
                    {dr.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Metric checkboxes — grouped by category */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-xs font-semibold text-gray-300">
                  Metrics to include
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedMetrics(new Set(ALL_METRICS.map(m => m.key)))}
                    className="text-[11px] text-amber-400 hover:text-amber-300 font-medium transition-colors"
                  >
                    Select all
                  </button>
                  <span className="text-gray-400 text-[11px]">·</span>
                  <button
                    onClick={() => setSelectedMetrics(new Set())}
                    className="text-[11px] text-gray-500 hover:text-gray-300 font-medium transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {METRIC_GROUPS.map(group => (
                  <div key={group.label}>
                    <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${group.color}`}>
                      {group.label}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {group.metrics.map(m => {
                        const checked = selectedMetrics.has(m.key);
                        return (
                          <button
                            key={m.key}
                            onClick={() => toggleMetric(m.key)}
                            className={`flex items-start gap-3 px-3.5 py-3 rounded-xl text-left transition-colors border ${
                              checked
                                ? 'bg-amber-500/10 border-amber-500/30'
                                : 'bg-gray-900/40 border-gray-700/50 hover:border-gray-600'
                            }`}
                          >
                            <span className={`mt-0.5 w-4 h-4 flex-shrink-0 rounded flex items-center justify-center border ${
                              checked
                                ? 'bg-amber-500 border-amber-500'
                                : 'bg-transparent border-gray-600'
                            }`}>
                              {checked && (
                                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                                  <path d="M2 5l2.5 2.5L8 3" stroke="#1a1a1a" strokeWidth="1.6"
                                    strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              )}
                            </span>
                            <span>
                              <span className={`block text-xs font-semibold ${checked ? 'text-amber-300' : 'text-gray-300'}`}>
                                {m.label}
                              </span>
                              <span className="block text-[11px] text-gray-500 mt-0.5 leading-snug">{m.desc}</span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Generate button */}
            <div className="flex items-center justify-between pt-1">
              <p className="text-xs text-gray-500">
                {selectedMetrics.size} metric{selectedMetrics.size !== 1 ? 's' : ''} selected
              </p>
              <button
                onClick={generate}
                disabled={generating || selectedMetrics.size === 0}
                className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400
                           disabled:opacity-60 text-gray-900 text-sm font-semibold
                           rounded-lg transition-colors"
              >
                {generating ? (
                  <>
                    <span className="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
                    Queuing…
                  </>
                ) : (
                  <>
                    <GenerateIcon />
                    Generate Report
                  </>
                )}
              </button>
            </div>

          </div>
        </div>

        {/* ── Generated custom reports list ─────────────────────────── */}
        {(listLoading || customReports.length > 0) && (
          <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-700/40 flex items-center justify-between">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Your Reports</p>
              {customReports.some(r => r.status === 'pending' || r.status === 'processing') && (
                <span className="flex items-center gap-1.5 text-[11px] text-blue-400">
                  <span className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                  Generating…
                </span>
              )}
            </div>

            {listLoading ? (
              <div className="px-5 py-6 flex items-center gap-2 text-gray-500 text-sm">
                <span className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                Loading reports…
              </div>
            ) : (
              <div className="divide-y divide-gray-700/40">
                {customReports.map(report => {
                  const meta = STATUS_META[report.status] ?? STATUS_META.failed;
                  const rangeLabel = DATE_RANGES.find(d => d.key === report.date_range)?.label ?? report.date_range;
                  return (
                    <div key={report.id} className="flex items-center justify-between px-5 py-4 gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-200 truncate">{report.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {rangeLabel}
                          {report.row_count != null && ` · ${report.row_count} video${report.row_count !== 1 ? 's' : ''}`}
                          {' · '}{fmtDate(report.created_at)}
                        </p>
                        {report.status === 'failed' && report.error_message && (
                          <p className="text-xs text-red-400 mt-0.5 font-mono">{report.error_message}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full border ${meta.bg} ${meta.color}`}>
                          {meta.spin && (
                            <span className={`w-2.5 h-2.5 border-2 border-t-transparent rounded-full animate-spin ${meta.color.replace('text-', 'border-')}`} />
                          )}
                          {meta.label}
                        </span>

                        {report.status === 'completed' && (
                          <button
                            onClick={() => downloadReport(report.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 hover:bg-gray-600
                                       border border-gray-600 text-gray-200 text-xs font-medium
                                       rounded-lg transition-colors"
                          >
                            <DownloadIcon />
                            Download
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Raw data exports (generate→download state machine) ──────── */}
        <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-700/40">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Raw Data Exports</p>
          </div>

          <div className="divide-y divide-gray-700/40">

            {/* Viewer Journey */}
            <RawExportRow
              label="Viewer Journey"
              desc="Every viewer session — watch time, device, country, completion, UTMs."
              rowLimit="up to 10,000 rows"
              state={vjState}
              latestReport={latestVj}
              onGenerate={() => generateRawExport('viewer_journey')}
              onDownload={() => downloadReport(latestVj?.id, () => setVjDownloaded(true))}
            />

            {/* Events Log */}
            <RawExportRow
              label="Events Log"
              desc="Every play, pause, seek, CTA click, and completion event — timestamped to the second."
              rowLimit="up to 50,000 rows"
              state={evState}
              latestReport={latestEv}
              onGenerate={() => generateRawExport('events_log')}
              onDownload={() => downloadReport(latestEv?.id, () => setEvDownloaded(true))}
            />

          </div>
        </div>

      </div>
      </FeatureGate>
    </AppLayout>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// RawExportRow — generate→download state machine per raw export type
//
//   state = 'idle'    → Generate active, no Download
//   state = 'working' → Generating… (both disabled)
//   state = 'ready'   → Generate inactive/dimmed, Download active
// ─────────────────────────────────────────────────────────────────────────

function RawExportRow({ label, desc, rowLimit, state, latestReport, onGenerate, onDownload }) {
  const rowCount = latestReport?.row_count;

  return (
    <div className="flex items-center justify-between px-5 py-4 gap-4">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-200">{label}</p>
        <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{desc}</p>
        <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider mt-1.5">
          On demand · {rowCount != null && state === 'ready' ? `${rowCount.toLocaleString()} rows` : rowLimit}
        </p>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Generate button — active in idle, disabled in working/ready */}
        <button
          onClick={onGenerate}
          disabled={state === 'working' || state === 'ready'}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium
                      transition-colors border
                      ${state === 'idle'
                        ? 'bg-gray-700 hover:bg-gray-600 border-gray-600 text-gray-200'
                        : 'bg-gray-800/40 border-gray-700/40 text-gray-500 cursor-not-allowed'
                      }`}
        >
          {state === 'working' ? (
            <>
              <span className="w-3 h-3 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
              Generating…
            </>
          ) : (
            <>
              <GenerateIcon />
              Generate
            </>
          )}
        </button>

        {/* Download button — active only in ready state */}
        <button
          onClick={onDownload}
          disabled={state !== 'ready'}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium
                      transition-colors border
                      ${state === 'ready'
                        ? 'bg-emerald-500/15 hover:bg-emerald-500/25 border-emerald-500/30 text-emerald-300'
                        : 'bg-gray-800/40 border-gray-700/40 text-gray-400 cursor-not-allowed'
                      }`}
        >
          <DownloadIcon />
          Download
        </button>
      </div>
    </div>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────

function ReportIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10 9 9 9 8 9"/>
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  );
}

function GenerateIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10"/>
      <polyline points="1 20 1 14 7 14"/>
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
    </svg>
  );
}
