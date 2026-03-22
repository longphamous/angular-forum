-- Recipe Module Migration
-- Run this as the aniverse_app role (or superuser on aniverse_base)

-- ── Categories ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS recipe_categories (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(100) NOT NULL,
    slug        VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon        VARCHAR(50)  NOT NULL DEFAULT 'pi pi-folder',
    position    INTEGER      NOT NULL DEFAULT 0,
    is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── Recipes ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS recipes (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title           VARCHAR(200) NOT NULL,
    slug            VARCHAR(200) NOT NULL UNIQUE,
    description     TEXT,
    category_id     UUID         REFERENCES recipe_categories(id) ON DELETE SET NULL,
    author_id       UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    cover_image_url TEXT,
    servings        INTEGER,
    prep_time       INTEGER,
    cook_time       INTEGER,
    difficulty      VARCHAR(20)  NOT NULL DEFAULT 'medium',
    dietary_tags    JSONB        NOT NULL DEFAULT '[]',
    ingredients     JSONB        NOT NULL DEFAULT '[]',
    steps           JSONB        NOT NULL DEFAULT '[]',
    nutrition       JSONB,
    tags            JSONB        NOT NULL DEFAULT '[]',
    status          VARCHAR(20)  NOT NULL DEFAULT 'draft',
    view_count      INTEGER      NOT NULL DEFAULT 0,
    favorite_count  INTEGER      NOT NULL DEFAULT 0,
    allow_comments  BOOLEAN      NOT NULL DEFAULT TRUE,
    published_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_recipes_author     ON recipes(author_id);
CREATE INDEX IF NOT EXISTS idx_recipes_category   ON recipes(category_id);
CREATE INDEX IF NOT EXISTS idx_recipes_status     ON recipes(status);
CREATE INDEX IF NOT EXISTS idx_recipes_difficulty  ON recipes(difficulty);
CREATE INDEX IF NOT EXISTS idx_recipes_deleted_at  ON recipes(deleted_at);

-- ── Comments ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS recipe_comments (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id  UUID NOT NULL REFERENCES recipes(id)          ON DELETE CASCADE,
    author_id  UUID NOT NULL REFERENCES users(id)            ON DELETE CASCADE,
    content    TEXT NOT NULL,
    parent_id  UUID          REFERENCES recipe_comments(id)  ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recipe_comments_recipe ON recipe_comments(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_comments_author ON recipe_comments(author_id);
CREATE INDEX IF NOT EXISTS idx_recipe_comments_parent ON recipe_comments(parent_id);

-- ── Favorites ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS recipe_favorites (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
    recipe_id  UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, recipe_id)
);

CREATE INDEX IF NOT EXISTS idx_recipe_favorites_user   ON recipe_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_recipe_favorites_recipe ON recipe_favorites(recipe_id);

-- ── Ratings ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS recipe_ratings (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID    NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
    recipe_id  UUID    NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    rating     INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, recipe_id)
);

CREATE INDEX IF NOT EXISTS idx_recipe_ratings_user   ON recipe_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_recipe_ratings_recipe ON recipe_ratings(recipe_id);

-- ── Seed categories ───────────────────────────────────────────────────────────

INSERT INTO recipe_categories (name, slug, description, icon, position) VALUES
    ('Vorspeisen',          'vorspeisen',          'Appetizers',       'pi pi-star',       1),
    ('Hauptgerichte',       'hauptgerichte',       'Main Courses',     'pi pi-home',       2),
    ('Desserts',            'desserts',            'Desserts',         'pi pi-heart',      3),
    ('Snacks & Beilagen',   'snacks-beilagen',     'Snacks & Sides',   'pi pi-bolt',       4),
    ('Getränke',            'getraenke',           'Drinks',           'pi pi-glass-water', 5),
    ('Backen',              'backen',              'Baking',           'pi pi-gift',       6)
ON CONFLICT DO NOTHING;
