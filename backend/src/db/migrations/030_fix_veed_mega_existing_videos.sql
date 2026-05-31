-- Migration 030: Backfill source_type + playable_url for veed/mega videos
-- that were added before detection was deployed (saved as source_type='other').

-- ── Mega.nz ──────────────────────────────────────────────────────────────────
-- Convert mega.nz/file/HASH#KEY  →  mega.nz/embed/HASH#KEY
UPDATE videos
SET source_type           = 'mega',
    playable_url          = regexp_replace(original_url, 'mega\.nz/(file|video)/', 'mega.nz/embed/'),
    processing_status     = 'completed',
    using_iframe_fallback = TRUE,
    processing_error      = NULL,
    updated_at            = NOW()
WHERE source_type = 'other'
  AND original_url ~* 'mega\.nz/(file|video)/'
  AND original_url LIKE '%#%';

-- ── Veed.io ───────────────────────────────────────────────────────────────────
-- Use regexp_match (returns text[] or NULL, safe in scalar context) to extract
-- the UUID from /view/UUID[/...] and build the embed URL.
UPDATE videos
SET source_type           = 'veed',
    playable_url          = 'https://www.veed.io/embed/' ||
                            (regexp_match(original_url, '/view/([a-f0-9-]{8,})'))[1],
    processing_status     = 'completed',
    using_iframe_fallback = TRUE,
    processing_error      = NULL,
    updated_at            = NOW()
WHERE source_type = 'other'
  AND original_url ~* 'veed\.io'
  AND regexp_match(original_url, '/view/([a-f0-9-]{8,})') IS NOT NULL;
