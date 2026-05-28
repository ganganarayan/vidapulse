import React from 'react';

/**
 * PlanTierBadge — shared crown + plan-tier components.
 *
 * PlanCrown      — crown icon only (for sidebar nav items)
 * PlanTierBadge  — crown + label pill (for section headers)
 *
 * Crown design: classic royal crown — 5 pointed spikes rising from a thick
 * base band, with a gem circle at each spike tip.
 *   Pro     → amber body  + pale-gold gems  (#fef9c3)
 *   Starter → emerald body + coral-red gems (#f87171)
 *
 * Visibility rules (pass userPlan to auto-hide when user already has access):
 *   - Free user    → sees both green (Starter) and orange (Pro) crowns
 *   - Starter user → sees only orange (Pro) crowns; green ones are hidden
 *   - Pro user     → no crowns shown (they have everything)
 *   - Admin        → no crowns shown
 */

const PLAN_RANK = { free: 0, starter: 1, pro: 2, admin_lifetime: 3 };

function userAlreadyHas(userPlan, requiredPlan) {
  if (!userPlan) return false;   // unknown plan → show crown
  return (PLAN_RANK[userPlan] ?? 0) >= (PLAN_RANK[requiredPlan] ?? 0);
}

// ─────────────────────────────────────────────────────────────────────────────
// CrownIcon — classic crown: 5 spike body + thick base + gem circles at tips.
//
// ViewBox 0 0 100 62:
//   Crown body path: left edge up → spike tips with valleys between → right edge
//   Spike tips: far-left (12,20), left (33,8), center (50,4 tallest),
//               right (67,8), far-right (88,20)
//   Valleys:    (22,34), (42,26), (58,26), (78,34)
//   Base band:  y=44–58, rx=2
//   Gems:       circles at each tip, color = gemColor prop
// ─────────────────────────────────────────────────────────────────────────────

function CrownIcon({ size = 16, gemColor }) {
  const h   = Math.max(1, Math.round(size * 0.62));
  const gc  = gemColor ?? 'currentColor';

  return (
    <svg
      width={size}
      height={h}
      viewBox="0 0 100 62"
      fill="currentColor"
      aria-hidden="true"
      style={{ display: 'inline', flexShrink: 0 }}
    >
      {/* Crown body: side walls + 5 spike tips with valleys between */}
      <path d="M 3 56 L 3 42 L 12 20 L 22 34 L 33 8 L 42 26 L 50 4 L 58 26 L 67 8 L 78 34 L 88 20 L 97 42 L 97 56 Z" />

      {/* Thick base band */}
      <rect x="3" y="44" width="94" height="14" rx="2" />

      {/* Gem circles at each spike tip */}
      <circle cx="12" cy="20" r="5"   fill={gc} />
      <circle cx="33" cy="8"  r="4.5" fill={gc} />
      <circle cx="50" cy="4"  r="4"   fill={gc} />
      <circle cx="67" cy="8"  r="4.5" fill={gc} />
      <circle cx="88" cy="20" r="5"   fill={gc} />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PlanCrown — crown icon only (default 16 px, for nav items).
// Pass userPlan to suppress when the user already has that plan tier.
// ─────────────────────────────────────────────────────────────────────────────

export function PlanCrown({ plan, size = 16, userPlan }) {
  if (plan !== 'pro' && plan !== 'starter') return null;
  if (userAlreadyHas(userPlan, plan)) return null;

  const gemColor = plan === 'pro' ? '#fef9c3' : '#f87171';

  return (
    <span
      className={`flex-shrink-0 inline-flex items-center ${
        plan === 'pro' ? 'text-amber-500' : 'text-emerald-400'
      }`}
      title={plan === 'pro' ? 'Pro feature' : 'Starter feature'}
    >
      <CrownIcon size={size} gemColor={gemColor} />
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

  const gemColor = plan === 'pro' ? '#fef9c3' : '#f87171';

  if (plan === 'pro') {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full
                       text-[10px] font-bold tracking-wide
                       bg-amber-500/10 text-amber-500 border border-amber-500/25">
        <CrownIcon size={11} gemColor={gemColor} />
        Pro
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full
                     text-[10px] font-bold tracking-wide
                     bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
      <CrownIcon size={11} gemColor={gemColor} />
      Starter
    </span>
  );
}
