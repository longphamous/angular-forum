-- =============================================================================
-- Aniverse – Groups & Page Permissions Migration
-- Run as aniverse_app against aniverse_base:
--
--   psql -h localhost -p 5432 -U aniverse_app -d aniverse_base -f groups-migration.sql
--
-- Idempotent: safe to re-run at any time.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Table: groups
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS groups (
    id          UUID         NOT NULL DEFAULT gen_random_uuid(),
    name        VARCHAR(100) NOT NULL,
    description TEXT,
    is_system   BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_groups      PRIMARY KEY (id),
    CONSTRAINT uq_groups_name UNIQUE (name)
);

COMMENT ON TABLE  groups           IS 'User groups for group-based access control.';
COMMENT ON COLUMN groups.is_system IS 'System groups (Jeder, Gast, etc.) cannot be deleted.';

CREATE INDEX IF NOT EXISTS idx_groups_name ON groups (name);

-- ---------------------------------------------------------------------------
-- Table: user_groups  (junction: users ↔ groups)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_groups (
    user_id    UUID        NOT NULL,
    group_id   UUID        NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_user_groups       PRIMARY KEY (user_id, group_id),
    CONSTRAINT fk_user_groups_user  FOREIGN KEY (user_id)  REFERENCES users  (id) ON DELETE CASCADE,
    CONSTRAINT fk_user_groups_group FOREIGN KEY (group_id) REFERENCES groups (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_groups_user_id  ON user_groups (user_id);
CREATE INDEX IF NOT EXISTS idx_user_groups_group_id ON user_groups (group_id);

-- ---------------------------------------------------------------------------
-- Table: page_permissions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS page_permissions (
    id         UUID         NOT NULL DEFAULT gen_random_uuid(),
    route      VARCHAR(300) NOT NULL,
    name       VARCHAR(200) NOT NULL,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_page_permissions       PRIMARY KEY (id),
    CONSTRAINT uq_page_permissions_route UNIQUE (route)
);

COMMENT ON TABLE  page_permissions       IS 'Page-level permission rules, keyed by Angular route path.';
COMMENT ON COLUMN page_permissions.route IS 'Angular route path, e.g. /dashboard or /admin/users.';

-- ---------------------------------------------------------------------------
-- Table: page_permission_groups  (junction: page_permissions ↔ groups)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS page_permission_groups (
    page_permission_id UUID NOT NULL,
    group_id           UUID NOT NULL,

    CONSTRAINT pk_page_permission_groups PRIMARY KEY (page_permission_id, group_id),
    CONSTRAINT fk_ppg_permission         FOREIGN KEY (page_permission_id) REFERENCES page_permissions (id) ON DELETE CASCADE,
    CONSTRAINT fk_ppg_group              FOREIGN KEY (group_id)           REFERENCES groups            (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ppg_permission_id ON page_permission_groups (page_permission_id);
CREATE INDEX IF NOT EXISTS idx_ppg_group_id      ON page_permission_groups (group_id);

-- ---------------------------------------------------------------------------
-- Seed: default system groups
-- ---------------------------------------------------------------------------
INSERT INTO groups (name, description, is_system) VALUES
    ('Jeder',                 'Alle Besucher und registrierten Benutzer',  TRUE),
    ('Gast',                  'Nicht angemeldete Besucher',                TRUE),
    ('Registrierte Benutzer', 'Alle angemeldeten Benutzer',                TRUE),
    ('Moderator',             'Moderatoren mit erweiterten Rechten',       TRUE),
    ('Admin',                 'Administratoren mit vollen Rechten',        TRUE)
ON CONFLICT (name) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Seed: assign groups to seeded users
-- ---------------------------------------------------------------------------

-- Admin user (001) → Jeder + Registrierte Benutzer + Admin
INSERT INTO user_groups (user_id, group_id)
    SELECT '00000000-0000-0000-0000-000000000001', g.id
    FROM groups g
    WHERE g.name IN ('Jeder', 'Registrierte Benutzer', 'Admin')
ON CONFLICT DO NOTHING;

-- Moderator user (002) → Jeder + Registrierte Benutzer + Moderator
INSERT INTO user_groups (user_id, group_id)
    SELECT '00000000-0000-0000-0000-000000000002', g.id
    FROM groups g
    WHERE g.name IN ('Jeder', 'Registrierte Benutzer', 'Moderator')
ON CONFLICT DO NOTHING;

-- Member users (003–005) → Jeder + Registrierte Benutzer
INSERT INTO user_groups (user_id, group_id)
    SELECT u.id, g.id
    FROM users u
    CROSS JOIN groups g
    WHERE u.id IN (
        '00000000-0000-0000-0000-000000000003',
        '00000000-0000-0000-0000-000000000004',
        '00000000-0000-0000-0000-000000000005'
    )
    AND g.name IN ('Jeder', 'Registrierte Benutzer')
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- Seed: default page permissions
-- ---------------------------------------------------------------------------
INSERT INTO page_permissions (route, name) VALUES
    ('/dashboard',          'Dashboard'),
    ('/forum',              'Forum Übersicht'),
    ('/anime-top-list',     'Top Anime Liste'),
    ('/anime-database',     'Anime Datenbank'),
    ('/anime/my-list',      'Meine Anime-Liste'),
    ('/profile',            'Profil'),
    ('/admin/overview',     'Admin Übersicht'),
    ('/admin/forum',        'Admin Forenstruktur'),
    ('/admin/users',        'Admin Benutzerverwaltung'),
    ('/admin/groups',       'Admin Gruppenverwaltung'),
    ('/admin/permissions',  'Admin Seitenberechtigungen')
ON CONFLICT (route) DO NOTHING;

-- Assign "Registrierte Benutzer" to standard routes
INSERT INTO page_permission_groups (page_permission_id, group_id)
    SELECT pp.id, g.id
    FROM page_permissions pp
    CROSS JOIN groups g
    WHERE pp.route IN ('/dashboard', '/forum', '/anime-top-list', '/anime-database', '/anime/my-list', '/profile')
    AND g.name = 'Registrierte Benutzer'
ON CONFLICT DO NOTHING;

-- Assign "Admin" to admin routes
INSERT INTO page_permission_groups (page_permission_id, group_id)
    SELECT pp.id, g.id
    FROM page_permissions pp
    CROSS JOIN groups g
    WHERE pp.route IN ('/admin/overview', '/admin/forum', '/admin/users', '/admin/groups', '/admin/permissions')
    AND g.name = 'Admin'
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE groups                 TO aniverse_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE user_groups            TO aniverse_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE page_permissions       TO aniverse_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE page_permission_groups TO aniverse_app;
