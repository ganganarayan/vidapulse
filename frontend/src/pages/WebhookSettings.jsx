import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../lib/api';
import { useWebhookAlerts } from '../hooks/useWebhookAlerts';

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

  // Contact webhook alert status
  const webhookAlerts = useWebhookAlerts({ enabled: true });

  // Form state (mirrors webhook_settings)
  const [url,             setUrl]             = useState('');
  const [notifUrl,        setNotifUrl]        = useState('');
  const [secret,          setSecret]          = useState('');
  const [apiToken,        setApiToken]        = useState('');
  const [isActive,        setIsActive]        = useState(false);
  const [notes,           setNotes]           = useState('');

  // Password reset webhook
  const [passResetUrl,    setPassResetUrl]    = useState('');
  const [savingPassReset, setSavingPassReset] = useState(false);

  // Razorpay payment page URLs
  const [rzpStarterUrl,   setRzpStarterUrl]   = useState('');
  const [rzpProUrl,       setRzpProUrl]       = useState('');
  const [savingPayment,   setSavingPayment]   = useState(false);

  // Per-event onboarding "stage" webhook URLs (one Divine Leads automation each)
  const [signupUrl,    setSignupUrl]    = useState('');
  const [loginUrl,     setLoginUrl]     = useState('');
  const [videoUrl,     setVideoUrl]     = useState('');
  const [embedUrl,     setEmbedUrl]     = useState('');
  const [trackingUrl,  setTrackingUrl]  = useState('');
  const [savingStages, setSavingStages] = useState(false);

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
  const [showSecret,   setShowSecret]   = useState(false);
  const [showApiToken, setShowApiToken] = useState(false);

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
      setUrl(s.webhook_url              ?? '');
      setNotifUrl(s.notification_webhook_url ?? '');
      setSecret(s.webhook_secret        ?? '');
      setApiToken(s.api_token           ?? '');
      setIsActive(s.is_active           ?? false);
      setNotes(s.notes                  ?? '');
      setPassResetUrl(s.password_reset_webhook_url ?? '');
      setRzpStarterUrl(s.razorpay_starter_url ?? '');
      setRzpProUrl(s.razorpay_pro_url         ?? '');
      setSignupUrl(s.signup_webhook_url               ?? '');
      setLoginUrl(s.login_webhook_url                 ?? '');
      setVideoUrl(s.video_added_webhook_url           ?? '');
      setEmbedUrl(s.embed_generated_webhook_url       ?? '');
      setTrackingUrl(s.tracking_activated_webhook_url ?? '');
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
        webhook_url              : url      || null,
        notification_webhook_url : notifUrl || null,
        webhook_secret           : secret   || null,
        api_token                : apiToken || null,
        is_active                : isActive,
        notes                    : notes    || null,
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

  // ── Save password reset webhook URL ───────────────────────────────────
  async function handleSavePassReset(e) {
    e.preventDefault();
    setSavingPassReset(true);
    setSaveMsg('');
    try {
      await api.patch('/admin/webhook-settings', {
        password_reset_webhook_url: passResetUrl || null,
      });
      setSaveMsg('passreset-ok');
      setTimeout(() => setSaveMsg(''), 3000);
    } catch {
      setSaveMsg('passreset-err');
    } finally {
      setSavingPassReset(false);
    }
  }

  // ── Save payment URLs ──────────────────────────────────────────────────
  async function handleSavePayment(e) {
    e.preventDefault();
    setSavingPayment(true);
    setSaveMsg('');
    try {
      await api.patch('/admin/webhook-settings', {
        razorpay_starter_url: rzpStarterUrl || null,
        razorpay_pro_url    : rzpProUrl     || null,
      });
      setSaveMsg('payment-ok');
      setTimeout(() => setSaveMsg(''), 3000);
    } catch {
      setSaveMsg('payment-err');
    } finally {
      setSavingPayment(false);
    }
  }

  // ── Save onboarding stage webhooks ──────────────────────────────────────
  async function handleSaveStages(e) {
    e.preventDefault();
    setSavingStages(true);
    setSaveMsg('');
    try {
      await api.patch('/admin/webhook-settings', {
        signup_webhook_url             : signupUrl   || null,
        login_webhook_url              : loginUrl    || null,
        video_added_webhook_url        : videoUrl    || null,
        embed_generated_webhook_url    : embedUrl    || null,
        tracking_activated_webhook_url : trackingUrl || null,
      });
      setSaveMsg('stages-ok');
      setTimeout(() => setSaveMsg(''), 3000);
    } catch {
      setSaveMsg('stages-err');
    } finally {
      setSavingStages(false);
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

        {/* ── Routing moved to Event Webhooks ──────────────────────── */}
        <div className="bg-amber-500/8 border border-amber-500/25 rounded-xl p-4 flex items-start gap-3">
          <span className="text-amber-400 text-lg leading-none mt-0.5">⚡</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-amber-200">Per-event webhook routing has moved</p>
            <p className="text-xs text-amber-200/70 mt-1 leading-relaxed">
              Each event is now routed to its own endpoint(s) in{' '}
              <Link to="/admin/event-webhooks" className="text-amber-300 underline hover:text-amber-200">Event Webhooks</Link>.
              The URL fields below are legacy — they seeded the registry and no longer drive delivery. The API token and the
              master on/off toggle here still apply.
            </p>
          </div>
        </div>

        {/* ── Contact Webhook Status Banner ────────────────────────── */}
        {webhookAlerts.paused && (
          <WebhookAlertBanner
            queuedCount  = {webhookAlerts.queuedCount}
            pausedAt     = {webhookAlerts.pausedAt}
            pausedReason = {webhookAlerts.pausedReason}
            onRefresh    = {webhookAlerts.refresh}
          />
        )}

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
                type="text"
                inputMode="url"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
                name="webhook_endpoint_url"
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://hook.us1.make.com/…"
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5
                           text-sm text-gray-100 placeholder-gray-600
                           focus:outline-none focus:border-amber-500/60 transition-colors"
              />
            </div>

            {/* Notification Webhook URL */}
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">
                Failure Notification URL <span className="text-gray-400">(optional — different automation)</span>
              </label>
              <input
                type="text"
                inputMode="url"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
                value={notifUrl}
                onChange={e => setNotifUrl(e.target.value)}
                placeholder="https://login.vidapulse.io/api/automations/…/execute"
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5
                           text-sm text-gray-100 placeholder-gray-600
                           focus:outline-none focus:border-red-500/60 transition-colors"
              />
              <p className="text-xs text-gray-400 mt-1">
                Fired immediately on any webhook failure. Sends <code className="text-red-400/80 text-[10px]">event_type=webhook_failure_alert</code>{' '}
                with error details — triggers WhatsApp/email in your CRM.
              </p>
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-400"
                >
                  {showSecret ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Sent as <code className="text-amber-600 text-[10px]">X-VidaPulse-Signature</code> header with each request.
              </p>
            </div>

            {/* API Token */}
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">API Token (optional)</label>
              <div className="relative">
                <input
                  type={showApiToken ? 'text' : 'password'}
                  value={apiToken}
                  onChange={e => setApiToken(e.target.value)}
                  placeholder="Sent as api_token query param"
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5 pr-10
                             text-sm text-gray-100 placeholder-gray-600
                             focus:outline-none focus:border-amber-500/60 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowApiToken(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-400"
                >
                  {showApiToken ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Appended as <code className="text-amber-600 text-[10px]">?api_token=…</code> to every contact webhook request.
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
            <p className="text-xs text-gray-400 mt-5 border-t border-gray-700/50 pt-4">
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
          <div className="grid grid-cols-3 sm:grid-cols-3 gap-2 sm:gap-3 mb-6">
            <StatTile label="Fires this hour"  value={firesThisHr}                    accent="amber"   />
            <StatTile label="Queue depth"       value={queueDepth}                    accent="indigo"  />
            <StatTile label="Governor cap"      value={`${governor?.hourly_cap ?? 25}/hr`} accent="gray" />
          </div>

          {nextFireAt && (
            <p className="text-xs text-gray-400 mb-5">
              Next queued event: <span className="text-gray-400">{new Date(nextFireAt).toLocaleString()}</span>
            </p>
          )}

          <form onSubmit={handleSaveGovernor} className="flex flex-col gap-4">

            {/* Hourly cap */}
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">
                Hourly cap <span className="text-gray-400">(insight dispatch only)</span>
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
              <p className="text-xs text-gray-400 mt-1">
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

        {/* ── Section 4: Webhook Log Link ───────────────────────── */}
        <section className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-gray-300 mb-1">Contact Webhook Log</h2>
          <p className="text-xs text-gray-500 mb-4">
            A full audit trail of every outbound contact webhook — sent params, HTTP status, and response body.
          </p>
          <Link
            to="/admin/webhook-log"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600
                       text-sm text-gray-200 font-medium rounded-lg transition-colors border border-gray-600"
          >
            View webhook log →
          </Link>
        </section>

        {/* ── Section 5: Password Reset Webhook ────────────────── */}
        <section className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-gray-300 mb-1">Password Reset Webhook</h2>
          <p className="text-xs text-gray-500 mb-5">
            Fired whenever a subscriber requests a password reset. Use a separate automation
            here to send the reset email. Payload fields:{' '}
            <code className="text-amber-500/80 text-[11px]">contact_name</code>,{' '}
            <code className="text-amber-500/80 text-[11px]">contact_email</code>,{' '}
            <code className="text-amber-500/80 text-[11px]">contact.event_type = pass_reset</code>,{' '}
            <code className="text-amber-500/80 text-[11px]">contact.pass_reset_link</code>.
            Uses the API token above if set.
          </p>

          <form onSubmit={handleSavePassReset} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Webhook URL</label>
              <input
                type="text"
                inputMode="url"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
                value={passResetUrl}
                onChange={e => setPassResetUrl(e.target.value)}
                placeholder="https://login.vidapulse.io/api/automations/…/execute"
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5
                           text-sm text-gray-100 placeholder-gray-600
                           focus:outline-none focus:border-amber-500/60 transition-colors"
              />
            </div>
            <div className="flex items-center gap-3 pt-1">
              <button
                type="submit"
                disabled={savingPassReset}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50
                           text-sm font-semibold text-gray-900 rounded-lg transition-colors"
              >
                {savingPassReset ? 'Saving…' : 'Save'}
              </button>
              {saveMsg === 'passreset-ok'  && <span className="text-xs text-emerald-400">✓ Saved</span>}
              {saveMsg === 'passreset-err' && <span className="text-xs text-red-400">Save failed</span>}
            </div>
          </form>
        </section>

        {/* ── Section 7: Razorpay Payment Links ─────────────────── */}
        <section className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-gray-300 mb-1">Razorpay Payment Links</h2>
          <p className="text-xs text-gray-500 mb-5">
            Paste your Razorpay payment page URLs here (one per plan). When a subscriber
            clicks "Upgrade", VidaPulse appends their name, email and ID as query params
            so Razorpay pre-fills the form and the webhook can auto-upgrade their plan.
          </p>
          <p className="text-xs text-gray-400 mb-5">
            Razorpay webhook URL to configure:{' '}
            <code className="text-amber-500/80 text-xs sm:text-[11px] select-all">
              https://app.vidapulse.io/api/payments/razorpay
            </code>
            {' '}— subscribe to <code className="text-gray-400 text-[11px]">payment_link.paid</code> and{' '}
            <code className="text-gray-400 text-[11px]">payment.captured</code>.
          </p>

          <form onSubmit={handleSavePayment} className="flex flex-col gap-4">

            {/* Starter URL */}
            <div>
              <label className="block text-xs font-medium mb-1.5">
                <span className="text-amber-300">Starter plan</span>
                <span className="text-gray-400 ml-1.5 font-normal">— payment page URL</span>
              </label>
              <input
                type="text"
                inputMode="url"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
                value={rzpStarterUrl}
                onChange={e => setRzpStarterUrl(e.target.value)}
                placeholder="https://rzp.io/rzp/… or https://pages.razorpay.com/…"
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5
                           text-sm text-gray-100 placeholder-gray-600
                           focus:outline-none focus:border-amber-500/60 transition-colors"
              />
            </div>

            {/* Pro URL */}
            <div>
              <label className="block text-xs font-medium mb-1.5">
                <span className="text-indigo-300">Pro plan</span>
                <span className="text-gray-400 ml-1.5 font-normal">— payment page URL</span>
              </label>
              <input
                type="text"
                inputMode="url"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
                value={rzpProUrl}
                onChange={e => setRzpProUrl(e.target.value)}
                placeholder="https://rzp.io/rzp/… or https://pages.razorpay.com/…"
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5
                           text-sm text-gray-100 placeholder-gray-600
                           focus:outline-none focus:border-indigo-500/60 transition-colors"
              />
            </div>

            <p className="text-xs text-gray-400">
              VidaPulse appends <code className="text-[10px] text-gray-400">?name=…&amp;email=…&amp;notes[user_id]=…&amp;notes[plan]=…</code> when redirecting.
              Make sure your Razorpay page has a <strong className="text-gray-400">notes</strong> field or the webhook will upgrade based on notes alone.
            </p>

            <div className="flex items-center gap-3 pt-1">
              <button
                type="submit"
                disabled={savingPayment}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50
                           text-sm font-semibold text-gray-900 rounded-lg transition-colors"
              >
                {savingPayment ? 'Saving…' : 'Save payment links'}
              </button>
              {saveMsg === 'payment-ok'  && <span className="text-xs text-emerald-400">✓ Saved</span>}
              {saveMsg === 'payment-err' && <span className="text-xs text-red-400">Save failed</span>}
            </div>
          </form>
        </section>

        {/* ── Section 8: Onboarding Stage Webhooks ──────────────────── */}
        <section className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-gray-300 mb-1">Onboarding Stage Webhooks</h2>
          <p className="text-xs text-gray-500 mb-5">
            One dedicated Divine Leads automation per onboarding milestone. Each fires
            <strong className="text-gray-400"> once per user</strong> with a simple payload:{' '}
            <code className="text-amber-500/80 text-[11px]">contact_email</code>,{' '}
            <code className="text-amber-500/80 text-[11px]">contact.event_type</code>,{' '}
            <code className="text-amber-500/80 text-[11px]">contact.timestamp</code>.
            Leave a field blank to skip that event. Respects the master toggle + API token above.
          </p>

          <form onSubmit={handleSaveStages} className="flex flex-col gap-4">
            <StageUrlField label="Sign-up"            eventType="user_signed_up"     value={signupUrl}   onChange={setSignupUrl}   />
            <StageUrlField label="First login"        eventType="user_logged_in"     value={loginUrl}    onChange={setLoginUrl}    />
            <StageUrlField label="First video added"  eventType="first_video_added"  value={videoUrl}    onChange={setVideoUrl}    />
            <StageUrlField label="Embed generated"    eventType="embed_generated"    value={embedUrl}    onChange={setEmbedUrl}    />
            <StageUrlField label="Tracking activated" eventType="tracking_activated" value={trackingUrl} onChange={setTrackingUrl} />

            <div className="flex items-center gap-3 pt-1">
              <button
                type="submit"
                disabled={savingStages}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50
                           text-sm font-semibold text-gray-900 rounded-lg transition-colors"
              >
                {savingStages ? 'Saving…' : 'Save stage webhooks'}
              </button>
              {saveMsg === 'stages-ok'  && <span className="text-xs text-emerald-400">✓ Saved</span>}
              {saveMsg === 'stages-err' && <span className="text-xs text-red-400">Save failed</span>}
            </div>
          </form>
        </section>

      </div>
    </AdminShell>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Webhook Alert Banner
// ─────────────────────────────────────────────────────────────────────────

function WebhookAlertBanner({ queuedCount, pausedAt, pausedReason, onRefresh }) {
  const [resolving, setResolving] = useState('');
  const [resolveMsg,setResolveMsg]= useState('');

  async function handleUnpause() {
    setResolving('unpause');
    setResolveMsg('');
    try {
      await api.post('/admin/contact-webhook/unpause');
      setResolveMsg('Unpaused. Queued events will not be resent automatically — use "Resend queued" in Webhook Log.');
      await onRefresh();
    } catch {
      setResolveMsg('Failed to unpause. Refresh and try again.');
    } finally {
      setResolving('');
    }
  }

  async function handleResend() {
    setResolving('resend');
    setResolveMsg('');
    try {
      const { data } = await api.post('/admin/contact-webhook/resend-queued');
      if (data.nowPaused) {
        setResolveMsg(`Resend failed again after ${data.sent} — webhook re-paused. Fix the endpoint first.`);
      } else {
        setResolveMsg(`✓ Resent ${data.sent} of ${data.total} queued webhooks successfully.`);
      }
      await onRefresh();
    } catch {
      setResolveMsg('Resend request failed. Check your connection.');
    } finally {
      setResolving('');
    }
  }

  const pausedTime = pausedAt
    ? new Date(pausedAt).toLocaleString('en-GB', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })
    : null;

  return (
    <div className="bg-red-500/8 border border-red-500/30 rounded-xl p-5">
      <div className="flex items-start gap-3">
        <span className="text-red-400 text-xl mt-0.5 flex-shrink-0">⚠</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-red-300">Contact webhook is paused</p>
          {pausedTime && (
            <p className="text-xs text-red-400/70 mt-0.5">Paused at {pausedTime}</p>
          )}
          {pausedReason && (
            <p className="text-xs text-red-400/60 mt-1 font-mono break-all">{pausedReason}</p>
          )}
          {queuedCount > 0 && (
            <p className="text-xs text-amber-300 mt-2">
              <strong>{queuedCount}</strong> event{queuedCount !== 1 ? 's' : ''} queued and waiting to be resent.
            </p>
          )}

          <div className="flex items-center gap-2 mt-4 flex-wrap">
            <button
              onClick={handleResend}
              disabled={!!resolving || queuedCount === 0}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50
                         text-xs font-semibold text-gray-900 rounded-lg transition-colors"
            >
              {resolving === 'resend' ? 'Resending…' : `Resend ${queuedCount > 0 ? `${queuedCount} queued` : 'queued'}`}
            </button>
            <button
              onClick={handleUnpause}
              disabled={!!resolving}
              className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 disabled:opacity-50
                         text-xs font-medium text-gray-200 rounded-lg border border-gray-600 transition-colors"
            >
              {resolving === 'unpause' ? 'Unpausing…' : 'Unpause only (discard queue)'}
            </button>
            <Link
              to="/admin/webhook-log"
              className="px-3 py-1.5 text-xs text-gray-400 hover:text-gray-200 transition-colors"
            >
              View full log →
            </Link>
          </div>

          {resolveMsg && (
            <p className={`text-xs mt-3 ${resolveMsg.startsWith('✓') ? 'text-emerald-400' : 'text-red-400'}`}>
              {resolveMsg}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Shared sub-components
// ─────────────────────────────────────────────────────────────────────────

function StageUrlField({ label, eventType, value, onChange }) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1.5">
        <span className="text-gray-300">{label}</span>
        <code className="text-gray-500 ml-2 text-[10px]">{eventType}</code>
      </label>
      <input
        type="text"
        inputMode="url"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck="false"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="https://login.vidapulse.io/api/automations/…/execute"
        className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5
                   text-sm text-gray-100 placeholder-gray-600
                   focus:outline-none focus:border-amber-500/60 transition-colors"
      />
    </div>
  );
}

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
      <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">{label}</p>
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
