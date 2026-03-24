-- ══════════════════════════════════════════════════════════════════════════════
-- Gamification: XP & Achievements for Clips, Blog, Gallery, Lexicon, Recipes, Lotto
-- Run once after the base gamification-migration.sql and achievements-migration.sql
-- ══════════════════════════════════════════════════════════════════════════════

-- ── New XP config entries ────────────────────────────────────────────────────

INSERT INTO xp_config (event_type, xp_amount, label, description) VALUES
    ('create_clip',              8, 'Clip erstellen',            'XP für das Hochladen eines neuen Clips'),
    ('create_blog_post',        15, 'Blog-Beitrag schreiben',    'XP für das Veröffentlichen eines Blog-Artikels'),
    ('upload_gallery',           5, 'Galerie-Upload',            'XP für das Hochladen eines Bildes/Videos in die Galerie'),
    ('create_lexicon_article',  20, 'Lexikon-Artikel erstellen', 'XP für das Verfassen eines Lexikon-Eintrags'),
    ('create_recipe',           12, 'Rezept erstellen',          'XP für das Veröffentlichen eines Rezepts'),
    ('buy_lotto_ticket',         2, 'Lottoticket kaufen',        'XP für den Kauf eines Lottotickets')
ON CONFLICT (event_type) DO NOTHING;

-- ── New Achievements ─────────────────────────────────────────────────────────

INSERT INTO achievements (key, name, description, icon, rarity, trigger_type, trigger_value, xp_reward) VALUES
    -- Clips
    ('first_clip',          'Erster Clip',        'Lade deinen ersten Clip hoch',            'pi pi-video',       'bronze',   'clip_count',              1,  10),
    ('clip_creator',        'Clip-Creator',       'Lade 10 Clips hoch',                      'pi pi-video',       'silver',   'clip_count',             10,  25),
    ('viral_clipper',       'Viral Clipper',      'Lade 50 Clips hoch',                      'pi pi-video',       'gold',     'clip_count',             50,  50),
    -- Blog
    ('first_blog_post',     'Blogger',            'Schreibe deinen ersten Blog-Beitrag',     'pi pi-pencil',      'bronze',   'blog_post_count',         1,  10),
    ('active_blogger',      'Aktiver Blogger',    'Schreibe 10 Blog-Beiträge',               'pi pi-pencil',      'silver',   'blog_post_count',        10,  25),
    ('blog_legend',         'Blog-Legende',       'Schreibe 50 Blog-Beiträge',               'pi pi-pencil',      'gold',     'blog_post_count',        50,  50),
    -- Gallery
    ('first_upload',        'Erstes Foto',        'Lade dein erstes Bild in die Galerie',    'pi pi-image',       'bronze',   'gallery_upload_count',    1,  10),
    ('gallery_enthusiast',  'Galerie-Enthusiast', 'Lade 25 Medien in die Galerie',           'pi pi-images',      'silver',   'gallery_upload_count',   25,  25),
    ('gallery_master',      'Galerie-Meister',    'Lade 100 Medien in die Galerie',          'pi pi-images',      'gold',     'gallery_upload_count',  100,  50),
    -- Lexicon
    ('first_article',       'Wissensteiler',      'Erstelle deinen ersten Lexikon-Eintrag',  'pi pi-book',        'bronze',   'lexicon_article_count',   1,  10),
    ('lexicon_expert',      'Lexikon-Experte',    'Erstelle 10 Lexikon-Einträge',            'pi pi-book',        'silver',   'lexicon_article_count',  10,  25),
    ('encyclopedia_author', 'Enzyklopädist',      'Erstelle 50 Lexikon-Einträge',            'pi pi-book',        'gold',     'lexicon_article_count',  50,  50),
    -- Recipes
    ('first_recipe',        'Hobbykoch',          'Erstelle dein erstes Rezept',             'pi pi-clipboard',   'bronze',   'recipe_count',            1,  10),
    ('master_chef',         'Meisterkoch',        'Erstelle 10 Rezepte',                     'pi pi-clipboard',   'silver',   'recipe_count',           10,  25),
    ('culinary_legend',     'Kulinarische Legende','Erstelle 50 Rezepte',                    'pi pi-clipboard',   'gold',     'recipe_count',           50,  50),
    -- Lotto
    ('first_ticket',        'Glücksspieler',      'Kaufe dein erstes Lottoticket',           'pi pi-ticket',      'bronze',   'lotto_ticket_count',      1,  10),
    ('lucky_player',        'Stammkunde',         'Kaufe 25 Lottotickets',                   'pi pi-ticket',      'silver',   'lotto_ticket_count',     25,  25),
    ('lotto_addict',        'Lotto-Süchtig',      'Kaufe 100 Lottotickets',                  'pi pi-ticket',      'gold',     'lotto_ticket_count',    100,  50)
ON CONFLICT (key) DO NOTHING;
