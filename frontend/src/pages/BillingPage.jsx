import React, { useEffect, useState, useCallback } from 'react';
import { useAuth }    from '../contexts/AuthContext';
import { useUpgrade } from '../contexts/UpgradeContext';
import AppLayout      from '../components/AppLayout';
import api            from '../lib/api';
import { getLockColor } from '../components/PlanTierBadge';

/**
 * BillingPage — /billing
 *
 * Shows the user's current plan status and full payment history.
 * Each payment row: paid date · plan · amount · period covered · download icon
 * The download icon links to GET /api/payments/billing/invoice/:id which
 * redirects to the Razorpay invoice page.
 */

// Plan badge colors: Starter=#00FFFF  Pro=#F59E0B
function planBadgeStyle(planKey) {
  const c = getLockColor(planKey);
  return { color: c, background: `${c}18`, borderColor: `${c}33` };
}

export default function BillingPage() {
  const { user }              = useAuth();
  const { showUpgrade }       = useUpgrade();
  const [payments, setPayments] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');

  // Detect if any payment used PayPal so we can show the recurring reminder
  const hasPaypalPayment = payments.some(p => p.payment_method === 'paypal');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/payments/billing');
      setPayments(data.payments ?? []);
    } catch {
      setError('Could not load billing history. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const plan    = user?.plan ?? 'free';
  const isPaid  = plan === 'starter' || plan === 'pro';
  const isAdmin = user?.role === 'admin' || plan === 'admin_lifetime';

  return (
    <AppLayout>
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10">

          <h1 className="text-xl font-bold text-gray-50 mb-8">Billing</h1>

          {/* ── Current Plan ─────────────────────────────────────── */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-5 mb-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-2">
                  Current plan
                </p>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <PlanBadge plan={plan} displayName={user?.plan_display_name} />
                  {plan === 'free' && (
                    <span className="text-xs text-emerald-400 font-medium">Free forever</span>
                  )}
                  {plan === 'admin_lifetime' && (
                    <span className="text-xs text-emerald-400 font-medium">Lifetime access</span>
                  )}
                </div>

                {/* Expiry info */}
                {isPaid && user?.plan_expires_at && (
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(user.plan_expires_at) > new Date()
                      ? <>Active until <span className="text-gray-200 font-medium">{formatDate(user.plan_expires_at)}</span></>
                      : <span className="text-red-400">Expired {formatDate(user.plan_expires_at)}</span>
                    }
                    {user.razorpay_subscription_id && (
                      <span className="ml-2 text-emerald-400/80">· Auto-renews</span>
                    )}
                  </p>
                )}

                {/* Enrolled date */}
                {isPaid && user?.plan_enrolled_at && (
                  <p className="text-xs text-gray-500 mt-1">
                    Subscribed on {formatDate(user.plan_enrolled_at)}
                  </p>
                )}
              </div>

              {/* Upgrade / renew CTA */}
              {(plan === 'free' || plan === 'starter') && !isAdmin && (
                <button
                  onClick={() => showUpgrade(plan === 'free' ? 'starter' : 'pro')}
                  className="flex-shrink-0 px-4 py-2 text-xs font-semibold text-gray-900 rounded-lg transition-colors"
                  style={{ background: getLockColor(plan === 'free' ? 'starter' : 'pro') }}
                  onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.1)'}
                  onMouseLeave={e => e.currentTarget.style.filter = ''}
                >
                  {plan === 'free' ? 'Upgrade plan' : 'Upgrade to Pro'}
                </button>
              )}
            </div>
          </div>

          {/* ── PayPal recurring reminder ─────────────────────────── */}
          {!loading && hasPaypalPayment && (
            <div className="mb-6 px-4 py-3.5 bg-amber-500/8 border border-amber-500/25
                            rounded-xl flex items-start gap-3">
              <span className="text-amber-400 text-lg flex-shrink-0 leading-none mt-0.5">⚠</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-amber-300 mb-0.5">
                  PayPal does not support automatic monthly renewal
                </p>
                <p className="text-xs text-amber-300/70 leading-relaxed">
                  Your plan was paid via PayPal. PayPal payments through Razorpay are one-time only —
                  your subscription will not renew automatically. To avoid service interruption,
                  please use a debit or credit card the next time you renew.
                </p>
                {(user?.plan === 'free' || user?.plan === 'starter') && (
                  <button
                    onClick={() => showUpgrade(user?.plan === 'free' ? 'starter' : 'pro')}
                    className="mt-2.5 text-xs font-semibold text-amber-300 hover:text-amber-200
                               underline underline-offset-2 transition-colors"
                  >
                    Renew with card →
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ── Payment History ───────────────────────────────────── */}
          <div>
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Payment history
            </h2>

            {loading ? (
              <LoadingSkeleton />
            ) : error ? (
              <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-6 text-center">
                <p className="text-sm text-red-400 mb-3">{error}</p>
                <button onClick={load} className="text-xs text-gray-400 hover:text-gray-200 transition-colors">
                  Retry
                </button>
              </div>
            ) : payments.length === 0 ? (
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-8 text-center">
                <p className="text-sm text-gray-400">No payments yet.</p>
                {plan === 'free' && (
                  <p className="text-xs text-gray-500 mt-1">
                    Upgrade to Starter or Pro to see your billing history here.
                  </p>
                )}
              </div>
            ) : (
              <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">

                {/* Table header */}
                <div className="grid grid-cols-[1fr_80px_32px] sm:grid-cols-[1fr_80px_110px_100px_32px] gap-2 sm:gap-3 px-3 sm:px-5 py-3
                                border-b border-gray-700/60">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </span>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </span>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:block">
                    Method
                  </span>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valid until
                  </span>
                  <span /> {/* download icon column */}
                </div>

                {/* Payment rows */}
                <div className="divide-y divide-gray-700/40">
                  {payments.map(p => (
                    <PaymentRow key={p.id} payment={p} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Fine print */}
          {!loading && !error && payments.length > 0 && (
            <p className="mt-4 text-xs text-gray-400 text-center">
              All payments are processed by Razorpay · Invoices may take a few minutes to generate
            </p>
          )}

        </div>
      </main>
    </AppLayout>
  );
}

// ─── Payment Row ──────────────────────────────────────────────────────────────

function PaymentRow({ payment }) {
  const hasInvoice = !!payment.razorpay_payment_id;

  const planLabel = payment.plan === 'starter' ? 'Starter' : 'Pro';
  const planColor = planBadgeStyle(payment.plan);

  return (
    <div className="grid grid-cols-[1fr_80px_32px] sm:grid-cols-[1fr_80px_110px_100px_32px] gap-2 sm:gap-3 px-3 sm:px-5 py-3.5
                    items-center hover:bg-gray-700/20 transition-colors">

      {/* Date + plan badge */}
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="text-sm text-gray-200 font-medium flex-shrink-0 tabular-nums">
          {formatDate(payment.paid_at)}
        </span>
        <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-semibold
                          border rounded-full flex-shrink-0"
              style={planColor}>
          {planLabel}
        </span>
      </div>

      {/* Amount */}
      <span className="text-sm text-gray-200 font-medium tabular-nums">
        {payment.currency === 'USD'
          ? payment.amount_inr != null
            ? `$${(payment.amount_inr).toLocaleString('en-US')}`
            : '—'
          : payment.amount_inr != null
            ? `₹${payment.amount_inr.toLocaleString('en-IN')}`
            : '—'
        }
      </span>

      {/* Payment method */}
      <div className="hidden sm:flex items-center gap-1.5">
        <PaymentMethodBadge method={payment.payment_method} />
      </div>

      {/* Period end */}
      <span className="text-sm text-gray-400 tabular-nums">
        {payment.period_end_at ? formatDate(payment.period_end_at) : '—'}
      </span>

      {/* Download icon */}
      <div className="flex items-center justify-end">
        {hasInvoice ? (
          <a
            href={`/api/payments/billing/invoice/${payment.id}`}
            target="_blank"
            rel="noopener noreferrer"
            title="Download invoice"
            className="p-1.5 rounded-lg text-gray-500 hover:text-amber-400
                       hover:bg-amber-500/10 transition-colors"
          >
            <DownloadIcon />
          </a>
        ) : (
          <span className="p-1.5 text-gray-700 cursor-not-allowed" title="Invoice not available">
            <DownloadIcon />
          </span>
        )}
      </div>

    </div>
  );
}

// ─── Payment Method Badge ─────────────────────────────────────────────────────

function PaymentMethodBadge({ method }) {
  if (!method || method === 'unknown') {
    return <span className="text-xs text-gray-400">—</span>;
  }

  const configs = {
    card      : { label: 'Card',       cls: 'bg-blue-500/10  text-blue-300  border-blue-500/25'  },
    upi       : { label: 'UPI',        cls: 'bg-violet-500/10 text-violet-300 border-violet-500/25' },
    netbanking: { label: 'Net Banking', cls: 'bg-teal-500/10  text-teal-300  border-teal-500/25' },
    paypal    : { label: 'PayPal ⚠',   cls: 'bg-amber-500/10 text-amber-300 border-amber-500/25' },
    emi       : { label: 'EMI',         cls: 'bg-purple-500/10 text-purple-300 border-purple-500/25' },
  };

  const cfg = configs[method] ?? {
    label: method.replace('wallet_', '').charAt(0).toUpperCase() + method.replace('wallet_', '').slice(1),
    cls  : 'bg-gray-700/60 text-gray-400 border-gray-600',
  };

  return (
    <span className={`px-2 py-0.5 text-[10px] font-semibold border rounded-full ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', {
    day  : '2-digit',
    month: 'short',
    year : 'numeric',
  });
}

function PlanBadge({ plan, displayName }) {
  if (plan === 'free') {
    return (
      <span className="px-3 py-1 text-sm font-semibold border rounded-full bg-gray-700/60 text-gray-200 border-gray-600">
        {displayName ?? plan}
      </span>
    );
  }
  if (plan === 'admin_lifetime') {
    return (
      <span className="px-3 py-1 text-sm font-semibold border rounded-full bg-emerald-500/15 text-emerald-300 border-emerald-500/40">
        {displayName ?? plan}
      </span>
    );
  }
  const color = getLockColor(plan);
  return (
    <span className="px-3 py-1 text-sm font-semibold border rounded-full"
          style={{ color, background: `${color}18`, borderColor: `${color}40` }}>
      {displayName ?? plan}
    </span>
  );
}

function LoadingSkeleton() {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden animate-pulse">
      <div className="px-5 py-3 border-b border-gray-700/60 flex gap-3">
        {[1,2,3,4,5].map(i => <div key={i} className="h-3 bg-gray-700/60 rounded flex-1" />)}
      </div>
      {[1,2,3].map(i => (
        <div key={i} className="px-5 py-4 border-b border-gray-700/40 flex gap-3 items-center">
          <div className="h-4 bg-gray-700/50 rounded flex-1" />
          <div className="h-4 w-14 bg-gray-700/40 rounded" />
          <div className="h-4 w-20 bg-gray-700/40 rounded" />
          <div className="h-4 w-24 bg-gray-700/40 rounded" />
          <div className="h-6 w-6 bg-gray-700/30 rounded" />
        </div>
      ))}
    </div>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function DownloadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  );
}
