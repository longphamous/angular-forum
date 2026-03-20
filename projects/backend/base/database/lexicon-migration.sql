-- Lexicon Module Migration
-- Run as superuser or aniverse_app role

-- Enable uuid-ossp if not already
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── lexicon_categories ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lexicon_categories (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name          VARCHAR(100) NOT NULL,
    slug          VARCHAR(100) NOT NULL UNIQUE,
    description   TEXT,
    parent_id     UUID REFERENCES lexicon_categories(id) ON DELETE SET NULL,
    position      INT NOT NULL DEFAULT 0,
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,
    custom_fields JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lexicon_categories_parent ON lexicon_categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_lexicon_categories_slug ON lexicon_categories(slug);

-- ── lexicon_articles ────────────────────────────────────────────
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lexicon_article_status') THEN
        CREATE TYPE lexicon_article_status AS ENUM ('draft', 'pending', 'published', 'rejected', 'archived');
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS lexicon_articles (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title               VARCHAR(255) NOT NULL,
    slug                VARCHAR(255) NOT NULL UNIQUE,
    content             TEXT NOT NULL,
    excerpt             TEXT,
    language            VARCHAR(5) NOT NULL DEFAULT 'de',
    status              lexicon_article_status NOT NULL DEFAULT 'draft',
    tags                JSONB NOT NULL DEFAULT '[]'::jsonb,
    custom_field_values JSONB NOT NULL DEFAULT '{}'::jsonb,
    cover_image_url     TEXT,
    view_count          INT NOT NULL DEFAULT 0,
    is_locked           BOOLEAN NOT NULL DEFAULT FALSE,
    allow_comments      BOOLEAN NOT NULL DEFAULT TRUE,
    published_at        TIMESTAMPTZ,
    category_id         UUID NOT NULL REFERENCES lexicon_categories(id),
    author_id           UUID NOT NULL REFERENCES users(id),
    linked_article_id   UUID REFERENCES lexicon_articles(id) ON DELETE SET NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at          TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_lexicon_articles_category ON lexicon_articles(category_id);
CREATE INDEX IF NOT EXISTS idx_lexicon_articles_author ON lexicon_articles(author_id);
CREATE INDEX IF NOT EXISTS idx_lexicon_articles_language ON lexicon_articles(language);
CREATE INDEX IF NOT EXISTS idx_lexicon_articles_status ON lexicon_articles(status);
CREATE INDEX IF NOT EXISTS idx_lexicon_articles_slug ON lexicon_articles(slug);
CREATE INDEX IF NOT EXISTS idx_lexicon_articles_tags ON lexicon_articles USING GIN (tags);

-- ── lexicon_article_versions ────────────────────────────────────
CREATE TABLE IF NOT EXISTS lexicon_article_versions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id          UUID NOT NULL REFERENCES lexicon_articles(id) ON DELETE CASCADE,
    version_number      INT NOT NULL,
    title               VARCHAR(255) NOT NULL,
    content             TEXT NOT NULL,
    custom_field_values JSONB NOT NULL DEFAULT '{}'::jsonb,
    author_id           UUID NOT NULL REFERENCES users(id),
    change_summary      VARCHAR(500),
    is_protected        BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(article_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_lexicon_versions_article ON lexicon_article_versions(article_id);

-- ── lexicon_comments ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lexicon_comments (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id  UUID NOT NULL REFERENCES lexicon_articles(id) ON DELETE CASCADE,
    author_id   UUID NOT NULL REFERENCES users(id),
    content     TEXT NOT NULL,
    parent_id   UUID REFERENCES lexicon_comments(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lexicon_comments_article ON lexicon_comments(article_id);
CREATE INDEX IF NOT EXISTS idx_lexicon_comments_author ON lexicon_comments(author_id);

-- ── lexicon_terms ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lexicon_terms (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    language    VARCHAR(5) NOT NULL UNIQUE,
    content     TEXT NOT NULL,
    updated_by  UUID NOT NULL REFERENCES users(id),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── lexicon_reports ─────────────────────────────────────────────
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lexicon_report_status') THEN
        CREATE TYPE lexicon_report_status AS ENUM ('open', 'resolved', 'dismissed');
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS lexicon_reports (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id  UUID NOT NULL REFERENCES lexicon_articles(id) ON DELETE CASCADE,
    reporter_id UUID NOT NULL REFERENCES users(id),
    reason      TEXT NOT NULL,
    status      lexicon_report_status NOT NULL DEFAULT 'open',
    resolved_by UUID REFERENCES users(id),
    resolved_at TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lexicon_reports_article ON lexicon_reports(article_id);
CREATE INDEX IF NOT EXISTS idx_lexicon_reports_status ON lexicon_reports(status);

-- Grant permissions to app role
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO aniverse_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO aniverse_app;
