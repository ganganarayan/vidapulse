'use strict';
import React, { useEffect, useState, useCallback } from 'react';
import AppLayout from '../components/AppLayout';
import { useToast } from '../contexts/ToastContext';
import api from '../lib/api';

/**
 * AlertsPage — /alerts
 *
 * Lets users toggle alert rules. Preferences are stored in user_preferences.alert_prefs
 * and will trigger webhook notifications when the corresponding conditions are met.
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
];

const DEFAULTS = {
  traffic_spike: false, sudden_dropoff: false, viral_moment: false,
  new_domain_embed: false, weekly_digest: false,
};

export default function AlertsPage() {
  const { showToast } = useToast();
  const [prefs,   setPrefs]   = useState(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(null); // key currently being saved

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
      setPrefs(p => ({ ...p, [key]: !next })); // revert
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
                Get notified when something important happens — a traffic spike, a sudden drop-off, or a new embed.
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
                  <div key={rule.key} className="flex items-center justify-between px-5 py-4 gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-200">{rule.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{rule.desc}</p>
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
                      <span
                        className={`inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform duration-200 mt-0.5
                          ${prefs[rule.key] ? 'translate-x-4' : 'translate-x-0.5'}`}
                      />
                    </button>
                  </div>
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

// ─── Icons ────────────────────────────────────────────────────────────────

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
