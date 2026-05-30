import React from 'react';
import { useAuth }    from '../contexts/AuthContext';
import { useUpgrade } from '../contexts/UpgradeContext';
import { getLockColor, PadLockIcon } from './PlanTierBadge';

/**
 * FeatureGate
 *
 * Renders children if the user's plan meets `required`.
 * Otherwise renders a centred "locked" card with an upgrade CTA.
 *
 * Lock color comes from getLockColor(required):
 *   Starter feature → cyan  #00FFFF
 *   Pro feature     → amber #F59E0B
 *
 * Props:
 *   required  — 'starter' | 'pro'
 *   feature   — human-readable feature name shown in the gate card
 *   children  — page content shown when plan qualifies
 */

const PLAN_RANK = { free: 0, starter: 1, pro: 2, admin_lifetime: 99 };

const COPY = {
  starter: {
    badge : 'Starter Feature',
    desc  : 'Upgrade to Starter to unlock this page and get full access to audience insights.',
    cta   : 'Upgrade to Starter',
  },
  pro: {
    badge : 'Pro Feature',
    desc  : 'Upgrade to Pro to unlock this page and access the full analytics suite.',
    cta   : 'Upgrade to Pro',
  },
};

export default function FeatureGate({ required = 'pro', feature = '', children }) {
  const { user }        = useAuth();
  const { showUpgrade } = useUpgrade();

  const userRank     = PLAN_RANK[user?.plan]  ?? 0;
  const requiredRank = PLAN_RANK[required]    ?? 99;

  // Plan qualifies — render normally
  if (userRank >= requiredRank) return children;

  const copy      = COPY[required] ?? COPY.pro;
  const lockColor = getLockColor(required);

  return (
    <div className="flex-1 flex items-center justify-center p-10 min-h-0">
      <div className="max-w-sm w-full text-center">

        {/* Lock icon */}
        <div
          className="w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center"
          style={{
            background  : `${lockColor}18`,
            border      : `1px solid ${lockColor}33`,
          }}
        >
          <PadLockIcon size={28} color={lockColor} />
        </div>

        {/* Badge */}
        <span
          className="inline-block px-3 py-1 mb-4 text-xs font-bold rounded-full uppercase tracking-wider"
          style={{
            color       : lockColor,
            background  : `${lockColor}18`,
            border      : `1px solid ${lockColor}33`,
          }}
        >
          {copy.badge}
        </span>

        {/* Title */}
        {feature && (
          <h2 className="text-xl font-bold text-gray-100 mb-3">{feature}</h2>
        )}

        {/* Description */}
        <p className="text-sm text-gray-400 leading-relaxed mb-8">
          {copy.desc}
        </p>

        {/* CTA */}
        <button
          onClick={() => showUpgrade(required)}
          className="px-7 py-2.5 text-gray-900 text-sm font-bold rounded-lg transition-colors"
          style={{
            background : lockColor,
            boxShadow  : `0 8px 20px -4px ${lockColor}44`,
          }}
          onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.1)'}
          onMouseLeave={e => e.currentTarget.style.filter = ''}
        >
          {copy.cta} →
        </button>

        {/* Plan reminder */}
        <p className="mt-4 text-xs text-gray-400">
          You are on the <span className="font-medium text-gray-300 capitalize">{user?.plan_display_name ?? user?.plan ?? 'Free'}</span> plan
        </p>

      </div>
    </div>
  );
}
