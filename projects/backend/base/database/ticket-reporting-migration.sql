-- Ticket System Phase 4: Reporting, Dashboards, SLA
-- Run after ticket-sprint-migration.sql

-- ── SLA Configs ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ticket_sla_configs (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id           UUID         NOT NULL REFERENCES ticket_projects(id) ON DELETE CASCADE,
    priority             VARCHAR(20)  NOT NULL,
    first_response_hours INT          NOT NULL DEFAULT 24,
    resolution_hours     INT          NOT NULL DEFAULT 72,
    created_at           TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at           TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT uq_sla_project_priority UNIQUE (project_id, priority)
);

-- ── Extend tickets ───────────────────────────────────────────────────────────

ALTER TABLE tickets ADD COLUMN IF NOT EXISTS first_response_at TIMESTAMPTZ;
