import React from 'react';

/**
 * PlanTierBadge — shared crown + plan-tier components.
 *
 * PlanCrown      — crown icon only (for sidebar nav items)
 * PlanTierBadge  — crown + label pill (for section headers)
 *
 * Crown design: 5 pointed spikes that diverge outward from the center,
 * with a thin base band. No balls — clean classic crown silhouette.
 *
 * Visibility rules (pass userPlan to auto-hide when user already has access):
 *   - Free user   → sees both green (Starter) and orange (Pro) crowns
 *   - Starter user → sees only orange (Pro) crowns; green ones are hidden
 *   - Pro user    → no crowns shown (they have everything)
 *   - Admin       → no crowns shown
 */

const PLAN_RANK = { free: 0, starter: 1, pro: 2, admin_lifetime: 3 };

function userAlreadyHas(userPlan, requiredPlan) {
  if (!userPlan) return false;   // unknown plan → show crown
  return (PLAN_RANK[userPlan] ?? 0) >= (PLAN_RANK[requiredPlan] ?? 0);
}

// ─────────────────────────────────────────────────────────────────────────────
// CrownIcon — 5 diverging pointed spikes + thin base band.
//
// ViewBox 0 0 100 68:
//   Spike tips (tip leans outward from center):
//     far-left  (2,14), left (21,6), center (50,0 – tallest), right (79,6), far-right (98,14)
//   Base band: y=58–66, rx=1
//   Spike bases straddle y=58 with ~10px width each.
// ─────────────────────────────────────────────────────────────────────────────

function CrownIcon({ size = 10 }) {
  const h = Math.max(1, Math.round(size * 0.72));
  return (
    <svg
      width={size}
      height={h}
      viewBox="0 0 100 68"
      fill="currentColor"
      aria-hidden="true"
      style={{ display: 'inline', flexShrink: 0 }}
    >
      {/* 5 pointed spikes — each leans outward from the centre */}
      <polygon points="3,58  13,58  2,14"  />   {/* far-left  */}
      <polygon points="22,58 32,58  21,6"  />   {/* left      */}
      <polygon points="44,58 56,58  50,0"  />   {/* centre (tallest) */}
      <polygon points="68,58 78,58  79,6"  />   {/* right     */}
      <polygon points="87,58 97,58  98,14" />   {/* far-right */}

      {/* Thin base band */}
      <rect x="2" y="58" width="96" height="8" rx="1" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PlanCrown — small crown icon only (default 10 px, for nav items).
// Pass userPlan to suppress when the user already has that plan tier.
// ─────────────────────────────────────────────────────────────────────────────

export function PlanCrown({ plan, size = 10, userPlan }) {
  if (plan !== 'pro' && plan !== 'starter') return null;
  if (userAlreadyHas(userPlan, plan)) return null;

  return (
    <span
      className={`flex-shrink-0 inline-flex items-center ${
        plan === 'pro' ? 'text-amber-500' : 'text-emerald-400'
      }`}
      title={plan === 'pro' ? 'Pro feature' : 'Starter feature'}
    >
      <CrownIcon size={size} />
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PlanTierBadge (default) — crown + label pill, for section h2 headers.
// Pass userPlan to suppress when the user already has that plan tier.
// ─────────────────────────────────────────────────────────────────────────────

export default function PlanTierBadge({ plan, userPlan }) {
  if (plan !== 'pro' && plan !== 'starter') return null;
  if (userAlreadyHas(userPlan, plan)) return null;

  if (plan === 'pro') {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full
                       text-[10px] font-bold tracking-wide
                       bg-amber-500/10 text-amber-500 border border-amber-500/25">
        <CrownIcon size={11} />
        Pro
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full
                     text-[10px] font-bold tracking-wide
                     bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
      <CrownIcon size={11} />
      Starter
    </span>
  );
}
