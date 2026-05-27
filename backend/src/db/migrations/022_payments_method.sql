-- 022_payments_method.sql
--
-- Adds payment_method to the payments table.
-- Populated from the Razorpay webhook payment entity's 'method' field.
-- Values stored: 'card' | 'upi' | 'netbanking' | 'paypal' | 'emi' | 'wallet_*' | 'unknown'
-- For PayPal: method='wallet' + wallet='paypal' → stored as 'paypal'

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS payment_method TEXT;
