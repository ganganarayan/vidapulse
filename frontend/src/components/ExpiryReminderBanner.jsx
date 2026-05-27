import React, { useMemo } from 'react';
import { useAuth }        from '../contexts/AuthContext';
import { useUpgrade }     from '../contexts/UpgradeContext';

/**
 * ExpiryReminderBanner
 *
 * Renders a dismissible top banner when the user's plan_expires_at is
 * within 3 days. Shows:
 *   3 days  → yellow "Your plan expires in 3 days"
 *   2 days  → orange warning
 *   1 day   → red urgent warning
 *   0 days  → "Your plan expires today"
 *
 * Clicking "Renew Now" opens the UpgradeModal for the current plan.
 *
 * Mounted inside AppLayout so it appears on every authenticated page.
 * Hidden for free / admin_lifetime plans (no expiry).
 */

export default function ExpiryReminderBanner() {
  const { user }          = useAuth();
  const { showUpgrade }   = useUpgrade();

  const daysLeft = useMemo(() => {
    if (!user?.plan_expires_at) return null;
    if (user.plan === 'free' || user.plan === 'admin_lifetime') return null;

    const expiresAt = new Date(user.plan_expires_at);
    const now       = new Date();
    const diffMs    = expiresAt.getTime() - now.getTime();
    const diffDays  = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    // Only show for 0–3 days remaining
    return diffDays <= 3 ? diffDays : null;
  }, [user?.plan_expires_at, user?.plan]);

  if (daysLeft === null) return null;

  const config = daysLeft <= 0
    ? { bg: 'bg-red-500/15', border: 'border-red-500/30', text: 'text-red-300',
        msg: 'Your plan expires today!' }
    : daysLeft === 1
    ? { bg: 'bg-red-500/10', border: 'border-red-500/25', text: 'text-red-300',
        msg: 'Your plan expires tomorrow.' }
    : daysLeft === 2
    ? { bg: 'bg-amber-500/10', border: 'border-amber-500/25', text: 'text-amber-300',
        msg: 'Your plan expires in 2 days.' }
    : { bg: 'bg-amber-500/8',  border: 'border-amber-500/20', text: 'text-amber-400',
        msg: 'Your plan expires in 3 days.' };

  const planLabel = user?.plan === 'starter' ? 'Starter' : 'Pro';

  return (
    <div className={`w-full px-4 py-2.5 border-b flex items-center justify-between gap-4
                     ${config.bg} ${config.border}`}>
      <p className={`text-sm font-medium ${config.text}`}>
        ⚠ {config.msg}{' '}
        <span className="font-normal text-gray-400">
          Renew to keep your {planLabel} features.
        </span>
      </p>
      <button
        onClick={() => showUpgrade(user?.plan)}
        className="flex-shrink-0 px-3 py-1 text-xs font-semibold
                   bg-amber-500 hover:bg-amber-400 text-gray-900
                   rounded-md transition-colors"
      >
        Renew Now
      </button>
    </div>
  );
}
