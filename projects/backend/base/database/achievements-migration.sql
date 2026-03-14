-- Achievements migration (idempotent – safe to run multiple times)

-- ── Tables ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS achievements (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key           VARCHAR(50) NOT NULL UNIQUE,
    name          VARCHAR(100) NOT NULL,
    description   VARCHAR(255),
    icon          VARCHAR(50) NOT NULL,
    rarity        VARCHAR(20) NOT NULL DEFAULT 'bronze',
    trigger_type  VARCHAR(50) NOT NULL,
    trigger_value INTEGER NOT NULL,
    is_active     BOOLEAN NOT NULL DEFAULT true,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_achievements (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_id  UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
    earned_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);

-- ── Seed Achievements ──────────────────────────────────────────────────────────

INSERT INTO achievements (key, name, description, icon, rarity, trigger_type, trigger_value) VALUES
    ('first_post',           'Erster Schritt',       'Schreibe deinen ersten Beitrag',              'pi pi-comment',     'bronze',   'post_count',                1),
    ('active_writer',        'Aktiver Schreiber',    'Schreibe 10 Beiträge',                        'pi pi-pencil',      'silver',   'post_count',               10),
    ('prolific_writer',      'Vielschreiber',        'Schreibe 50 Beiträge',                        'pi pi-file-edit',   'gold',     'post_count',               50),
    ('posting_legend',       'Posting-Legende',      'Schreibe 100 Beiträge',                       'pi pi-crown',       'platinum', 'post_count',              100),
    ('thread_starter',       'Themen-Starter',       'Erstelle deinen ersten Thread',               'pi pi-plus-circle', 'bronze',   'thread_count',              1),
    ('discussion_pro',       'Diskussionsprofi',     'Erstelle 10 Threads',                         'pi pi-sitemap',     'silver',   'thread_count',             10),
    ('first_reaction',       'Beliebter Beitrag',    'Erhalte deine erste Reaktion',                'pi pi-heart-fill',  'bronze',   'reaction_received_count',   1),
    ('community_star',       'Community-Star',       'Erhalte 10 Reaktionen',                       'pi pi-star-fill',   'silver',   'reaction_received_count',  10),
    ('fan_favorite',         'Fan-Liebling',         'Erhalte 50 Reaktionen',                       'pi pi-star',        'gold',     'reaction_received_count',  50),
    ('generous_reactor',     'Reaktionskönig',       'Reagiere auf 10 Beiträge',                    'pi pi-heart',       'bronze',   'reaction_given_count',     10),
    ('level_5',              'Aufsteiger',           'Erreiche Level 5',                            'pi pi-chart-line',  'silver',   'level_reached',             5),
    ('level_8',              'Veteranenstatus',      'Erreiche Level 8',                            'pi pi-shield',      'gold',     'level_reached',             8),
    ('level_10',             'Legende',              'Erreiche Level 10',                           'pi pi-crown',       'platinum', 'level_reached',            10)
ON CONFLICT (key) DO NOTHING;

-- ── Retroactive Achievement Seeding ───────────────────────────────────────────
-- Awards achievements to existing users based on their current stats.

INSERT INTO user_achievements (user_id, achievement_id)
SELECT DISTINCT u.id, a.id
FROM users u
JOIN achievements a ON a.is_active = true
WHERE a.trigger_type = 'post_count'
  AND (
    SELECT COUNT(*) FROM xp_events xe
    WHERE xe.user_id = u.id AND xe.event_type = 'create_post'
  ) >= a.trigger_value
ON CONFLICT (user_id, achievement_id) DO NOTHING;

INSERT INTO user_achievements (user_id, achievement_id)
SELECT DISTINCT u.id, a.id
FROM users u
JOIN achievements a ON a.is_active = true
WHERE a.trigger_type = 'thread_count'
  AND (
    SELECT COUNT(*) FROM xp_events xe
    WHERE xe.user_id = u.id AND xe.event_type = 'create_thread'
  ) >= a.trigger_value
ON CONFLICT (user_id, achievement_id) DO NOTHING;

INSERT INTO user_achievements (user_id, achievement_id)
SELECT DISTINCT u.id, a.id
FROM users u
JOIN achievements a ON a.is_active = true
WHERE a.trigger_type = 'reaction_received_count'
  AND (
    SELECT COUNT(*) FROM xp_events xe
    WHERE xe.user_id = u.id AND xe.event_type = 'receive_reaction'
  ) >= a.trigger_value
ON CONFLICT (user_id, achievement_id) DO NOTHING;

INSERT INTO user_achievements (user_id, achievement_id)
SELECT DISTINCT u.id, a.id
FROM users u
JOIN achievements a ON a.is_active = true
WHERE a.trigger_type = 'reaction_given_count'
  AND (
    SELECT COUNT(*) FROM xp_events xe
    WHERE xe.user_id = u.id AND xe.event_type = 'give_reaction'
  ) >= a.trigger_value
ON CONFLICT (user_id, achievement_id) DO NOTHING;

INSERT INTO user_achievements (user_id, achievement_id)
SELECT DISTINCT u.id, a.id
FROM users u
JOIN user_xp ux ON ux.user_id = u.id
JOIN achievements a ON a.is_active = true
WHERE a.trigger_type = 'level_reached'
  AND ux.level >= a.trigger_value
ON CONFLICT (user_id, achievement_id) DO NOTHING;

INSERT INTO user_achievements (user_id, achievement_id)
SELECT DISTINCT u.id, a.id
FROM users u
JOIN user_xp ux ON ux.user_id = u.id
JOIN achievements a ON a.is_active = true
WHERE a.trigger_type = 'xp_total'
  AND ux.xp >= a.trigger_value
ON CONFLICT (user_id, achievement_id) DO NOTHING;
