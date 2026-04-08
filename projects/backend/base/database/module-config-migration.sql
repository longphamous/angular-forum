-- Module configuration: toggle individual features/submodules on or off
CREATE TABLE IF NOT EXISTS module_config (
    key         VARCHAR(100) PRIMARY KEY,
    label       VARCHAR(255) NOT NULL,
    parent_key  VARCHAR(100) REFERENCES module_config(key) ON DELETE CASCADE,
    enabled     BOOLEAN NOT NULL DEFAULT true,
    icon        VARCHAR(100),
    sort_order  INTEGER NOT NULL DEFAULT 0,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_module_config_parent ON module_config(parent_key);

-- Seed: top-level modules
INSERT INTO module_config (key, label, icon, sort_order, enabled) VALUES
    ('anime',        'Anime',          'pi-star',          1,  true),
    ('manga',        'Manga',          'pi-book',          2,  true),
    ('forum',        'Forum',          'pi-comments',      3,  true),
    ('blog',         'Blog',           'pi-file-edit',     4,  true),
    ('gallery',      'Gallery',        'pi-images',        5,  true),
    ('calendar',     'Calendar',       'pi-calendar',      6,  true),
    ('lexicon',      'Lexicon',        'pi-book',          7,  true),
    ('link-database','Link Database',  'pi-link',          8,  true),
    ('recipes',      'Recipes',        'pi-star',          9,  true),
    ('messages',     'Messages',       'pi-envelope',      10, true),
    ('friends',      'Friends',        'pi-users',         11, true),
    ('clips',        'Clips',          'pi-video',         12, true),
    ('clans',        'Clans',          'pi-users',         13, true),
    ('marketplace',  'Marketplace',    'pi-shopping-cart',  14, true),
    ('tickets',      'Tickets',        'pi-ticket',        15, true),
    ('gamification', 'Gamification',   'pi-trophy',        16, true),
    ('steam',        'Steam',          'pi-desktop',       17, true)
ON CONFLICT (key) DO NOTHING;

-- Seed: anime submodules
INSERT INTO module_config (key, label, parent_key, icon, sort_order, enabled) VALUES
    ('anime-top-list',   'Top Anime',          'anime', 'pi-list',     1, true),
    ('anime-database',   'Anime Database',     'anime', 'pi-database', 2, true),
    ('anime-characters', 'Characters',         'anime', 'pi-users',    3, true),
    ('anime-people',     'People',             'anime', 'pi-id-card',  4, true),
    ('anime-my-list',    'My Anime List',      'anime', 'pi-heart',    5, true)
ON CONFLICT (key) DO NOTHING;

-- Seed: manga submodules
INSERT INTO module_config (key, label, parent_key, icon, sort_order, enabled) VALUES
    ('manga-top-list',   'Top Manga',          'manga', 'pi-list',     1, true),
    ('manga-database',   'Manga Database',     'manga', 'pi-database', 2, true),
    ('manga-my-list',    'My Manga List',      'manga', 'pi-heart',    3, true)
ON CONFLICT (key) DO NOTHING;

-- Seed: marketplace submodules
INSERT INTO module_config (key, label, parent_key, icon, sort_order, enabled) VALUES
    ('marketplace-auctions', 'Auctions', 'marketplace', 'pi-megaphone', 1, true)
ON CONFLICT (key) DO NOTHING;

-- Seed: tickets submodules
INSERT INTO module_config (key, label, parent_key, icon, sort_order, enabled) VALUES
    ('tickets-board',   'Board',   'tickets', 'pi-objects-column', 1, true),
    ('tickets-backlog', 'Backlog', 'tickets', 'pi-bars',           2, true),
    ('tickets-roadmap', 'Roadmap', 'tickets', 'pi-map',            3, true),
    ('tickets-reports', 'Reports', 'tickets', 'pi-chart-bar',      4, true)
ON CONFLICT (key) DO NOTHING;

-- Seed: gamification submodules
INSERT INTO module_config (key, label, parent_key, icon, sort_order, enabled) VALUES
    ('gamification-rpg',          'RPG',            'gamification', 'pi-shield',        1, true),
    ('gamification-quests',       'Quests',         'gamification', 'pi-map',           2, true),
    ('gamification-leaderboard',  'Leaderboard',    'gamification', 'pi-chart-bar',     3, true),
    ('gamification-hashtags',     'Hashtags',       'gamification', 'pi-hashtag',       4, true),
    ('gamification-wanted',       'Wanted/Bounty',  'gamification', 'pi-flag',          5, true),
    ('gamification-achievements', 'Achievements',   'gamification', 'pi-trophy',        6, true),
    ('gamification-shop',         'Shop',           'gamification', 'pi-shopping-bag',  7, true),
    ('gamification-lotto',        'Lotto',          'gamification', 'pi-ticket',        8, true),
    ('gamification-tcg',          'TCG',            'gamification', 'pi-id-card',       9, true),
    ('gamification-market',       'Dynamic Market', 'gamification', 'pi-chart-line',    10, true)
ON CONFLICT (key) DO NOTHING;
