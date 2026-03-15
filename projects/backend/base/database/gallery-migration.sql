-- Gallery Module Migration
-- Run as: psql -U aniverse_app -d aniverse_base -f gallery-migration.sql

CREATE TABLE IF NOT EXISTS gallery_albums (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    cover_media_id UUID,
    owner_id UUID NOT NULL,
    access_level VARCHAR(20) NOT NULL DEFAULT 'public',
    password VARCHAR(255),
    watermark_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    allow_comments BOOLEAN NOT NULL DEFAULT TRUE,
    allow_ratings BOOLEAN NOT NULL DEFAULT TRUE,
    allow_download BOOLEAN NOT NULL DEFAULT TRUE,
    tags JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS gallery_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    album_id UUID NOT NULL REFERENCES gallery_albums(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL,
    type VARCHAR(20) NOT NULL DEFAULT 'image',
    url TEXT NOT NULL,
    youtube_id VARCHAR(20),
    title VARCHAR(255),
    description TEXT,
    filename VARCHAR(255),
    mime_type VARCHAR(100),
    file_size BIGINT,
    width INT,
    height INT,
    taken_at TIMESTAMPTZ,
    latitude DECIMAL(9,6),
    longitude DECIMAL(9,6),
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS gallery_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    media_id UUID NOT NULL REFERENCES gallery_media(id) ON DELETE CASCADE,
    author_id UUID NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS gallery_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    media_id UUID NOT NULL REFERENCES gallery_media(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (media_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_gallery_albums_owner_id ON gallery_albums(owner_id);
CREATE INDEX IF NOT EXISTS idx_gallery_albums_access_level ON gallery_albums(access_level);
CREATE INDEX IF NOT EXISTS idx_gallery_media_album_id ON gallery_media(album_id);
CREATE INDEX IF NOT EXISTS idx_gallery_media_owner_id ON gallery_media(owner_id);
CREATE INDEX IF NOT EXISTS idx_gallery_comments_media_id ON gallery_comments(media_id);
CREATE INDEX IF NOT EXISTS idx_gallery_ratings_media_id ON gallery_ratings(media_id);
