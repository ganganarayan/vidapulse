import React, { useState } from 'react';
import UpgradeModal, { PlanBadge } from './UpgradeModal';

/**
 * FeatureWall
 *
 * Wraps analytics content that's locked behind a plan gate.
 * Renders children with a blur filter and overlays a lock panel.
 * Clicking anywhere on the overlay opens the UpgradeModal.
 *
 * Usage:
 *   <FeatureWall feature="heatmap" requiredPlan="pro" currentPlan={user.plan}>
 *     <HeatmapChart data={placeholderData} />
 *   </FeatureWall>
 *
 * Props:
 *   feature      — feature key (e.g. 'heatmap', 'viewer_level')
 *   requiredPlan — 'starter' | 'pro'
 *   currentPlan  — 'free' | 'starter'
 *   children     — content to show blurred behind the lock overlay
 *   className    — optional extra classes on the wrapper
 *   minHeight    — minimum height so thin content still shows a visible wall
 *                  (default: '200px')
 */

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
  insights             : 'AI Insights',
  viewer_stories       : 'Viewer Stories',
};

const PLAN_DESCRIPTIONS = {
  starter: 'Starter plan',
  pro    : 'Pro plan',
};

export default function FeatureWall({
  feature,
  requiredPlan,
  currentPlan,
  children,
  className   = '',
  minHeight   = '200px',
}) {
  const [modalOpen, setModalOpen] = useState(false);

  const featureLabel = FEATURE_LABELS[feature] ?? feature;
  const planDesc     = PLAN_DESCRIPTIONS[requiredPlan] ?? requiredPlan;

  return (
    <>
      <div
        className={`relative rounded-xl overflow-hidden ${className}`}
        style={{ minHeight }}
      >
        {/* ── Blurred content ──────────────────────────────────── */}
        {/* pointer-events-none ensures no interaction with the blurred layer */}
        <div
          className="blur-sm pointer-events-none select-none"
          aria-hidden="true"
        >
          {children}
        </div>

        {/* ── Lock overlay ─────────────────────────────────────── */}
        <button
          type="button"
          className="absolute inset-0 w-full h-full flex items-center justify-center
                     bg-gray-900/60 cursor-pointer group"
          onClick={() => setModalOpen(true)}
          aria-label={`Unlock ${featureLabel} — requires ${planDesc}`}
        >
          <div
            className="bg-gray-800 border border-gray-700 rounded-xl px-6 py-5
                       mx-4 text-center shadow-2xl max-w-xs w-full
                       group-hover:border-amber-500/40 transition-colors duration-200"
          >
            {/* Lock icon */}
            <div className="flex justify-center mb-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <LockIcon className="text-amber-500" />
              </div>
            </div>

            {/* Plan badge */}
            <div className="flex justify-center mb-2">
              <PlanBadge plan={requiredPlan} />
            </div>

            {/* Feature name */}
            <p className="text-sm font-semibold text-gray-200 mb-1">
              {requiredPlan === 'pro' ? 'Pro Features' : featureLabel}
            </p>

            {/* Description */}
            <p className="text-xs text-gray-400 mb-4">
              Available on the {capitalize(requiredPlan)} plan
            </p>

            {/* CTA chip */}
            <span
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5
                         bg-amber-500 text-gray-900 text-xs font-semibold rounded-lg
                         group-hover:bg-amber-400 transition-colors duration-200"
            >
              <UnlockIcon />
              Unlock this feature
            </span>
          </div>
        </button>
      </div>

      {/* Upgrade modal — rendered in portal when triggered */}
      {modalOpen && (
        <UpgradeModal
          feature={feature}
          requiredPlan={requiredPlan}
          currentPlan={currentPlan}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
}

function capitalize(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
}

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

function UnlockIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 9.9-1" />
    </svg>
  );
}
