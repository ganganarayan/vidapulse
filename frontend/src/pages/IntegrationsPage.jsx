'use strict';
import React, { useEffect, useState, useCallback } from 'react';
import AppLayout from '../components/AppLayout';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import api from '../lib/api';

/**
 * IntegrationsPage — /integrations
 *
 * Shows the webhook integration (for admin/pro) and lists
 * upcoming integrations (Zapier, Make, API key, etc.)
 */
export default function IntegrationsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.plan === 'admin_lifetime';

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="mb-8">
          <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mb-1">
            Account
          </p>
          <h1 className="text-3xl font-bold text-gray-50 mb-1">Integrations</h1>
          <p className="text-sm text-gray-400">
            Connect VidaPulse to your tools and automate your workflow.
          </p>
        </div>

        {/* ── Webhook (admin only) ───────────────────────────────────────── */}
        <WebhookCard isAdmin={isAdmin} />

        {/* ── Upcoming integrations ─────────────────────────────────────── */}
        <div className="mt-8">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
            Coming Soon
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {COMING_SOON.map(item => (
              <div
                key={item.name}
                className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-5 opacity-60"
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{item.icon}</span>
                  <span className="text-sm font-semibold text-gray-300">{item.name}</span>
                  <span className="ml-auto text-[10px] bg-gray-700/50 text-gray-400 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Soon
                  </span>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

const COMING_SOON = [
  {
    icon: '⚡',
    name: 'Zapier',
    desc: 'Trigger Zaps on video milestones — traffic spikes, new domain embeds, drop-off alerts, and weekly digests.',
  },
  {
    icon: '🔧',
    name: 'Make (Integromat)',
    desc: 'Build automation flows from your video analytics — log performance data, push reports, update dashboards.',
  },
  {
    icon: '🔑',
    name: 'API Key',
    desc: 'Pull your video analytics data programmatically to build custom dashboards, reports, or internal tools.',
  },
  {
    icon: '🔔',
    name: 'Slack',
    desc: 'Push real-time video performance alerts and weekly digests directly to your Slack workspace.',
  },
];

// ─────────────────────────────────────────────────────────────────────────
// WebhookCard — inline webhook config (lifted from WebhookSettings)
// ─────────────────────────────────────────────────────────────────────────

function WebhookCard({ isAdmin }) {
  const { showToast } = useToast();
  const [loading,    setLoading]    = useState(true);
  const [settings,   setSettings]   = useState(null);
  const [url,        setUrl]        = useState('');
  const [secret,     setSecret]     = useState('');
  const [isActive,   setIsActive]   = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [testing,    setTesting]    = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [showSecret, setShowSecret] = useState(false);

  const load = useCallback(() => {
    if (!isAdmin) { setLoading(false); return; }
    api.get('/admin/webhook-settings')
      .then(r => {
        const s = r.data.settings ?? {};
        setSettings(s);
        // Only populate if stored value is a real URL — ignore stale test data (emails, etc.)
        const storedUrl = s.webhook_url ?? '';
        setUrl(storedUrl.startsWith('http://') || storedUrl.startsWith('https://') ? storedUrl : '');
        setSecret(s.webhook_secret ?? '');
        setIsActive(s.is_active ?? false);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isAdmin]);

  useEffect(() => { load(); }, [load]);

  async function save() {
    const trimmed = url.trim();
    // Validate: if a URL is provided it must start with https://
    if (trimmed && !trimmed.startsWith('https://') && !trimmed.startsWith('http://')) {
      showToast('Endpoint URL must start with https://', 'error');
      return;
    }
    setSaving(true);
    try {
      // Send null when empty so the DB value is cleared
      await api.patch('/admin/webhook-settings', {
        webhook_url   : trimmed || null,
        webhook_secret: secret  || null,
        is_active     : isActive,
      });
      setUrl(trimmed);
      showToast(trimmed ? 'Webhook saved' : 'Webhook URL cleared');
      setTestResult(null);
    } catch (err) {
      showToast(err.response?.data?.message ?? 'Save failed', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function test() {
    setTesting(true);
    setTestResult(null);
    try {
      const { data } = await api.post('/admin/webhook-settings/test');
      setTestResult(data);
    } catch (err) {
      setTestResult({ ok: false, error: err.response?.data?.message ?? 'Error' });
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-700/40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-xl flex-shrink-0">
            🔗
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-100">Webhook</h2>
            <p className="text-xs text-gray-400">
              Send real-time analytics events to your own server or automation tool (Make, Zapier, etc.).
            </p>
          </div>
          <div className="ml-auto">
            <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
              isActive
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-gray-700/50 text-gray-400 border border-gray-600/40'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-400' : 'bg-gray-500'}`} />
              {isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      </div>

      {/* Body */}
      {!isAdmin ? (
        <div className="px-6 py-8 text-center">
          <p className="text-sm text-gray-400">Webhook configuration requires Admin access.</p>
        </div>
      ) : loading ? (
        <div className="px-6 py-8 flex items-center gap-2 text-gray-500 text-sm">
          <span className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          Loading…
        </div>
      ) : (
        <div className="px-6 py-5 flex flex-col gap-4">

          {/* Endpoint URL */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              Endpoint URL
            </label>
            <input
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://your-server.com/webhook"
              className="w-full bg-gray-900/60 border border-gray-700 rounded-lg px-3 py-2.5
                         text-sm text-gray-200 placeholder-gray-600 focus-brand"
            />
          </div>

          {/* Secret key */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              Secret Key <span className="text-gray-500 font-normal">(optional — sent as X-VP-Signature)</span>
            </label>
            <div className="flex gap-2">
              <input
                type={showSecret ? 'text' : 'password'}
                value={secret}
                onChange={e => setSecret(e.target.value)}
                placeholder="your-hmac-secret"
                className="flex-1 bg-gray-900/60 border border-gray-700 rounded-lg px-3 py-2.5
                           text-sm text-gray-200 placeholder-gray-600 focus-brand"
              />
              <button
                onClick={() => setShowSecret(s => !s)}
                className="px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-xs text-gray-400 hover:text-gray-200"
              >
                {showSecret ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {/* Active toggle */}
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-gray-200">Enable Webhook</p>
              <p className="text-xs text-gray-400 mt-0.5">Send events to the endpoint above</p>
            </div>
            <button
              onClick={() => setIsActive(a => !a)}
              className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full transition-colors duration-200 ${
                isActive ? 'bg-amber-500' : 'bg-gray-600'
              }`}
              role="switch"
              aria-checked={isActive}
            >
              <span
                className={`inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform duration-200 mt-0.5 ${
                  isActive ? 'translate-x-4' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={save}
              disabled={saving}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-60
                         text-gray-900 text-sm font-semibold rounded-lg transition-colors"
            >
              {saving ? 'Saving…' : 'Save Webhook'}
            </button>
            {url && (
              <button
                onClick={test}
                disabled={testing}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-60
                           text-gray-200 text-sm font-medium rounded-lg transition-colors border border-gray-600"
              >
                {testing ? 'Testing…' : 'Send Test'}
              </button>
            )}
          </div>

          {/* Test result */}
          {testResult && (
            <div className={`rounded-lg px-4 py-3 text-xs font-mono ${
              testResult.ok
                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'
                : 'bg-red-500/10 border border-red-500/20 text-red-300'
            }`}>
              {testResult.ok
                ? `✓ ${testResult.statusCode} — ${testResult.durationMs}ms`
                : `✗ ${testResult.error ?? 'Request failed'}`
              }
            </div>
          )}
        </div>
      )}
    </div>
  );
}
