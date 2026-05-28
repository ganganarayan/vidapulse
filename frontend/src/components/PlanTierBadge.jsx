import React, { useState } from 'react';

/**
 * PlanTierBadge — shared crown + plan-tier components.
 *
 * PlanCrown      — crown icon only (for sidebar nav items)
 * PlanTierBadge  — crown + "Starter" / "Pro" pill (for section headers)
 *
 * Crown design: 5-ball tips, gradient fill (gold for Pro, green for Starter).
 * Each SVG gets a unique gradient ID so multiple instances on the same page
 * don't share/steal each other's gradient definitions.
 */

// Module-level counter ensures unique gradient IDs across all mounted instances.
let _gid = 0;

function CrownIcon({ size = 10, plan = 'pro' }) {
  // Stable unique ID — created once per component instance.
  const [gradId] = useState(() => `cg-${plan}-${++_gid}`);

  const isGold = plan !== 'starter';

  // Color stops: light (highlight) → mid (main) → dark (shadow)
  const c = isGold
    ? { t: '#FDE68A', m: '#F59E0B', b: '#92400E', band: '#B45309' }   // amber
    : { t: '#A7F3D0', m: '#10B981', b: '#065F46', band: '#059669' };  // emerald

  // Rendered height preserves the crown aspect ratio (100 × 78 viewBox)
  const h = Math.max(1, Math.round(size * 0.78));

  return (
    <svg
      width={size}
      height={h}
      viewBox="0 0 100 78"
      fill="none"
      aria-hidden="true"
      style={{ display: 'inline', flexShrink: 0 }}
    >
      <defs>
        {/* Top-to-bottom gradient: bright highlight → saturated mid → deep shadow */}
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={c.t} />
          <stop offset="55%"  stopColor={c.m} />
          <stop offset="100%" stopColor={c.b} />
        </linearGradient>
      </defs>

      {/* ── Crown body ──────────────────────────────────────────────────── */}
      {/*
        Path explanation (SVG y axis: 0 = top, 78 = bottom):
          Sides rise from base (y≈52) to each spike base.
          Valleys dip between spikes (deeper toward edges, shallower inward).
          The center spike is tallest; outer spikes are shortest.
      */}
      <path
        d="M2 72 L2 52 L12 31 L24 42 L34 25 L42 36 L50 22 L58 36 L66 25 L76 42 L88 31 L98 52 L98 72 Z"
        fill={`url(#${gradId})`}
      />

      {/* Base band — slightly darker, adds depth */}
      <rect x="2" y="63" width="96" height="9" rx="3" fill={c.band} />

      {/* ── 5 ball tips ─────────────────────────────────────────────────── */}
      {/* Left outer  */ } <circle cx="12" cy="22" r="9"  fill={`url(#${gradId})`} />
      {/* Left inner  */ } <circle cx="34" cy="16" r="9"  fill={`url(#${gradId})`} />
      {/* Center (tallest) */ } <circle cx="50" cy="12" r="10" fill={`url(#${gradId})`} />
      {/* Right inner */ } <circle cx="66" cy="16" r="9"  fill={`url(#${gradId})`} />
      {/* Right outer */ } <circle cx="88" cy="22" r="9"  fill={`url(#${gradId})`} />

      {/* ── Shine highlights on each ball ───────────────────────────────── */}
      <circle cx="9"  cy="18" r="2.8" fill="white" opacity="0.38" />
      <circle cx="31" cy="12" r="2.8" fill="white" opacity="0.38" />
      <circle cx="47" cy="8"  r="3.0" fill="white" opacity="0.38" />
      <circle cx="63" cy="12" r="2.8" fill="white" opacity="0.38" />
      <circle cx="85" cy="18" r="2.8" fill="white" opacity="0.38" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PlanCrown — small crown icon only (default 10 px).
// Use in nav items where space is tight.
// ─────────────────────────────────────────────────────────────────────────────

export function PlanCrown({ plan, size = 10 }) {
  if (plan !== 'pro' && plan !== 'starter') return null;
  return (
    <span
      className="flex-shrink-0 inline-flex items-center"
      title={plan === 'pro' ? 'Pro feature' : 'Starter feature'}
    >
      <CrownIcon size={size} plan={plan} />
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PlanTierBadge (default export) — crown icon + plan label pill.
// Use next to section headings (h2).
// ─────────────────────────────────────────────────────────────────────────────

export default function PlanTierBadge({ plan }) {
  if (plan === 'pro') {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full
                       text-[10px] font-bold tracking-wide
                       bg-amber-500/10 text-amber-400 border border-amber-500/25">
        <CrownIcon size={11} plan="pro" />
        Pro
      </span>
    );
  }
  if (plan === 'starter') {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full
                       text-[10px] font-bold tracking-wide
                       bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
        <CrownIcon size={11} plan="starter" />
        Starter
      </span>
    );
  }
  return null;
}
