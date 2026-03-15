-- Blog Module Migration
-- Run this as the aniverse_app role (or superuser on aniverse_base)

-- ── Categories ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS blog_categories (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(100) NOT NULL UNIQUE,
    slug        VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    color       VARCHAR(20),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Posts ─────────────────────────────────────────────────────────────────────

CREATE TYPE blog_type   AS ENUM ('personal', 'editorial', 'news', 'diary');
CREATE TYPE blog_status AS ENUM ('draft', 'published', 'archived');

CREATE TABLE IF NOT EXISTS blog_posts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title           VARCHAR(255) NOT NULL,
    slug            VARCHAR(255) NOT NULL UNIQUE,
    content         TEXT         NOT NULL,
    excerpt         TEXT,
    type            blog_type    NOT NULL DEFAULT 'personal',
    status          blog_status  NOT NULL DEFAULT 'draft',
    author_id       UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id     UUID         REFERENCES blog_categories(id) ON DELETE SET NULL,
    cover_image_url TEXT,
    tags            JSONB        NOT NULL DEFAULT '[]',
    view_count      INTEGER      NOT NULL DEFAULT 0,
    allow_comments  BOOLEAN      NOT NULL DEFAULT TRUE,
    published_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blog_posts_author   ON blog_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON blog_posts(category_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status   ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_type     ON blog_posts(type);

-- ── Comments ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS blog_comments (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id    UUID NOT NULL REFERENCES blog_posts(id)    ON DELETE CASCADE,
    author_id  UUID NOT NULL REFERENCES users(id)         ON DELETE CASCADE,
    content    TEXT NOT NULL,
    parent_id  UUID          REFERENCES blog_comments(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blog_comments_post   ON blog_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_blog_comments_author ON blog_comments(author_id);
CREATE INDEX IF NOT EXISTS idx_blog_comments_parent ON blog_comments(parent_id);

-- ── Seed categories ───────────────────────────────────────────────────────────

INSERT INTO blog_categories (name, slug, description, color) VALUES
    ('Community News', 'community-news', 'Neuigkeiten aus der Community',  '#3B82F6'),
    ('Tutorials',      'tutorials',      'Anleitungen und Tipps',           '#10B981'),
    ('Tagebuch',       'tagebuch',       'Persönliche Einträge',            '#F59E0B'),
    ('Events',         'events',         'Veranstaltungen und Ankündigungen','#EC4899')
ON CONFLICT DO NOTHING;
