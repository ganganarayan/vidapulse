import React, { useState, useEffect, useCallback } from 'react';
import { useUpgrade }        from '../contexts/UpgradeContext';
import { useAuth }           from '../contexts/AuthContext';
import api                   from '../lib/api';
import { savePurchaseIntent } from '../lib/pixel';
import { getLockColor }       from './PlanTierBadge';

// Plan color: Starter=#00FFFF  Pro=#F59E0B  (single source of truth)
function planColor(planKey) { return getLockColor(planKey); }

/**
 * UpgradeModal
 *
 * Full-screen overlay showing the Starter and Pro plan cards.
 * When the user clicks "Subscribe", the backend creates a per-user
 * Razorpay Subscription and we redirect to Razorpay's hosted payment page.
 * After payment, Razorpay redirects to /payment/starter or /payment/pro.
 *
 * Triggered globally via:
 *   const { showUpgrade } = useUpgrade();
 *   showUpgrade('pro');
 *
 * Rendered once in App.jsx above all routes.
 */

const PLAN_FEATURES = {
  starter: [
    '10 videos',
    'Full analytics dashboard',
    'Viewer stories',
    'Drop-off rate & watch time',
    'Traffic sources & geography',
    'Priority email support',
  ],
  pro: [
    '20 videos',
    'All Starter features',
    'Engagement heatmap (full)',
    'CTA tracking & conversion',
    'AI-powered video insights',
    'Custom player branding',
    'Dedicated support',
  ],
};

export default function UpgradeModal() {
  const { upgradeTarget, hideUpgrade } = useUpgrade();
  const { user }                       = useAuth();
  const [loading, setLoading]          = useState(null); // 'starter' | 'pro' | null
  const [error,   setError]            = useState('');

  // Close on Escape key
  useEffect(() => {
    if (!upgradeTarget) return;
    function onKey(e) { if (e.key === 'Escape') hideUpgrade(); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [upgradeTarget, hideUpgrade]);

  // Lock body scroll while open
  useEffect(() => {
    if (upgradeTarget) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [upgradeTarget]);

  const handleSubscribe = useCallback(async (plan) => {
    setError('');
    setLoading(plan);
    try {
      const { data } = await api.post('/payments/subscribe', { plan });
      // Save purchase intent (INR only — this modal has no currency toggle)
      savePurchaseIntent({
        plan,
        currency: 'INR',
        value   : plan === 'starter' ? 999 : 1999,
      });
      // Redirect to Razorpay hosted payment page (full page navigation)
      window.location.href = data.paymentUrl;
    } catch (err) {
      const msg = err.response?.data?.error || 'Something went wrong. Please try again.';
      setError(msg);
      setLoading(null);
    }
  }, []);

  if (!upgradeTarget) return null;

  const currentPlan = user?.plan ?? 'free';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
      aria-label="Upgrade your plan"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={hideUpgrade}
      />

      {/* Modal panel */}
      <div className="relative w-full max-w-3xl bg-gray-900 border border-gray-700/60 rounded-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-800 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-100">Upgrade your plan</h2>
            <p className="text-sm text-gray-400 mt-0.5">
              Monthly subscription — cancel anytime. Auto-renews every 30 days.
            </p>
          </div>
          <button
            onClick={hideUpgrade}
            className="text-gray-500 hover:text-gray-300 transition-colors ml-4 flex-shrink-0"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2"
              viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-6 mt-4 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Plan cards */}
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">

          {/* Starter */}
          <PlanCard
            planKey     = "starter"
            name        = "Starter"
            tagline     = "For creators growing their audience"
            price       = "₹999"
            features    = {PLAN_FEATURES.starter}
            current     = {currentPlan === 'starter'}
            isFocused   = {upgradeTarget === 'starter'}
            canUpgrade  = {currentPlan === 'free'}
            loading     = {loading === 'starter'}
            onSubscribe = {() => handleSubscribe('starter')}
          />

          {/* Pro */}
          <PlanCard
            planKey     = "pro"
            name        = "Pro"
            tagline     = "For any serious business, B2B or B2C, to scale through video marketing"
            price       = "₹1,999"
            features    = {PLAN_FEATURES.pro}
            current     = {currentPlan === 'pro' || currentPlan === 'admin_lifetime'}
            isFocused   = {upgradeTarget === 'pro'}
            canUpgrade  = {currentPlan === 'free' || currentPlan === 'starter'}
            loading     = {loading === 'pro'}
            recommended = {currentPlan === 'free' || currentPlan === 'starter'}
            onSubscribe = {() => handleSubscribe('pro')}
          />

        </div>

        {/* Fine print */}
        <div className="px-6 pb-5 text-center space-y-1">
          <p className="text-xs text-gray-500 font-medium">
            Your card will be charged every month until you cancel.
          </p>
          <p className="text-xs text-gray-400">
            Payments processed securely by Razorpay · Plan activates within minutes of payment
          </p>
          <p className="text-xs text-gray-500">
            Need more than 20 videos?{' '}
            <a href="mailto:support@vidapulse.in" className="text-amber-400 hover:text-amber-300 transition-colors">
              Contact support@vidapulse.in
            </a>
          </p>
        </div>

      </div>
    </div>
  );
}

// ─── Plan Card ────────────────────────────────────────────────────────────────

function PlanCard({
  planKey, name, tagline, price, features,
  current, isFocused, canUpgrade, loading, recommended, onSubscribe,
}) {
  const color = planColor(planKey); // #00FFFF for starter, #F59E0B for pro

  const cardStyle = isFocused
    ? { borderColor: `${color}66`, boxShadow: `0 0 0 2px ${color}22` }
    : {};

  return (
    <div className="relative flex flex-col bg-gray-800/60 border border-gray-700/50 rounded-xl p-5 transition-all"
         style={cardStyle}>

      {/* "Most Popular" badge */}
      {recommended && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="px-3 py-0.5 text-[10px] font-bold text-gray-900 rounded-full uppercase tracking-wider shadow"
                style={{ background: color }}>
            Most Popular
          </span>
        </div>
      )}

      {/* Name + current badge */}
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-base font-bold text-gray-100">{name}</h3>
        {current && (
          <span className="px-2 py-0.5 text-[10px] font-medium border rounded-full"
                style={{ color, background: `${color}18`, borderColor: `${color}40` }}>
            Current plan
          </span>
        )}
      </div>

      <p className="text-xs text-gray-500 mb-4">{tagline}</p>

      {/* Price */}
      <div className="mb-5">
        <span className="text-2xl font-bold text-gray-100">{price}</span>
        <span className="text-xs text-gray-500 ml-1.5">/ month</span>
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
        <div className="w-full py-2.5 rounded-lg text-center text-xs font-medium
                        bg-gray-700/50 text-gray-500 border border-gray-700/50">
          Your current plan
        </div>
      ) : canUpgrade ? (
        <button
          onClick={onSubscribe}
          disabled={!!loading}
          className="w-full py-2.5 rounded-lg text-sm font-semibold text-gray-900 transition-colors
                     flex items-center justify-center gap-2
                     disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ background: color }}
          onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.1)'}
          onMouseLeave={e => e.currentTarget.style.filter = ''}
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              <span>Redirecting…</span>
            </>
          ) : (
            `Subscribe to ${name} →`
          )}
        </button>
      ) : (
        <div className="w-full py-2.5 rounded-lg text-center text-xs text-gray-400
                        bg-gray-800 border border-gray-700/50">
          Not available for your plan
        </div>
      )}
    </div>
  );
}
