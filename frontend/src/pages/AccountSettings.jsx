import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import api from '../lib/api';
import AppLayout from '../components/AppLayout';

/**
 * AccountSettings
 *
 * Profile (with inline name editing), plan/billing, security, and
 * inline password-change form.
 *
 * Toast system: amber chip that slides in from bottom-right and
 * auto-dismisses after 5 seconds.
 */
export default function AccountSettings() {
  const { user, updateUser } = useAuth();
  const { showToast }        = useToast();
  const [upgradeData, setUpgradeData] = useState(null);

  useEffect(() => {
    api.get('/upgrade').then(res => setUpgradeData(res.data)).catch(() => {});
  }, []);

  const plan    = user?.plan ?? 'free';
  const isAdmin = user?.role === 'admin' || plan === 'admin_lifetime';

  return (
    <AppLayout>
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-2xl w-full mx-auto px-6 py-10">

          <h1 className="text-xl font-bold text-gray-50 mb-8">Account Settings</h1>

          {/* ── Profile ───────────────────────────────────────── */}
          <Section title="Profile">
            <EditableNameRow
              user={user}
              updateUser={updateUser}
              onToast={showToast}
            />
            <Row label="Email" value={user?.email ?? '—'} />
            <Row label="Role"  value={isAdmin ? 'Admin' : 'Subscriber'} />
          </Section>

          {/* ── Plan & Billing ─────────────────────────────────── */}
          <Section title="Plan & Billing">
            <div className="px-4 py-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-1">Current plan</p>
                  <div className="flex items-center gap-2">
                    <PlanBadge plan={plan} displayName={user?.plan_display_name} large />
                    {plan === 'free' && (
                      <span className="text-xs text-emerald-400 font-medium">Free forever</span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400 mb-1">Videos tracked</p>
                  <p className="text-sm font-semibold text-gray-200">
                    {user?.video_limit != null
                      ? `${upgradeData?.videos_count ?? user?.video_count ?? 0} / ${user.video_limit}`
                      : `${upgradeData?.videos_count ?? user?.video_count ?? 0}`}
                    {user?.video_limit == null && (
                      <span className="text-xs text-gray-400 ml-1">unlimited</span>
                    )}
                  </p>
                </div>
              </div>

              {/* Usage bar for capped plans */}
              {user?.video_limit != null && (() => {
                const used = upgradeData?.videos_count ?? user?.video_count ?? 0;
                const pct  = Math.min(100, Math.round((used / user.video_limit) * 100));
                return (
                  <div>
                    <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${pct >= 90 ? 'bg-rose-500' : pct >= 70 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{pct}% of your video limit used</p>
                  </div>
                );
              })()}

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-700/50">
                <span className="text-xs text-gray-400">Total plays recorded</span>
                <span className="text-sm font-medium text-gray-200">
                  {(upgradeData?.total_plays_to_date ?? 0).toLocaleString()}
                </span>
              </div>
            </div>

            {(plan === 'free' || plan === 'starter') && (
              <div className="px-4 pb-4 border-t border-gray-700/50">
                <p className="text-xs text-gray-400 font-medium mt-4 mb-3 uppercase tracking-wider">
                  {plan === 'free' ? 'Upgrade to unlock more' : 'Upgrade to Pro'}
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  {plan === 'free' && (
                    <UpgradeCard
                      name="Starter"
                      price="$10/mo"
                      features={['Up to 10 videos', 'Full analytics', 'Embed tracking']}
                      href={upgradeData?.razorpay_links?.starter ?? null}
                    />
                  )}
                  <UpgradeCard
                    name="Pro"
                    price="$19/mo"
                    features={['Unlimited videos', 'Advanced insights', 'Priority support']}
                    href={upgradeData?.razorpay_links?.pro ?? null}
                    highlight
                  />
                </div>
              </div>
            )}

            {(plan === 'pro' || plan === 'admin_lifetime') && (
              <div className="px-4 py-3 border-t border-gray-700/50 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
                <p className="text-sm text-gray-300">
                  {plan === 'admin_lifetime'
                    ? 'Lifetime admin access — all features unlocked.'
                    : 'Pro plan active — all features unlocked.'}
                </p>
              </div>
            )}
          </Section>

          {/* ── Change Password ────────────────────────────────── */}
          <Section title="Password">
            <ChangePasswordForm onToast={showToast} />
          </Section>

          {/* ── Security ───────────────────────────────────────── */}
          <Section title="Security">
            <div className="flex items-start gap-3 px-4 py-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mt-0.5">
                <LockIcon />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-200 mb-0.5">Admin access log</p>
                <p className="text-sm text-gray-400 leading-relaxed">
                  If an admin ever accesses your account via impersonation, the activity
                  will be recorded here. Your data is yours and all admin access is logged.
                </p>
                <p className="text-xs text-gray-500 mt-1">No admin access recorded.</p>
              </div>
            </div>
          </Section>

        </div>
      </main>

    </AppLayout>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// EditableNameRow — name field with pencil → inline edit → save
// ─────────────────────────────────────────────────────────────────────────

function EditableNameRow({ user, updateUser, onToast }) {
  const [editing, setEditing] = useState(false);
  const [name,    setName]    = useState(user?.name ?? '');
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');
  const inputRef = useRef(null);

  // Sync if user object changes externally
  useEffect(() => {
    if (!editing) setName(user?.name ?? '');
  }, [user?.name, editing]);

  useEffect(() => {
    if (editing) setTimeout(() => inputRef.current?.focus(), 30);
  }, [editing]);

  async function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) { setError('Name cannot be empty'); return; }
    if (trimmed === user?.name) { setEditing(false); return; }
    setSaving(true);
    setError('');
    try {
      const { data } = await api.patch('/auth/me', { name: trimmed });
      updateUser({ name: data.user.name });
      setEditing(false);
      onToast('Name updated successfully');
    } catch (err) {
      setError(err.response?.data?.message ?? 'Could not save. Try again.');
    } finally {
      setSaving(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter')  handleSave();
    if (e.key === 'Escape') { setEditing(false); setName(user?.name ?? ''); setError(''); }
  }

  return (
    <div className="flex items-center justify-between px-4 py-3 gap-3">
      <span className="text-sm text-gray-400 flex-shrink-0">Name</span>

      {editing ? (
        <div className="flex items-center gap-2 flex-1 justify-end">
          <div className="flex flex-col items-end gap-1">
            <input
              ref={inputRef}
              value={name}
              onChange={e => { setName(e.target.value); setError(''); }}
              onKeyDown={handleKeyDown}
              maxLength={200}
              disabled={saving}
              className="bg-gray-700 border border-gray-600 focus:border-amber-500 text-gray-100
                         text-sm rounded-lg px-3 py-1.5 focus:outline-none w-52 text-right"
            />
            {error && <p className="text-xs text-red-400">{error}</p>}
          </div>
          <button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="px-3 py-1.5 text-xs font-semibold bg-amber-500 hover:bg-amber-400
                       text-gray-900 rounded-lg transition-colors disabled:opacity-50 flex-shrink-0"
          >
            {saving ? '…' : 'Save'}
          </button>
          <button
            onClick={() => { setEditing(false); setName(user?.name ?? ''); setError(''); }}
            className="px-2 py-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors flex-shrink-0"
          >
            Cancel
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-200 font-medium">{user?.name ?? '—'}</span>
          <button
            onClick={() => setEditing(true)}
            className="p-1 rounded text-gray-600 hover:text-gray-300 transition-colors"
            title="Edit name"
          >
            <PencilIcon />
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// ChangePasswordForm — new password + confirm, no current password required
// ─────────────────────────────────────────────────────────────────────────

function ChangePasswordForm({ onToast }) {
  const [newPw,     setNewPw]     = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState('');
  const [showNew,   setShowNew]   = useState(false);
  const [showConf,  setShowConf]  = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (newPw.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (newPw !== confirmPw) {
      setError('Passwords do not match');
      return;
    }
    setSaving(true);
    try {
      await api.patch('/auth/me', {
        new_password    : newPw,
        confirm_password: confirmPw,
      });
      setNewPw('');
      setConfirmPw('');
      onToast('Password changed successfully');
    } catch (err) {
      setError(err.response?.data?.message ?? 'Could not update password.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="px-4 py-4">
      <p className="text-xs text-gray-400 mb-4">
        Set a new password for your account. You'll remain logged in after changing it.
      </p>

      <div className="flex flex-col gap-3 mb-4">
        {/* New password */}
        <div>
          <label className="block text-xs text-gray-400 mb-1.5">New password</label>
          <div className="relative">
            <input
              type={showNew ? 'text' : 'password'}
              value={newPw}
              onChange={e => { setNewPw(e.target.value); setError(''); }}
              placeholder="Min. 8 characters"
              autoComplete="new-password"
              disabled={saving}
              className="w-full bg-gray-700 border border-gray-600 focus:border-amber-500
                         text-gray-100 placeholder-gray-500 text-sm rounded-lg px-3 py-2.5
                         pr-10 focus:outline-none transition-colors"
            />
            <button type="button" onClick={() => setShowNew(v => !v)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
              {showNew ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
        </div>

        {/* Confirm password */}
        <div>
          <label className="block text-xs text-gray-400 mb-1.5">Confirm new password</label>
          <div className="relative">
            <input
              type={showConf ? 'text' : 'password'}
              value={confirmPw}
              onChange={e => { setConfirmPw(e.target.value); setError(''); }}
              placeholder="Repeat new password"
              autoComplete="new-password"
              disabled={saving}
              className="w-full bg-gray-700 border border-gray-600 focus:border-amber-500
                         text-gray-100 placeholder-gray-500 text-sm rounded-lg px-3 py-2.5
                         pr-10 focus:outline-none transition-colors"
            />
            <button type="button" onClick={() => setShowConf(v => !v)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
              {showConf ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
        </div>

        {/* Strength hint */}
        {newPw.length > 0 && (
          <PasswordStrength password={newPw} />
        )}
      </div>

      {error && (
        <p className="text-xs text-red-400 mb-3">{error}</p>
      )}

      <button
        type="submit"
        disabled={saving || !newPw || !confirmPw}
        className="px-4 py-2 text-sm font-semibold bg-amber-500 hover:bg-amber-400
                   text-gray-900 rounded-lg transition-colors disabled:opacity-40
                   disabled:cursor-not-allowed"
      >
        {saving ? 'Saving…' : 'Change password'}
      </button>
    </form>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// PasswordStrength — simple visual indicator
// ─────────────────────────────────────────────────────────────────────────

function PasswordStrength({ password }) {
  const len    = password.length;
  const hasUpper = /[A-Z]/.test(password);
  const hasNum   = /[0-9]/.test(password);
  const hasSpec  = /[^A-Za-z0-9]/.test(password);
  const score    = [len >= 8, len >= 12, hasUpper, hasNum, hasSpec].filter(Boolean).length;

  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very strong'];
  const colors = ['', 'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-emerald-500', 'bg-emerald-400'];
  const textColors = ['', 'text-red-400', 'text-orange-400', 'text-amber-400', 'text-emerald-400', 'text-emerald-300'];

  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-1 flex-1">
        {[1,2,3,4,5].map(i => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= score ? colors[score] : 'bg-gray-700'}`} />
        ))}
      </div>
      <span className={`text-xs font-medium flex-shrink-0 ${textColors[score]}`}>{labels[score]}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Section wrapper
// ─────────────────────────────────────────────────────────────────────────

function Section({ title, children }) {
  return (
    <div className="mb-8">
      <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
        {title}
      </h2>
      <div className="bg-gray-800 border border-gray-700 rounded-xl divide-y divide-gray-700/60">
        {children}
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-sm text-gray-400">{label}</span>
      <span className="text-sm text-gray-200 font-medium text-right">{value}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// UpgradeCard
// ─────────────────────────────────────────────────────────────────────────

function UpgradeCard({ name, price, features = [], href, highlight = false }) {
  const Tag   = href ? 'a' : 'div';
  const props = href ? { href, target: '_blank', rel: 'noopener noreferrer' } : {};

  return (
    <Tag
      {...props}
      className={`flex-1 rounded-xl p-4 border transition-colors
                  ${highlight
                    ? 'bg-amber-500/10 border-amber-500/40 hover:border-amber-500/60'
                    : 'bg-gray-700/30 border-gray-600/80 hover:border-gray-500'
                  }
                  ${href ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className={`text-sm font-semibold ${highlight ? 'text-amber-300' : 'text-gray-200'}`}>
          {name}
        </span>
        <span className={`text-sm font-bold ${highlight ? 'text-amber-400' : 'text-gray-300'}`}>{price}</span>
      </div>
      <ul className="space-y-1 mb-3">
        {features.map(f => (
          <li key={f} className="flex items-center gap-1.5 text-xs text-gray-400">
            <span className={`w-1 h-1 rounded-full flex-shrink-0 ${highlight ? 'bg-amber-500' : 'bg-gray-500'}`} />
            {f}
          </li>
        ))}
      </ul>
      {href
        ? <p className={`text-xs font-semibold ${highlight ? 'text-amber-400' : 'text-gray-300'}`}>Upgrade to {name} →</p>
        : <p className="text-xs text-gray-500 italic">Payment link coming soon</p>
      }
    </Tag>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// PlanBadge
// ─────────────────────────────────────────────────────────────────────────

function PlanBadge({ plan, displayName, large = false }) {
  const classes = {
    free          : 'bg-gray-700/60 text-gray-200 border-gray-600',
    starter       : 'bg-amber-500/15 text-amber-300 border-amber-500/40',
    pro           : 'bg-indigo-500/15 text-indigo-300 border-indigo-500/40',
    admin_lifetime: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
  };
  return (
    <span className={`${large ? 'px-3 py-1 text-sm' : 'px-2 py-0.5 text-xs'} font-semibold border rounded-full ${classes[plan] ?? classes.free}`}>
      {displayName ?? plan}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────────────────

function LockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
      className="text-amber-500"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    >
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    >
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}
