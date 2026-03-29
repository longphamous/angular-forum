-- Ticket System Phase 5: Watchers, Attachments, Time Tracking
-- Run after ticket-reporting-migration.sql

-- ── Watchers ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ticket_watchers (
    ticket_id  UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    user_id    UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (ticket_id, user_id)
);

-- ── Attachments ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ticket_attachments (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id   UUID         NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    file_name   VARCHAR(500) NOT NULL,
    file_path   VARCHAR(1000) NOT NULL,
    file_size   INT          NOT NULL DEFAULT 0,
    mime_type   VARCHAR(100),
    uploaded_by UUID         NOT NULL,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_attachments_ticket ON ticket_attachments(ticket_id);

-- ── Work Logs ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ticket_work_logs (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id          UUID        NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    user_id            UUID        NOT NULL,
    time_spent_minutes INT         NOT NULL,
    description        TEXT,
    log_date           DATE        NOT NULL DEFAULT CURRENT_DATE,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_work_logs_ticket ON ticket_work_logs(ticket_id);

-- ── Extend tickets ───────────────────────────────────────────────────────────

ALTER TABLE tickets ADD COLUMN IF NOT EXISTS original_estimate_minutes INT;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS remaining_estimate_minutes INT;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS time_spent_minutes INT DEFAULT 0;
