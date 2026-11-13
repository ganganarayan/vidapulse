import React, { useEffect, useState } from 'react';
import api from '../lib/api';
import SecretInput, { copyText } from './SecretInput';

/**
 * AdminPlatformKeys: super-admin panel for the platform keys that used to be
 * Railway env vars (Razorpay keys + webhook secret on Billing; Google OAuth,
 * platform Meta pixel, inbound webhook secret and JWT secret on Settings).
 *
 * The app is the only source for these keys (existing Railway env vars were
 * imported once on boot and are ignored after that). Saving takes effect
 * immediately. Clearing leaves the key empty (not allowed for required keys).
 */

const SOURCE = {
  app : { dot: '🟢', text: 'set' },
  none: { dot: '🟡', text: 'not set' },
};

export default function AdminPlatformKeys({ group, title }) {
  const [items,  setItems]  = useState([]);
  const [draft,  setDraft]  = useState({});
  const [busy,   setBusy]   = useState('');
  const [msg,    setMsg]    = useState(null);
  const [copied, setCopied] = useState('');

  async function copyUrl(key, url) {
    await copyText(url);
    setCopied(key);
    setTimeout(() => setCopied(''), 1500);
  }

  async function load() {
    try {
      const { data } = await api.get('/admin/platform-settings', { params: { group } });
      setItems(data.settings || []);
      setDraft(Object.fromEntries((data.settings || []).map((s) => [s.key, s.value || ''])));
    } catch (e) {
      setMsg({ ok: false, text: e?.response?.data?.error || 'Could not load keys' });
    }
  }
  useEffect(() => { load(); }, [group]);

  async function save(item, clear = false) {
    const value = clear ? '' : (draft[item.key] || '');
    if (item.key === 'JWT_SECRET' && !window.confirm(
      'Changing the JWT secret signs EVERYONE out immediately, including you. Continue?')) return;
    if (item.key === 'WEBHOOK_SECRET' && !window.confirm(
      'The CRM webhook that creates accounts will be rejected until it uses the new secret. Continue?')) return;
    if (clear && !window.confirm(`Clear ${item.label}? It will be empty and anything that uses it stops working.`)) return;

    setBusy(item.key); setMsg(null);
    try {
      const { data } = await api.put(`/admin/platform-settings/${item.key}`, { value });
      if (data.signed_out) {
        window.location.href = '/login';
        return;
      }
      setItems((list) => list.map((s) => (s.key === item.key ? data.setting : s)));
      setDraft((d) => ({ ...d, [item.key]: data.setting.value || '' }));
      setMsg({ ok: true, text: `${item.label} ${clear ? 'cleared' : 'saved'}.` });
    } catch (e) {
      setMsg({ ok: false, text: e?.response?.data?.error || 'Save failed' });
    } finally { setBusy(''); }
  }

  const input = 'bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-amber-500/60';
  const btn   = 'px-3 py-1.5 rounded-md text-xs font-semibold border transition disabled:opacity-30 disabled:cursor-not-allowed';

  return (
    <div className="bg-gray-800 border border-amber-500/40 rounded-xl p-5 mb-8">
      <p className="text-xs text-amber-400 uppercase tracking-wider font-semibold mb-1">{title}</p>
      <p className="text-xs text-gray-400 mb-4">
        Managed here, not in Railway. Changes take effect immediately. Railway env vars for these keys are no longer read and can be deleted.
      </p>

      <div className="space-y-5">
        {items.map((it) => {
          const changed = (draft[it.key] || '') !== (it.value || '');
          const src = SOURCE[it.source] || SOURCE.none;
          return (
            <div key={it.key}>
              <div className="flex items-baseline justify-between gap-2 flex-wrap mb-1">
                <label className="text-xs font-semibold text-gray-200">{it.label}</label>
                <span className="text-[11px] text-gray-400">{src.dot} {src.text}</span>
              </div>
              <div className="flex gap-2 items-start">
                <div className="flex-1 min-w-0">
                  {it.secret ? (
                    <SecretInput
                      value={draft[it.key] || ''}
                      onChange={(e) => setDraft((d) => ({ ...d, [it.key]: e.target.value }))}
                      generate={it.generate}
                      autoComplete="off"
                      className={input}
                    />
                  ) : (
                    <input
                      value={draft[it.key] || ''}
                      onChange={(e) => setDraft((d) => ({ ...d, [it.key]: e.target.value }))}
                      autoComplete="off" spellCheck="false"
                      className={`w-full ${input}`}
                    />
                  )}
                </div>
                <button disabled={!changed || !!busy} onClick={() => save(it)}
                  className={`${btn} border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/10 mt-1`}>
                  {busy === it.key ? 'Saving...' : 'Save'}
                </button>
                {it.source === 'app' && !it.required && (
                  <button disabled={!!busy} onClick={() => save(it, true)}
                    title="Remove this value"
                    className={`${btn} border-gray-600 text-gray-300 hover:bg-gray-700 mt-1`}>
                    Clear
                  </button>
                )}
              </div>
              {it.url && (() => {
                const full = /^https?:\/\//.test(it.url) ? it.url : `${window.location.origin}${it.url}`;
                return (
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] text-gray-400">Webhook URL:</span>
                    <code className="text-[11px] text-gray-200 bg-gray-900 border border-gray-700 rounded px-2 py-1 break-all">{full}</code>
                    <button type="button" onClick={() => copyUrl(it.key, full)}
                      className={`${btn} border-gray-600 text-gray-300 hover:bg-gray-700`}>
                      {copied === it.key ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                );
              })()}
              {it.events && (
                <div className="mt-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] text-gray-400">Tick these events on the webhook:</span>
                    <button type="button" onClick={() => copyUrl(`${it.key}:events`, it.events.join(', '))}
                      className={`${btn} border-gray-600 text-gray-300 hover:bg-gray-700`}>
                      {copied === `${it.key}:events` ? 'Copied' : 'Copy list'}
                    </button>
                  </div>
                  <div className="flex gap-1.5 flex-wrap mt-1.5">
                    {it.events.map((ev) => (
                      <code key={ev} className="text-[11px] text-emerald-300 bg-gray-900 border border-gray-700 rounded px-2 py-0.5">{ev}</code>
                    ))}
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1">Without these, renewals, cancellations and failed payments never reach the app. Leave the other events unticked.</p>
                </div>
              )}
              <p className="text-[11px] text-gray-500 mt-1">{it.help}</p>
            </div>
          );
        })}
      </div>

      {msg && (
        <p className={`text-xs mt-4 ${msg.ok ? 'text-emerald-400' : 'text-amber-400'}`}>{msg.ok ? '🟢 ' : '🟡 '}{msg.text}</p>
      )}
    </div>
  );
}
