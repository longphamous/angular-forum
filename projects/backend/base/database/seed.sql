-- =============================================================================
-- Aniverse Base – Seed Data
-- Run against the aniverse_base database after schema.sql:
--
--   psql -h localhost -p 5432 -U aniverse_app -d aniverse_base -f seed.sql
--
-- Idempotent: uses INSERT ... ON CONFLICT DO NOTHING for all rows.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Users  (system + demo accounts)
-- ---------------------------------------------------------------------------
INSERT INTO users (id, username, email, password_hash, display_name, role, status)
VALUES
    -- Admin (password: "admin123" – bcrypt placeholder, change before use)
    ('00000000-0000-0000-0000-000000000001',
     'admin',
     'admin@aniverse.local',
     '$2b$10$placeholder_admin_hash_change_me',
     'Aniverse Admin',
     'admin',
     'active'),

    -- Moderator
    ('00000000-0000-0000-0000-000000000002',
     'sakura_mod',
     'sakura@aniverse.local',
     '$2b$10$placeholder_mod_hash_change_me',
     'Sakura',
     'moderator',
     'active'),

    -- Members
    ('00000000-0000-0000-0000-000000000003',
     'naruto_fan',
     'naruto@aniverse.local',
     '$2b$10$placeholder_member_hash_change_me',
     'NarutoFan99',
     'member',
     'active'),

    ('00000000-0000-0000-0000-000000000004',
     'otaku_dreams',
     'otaku@aniverse.local',
     '$2b$10$placeholder_member_hash_change_me',
     'OtakuDreams',
     'member',
     'active'),

    ('00000000-0000-0000-0000-000000000005',
     'manga_wolf',
     'mangawolf@aniverse.local',
     '$2b$10$placeholder_member_hash_change_me',
     'MangaWolf',
     'member',
     'active')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Forum Categories
-- ---------------------------------------------------------------------------
INSERT INTO forum_categories (id, name, slug, description, position, is_active)
VALUES
    ('10000000-0000-0000-0000-000000000001',
     'Allgemein',
     'allgemein',
     'Informationen rund um Aniverse – Ankündigungen, Regeln und Vorstellungen.',
     0,
     TRUE),

    ('10000000-0000-0000-0000-000000000002',
     'Anime & Manga',
     'anime-manga',
     'Alles über Anime und Manga – von aktuellen Saisonstarts bis hin zu zeitlosen Klassikern.',
     1,
     TRUE),

    ('10000000-0000-0000-0000-000000000003',
     'Off-Topic',
     'off-topic',
     'Themen abseits von Anime und Manga – Gaming, Technik, Smalltalk und mehr.',
     2,
     TRUE)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Forums
-- ---------------------------------------------------------------------------
INSERT INTO forums (id, category_id, name, slug, description, position, is_locked, is_private,
                    thread_count, post_count, last_post_at, last_post_by_user_id)
VALUES
    -- Allgemein
    ('20000000-0000-0000-0000-000000000001',
     '10000000-0000-0000-0000-000000000001',
     'Ankündigungen & Regeln',
     'ankuendigungen-regeln',
     'Offizielle Neuigkeiten und Verhaltensregeln der Community. Nur Admins können hier posten.',
     0, TRUE, FALSE,
     2, 2,
     NOW() - INTERVAL '1 day',
     '00000000-0000-0000-0000-000000000001'),

    ('20000000-0000-0000-0000-000000000002',
     '10000000-0000-0000-0000-000000000001',
     'Willkommen & Vorstellungen',
     'willkommen-vorstellungen',
     'Neu hier? Stell dich vor und lern die Community kennen!',
     1, FALSE, FALSE,
     3, 6,
     NOW() - INTERVAL '2 hours',
     '00000000-0000-0000-0000-000000000003'),

    -- Anime & Manga
    ('20000000-0000-0000-0000-000000000003',
     '10000000-0000-0000-0000-000000000002',
     'Saisonale Anime',
     'saisonale-anime',
     'Diskussionen zu aktuell laufenden Anime der Saison – Episodenreviews, Hype und Kritik.',
     0, FALSE, FALSE,
     4, 12,
     NOW() - INTERVAL '30 minutes',
     '00000000-0000-0000-0000-000000000004'),

    ('20000000-0000-0000-0000-000000000004',
     '10000000-0000-0000-0000-000000000002',
     'Klassiker & Empfehlungen',
     'klassiker-empfehlungen',
     'Zeitlose Meisterwerke und persönliche Empfehlungen für jeden Geschmack.',
     1, FALSE, FALSE,
     2, 5,
     NOW() - INTERVAL '3 days',
     '00000000-0000-0000-0000-000000000005'),

    ('20000000-0000-0000-0000-000000000005',
     '10000000-0000-0000-0000-000000000002',
     'Manga-Diskussion',
     'manga-diskussion',
     'Alles rund um Manga – Releases, Adaptionen, Mangaka und Lieblingswerke.',
     2, FALSE, FALSE,
     2, 4,
     NOW() - INTERVAL '5 days',
     '00000000-0000-0000-0000-000000000003'),

    -- Off-Topic
    ('20000000-0000-0000-0000-000000000006',
     '10000000-0000-0000-0000-000000000003',
     'Gaming & Technik',
     'gaming-technik',
     'Videospiele, Hardware, Software und alles was mit Technik zu tun hat.',
     0, FALSE, FALSE,
     2, 5,
     NOW() - INTERVAL '1 day',
     '00000000-0000-0000-0000-000000000004'),

    ('20000000-0000-0000-0000-000000000007',
     '10000000-0000-0000-0000-000000000003',
     'Plauderecke',
     'plauderecke',
     'Smalltalk, Memes, Witze – alles erlaubt was nicht gegen die Regeln verstößt.',
     1, FALSE, FALSE,
     2, 4,
     NOW() - INTERVAL '6 hours',
     '00000000-0000-0000-0000-000000000005')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Threads
-- ---------------------------------------------------------------------------
INSERT INTO forum_threads (id, forum_id, author_id, title, slug,
                           is_pinned, is_locked, is_sticky,
                           view_count, reply_count, last_post_at, last_post_by_user_id)
VALUES
    -- Ankündigungen & Regeln
    ('30000000-0000-0000-0000-000000000001',
     '20000000-0000-0000-0000-000000000001',
     '00000000-0000-0000-0000-000000000001',
     'Willkommen bei Aniverse! Die wichtigsten Regeln im Überblick',
     'willkommen-bei-aniverse-die-wichtigsten-regeln-im-ueberblick',
     TRUE, TRUE, TRUE,
     842, 0,
     NOW() - INTERVAL '30 days',
     '00000000-0000-0000-0000-000000000001'),

    ('30000000-0000-0000-0000-000000000002',
     '20000000-0000-0000-0000-000000000001',
     '00000000-0000-0000-0000-000000000001',
     'Aniverse 2.0 ist live – neue Features & Changelog',
     'aniverse-20-ist-live-neue-features-changelog',
     TRUE, TRUE, FALSE,
     517, 0,
     NOW() - INTERVAL '1 day',
     '00000000-0000-0000-0000-000000000001'),

    -- Willkommen & Vorstellungen
    ('30000000-0000-0000-0000-000000000003',
     '20000000-0000-0000-0000-000000000002',
     '00000000-0000-0000-0000-000000000001',
     'Vorlage zur Vorstellung – bitte lesen bevor ihr postet!',
     'vorlage-zur-vorstellung-bitte-lesen-bevor-ihr-postet',
     TRUE, FALSE, TRUE,
     326, 0,
     NOW() - INTERVAL '20 days',
     '00000000-0000-0000-0000-000000000001'),

    ('30000000-0000-0000-0000-000000000004',
     '20000000-0000-0000-0000-000000000002',
     '00000000-0000-0000-0000-000000000003',
     'Hallo aus München! – NarutoFan99 stellt sich vor',
     'hallo-aus-muenchen-narutofan99-stellt-sich-vor',
     FALSE, FALSE, FALSE,
     58, 2,
     NOW() - INTERVAL '2 hours',
     '00000000-0000-0000-0000-000000000002'),

    ('30000000-0000-0000-0000-000000000005',
     '20000000-0000-0000-0000-000000000002',
     '00000000-0000-0000-0000-000000000004',
     'OtakuDreams meldet sich – endlich gefunden!',
     'otakudreams-meldet-sich-endlich-gefunden',
     FALSE, FALSE, FALSE,
     41, 2,
     NOW() - INTERVAL '4 days',
     '00000000-0000-0000-0000-000000000005'),

    -- Saisonale Anime
    ('30000000-0000-0000-0000-000000000006',
     '20000000-0000-0000-0000-000000000003',
     '00000000-0000-0000-0000-000000000004',
     'Frühling 2025 – Welche Anime schaut ihr diese Saison?',
     'fruehling-2025-welche-anime-schaut-ihr-diese-saison',
     TRUE, FALSE, FALSE,
     234, 5,
     NOW() - INTERVAL '30 minutes',
     '00000000-0000-0000-0000-000000000003'),

    ('30000000-0000-0000-0000-000000000007',
     '20000000-0000-0000-0000-000000000003',
     '00000000-0000-0000-0000-000000000003',
     '[Episodendiskussion] Dungeon Meshi – Episoden 1-4',
     'episodendiskussion-dungeon-meshi-episoden-1-4',
     FALSE, FALSE, FALSE,
     189, 3,
     NOW() - INTERVAL '2 days',
     '00000000-0000-0000-0000-000000000005'),

    ('30000000-0000-0000-0000-000000000008',
     '20000000-0000-0000-0000-000000000003',
     '00000000-0000-0000-0000-000000000005',
     'Frieren – Warum ist es so gut? Erster Eindruck nach 12 Folgen',
     'frieren-warum-ist-es-so-gut-erster-eindruck-nach-12-folgen',
     FALSE, FALSE, FALSE,
     312, 2,
     NOW() - INTERVAL '1 day',
     '00000000-0000-0000-0000-000000000004'),

    ('30000000-0000-0000-0000-000000000009',
     '20000000-0000-0000-0000-000000000003',
     '00000000-0000-0000-0000-000000000002',
     'Sommer 2025 Preview – erste Trailer-Eindrücke',
     'sommer-2025-preview-erste-trailer-eindruecke',
     FALSE, FALSE, FALSE,
     95, 1,
     NOW() - INTERVAL '6 hours',
     '00000000-0000-0000-0000-000000000003'),

    -- Klassiker & Empfehlungen
    ('30000000-0000-0000-0000-000000000010',
     '20000000-0000-0000-0000-000000000004',
     '00000000-0000-0000-0000-000000000005',
     'Meine Top 10 – Empfehlungen für Neueinsteiger',
     'meine-top-10-empfehlungen-fuer-neueinsteiger',
     FALSE, FALSE, FALSE,
     428, 3,
     NOW() - INTERVAL '3 days',
     '00000000-0000-0000-0000-000000000003'),

    ('30000000-0000-0000-0000-000000000011',
     '20000000-0000-0000-0000-000000000004',
     '00000000-0000-0000-0000-000000000003',
     'Cowboy Bebop – ein zeitloser Klassiker?',
     'cowboy-bebop-ein-zeitloser-klassiker',
     FALSE, FALSE, FALSE,
     167, 1,
     NOW() - INTERVAL '5 days',
     '00000000-0000-0000-0000-000000000004'),

    -- Manga-Diskussion
    ('30000000-0000-0000-0000-000000000012',
     '20000000-0000-0000-0000-000000000005',
     '00000000-0000-0000-0000-000000000003',
     'One Piece Chapter 1100+ – Diskussion ohne Spoiler-Limit',
     'one-piece-chapter-1100-diskussion-ohne-spoiler-limit',
     FALSE, FALSE, FALSE,
     512, 2,
     NOW() - INTERVAL '5 days',
     '00000000-0000-0000-0000-000000000004'),

    ('30000000-0000-0000-0000-000000000013',
     '20000000-0000-0000-0000-000000000005',
     '00000000-0000-0000-0000-000000000005',
     'Welche Manga-Adaptionen haben die Vorlage übertroffen?',
     'welche-manga-adaptionen-haben-die-vorlage-uebertroffen',
     FALSE, FALSE, FALSE,
     203, 1,
     NOW() - INTERVAL '7 days',
     '00000000-0000-0000-0000-000000000003'),

    -- Gaming & Technik
    ('30000000-0000-0000-0000-000000000014',
     '20000000-0000-0000-0000-000000000006',
     '00000000-0000-0000-0000-000000000004',
     'Anime-Spiele 2025 – welche sind wirklich gut?',
     'anime-spiele-2025-welche-sind-wirklich-gut',
     FALSE, FALSE, FALSE,
     148, 3,
     NOW() - INTERVAL '1 day',
     '00000000-0000-0000-0000-000000000005'),

    ('30000000-0000-0000-0000-000000000015',
     '20000000-0000-0000-0000-000000000006',
     '00000000-0000-0000-0000-000000000003',
     'Streaming-Setup für Anime – welchen Dienst nutzt ihr?',
     'streaming-setup-fuer-anime-welchen-dienst-nutzt-ihr',
     FALSE, FALSE, FALSE,
     89, 1,
     NOW() - INTERVAL '2 days',
     '00000000-0000-0000-0000-000000000002'),

    -- Plauderecke
    ('30000000-0000-0000-0000-000000000016',
     '20000000-0000-0000-0000-000000000007',
     '00000000-0000-0000-0000-000000000002',
     'Anime-Zitate die euch im Alltag helfen – Teilt eure Favoriten!',
     'anime-zitate-die-euch-im-alltag-helfen-teilt-eure-favoriten',
     FALSE, FALSE, FALSE,
     267, 2,
     NOW() - INTERVAL '6 hours',
     '00000000-0000-0000-0000-000000000003'),

    ('30000000-0000-0000-0000-000000000017',
     '20000000-0000-0000-0000-000000000007',
     '00000000-0000-0000-0000-000000000005',
     'Rate die Musik: welches Anime-Opening steckt wochenlang im Kopf?',
     'rate-die-musik-welches-anime-opening-steckt-wochenlang-im-kopf',
     FALSE, FALSE, FALSE,
     193, 1,
     NOW() - INTERVAL '1 day',
     '00000000-0000-0000-0000-000000000004')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Posts  (first posts = opening posts + replies)
-- ---------------------------------------------------------------------------
INSERT INTO forum_posts (id, thread_id, author_id, content, is_first_post, reaction_count)
VALUES
    -- Thread: Regeln (opening post only, locked)
    ('40000000-0000-0000-0000-000000000001',
     '30000000-0000-0000-0000-000000000001',
     '00000000-0000-0000-0000-000000000001',
     '<p>Willkommen bei <strong>Aniverse</strong> – der Community für Anime- und Manga-Fans!</p>
<p>Damit das Miteinander angenehm bleibt, bitten wir euch folgende Regeln zu beachten:</p>
<ol>
  <li><strong>Respektvoller Umgang</strong> – keine Beleidigungen, Diskriminierung oder persönliche Angriffe.</li>
  <li><strong>Spoiler-Kennzeichnung</strong> – verwendet Spoiler-Tags für Inhalte die noch nicht ausgestrahlt wurden.</li>
  <li><strong>Kein Spam</strong> – Doppelposts, sinnlose Inhalte und Eigenwerbung sind nicht erlaubt.</li>
  <li><strong>Themenrelevanz</strong> – postet nur im passenden Forum-Bereich.</li>
  <li><strong>Netiquette</strong> – schreibt verständlich und konstruktiv.</li>
</ol>
<p>Bei Fragen wendet euch an einen Moderator. Viel Spaß!</p>',
     TRUE, 12),

    -- Thread: Aniverse 2.0 (opening post only, locked)
    ('40000000-0000-0000-0000-000000000002',
     '30000000-0000-0000-0000-000000000002',
     '00000000-0000-0000-0000-000000000001',
     '<p>Liebe Community,</p>
<p>wir freuen uns, <strong>Aniverse 2.0</strong> offiziell ankündigen zu dürfen! Hier die wichtigsten Neuerungen:</p>
<ul>
  <li>🎨 Komplett überarbeitetes UI mit Dark-Mode-Support</li>
  <li>📋 Neues Forum-System mit Kategorien, Threads und Reaktionen</li>
  <li>🎬 Anime-Datenbank mit über 10.000 Einträgen</li>
  <li>⭐ Top-Anime-Liste mit Filtern und Bewertungen</li>
  <li>🔐 Sicheres Authentifizierungssystem</li>
</ul>
<p>Euer Feedback ist willkommen – nutzt dafür das Off-Topic-Forum. Danke für eure Unterstützung!</p>',
     TRUE, 8),

    -- Thread: Vorlage Vorstellung (pinned, opening only)
    ('40000000-0000-0000-0000-000000000003',
     '30000000-0000-0000-0000-000000000003',
     '00000000-0000-0000-0000-000000000001',
     '<p>Damit wir euch besser kennenlernen können, nutzt bitte diese Vorlage für eure Vorstellung:</p>
<pre>
Name/Nickname:
Alter (optional):
Wohnort (optional):
Lieblings-Anime:
Lieblings-Manga:
Seit wann schaust du Anime?
Wie bist du auf Aniverse gestoßen?
</pre>
<p>Natürlich müsst ihr nicht alle Felder ausfüllen – es ist freiwillig. Wir freuen uns auf jede Vorstellung!</p>',
     TRUE, 5),

    -- Thread: NarutoFan99 Vorstellung
    ('40000000-0000-0000-0000-000000000004',
     '30000000-0000-0000-0000-000000000004',
     '00000000-0000-0000-0000-000000000003',
     '<p><strong>Name:</strong> NarutoFan99<br>
<strong>Wohnort:</strong> München 🥨<br>
<strong>Lieblings-Anime:</strong> Naruto Shippuden, Attack on Titan, Demon Slayer<br>
<strong>Lieblings-Manga:</strong> One Piece<br>
<strong>Seit wann:</strong> Seit ich 10 Jahre alt war, also gut 15 Jahre!<br>
<strong>Gefunden über:</strong> Ein Reddit-Post hat mich hierher gebracht</p>
<p>Freue mich auf rege Diskussionen mit euch! 🔥</p>',
     TRUE, 3),

    ('40000000-0000-0000-0000-000000000005',
     '30000000-0000-0000-0000-000000000004',
     '00000000-0000-0000-0000-000000000002',
     '<p>Hey NarutoFan99, herzlich willkommen! 😊 Dem Namen nach zu urteilen bist du ein echter Naruto-Fan – magst du Shippuden oder das Original lieber? Ich persönlich finde die Pain-Arc bis heute unübertroffen!</p>',
     FALSE, 2),

    ('40000000-0000-0000-0000-000000000006',
     '30000000-0000-0000-0000-000000000004',
     '00000000-0000-0000-0000-000000000003',
     '<p>Danke für das herzliche Willkommen, Sakura! 🙏 Eindeutig Shippuden – die Pain-Arc ist Legende. Obwohl die Kämpfe im Original ihren eigenen Charme haben. Freue mich auf die Diskussionen hier!</p>',
     FALSE, 1),

    -- Thread: OtakuDreams Vorstellung
    ('40000000-0000-0000-0000-000000000007',
     '30000000-0000-0000-0000-000000000005',
     '00000000-0000-0000-0000-000000000004',
     '<p>Hallo zusammen! Ich bin <strong>OtakuDreams</strong> und freue mich, endlich eine deutschsprachige Anime-Community gefunden zu haben, die so aktiv ist!</p>
<p><strong>Lieblings-Anime:</strong> Steins;Gate, Re:Zero, Made in Abyss<br>
<strong>Lieblings-Manga:</strong> Berserk, Vinland Saga<br>
<strong>Fun Fact:</strong> Ich habe Berserk dreimal gelesen 😅</p>',
     TRUE, 4),

    ('40000000-0000-0000-0000-000000000008',
     '30000000-0000-0000-0000-000000000005',
     '00000000-0000-0000-0000-000000000005',
     '<p>Willkommen OtakuDreams! Berserk dreimal – das nenne ich Hingabe 👏. Made in Abyss ist auch absolut grandios, bin gespannt auf Staffel 3!</p>',
     FALSE, 2),

    ('40000000-0000-0000-0000-000000000009',
     '30000000-0000-0000-0000-000000000005',
     '00000000-0000-0000-0000-000000000004',
     '<p>Danke MangaWolf! Staffel 3 von Made in Abyss kann ich kaum erwarten. Der Manga-Arc danach ist nochmal eine andere Liga... ich verrate aber nix! 🤫</p>',
     FALSE, 1),

    -- Thread: Frühling 2025 Saisondiskussion
    ('40000000-0000-0000-0000-000000000010',
     '30000000-0000-0000-0000-000000000006',
     '00000000-0000-0000-0000-000000000004',
     '<p>Die Frühlingssaison 2025 läuft auf Hochtouren! Was schaut ihr diese Saison? Meine persönliche Watchlist:</p>
<ul>
  <li>✅ <strong>Solo Leveling</strong> – endlich eine Anime-Adaption!</li>
  <li>✅ <strong>Dungeon Meshi</strong> – unerwartet gut</li>
  <li>⏳ <strong>Frieren</strong> – noch am Aufholen</li>
  <li>⏳ <strong>Mashle</strong> – für lockere Unterhaltung</li>
</ul>
<p>Welche Anime habt ihr auf dem Radar?</p>',
     TRUE, 7),

    ('40000000-0000-0000-0000-000000000011',
     '30000000-0000-0000-0000-000000000006',
     '00000000-0000-0000-0000-000000000005',
     '<p>Dungeon Meshi ist für mich der absolute Überraschungshit! Die Kombination aus Kochen und Dungeon-Crawling klingt absurd, aber Trigger hat das perfekt umgesetzt. Die Animationsqualität ist einfach Wahnsinn.</p>',
     FALSE, 5),

    ('40000000-0000-0000-0000-000000000012',
     '30000000-0000-0000-0000-000000000006',
     '00000000-0000-0000-0000-000000000003',
     '<p>Solo Leveling hatte ich so hohe Erwartungen – und wurde nicht enttäuscht! Der MC ist einer der coolsten Isekai-Protagonisten der letzten Jahre. A-1 Pictures liefert wie immer visuell ab 🔥</p>',
     FALSE, 4),

    ('40000000-0000-0000-0000-000000000013',
     '30000000-0000-0000-0000-000000000006',
     '00000000-0000-0000-0000-000000000002',
     '<p>Ich gehe gegen den Trend: Frieren ist für mich die stärkste Serie dieser Saison. Das Storytelling ist unglaublich reif und die Themen die es anspricht – Zeit, Verlust, Bedeutung des Lebens – treffen mich jedes Mal. Slow-Burn at its finest.</p>',
     FALSE, 6),

    ('40000000-0000-0000-0000-000000000014',
     '30000000-0000-0000-0000-000000000006',
     '00000000-0000-0000-0000-000000000004',
     '<p>@sakura_mod Frieren ist definitiv etwas Besonderes – kein anderer Anime hat mich so emotional erwischt seit Violet Evergarden. Habt ihr alle schon den OST von Evan Call gehört? Macht das Erlebnis nochmal intensiver.</p>',
     FALSE, 3),

    ('40000000-0000-0000-0000-000000000015',
     '30000000-0000-0000-0000-000000000006',
     '00000000-0000-0000-0000-000000000003',
     '<p>Den OST kenne ich! "Brave New World" und "Aura" sind Ohrwürmer. Generell finde ich die Frühlingssaison 2025 eine der stärksten seit Jahren – kaum ein schwacher Titel dabei.</p>',
     FALSE, 2),

    -- Thread: Dungeon Meshi Diskussion
    ('40000000-0000-0000-0000-000000000016',
     '30000000-0000-0000-0000-000000000007',
     '00000000-0000-0000-0000-000000000003',
     '<p>Spoiler-Diskussion zu <strong>Dungeon Meshi Episoden 1-4</strong>!</p>
<p>Episode 1 hat mich sofort gehooked – Laios der einfach die Monster essen will während alle anderen kämpfen ist ein grandioser Running Gag. Senshi als Koch im Dungeon ist ein genialer Charakter-Twist.</p>
<p>Was waren eure Highlights? Für mich: die "Pilz-Episode" in Folge 3 war kulinarisch und dramatisch gleichzeitig brilliant.</p>',
     TRUE, 8),

    ('40000000-0000-0000-0000-000000000017',
     '30000000-0000-0000-0000-000000000007',
     '00000000-0000-0000-0000-000000000004',
     '<p>Die Pilz-Episode war magisch 🍄. Aber was mich wirklich begeistert ist wie das Worldbuilding organisch über das Essen funktioniert. Man lernt so viel über die Ökologie des Dungeons durch die Rezepte. Ryoko Kui ist ein Genie.</p>',
     FALSE, 5),

    ('40000000-0000-0000-0000-000000000018',
     '30000000-0000-0000-0000-000000000007',
     '00000000-0000-0000-0000-000000000005',
     '<p>Ich habe danach tatsächlich versucht das Pilzgericht nachzukochen (ohne Dungeon-Zutaten natürlich 😂). Das Konzept "Essen als Welt-Erklärung" ist in der Umsetzung so frisch. Marcille am Anfang komplett schockiert, am Ende alles verschlingend – perfekter Character-Arc in miniature.</p>',
     FALSE, 4),

    ('40000000-0000-0000-0000-000000000019',
     '30000000-0000-0000-0000-000000000007',
     '00000000-0000-0000-0000-000000000003',
     '<p>@MangaWolf das klingt nach einem Lebensziel 😄. Folge 4 mit dem Basilisken war für mich das erste echte Spannungsmoment – man vergisst fast dass sie gegen Monster kämpfen weil alles so entspannt wirkt. Dann der Twist... chef''s kiss.</p>',
     FALSE, 3),

    -- Thread: Frieren Ersteindruck
    ('40000000-0000-0000-0000-000000000020',
     '30000000-0000-0000-0000-000000000008',
     '00000000-0000-0000-0000-000000000005',
     '<p>Ich habe endlich mit <strong>Frieren: Beyond Journey''s End</strong> angefangen und bin nach 12 Folgen restlos begeistert. Kann jemand erklären warum dieser Anime so gut ist ohne Spoiler?</p>
<p>Mein Versuch: Er verweigert konsequent Anime-Konventionen. Es gibt keinen Adrenalin-Boost nach dem anderen – stattdessen Stille, Melancholie, kleine Momente die aber tief ins Herz treffen. Frieren als Charakter ist faszinierend.</p>',
     TRUE, 11),

    ('40000000-0000-0000-0000-000000000021',
     '30000000-0000-0000-0000-000000000008',
     '00000000-0000-0000-0000-000000000004',
     '<p>Du triffst es perfekt. Was mich am meisten berührt: Frieren versteht die Vergänglichkeit aller Dinge – aber sie lernt erst sehr spät wie wertvoll es war, Menschen die kurze Zeit wirklich zu kennen. Die Szene mit Himmel auf dem Berg... ich weine jedes Mal 😭</p>',
     FALSE, 7),

    ('40000000-0000-0000-0000-000000000022',
     '30000000-0000-0000-0000-000000000008',
     '00000000-0000-0000-0000-000000000005',
     '<p>Danke für die Antwort! Noch mehr gespannt auf die zweite Hälfte. Madhouse und Dentsu haben wirklich etwas Zeitloses erschaffen. Frieren auf meiner All-Time-Liste gesetzt 🌿</p>',
     FALSE, 4),

    -- Thread: Sommer Preview
    ('40000000-0000-0000-0000-000000000023',
     '30000000-0000-0000-0000-000000000009',
     '00000000-0000-0000-0000-000000000002',
     '<p>Die ersten Trailer für die Sommersaison 2025 sind raus! Meine Highlights auf dem Radar:</p>
<ul>
  <li>🔥 <strong>Spy x Family Staffel 3</strong> – Anya forever</li>
  <li>👀 <strong>Blue Lock Staffel 2</strong> – bin gespannt ob sie den Manga-Artstyle halten</li>
  <li>✨ <strong>Mushishi OVA Remaster</strong> – klassiker-revival!</li>
</ul>
<p>Was habt ihr entdeckt?</p>',
     TRUE, 3),

    ('40000000-0000-0000-0000-000000000024',
     '30000000-0000-0000-0000-000000000009',
     '00000000-0000-0000-0000-000000000003',
     '<p>Spy x Family Staffel 3 ist gesetzt! Und Blue Lock – wenn sie die Intensität aus Staffel 1 halten wird das again ein Highlight. Ich hoffe auf eine gute Adaption des U-20 Arcs.</p>',
     FALSE, 2),

    -- Thread: Top 10 Empfehlungen
    ('40000000-0000-0000-0000-000000000025',
     '30000000-0000-0000-0000-000000000010',
     '00000000-0000-0000-0000-000000000005',
     '<p>Für alle Neueinsteiger – meine persönliche Top 10 als Einstieg in die Welt des Anime:</p>
<ol>
  <li><strong>Fullmetal Alchemist: Brotherhood</strong> – perfekte Story, Pacing, Characters</li>
  <li><strong>Death Note</strong> – psychologisches Katz-und-Maus-Spiel</li>
  <li><strong>Attack on Titan</strong> – episches Worldbuilding (Staffel 1-3 unbedingt!)</li>
  <li><strong>Steins;Gate</strong> – beste Zeitreise-Story im Medium</li>
  <li><strong>Violet Evergarden</strong> – visuelles Meisterwerk, emotionaler Hammer</li>
  <li><strong>Hunter x Hunter (2011)</strong> – grandioser Shonen mit Tiefgang</li>
  <li><strong>Spirited Away / Prinzessin Mononoke</strong> – Ghibli Pflicht</li>
  <li><strong>Cowboy Bebop</strong> – Jazz, Space, Style</li>
  <li><strong>Neon Genesis Evangelion</strong> – Pflicht, auch wenn verwirrt</li>
  <li><strong>Your Lie in April</strong> – für den emotionalen Totalschaden</li>
</ol>
<p>Womit habt ihr angefangen? Was würdet ihr ergänzen?</p>',
     TRUE, 15),

    ('40000000-0000-0000-0000-000000000026',
     '30000000-0000-0000-0000-000000000010',
     '00000000-0000-0000-0000-000000000003',
     '<p>Perfekte Liste! Ich würde noch <strong>Mushishi</strong> ergänzen – für alle die etwas Ruhigeres nach dem FMA:B-Hype-Rush suchen. Und <strong>Paranoia Agent</strong> von Satoshi Kon als wilden Geheimtipp.</p>',
     FALSE, 6),

    ('40000000-0000-0000-0000-000000000027',
     '30000000-0000-0000-0000-000000000010',
     '00000000-0000-0000-0000-000000000002',
     '<p>Gute Liste, aber ich vermisse <strong>Clannad After Story</strong> – wenn wir schon von emotionalem Totalschaden reden 😭. Auch <strong>Ping Pong the Animation</strong> ist für mich unverzichtbar für alle die visuell experimentelle Werke mögen.</p>',
     FALSE, 4),

    ('40000000-0000-0000-0000-000000000028',
     '30000000-0000-0000-0000-000000000010',
     '00000000-0000-0000-0000-000000000005',
     '<p>Danke für die Ergänzungen! Clannad After Story habe ich bewusst weggelassen weil man erst das Original schauen muss – dachte das ist zu viel für Einsteiger. Aber Ping Pong – absoluter Pflichttitel, Yuasa-sensei ist ein Genie!</p>',
     FALSE, 3),

    -- Thread: Cowboy Bebop
    ('40000000-0000-0000-0000-000000000029',
     '30000000-0000-0000-0000-000000000011',
     '00000000-0000-0000-0000-000000000003',
     '<p>Ich habe Cowboy Bebop letzte Woche zum dritten Mal geschaut und frage mich: Warum ist er nach 25+ Jahren noch so gut?</p>
<p>Meine Theorie: Er hat kein Verfallsdatum weil er nie versucht hat, zeitgemäß zu sein. Jazz, Film-Noir, 70er-Ästhetik mitten in Sci-Fi – das ist zeitlos. Yoko Kanos OST ist bis heute unerreicht.</p>',
     TRUE, 9),

    ('40000000-0000-0000-0000-000000000030',
     '30000000-0000-0000-0000-000000000011',
     '00000000-0000-0000-0000-000000000004',
     '<p>Komplett d''accord. Cowboy Bebop ist einer der wenigen Anime die man jemandem zeigen kann der sonst nie Anime schaut – und er wird begeistert sein. Tank! als Opening ist Musik-Geschichte. Watanabe hat einfach unsterbliches Werk geschaffen.</p>',
     FALSE, 5),

    -- Thread: One Piece Manga
    ('40000000-0000-0000-0000-000000000031',
     '30000000-0000-0000-0000-000000000012',
     '00000000-0000-0000-0000-000000000003',
     '<p>Chapter 1100+ Diskussion – SPOILER ERLAUBT!</p>
<p>Oda liefert gerade nonstop. Der aktuelle Arc bringt so viele Fäden zusammen die seit Jahren gesponnen wurden. Was denkt ihr: Wie löst sich das Im-Sama Mysterium auf?</p>',
     TRUE, 10),

    ('40000000-0000-0000-0000-000000000032',
     '30000000-0000-0000-0000-000000000012',
     '00000000-0000-0000-0000-000000000004',
     '<p>Meine Theorie: Im-Sama ist ein unsterblicher Welteroberer der das Ruhmreiche Jahrhundert überlebt hat. Die Verbindung zu Lili Nefertari und dem leeren Thron ergibt damit Sinn. Und Joy Boy – Im ist das direkte Gegenteil. Licht vs. Schatten.</p>',
     FALSE, 6),

    ('40000000-0000-0000-0000-000000000033',
     '30000000-0000-0000-0000-000000000012',
     '00000000-0000-0000-0000-000000000003',
     '<p>@OtakuDreams das ist eine starke Theorie! Ich sehe Im auch als direkten Antagonisten zu Luffy/Joy Boy – wobei Oda bestimmt nochmal alles auf den Kopf stellt. Nach 1000+ Kapiteln overdelivert er immer noch.</p>',
     FALSE, 4),

    -- Thread: Manga-Adaptionen
    ('40000000-0000-0000-0000-000000000034',
     '30000000-0000-0000-0000-000000000013',
     '00000000-0000-0000-0000-000000000005',
     '<p>Die ewige Debatte: Wann ist die Anime-Adaption besser als die Manga-Vorlage?</p>
<p>Meine Kandidaten: <strong>Fullmetal Alchemist: Brotherhood</strong> – perfektes Pacing, grandiose Musik, ich lese den Manga kaum noch. Und <strong>Demon Slayer</strong> – ufotable hat die Kämpfe auf ein neues Level gehoben das der Manga nie erreichen konnte.</p>',
     TRUE, 7),

    ('40000000-0000-0000-0000-000000000035',
     '30000000-0000-0000-0000-000000000013',
     '00000000-0000-0000-0000-000000000003',
     '<p>FMA:B stimme ich zu 100% zu. Bei Demon Slayer bin ich gespalten – der Manga hat seine Stärken in den ruhigen Momenten die der Anime manchmal überhetzt. Aber Rengoku vs. Akaza... das ist Animation auf historischem Niveau.</p>',
     FALSE, 3),

    -- Thread: Anime-Spiele 2025
    ('40000000-0000-0000-0000-000000000036',
     '30000000-0000-0000-0000-000000000014',
     '00000000-0000-0000-0000-000000000004',
     '<p>Nach Jahren von mittelmäßigen Anime-Spielen haben wir endlich wieder einige Highlights! Meine Empfehlungen für 2025:</p>
<ul>
  <li>🎮 <strong>Dragon Ball: Sparking! Zero</strong> – Budokai Tenkaichi 4 de facto</li>
  <li>🎮 <strong>Blue Protocol</strong> – MMO mit Anime-Grafik</li>
  <li>🎮 <strong>Persona 3 Reload</strong> – Remake des Klassikers</li>
</ul>
<p>Was spielt ihr gerade?</p>',
     TRUE, 5),

    ('40000000-0000-0000-0000-000000000037',
     '30000000-0000-0000-0000-000000000014',
     '00000000-0000-0000-0000-000000000005',
     '<p>Sparking Zero war meine Kindheit in Neuauflage – ich habe sicher 20 Stunden in den ersten Tagen versenkt. Die Roster-Größe ist beeindruckend. Persona 3 Reload ist aber glaube ich das bessere Spiel wenn man RPG-Tiefe sucht.</p>',
     FALSE, 3),

    ('40000000-0000-0000-0000-000000000038',
     '30000000-0000-0000-0000-000000000014',
     '00000000-0000-0000-0000-000000000003',
     '<p>Persona 3 Reload ist eines der besten Remakes die ich je gespielt habe. Die Überarbeitung der Social Links und das neue Gameplay machen das Erlebnis frischer ohne die Seele des Originals zu zerstören. Pflicht für JRPG-Fans!</p>',
     FALSE, 2),

    ('40000000-0000-0000-0000-000000000039',
     '30000000-0000-0000-0000-000000000014',
     '00000000-0000-0000-0000-000000000004',
     '<p>Freut mich dass Persona 3 so gut ankommt! Ist das euer erster Persona-Teil oder habt ihr vorher schon 4 oder 5 gespielt?</p>',
     FALSE, 1),

    -- Thread: Streaming-Setup
    ('40000000-0000-0000-0000-000000000040',
     '30000000-0000-0000-0000-000000000015',
     '00000000-0000-0000-0000-000000000003',
     '<p>Ehrlich gesagt habe ich zu viele Abos 😅 Mein Setup:</p>
<ul>
  <li>📺 <strong>Crunchyroll</strong> – für simulcasts</li>
  <li>📺 <strong>Netflix</strong> – Exklusives (Demon Slayer S3, etc.)</li>
  <li>📺 <strong>HIDIVE</strong> – für Nischen-Titel</li>
</ul>
<p>Was nutzt ihr? Gibt es günstigere Alternativen die ich nicht kenne?</p>',
     TRUE, 2),

    ('40000000-0000-0000-0000-000000000041',
     '30000000-0000-0000-0000-000000000015',
     '00000000-0000-0000-0000-000000000002',
     '<p>Crunchyroll + Amazon Prime reicht für mich meistens. Für ältere Klassiker nutze ich noch RetroCrunch (Crunchyrolls Legacy-Katalog). Drei Abos gleichzeitig fühlt sich schon übertrieben an – aber ich kenne den Schmerz 😂</p>',
     FALSE, 2),

    -- Thread: Anime-Zitate
    ('40000000-0000-0000-0000-000000000042',
     '30000000-0000-0000-0000-000000000016',
     '00000000-0000-0000-0000-000000000002',
     '<p>Anime-Weisheiten die ich tatsächlich im Alltag anwende – teilt eure!</p>
<p>Mein Favorit: <em>"A lesson without pain is meaningless"</em> – Edward Elric, FMA:B</p>
<p>Klingt klischeehaft aber wenn ich an einem schwierigen Projekt sitze hilft mir das tatsächlich weiterzumachen.</p>',
     TRUE, 9),

    ('40000000-0000-0000-0000-000000000043',
     '30000000-0000-0000-0000-000000000016',
     '00000000-0000-0000-0000-000000000003',
     '<p><em>"People''s lives don''t end when they die. It ends when they lose faith."</em> – Itachi Uchiha, Naruto Shippuden</p>
<p>Klingt dramatisch aber ich denke daran wenn ich aufgeben will. Passt erstaunlich gut auf echte Lebenssituationen.</p>',
     FALSE, 6),

    ('40000000-0000-0000-0000-000000000044',
     '30000000-0000-0000-0000-000000000016',
     '00000000-0000-0000-0000-000000000005',
     '<p><em>"Even if I lose this feeling, I''m sure I''ll find it again and again."</em> – Frieren</p>
<p>Seit ich Frieren schaue begleitet mich das. Besonders wenn man merkt wie schnell die Zeit vergeht.</p>',
     FALSE, 5),

    -- Thread: Anime-Openings
    ('40000000-0000-0000-0000-000000000045',
     '30000000-0000-0000-0000-000000000017',
     '00000000-0000-0000-0000-000000000005',
     '<p>Welches Anime-Opening hat euch am längsten nicht losgelassen? Mein absoluter Dauergast im Kopf:</p>
<p>🎵 <strong>"A Cruel Angel''s Thesis"</strong> – Evangelion. Ikonisch. Unvermeidbar. Für immer.</p>
<p>Und für Newcomer: <strong>"Gurenge"</strong> von LiSA aus Demon Slayer hat mich 3 Wochen verfolgt 😂</p>',
     TRUE, 8),

    ('40000000-0000-0000-0000-000000000046',
     '30000000-0000-0000-0000-000000000017',
     '00000000-0000-0000-0000-000000000004',
     '<p>"Tank!" von Cowboy Bebop – kein Wort, aber sofort im Kopf. Auch <strong>"Again"</strong> von YUI aus FMA:B ist für mich das perfekte Opening für den perfekten Anime. Jedes Mal Gänsehaut.</p>',
     FALSE, 4)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Sanity check – show what was inserted
-- ---------------------------------------------------------------------------
SELECT
    c.name                          AS kategorie,
    f.name                          AS forum,
    f.thread_count,
    f.post_count
FROM forum_categories c
JOIN forums f ON f.category_id = c.id
ORDER BY c.position, f.position;
