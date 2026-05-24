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

          {/* ── Plan ───────────────────────────────────────────── */}
          <Section title="Plan & Usage">
            <Row
              label="Current plan"
              value={
                <span className="inline-flex items-center gap-2">
                  <PlanBadge plan={plan} displayName={user?.plan_display_name} />
                </span>
              }
            />
            <Row
              label="Videos tracked"
              value={
                user?.video_limit != null
                  ? `${upgradeData?.videos_count ?? user?.video_count ?? 0} / ${user.video_limit}`
                  : `${upgradeData?.videos_count ?? user?.video_count ?? 0} (unlimited)`
              }
            />
            <Row
              label="Total plays"
              value={(upgradeData?.total_plays_to_date ?? 0).toLocaleString()}
            />

            {/* Upgrade CTA — not shown for admin_lifetime or pro */}
            {plan === 'free' && upgradeData?.razorpay_links && (
              <div className="mt-4 pt-4 border-t border-gray-700/50 flex flex-col sm:flex-row gap-3">
                <UpgradeCard
                  name="Starter"
                  price="$10/mo"
                  videos="Up to 10 videos"
                  href={upgradeData.razorpay_links.starter}
                />
                <UpgradeCard
                  name="Pro"
                  price="$19/mo"
                  videos="Unlimited videos"
                  href={upgradeData.razorpay_links.pro}
                  highlight
                />
              </div>
            )}
            {plan === 'starter' && upgradeData?.razorpay_links && (
              <div className="mt-4 pt-4 border-t border-gray-700/50">
                <UpgradeCard
                  name="Pro"
                  price="$19/mo"
                  videos="Unlimited videos + advanced insights"
                  href={upgradeData.razorpay_links.pro}
                  highlight
                />
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
                <p className="text-sm text-gray-500 leading-relaxed">
                  If an admin ever accesses your account via impersonation, the activity
                  will be recorded here. Your data is yours and all admin access is logged.
                </p>
                <p className="text-xs text-gray-600 mt-1">No admin access recorded.</p>
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
      <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
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

function UpgradeCard({ name, price, videos, href, highlight = false }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex-1 rounded-xl p-4 border transition-colors
                  ${highlight
                    ? 'bg-amber-500/10 border-amber-500/40 hover:border-amber-500/60'
                    : 'bg-gray-700/30 border-gray-600 hover:border-gray-500'
                  }`}
    >
      <div className="flex items-center justify-between mb-1">
        <span className={`text-sm font-semibold ${highlight ? 'text-amber-300' : 'text-gray-200'}`}>
          {name}
        </span>
        <span className="text-xs text-gray-400">{price}</span>
      </div>
      <p className="text-xs text-gray-500">{videos}</p>
      <p className={`mt-2 text-xs font-medium ${highlight ? 'text-amber-400' : 'text-gray-400'}`}>
        Upgrade →
      </p>
    </a>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// PlanBadge
// ─────────────────────────────────────────────────────────────────────────

function PlanBadge({ plan, displayName }) {
  const classes = {
    free          : 'bg-gray-700/60 text-gray-300 border-gray-600',
    starter       : 'bg-amber-500/10 text-amber-300 border-amber-500/30',
    pro           : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30',
    admin_lifetime: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
  };
  return (
    <span className={`px-2 py-0.5 text-xs font-medium border rounded-full ${classes[plan] ?? classes.free}`}>
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
