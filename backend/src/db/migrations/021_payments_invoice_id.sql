-- 021_payments_invoice_id.sql
--
-- Adds razorpay_invoice_id to the payments table.
-- Populated from subscription.charged webhook payload (paymentEntity.invoice_id).
-- Used by the billing API to generate a redirect link to the Razorpay invoice page.

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS razorpay_invoice_id TEXT;

CREATE INDEX IF NOT EXISTS idx_payments_invoice_id
  ON payments (razorpay_invoice_id)
  WHERE razorpay_invoice_id IS NOT NULL;
