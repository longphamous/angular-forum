-- Ticket System Phase 6: Roadmap, Automation, Project Roles, Custom Fields
-- Run after ticket-watchers-migration.sql

-- ── Project Members (roles per project) ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS ticket_project_members (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID        NOT NULL REFERENCES ticket_projects(id) ON DELETE CASCADE,
    user_id    UUID        NOT NULL,
    role       VARCHAR(30) NOT NULL DEFAULT 'developer',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_project_member UNIQUE (project_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_project_members_project ON ticket_project_members(project_id);

-- ── Automation Rules ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ticket_automation_rules (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id     UUID         NOT NULL REFERENCES ticket_projects(id) ON DELETE CASCADE,
    name           VARCHAR(200) NOT NULL,
    is_active      BOOLEAN      DEFAULT true,
    trigger_type   VARCHAR(50)  NOT NULL,
    trigger_config JSONB        NOT NULL DEFAULT '{}',
    action_type    VARCHAR(50)  NOT NULL,
    action_config  JSONB        NOT NULL DEFAULT '{}',
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_automation_rules_project ON ticket_automation_rules(project_id);

-- ── Custom Field Definitions ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ticket_custom_field_defs (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id       UUID         NOT NULL REFERENCES ticket_projects(id) ON DELETE CASCADE,
    name             VARCHAR(200) NOT NULL,
    field_key        VARCHAR(100) NOT NULL,
    field_type       VARCHAR(20)  NOT NULL DEFAULT 'text',
    options          JSONB,
    required         BOOLEAN      DEFAULT false,
    applicable_types VARCHAR[]    DEFAULT '{}',
    position         INT          NOT NULL DEFAULT 0,
    CONSTRAINT uq_custom_field_key UNIQUE (project_id, field_key)
);

CREATE INDEX IF NOT EXISTS idx_custom_field_defs_project ON ticket_custom_field_defs(project_id);
