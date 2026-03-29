-- Wanted/Bounty System (One Piece inspired)
-- Caches calculated bounty values for leaderboard performance

CREATE TABLE IF NOT EXISTS user_bounties (
    user_id        UUID PRIMARY KEY,
    bounty         BIGINT       NOT NULL DEFAULT 0,
    rank           INT,
    -- Factor breakdown
    coin_value     BIGINT       NOT NULL DEFAULT 0,
    xp_value       BIGINT       NOT NULL DEFAULT 0,
    post_value     BIGINT       NOT NULL DEFAULT 0,
    thread_value   BIGINT       NOT NULL DEFAULT 0,
    reaction_value BIGINT       NOT NULL DEFAULT 0,
    achievement_value BIGINT    NOT NULL DEFAULT 0,
    lexicon_value  BIGINT       NOT NULL DEFAULT 0,
    blog_value     BIGINT       NOT NULL DEFAULT 0,
    gallery_value  BIGINT       NOT NULL DEFAULT 0,
    clan_value     BIGINT       NOT NULL DEFAULT 0,
    ticket_value   BIGINT       NOT NULL DEFAULT 0,
    -- Metadata
    epithet        VARCHAR(200),
    calculated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bounties_rank ON user_bounties(rank);
CREATE INDEX IF NOT EXISTS idx_bounties_bounty ON user_bounties(bounty DESC);
