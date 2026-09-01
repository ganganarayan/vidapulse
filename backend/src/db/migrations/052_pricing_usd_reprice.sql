-- 052_pricing_usd_reprice.sql
--
-- Reprice to the USD tiers on the B2B landing page:
--   Starter  $29  · up to 10 videos
--   Growth   $79  · up to 20 videos   (internal plan key stays 'pro')
--
-- Also aligns the tier feature-sets with the landing:
--   engagement heatmap + drop-off + re-watches move into Starter.
-- (Runtime gating is enforced in code — middleware/planGate.js and the
--  frontend required-plan maps. The plans.features JSONB is updated here for
--  consistency / display only.)
--
-- No 'scale' tier row is created — Scale ($199) is a "Talk to us" contact
-- card only; its multi-user / API / white-label features are not built yet.
--
-- Charging is USD: razorpayService.js creates the Razorpay plans in USD.
-- The old INR plan cache is cleared so fresh USD plans get provisioned on the
-- next subscription attempt.

-- ── Starter → $29, 10 videos, gains heatmap / drop-off / re-watches ─────────
UPDATE plans
SET price_usd    = 29,
    price_inr    = 0,
    video_limit  = 10,
    display_name = 'Starter',
    features     = '["up_to_10_videos","all_free_features","total_plays","play_rate","unique_visitors_count","domain_tracking","direct_link_embed_code","geographic_data","device_browser_breakdown","avg_time_watched","engagement_heatmaps","drop_off_rate","rewatches","custom_player_controls","playlists","email_support"]',
    updated_at   = NOW()
WHERE name = 'starter';

-- ── Pro → displayed as "Growth", $79, 20 videos ────────────────────────────
UPDATE plans
SET price_usd    = 79,
    price_inr    = 0,
    video_limit  = 20,
    display_name = 'Growth',
    features     = '["up_to_20_videos","all_starter_features","viewer_level_analytics","audience_segmentation","conversion_tracking","funnels","server_side_pixel_forwarding","video_comparison","ai_insights","events_tracking","reports","alerts","priority_support"]',
    updated_at   = NOW()
WHERE name = 'pro';

-- ── Clear cached (INR) Razorpay plan IDs so USD plans are recreated ─────────
DELETE FROM razorpay_plans WHERE plan_name IN ('starter', 'pro');
