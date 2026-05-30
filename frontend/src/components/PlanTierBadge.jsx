import React from 'react';

/**
 * PlanTierBadge — shared plan-tier lock utilities.
 *
 * Lock color rule (user-plan based, consistent throughout the app):
 *   FREE user    → brand amber  #F59E0B  (all locked features)
 *   STARTER user → cyan         #00FFFF  (only Pro locks visible to them)
 *
 * Exports:
 *   getLockColor(userPlan)  — returns the correct hex color string
 *   PadLockIcon             — line-art padlock SVG, accepts size + color props
 *   PlanCrown               — no-op, kept so existing imports don't break
 *   PlanTierBadge (default) — padlock + plan label pill for section h2 headers
 */

const PLAN_RANK = { free: 0, starter: 1, pro: 2, admin_lifetime: 3 };

function userAlreadyHas(userPlan, requiredPlan) {
  if (!userPlan) return false;
  return (PLAN_RANK[userPlan] ?? 0) >= (PLAN_RANK[requiredPlan] ?? 0);
}

// ─────────────────────────────────────────────────────────────────────────────
// getLockColor — single source of truth for lock accent color
// ─────────────────────────────────────────────────────────────────────────────

export function getLockColor(requiredPlan) {
  // Starter feature → cyan #00FFFF  (free users can tell it's a Starter lock)
  // Pro feature     → brand amber #F59E0B  (consistent with app brand throughout)
  return requiredPlan === 'starter' ? '#00FFFF' : '#F59E0B';
}

// ─────────────────────────────────────────────────────────────────────────────
// PadLockIcon — line-art padlock (consistent with FeatureWall & AppLayout)
// ─────────────────────────────────────────────────────────────────────────────

export function PadLockIcon({ size = 16, color }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color ?? 'currentColor'}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PlanCrown — no-op; crowns removed. Kept so existing imports don't break.
// ─────────────────────────────────────────────────────────────────────────────

export function PlanCrown() {
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// PlanTierBadge (default) — padlock + label pill, for section h2 headers.
// Pass userPlan to suppress when the user already has that plan tier.
// ─────────────────────────────────────────────────────────────────────────────

export default function PlanTierBadge({ plan, userPlan }) {
  if (plan !== 'pro' && plan !== 'starter') return null;
  if (userAlreadyHas(userPlan, plan)) return null;

  const color = getLockColor(userPlan);

  return (
    <span
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide border"
      style={{
        background  : `${color}18`,
        color,
        borderColor : `${color}40`,
      }}
    >
      <PadLockIcon size={9} color={color} />
      {plan === 'pro' ? 'Pro' : 'Starter'}
    </span>
  );
}
