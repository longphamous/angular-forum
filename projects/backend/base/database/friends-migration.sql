-- =============================================================================
-- Friends – Schema Migration
-- Run as aniverse_app against aniverse_base:
--
--   psql -h localhost -p 5432 -U aniverse_app -d aniverse_base -f friends-migration.sql
--
-- Idempotent – safe to re-run.
-- =============================================================================

CREATE TABLE IF NOT EXISTS friendships (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    addressee_id UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status       VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (requester_id, addressee_id)
);

CREATE INDEX IF NOT EXISTS idx_friendships_requester ON friendships(requester_id);
CREATE INDEX IF NOT EXISTS idx_friendships_addressee ON friendships(addressee_id);
