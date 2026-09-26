-- ============================================================
-- 059_meta_event_counts.sql
--
-- PER-META-EVENT fired counters.
--
-- tracking_event_counts counts the VidaPulse event (vsl_50 fired 87 times).
-- Since a mapping cell can now name several Meta events, the Fired column
-- needs one number per name — "87, 12" when Lead was added to the cell later
-- than ViewContent. That divergence is the whole point: it shows how long
-- each name has actually been collecting.
--
-- A NEW table rather than a wider primary key on tracking_event_counts: adding
-- a PK column there would rebuild its unique index on a live, continuously
-- written table (the 055 lesson). A fresh table with an inline PK is instant
-- and locks nothing.
--
-- No backfill. Historical tracking_log pixel rows stored the whole mapping
-- cell as ONE meta_event string ("vsl_25_percent, ViewContent"), so counting
-- them would invent names that never fired. Per-name counts start from zero
-- and are honest; the old totals stay in tracking_event_counts.
--
-- Additive + idempotent.
-- ============================================================

CREATE TABLE IF NOT EXISTS tracking_meta_event_counts (
  video_id   UUID         NOT NULL,
  event_key  VARCHAR(80)  NOT NULL,
  meta_event VARCHAR(64)  NOT NULL,
  count      BIGINT       NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  PRIMARY KEY (video_id, event_key, meta_event)
);
