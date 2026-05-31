-- Migration 029: Add veed and mega source types
ALTER TYPE video_source_type ADD VALUE IF NOT EXISTS 'veed';
ALTER TYPE video_source_type ADD VALUE IF NOT EXISTS 'mega';
