-- ─────────────────────────────────────────────────────────────────────────────
-- Private Messages Migration
-- Run as the aniverse_app role (or the database owner)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS conversations (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_ids      UUID[]       NOT NULL DEFAULT '{}',
    subject              VARCHAR(255),
    last_message_preview VARCHAR(500),
    last_message_at      TIMESTAMPTZ,
    initiated_by_user_id UUID         NOT NULL,
    created_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversations_participant_ids
    ON conversations USING GIN (participant_ids);

CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at
    ON conversations (last_message_at DESC NULLS LAST);

-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS messages (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id   UUID,
    sender_id         UUID         NOT NULL,
    recipient_id      UUID,
    subject           VARCHAR(255),
    content           TEXT         NOT NULL,
    is_draft          BOOLEAN      NOT NULL DEFAULT FALSE,
    read_by_user_ids  UUID[]       NOT NULL DEFAULT '{}',
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_messages_conversation
        FOREIGN KEY (conversation_id) REFERENCES conversations (id)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id
    ON messages (conversation_id);

CREATE INDEX IF NOT EXISTS idx_messages_sender_id
    ON messages (sender_id);

CREATE INDEX IF NOT EXISTS idx_messages_is_draft
    ON messages (is_draft) WHERE is_draft = TRUE;
