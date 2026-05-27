-- 020_subscription_events.sql
--
-- NOTE: In the VidaPulse v2 architecture, the outbound_webhook_configs
-- table was DROPPED in migration 004_v2_architecture.sql and replaced
-- by the webhook_settings + behavioral_events pipeline.
--
-- All subscription lifecycle events (plan_expired, subscription_payment_failed,
-- subscription_cancelled) are emitted via emitEvent() and dispatched through
-- the behavioral_events / webhook_outbound_log pipeline to the single webhook
-- URL configured in webhook_settings.  No per-event config table is needed.
--
-- This migration is intentionally a no-op — kept for migration sequence integrity.

SELECT 1; -- no-op
