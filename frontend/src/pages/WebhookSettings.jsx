import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';

/**
 * WebhookSettings — /admin/webhook
 *
 * Admin-only page for configuring the outbound webhook that powers
 * all behavioral event notifications (divineleads integration).
 *
 * Sections:
 *   1. Endpoint URL + secret key + active toggle
 *   2. Test webhook button with live result
 *   3. Governor panel: hourly cap + global pause + live counters
 */

export default function WebhookSettings() {
  const navigate = useNavigate();

  // Remote state
  const [loading,     setLoading]     = useState(true);
  const [fetchError,  setFetchError]  = useState('');
  const [settings,    setSettings]    = useState(null);  // webhook_settings row
  const [governor,    setGovernor]    = useState(null);  // webhook_governor row
  const [queueDepth,  setQueueDepth]  = useState(0);
  const [firesThisHr, setFiresThisHr] = useState(0);
  const [nextFireAt,  setNextFireAt]  = useState(null);

  // Form state (mirrors webhook_settings)
  const [url,      setUrl]      = useState('');
  const [secret,   setSecret]   = useState('');
  const [isActive, setIsActive] = useState(false);
  const [notes,    setNotes]    = useState('');

  // Governor form state
  const [hourlyCap, setHourlyCap] = useState(25);
  const [isPaused,  setIsPaused]  = useState(false);

  // Save states
  const [savingSettings, setSavingSettings] = useState(false);
  const [savingGov,      setSavingGov]      = useState(false);
  const [saveMsg,        setSaveMsg]        = useState('');

  // Test webhook state
  const [testing,    setTesting]    = useState(false);
  const [testResult, setTestResult] = useState(null); // { ok, statusCode, durationMs, responseBody }

  // Misc UI
  const [showSecret, setShowSecret] = useState(false);

  // ── Load settings ──────────────────────────────────────────────────────
  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/admin/webhook-settings');
      const s = data.settings ?? {};
      const g = data.governor ?? {};

      setSettings(s);
      setGovernor(g);
      setQueueDepth(data.queue_depth ?? 0);
      setFiresThisHr(data.fires_this_hour ?? 0);
      setNextFireAt(data.next_fire_at);

      // Sync form
      setUrl(s.webhook_url   ?? '');
      setSecret(s.webhook_secret ?? '');
      setIsActive(s.is_active    ?? false);
      setNotes(s.notes           ?? '');
      setHourlyCap(g.hourly_cap  ?? 25);
      setIsPaused(g.is_paused    ?? false);
    } catch (err) {
      if (err.response?.status === 403) {
        navigate('/dashboard');
      } else {
        setFetchError('Could not load webhook settings. Check your connection.');
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => { loadSettings(); }, [loadSettings]);

  // ── Save settings ──────────────────────────────────────────────────────
  async function handleSaveSettings(e) {
    e.preventDefault();
    setSavingSettings(true);
    setSaveMsg('');
    try {
      await api.patch('/admin/webhook-settings', {
        webhook_url   : url    || null,
        webhook_secret: secret || null,
        is_active     : isActive,
        notes         : notes  || null,
      });
      setSaveMsg('settings-ok');
      setTimeout(() => setSaveMsg(''), 3000);
    } catch {
      setSaveMsg('settings-err');
    } finally {
      setSavingSettings(false);
    }
  }

  // ── Save governor ──────────────────────────────────────────────────────
  async function handleSaveGovernor(e) {
    e.preventDefault();
    setSavingGov(true);
    setSaveMsg('');
    try {
      await api.patch('/admin/webhook-settings', {
        hourly_cap: Number(hourlyCap),
        is_paused : isPaused,
      });
      setSaveMsg('gov-ok');
      setTimeout(() => setSaveMsg(''), 3000);
    } catch {
      setSaveMsg('gov-err');
    } finally {
      setSavingGov(false);
    }
  }

  // ── Test webhook ───────────────────────────────────────────────────────
  async function handleTest() {
    setTesting(true);
    setTestResult(null);
    try {
      const { data } = await api.post('/admin/webhook-settings/test');
      setTestResult(data);
    } catch (err) {
      const msg = err.response?.data?.error ?? 'Test request failed';
      setTestResult({ ok: false, statusCode: 0, durationMs: 0, responseBody: msg });
    } finally {
      setTesting(false);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────

  if (loading) return <AdminShell title="Webhook Settings"><LoadingSkeleton /></AdminShell>;
  if (fetchError) return <AdminShell title="Webhook Settings"><ErrorState message={fetchError} onRetry={loadSettings} /></AdminShell>;

  const lastTested   = settings?.last_tested_at    ? new Date(settings.last_tested_at).toLocaleString() : null;
  const testStatus   = settings?.last_test_status;

  return (
    <AdminShell title="Webhook Settings" onBack={() => navigate('/dashboard')}>

      <div className="max-w-2xl mx-auto flex flex-col gap-8">

        {/* ── Section 1: Endpoint Config ────────────────────────────── */}
        <section className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-gray-300 mb-1">Webhook Endpoint</h2>
          <p className="text-xs text-gray-500 mb-5">
            All 14+ behavioral events post to this single URL. Paste your divineleads webhook
            endpoint once and activate below.
          </p>

          <form onSubmit={handleSaveSettings} className="flex flex-col gap-4">

            {/* URL */}
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Endpoint URL</label>
              <input
                type="url"
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://hook.us1.make.com/…"
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5
                           text-sm text-gray-100 placeholder-gray-600
                           focus:outline-none focus:border-amber-500/60 transition-colors"
              />
            </div>

            {/* Secret */}
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Signing Secret (optional)</label>
              <div className="relative">
                <input
                  type={showSecret ? 'text' : 'password'}
                  value={secret}
                  onChange={e => setSecret(e.target.value)}
                  placeholder="HMAC-SHA256 signing key"
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5 pr-10
                             text-sm text-gray-100 placeholder-gray-600
                             focus:outline-none focus:border-amber-500/60 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowSecret(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400"
                >
                  {showSecret ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                Sent as <code className="text-amber-600 text-[10px]">X-VidaPulse-Signature</code> header with each request.
              </p>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Notes (internal)</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={2}
                placeholder="e.g. Make.com scenario #5, last updated …"
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5
                           text-sm text-gray-100 placeholder-gray-600 resize-none
                           focus:outline-none focus:border-amber-500/60 transition-colors"
              />
            </div>

            {/* Active toggle */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-300 font-medium">Send webhook events</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  When OFF, all events are queued but not fired.
                </p>
              </div>
              <Toggle value={isActive} onChange={setIsActive} />
            </div>

            {/* Save */}
            <div className="flex items-center gap-3 pt-1">
              <button
                type="submit"
                disabled={savingSettings}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50
                           text-sm font-semibold text-gray-900 rounded-lg transition-colors"
              >
                {savingSettings ? 'Saving…' : 'Save settings'}
              </button>
              {saveMsg === 'settings-ok'  && <span className="text-xs text-emerald-400">✓ Saved</span>}
              {saveMsg === 'settings-err' && <span className="text-xs text-red-400">Save failed</span>}
            </div>
          </form>

          {/* Last test status */}
          {lastTested && (
            <p className="text-xs text-gray-600 mt-5 border-t border-gray-700/50 pt-4">
              Last tested: {lastTested}
              {' '}·{' '}
              <span className={testStatus === 'success' ? 'text-emerald-400' : 'text-red-400'}>
                {testStatus === 'success' ? '✓ Success' : '✕ Failed'}
              </span>
              {settings.last_test_error && (
                <span className="text-red-400/60"> — {settings.last_test_error}</span>
              )}
            </p>
          )}
        </section>

        {/* ── Section 2: Test Webhook ───────────────────────────────── */}
        <section className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-gray-300 mb-1">Test Connection</h2>
          <p className="text-xs text-gray-500 mb-4">
            Fires a <code className="text-amber-600 text-[10px]">webhook_test</code> event to your endpoint immediately.
            The URL must be saved and active before testing.
          </p>

          <button
            onClick={handleTest}
            disabled={testing || !url}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600
                       disabled:opacity-40 text-sm text-gray-200 font-medium
                       rounded-lg transition-colors border border-gray-600"
          >
            {testing ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                Sending…
              </>
            ) : (
              <>
                <BoltIcon />
                Send test event
              </>
            )}
          </button>

          {testResult && (
            <div
              className={`mt-4 rounded-lg border px-4 py-3 text-sm
                          ${testResult.ok
                            ? 'bg-emerald-500/5 border-emerald-500/20'
                            : 'bg-red-500/5 border-red-500/20'}`}
            >
              <p className={`font-medium mb-1 ${testResult.ok ? 'text-emerald-300' : 'text-red-300'}`}>
                {testResult.ok ? '✓ Webhook delivered successfully' : '✕ Delivery failed'}
              </p>
              <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                {testResult.statusCode > 0 && <span>HTTP {testResult.statusCode}</span>}
                {testResult.durationMs > 0  && <span>{testResult.durationMs} ms</span>}
                {testResult.responseBody    && (
                  <span className="break-all max-w-sm">{String(testResult.responseBody).slice(0, 200)}</span>
                )}
              </div>
            </div>
          )}
        </section>

        {/* ── Section 3: Governor Panel ─────────────────────────────── */}
        <section className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-gray-300 mb-1">Dispatch Governor</h2>
          <p className="text-xs text-gray-500 mb-5">
            Controls the insight email dispatch worker. Standard behavioral events
            (sign-up, video added, limit hit) are not subject to these caps.
          </p>

          {/* Live counters */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <StatTile label="Fires this hour"  value={firesThisHr}                    accent="amber"   />
            <StatTile label="Queue depth"       value={queueDepth}                    accent="indigo"  />
            <StatTile label="Governor cap"      value={`${governor?.hourly_cap ?? 25}/hr`} accent="gray" />
          </div>

          {nextFireAt && (
            <p className="text-xs text-gray-600 mb-5">
              Next queued event: <span className="text-gray-400">{new Date(nextFireAt).toLocaleString()}</span>
            </p>
          )}

          <form onSubmit={handleSaveGovernor} className="flex flex-col gap-4">

            {/* Hourly cap */}
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">
                Hourly cap <span className="text-gray-600">(insight dispatch only)</span>
              </label>
              <input
                type="number"
                min="1"
                max="1000"
                value={hourlyCap}
                onChange={e => setHourlyCap(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-28 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5
                           text-sm text-gray-100 tabular-nums
                           focus:outline-none focus:border-amber-500/60 transition-colors"
              />
              <p className="text-xs text-gray-600 mt-1">
                Dispatch worker stops after this many fires per hour. Default: 25.
              </p>
            </div>

            {/* Global pause */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-300 font-medium">Global pause</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Stops ALL insight email dispatch. Standard events still fire.
                </p>
              </div>
              <Toggle value={isPaused} onChange={setIsPaused} danger />
            </div>

            {isPaused && (
              <div className="flex items-start gap-2 bg-red-500/5 border border-red-500/20 rounded-lg px-3 py-2.5">
                <span className="text-red-400 text-sm mt-0.5">⚠</span>
                <p className="text-xs text-red-300">
                  Dispatch is paused. No insight emails will be sent until you un-pause.
                </p>
              </div>
            )}

            <div className="flex items-center gap-3 pt-1">
              <button
                type="submit"
                disabled={savingGov}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50
                           text-sm font-semibold text-gray-900 rounded-lg transition-colors"
              >
                {savingGov ? 'Saving…' : 'Save governor'}
              </button>
              {saveMsg === 'gov-ok'  && <span className="text-xs text-emerald-400">✓ Saved</span>}
              {saveMsg === 'gov-err' && <span className="text-xs text-red-400">Save failed</span>}
            </div>
          </form>
        </section>

      </div>
    </AdminShell>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Shared sub-components
// ─────────────────────────────────────────────────────────────────────────

function AdminShell({ title, children, onBack }) {
  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <header className="border-b border-gray-800 px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-200 transition-colors"
            >
              <BackIcon />
              Dashboard
            </button>
          )}
          <h1 className="text-sm font-semibold text-gray-300">{title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-amber-500 select-none">{'▶︎'}</span>
          <span className="font-bold text-amber-500 tracking-tight text-sm">VidaPulse</span>
          <span className="ml-2 px-2 py-0.5 text-[10px] font-medium bg-emerald-500/10
                           text-emerald-300 border border-emerald-500/20 rounded-full">
            Admin
          </span>
        </div>
      </header>
      <div className="flex-1 px-4 sm:px-6 py-10">
        {children}
      </div>
    </div>
  );
}

function Toggle({ value, onChange, danger = false }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full
                  border-2 border-transparent transition-colors duration-200
                  focus:outline-none
                  ${value
                    ? (danger ? 'bg-red-500' : 'bg-amber-500')
                    : 'bg-gray-700'}`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow
                    transition-transform duration-200
                    ${value ? 'translate-x-5' : 'translate-x-0'}`}
      />
    </button>
  );
}

function StatTile({ label, value, accent }) {
  const colors = {
    amber : 'text-amber-400',
    indigo: 'text-indigo-400',
    gray  : 'text-gray-300',
  };
  return (
    <div className="bg-gray-900/50 border border-gray-700/50 rounded-lg px-3 py-3">
      <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-xl font-bold tabular-nums ${colors[accent] ?? colors.gray}`}>
        {value}
      </p>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="max-w-2xl mx-auto animate-pulse flex flex-col gap-8">
      {[1, 2, 3].map(i => (
        <div key={i} className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6">
          <div className="h-4 w-40 bg-gray-700/60 rounded mb-4" />
          {[1, 2].map(j => (
            <div key={j} className="h-10 bg-gray-700/40 rounded-lg mb-3" />
          ))}
        </div>
      ))}
    </div>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="max-w-sm mx-auto text-center py-20">
      <p className="text-gray-400 text-sm mb-4">{message}</p>
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-sm text-gray-200
                   rounded-lg border border-gray-700 transition-colors"
      >
        Retry
      </button>
    </div>
  );
}

// ── Inline SVG icons ─────────────────────────────────────────────────────

function BackIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function BoltIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}
