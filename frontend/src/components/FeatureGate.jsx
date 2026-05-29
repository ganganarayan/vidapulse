import React from 'react';
import { useAuth }    from '../contexts/AuthContext';
import { useUpgrade } from '../contexts/UpgradeContext';

/**
 * FeatureGate
 *
 * Renders children if the user's plan meets `required`.
 * Otherwise renders a centred "locked" card with an upgrade CTA.
 *
 * Usage (inside a page that already has <AppLayout>):
 *   <AppLayout>
 *     <FeatureGate required="pro" feature="Events">
 *       <actual page content />
 *     </FeatureGate>
 *   </AppLayout>
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

  const copy = COPY[required] ?? COPY.pro;

  return (
    <div className="flex-1 flex items-center justify-center p-10 min-h-0">
      <div className="max-w-sm w-full text-center">

        {/* Lock icon */}
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gray-800/80 border border-gray-700
                        flex items-center justify-center">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
            className="text-gray-400">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>

        {/* Badge */}
        <span className="inline-block px-3 py-1 mb-4 text-xs font-bold text-amber-300
                         bg-amber-500/10 border border-amber-500/25 rounded-full uppercase tracking-wider">
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
          className="px-7 py-2.5 bg-amber-500 hover:bg-amber-400 text-gray-900
                     text-sm font-bold rounded-lg transition-colors shadow-lg shadow-amber-500/20"
        >
          {copy.cta} →
        </button>

        {/* Plan reminder */}
        <p className="mt-4 text-xs text-gray-400">
          You are on the <span className="text-gray-400 font-medium capitalize">{user?.plan_display_name ?? user?.plan ?? 'Free'}</span> plan
        </p>

      </div>
    </div>
  );
}
