-- =============================================================================
-- Aniverse Base – Forum Schema (LEGACY / REFERENCE)
-- This file is superseded by schema.sql which covers all application tables.
-- Kept for reference only – do NOT run separately if schema.sql was already applied.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Enum: reaction_type
-- ---------------------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'reaction_type') THEN
        CREATE TYPE reaction_type AS ENUM ('like', 'heart', 'laugh', 'sad', 'angry', 'wow');
        RAISE NOTICE 'Created enum reaction_type';
    ELSE
        RAISE NOTICE 'Enum reaction_type already exists – skipping';
    END IF;
END
$$;

-- ---------------------------------------------------------------------------
-- Table: forum_categories
-- Top-level groupings (e.g. "General", "Anime Discussion").
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS forum_categories (
    id          UUID        NOT NULL DEFAULT gen_random_uuid(),
    name        VARCHAR(100) NOT NULL,
    slug        VARCHAR(120) NOT NULL,
    description TEXT,
    position    INTEGER     NOT NULL DEFAULT 0,
    is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_forum_categories PRIMARY KEY (id),
    CONSTRAINT uq_forum_categories_slug UNIQUE (slug)
);

COMMENT ON TABLE  forum_categories            IS 'Top-level groupings that contain one or more forums.';
COMMENT ON COLUMN forum_categories.slug       IS 'URL-friendly identifier derived from name; must be unique.';
COMMENT ON COLUMN forum_categories.position   IS 'Display order (ASC); lower values appear first.';
COMMENT ON COLUMN forum_categories.is_active  IS 'Soft-visibility toggle; inactive categories are hidden from members.';

CREATE INDEX IF NOT EXISTS idx_forum_categories_position ON forum_categories (position);

-- ---------------------------------------------------------------------------
-- Table: forums
-- Individual boards (e.g. "Seasonal Anime", "Off-Topic").
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS forums (
    id                   UUID        NOT NULL DEFAULT gen_random_uuid(),
    category_id          UUID        NOT NULL,
    name                 VARCHAR(150) NOT NULL,
    slug                 VARCHAR(200) NOT NULL,
    description          TEXT,
    position             INTEGER     NOT NULL DEFAULT 0,
    is_locked            BOOLEAN     NOT NULL DEFAULT FALSE,
    is_private           BOOLEAN     NOT NULL DEFAULT FALSE,
    thread_count         INTEGER     NOT NULL DEFAULT 0,
    post_count           INTEGER     NOT NULL DEFAULT 0,
    last_post_at         TIMESTAMPTZ,
    last_post_by_user_id UUID,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_forums PRIMARY KEY (id),
    CONSTRAINT uq_forums_slug UNIQUE (slug),
    CONSTRAINT fk_forums_category FOREIGN KEY (category_id)
        REFERENCES forum_categories (id) ON DELETE CASCADE
);

COMMENT ON TABLE  forums                     IS 'Individual discussion boards grouped under a category.';
COMMENT ON COLUMN forums.is_locked           IS 'When TRUE, only moderators/admins may create new threads.';
COMMENT ON COLUMN forums.is_private          IS 'When TRUE, only authenticated members can view this forum.';
COMMENT ON COLUMN forums.thread_count        IS 'Cached count of non-deleted threads; updated on create/delete.';
COMMENT ON COLUMN forums.post_count          IS 'Cached count of all non-deleted posts; updated on create/delete.';
COMMENT ON COLUMN forums.last_post_at        IS 'Timestamp of the most recent post; used for sorting activity.';
COMMENT ON COLUMN forums.last_post_by_user_id IS 'userId (cross-module reference, no FK constraint) of the last poster.';

CREATE INDEX IF NOT EXISTS idx_forums_category_id ON forums (category_id);
CREATE INDEX IF NOT EXISTS idx_forums_position    ON forums (position);
CREATE INDEX IF NOT EXISTS idx_forums_last_post   ON forums (last_post_at DESC NULLS LAST);

-- ---------------------------------------------------------------------------
-- Table: forum_threads
-- Threads (topics) within a forum.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS forum_threads (
    id                   UUID        NOT NULL DEFAULT gen_random_uuid(),
    forum_id             UUID        NOT NULL,
    author_id            UUID        NOT NULL,
    title                VARCHAR(200) NOT NULL,
    slug                 VARCHAR(250) NOT NULL,
    is_pinned            BOOLEAN     NOT NULL DEFAULT FALSE,
    is_locked            BOOLEAN     NOT NULL DEFAULT FALSE,
    is_sticky            BOOLEAN     NOT NULL DEFAULT FALSE,
    view_count           INTEGER     NOT NULL DEFAULT 0,
    reply_count          INTEGER     NOT NULL DEFAULT 0,
    last_post_at         TIMESTAMPTZ,
    last_post_by_user_id UUID,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at           TIMESTAMPTZ,

    CONSTRAINT pk_forum_threads PRIMARY KEY (id),
    CONSTRAINT uq_forum_threads_slug UNIQUE (slug),
    CONSTRAINT fk_forum_threads_forum FOREIGN KEY (forum_id)
        REFERENCES forums (id) ON DELETE CASCADE
);

COMMENT ON TABLE  forum_threads              IS 'Individual discussion threads (topics) within a forum.';
COMMENT ON COLUMN forum_threads.author_id    IS 'Cross-module reference to users.id; no FK to avoid coupling.';
COMMENT ON COLUMN forum_threads.is_pinned    IS 'Pinned threads appear above normal threads.';
COMMENT ON COLUMN forum_threads.is_sticky    IS 'Sticky threads are always shown at the top of a forum listing.';
COMMENT ON COLUMN forum_threads.is_locked    IS 'When TRUE, only moderators/admins may add new posts.';
COMMENT ON COLUMN forum_threads.reply_count  IS 'Number of posts in the thread (excluding the first/OP post).';
COMMENT ON COLUMN forum_threads.deleted_at   IS 'NULL means active; non-NULL means soft-deleted.';

CREATE INDEX IF NOT EXISTS idx_forum_threads_forum_id   ON forum_threads (forum_id);
CREATE INDEX IF NOT EXISTS idx_forum_threads_author_id  ON forum_threads (author_id);
CREATE INDEX IF NOT EXISTS idx_forum_threads_pinned_last ON forum_threads (forum_id, is_pinned DESC, last_post_at DESC NULLS LAST)
    WHERE deleted_at IS NULL;

-- ---------------------------------------------------------------------------
-- Table: forum_posts
-- Individual posts (replies) within a thread.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS forum_posts (
    id              UUID        NOT NULL DEFAULT gen_random_uuid(),
    thread_id       UUID        NOT NULL,
    author_id       UUID        NOT NULL,
    content         TEXT        NOT NULL,
    is_first_post   BOOLEAN     NOT NULL DEFAULT FALSE,
    is_edited       BOOLEAN     NOT NULL DEFAULT FALSE,
    edited_at       TIMESTAMPTZ,
    edit_count      INTEGER     NOT NULL DEFAULT 0,
    reaction_count  INTEGER     NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ,

    CONSTRAINT pk_forum_posts PRIMARY KEY (id),
    CONSTRAINT fk_forum_posts_thread FOREIGN KEY (thread_id)
        REFERENCES forum_threads (id) ON DELETE CASCADE
);

COMMENT ON TABLE  forum_posts               IS 'Individual posts (replies) within a thread.';
COMMENT ON COLUMN forum_posts.author_id     IS 'Cross-module reference to users.id; no FK to avoid coupling.';
COMMENT ON COLUMN forum_posts.is_first_post IS 'TRUE for the opening post that was created together with the thread.';
COMMENT ON COLUMN forum_posts.reaction_count IS 'Cached total reactions across all types; updated on react/unreact.';
COMMENT ON COLUMN forum_posts.deleted_at    IS 'NULL means active; non-NULL means soft-deleted.';

CREATE INDEX IF NOT EXISTS idx_forum_posts_thread_id  ON forum_posts (thread_id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_author_id  ON forum_posts (author_id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_created_at ON forum_posts (thread_id, created_at ASC)
    WHERE deleted_at IS NULL;

-- ---------------------------------------------------------------------------
-- Table: forum_post_reactions
-- Per-user, per-post emoji reactions.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS forum_post_reactions (
    id            UUID          NOT NULL DEFAULT gen_random_uuid(),
    post_id       UUID          NOT NULL,
    user_id       UUID          NOT NULL,
    reaction_type reaction_type NOT NULL,
    created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_forum_post_reactions     PRIMARY KEY (id),
    CONSTRAINT uq_forum_post_reactions_user UNIQUE (post_id, user_id),
    CONSTRAINT fk_forum_post_reactions_post FOREIGN KEY (post_id)
        REFERENCES forum_posts (id) ON DELETE CASCADE
);

COMMENT ON TABLE  forum_post_reactions              IS 'One emoji reaction per user per post.';
COMMENT ON COLUMN forum_post_reactions.user_id      IS 'Cross-module reference to users.id; no FK to avoid coupling.';
COMMENT ON COLUMN forum_post_reactions.reaction_type IS 'Constrained to the reaction_type enum values.';

CREATE INDEX IF NOT EXISTS idx_forum_post_reactions_post_id  ON forum_post_reactions (post_id);
CREATE INDEX IF NOT EXISTS idx_forum_post_reactions_user_id  ON forum_post_reactions (user_id);

-- ---------------------------------------------------------------------------
-- Permissions – grant to application role
-- ---------------------------------------------------------------------------
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE forum_categories      TO aniverse_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE forums                TO aniverse_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE forum_threads         TO aniverse_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE forum_posts           TO aniverse_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE forum_post_reactions  TO aniverse_app;
