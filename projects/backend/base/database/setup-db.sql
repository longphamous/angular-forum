-- =============================================================================
-- Aniverse Base – Bootstrap Script  (Step 1 of 2)
-- Run ONCE as a PostgreSQL superuser to create the role and the database:
--
--   psql -h localhost -p 5432 -U postgres -f setup-db.sql
--
-- Afterwards run Step 2 to create all application tables:
--
--   psql -h localhost -p 5432 -U aniverse_app -d aniverse_base -f schema.sql
--
-- Both scripts are idempotent – safe to re-run.
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

-- 2. Create the application database owned by aniverse_app (idempotent)
SELECT 'CREATE DATABASE aniverse_base OWNER aniverse_app'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'aniverse_base') \gexec

-- =============================================================================
-- Next step:
--   psql -h localhost -p 5432 -U aniverse_app -d aniverse_base -f schema.sql
-- =============================================================================
