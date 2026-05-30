import React from 'react';

/**
 * PlanTierBadge — shared plan-tier components.
 *
 * PlanCrown      — kept as no-op export so existing imports don't break
 * PlanTierBadge  — label pill for section headers (no crown icon)
 *
 * Colors:
 *   Pro     → orange  (#f97316)
 *   Starter → cyan    (#00FFFF)
 *
 * Visibility rules (pass userPlan to auto-hide when user already has access):
 *   - Free user    → sees both cyan (Starter) and orange (Pro) badges
 *   - Starter user → sees only orange (Pro) badges; cyan ones are hidden
 *   - Pro user     → no badges shown (they have everything)
 *   - Admin        → no badges shown
 */

const PLAN_RANK = { free: 0, starter: 1, pro: 2, admin_lifetime: 3 };

function userAlreadyHas(userPlan, requiredPlan) {
  if (!userPlan) return false;
  return (PLAN_RANK[userPlan] ?? 0) >= (PLAN_RANK[requiredPlan] ?? 0);
}

// ─────────────────────────────────────────────────────────────────────────────
// PlanCrown — no-op; crowns removed. Kept so existing imports don't break.
// ─────────────────────────────────────────────────────────────────────────────

export function PlanCrown() {
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// PlanTierBadge (default) — label pill, for section h2 headers.
// Pass userPlan to suppress when the user already has that plan tier.
// ─────────────────────────────────────────────────────────────────────────────

export default function PlanTierBadge({ plan, userPlan }) {
  if (plan !== 'pro' && plan !== 'starter') return null;
  if (userAlreadyHas(userPlan, plan)) return null;

  if (plan === 'pro') {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full
                       text-[10px] font-bold tracking-wide
                       bg-orange-500/10 text-orange-500 border border-orange-500/25">
        Pro
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full
                     text-[10px] font-bold tracking-wide border"
          style={{ background: 'rgba(0,255,255,0.08)', color: '#00FFFF', borderColor: 'rgba(0,255,255,0.25)' }}>
      Starter
    </span>
  );
}
