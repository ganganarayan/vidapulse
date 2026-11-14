import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import AppLayout from '../components/AppLayout';
import { startSubscriptionCheckout } from '../lib/razorpayCheckout';
import BillingCycleToggle from '../components/upgrade/BillingCycleToggle';
import { getLockColor } from '../components/PlanTierBadge';

/**
 * UpgradePage — /upgrade
 *
 * Shows the user their current plan and upgrade options.
 * "Upgrade" opens Razorpay Checkout in-page. The server picks the currency
 * (INR in India, USD elsewhere) and the amount for the chosen cycle, creates
 * the subscription, and confirms it after payment. Nothing is configured by
 * the owner.
 */

const PLAN_ORDER = { free: 0, starter: 1, pro: 2, admin_lifetime: 3 };

export default function UpgradePage() {
  const { user }    = useAuth();
  const navigate    = useNavigate();

  const [upgradeData,     setUpgradeData]     = useState(null);
  const [loading,         setLoading]         = useState(true);
  const [error,           setError]           = useState('');
  const [cycle,           setCycle]           = useState('monthly');
  const [busy,            setBusy]            = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/upgrade');
      setUpgradeData(data);
    } catch {
      setError('Could not load upgrade options. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // In-page Razorpay Checkout; the server sets currency, amount and plan.
  async function handleUpgrade(plan) {
    if (busy) return;
    setError('');
    setBusy(plan);
    await startSubscriptionCheckout({
      plan,
      cycle,
      user,
      onError  : (msg) => { setError(msg); setBusy(null); },
      onDismiss: () => setBusy(null),
    });
  }

  const yr     = cycle === 'yearly';
  const suffix = yr ? '/ year' : '/ month';
  const labelFor = (plan, fallbackMonthly) =>
    upgradeData?.pricing?.[plan]?.[cycle]?.label
      ?? `$${yr ? fallbackMonthly * 10 : fallbackMonthly}`;

  const currentPlan = user?.plan ?? 'free';
  const upgradeOptions = upgradeData?.upgrade_options ?? [];

  return (
    <AppLayout>
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-xl font-bold text-gray-100">Plans & Pricing</h1>
            <p className="text-sm text-gray-400 mt-1">
              You're currently on the <CurrentPlanBadge plan={currentPlan} displayName={user?.plan_display_name} /> plan.
              {upgradeOptions.length === 0 && <span className="ml-1 text-gray-500">You're already on the best plan!</span>}
            </p>
            <BillingCycleToggle cycle={cycle} onChange={setCycle} className="mt-4" />
          </div>

          {loading ? (
            <LoadingSkeleton />
          ) : error ? (
            <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-6 text-center">
              <p className="text-sm text-red-400 mb-3">{error}</p>
              <button onClick={load} className="text-xs text-gray-400 hover:text-gray-200 transition-colors">Retry</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

              {/* Free plan */}
              <PlanCard
                planKey     = "free"
                name        = "Free"
                tagline     = "Forever free — no credit card"
                price       = {upgradeData?.currency === 'INR' ? '₹0' : '$0'}
                priceSuffix = "forever"
                features    = {[
                  '3 videos',
                  'Basic analytics (plays, viewers)',
                  'Engagement heatmap preview',
                  'Share & embed player',
                  'Community support',
                ]}
                current     = {currentPlan === 'free'}
                canUpgrade  = {false}
                accent      = "gray"
              />

              {/* Starter plan */}
              <PlanCard
                planKey          = "starter"
                name             = "Starter"
                tagline          = "For creators growing their audience"
                price            = {labelFor('starter', 29)}
                priceSuffix      = {suffix}
                features         = {[
                  '10 videos',
                  'Full analytics dashboard',
                  'Viewer stories',
                  'Drop-off rate & watch time',
                  'Traffic sources & geography',
                  'Priority email support',
                ]}
                current          = {currentPlan === 'starter'}
                canUpgrade       = {upgradeOptions.includes('starter')}
                onUpgrade        = {() => handleUpgrade('starter')}
                noLink           = {false}
                accent           = "amber"
              />

              {/* Pro plan */}
              <PlanCard
                planKey          = "pro"
                name             = "Pro"
                tagline          = "For any serious business, B2B or B2C, to scale through video marketing"
                price            = {labelFor('pro', 79)}
                priceSuffix      = {suffix}
                features         = {[
                  '20 videos',
                  'All Starter features',
                  'Engagement heatmap (full)',
                  'CTA tracking & conversion',
                  'AI-powered video insights',
                  'Custom player branding',
                  'Dedicated support',
                ]}
                current          = {currentPlan === 'pro' || currentPlan === 'admin_lifetime'}
                canUpgrade       = {upgradeOptions.includes('pro')}
                onUpgrade        = {() => handleUpgrade('pro')}
                noLink           = {false}
                accent           = "indigo"
                recommended      = {currentPlan === 'free' || currentPlan === 'starter'}
              />

            </div>
          )}

          {/* Fine print */}
          {!loading && !error && (
            <div className="mt-8 text-center">
              <p className="text-xs text-gray-400">
                Payments are processed securely by Razorpay.
                Your plan activates automatically within minutes of payment.
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Questions?{' '}
                <button onClick={() => navigate('/help')} className="text-amber-500/80 hover:text-amber-400 transition-colors">
                  Contact support
                </button>
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Need more than 20 videos?{' '}
                <a href="mailto:support@vidapulse.io" className="text-amber-400 hover:text-amber-300 transition-colors">
                  Contact support@vidapulse.io
                </a>
              </p>
            </div>
          )}

        </div>
      </div>
    </AppLayout>
  );
}

// ─── Plan Card ────────────────────────────────────────────────────────────────

function PlanCard({
  planKey, name, tagline, price, priceSuffix, features,
  current, canUpgrade, onUpgrade, noLink, recommended,
}) {
  // Starter=#00FFFF  Pro=#F59E0B  Free=null (gray)
  const color = (planKey === 'starter' || planKey === 'pro') ? getLockColor(planKey) : null;

  const cardBorderStyle = color && recommended
    ? { borderColor: `${color}44`, boxShadow: `0 4px 24px -4px ${color}18` }
    : {};

  return (
    <div className="relative flex flex-col bg-gray-800/50 border border-gray-700/50 rounded-xl p-5"
         style={cardBorderStyle}>

      {/* Most Popular badge */}
      {recommended && color && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="px-3 py-0.5 text-[10px] font-bold text-gray-900 rounded-full uppercase tracking-wider"
                style={{ background: color }}>
            Most Popular
          </span>
        </div>
      )}

      {/* Plan name + current badge */}
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-base font-bold text-gray-100">{name}</h2>
        {current && color && (
          <span className="px-2 py-0.5 text-[10px] font-medium border rounded-full"
                style={{ color, background: `${color}18`, borderColor: `${color}40` }}>
            Current plan
          </span>
        )}
        {current && !color && (
          <span className="px-2 py-0.5 text-[10px] font-medium border rounded-full
                           bg-gray-700/60 text-gray-300 border-gray-600/40">
            Current plan
          </span>
        )}
      </div>

      {/* Tagline */}
      <p className="text-xs text-gray-500 mb-4">{tagline}</p>

      {/* Price */}
      <div className="mb-5">
        <span className="text-2xl font-bold text-gray-100">{price}</span>
        <span className="text-xs text-gray-500 ml-1.5">{priceSuffix}</span>
      </div>

      {/* Features */}
      <ul className="flex-1 space-y-2 mb-6">
        {features.map(f => (
          <li key={f} className="flex items-start gap-2 text-xs text-gray-400">
            <span className="text-emerald-400 flex-shrink-0 mt-0.5">✓</span>
            {f}
          </li>
        ))}
      </ul>

      {/* CTA */}
      {current ? (
        <div className="w-full py-2 rounded-lg text-center text-xs font-medium
                        bg-gray-700/50 text-gray-500 border border-gray-700/50">
          Your current plan
        </div>
      ) : canUpgrade ? (
        noLink ? (
          <div className="w-full py-2 rounded-lg text-center text-xs text-gray-400
                          bg-gray-800 border border-gray-700/50 cursor-not-allowed">
            Payment link coming soon
          </div>
        ) : (
          <button
            onClick={onUpgrade}
            className="w-full py-2 rounded-lg text-sm font-semibold text-gray-900 transition-colors"
            style={{ background: color ?? '#374151', color: color ? '#111827' : '#9ca3af' }}
            onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.1)'}
            onMouseLeave={e => e.currentTarget.style.filter = ''}
          >
            Upgrade to {name} →
          </button>
        )
      ) : (
        <div className="w-full py-2 rounded-lg text-center text-xs text-gray-400
                        bg-gray-800 border border-gray-700/50 cursor-default">
          {PLAN_ORDER[planKey] < PLAN_ORDER['free'] ? 'Lower plan' : 'Not available'}
        </div>
      )}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function CurrentPlanBadge({ plan, displayName }) {
  const color = getLockColor(plan); // starter=#00FFFF, pro=#F59E0B, others→amber fallback
  if (plan === 'free') {
    return (
      <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-gray-700/60 text-gray-300">
        {displayName ?? plan}
      </span>
    );
  }
  if (plan === 'admin_lifetime') {
    return (
      <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-500/10 text-emerald-300">
        {displayName ?? plan}
      </span>
    );
  }
  return (
    <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-full border"
          style={{ color, background: `${color}18`, borderColor: `${color}33` }}>
      {displayName ?? plan}
    </span>
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 animate-pulse">
      {[1, 2, 3].map(i => (
        <div key={i} className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-5">
          <div className="h-4 w-20 bg-gray-700/60 rounded mb-2" />
          <div className="h-3 w-36 bg-gray-700/40 rounded mb-5" />
          <div className="h-6 w-24 bg-gray-700/60 rounded mb-5" />
          {[1,2,3,4].map(j => (
            <div key={j} className="h-3 bg-gray-700/30 rounded mb-2" />
          ))}
          <div className="h-9 bg-gray-700/50 rounded-lg mt-4" />
        </div>
      ))}
    </div>
  );
}
