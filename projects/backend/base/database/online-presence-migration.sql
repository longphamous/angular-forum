-- =============================================================================
-- Online Presence – Schema Migration
-- Adds last_seen_at to users and creates new tables for friends/links/TCG.
-- Run as aniverse_app against aniverse_base:
--
--   psql -h localhost -p 5432 -U aniverse_app -d aniverse_base -f online-presence-migration.sql
--
-- Idempotent – safe to re-run.
-- =============================================================================

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_users_last_seen_at ON users(last_seen_at)
    WHERE last_seen_at IS NOT NULL;
