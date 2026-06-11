import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../lib/api';

/**
 * EventWebhooks — /admin/event-webhooks
 *
 * The webhook REGISTRY for the unified event architecture. Each row maps an
 * event → an endpoint URL (UNIQUE per event+URL, so an event can fan out to
 * several endpoints). The emitter delivers every event to all ACTIVE rows for
 * its name. Delivery history + retry live on the existing Webhook Log page.
 */
export default function EventWebhooks() {
  const navigate = useNavigate();

  const [webhooks, setWebhooks] = useState([]);
  const [events,   setEvents]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [fetchError, setFetchError] = useState('');

  // Add form
  const [newEvent, setNewEvent] = useState('');
  const [newUrl,   setNewUrl]   = useState('');
  const [adding,   setAdding]   = useState(false);
  const [addMsg,   setAddMsg]   = useState('');
  const [search,   setSearch]   = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setFetchError('');
    try {
      const { data } = await api.get('/admin/event-webhooks');
      setWebhooks(data.webhooks ?? []);
      setEvents(data.events ?? []);
    } catch (err) {
      if (err.response?.status === 403) navigate('/dashboard');
      else setFetchError('Could not load event webhooks. Check your connection.');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => { load(); }, [load]);

  // Map event_name → display label for the table.
  const eventMeta = useMemo(() => {
    const m = new Map();
    events.forEach(e => m.set(e.key, e));
    return m;
  }, [events]);

  // Group the event catalog by category for the <select>.
  const grouped = useMemo(() => {
    const g = {};
    events.forEach(e => { (g[e.category] ??= []).push(e); });
    return g;
  }, [events]);

  // How many endpoints each event currently has — shown in the picker so a
  // missing config (0) is obvious at a glance.
  const countByEvent = useMemo(() => {
    const m = new Map();
    webhooks.forEach(w => m.set(w.event_name, (m.get(w.event_name) || 0) + 1));
    return m;
  }, [webhooks]);

  async function handleAdd(e) {
    e.preventDefault();
    if (!newEvent || !newUrl.trim()) return;
    setAdding(true);
    setAddMsg('');
    try {
      await api.post('/admin/event-webhooks', { event_name: newEvent, url: newUrl.trim() });
      setNewUrl('');
      setNewEvent('');
      setAddMsg('ok');
      setTimeout(() => setAddMsg(''), 2500);
      await load();
    } catch (err) {
      setAddMsg(err.response?.data?.message || err.response?.data?.error || 'Could not add webhook.');
    } finally {
      setAdding(false);
    }
  }

  // Webhooks grouped by event_name for display, filtered by the search box
  // (matches event key, display name, or URL).
  const byEvent = useMemo(() => {
    const q = search.trim().toLowerCase();
    const matches = (w) => {
      if (!q) return true;
      const dn = (eventMeta.get(w.event_name)?.display_name || '').toLowerCase();
      return w.event_name.toLowerCase().includes(q) || dn.includes(q) || (w.url || '').toLowerCase().includes(q);
    };
    const g = {};
    webhooks.filter(matches).forEach(w => { (g[w.event_name] ??= []).push(w); });
    return Object.entries(g).sort((a, b) => a[0].localeCompare(b[0]));
  }, [webhooks, search, eventMeta]);

  return (
    <AdminShell title="Event Webhooks" onBack={() => navigate('/dashboard')}>
      <div className="max-w-5xl mx-auto flex flex-col gap-6">

        {/* Intro */}
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-300 mb-1">Webhook Registry</h2>
          <p className="text-xs text-gray-500 leading-relaxed">
            One row = "deliver this event to this URL". An event can have multiple endpoints.
            Every event is delivered to all <span className="text-emerald-400">active</span> endpoints registered here.
            Delivery history, payload inspection and retry are on the{' '}
            <Link to="/admin/webhook-log" className="text-amber-400 hover:text-amber-300">Webhook Log</Link>.
          </p>
        </div>

        {/* Add form */}
        <form onSubmit={handleAdd} className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-5 flex flex-col gap-3">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Add endpoint</p>
          <div className="flex flex-col sm:flex-row gap-2">
            <select
              value={newEvent}
              onChange={e => setNewEvent(e.target.value)}
              className="sm:w-72 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-gray-100
                         focus:outline-none focus:border-amber-500/60"
            >
              <option value="">Select an event…</option>
              {Object.entries(grouped).map(([cat, list]) => (
                <optgroup key={cat} label={cat}>
                  {list.map(ev => (
                    <option key={ev.key} value={ev.key}>
                      {ev.display_name} ({countByEvent.get(ev.key) || 0}) — {ev.key}{ev.reserved ? ' · reserved' : ''}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <input
              type="text"
              inputMode="url"
              autoComplete="off"
              spellCheck="false"
              value={newUrl}
              onChange={e => setNewUrl(e.target.value)}
              placeholder="https://your-crm.example.com/automation/…"
              className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-gray-100
                         placeholder-gray-600 focus:outline-none focus:border-amber-500/60"
            />
            <button
              type="submit"
              disabled={adding || !newEvent || !newUrl.trim()}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50
                         text-sm font-semibold text-gray-900 rounded-lg transition-colors whitespace-nowrap"
            >
              {adding ? 'Adding…' : 'Add webhook'}
            </button>
          </div>
          {newEvent && eventMeta.get(newEvent)?.description && (
            <p className="text-xs text-gray-500">{eventMeta.get(newEvent).description}</p>
          )}
          {addMsg && addMsg !== 'ok' && <p className="text-xs text-red-400">{addMsg}</p>}
          {addMsg === 'ok' && <p className="text-xs text-emerald-400">✓ Added</p>}
        </form>

        {/* Search */}
        {webhooks.length > 0 && (
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search events or URLs…"
            className="w-full sm:w-80 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm
                       text-gray-200 placeholder-gray-600 focus:outline-none focus:border-amber-500/60"
          />
        )}

        {fetchError && (
          <div className="bg-red-500/5 border border-red-500/20 rounded-lg px-4 py-3">
            <p className="text-sm text-red-300">{fetchError}</p>
          </div>
        )}

        {/* Registry list */}
        {loading ? (
          <LoadingSkeleton />
        ) : webhooks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-2">
            <p className="text-sm text-gray-400">No event webhooks configured yet.</p>
            <p className="text-xs text-gray-500">Add one above to start routing an event to an endpoint.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {byEvent.map(([eventName, rows]) => (
              <div key={eventName} className="bg-gray-800/40 border border-gray-700/50 rounded-xl overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-700/50 flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-gray-200">
                    {eventMeta.get(eventName)?.display_name ?? eventName}
                  </span>
                  <code className="text-[11px] text-gray-500 bg-gray-900/60 px-1.5 py-0.5 rounded">{eventName}</code>
                  {eventMeta.get(eventName)?.reserved && (
                    <span className="text-[10px] text-amber-400 border border-amber-500/30 rounded-full px-2 py-0.5">reserved</span>
                  )}
                  <span className="ml-auto text-[11px] text-gray-500">{rows.length} endpoint{rows.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="divide-y divide-gray-800/60">
                  {rows.map(w => (
                    <WebhookRow key={w.id} hook={w} onChanged={load} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminShell>
  );
}

// ─── Webhook Row ───────────────────────────────────────────────────────────────

function WebhookRow({ hook, onChanged }) {
  const [url,      setUrl]      = useState(hook.url);
  const [saving,   setSaving]   = useState(false);
  const [busy,     setBusy]     = useState(false);
  const [testing,  setTesting]  = useState(false);
  const [rowMsg,   setRowMsg]   = useState('');
  const [preview,  setPreview]  = useState(null); // null | 'loading' | object
  const [confirmDelete, setConfirmDelete] = useState(false);
  const confirmTimer = React.useRef(null);
  const dirty = url.trim() !== hook.url;

  async function saveUrl() {
    setSaving(true);
    setRowMsg('');
    try {
      await api.patch(`/admin/event-webhooks/${hook.id}`, { url: url.trim() });
      setRowMsg('✓');
      onChanged();
    } catch (err) {
      setRowMsg(err.response?.data?.message || 'err');
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus() {
    setBusy(true);
    setRowMsg('');
    try {
      await api.patch(`/admin/event-webhooks/${hook.id}`, {
        status: hook.status === 'active' ? 'inactive' : 'active',
      });
      onChanged();
    } catch {
      setRowMsg('err');
    } finally {
      setBusy(false);
    }
  }

  // Two-click delete (no popup): 1st click arms "Sure?", 2nd click within 5s
  // deletes, otherwise it auto-resets.
  function handleDeleteClick() {
    if (confirmDelete) {
      if (confirmTimer.current) clearTimeout(confirmTimer.current);
      setConfirmDelete(false);
      doDelete();
      return;
    }
    setConfirmDelete(true);
    confirmTimer.current = setTimeout(() => setConfirmDelete(false), 5000);
  }

  async function doDelete() {
    setBusy(true);
    try {
      await api.delete(`/admin/event-webhooks/${hook.id}`);
      onChanged();
    } catch {
      setRowMsg('err');
      setBusy(false);
    }
  }

  async function testFire() {
    setTesting(true);
    setRowMsg('');
    try {
      const { data } = await api.post(`/admin/event-webhooks/${hook.id}/test`);
      setRowMsg(data.ok ? `✓ ${data.statusCode}` : `✗ ${data.errorMessage || data.statusCode || 'failed'}`);
      onChanged(); // refresh fires / last-fired
    } catch {
      setRowMsg('✗ test failed');
    } finally {
      setTesting(false);
    }
  }

  async function togglePreview() {
    if (preview) { setPreview(null); return; }
    setPreview('loading');
    try {
      const { data } = await api.get(`/admin/event-webhooks/preview?event_key=${encodeURIComponent(hook.event_name)}`);
      setPreview(data.payload ?? {});
    } catch {
      setPreview({ error: 'Could not load preview' });
    }
  }

  const isActive = hook.status === 'active';

  return (
    <div className="px-5 py-4 flex flex-col gap-3">
      <div className="flex items-center gap-3 flex-wrap">
        {/* Status toggle */}
        <button
          onClick={toggleStatus}
          disabled={busy}
          className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 border-transparent transition-colors
                      ${isActive ? 'bg-emerald-500' : 'bg-gray-700'} disabled:opacity-50`}
          title={isActive ? 'Active — click to pause' : 'Inactive — click to activate'}
        >
          <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform ${isActive ? 'translate-x-4' : 'translate-x-0'}`} />
        </button>
        <span className={`inline-flex items-center gap-1 text-[11px] font-semibold w-20 ${isActive ? 'text-emerald-400' : 'text-gray-500'}`}>
          {isActive ? '● Active' : '○ Disabled'}
        </span>

        {/* URL */}
        <input
          type="text"
          value={url}
          onChange={e => setUrl(e.target.value)}
          spellCheck="false"
          className="flex-1 min-w-[200px] bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-200
                     font-mono focus:outline-none focus:border-amber-500/60"
        />

        {/* Save (when URL edited) */}
        {dirty && (
          <button
            onClick={saveUrl}
            disabled={saving}
            className="px-3 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-xs font-semibold text-gray-900 rounded-lg"
          >
            {saving ? '…' : 'Save'}
          </button>
        )}

        {/* Preview */}
        <button
          onClick={togglePreview}
          className="px-2.5 py-2 bg-gray-700/60 border border-gray-600/60 text-gray-300 hover:text-gray-100 text-xs rounded-lg"
          title="Preview the payload this endpoint receives"
        >
          {preview ? 'Hide' : 'Preview'}
        </button>

        {/* Test */}
        <button
          onClick={testFire}
          disabled={testing}
          className="px-2.5 py-2 bg-sky-500/10 border border-sky-500/25 text-sky-300 hover:bg-sky-500/20 hover:text-sky-200 text-xs rounded-lg disabled:opacity-50"
          title="Send a sample payload to this endpoint now (logged to Webhook Log)"
        >
          {testing ? '…' : 'Test'}
        </button>

        {/* Delete — two-click confirm, no popup */}
        <button
          onClick={handleDeleteClick}
          disabled={busy}
          className={`px-2.5 py-2 border text-xs rounded-lg disabled:opacity-50 transition-colors inline-flex items-center gap-1
            ${confirmDelete
              ? 'bg-red-500/20 border-red-500/50 text-red-200 font-semibold'
              : 'bg-red-500/8 border-red-500/20 text-red-400 hover:bg-red-500/15 hover:text-red-300'}`}
          title="Delete"
        >
          {confirmDelete ? 'Sure?' : <BinIcon />}
        </button>

        {rowMsg && (
          <span className={`text-[11px] font-mono ${rowMsg === '✓' ? 'text-emerald-400' : 'text-red-400'}`}>{rowMsg}</span>
        )}
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-[11px] text-gray-500 pl-[88px]">
        <span>{hook.log_count?.toLocaleString?.() ?? 0} fires</span>
        <span>·</span>
        <span>
          Last fired:{' '}
          {hook.last_fired
            ? new Date(hook.last_fired).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
            : '—'}
        </span>
      </div>

      {/* Payload preview */}
      {preview && (
        <div className="pl-[88px]">
          <div className="bg-gray-900/70 border border-gray-700/50 rounded-lg p-3">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Sample payload</p>
            {preview === 'loading' ? (
              <p className="text-xs text-gray-500">Loading…</p>
            ) : (
              <pre className="text-[11px] text-gray-300 font-mono whitespace-pre-wrap break-all leading-relaxed max-h-72 overflow-y-auto">
                {JSON.stringify(preview, null, 2)}
              </pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Shell, skeleton, icons ──────────────────────────────────────────────────

function AdminShell({ title, children, onBack }) {
  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <header className="border-b border-gray-800 px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {onBack && (
            <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-200 transition-colors">
              <BackIcon />
              Dashboard
            </button>
          )}
          <h1 className="text-sm font-semibold text-gray-300">{title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-amber-500 select-none">{'▶︎'}</span>
          <span className="font-bold text-amber-500 tracking-tight text-sm">VidaPulse</span>
          <span className="ml-2 px-2 py-0.5 text-[10px] font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 rounded-full">
            Admin
          </span>
        </div>
      </header>
      <div className="flex-1 px-4 sm:px-6 py-8">{children}</div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-4 animate-pulse">
      {[1, 2, 3].map(i => (
        <div key={i} className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-5">
          <div className="h-3 w-40 bg-gray-700/60 rounded mb-4" />
          <div className="h-9 bg-gray-700/40 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

function BackIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

function BinIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  );
}
