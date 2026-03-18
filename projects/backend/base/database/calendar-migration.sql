-- Calendar module migration
-- Run as aniverse_app or superuser after setup-db.sql

CREATE TABLE IF NOT EXISTS calendar_events (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title               VARCHAR(255) NOT NULL,
    description         TEXT,
    location            VARCHAR(500),
    start_date          TIMESTAMPTZ NOT NULL,
    end_date            TIMESTAMPTZ NOT NULL,
    all_day             BOOLEAN NOT NULL DEFAULT FALSE,
    is_public           BOOLEAN NOT NULL DEFAULT TRUE,
    max_attendees       INTEGER,
    created_by_user_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    thread_id           UUID,
    recurrence_rule     JSONB,
    color               VARCHAR(50),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS calendar_attendees (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id        UUID NOT NULL REFERENCES calendar_events(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status          VARCHAR(20) NOT NULL DEFAULT 'pending',
    companions      INTEGER NOT NULL DEFAULT 0,
    decline_reason  TEXT,
    responded_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (event_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_calendar_events_start_date ON calendar_events(start_date);
CREATE INDEX IF NOT EXISTS idx_calendar_events_creator ON calendar_events(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_attendees_event ON calendar_attendees(event_id);
CREATE INDEX IF NOT EXISTS idx_calendar_attendees_user ON calendar_attendees(user_id);
