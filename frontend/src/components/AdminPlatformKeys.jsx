import React, { useEffect, useState } from 'react';
import api from '../lib/api';
import SecretInput from './SecretInput';

/**
 * AdminPlatformKeys: super-admin panel for the platform keys that used to be
 * Railway env vars (Razorpay keys + webhook secret on Billing; Google OAuth,
 * platform Meta pixel, inbound webhook secret and JWT secret on Settings).
 *
 * Each key shows where its value comes from:
 *   saved in app  (wins)  ·  from Railway env  (fallback)  ·  not set
 * Saving takes effect immediately. Clearing falls back to the env var.
 */

const SOURCE = {
  app : { dot: '🟢', text: 'saved in app' },
  env : { dot: '🟡', text: 'from Railway env (save here to manage it in the app)' },
  none: { dot: '🟡', text: 'not set' },
};

export default function AdminPlatformKeys({ group, title }) {
  const [items,  setItems]  = useState([]);
  const [draft,  setDraft]  = useState({});
  const [busy,   setBusy]   = useState('');
  const [msg,    setMsg]    = useState(null);

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
    if (clear && !window.confirm(`Clear ${item.label}? It will fall back to the Railway env var${item.env_fallback ? '' : ' (none is set, so it will be empty)'}.`)) return;

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
        Managed here instead of Railway. A value saved here wins over the Railway env var and takes effect immediately.
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
                {it.source === 'app' && (
                  <button disabled={!!busy || (it.required && !it.env_fallback)} onClick={() => save(it, true)}
                    title={it.required && !it.env_fallback ? 'No Railway env var to fall back to' : 'Use the Railway env var again'}
                    className={`${btn} border-gray-600 text-gray-300 hover:bg-gray-700 mt-1`}>
                    Clear
                  </button>
                )}
              </div>
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
