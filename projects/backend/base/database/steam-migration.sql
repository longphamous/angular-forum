-- =============================================================================
-- Steam Integration – Schema Migration
-- Run as aniverse_app against aniverse_base:
--
--   psql -h localhost -p 5432 -U aniverse_app -d aniverse_base -f steam-migration.sql
--
-- Idempotent – safe to re-run.
-- =============================================================================

CREATE TABLE IF NOT EXISTS steam_profiles (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        UUID         NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    steam_id       VARCHAR(20)  NOT NULL UNIQUE,
    persona_name   VARCHAR(100) NOT NULL,
    avatar_url     TEXT,
    profile_url    TEXT,
    online_status  INT          NOT NULL DEFAULT 0,
    current_game   VARCHAR(200),
    game_count     INT          NOT NULL DEFAULT 0,
    is_public      BOOLEAN      NOT NULL DEFAULT TRUE,
    sync_friends   BOOLEAN      NOT NULL DEFAULT TRUE,
    last_synced    TIMESTAMPTZ,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_steam_profiles_user_id  ON steam_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_steam_profiles_steam_id ON steam_profiles(steam_id);
