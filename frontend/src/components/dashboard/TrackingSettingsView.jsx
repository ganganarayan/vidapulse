'use strict';
import React, { useEffect, useState } from 'react';
import api from '../../lib/api';
import { useToast } from '../../contexts/ToastContext';
import FeatureGate from '../FeatureGate';

/**
 * TrackingSettingsView — per-video "Tracking" panel (viewer plane, Pro only).
 *
 * Lives in the video page's Settings group beside Share & Embed / Player
 * Settings. Configures the video's Meta Pixel + per-event destination mapping,
 * shows live fired-counters, and manages the subscriber's account-level
 * tracking webhooks. All reads/writes go through the Pro-gated tracking API.
 */

const VIEWER_EVENTS = [
  { key: 'vsl_view',    label: 'Video Viewed' },
  { key: 'vsl_25',      label: '25% Viewed' },
  { key: 'vsl_50',      label: '50% Viewed' },
  { key: 'vsl_75',      label: '75% Viewed' },
  { key: 'vsl_100',     label: '100% Viewed' },
  { key: 'cta_clicked', label: 'CTA Clicked' },
];

const META_SUGGESTIONS = ['ViewContent', 'Lead', 'Purchase', 'Contact', 'CompleteRegistration', 'AddToCart', 'InitiateCheckout', 'Subscribe'];

const DEFAULT_MAPPING = {
  vsl_view:    { meta: 'ViewContent', webhook: true },
  vsl_25:      { meta: 'ViewContent', webhook: true },
  vsl_50:      { meta: 'ViewContent', webhook: true },
  vsl_75:      { meta: 'ViewContent', webhook: true },
  vsl_100:     { meta: 'Lead',        webhook: true },
  cta_clicked: { meta: 'Lead',        webhook: true },
};

export default function TrackingSettingsView({ videoId }) {
  return (
    <FeatureGate required="pro" feature="Video Tracking">
      <TrackingPanel videoId={videoId} />
    </FeatureGate>
  );
}

function TrackingPanel({ videoId }) {
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [pixelId, setPixelId] = useState('');
  const [mapping, setMapping] = useState(DEFAULT_MAPPING);
  const [counts,  setCounts]  = useState({});
  const [saving,  setSaving]  = useState(false);

  const [webhooks,  setWebhooks]  = useState([]);
  const [newUrl,    setNewUrl]    = useState('');
  const [addingHook, setAddingHook] = useState(false);
  const [hookMsg,   setHookMsg]   = useState('');

  useEffect(() => {
    if (!videoId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [{ data: s }, { data: w }] = await Promise.all([
          api.get(`/videos/${videoId}/tracking-settings`),
          api.get('/tracking-webhooks'),
        ]);
        if (cancelled) return;
        setEnabled(!!s.settings?.enabled);
        setPixelId(s.settings?.pixel_id || '');
        setMapping({ ...DEFAULT_MAPPING, ...(s.settings?.event_mapping || {}) });
        setCounts(s.counts || {});
        setWebhooks(w.webhooks || []);
      } catch {
        if (!cancelled) showToast('Could not load tracking settings', 'error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [videoId]); // eslint-disable-line react-hooks/exhaustive-deps

  const setMeta    = (key, val) => setMapping(m => ({ ...m, [key]: { ...m[key], meta: val } }));
  const toggleHook = (key)      => setMapping(m => ({ ...m, [key]: { ...m[key], webhook: !m[key]?.webhook } }));

  async function save() {
    const pid = pixelId.trim();
    if (pid && !/^\d{6,20}$/.test(pid)) {
      showToast('Meta Pixel ID must be 6–20 digits.', 'error'); return;
    }
    if (enabled && !pid) {
      showToast('Add a Meta Pixel ID before enabling tracking.', 'error'); return;
    }
    setSaving(true);
    try {
      const { data } = await api.put(`/videos/${videoId}/tracking-settings`, {
        enabled,
        pixel_id: pid || null,
        event_mapping: mapping,
      });
      setEnabled(!!data.settings.enabled);
      setPixelId(data.settings.pixel_id || '');
      setMapping({ ...DEFAULT_MAPPING, ...(data.settings.event_mapping || {}) });
      showToast('Tracking settings saved');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function addWebhook(e) {
    e.preventDefault();
    if (!newUrl.trim()) return;
    setAddingHook(true); setHookMsg('');
    try {
      const { data } = await api.post('/tracking-webhooks', { url: newUrl.trim() });
      setWebhooks(w => [...w, data.webhook]);
      setNewUrl('');
    } catch (err) {
      setHookMsg(err.response?.data?.message || 'Could not add webhook');
    } finally { setAddingHook(false); }
  }

  async function removeWebhook(id) {
    try { await api.delete(`/tracking-webhooks/${id}`); setWebhooks(w => w.filter(x => x.id !== id)); }
    catch { showToast('Could not remove webhook', 'error'); }
  }

  if (loading) {
    return (
      <div className="px-6 py-10 flex items-center gap-2 text-sm text-gray-500">
        <span className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        Loading tracking settings…
      </div>
    );
  }

  return (
    <div className="px-6 py-6 min-w-0 max-w-3xl">
      <div className="mb-6">
        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mb-1">Settings</p>
        <h2 className="text-2xl font-bold text-gray-50">Tracking</h2>
        <p className="text-xs text-gray-400 mt-1">Send this video's engagement to your Meta Pixel and CRM.</p>
      </div>

      {/* How it works */}
      <div className="mb-6 bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-amber-500/20 rounded-xl p-5">
        <p className="text-sm font-semibold text-amber-200 mb-2">How Meta Tracking Works</p>
        <p className="text-xs text-amber-100/70 leading-relaxed mb-3">
          When you add your Meta Pixel, VidaPulse automatically sends engagement signals to Meta whenever
          viewers watch your video. The more engagement events collected, the stronger Meta's optimization becomes.
        </p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-amber-100/70">
          <span>✓ Build warm audiences</span><span>✓ Improve retargeting</span>
          <span>✓ Optimize campaigns</span><span>✓ Find lookalike audiences</span>
          <span>✓ Higher conversion quality</span><span>✓ Better optimization over time</span>
        </div>
      </div>

      {/* Enable */}
      <div className="flex items-center justify-between bg-gray-800/40 border border-gray-700/50 rounded-xl px-5 py-4">
        <div>
          <p className="text-sm font-medium text-gray-200">Enable Tracking</p>
          <p className="text-xs text-gray-500 mt-0.5">When off, nothing fires for this video.</p>
        </div>
        <Toggle on={enabled} onClick={() => setEnabled(v => !v)} />
      </div>

      {/* Pixel ID */}
      <div className="mt-4">
        <label className="block text-xs text-gray-400 mb-1.5">Meta Pixel ID</label>
        <input
          value={pixelId}
          onChange={e => setPixelId(e.target.value.replace(/[^\d]/g, ''))}
          placeholder="123456789012345"
          inputMode="numeric"
          className="w-full sm:w-80 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-gray-100
                     placeholder-gray-600 focus:outline-none focus:border-amber-500/60"
        />
        <p className="text-[11px] text-gray-500 mt-1">Digits only — find it in Meta Events Manager.</p>
      </div>

      {/* Pixel Setup table */}
      <div className="mt-6">
        <p className="text-sm font-semibold text-gray-300 mb-2">Pixel Setup</p>
        <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-800/70 text-[11px] uppercase tracking-wider text-gray-500">
              <tr>
                <th className="text-left px-4 py-2.5">VidaPulse Event</th>
                <th className="text-left px-4 py-2.5">Meta Event</th>
                <th className="text-center px-4 py-2.5">Webhook</th>
                <th className="text-right px-4 py-2.5">Fired</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/40">
              {VIEWER_EVENTS.map(ev => (
                <tr key={ev.key}>
                  <td className="px-4 py-3 text-gray-200 whitespace-nowrap">
                    {ev.label} <code className="text-[10px] text-gray-600 ml-1">{ev.key}</code>
                  </td>
                  <td className="px-4 py-3">
                    <input
                      list="vp-meta-events"
                      value={mapping[ev.key]?.meta || ''}
                      onChange={e => setMeta(ev.key, e.target.value)}
                      className="w-40 bg-gray-900 border border-gray-700 rounded px-2 py-1.5 text-xs text-gray-100
                                 focus:outline-none focus:border-amber-500/60"
                    />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Toggle on={!!mapping[ev.key]?.webhook} onClick={() => toggleHook(ev.key)} small />
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-gray-400">
                    {(counts[ev.key] || 0).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <datalist id="vp-meta-events">
            {META_SUGGESTIONS.map(s => <option key={s} value={s} />)}
          </datalist>
        </div>
      </div>

      {/* Save */}
      <div className="mt-5">
        <button
          onClick={save}
          disabled={saving}
          className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-sm font-semibold text-gray-900 rounded-lg transition-colors"
        >
          {saving ? 'Saving…' : 'Save tracking settings'}
        </button>
      </div>

      {/* Tracking webhooks */}
      <div className="mt-8">
        <p className="text-sm font-semibold text-gray-300 mb-1">Tracking Webhooks</p>
        <p className="text-xs text-gray-500 mb-3">
          Your CRM endpoint(s). They receive the events toggled "Webhook" above, across all your videos.
        </p>
        <form onSubmit={addWebhook} className="flex gap-2 mb-3">
          <input
            value={newUrl}
            onChange={e => setNewUrl(e.target.value)}
            placeholder="https://your-crm.example.com/hook"
            spellCheck="false"
            className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100
                       placeholder-gray-600 focus:outline-none focus:border-amber-500/60"
          />
          <button
            type="submit"
            disabled={addingHook || !newUrl.trim()}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-sm font-semibold text-gray-900 rounded-lg"
          >
            {addingHook ? 'Adding…' : 'Add'}
          </button>
        </form>
        {hookMsg && <p className="text-xs text-red-400 mb-2">{hookMsg}</p>}
        {webhooks.length === 0 ? (
          <p className="text-xs text-gray-600">No tracking webhooks yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {webhooks.map(h => (
              <div key={h.id} className="flex items-center gap-2 bg-gray-800/40 border border-gray-700/50 rounded-lg px-3 py-2">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${h.status === 'active' ? 'bg-emerald-500' : 'bg-gray-600'}`} />
                <span className="flex-1 text-xs text-gray-300 font-mono truncate" title={h.url}>{h.url}</span>
                <button onClick={() => removeWebhook(h.id)} className="text-red-400 hover:text-red-300 text-xs px-2 py-1 rounded">
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Toggle({ on, onClick, small = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      role="switch"
      aria-checked={on}
      className={`relative inline-flex flex-shrink-0 rounded-full transition-colors duration-200
        ${small ? 'h-5 w-9' : 'h-6 w-11'} ${on ? 'bg-emerald-500' : 'bg-gray-600'}`}
    >
      <span
        className={`inline-block rounded-full bg-white shadow transform transition-transform duration-200 mt-0.5
          ${small ? 'h-4 w-4' : 'h-5 w-5'} ${on ? (small ? 'translate-x-4' : 'translate-x-5') : 'translate-x-0.5'}`}
      />
    </button>
  );
}
