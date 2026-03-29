-- Clan/Team Module
-- Community-driven clan/team management system

-- ── Clan Categories ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS clan_categories (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(100) NOT NULL,
    description TEXT,
    icon        VARCHAR(50),
    position    INT          NOT NULL DEFAULT 0,
    is_active   BOOLEAN      DEFAULT true,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ── Clans ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS clans (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id          UUID REFERENCES clan_categories(id) ON DELETE SET NULL,
    name                 VARCHAR(200) NOT NULL,
    slug                 VARCHAR(200) NOT NULL UNIQUE,
    tag                  VARCHAR(20),
    tag_color            VARCHAR(20) DEFAULT '#3B82F6',
    tag_brackets         VARCHAR(10) DEFAULT '[]',
    description          TEXT,
    avatar_url           VARCHAR(500),
    banner_url           VARCHAR(500),
    owner_id             UUID         NOT NULL,
    join_type            VARCHAR(20)  NOT NULL DEFAULT 'open',
    member_count         INT          NOT NULL DEFAULT 1,
    show_activity        BOOLEAN      DEFAULT true,
    show_members         BOOLEAN      DEFAULT true,
    show_comments        BOOLEAN      DEFAULT true,
    application_template TEXT,
    custom_fields        JSONB,
    status               VARCHAR(20)  NOT NULL DEFAULT 'active',
    created_at           TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at           TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clans_slug ON clans(slug);
CREATE INDEX IF NOT EXISTS idx_clans_owner ON clans(owner_id);
CREATE INDEX IF NOT EXISTS idx_clans_category ON clans(category_id);

-- ── Clan Members ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS clan_members (
    id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clan_id   UUID        NOT NULL REFERENCES clans(id) ON DELETE CASCADE,
    user_id   UUID        NOT NULL,
    role      VARCHAR(20) NOT NULL DEFAULT 'member',
    joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_clan_member UNIQUE (clan_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_clan_members_clan ON clan_members(clan_id);
CREATE INDEX IF NOT EXISTS idx_clan_members_user ON clan_members(user_id);

-- ── Clan Applications / Invitations ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS clan_applications (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clan_id       UUID        NOT NULL REFERENCES clans(id) ON DELETE CASCADE,
    user_id       UUID        NOT NULL,
    invited_by_id UUID,
    type          VARCHAR(20) NOT NULL DEFAULT 'application',
    message       TEXT,
    status        VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clan_applications_clan ON clan_applications(clan_id);

-- ── Clan Pages ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS clan_pages (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clan_id      UUID         NOT NULL REFERENCES clans(id) ON DELETE CASCADE,
    title        VARCHAR(200) NOT NULL,
    slug         VARCHAR(200) NOT NULL,
    content      TEXT,
    position     INT          NOT NULL DEFAULT 0,
    is_published BOOLEAN      DEFAULT true,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ── Clan Comments ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS clan_comments (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clan_id    UUID NOT NULL REFERENCES clans(id) ON DELETE CASCADE,
    author_id  UUID NOT NULL,
    content    TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clan_comments_clan ON clan_comments(clan_id);
