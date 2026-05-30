'use strict';
import React, { useEffect, useState } from 'react';
import AppLayout from '../components/AppLayout';
import api from '../lib/api';

/**
 * HelpPage — /help
 *
 * Renders the help documentation fetched from /api/help.
 * Each section is an accordion. A tutorial video appears at the top
 * if the admin has set a video URL.
 */
export default function HelpPage() {
  const [loading, setLoading] = useState(true);
  const [data,    setData]    = useState(null);

  useEffect(() => {
    api.get('/help')
      .then(r => setData(r.data))
      .catch(() => setData({ video_url: null, sections: [] }))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mb-1">
            Support
          </p>
          <h1 className="text-3xl font-bold text-gray-50 mb-1">Help & Support</h1>
          <p className="text-sm text-gray-400">
            Everything you need to get the most out of VidaPulse.
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Questions? Email us at{' '}
            <a href="mailto:support@vidapulse.io"
               className="text-amber-400 hover:text-amber-300 transition-colors">
              support@vidapulse.io
            </a>
          </p>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-gray-500 text-sm py-12">
            <span className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            Loading…
          </div>
        ) : (
          <>
            {/* Tutorial video */}
            {data?.video_url && (
              <div className="mb-8 rounded-xl overflow-hidden border border-gray-700/50 bg-gray-800/40"
                   style={{ aspectRatio: '16/9' }}>
                <iframe
                  src={data.video_url}
                  title="VidaPulse Tutorial"
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>
            )}

            {/* Accordion sections */}
            {(data?.sections ?? []).length > 0 ? (
              <div className="flex flex-col gap-2">
                {(data.sections).map((section, i) => (
                  <HelpSection key={i} title={section.title} content={section.content} defaultOpen={i === 0} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <p className="text-sm text-gray-400">Help content is being prepared. Check back soon.</p>
              </div>
            )}

            {/* Contact fallback */}
            <div className="mt-10 bg-amber-500/5 border border-amber-500/20 rounded-xl px-5 py-4">
              <p className="text-sm font-semibold text-amber-400 mb-1">Still need help?</p>
              <p className="text-xs text-gray-400 leading-relaxed">
                Email us at{' '}
                <a href="mailto:support@vidapulse.io"
                   className="text-amber-400 hover:text-amber-300 transition-colors font-medium">
                  support@vidapulse.io
                </a>
                {' '}— we're happy to walk you through anything.
              </p>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// HelpSection — single accordion item
// ─────────────────────────────────────────────────────────────────────────

function HelpSection({ title, content, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-800/70 transition-colors gap-3"
      >
        <span className="text-sm font-semibold text-gray-200">{title}</span>
        <ChevronIcon open={open} />
      </button>
      {open && (
        <div className="px-5 pb-5 border-t border-gray-700/40">
          <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line pt-4">
            {content}
          </p>
        </div>
      )}
    </div>
  );
}

function ChevronIcon({ open }) {
  return (
    <svg
      width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      className={`flex-shrink-0 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}
