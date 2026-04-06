CREATE TABLE IF NOT EXISTS user_manga_list (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    manga_id INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('reading','completed','plan_to_read','on_hold','dropped')),
    score SMALLINT CHECK (score IS NULL OR (score >= 1 AND score <= 10)),
    chapters_read INTEGER NOT NULL DEFAULT 0,
    volumes_read INTEGER NOT NULL DEFAULT 0,
    review TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, manga_id)
);

CREATE INDEX IF NOT EXISTS idx_user_manga_list_user ON user_manga_list(user_id);
