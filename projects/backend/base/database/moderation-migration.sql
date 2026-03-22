-- Profile Approvals – moderation queue for avatar, cover and signature changes
-- Run once against the aniverse_base database.

CREATE TABLE IF NOT EXISTS profile_approvals (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type          VARCHAR(20) NOT NULL,                          -- avatar | avatar_url | cover | signature
    old_value     TEXT,
    new_value     TEXT        NOT NULL,
    status        VARCHAR(20) NOT NULL DEFAULT 'pending',        -- pending | approved | rejected
    reviewed_by   UUID        REFERENCES users(id) ON DELETE SET NULL,
    review_note   TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    reviewed_at   TIMESTAMPTZ
);

-- Fast lookup for the pending-approvals queue
CREATE INDEX IF NOT EXISTS idx_profile_approvals_status
    ON profile_approvals (status) WHERE status = 'pending';

-- Quick check: does user X already have a pending request for type Y?
CREATE INDEX IF NOT EXISTS idx_profile_approvals_user_type_status
    ON profile_approvals (user_id, type, status);

-- Reviewed-history ordered by review date
CREATE INDEX IF NOT EXISTS idx_profile_approvals_reviewed_at
    ON profile_approvals (reviewed_at DESC NULLS LAST);
