'use strict';
import React, { useEffect, useState, useCallback } from 'react';
import AppLayout from '../components/AppLayout';
import { useToast } from '../contexts/ToastContext';
import api from '../lib/api';

/**
 * AlertsPage — /alerts
 *
 * Lets users toggle alert rules. Preferences are stored in user_preferences.alert_prefs
 * and will trigger in-app + browser push notifications when the conditions are met.
 *
 * The CTA Click rule has an inline setup guide (collapsed by default) explaining
 * how to add the companion tracking script to the subscriber's landing page.
 */

const ALERT_RULES = [
  {
    key:   'traffic_spike',
    title: 'Traffic Spike',
    desc:  'Notify me when a video gets 3× its usual plays in any 24-hour window.',
  },
  {
    key:   'sudden_dropoff',
    title: 'Sudden Drop-off',
    desc:  "Alert if a video's play rate drops below 30% for 3 days in a row.",
  },
  {
    key:   'viral_moment',
    title: 'Viral Moment',
    desc:  'Tell me when any video crosses 1,000 plays in under 24 hours.',
  },
  {
    key:   'new_domain_embed',
    title: 'New Domain Embed',
    desc:  'Notify me whenever a video is embedded on a new domain for the first time.',
  },
  {
    key:   'weekly_digest',
    title: 'Weekly Digest',
    desc:  "Send me a Monday-morning recap of last week's top performers.",
  },
  {
    key:   'begins_to_watch',
    title: 'Begins to Watch',
    desc:  'Notify me whenever a viewer presses play on any of my videos.',
  },
  {
    key:   'completes_video',
    title: 'Completes Video',
    desc:  'Alert me when a viewer watches all the way to the end of a video.',
  },
  {
    key:   'watches_90_pct',
    title: 'Watches 90%+',
    desc:  'Notify me when a viewer watches more than 90% of a video — a strong intent signal.',
  },
  {
    key:   'cta_click',
    title: 'CTA Click',
    desc:  'Alert me when a viewer clicks the call-to-action button on a video page.',
    hasSetup: true,
  },
];

const DEFAULTS = {
  traffic_spike   : false,
  sudden_dropoff  : false,
  viral_moment    : false,
  new_domain_embed: false,
  weekly_digest   : false,
  begins_to_watch : false,
  completes_video : false,
  watches_90_pct  : false,
  cta_click       : false,
};

// ── CTA tracking snippets ──────────────────────────────────────────────────

const CTA_BUTTON_SNIPPET = `<button data-vp-cta>Get Instant Access</button>`;

const CTA_SCRIPT_SNIPPET =
`<script>
(function(){
  var _vps = null;
  /* Auto-detect API URL from the VidaPulse embed iframe on this page */
  var _iframe = document.querySelector('iframe[src*="/embed/"]');
  var _api = _iframe
    ? _iframe.src.replace(/\\/embed\\/.*/, '/api/analytics/event')
    : 'https://app.vidapulse.in/api/analytics/event';

  /* Capture session ID posted by the iframe player */
  window.addEventListener('message', function(e) {
    if (e.data && e.data.type === 'vidapulse_session') {
      _vps = e.data;
    }
  });

  /* Fire cta_click whenever any [data-vp-cta] element is clicked */
  document.addEventListener('click', function(e) {
    var btn = e.target.closest('[data-vp-cta]');
    if (btn && _vps) {
      fetch(_api, {
        method : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body   : JSON.stringify({
          session_id : _vps.session_id,
          video_id   : _vps.video_id,
          event_type : 'cta_click'
        })
      }).catch(function() {});
    }
  });
})();
<\/script>`;

// ─────────────────────────────────────────────────────────────────────────

export default function AlertsPage() {
  const { showToast }    = useToast();
  const [prefs,   setPrefs]   = useState(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(null);
  const [ctaOpen, setCtaOpen] = useState(false);

  const load = useCallback(() => {
    api.get('/user/alert-prefs')
      .then(r => setPrefs({ ...DEFAULTS, ...(r.data.prefs ?? {}) }))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  async function toggle(key) {
    const next = !prefs[key];
    setPrefs(p => ({ ...p, [key]: next }));
    setSaving(key);
    try {
      await api.put('/user/alert-prefs', { prefs: { [key]: next } });
      showToast(`${ALERT_RULES.find(r => r.key === key)?.title} ${next ? 'enabled' : 'disabled'}`);
    } catch {
      setPrefs(p => ({ ...p, [key]: !next }));
      showToast('Could not save preference', 'error');
    } finally {
      setSaving(null);
    }
  }

  const activeCount = Object.values(prefs).filter(Boolean).length;

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="flex items-start justify-between mb-8 gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
              <BellIcon />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-50">Alerts</h1>
              <p className="text-sm text-gray-400 mt-0.5">
                Get notified when something important happens across your videos.
              </p>
            </div>
          </div>
          {activeCount > 0 && (
            <span className="flex-shrink-0 text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full font-medium">
              {activeCount} active
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-gray-500 text-sm py-16">
            <span className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            Loading preferences…
          </div>
        ) : (
          <>
            {/* Alert rules */}
            <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl overflow-hidden">
              <div className="px-5 py-3.5 border-b border-gray-700/40">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Alert rules</p>
              </div>

              <div className="divide-y divide-gray-700/40">
                {ALERT_RULES.map(rule => (
                  <React.Fragment key={rule.key}>

                    {/* ── Rule row ── */}
                    <div className="px-5 py-4 gap-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-200">{rule.title}</p>
                          <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{rule.desc}</p>
                          {/* Setup guide toggle — only for CTA Click */}
                          {rule.hasSetup && (
                            <button
                              onClick={() => setCtaOpen(o => !o)}
                              className="mt-2 flex items-center gap-1 text-xs text-amber-400/80 hover:text-amber-300 transition-colors"
                            >
                              <CodeIcon />
                              Setup guide
                              <ChevronIcon open={ctaOpen} />
                            </button>
                          )}
                        </div>
                        <button
                          onClick={() => toggle(rule.key)}
                          disabled={saving === rule.key}
                          className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full transition-colors duration-200
                            ${prefs[rule.key] ? 'bg-amber-500' : 'bg-gray-600'}
                            ${saving === rule.key ? 'opacity-60' : ''}`}
                          role="switch"
                          aria-checked={prefs[rule.key]}
                        >
                          <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform duration-200 mt-0.5
                            ${prefs[rule.key] ? 'translate-x-4' : 'translate-x-0.5'}`}
                          />
                        </button>
                      </div>
                    </div>

                    {/* ── CTA setup guide (collapsible) ── */}
                    {rule.hasSetup && ctaOpen && (
                      <div className="bg-gray-900/50 border-t border-gray-700/40 px-5 py-5">
                        <CtaSetupGuide />
                      </div>
                    )}

                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Delivery note */}
            <div className="mt-5 bg-gray-800/20 border border-gray-700/40 rounded-xl px-5 py-4 flex items-start gap-3">
              <BellNoteIcon />
              <div>
                <p className="text-xs font-semibold text-gray-300 mb-0.5">How you'll be notified</p>
                <p className="text-xs text-gray-500 leading-relaxed">
                  When a rule triggers you receive an <strong className="text-gray-400">in-app notification</strong> (bell icon, top right)
                  and a <strong className="text-gray-400">browser push alert</strong> — make sure browser notifications are allowed for this site.
                  Rules are evaluated in real time as analytics data comes in.
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// CtaSetupGuide — step-by-step instructions for wiring CTA click tracking
// ─────────────────────────────────────────────────────────────────────────

function CtaSetupGuide() {
  const [copiedBtn,  setCopiedBtn]  = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);

  function copy(text, setCopied) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  }

  return (
    <div className="space-y-5">

      {/* Context banner */}
      <div className="flex items-start gap-3 bg-amber-500/5 border border-amber-500/15 rounded-lg px-4 py-3">
        <InfoIcon />
        <div>
          <p className="text-xs font-semibold text-amber-300 mb-0.5">Two separate pieces of code — same landing page</p>
          <p className="text-xs text-gray-400 leading-relaxed">
            Your landing page already has the VidaPulse <strong className="text-gray-300">embed iframe</strong>. CTA tracking
            needs one additional attribute on your button and a small <strong className="text-gray-300">tracking script</strong> added
            as a separate <code className="text-amber-400/80 text-[11px]">&lt;script&gt;</code> tag — <em>not</em> inside the iframe code.
          </p>
        </div>
      </div>

      {/* Step 1 */}
      <div>
        <p className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-2 flex items-center gap-2">
          <StepBadge n="1" />
          Add <code className="font-mono text-amber-400 text-[11px] bg-amber-500/10 px-1.5 py-0.5 rounded">data-vp-cta</code> to your CTA button
        </p>
        <p className="text-xs text-gray-400 mb-2 leading-relaxed">
          Add the <code className="text-amber-400/80 text-[11px]">data-vp-cta</code> attribute to any button or link you want
          to track. No other changes to your existing button are needed.
        </p>
        <CodeBlock code={CTA_BUTTON_SNIPPET} copied={copiedBtn} onCopy={() => copy(CTA_BUTTON_SNIPPET, setCopiedBtn)} />
      </div>

      {/* Step 2 */}
      <div>
        <p className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-2 flex items-center gap-2">
          <StepBadge n="2" />
          Add the tracking script to your landing page
        </p>
        <p className="text-xs text-gray-400 mb-2 leading-relaxed">
          Paste this <code className="text-amber-400/80 text-[11px]">&lt;script&gt;</code> block anywhere on the same page
          as your embed iframe — just before the closing <code className="text-amber-400/80 text-[11px]">&lt;/body&gt;</code> tag is ideal.
          <strong className="text-gray-300"> Do not paste it inside the iframe embed code.</strong>
        </p>
        <CodeBlock code={CTA_SCRIPT_SNIPPET} copied={copiedScript} onCopy={() => copy(CTA_SCRIPT_SNIPPET, setCopiedScript)} tall />
      </div>

      {/* How it works note */}
      <div className="text-xs text-gray-500 leading-relaxed border-t border-gray-700/40 pt-4">
        <strong className="text-gray-400">How it works:</strong> The script listens for a message from the VidaPulse
        iframe (sent as soon as a viewer session is created). When your <code className="text-amber-400/70 text-[11px]">[data-vp-cta]</code> button
        is clicked, it sends the click event to VidaPulse, linked to that viewer's session. You'll see it appear
        in the <strong className="text-gray-400">Events log</strong> as a pink <code className="text-amber-400/70 text-[11px]">cta_click</code> badge.
      </div>

    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// CodeBlock — syntax-highlighted-ish code display with copy button
// ─────────────────────────────────────────────────────────────────────────

function CodeBlock({ code, copied, onCopy, tall }) {
  return (
    <div className="relative group">
      <pre className={`bg-gray-950 border border-gray-700/60 rounded-lg px-4 py-3 text-[11px] font-mono
                       text-gray-300 leading-relaxed whitespace-pre-wrap break-all overflow-x-auto
                       ${tall ? 'max-h-48 overflow-y-auto' : ''}`}>
        {code}
      </pre>
      <button
        onClick={onCopy}
        className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1
                   bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded text-[10px]
                   text-gray-400 hover:text-gray-200 transition-colors opacity-0 group-hover:opacity-100"
      >
        {copied ? (
          <><CheckIcon /> Copied</>
        ) : (
          <><CopyIcon /> Copy</>
        )}
      </button>
    </div>
  );
}

// ─── Small components ─────────────────────────────────────────────────────

function StepBadge({ n }) {
  return (
    <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-amber-500/20 text-amber-400 text-[9px] font-bold flex-shrink-0">
      {n}
    </span>
  );
}

function ChevronIcon({ open }) {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  );
}

function CodeIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6"/>
      <polyline points="8 6 2 12 8 18"/>
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
      className="text-amber-400/70 mt-0.5 flex-shrink-0">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="16" x2="12" y2="12"/>
      <line x1="12" y1="8" x2="12.01" y2="8"/>
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  );
}

function BellNoteIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
      className="text-amber-400/70 mt-0.5 flex-shrink-0">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  );
}
