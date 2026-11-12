import React, { useState } from 'react';
import api from '../lib/api';
import { formatIST } from '../lib/date';

/**
 * AdminBillingTest: super-admin only, shown at the top of /billing.
 *
 * Runs the REAL billing lifecycle at Rs 1 against a non-admin test account:
 * one row per plan with Subscribe (Rs 1), Upgrade (Rs 1), Downgrade, Cancel.
 * Payments open real Razorpay Checkout; activation goes through the same
 * server helpers as a customer purchase, so the same CRM emails fire and the
 * same plan gates open/close. Log in as the test account to see the features.
 */

const PLANS = [
  { key: 'starter', label: 'Starter', rank: 1 },
  { key: 'pro',     label: 'Growth',  rank: 2 },
];
const RANK = { free: 0, starter: 1, pro: 2 };
const PLAN_LABEL = { free: 'Free', starter: 'Starter', pro: 'Growth' };

function loadCheckout() {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve();
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Could not load Razorpay Checkout'));
    document.body.appendChild(s);
  });
}

export default function AdminBillingTest() {
  const [email,  setEmail]  = useState('');
  const [target, setTarget] = useState(null);
  const [busy,   setBusy]   = useState('');
  const [msg,    setMsg]    = useState(null); // { ok: bool, text }

  const err = (e) => e?.response?.data?.error || e?.message || 'Something went wrong';

  async function lookup() {
    setBusy('lookup'); setMsg(null);
    try {
      const { data } = await api.get('/payments/admin-test/user', { params: { email } });
      setTarget(data.user);
    } catch (e) { setTarget(null); setMsg({ ok: false, text: err(e) }); }
    finally { setBusy(''); }
  }

  async function pay(plan, mode) {
    setBusy(`${mode}:${plan}`); setMsg(null);
    try {
      await loadCheckout();
      const { data } = await api.post('/payments/admin-test/subscribe', { email: target.email, plan, mode });
      const rzp = new window.Razorpay({
        key: data.keyId,
        subscription_id: data.subscriptionId,
        name: 'VidaPulse (Rs 1 test)',
        description: `${PLAN_LABEL[plan]} test subscription for ${target.email}`,
        prefill: { email: target.email, name: target.name || '' },
        theme: { color: '#F59E0B' },
        handler: async (r) => {
          try {
            const { data: v } = await api.post('/payments/admin-test/verify', {
              email: target.email, plan,
              razorpay_payment_id: r?.razorpay_payment_id,
              razorpay_subscription_id: r?.razorpay_subscription_id,
              razorpay_signature: r?.razorpay_signature,
            });
            setTarget(v.user);
            setMsg({ ok: true, text: `Paid Rs 1. ${target.email} is now on ${PLAN_LABEL[v.plan]}.` +
              (v.old_subscription !== 'none' ? ` Previous subscription: ${v.old_subscription}.` : '') });
          } catch (e) { setMsg({ ok: false, text: `Paid, but activation failed: ${err(e)}` }); }
          finally { setBusy(''); }
        },
        modal: { ondismiss: () => setBusy('') },
      });
      rzp.on('payment.failed', (r) => { setMsg({ ok: false, text: r?.error?.description || 'Payment failed' }); setBusy(''); });
      rzp.open();
    } catch (e) { setMsg({ ok: false, text: err(e) }); setBusy(''); }
  }

  async function change(plan, action) {
    const verb = action === 'cancel' ? `Cancel ${PLAN_LABEL[plan]} and drop ${target.email} to Free now?`
                                     : `Downgrade ${target.email} to ${PLAN_LABEL[plan]} (no charge, current subscription is cancelled)?`;
    if (!window.confirm(verb)) return;
    setBusy(`${action}:${plan}`); setMsg(null);
    try {
      const { data } = await api.post(`/payments/admin-test/${action}`, { email: target.email, plan });
      setTarget(data.user);
      setMsg({ ok: true, text: `${target.email} is now on ${PLAN_LABEL[data.user.plan]}. Razorpay subscription: ${data.subscription}.` });
    } catch (e) { setMsg({ ok: false, text: err(e) }); }
    finally { setBusy(''); }
  }

  const cur = target ? (RANK[target.plan] ?? 0) : null;
  const btn = 'px-3 py-1.5 rounded-md text-xs font-semibold border transition disabled:opacity-30 disabled:cursor-not-allowed';

  return (
    <div className="bg-gray-800 border border-amber-500/40 rounded-xl p-5 mb-8">
      <p className="text-xs text-amber-400 uppercase tracking-wider font-semibold mb-1">Super admin: Rs 1 billing tests</p>
      <p className="text-xs text-gray-400 mb-4">
        Real Razorpay payments of Rs 1 against a non-admin test account. Emails, plan gates and
        cancellations behave exactly as for a customer. Log in as the test account to see features open and close.
      </p>

      <div className="flex gap-2 mb-4">
        <input
          type="email" value={email} onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && email && lookup()}
          placeholder="test account email"
          className="flex-1 bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-sm text-gray-100"
        />
        <button onClick={lookup} disabled={!email || !!busy}
          className={`${btn} border-gray-600 text-gray-200 hover:bg-gray-700`}>
          {busy === 'lookup' ? 'Loading...' : 'Load'}
        </button>
      </div>

      {target && (
        <p className="text-xs text-gray-300 mb-3">
          {target.email} · current plan <span className="font-semibold text-gray-50">{PLAN_LABEL[target.plan] || target.plan}</span>
          {target.plan_expires_at && <> · paid through {formatIST(target.plan_expires_at)}</>}
          {' · '}{target.has_subscription ? 'active Razorpay subscription' : 'no subscription'}
        </p>
      )}

      <div className="divide-y divide-gray-700 border border-gray-700 rounded-lg">
        {PLANS.map((p) => {
          const on = !!target;
          const canSub  = on && cur === 0;
          const canUp   = on && cur >= 1 && cur < p.rank;
          const canDown = on && cur > p.rank;
          const canCan  = on && target.plan === p.key;
          return (
            <div key={p.key} className="flex items-center justify-between gap-3 px-4 py-3 flex-wrap">
              <span className="text-sm font-semibold text-gray-100 w-20">{p.label}</span>
              <div className="flex gap-2 flex-wrap">
                <button disabled={!canSub || !!busy} onClick={() => pay(p.key, 'subscribe')}
                  className={`${btn} border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/10`}>Subscribe Rs 1</button>
                <button disabled={!canUp || !!busy} onClick={() => pay(p.key, 'upgrade')}
                  className={`${btn} border-sky-500/50 text-sky-300 hover:bg-sky-500/10`}>Upgrade Rs 1</button>
                <button disabled={!canDown || !!busy} onClick={() => change(p.key, 'downgrade')}
                  className={`${btn} border-amber-500/50 text-amber-300 hover:bg-amber-500/10`}>Downgrade</button>
                <button disabled={!canCan || !!busy} onClick={() => change(p.key, 'cancel')}
                  className={`${btn} border-red-500/50 text-red-300 hover:bg-red-500/10`}>Cancel</button>
              </div>
            </div>
          );
        })}
      </div>

      {msg && (
        <p className={`text-xs mt-3 ${msg.ok ? 'text-emerald-400' : 'text-amber-400'}`}>{msg.ok ? '🟢 ' : '🟡 '}{msg.text}</p>
      )}
    </div>
  );
}
