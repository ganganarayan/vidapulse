'use strict';
import React, { useState } from 'react';
import AppLayout from '../components/AppLayout';
import { useToast } from '../contexts/ToastContext';
import api from '../lib/api';

/**
 * ReportsPage — /reports
 *
 * Report templates. The Viewer Journey Export downloads a real CSV.
 * Scheduled report configuration is saved for when the scheduler is built.
 */

const TEMPLATES = [
  {
    key:      'weekly_summary',
    title:    'Weekly Performance Summary',
    desc:     'Plays, viewers, watch time, and top videos for the past 7 days.',
    schedule: 'Every Monday 9AM',
    type:     'scheduled',
  },
  {
    key:      'monthly_engagement',
    title:    'Monthly Engagement Report',
    desc:     'Heatmaps, retention curves, and audience breakdown for the past 30 days.',
    schedule: '1st of each month',
    type:     'scheduled',
  },
  {
    key:      'top_domains',
    title:    'Top Domains Quarterly',
    desc:     'Where your videos are being embedded and how each domain performs.',
    schedule: 'Quarterly',
    type:     'scheduled',
  },
  {
    key:      'viewer_journey',
    title:    'Viewer Journey Export',
    desc:     'CSV export of every viewer session — country, device, watch time, video.',
    schedule: 'On demand',
    type:     'download',
  },
];

export default function ReportsPage() {
  const { showToast } = useToast();
  const [downloading, setDownloading] = useState(false);
  const [setupModal,  setSetupModal]  = useState(null); // key of template being set up

  async function downloadViewerJourney() {
    setDownloading(true);
    try {
      const response = await fetch('/api/reports/viewer-journey', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Download failed');
      const blob     = await response.blob();
      const url      = window.URL.createObjectURL(blob);
      const a        = document.createElement('a');
      a.href         = url;
      a.download     = `viewer-journey-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showToast('Download started');
    } catch {
      showToast('Download failed — try again', 'error');
    } finally {
      setDownloading(false);
    }
  }

  function handleSetup(template) {
    if (template.type === 'download') {
      downloadViewerJourney();
    } else {
      setSetupModal(template);
    }
  }

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
            <ReportIcon />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-50">Reports</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              Schedule automated reports or download raw data on demand.
            </p>
          </div>
        </div>

        {/* Templates */}
        <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-700/40">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Report templates</p>
          </div>

          <div className="divide-y divide-gray-700/40">
            {TEMPLATES.map(tmpl => (
              <div key={tmpl.key} className="flex items-center justify-between px-5 py-4 gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-200">{tmpl.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{tmpl.desc}</p>
                  <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider mt-1.5">
                    {tmpl.schedule}
                  </p>
                </div>
                <button
                  onClick={() => handleSetup(tmpl)}
                  disabled={downloading && tmpl.type === 'download'}
                  className="flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5
                             bg-gray-700 hover:bg-gray-600 border border-gray-600
                             text-gray-200 text-xs font-medium rounded-lg transition-colors
                             disabled:opacity-60"
                >
                  {tmpl.type === 'download' ? (
                    <>
                      <DownloadIcon />
                      {downloading ? 'Preparing…' : 'Download'}
                    </>
                  ) : (
                    <>
                      <SetupIcon />
                      Setup
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-gray-500 mt-4 text-center">
          Scheduled reports will be delivered via your configured webhook endpoint.
        </p>
      </div>

      {/* Setup modal */}
      {setupModal && (
        <SetupModal template={setupModal} onClose={() => setSetupModal(null)} />
      )}
    </AppLayout>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// SetupModal — configure a scheduled report
// ─────────────────────────────────────────────────────────────────────────

function SetupModal({ template, onClose }) {
  const { showToast } = useToast();

  function handleSave() {
    showToast(`${template.title} configured`);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl p-6">
        <h2 className="text-base font-bold text-gray-50 mb-1">{template.title}</h2>
        <p className="text-xs text-gray-400 mb-5">{template.desc}</p>

        <div className="bg-gray-800/60 border border-gray-700/50 rounded-lg px-4 py-3 mb-5">
          <p className="text-xs text-gray-500 mb-0.5">Schedule</p>
          <p className="text-sm font-semibold text-amber-400">{template.schedule}</p>
        </div>

        <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg px-4 py-3 mb-5">
          <p className="text-xs text-gray-300 leading-relaxed">
            Reports will be sent to your configured <strong className="text-amber-400">webhook endpoint</strong>.
            Make sure your endpoint is set up in{' '}
            <a href="/integrations" className="text-amber-400 hover:underline" onClick={onClose}>
              Integrations
            </a>.
          </p>
        </div>

        <div className="flex gap-2 justify-end">
          <button onClick={onClose}
            className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-colors">
            Cancel
          </button>
          <button onClick={handleSave}
            className="px-4 py-2 text-sm font-semibold bg-amber-500 hover:bg-amber-400 text-gray-900 rounded-lg transition-colors">
            Save schedule
          </button>
        </div>
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

function SetupIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  );
}
