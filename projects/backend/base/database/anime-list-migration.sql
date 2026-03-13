-- ============================================================
-- User Anime List – Migration
-- Run as aniverse_app role against aniverse_base database
-- ============================================================

CREATE TABLE IF NOT EXISTS user_anime_list (
    id               UUID        NOT NULL DEFAULT gen_random_uuid(),
    user_id          UUID        NOT NULL,
    anime_id         INTEGER     NOT NULL,
    status           VARCHAR(20) NOT NULL
                     CHECK (status IN ('watching','completed','plan_to_watch','on_hold','dropped')),
    score            SMALLINT    CHECK (score IS NULL OR (score >= 1 AND score <= 10)),
    episodes_watched INTEGER     NOT NULL DEFAULT 0,
    review           TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_user_anime_list           PRIMARY KEY (id),
    CONSTRAINT uq_user_anime_list_user_anime UNIQUE (user_id, anime_id),
    CONSTRAINT fk_user_anime_list_user      FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_anime_list_user_id  ON user_anime_list (user_id);
CREATE INDEX IF NOT EXISTS idx_user_anime_list_anime_id ON user_anime_list (anime_id);
CREATE INDEX IF NOT EXISTS idx_user_anime_list_status   ON user_anime_list (user_id, status);

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE user_anime_list TO aniverse_app;
