-- Ticket System Phase 3: Sprints + Backlog
-- Run after ticket-workflow-migration.sql

-- ── Sprints ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ticket_sprints (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id   UUID         NOT NULL REFERENCES ticket_projects(id) ON DELETE CASCADE,
    name         VARCHAR(200) NOT NULL,
    goal         TEXT,
    status       VARCHAR(20)  NOT NULL DEFAULT 'planning',
    start_date   DATE,
    end_date     DATE,
    completed_at TIMESTAMPTZ,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sprints_project ON ticket_sprints(project_id);

-- ── Extend tickets ───────────────────────────────────────────────────────────

ALTER TABLE tickets ADD COLUMN IF NOT EXISTS sprint_id UUID REFERENCES ticket_sprints(id) ON DELETE SET NULL;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS backlog_position INT;

CREATE INDEX IF NOT EXISTS idx_tickets_sprint ON tickets(sprint_id);
CREATE INDEX IF NOT EXISTS idx_tickets_backlog ON tickets(project_id, backlog_position) WHERE sprint_id IS NULL;
