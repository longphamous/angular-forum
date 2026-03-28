-- Ticket System Phase 1: Issue Hierarchy, Links, Activity Log, Story Points
-- Run after the initial ticket tables exist

-- ── Extend tickets table ─────────────────────────────────────────────────────

ALTER TABLE tickets ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES tickets(id) ON DELETE SET NULL;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS story_points INT;

CREATE INDEX IF NOT EXISTS idx_tickets_parent_id ON tickets(parent_id);

-- ── Ticket Links ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ticket_links (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    target_ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    link_type     VARCHAR(30)  NOT NULL,
    created_by    UUID         NOT NULL,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT uq_ticket_link UNIQUE (source_ticket_id, target_ticket_id, link_type),
    CONSTRAINT chk_no_self_link CHECK (source_ticket_id <> target_ticket_id)
);

CREATE INDEX IF NOT EXISTS idx_ticket_links_source ON ticket_links(source_ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_links_target ON ticket_links(target_ticket_id);

-- ── Ticket Activity Log ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ticket_activity_log (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id  UUID        NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    user_id    UUID        NOT NULL,
    field      VARCHAR(100),
    old_value  TEXT,
    new_value  TEXT,
    action     VARCHAR(30) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ticket_activity_ticket ON ticket_activity_log(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_activity_created ON ticket_activity_log(ticket_id, created_at DESC);
