-- Quest System migration
-- Run as aniverse_app or superuser after rpg-migration.sql

-- Add glory field to user_characters
ALTER TABLE user_characters ADD COLUMN IF NOT EXISTS glory INTEGER NOT NULL DEFAULT 0;

-- Quest definitions
CREATE TABLE IF NOT EXISTS quests (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name             VARCHAR(200) NOT NULL,
    description      TEXT,
    icon             VARCHAR(100),
    quest_type       VARCHAR(20) NOT NULL,
    trigger_type     VARCHAR(50) NOT NULL,
    required_count   INTEGER NOT NULL DEFAULT 1,
    rewards          JSONB NOT NULL DEFAULT '[]',
    glory_reward     INTEGER NOT NULL DEFAULT 0,
    required_level   INTEGER,
    is_active        BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order       INTEGER NOT NULL DEFAULT 0,
    event_starts_at  TIMESTAMPTZ,
    event_ends_at    TIMESTAMPTZ,
    event_banner_url VARCHAR(500),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quests_type ON quests(quest_type);
CREATE INDEX IF NOT EXISTS idx_quests_active ON quests(is_active);

-- User quest progress
CREATE TABLE IF NOT EXISTS user_quests (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    quest_id      UUID NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
    progress      INTEGER NOT NULL DEFAULT 0,
    status        VARCHAR(20) NOT NULL DEFAULT 'active',
    period_key    VARCHAR(20) NOT NULL,
    completed_at  TIMESTAMPTZ,
    claimed_at    TIMESTAMPTZ,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, quest_id, period_key)
);

CREATE INDEX IF NOT EXISTS idx_user_quests_user ON user_quests(user_id);
CREATE INDEX IF NOT EXISTS idx_user_quests_status ON user_quests(status);
