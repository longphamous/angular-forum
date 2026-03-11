-- =============================================================================
-- Aniverse Base – Bootstrap script
-- Run once as a superuser: psql -h localhost -p 5432 -f setup-db.sql
-- =============================================================================

-- 1. Create the dedicated application role (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'aniverse_app') THEN
    CREATE ROLE aniverse_app WITH LOGIN PASSWORD 'CHANGE_ME';
    RAISE NOTICE 'Created role aniverse_app';
  ELSE
    RAISE NOTICE 'Role aniverse_app already exists – skipping';
  END IF;
END
$$;

-- 2. Create the database (cannot be done inside a transaction block, so use
--    CREATE DATABASE only if it does not exist via shell wrapper)
SELECT 'CREATE DATABASE aniverse_base OWNER aniverse_app'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'aniverse_base') \gexec

