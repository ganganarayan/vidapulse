'use strict';
import React, { useEffect, useState } from 'react';
import api from '../../lib/api';
import { useToast } from '../../contexts/ToastContext';
import FeatureGate from '../FeatureGate';

/**
 * TrackingSettingsView — per-video "Tracking" panel (viewer plane, Pro only).
 *
 * Lives in the video page's Settings group beside Share & Embed / Player
 * Settings — every field here belongs to THIS video: its own Meta Pixel, its
 * own Conversions API token, its own event mapping. Two videos can fire to two
 * different pixels in two different ad accounts.
 *
 * A mapping cell takes a COMMA-SEPARATED list of Meta events. Each name fires
 * on its own — browser pixel + Conversions API, back to back, deduplicated by
 * a shared event id. The Webhook toggle is unrelated to those names: the CRM
 * only ever receives the VidaPulse event (vsl_50, cta_clicked …).
 *
 * Fired-counters are live; the webhook endpoint list is account-level (one CRM
 * serves every video). All reads/writes go through the Pro-gated tracking API.
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

/** Meta's standard events — the rest fire as custom events. Mirrors the server. */
const STANDARD_EVENTS = new Set([
  'AddPaymentInfo', 'AddToCart', 'AddToWishlist', 'CompleteRegistration', 'Contact',
  'CustomizeProduct', 'Donate', 'FindLocation', 'InitiateCheckout', 'Lead', 'PageView',
  'Purchase', 'Schedule', 'Search', 'StartTrial', 'SubmitApplication', 'Subscribe',
  'ViewContent',
]);

const MAX_META_EVENTS = 5;

/** Same parse as backend/src/tracking/metaEvents.js — keeps the preview honest. */
function parseMetaEvents(raw) {
  if (!raw) return [];
  const out = [];
  for (const part of String(raw).split(',')) {
    const name = part.trim().replace(/[^A-Za-z0-9_]/g, '').slice(0, 40);
    if (!name || out.includes(name)) continue;
    out.push(name);
    if (out.length >= MAX_META_EVENTS) break;
  }
  return out;
}

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
  // Per-Meta-event fired counts: { vsl_50: { ViewContent: 87, Lead: 12 } }
  const [metaCounts, setMetaCounts] = useState({});
  const [saving,  setSaving]  = useState(false);

  // CAPI token is write-only: the server returns "set?" + a 4-char hint, never
  // the token. tokenInput is only sent when the user actually types a new one.
  const [tokenSet,   setTokenSet]   = useState(false);
  const [tokenHint,  setTokenHint]  = useState('');
  const [tokenInput, setTokenInput] = useState('');
  const [testCode,   setTestCode]   = useState('');

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
        setTokenSet(!!s.settings?.capi_token_set);
        setTokenHint(s.settings?.capi_token_hint || '');
        setTestCode(s.settings?.capi_test_event_code || '');
        setCounts(s.counts || {});
        setMetaCounts(s.meta_counts || {});
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
      const body = {
        enabled,
        pixel_id: pid || null,
        event_mapping: mapping,
        capi_test_event_code: testCode.trim(),
      };
      // Omit the token entirely unless it changed — the server keeps the stored
      // one. Sending null (via Remove) is what clears it.
      if (tokenInput.trim()) body.capi_token = tokenInput.trim();

      const { data } = await api.put(`/videos/${videoId}/tracking-settings`, body);
      setEnabled(!!data.settings.enabled);
      setPixelId(data.settings.pixel_id || '');
      setMapping({ ...DEFAULT_MAPPING, ...(data.settings.event_mapping || {}) });
      setTokenSet(!!data.settings.capi_token_set);
      setTokenHint(data.settings.capi_token_hint || '');
      setTestCode(data.settings.capi_test_event_code || '');
      setTokenInput('');
      showToast('Tracking settings saved');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  }

  /** Clear the stored CAPI token for this video (server-side fires stop). */
  async function removeToken() {
    setSaving(true);
    try {
      const { data } = await api.put(`/videos/${videoId}/tracking-settings`, {
        enabled,
        pixel_id: pixelId.trim() || null,
        event_mapping: mapping,
        capi_test_event_code: testCode.trim(),
        capi_token: null,
      });
      setTokenSet(!!data.settings.capi_token_set);
      setTokenHint(data.settings.capi_token_hint || '');
      setTokenInput('');
      showToast('Conversions API token removed');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to remove token', 'error');
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
        <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-1">Settings</p>
        <h2 className="text-2xl font-bold text-gray-50">Tracking</h2>
        <p className="text-sm text-gray-300 mt-1">Send this video's engagement to your Meta Pixel and CRM.</p>
      </div>

      {/* How it works */}
      <div className="mb-6 bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-amber-500/20 rounded-xl p-5">
        <p className="text-sm font-semibold text-amber-200 mb-2">How Meta Tracking Works</p>
        <p className="text-sm text-amber-100/90 leading-relaxed mb-3">
          When you add your Meta Pixel, VidaPulse automatically sends engagement signals to Meta whenever
          viewers watch your video. The more engagement events collected, the stronger Meta's optimization becomes.
        </p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm text-amber-100/90">
          <span>✓ Build warm audiences</span><span>✓ Improve retargeting</span>
          <span>✓ Optimize campaigns</span><span>✓ Find lookalike audiences</span>
          <span>✓ Higher conversion quality</span><span>✓ Better optimization over time</span>
        </div>
      </div>

      {/* Enable */}
      <div className="flex items-center justify-between bg-gray-800/40 border border-gray-700/50 rounded-xl px-5 py-4">
        <div>
          <p className="text-sm font-medium text-gray-200">Enable Tracking</p>
          <p className="text-sm text-gray-400 mt-0.5">When off, nothing fires for this video.</p>
        </div>
        <Toggle on={enabled} onClick={() => setEnabled(v => !v)} />
      </div>

      {/* Pixel ID */}
      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-300 mb-1.5">Meta Pixel ID</label>
        <input
          value={pixelId}
          onChange={e => setPixelId(e.target.value.replace(/[^\d]/g, ''))}
          placeholder="123456789012345"
          inputMode="numeric"
          className="w-full sm:w-80 bg-gray-900 border border-gray-600 rounded-lg px-3 py-2.5 text-base text-gray-50
                     placeholder-gray-500 focus:outline-none focus:border-amber-500"
        />
        <p className="text-xs text-gray-400 mt-1.5">
          Digits only — find it in Meta Events Manager. This pixel is used for <strong>this video only</strong>;
          another video can point at a different pixel.
        </p>
      </div>

      {/* Conversions API (server-side) */}
      <div className="mt-5 bg-gray-800/40 border border-gray-700/50 rounded-xl px-5 py-4">
        <div className="flex items-center justify-between gap-3 mb-1">
          <p className="text-sm font-medium text-gray-200">Conversions API</p>
          <span className={`text-[11px] px-2 py-0.5 rounded-md border ${
            tokenSet
              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25'
              : 'bg-gray-700/40 text-gray-400 border-gray-600/40'}`}>
            {tokenSet ? `Token set ${tokenHint}` : 'Not set'}
          </span>
        </div>
        <p className="text-sm text-gray-400 mb-3">
          Sends the same events to this pixel from our server — so they still arrive when the browser
          pixel is blocked, and CTA clicks (which redirect away) get counted. Both copies share an event
          id, so Meta deduplicates them. Generate the token in Events Manager → your dataset → Settings
          → Conversions API → Generate access token.
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="password"
            value={tokenInput}
            onChange={e => setTokenInput(e.target.value)}
            placeholder={tokenSet ? 'Paste a new token to replace it' : 'EAAG… (CAPI access token)'}
            spellCheck="false"
            autoComplete="off"
            className="flex-1 bg-gray-900 border border-gray-600 rounded-lg px-3 py-2.5 text-sm text-gray-50
                       placeholder-gray-500 focus:outline-none focus:border-amber-500"
          />
          {tokenSet && (
            <button
              type="button"
              onClick={removeToken}
              disabled={saving}
              className="px-3 py-2 text-sm text-red-400 hover:text-red-300 border border-red-500/30 rounded-lg disabled:opacity-50"
            >
              Remove
            </button>
          )}
        </div>
        <div className="mt-3">
          <label className="block text-xs font-medium text-gray-400 mb-1">Test event code (optional)</label>
          <input
            value={testCode}
            onChange={e => setTestCode(e.target.value.replace(/[^A-Za-z0-9_-]/g, ''))}
            placeholder="TEST12345"
            className="w-full sm:w-56 bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-50
                       placeholder-gray-500 focus:outline-none focus:border-amber-500"
          />
          <p className="text-xs text-gray-500 mt-1.5">
            While set, server fires land in Events Manager → Test Events. Clear it once you've verified.
          </p>
        </div>
      </div>

      {/* Pixel Setup table */}
      <div className="mt-6">
        <p className="text-sm font-semibold text-gray-300 mb-1">Pixel Setup</p>
        <p className="text-xs text-gray-400 mb-2">
          Separate several Meta events with commas — each one fires on its own, back to back
          (max {MAX_META_EVENTS}), and <strong>Fired</strong> counts them separately, in the same order.
          The <strong>Webhook</strong> toggle is independent: your CRM receives the VidaPulse event only,
          never these Meta names.
        </p>
        <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-800/70 text-xs uppercase tracking-wider text-gray-300 font-semibold">
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
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-100">{ev.label}</span>
                    <code className="ml-2 text-xs font-medium text-amber-300 bg-amber-500/10 border border-amber-500/25 px-1.5 py-0.5 rounded">{ev.key}</code>
                  </td>
                  <td className="px-4 py-3">
                    <input
                      list="vp-meta-events"
                      value={mapping[ev.key]?.meta || ''}
                      onChange={e => setMeta(ev.key, e.target.value)}
                      placeholder="ViewContent, vsl_view"
                      spellCheck="false"
                      className="w-full min-w-[14rem] bg-gray-900 border border-gray-600 rounded px-2.5 py-1.5 text-sm text-gray-50
                                 placeholder-gray-600 focus:outline-none focus:border-amber-500"
                    />
                    <MetaEventChips value={mapping[ev.key]?.meta} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Toggle on={!!mapping[ev.key]?.webhook} onClick={() => toggleHook(ev.key)} small />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <FiredCounts
                      names={parseMetaEvents(mapping[ev.key]?.meta)}
                      perName={metaCounts[ev.key]}
                      total={counts[ev.key] || 0}
                    />
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
        <p className="text-sm text-gray-400 mb-3">
          Your CRM endpoint(s) — account-level, shared by every video. They receive the events toggled
          "Webhook" above, carrying the VidaPulse event key only (vsl_50, cta_clicked …). Meta event
          names never go to your CRM.
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
          <p className="text-sm text-gray-400">No tracking webhooks yet.</p>
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

/**
 * Fired counts, one number per Meta event in the cell, comma-separated and in
 * the same order as the names — "87, 12" reads straight across from
 * "ViewContent, Lead".
 *
 * They diverge when a name is added to the cell later: the newcomer starts at
 * zero while the original keeps its history. When the VidaPulse event's own
 * total runs ahead of every name (fires recorded before per-name counting
 * existed), that total is shown underneath rather than silently dropped.
 */
function FiredCounts({ names, perName = {}, total = 0 }) {
  if (!names.length) {
    return <span className="tabular-nums text-sm font-semibold text-gray-100">{total.toLocaleString()}</span>;
  }
  const each    = names.map(n => perName?.[n] || 0);
  const highest = Math.max(...each);
  return (
    <div className="leading-tight">
      <span
        className="tabular-nums text-sm font-semibold text-gray-100"
        title={names.map((n, i) => `${n}: ${each[i].toLocaleString()}`).join(' · ')}
      >
        {each.map(c => c.toLocaleString()).join(', ')}
      </span>
      {total > highest && (
        <div
          className="text-[10px] text-gray-500 tabular-nums mt-0.5"
          title="Total fires of this VidaPulse event, including those recorded before per-event counting started."
        >
          {total.toLocaleString()} total
        </div>
      )}
    </div>
  );
}

/**
 * Shows exactly what the comma list will fire: one chip per event, marked
 * standard (fbq track) or custom (trackCustom), in order.
 */
function MetaEventChips({ value }) {
  const names = parseMetaEvents(value);
  if (names.length < 2 && names.every(n => STANDARD_EVENTS.has(n))) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-1.5">
      {names.map(n => (
        <span
          key={n}
          title={STANDARD_EVENTS.has(n) ? 'Standard Meta event' : 'Custom event'}
          className={`text-[10px] px-1.5 py-0.5 rounded border ${
            STANDARD_EVENTS.has(n)
              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25'
              : 'bg-gray-700/40 text-gray-300 border-gray-600/50'}`}
        >
          {n}
        </span>
      ))}
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
