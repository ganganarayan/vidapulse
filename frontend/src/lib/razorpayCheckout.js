'use strict';
import api from './api';
import { savePurchaseIntent } from './pixel';

/**
 * razorpayCheckout — start a subscription purchase IN-PAGE (no tab switch).
 *
 * Flow:
 *   1. POST /api/payments/subscribe → { subscriptionId, keyId } (a Razorpay
 *      Subscription is created server-side; keyId is the PUBLIC key).
 *   2. Open Razorpay Checkout as an overlay on the current page (same tab).
 *   3. On success, the customer is returned to /payment/:plan — that page polls
 *      /api/user/me until the subscription.charged webhook flips the plan, then
 *      sends them to the dashboard with upgraded access.
 *
 * The Razorpay webhook is the source of truth for activation (HMAC-verified
 * server-side); the client handler only routes to the polling page.
 *
 * Falls back to the hosted payment page (paymentUrl) if Checkout can't be used
 * (e.g. an older backend that doesn't return keyId).
 */

const CHECKOUT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';

function loadRazorpayScript() {
  return new Promise((resolve, reject) => {
    if (typeof window !== 'undefined' && window.Razorpay) return resolve();
    const existing = document.getElementById('razorpay-checkout-js');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Failed to load the payment gateway.')));
      return;
    }
    const s = document.createElement('script');
    s.id = 'razorpay-checkout-js';
    s.src = CHECKOUT_SRC;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Failed to load the payment gateway. Check your connection.'));
    document.body.appendChild(s);
  });
}

/**
 * @param {object}   opts
 * @param {'starter'|'pro'} opts.plan
 * @param {number}   [opts.value]      purchase value for the Purchase pixel
 * @param {string}   [opts.currency]   'INR' | 'USD' (default 'INR')
 * @param {object}   [opts.user]       { name, email, phone } for prefill
 * @param {function} [opts.onError]    (message) => void
 * @param {function} [opts.onDismiss]  () => void — modal closed without paying
 */
export async function startSubscriptionCheckout({ plan, value, currency, user, onError, onDismiss }) {
  try {
    await loadRazorpayScript();

    const { data } = await api.post('/payments/subscribe', { plan });

    // Save the purchase intent so the Purchase pixel reports the right currency/value.
    savePurchaseIntent({
      plan,
      currency: currency ?? 'INR',
      value   : value ?? (plan === 'starter' ? 999 : 1999),
    });

    // No keyId/subscriptionId (older backend) → fall back to the hosted page.
    if (!data.keyId || !data.subscriptionId) {
      if (data.paymentUrl) { window.location.href = data.paymentUrl; return; }
      throw new Error('Could not start checkout. Please try again.');
    }

    const rzp = new window.Razorpay({
      key            : data.keyId,
      subscription_id: data.subscriptionId,
      name           : 'VidaPulse',
      description    : `${plan === 'pro' ? 'Pro' : 'Starter'} plan — monthly subscription`,
      prefill        : {
        name   : user?.name  || '',
        email  : user?.email || '',
        contact: user?.phone || '',
      },
      theme          : { color: '#F59E0B' },
      // Success: verify + activate immediately (no waiting on the webhook), then
      // go to the polling success page in the same tab. If verify fails, the
      // webhook is still the backstop — the success page keeps polling.
      handler        : async function (response) {
        try {
          await api.post('/payments/verify', {
            razorpay_payment_id     : response?.razorpay_payment_id,
            razorpay_subscription_id: response?.razorpay_subscription_id,
            razorpay_signature      : response?.razorpay_signature,
            plan,
          });
        } catch (_) {
          // fall through — /payment/:plan will poll for the webhook activation
        }
        window.location.href = `/payment/${plan}`;
      },
      modal          : {
        ondismiss: function () { if (typeof onDismiss === 'function') onDismiss(); },
      },
    });

    rzp.on('payment.failed', function (resp) {
      if (typeof onError === 'function') {
        onError(resp?.error?.description || 'Payment failed. Please try again.');
      }
    });

    rzp.open();
  } catch (err) {
    const msg = err?.response?.data?.error || err?.message || 'Something went wrong. Please try again.';
    if (typeof onError === 'function') onError(msg);
  }
}
