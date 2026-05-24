import React, { useState } from 'react';
import UpgradeModal from './UpgradeModal';

/**
 * VideoLimitBanner
 *
 * Compact horizontal banner shown at the top of the Videos page when the
 * user is at 80%+ of their video upload limit (or has hit the cap).
 *
 * At exactly the limit → red tint + "Video limit reached"
 * At 80–99% of limit  → amber tint + "X of Y videos used"
 * Below 80%           → renders nothing
 *
 * Usage:
 *   <VideoLimitBanner
 *     currentCount={3}
 *     videoLimit={3}
 *     currentPlan="free"
 *   />
 *
 * Props:
 *   currentCount — how many active videos the user currently has
 *   videoLimit   — the plan's video cap (pass null for unlimited)
 *   currentPlan  — 'free' | 'starter'
 */

export default function VideoLimitBanner({ currentCount, videoLimit, currentPlan }) {
  const [modalOpen, setModalOpen] = useState(false);

  // No limit (pro / admin_lifetime) — don't render
  if (videoLimit === null || videoLimit === undefined) return null;

  const pct          = Math.min((currentCount / videoLimit) * 100, 100);
  const isAtLimit    = currentCount >= videoLimit;
  const requiredPlan = currentPlan === 'free' ? 'starter' : 'pro';

  // Only show when usage is high enough to be actionable
  if (pct < 80) return null;

  return (
    <>
      <div
        className={`rounded-xl border p-4 flex items-center gap-4
                    ${isAtLimit
                      ? 'border-red-700/50 bg-red-900/10'
                      : 'border-amber-700/30 bg-amber-900/10'
                    }`}
      >
        {/* Usage info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 mb-2">
            <WarningIcon className={isAtLimit ? 'text-red-400' : 'text-amber-400'} />
            <span
              className={`text-sm font-semibold ${isAtLimit ? 'text-red-300' : 'text-amber-300'}`}
            >
              {isAtLimit
                ? `Video limit reached — ${currentCount} of ${videoLimit} used`
                : `${currentCount} of ${videoLimit} videos used`
              }
            </span>
            <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">
              {capitalize(currentPlan)} plan
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500
                          ${isAtLimit ? 'bg-red-500' : 'bg-amber-500'}`}
              style={{ width: `${pct}%` }}
              role="progressbar"
              aria-valuenow={currentCount}
              aria-valuemin={0}
              aria-valuemax={videoLimit}
              aria-label={`${currentCount} of ${videoLimit} videos used`}
            />
          </div>

          {isAtLimit && (
            <p className="text-xs text-gray-500 mt-1.5">
              Add more videos by upgrading your plan.
            </p>
          )}
        </div>

        {/* Upgrade CTA */}
        <button
          onClick={() => setModalOpen(true)}
          className="flex-shrink-0 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400
                     text-gray-900 text-xs font-semibold rounded-lg transition-colors"
        >
          Upgrade
        </button>
      </div>

      {/* Upgrade modal */}
      {modalOpen && (
        <UpgradeModal
          feature="video_upload"
          requiredPlan={requiredPlan}
          currentPlan={currentPlan}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
}

function capitalize(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
}

function WarningIcon({ className = '' }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      className={`flex-shrink-0 ${className}`}
    >
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}
