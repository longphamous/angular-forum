-- Hashtag System migration
-- Run as aniverse_app or superuser after setup-db.sql

CREATE TABLE IF NOT EXISTS hashtags (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(100) NOT NULL UNIQUE,
    usage_count INTEGER NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hashtag_usages (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hashtag_id   UUID NOT NULL REFERENCES hashtags(id) ON DELETE CASCADE,
    content_type VARCHAR(20) NOT NULL,
    content_id   UUID NOT NULL,
    author_id    UUID NOT NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(hashtag_id, content_type, content_id)
);

CREATE INDEX IF NOT EXISTS idx_hashtag_usages_hashtag ON hashtag_usages(hashtag_id);
CREATE INDEX IF NOT EXISTS idx_hashtag_usages_content ON hashtag_usages(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_hashtags_usage_count ON hashtags(usage_count DESC);
