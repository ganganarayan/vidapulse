import React from 'react';

/**
 * PlanTierBadge — shared crown + plan-tier components.
 *
 * PlanCrown   — tiny crown icon only (for sidebar nav items)
 * PlanTierBadge — crown + "Starter" / "Pro" pill (for section headers)
 *
 * Color scheme:
 *   Starter → emerald green  (#34d399 / text-emerald-400)
 *   Pro     → amber orange   (#f59e0b / text-amber-500)
 */

function CrownIcon({ size = 10 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 16"
      fill="currentColor"
      aria-hidden="true"
      style={{ display: 'inline', flexShrink: 0 }}
    >
      {/* Classic 5-point crown silhouette */}
      <path d="M1 14 L3.5 5 L7.5 8.5 L10 1 L12.5 8.5 L16.5 5 L19 14 Z" />
      <rect x="1" y="15" width="18" height="1.5" rx="0.75" />
    </svg>
  );
}

/**
 * PlanCrown — small crown icon only (10 px).
 * Use in nav items where space is tight.
 */
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

/**
 * PlanTierBadge — crown icon + plan label pill.
 * Use next to section headings (h2).
 */
export default function PlanTierBadge({ plan }) {
  if (plan === 'pro') {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full
                       text-[10px] font-bold tracking-wide
                       bg-amber-500/10 text-amber-400 border border-amber-500/25"
      >
        <CrownIcon size={8} />
        Pro
      </span>
    );
  }
  if (plan === 'starter') {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full
                       text-[10px] font-bold tracking-wide
                       bg-emerald-500/10 text-emerald-400 border border-emerald-500/25"
      >
        <CrownIcon size={8} />
        Starter
      </span>
    );
  }
  return null;
}
