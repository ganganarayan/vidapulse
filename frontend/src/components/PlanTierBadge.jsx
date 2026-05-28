import React from 'react';

/**
 * PlanTierBadge — shared crown + plan-tier components.
 *
 * PlanCrown      — crown icon only (for sidebar nav items)
 * PlanTierBadge  — crown + "Starter" / "Pro" pill (for section headers)
 *
 * Crown design: 5-ball tips, solid fill via currentColor.
 *   Pro     → amber/gold  (text-amber-500)
 *   Starter → emerald     (text-emerald-400)
 */

function CrownIcon({ size = 10 }) {
  const h = Math.max(1, Math.round(size * 0.78));

  return (
    <svg
      width={size}
      height={h}
      viewBox="0 0 100 78"
      fill="currentColor"
      aria-hidden="true"
      style={{ display: 'inline', flexShrink: 0 }}
    >
      {/* Crown body */}
      <path d="M2 72 L2 52 L12 31 L24 42 L34 25 L42 36 L50 22 L58 36 L66 25 L76 42 L88 31 L98 52 L98 72 Z" />

      {/* 5 ball tips */}
      <circle cx="12" cy="22" r="9"  />
      <circle cx="34" cy="16" r="9"  />
      <circle cx="50" cy="12" r="10" />
      <circle cx="66" cy="16" r="9"  />
      <circle cx="88" cy="22" r="9"  />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PlanCrown — small crown icon only (default 10 px).
// ─────────────────────────────────────────────────────────────────────────────

export function PlanCrown({ plan, size = 10 }) {
  if (plan === 'pro') {
    return (
      <span className="text-amber-500 flex-shrink-0 inline-flex items-center" title="Pro feature">
        <CrownIcon size={size} />
      </span>
    );
  }
  if (plan === 'starter') {
    return (
      <span className="text-emerald-400 flex-shrink-0 inline-flex items-center" title="Starter feature">
        <CrownIcon size={size} />
      </span>
    );
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// PlanTierBadge (default export) — crown icon + plan label pill.
// ─────────────────────────────────────────────────────────────────────────────

export default function PlanTierBadge({ plan }) {
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
  if (plan === 'starter') {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full
                       text-[10px] font-bold tracking-wide
                       bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
        <CrownIcon size={11} />
        Starter
      </span>
    );
  }
  return null;
}
