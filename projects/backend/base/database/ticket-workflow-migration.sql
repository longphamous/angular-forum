-- Ticket System Phase 2: Workflows + Kanban Board
-- Run after ticket-hierarchy-migration.sql

-- ── Workflows ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ticket_workflows (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id  UUID REFERENCES ticket_projects(id) ON DELETE CASCADE,
    name        VARCHAR(200)  NOT NULL,
    is_default  BOOLEAN       DEFAULT false,
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- ── Workflow Statuses (columns on the board) ─────────────────────────────────

CREATE TABLE IF NOT EXISTS ticket_workflow_statuses (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID         NOT NULL REFERENCES ticket_workflows(id) ON DELETE CASCADE,
    name        VARCHAR(100) NOT NULL,
    slug        VARCHAR(50)  NOT NULL,
    color       VARCHAR(20)  DEFAULT '#6B7280',
    category    VARCHAR(20)  NOT NULL DEFAULT 'todo',
    position    INT          NOT NULL DEFAULT 0,
    CONSTRAINT uq_workflow_status_slug UNIQUE (workflow_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_workflow_statuses_workflow ON ticket_workflow_statuses(workflow_id);

-- ── Workflow Transitions (allowed status changes) ────────────────────────────

CREATE TABLE IF NOT EXISTS ticket_workflow_transitions (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id    UUID NOT NULL REFERENCES ticket_workflows(id) ON DELETE CASCADE,
    from_status_id UUID NOT NULL REFERENCES ticket_workflow_statuses(id) ON DELETE CASCADE,
    to_status_id   UUID NOT NULL REFERENCES ticket_workflow_statuses(id) ON DELETE CASCADE,
    name           VARCHAR(100),
    CONSTRAINT uq_workflow_transition UNIQUE (workflow_id, from_status_id, to_status_id)
);

-- ── Extend existing tables ───────────────────────────────────────────────────

ALTER TABLE tickets ADD COLUMN IF NOT EXISTS workflow_status_id UUID REFERENCES ticket_workflow_statuses(id) ON DELETE SET NULL;
ALTER TABLE ticket_projects ADD COLUMN IF NOT EXISTS workflow_id UUID REFERENCES ticket_workflows(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_tickets_workflow_status ON tickets(workflow_status_id);
