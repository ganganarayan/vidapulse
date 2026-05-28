import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import api from '../../lib/api';

/**
 * UpgradeModal
 *
 * Full-screen upgrade prompt. Triggered when a user hits a feature wall
 * or video limit. Fetches live pricing from GET /api/upgrade.
 *
 * Props:
 *   feature      — feature key that triggered the wall (e.g. 'heatmap', 'video_upload')
 *   requiredPlan — 'starter' | 'pro'
 *   currentPlan  — 'free' | 'starter'
 *   onClose      — called when user dismisses the modal
 */

// ── Human-readable feature labels ────────────────────────────────────────
const FEATURE_LABELS = {
  geography            : 'Geographic Data',
  device_breakdown     : 'Device & Browser Breakdown',
  avg_time_watched     : 'Avg. Time Watched',
  heatmap              : 'Engagement Heatmaps',
  viewer_level         : 'Viewer-Level Analytics',
  audience_segmentation: 'Audience Segmentation',
  conversion_tracking  : 'Conversion Tracking & Funnels',
  events               : 'Custom Events',
  reports              : 'Reports',
  alerts               : 'Smart Alerts',
  video_upload         : 'Video Upload',
};

// ── Feature lists shown inside each plan card ─────────────────────────────
const PLAN_FEATURES = {
  starter: [
    'Up to 10 videos',
    'Geographic data',
    'Device & browser breakdown',
    'Avg. time watched',
    'Total plays, play rate & unique visitors',
    'Domain tracking & embed code',
  ],
  pro: [
    '20 videos',
    'Engagement heatmaps',
    'Viewer-level analytics',
    'Audience segmentation',
    'Conversion tracking & funnels',
    'Custom events, reports & smart alerts',
    'Everything in Starter',
  ],
};

// ─────────────────────────────────────────────────────────────────────────

export default function UpgradeModal({ feature, requiredPlan, currentPlan, onClose }) {
  const [upgradeData, setUpgradeData] = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [region,      setRegion]      = useState('india'); // 'india' | 'international'

  // Fetch live pricing + upgrade options
  useEffect(() => {
    api.get('/upgrade')
      .then(res => setUpgradeData(res.data))
      .catch(() => {
        setUpgradeData({
          upgrade_options: currentPlan === 'starter' ? ['pro'] : ['starter', 'pro'],
          pricing: {
            starter: { inr: 999,  usd: 15, inr_label: '₹999',  usd_label: '$15', video_limit: 10   },
            pro    : { inr: 1999, usd: 29, inr_label: '₹1,999', usd_label: '$29', video_limit: 20   },
          },
          razorpay_links: { starter: null, pro: null },
        });
      })
      .finally(() => setLoading(false));
  }, [currentPlan]);

  // Close on Escape key
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Prevent body scroll while open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const featureLabel = FEATURE_LABELS[feature] ?? feature;
  const options      = upgradeData?.upgrade_options ?? [];
  const isSingleCard = options.length === 1;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Upgrade your plan"
    >
      {/* Backdrop — click to close */}
      <div
        className="absolute inset-0 bg-gray-950/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal panel */}
      <div className="relative w-full max-w-2xl bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden">

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-gray-500 hover:text-gray-200 transition-colors z-10"
          aria-label="Close"
        >
          <CloseIcon />
        </button>

        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="px-6 pt-6 pb-5 border-b border-gray-700">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <LockIcon className="text-amber-500" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-50">
                Unlock Pro Features
              </h2>
              <p className="text-sm text-gray-400 mt-0.5">
                {feature === 'video_upload'
                  ? `You've reached the video limit on your ${capitalize(currentPlan)} plan.`
                  : `Upgrade to unlock ${featureLabel} and all ${capitalize(requiredPlan)} plan features.`
                }
              </p>
            </div>
          </div>
        </div>

        {/* ── Region toggle + Plan cards ──────────────────────────── */}
        <div className="px-6 pb-2 pt-2">
          {/* India / International toggle */}
          <div className="flex justify-center mb-5">
            <div className="flex items-center bg-gray-900/60 border border-gray-700 rounded-full p-0.5 gap-0.5">
              <button
                onClick={() => setRegion('india')}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  region === 'india'
                    ? 'bg-amber-500 text-gray-900 shadow'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                🇮🇳 India ₹
              </button>
              <button
                onClick={() => setRegion('international')}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  region === 'international'
                    ? 'bg-amber-500 text-gray-900 shadow'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                🌍 International $
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className={`${isSingleCard ? 'flex justify-center' : 'grid grid-cols-1 sm:grid-cols-2 gap-4'}`}>
              {options.map(plan => (
                <PlanCard
                  key={plan}
                  plan={plan}
                  pricing={upgradeData?.pricing?.[plan]}
                  region={region}
                  razorpayLink={upgradeData?.razorpay_links?.[plan]}
                  isHighlighted={plan === requiredPlan}
                  features={PLAN_FEATURES[plan] ?? []}
                  singleCard={isSingleCard}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Footer ─────────────────────────────────────────────── */}
        <div className="px-6 pb-5 pt-2 text-center">
          <p className="text-xs text-gray-500">
            Free plan is free forever — no credit card required.{' '}
            Upgrades are processed securely via Razorpay.
          </p>
          {region === 'international' && (
            <p className="text-xs text-amber-500/70 mt-1">
              International payments: select USD at checkout.
            </p>
          )}
          <p className="text-xs text-gray-500 mt-1.5">
            Need more than 20 videos?{' '}
            <a href="mailto:support@vidapulse.in" className="text-amber-400 hover:text-amber-300 transition-colors">
              Contact support@vidapulse.in
            </a>
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─────────────────────────────────────────────────────────────────────────
// PlanCard
// ─────────────────────────────────────────────────────────────────────────

function PlanCard({ plan, pricing, region, razorpayLink, isHighlighted, features, singleCard }) {
  const isPro = plan === 'pro';

  const borderCls = isHighlighted
    ? (isPro ? 'border-indigo-500' : 'border-amber-500')
    : 'border-gray-700';

  const badgeBg = isPro
    ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'
    : 'bg-amber-500/10  text-amber-300  border-amber-500/30';

  const btnCls = isPro
    ? 'bg-indigo-500 hover:bg-indigo-400 text-white'
    : 'bg-amber-500  hover:bg-amber-400  text-gray-900';

  const priceLabel = region === 'india'
    ? (pricing?.inr_label ?? `₹${pricing?.inr ?? '—'}`)
    : (pricing?.usd_label ?? `$${pricing?.usd ?? '—'}`);

  return (
    <div
      className={`relative rounded-xl border ${borderCls} bg-gray-900 p-5 flex flex-col gap-4
                  ${singleCard ? 'w-full max-w-xs' : ''}`}
    >
      {/* "Recommended" ribbon */}
      {isHighlighted && (
        <div
          className={`absolute -top-px left-1/2 -translate-x-1/2 -translate-y-full
                      px-3 py-0.5 text-xs font-semibold rounded-t-lg border-x border-t
                      ${badgeBg}`}
        >
          Recommended
        </div>
      )}

      {/* Plan name + price */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="font-bold text-gray-50">{capitalize(plan)}</span>
          <PlanBadge plan={plan} />
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-gray-100">{priceLabel}</span>
          <span className="text-sm text-gray-400">/ month</span>
        </div>
        <p className="text-xs text-gray-500 mt-0.5">
          {pricing?.video_limit === null ? 'Unlimited videos' : `Up to ${pricing?.video_limit} videos`}
        </p>
      </div>

      {/* Feature list */}
      <ul className="flex flex-col gap-1.5 flex-1">
        {features.map((f, i) => (
          <li key={i} className="flex items-start gap-2 text-sm">
            <CheckIcon className="flex-shrink-0 mt-0.5 text-emerald-400" />
            <span className="text-gray-300">{f}</span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <a
        href={razorpayLink ?? '#'}
        target="_blank"
        rel="noopener noreferrer"
        className={`w-full text-center py-2.5 px-4 rounded-lg font-semibold text-sm transition-colors ${btnCls}`}
      >
        Upgrade to {capitalize(plan)}
      </a>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Shared sub-components
// ─────────────────────────────────────────────────────────────────────────

export function PlanBadge({ plan }) {
  if (plan === 'pro') {
    return (
      <span className="px-2 py-0.5 text-xs font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 rounded-full">
        Pro
      </span>
    );
  }
  return (
    <span className="px-2 py-0.5 text-xs font-medium bg-amber-500/10 text-amber-300 border border-amber-500/30 rounded-full">
      Starter
    </span>
  );
}

function capitalize(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
}

// ── Inline SVG icons (no icon library dependency) ─────────────────────────

function LockIcon({ className = '' }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      className={className}
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function CheckIcon({ className = '' }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      className={className}
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
