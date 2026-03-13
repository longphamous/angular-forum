-- Gamification migration (idempotent – safe to run multiple times)
-- Run once manually or let TypeORM synchronize create the tables.

-- ── Tables ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_xp (
    user_id     UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    xp          INTEGER NOT NULL DEFAULT 0,
    level       INTEGER NOT NULL DEFAULT 1,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS xp_events (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_type   VARCHAR(50) NOT NULL,
    xp_gained    INTEGER NOT NULL,
    reference_id VARCHAR(255),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS xp_config (
    event_type  VARCHAR(50) PRIMARY KEY,
    xp_amount   INTEGER NOT NULL,
    label       VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_xp_events_user_id ON xp_events(user_id);

-- ── Seed config ────────────────────────────────────────────────────────────────

INSERT INTO xp_config (event_type, xp_amount, label, description) VALUES
    ('create_thread',    10, 'Thread erstellen',   'XP für das Erstellen eines neuen Threads'),
    ('create_post',       5, 'Beitrag schreiben',  'XP für das Verfassen einer Antwort'),
    ('receive_reaction',  3, 'Reaktion erhalten',  'XP wenn ein eigener Beitrag eine Reaktion bekommt'),
    ('give_reaction',     1, 'Reaktion geben',     'XP für das Reagieren auf einen fremden Beitrag')
ON CONFLICT (event_type) DO NOTHING;

-- ── Seed initial user_xp ───────────────────────────────────────────────────────

INSERT INTO user_xp (user_id, xp, level)
SELECT id, 0, 1 FROM users
ON CONFLICT (user_id) DO NOTHING;

-- ── Retroactive XP recalculation ──────────────────────────────────────────────

WITH
cfg AS (SELECT event_type, xp_amount FROM xp_config),
thread_counts AS (
    SELECT author_id AS user_id, COUNT(*) AS cnt
    FROM forum_threads WHERE deleted_at IS NULL GROUP BY author_id
),
post_counts AS (
    SELECT author_id AS user_id, COUNT(*) AS cnt
    FROM forum_posts WHERE deleted_at IS NULL AND is_first_post = false GROUP BY author_id
),
reactions_received AS (
    SELECT fp.author_id AS user_id, COUNT(*) AS cnt
    FROM forum_post_reactions fpr JOIN forum_posts fp ON fp.id = fpr.post_id
    GROUP BY fp.author_id
),
reactions_given AS (
    SELECT user_id, COUNT(*) AS cnt FROM forum_post_reactions GROUP BY user_id
),
calculated AS (
    SELECT u.id AS user_id,
        (COALESCE((SELECT cnt FROM thread_counts      WHERE user_id = u.id), 0) * (SELECT xp_amount FROM cfg WHERE event_type = 'create_thread') +
         COALESCE((SELECT cnt FROM post_counts        WHERE user_id = u.id), 0) * (SELECT xp_amount FROM cfg WHERE event_type = 'create_post') +
         COALESCE((SELECT cnt FROM reactions_received WHERE user_id = u.id), 0) * (SELECT xp_amount FROM cfg WHERE event_type = 'receive_reaction') +
         COALESCE((SELECT cnt FROM reactions_given    WHERE user_id = u.id), 0) * (SELECT xp_amount FROM cfg WHERE event_type = 'give_reaction')
        ) AS total_xp
    FROM users u
)
INSERT INTO user_xp (user_id, xp, level, updated_at)
SELECT user_id, total_xp,
    CASE WHEN total_xp >= 5500 THEN 10 WHEN total_xp >= 4000 THEN 9
         WHEN total_xp >= 3000 THEN 8  WHEN total_xp >= 2200 THEN 7
         WHEN total_xp >= 1500 THEN 6  WHEN total_xp >= 1000 THEN 5
         WHEN total_xp >= 600  THEN 4  WHEN total_xp >= 300  THEN 3
         WHEN total_xp >= 100  THEN 2  ELSE 1 END, NOW()
FROM calculated
ON CONFLICT (user_id) DO UPDATE SET xp = EXCLUDED.xp, level = EXCLUDED.level, updated_at = NOW();
