-- =============================================================================
-- Link Database – Schema Migration
-- Run as aniverse_app against aniverse_base:
--
--   psql -h localhost -p 5432 -U aniverse_app -d aniverse_base -f link-database-migration.sql
--
-- Idempotent – safe to re-run.
-- =============================================================================

CREATE TABLE IF NOT EXISTS link_categories (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name              VARCHAR(100) NOT NULL,
    slug              VARCHAR(120) NOT NULL UNIQUE,
    description       TEXT,
    icon_class        VARCHAR(50),
    color             VARCHAR(20),
    sort_order        INTEGER     NOT NULL DEFAULT 0,
    requires_approval BOOLEAN     NOT NULL DEFAULT FALSE,
    default_sort_by   VARCHAR(20) NOT NULL DEFAULT 'createdAt',
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS link_entries (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title            VARCHAR(255) NOT NULL,
    url              TEXT         NOT NULL,
    description      TEXT,
    excerpt          TEXT,
    preview_image_url TEXT,
    tags             JSONB        NOT NULL DEFAULT '[]',
    status           VARCHAR(20)  NOT NULL DEFAULT 'active',
    view_count       INTEGER      NOT NULL DEFAULT 0,
    rating           NUMERIC(3,2) NOT NULL DEFAULT 0,
    rating_count     INTEGER      NOT NULL DEFAULT 0,
    category_id      UUID         NOT NULL REFERENCES link_categories(id) ON DELETE RESTRICT,
    author_id        UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assigned_to_id   UUID         REFERENCES users(id) ON DELETE SET NULL,
    address          TEXT,
    latitude         NUMERIC(10,7),
    longitude        NUMERIC(10,7),
    contact_email    VARCHAR(255),
    contact_phone    VARCHAR(50),
    custom_fields    JSONB,
    comment_count    INTEGER      NOT NULL DEFAULT 0,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_link_entries_category ON link_entries(category_id);
CREATE INDEX IF NOT EXISTS idx_link_entries_author   ON link_entries(author_id);
CREATE INDEX IF NOT EXISTS idx_link_entries_status   ON link_entries(status);

CREATE TABLE IF NOT EXISTS link_comments (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    link_id    UUID        NOT NULL REFERENCES link_entries(id) ON DELETE CASCADE,
    author_id  UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content    TEXT        NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS link_ratings (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    link_id    UUID        NOT NULL REFERENCES link_entries(id) ON DELETE CASCADE,
    user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    score      INTEGER     NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (link_id, user_id)
);
