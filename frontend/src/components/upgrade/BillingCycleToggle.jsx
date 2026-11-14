import React from 'react';

/**
 * Monthly / Yearly switch for the upgrade screens. Yearly = 2 months free
 * (the server bills 10 x monthly; see backend services/pricing.js).
 */
export default function BillingCycleToggle({ cycle, onChange, className = '' }) {
  const opt = (value, label) => (
    <button
      type="button"
      onClick={() => onChange(value)}
      aria-pressed={cycle === value}
      className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
        cycle === value ? 'bg-amber-500 text-gray-900' : 'text-gray-400 hover:text-gray-200'
      }`}
    >
      {label}
    </button>
  );
  return (
    <div className={`inline-flex items-center gap-1 p-1 rounded-full bg-gray-800 border border-gray-700 ${className}`}
         role="group" aria-label="Billing period">
      {opt('monthly', 'Monthly')}
      {opt('yearly', (
        <>Yearly <span className="ml-1 text-[10px] font-bold text-green-400">2 months free</span></>
      ))}
    </div>
  );
}

/** Price label for a plan from a GET /api/upgrade or /api/founding-status table. */
export function priceLabelFor(table, key, cycle, fallback) {
  return table?.plans?.[key]?.[cycle]?.label
      ?? table?.[key]?.[cycle]?.label
      ?? fallback;
}
