-- 020_subscription_events.sql
--
-- Adds behavioral event entries for subscription lifecycle events so
-- DivineLead CRM can be notified when:
--   • plan_expired              — subscription period ended, user downgraded to free
--   • subscription_payment_failed — Razorpay reported subscription.halted
--   • subscription_cancelled    — user or Razorpay cancelled the subscription

INSERT INTO outbound_webhook_configs (event_type, description)
VALUES
  ('plan_expired',
   'Fired when a paid plan expires and the user is downgraded to free (no active subscription)'),
  ('subscription_payment_failed',
   'Fired when Razorpay reports subscription.halted (payment failed, subscription suspended)'),
  ('subscription_cancelled',
   'Fired when a Razorpay subscription is cancelled or completed')
ON CONFLICT (event_type) DO NOTHING;
