'use strict';
import React, { useEffect, useState, useCallback } from 'react';
import AppLayout from '../components/AppLayout';
import { useToast } from '../contexts/ToastContext';
import api from '../lib/api';

/**
 * AdminHelpPage — /admin/help
 *
 * Admin editor for the Help & Support page content.
 * Allows editing:
 *   - Tutorial video URL (embedded iframe)
 *   - Documentation sections (title + content)
 * Saved to the site_help table via PUT /api/help.
 */
export default function AdminHelpPage() {
  const { showToast } = useToast();
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [sections, setSections] = useState([]);

  const load = useCallback(() => {
    api.get('/help')
      .then(r => {
        setVideoUrl(r.data.video_url ?? '');
        setSections(r.data.sections ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  async function save() {
    setSaving(true);
    try {
      await api.put('/help', { video_url: videoUrl.trim() || null, sections });
      showToast('Help content saved');
    } catch (err) {
      showToast(err.response?.data?.message ?? 'Save failed', 'error');
    } finally {
      setSaving(false);
    }
  }

  function updateSection(i, field, value) {
    setSections(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: value } : s));
  }

  function addSection() {
    setSections(prev => [...prev, { title: '', content: '' }]);
  }

  function removeSection(i) {
    if (!window.confirm('Remove this section?')) return;
    setSections(prev => prev.filter((_, idx) => idx !== i));
  }

  function moveSection(i, dir) {
    setSections(prev => {
      const arr    = [...prev];
      const target = i + dir;
      if (target < 0 || target >= arr.length) return arr;
      [arr[i], arr[target]] = [arr[target], arr[i]];
      return arr;
    });
  }

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="mb-8">
          <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mb-1">
            Admin
          </p>
          <h1 className="text-3xl font-bold text-gray-50 mb-1">Edit Help Content</h1>
          <p className="text-sm text-gray-400">
            Manage the documentation your users see on the Help & Support page.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-gray-500 text-sm py-12">
            <span className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            Loading…
          </div>
        ) : (
          <div className="flex flex-col gap-6">

            {/* ── Tutorial video URL ─────────────────────────── */}
            <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-5">
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Tutorial Video URL
                <span className="text-gray-500 font-normal ml-1.5">(YouTube embed, Vimeo, or any iframe-compatible URL)</span>
              </label>
              <input
                type="url"
                value={videoUrl}
                onChange={e => setVideoUrl(e.target.value)}
                placeholder="https://www.youtube.com/embed/VIDEO_ID"
                className="w-full bg-gray-900/60 border border-gray-700 rounded-lg px-3 py-2.5
                           text-sm text-gray-200 placeholder-gray-600
                           focus:outline-none focus:ring-2 focus:ring-amber-500/60 focus:border-amber-500/60"
              />
              <p className="text-xs text-gray-500 mt-1.5">
                Use the embed URL format. For YouTube: https://www.youtube.com/embed/VIDEO_ID&nbsp;·&nbsp;Leave blank to hide the video section.
              </p>

              {/* Live preview */}
              {videoUrl.trim() && (
                <div className="mt-3 rounded-lg overflow-hidden border border-gray-700/50 bg-gray-900/40"
                     style={{ aspectRatio: '16/9' }}>
                  <iframe
                    src={videoUrl.trim()}
                    title="Preview"
                    allow="autoplay; fullscreen"
                    allowFullScreen
                    className="w-full h-full"
                  />
                </div>
              )}
            </div>

            {/* ── Documentation sections ─────────────────────── */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-gray-300">
                  Documentation Sections
                  <span className="ml-2 text-xs font-normal text-gray-500">({sections.length})</span>
                </h2>
                <button
                  onClick={addSection}
                  className="text-xs px-3 py-1.5 bg-gray-700 hover:bg-gray-600 border border-gray-600
                             text-gray-300 rounded-lg transition-colors flex items-center gap-1"
                >
                  <span className="text-base leading-none">+</span> Add Section
                </button>
              </div>

              <div className="flex flex-col gap-3">
                {sections.map((section, i) => (
                  <div key={i} className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-4">

                    {/* Section header controls */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-[11px] text-gray-400 font-mono w-5 text-center select-none">
                        {i + 1}
                      </span>
                      <input
                        type="text"
                        value={section.title}
                        onChange={e => updateSection(i, 'title', e.target.value)}
                        placeholder="Section title"
                        className="flex-1 bg-gray-900/60 border border-gray-700 rounded-lg px-3 py-2
                                   text-sm font-semibold text-gray-200 placeholder-gray-600
                                   focus:outline-none focus:ring-2 focus:ring-amber-500/60 focus:border-amber-500/60"
                      />
                      <div className="flex gap-1 flex-shrink-0">
                        <button
                          onClick={() => moveSection(i, -1)}
                          disabled={i === 0}
                          className="p-1.5 text-gray-500 hover:text-gray-300 disabled:opacity-25 rounded hover:bg-gray-700 transition-colors"
                          title="Move up"
                        >
                          <ArrowUpIcon />
                        </button>
                        <button
                          onClick={() => moveSection(i, 1)}
                          disabled={i === sections.length - 1}
                          className="p-1.5 text-gray-500 hover:text-gray-300 disabled:opacity-25 rounded hover:bg-gray-700 transition-colors"
                          title="Move down"
                        >
                          <ArrowDownIcon />
                        </button>
                        <button
                          onClick={() => removeSection(i)}
                          className="p-1.5 text-gray-500 hover:text-red-400 rounded hover:bg-red-500/10 transition-colors"
                          title="Remove section"
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    </div>

                    {/* Content */}
                    <textarea
                      value={section.content}
                      onChange={e => updateSection(i, 'content', e.target.value)}
                      placeholder="Section content — supports line breaks for lists and paragraphs."
                      rows={5}
                      className="w-full bg-gray-900/60 border border-gray-700 rounded-lg px-3 py-2.5
                                 text-sm text-gray-300 placeholder-gray-600 resize-y leading-relaxed
                                 focus:outline-none focus:ring-2 focus:ring-amber-500/60 focus:border-amber-500/60"
                    />
                  </div>
                ))}

                {sections.length === 0 && (
                  <div className="text-center py-12 bg-gray-800/20 border border-dashed border-gray-700 rounded-xl">
                    <p className="text-sm text-gray-500">
                      No sections yet.&nbsp;&nbsp;Click <span className="text-gray-400 font-medium">+ Add Section</span> to get started.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* ── Save button ────────────────────────────────── */}
            <div className="flex items-center gap-3 pt-2 border-t border-gray-800">
              <button
                onClick={save}
                disabled={saving}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-60
                           text-gray-900 text-sm font-semibold rounded-lg transition-colors"
              >
                {saving ? 'Saving…' : 'Save Help Content'}
              </button>
              <p className="text-xs text-gray-500">Changes go live immediately for all users.</p>
            </div>

          </div>
        )}
      </div>
    </AppLayout>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────────────────

function ArrowUpIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="18 15 12 9 6 15" />
    </svg>
  );
}

function ArrowDownIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}
