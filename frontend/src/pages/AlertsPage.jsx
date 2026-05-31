'use strict';
import React, { useEffect, useState, useCallback } from 'react';
import AppLayout   from '../components/AppLayout';
import FeatureGate from '../components/FeatureGate';
import { useToast } from '../contexts/ToastContext';
import { useAuth }  from '../contexts/AuthContext';
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
    key:      'cta_click',
    title:    'CTA Click',
    desc:     'Alert me when a viewer clicks the call-to-action button on a video page.',
    hasSetup: true,
    proOnly:  true,
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

// (CTA tracking uses redirect links — no code snippets needed)

// ─────────────────────────────────────────────────────────────────────────

export default function AlertsPage() {
  const { showToast }    = useToast();
  const { user }         = useAuth();
  const isPro            = user?.plan === 'pro' || user?.plan === 'admin_lifetime';
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
      <FeatureGate required="pro" feature="Alerts">
      <div className="flex-1 overflow-y-auto">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

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
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-gray-200">{rule.title}</p>
                            {rule.proOnly && !isPro && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold
                                               bg-amber-500/15 text-amber-400 border border-amber-500/25
                                               rounded-full uppercase tracking-wide">
                                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                  strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                                </svg>
                                Pro
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{rule.desc}</p>
                          {/* Setup guide toggle — only for CTA Click, only for Pro users */}
                          {rule.hasSetup && isPro && (
                            <button
                              onClick={() => setCtaOpen(o => !o)}
                              className="mt-2 flex items-center gap-1 text-xs text-amber-400/80 hover:text-amber-300 transition-colors"
                            >
                              <CodeIcon />
                              Setup guide
                              <ChevronIcon open={ctaOpen} />
                            </button>
                          )}
                          {rule.proOnly && !isPro && (
                            <a
                              href="/upgrade"
                              className="mt-1.5 inline-flex items-center text-xs text-amber-400/70 hover:text-amber-300 transition-colors"
                            >
                              Upgrade to Pro to enable →
                            </a>
                          )}
                        </div>
                        {rule.proOnly && !isPro ? (
                          /* Non-Pro: dimmed locked indicator */
                          <div
                            className="relative inline-flex h-5 w-9 flex-shrink-0 rounded-full bg-gray-700 opacity-40 cursor-not-allowed"
                            title="Upgrade to Pro to enable"
                          >
                            <span className="inline-block h-4 w-4 rounded-full bg-white shadow mt-0.5 translate-x-0.5" />
                          </div>
                        ) : (
                          /* Normal toggle */
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
                        )}
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
      </div>
      </FeatureGate>
    </AppLayout>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// CtaSetupGuide — tracking link approach (no code required)
// ─────────────────────────────────────────────────────────────────────────

function CtaSetupGuide() {
  return (
    <div className="space-y-4">

      {/* What is a tracking link */}
      <div className="flex items-start gap-3 bg-amber-500/5 border border-amber-500/15 rounded-lg px-4 py-3">
        <InfoIcon />
        <div>
          <p className="text-xs font-semibold text-amber-300 mb-0.5">No code required — just change a URL</p>
          <p className="text-xs text-gray-400 leading-relaxed">
            Instead of linking your CTA button directly to your destination page,
            you use a <strong className="text-gray-300">VidaPulse tracking link</strong> as the button URL.
            VidaPulse records the click and instantly redirects your visitor.
            Works in every page builder, funnel tool, and plain HTML — no JavaScript, no code.
          </p>
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <StepBadge n="1" />
          <div>
            <p className="text-xs font-semibold text-gray-300">Go to Analytics → CTA Tracking</p>
            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
              Click <strong className="text-gray-400">CTA Tracking</strong> in the left sidebar
              (under the Analytics section).
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <StepBadge n="2" />
          <div>
            <p className="text-xs font-semibold text-gray-300">Click "+ Add link" and fill in the details</p>
            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
              Give your link a <strong className="text-gray-400">button name</strong> (e.g. "Buy Now"),
              an optional <strong className="text-gray-400">page name</strong> (e.g. "Sales Page"),
              and the <strong className="text-gray-400">destination URL</strong> where visitors land.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <StepBadge n="3" />
          <div>
            <p className="text-xs font-semibold text-gray-300">Copy the tracking link</p>
            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
              Click <strong className="text-gray-400">Copy</strong> next to the link.
              VidaPulse generates a unique redirect URL for each button.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <StepBadge n="4" />
          <div>
            <p className="text-xs font-semibold text-gray-300">Set the tracking link as your CTA button's URL</p>
            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
              Replace your button's current link/href with the tracking link.
              Your visitors won't notice — they land exactly where they would before.
            </p>
          </div>
        </div>
      </div>

      {/* Result note */}
      <div className="text-xs text-gray-500 leading-relaxed border-t border-gray-700/40 pt-3">
        Every click appears in your <strong className="text-gray-400">Events log</strong> as a
        pink <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-mono bg-pink-500/15 text-pink-300 border border-pink-500/25">cta click</span> badge.
        Enable this alert to get notified each time it fires.
        You can have up to 20 tracking links per account — deleting a link does not remove its past events.
      </div>

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
