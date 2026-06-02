'use strict';
import React, { useEffect, useState, useCallback } from 'react';
import AppLayout from '../components/AppLayout';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import FeatureGate  from '../components/FeatureGate';

/**
 * CTATrackingPage — /cta-tracking
 *
 * Account-level CTA tracking links. Pro plan only.
 * Max 20 links per account. Deleting a link does NOT remove its events.
 */

const MAX_LINKS = 20;

export default function CTATrackingPage() {
  const { user }       = useAuth();
  const { showToast }  = useToast();
  const isPro          = user?.plan === 'pro' || user?.plan === 'admin_lifetime';
  const origin         = typeof window !== 'undefined' ? window.location.origin : '';

  const [links,       setLinks]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [formOpen,    setFormOpen]    = useState(false);
  const [form,        setForm]        = useState({ cta_name: '', page_name: '', destination_url: '' });
  const [formSaving,  setFormSaving]  = useState(false);
  const [formError,   setFormError]   = useState('');
  const [copiedId,    setCopiedId]    = useState(null);
  const [deletingId,  setDeletingId]  = useState(null);

  const load = useCallback(() => {
    if (!isPro) { setLoading(false); return; }
    setLoading(true);
    api.get('/cta-links')
      .then(r => setLinks(r.data.cta_links ?? []))
      .catch(() => setLinks([]))
      .finally(() => setLoading(false));
  }, [isPro]);

  useEffect(() => { load(); }, [load]);

  function copyLink(id) {
    navigator.clipboard
      .writeText(`${origin}/api/analytics/cta/link/${id}`)
      .then(() => { setCopiedId(id); setTimeout(() => setCopiedId(null), 2500); })
      .catch(() => {});
  }

  async function handleAdd(e) {
    e.preventDefault();
    setFormError('');
    if (!form.cta_name.trim())        { setFormError('Button name is required'); return; }
    if (!form.destination_url.trim()) { setFormError('Destination URL is required'); return; }
    if (!form.destination_url.match(/^https?:\/\/.+/)) {
      setFormError('Destination must start with https://');
      return;
    }
    setFormSaving(true);
    try {
      const r = await api.post('/cta-links', {
        cta_name        : form.cta_name.trim(),
        page_name       : form.page_name.trim() || null,
        destination_url : form.destination_url.trim(),
      });
      setLinks(prev => [...prev, r.data.cta_link]);
      setForm({ cta_name: '', page_name: '', destination_url: '' });
      setFormOpen(false);
    } catch (err) {
      setFormError(err.response?.data?.message ?? 'Failed to create tracking link');
    } finally {
      setFormSaving(false);
    }
  }

  async function handleDelete(id) {
    setDeletingId(id);
    try {
      await api.delete(`/cta-links/${id}`);
      setLinks(prev => prev.filter(l => l.id !== id));
    } catch {
      showToast('Could not delete link', 'error');
    } finally {
      setDeletingId(null);
    }
  }

  const atLimit = links.length >= MAX_LINKS;

  return (
    <AppLayout>
      <FeatureGate required="pro" feature="CTA Tracking">
      <div className="flex flex-col h-full">

        {/* Header */}
        <div className="border-b border-gray-800 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-9 h-9 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center flex-shrink-0">
              <CursorClickIcon />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-50">CTA Tracking</h1>
              <p className="text-xs text-gray-400 mt-0.5">
                Named tracking links for your CTA buttons — no code needed.
              </p>
            </div>
          </div>

          {isPro && (
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500 tabular-nums">
                {links.length} / {MAX_LINKS} links
              </span>
              <button
                onClick={() => { setFormOpen(o => !o); setFormError(''); }}
                disabled={atLimit && !formOpen}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg
                           transition-colors border
                           bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/20 text-amber-400
                           disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {formOpen ? '✕ Cancel' : '+ Add link'}
              </button>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">

            <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4">

              {/* How it works banner */}
              <div className="bg-amber-500/5 border border-amber-500/15 rounded-xl px-4 py-3 flex gap-3">
                <InfoIcon />
                <div className="text-xs text-gray-400 leading-relaxed">
                  <strong className="text-amber-300">No code required.</strong>{' '}
                  Use a tracking link as your button's URL. When clicked, the visitor is instantly
                  redirected to your destination — and the click is logged in your{' '}
                  <strong className="text-gray-300">Events log</strong> as a{' '}
                  <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-mono
                                   bg-pink-500/15 text-pink-300 border border-pink-500/25">cta click</span>{' '}
                  event.
                </div>
              </div>

              {/* Add link form */}
              {formOpen && (
                <form onSubmit={handleAdd}
                  className="bg-gray-800/40 border border-gray-700/50 rounded-xl px-5 py-4 space-y-3">
                  <p className="text-sm font-semibold text-gray-200">New tracking link</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-400 mb-1">
                        Button name <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={form.cta_name}
                        onChange={e => setForm(p => ({ ...p, cta_name: e.target.value }))}
                        placeholder='e.g. "Buy Now"'
                        autoComplete="off"
                        className="w-full bg-gray-900/60 border border-gray-700 rounded-lg px-3 py-2
                                   text-xs text-gray-200 placeholder-gray-600
                                   focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-400 mb-1">
                        Page name <span className="text-gray-400">(optional)</span>
                      </label>
                      <input
                        type="text"
                        value={form.page_name}
                        onChange={e => setForm(p => ({ ...p, page_name: e.target.value }))}
                        placeholder='e.g. "Sales Page"'
                        autoComplete="off"
                        className="w-full bg-gray-900/60 border border-gray-700 rounded-lg px-3 py-2
                                   text-xs text-gray-200 placeholder-gray-600
                                   focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-400 mb-1">
                      Destination URL <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="url"
                      value={form.destination_url}
                      onChange={e => setForm(p => ({ ...p, destination_url: e.target.value }))}
                      placeholder="https://your-checkout-page.com"
                      autoComplete="off"
                      className="w-full bg-gray-900/60 border border-gray-700 rounded-lg px-3 py-2
                                 text-xs text-gray-200 placeholder-gray-600
                                 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                    />
                  </div>
                  {formError && (
                    <p className="text-xs text-red-400">{formError}</p>
                  )}
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={formSaving}
                      className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400
                                 disabled:opacity-60 text-gray-900 text-xs font-semibold
                                 rounded-lg transition-colors"
                    >
                      {formSaving ? (
                        <>
                          <span className="w-3 h-3 border-2 border-gray-900 border-t-transparent
                                           rounded-full animate-spin" />
                          Saving…
                        </>
                      ) : 'Create tracking link'}
                    </button>
                  </div>
                </form>
              )}

              {/* Links list */}
              {loading ? (
                <div className="flex items-center gap-2 py-10 justify-center text-gray-500 text-sm">
                  <span className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                  Loading…
                </div>
              ) : links.length === 0 && !formOpen ? (
                <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl px-5 py-10 text-center">
                  <p className="text-sm text-gray-400 mb-2">No tracking links yet.</p>
                  <button
                    onClick={() => setFormOpen(true)}
                    className="text-xs text-amber-400 hover:text-amber-300 transition-colors"
                  >
                    + Create your first link
                  </button>
                </div>
              ) : links.length > 0 ? (
                <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl overflow-hidden">
                  <div className="divide-y divide-gray-700/40">
                    {links.map(link => {
                      const trackingUrl = `${origin}/api/analytics/cta/link/${link.id}`;
                      const isCopied    = copiedId === link.id;
                      const isDeleting  = deletingId === link.id;
                      return (
                        <div key={link.id} className="px-5 py-3.5 flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <p className="text-xs font-semibold text-gray-200">{link.cta_name}</p>
                              {link.page_name && (
                                <span className="text-[10px] px-1.5 py-0.5 bg-gray-700/60 text-gray-400
                                                 rounded-md border border-gray-600/50 flex-shrink-0">
                                  {link.page_name}
                                </span>
                              )}
                            </div>
                            <code className="text-[10px] text-amber-300/60 font-mono block truncate">
                              {trackingUrl}
                            </code>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <div className="text-center mr-2">
                              <p className="text-sm font-bold text-amber-400 leading-none">
                                {(link.clicks ?? 0).toLocaleString()}
                              </p>
                              <p className="text-[9px] text-gray-500 uppercase tracking-wider mt-1">clicks</p>
                            </div>
                            <button
                              onClick={() => copyLink(link.id)}
                              className="flex items-center gap-1 px-2.5 py-1.5 bg-gray-700 hover:bg-gray-600
                                         border border-gray-600 text-xs text-gray-200 rounded-lg transition-colors"
                            >
                              {isCopied ? <CheckSmIcon /> : <CopyIcon />}
                              {isCopied ? 'Copied' : 'Copy'}
                            </button>
                            <button
                              onClick={() => handleDelete(link.id)}
                              disabled={isDeleting}
                              className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10
                                         rounded-lg transition-colors disabled:opacity-40"
                              title="Delete link"
                            >
                              <TrashIcon />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Footer note */}
                  <div className="px-5 py-3 bg-gray-900/20 border-t border-gray-700/40">
                    <p className="text-[11px] text-gray-500 leading-relaxed">
                      Set each link as the <strong className="text-gray-400">href/URL</strong> of your button.
                      Clicks appear in your Events log as{' '}
                      <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-mono
                                       bg-pink-500/15 text-pink-300 border border-pink-500/25">cta click</span>{' '}
                      events with button name and page name — exportable as CSV.
                      Enable the <strong className="text-gray-400">CTA Click</strong> alert for real-time notifications.
                      <span className="ml-1 text-gray-400">
                        Deleting a link does not remove its past events from the Events log.
                      </span>
                    </p>
                  </div>
                </div>
              ) : null}

              {/* Limit warning */}
              {atLimit && (
                <div className="flex items-center gap-2 px-4 py-2.5 bg-red-500/10 border border-red-500/20
                                rounded-lg text-xs text-red-400">
                  <WarnIcon />
                  You've reached the {MAX_LINKS}-link limit. Delete an existing link to add a new one.
                </div>
              )}

            </div>
        </div>
      </div>
      </FeatureGate>
    </AppLayout>
  );
}

// ─── Icons ─────────────────────────────────────────────────────────────────

function CursorClickIcon({ large }) {
  const size = large ? 22 : 18;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-pink-400">
      <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2v-4M9 21H5a2 2 0 0 1-2-2v-4m0 0h18"/>
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400 flex-shrink-0 mt-0.5">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/>
      <line x1="12" y1="8" x2="12.01" y2="8"/>
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
    </svg>
  );
}

function CheckSmIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6l-1 14H6L5 6"/>
      <path d="M10 11v6"/><path d="M14 11v6"/>
      <path d="M9 6V4h6v2"/>
    </svg>
  );
}

function WarnIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  );
}
