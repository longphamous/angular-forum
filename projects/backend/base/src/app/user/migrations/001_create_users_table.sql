-- =============================================================================
-- Migration: 001_create_users_table
-- Description: Initial users table for the user module
-- Run: psql -h localhost -p 5432 -d aniverse_base -U aniverse_app -f 001_create_users_table.sql
-- =============================================================================

-- Create enums
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('admin', 'moderator', 'member', 'guest');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_status') THEN
    CREATE TYPE user_status AS ENUM ('active', 'inactive', 'banned', 'pending');
  END IF;
END
$$;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id            UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    username      VARCHAR(50)     NOT NULL UNIQUE,
    email         VARCHAR(255)    NOT NULL UNIQUE,
    password_hash TEXT            NOT NULL,
    display_name  VARCHAR(100)    NOT NULL,
    avatar_url    TEXT,
    bio           TEXT,
    role          user_role       NOT NULL DEFAULT 'member',
    status        user_status     NOT NULL DEFAULT 'active',
    last_login_at TIMESTAMPTZ,
    created_at    TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_username ON users (username);
CREATE INDEX IF NOT EXISTS idx_users_email    ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_role     ON users (role);
CREATE INDEX IF NOT EXISTS idx_users_status   ON users (status);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Seed data (dev only)
INSERT INTO users (id, username, email, password_hash, display_name, bio, role, status)
VALUES
    ('00000000-0000-0000-0000-000000000001', 'AdminUser',   'admin@aniverse.dev',  'hashed:admin',       'Admin',       NULL,           'admin',     'active'),
    ('00000000-0000-0000-0000-000000000002', 'NarutoFan99', 'naruto@aniverse.dev', 'hashed:password123', 'Naruto Fan',  'Dattebayo!',   'member',    'active'),
    ('00000000-0000-0000-0000-000000000003', 'AnimeQueen',  'queen@aniverse.dev',  'hashed:secure456',   'Anime Queen', 'Anime über alles!', 'moderator', 'active')
ON CONFLICT (username) DO NOTHING;

