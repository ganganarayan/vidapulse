import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import AppLayout from '../components/AppLayout';

/**
 * AccountSettings
 *
 * Profile, plan info, and security log for the authenticated user.
 */
export default function AccountSettings() {
  const { user } = useAuth();
  const [upgradeData, setUpgradeData] = useState(null);

  // Fetch upgrade/plan data to get current video count + pricing links
  useEffect(() => {
    api.get('/upgrade').then(res => setUpgradeData(res.data)).catch(() => {});
  }, []);

  const plan = user?.plan ?? 'free';
  const isAdmin = user?.role === 'admin' || plan === 'admin_lifetime';

  return (
    <AppLayout>
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-2xl w-full mx-auto px-6 py-10">

          <h1 className="text-xl font-bold text-gray-50 mb-8">Account Settings</h1>

          {/* ── Profile ─────────────────────────────────────────── */}
          <Section title="Profile">
            <Row label="Name"  value={user?.name  ?? '—'} />
            <Row label="Email" value={user?.email ?? '—'} />
            <Row label="Role"  value={isAdmin ? 'Admin' : 'Subscriber'} />
          </Section>

          {/* ── Plan & Billing ─────────────────────────────────── */}
          <Section title="Plan & Billing">
            {/* Current plan highlight */}
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

            {/* Upgrade CTAs */}
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
                  {plan === 'admin_lifetime' ? 'Lifetime admin access — all features unlocked.' : 'Pro plan active — all features unlocked.'}
                </p>
              </div>
            )}
          </Section>

          {/* ── Security ───────────────────────────────────────── */}
          <Section title="Security">
            <div className="flex items-start gap-3 py-2">
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

          {/* ── Password ───────────────────────────────────────── */}
          <Section title="Password">
            <div className="py-2 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">
                  To change your password, use the forgot-password flow from the login page.
                </p>
              </div>
              <a
                href="/forgot-password"
                className="flex-shrink-0 ml-4 text-sm text-amber-400 hover:text-amber-300 transition-colors"
              >
                Reset password →
              </a>
            </div>
          </Section>

        </div>
      </main>
    </AppLayout>
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
  const props = href
    ? { href, target: '_blank', rel: 'noopener noreferrer' }
    : {};

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
      {href ? (
        <p className={`text-xs font-semibold ${highlight ? 'text-amber-400' : 'text-gray-300'}`}>
          Upgrade to {name} →
        </p>
      ) : (
        <p className="text-xs text-gray-500 italic">Payment link coming soon</p>
      )}
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
