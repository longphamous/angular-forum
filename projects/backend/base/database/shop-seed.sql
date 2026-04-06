-- Shop Items Seed Data
-- Run after shop-migration.sql and rpg-migration.sql
-- Uses ON CONFLICT to be idempotent (safe to re-run)

-- ── Cosmetic / Title items ────────────────────────────────────────────────────

INSERT INTO shop_items (id, name, description, price, icon, category, stock, max_per_user, sort_order, is_equipment)
VALUES
    ('a0000000-0000-0000-0000-000000000001', 'VIP Badge', 'Zeige deinen Status mit einem exklusiven VIP-Abzeichen in deinem Profil.', 500, 'pi pi-verified', 'Titel', NULL, 1, 0, FALSE),
    ('a0000000-0000-0000-0000-000000000002', 'Animu-Meister Titel', 'Der ultimative Titel für wahre Anime-Kenner.', 1000, 'pi pi-star-fill', 'Titel', 50, 1, 1, FALSE),
    ('a0000000-0000-0000-0000-000000000003', 'Profilrahmen – Gold', 'Ein goldener Rahmen für deinen Avatar.', 250, 'pi pi-circle-fill', 'Kosmetik', NULL, NULL, 2, FALSE),
    ('a0000000-0000-0000-0000-000000000004', 'Geheimpaket', 'Ein mysteriöses Paket – was wird darin sein?', 100, 'pi pi-gift', 'Sonstiges', 10, 3, 3, FALSE)
ON CONFLICT (id) DO NOTHING;

-- ── RPG Equipment: Weapons ────────────────────────────────────────────────────

INSERT INTO shop_items (id, name, description, price, icon, category, stock, max_per_user, sort_order, is_equipment, equipment_slot, stat_bonuses, required_level, rarity)
VALUES
    ('e0000001-0000-0000-0000-000000000001', 'Rostige Klinge', 'Ein einfaches Schwert, das schon bessere Tage gesehen hat. Taugt für den Anfang.', 50, 'pi pi-bolt', 'Ausrüstung', NULL, 1, 10, TRUE, 'weapon', '{"strength": 2}', 1, 'common'),
    ('e0000001-0000-0000-0000-000000000002', 'Schwert des Drachen', 'Geschmiedet aus Drachenschuppen. Die Klinge glüht bei Mondlicht.', 400, 'pi pi-bolt', 'Ausrüstung', 20, 1, 11, TRUE, 'weapon', '{"strength": 5, "dexterity": 2}', 3, 'rare'),
    ('e0000001-0000-0000-0000-000000000003', 'Exkalibur', 'Die legendäre Klinge der Könige. Nur die Würdigsten können sie führen.', 2500, 'pi pi-bolt', 'Ausrüstung', 5, 1, 12, TRUE, 'weapon', '{"strength": 10, "charisma": 5, "luck": 3}', 7, 'legendary'),
    ('e0000001-0000-0000-0000-000000000004', 'Magierstab der Weisheit', 'Ein uralter Stab, der mit arkaner Energie pulsiert.', 600, 'pi pi-sparkles', 'Ausrüstung', 15, 1, 13, TRUE, 'weapon', '{"intelligence": 7, "luck": 2}', 4, 'epic')
ON CONFLICT (id) DO NOTHING;

-- ── RPG Equipment: Head ───────────────────────────────────────────────────────

INSERT INTO shop_items (id, name, description, price, icon, category, stock, max_per_user, sort_order, is_equipment, equipment_slot, stat_bonuses, required_level, rarity)
VALUES
    ('e0000002-0000-0000-0000-000000000001', 'Lederkappe', 'Eine einfache Kappe aus gegerbtem Leder.', 30, 'pi pi-crown', 'Ausrüstung', NULL, 1, 20, TRUE, 'head', '{"endurance": 1}', 1, 'common'),
    ('e0000002-0000-0000-0000-000000000002', 'Helm des Berserkers', 'Ein gehörnter Helm, der Furcht in die Herzen der Feinde treibt.', 350, 'pi pi-crown', 'Ausrüstung', 10, 1, 21, TRUE, 'head', '{"strength": 3, "endurance": 2}', 4, 'rare'),
    ('e0000002-0000-0000-0000-000000000003', 'Krone der Sterne', 'Eine funkelnde Krone, die unter dem Nachthimmel leuchtet.', 1800, 'pi pi-crown', 'Ausrüstung', 3, 1, 22, TRUE, 'head', '{"intelligence": 5, "charisma": 8, "luck": 3}', 8, 'legendary')
ON CONFLICT (id) DO NOTHING;

-- ── RPG Equipment: Chest ──────────────────────────────────────────────────────

INSERT INTO shop_items (id, name, description, price, icon, category, stock, max_per_user, sort_order, is_equipment, equipment_slot, stat_bonuses, required_level, rarity)
VALUES
    ('e0000003-0000-0000-0000-000000000001', 'Stoffrobe', 'Eine leichte Robe aus Baumwolle. Bietet minimalen Schutz.', 40, 'pi pi-shield', 'Ausrüstung', NULL, 1, 30, TRUE, 'chest', '{"endurance": 1, "intelligence": 1}', 1, 'common'),
    ('e0000003-0000-0000-0000-000000000002', 'Eisenrüstung', 'Solide Rüstung aus gehärtetem Eisen. Bewährt im Kampf.', 300, 'pi pi-shield', 'Ausrüstung', 25, 1, 31, TRUE, 'chest', '{"endurance": 4, "strength": 2}', 3, 'uncommon'),
    ('e0000003-0000-0000-0000-000000000003', 'Drachenlederharnisch', 'Aus dem Leder eines alten Drachen gefertigt. Leicht und nahezu unzerstörbar.', 1200, 'pi pi-shield', 'Ausrüstung', 8, 1, 32, TRUE, 'chest', '{"endurance": 8, "dexterity": 4, "strength": 3}', 6, 'epic')
ON CONFLICT (id) DO NOTHING;

-- ── RPG Equipment: Legs ───────────────────────────────────────────────────────

INSERT INTO shop_items (id, name, description, price, icon, category, stock, max_per_user, sort_order, is_equipment, equipment_slot, stat_bonuses, required_level, rarity)
VALUES
    ('e0000004-0000-0000-0000-000000000001', 'Lederhose', 'Robuste Hose aus Tierleder. Bequem für lange Reisen.', 35, 'pi pi-arrows-v', 'Ausrüstung', NULL, 1, 40, TRUE, 'legs', '{"dexterity": 1, "endurance": 1}', 1, 'common'),
    ('e0000004-0000-0000-0000-000000000002', 'Schattenhose des Diebes', 'Lautlose Hose, die den Träger unsichtbar werden lässt.', 500, 'pi pi-arrows-v', 'Ausrüstung', 12, 1, 41, TRUE, 'legs', '{"dexterity": 6, "luck": 3}', 5, 'rare')
ON CONFLICT (id) DO NOTHING;

-- ── RPG Equipment: Feet ───────────────────────────────────────────────────────

INSERT INTO shop_items (id, name, description, price, icon, category, stock, max_per_user, sort_order, is_equipment, equipment_slot, stat_bonuses, required_level, rarity)
VALUES
    ('e0000005-0000-0000-0000-000000000001', 'Wanderstiefel', 'Strapazierfähige Stiefel für jedes Terrain.', 25, 'pi pi-map-marker', 'Ausrüstung', NULL, 1, 50, TRUE, 'feet', '{"dexterity": 1}', 1, 'common'),
    ('e0000005-0000-0000-0000-000000000002', 'Stiefel der Geschwindigkeit', 'Verzauberte Stiefel, die den Träger so schnell wie den Wind machen.', 800, 'pi pi-map-marker', 'Ausrüstung', 10, 1, 51, TRUE, 'feet', '{"dexterity": 8, "luck": 2}', 5, 'epic')
ON CONFLICT (id) DO NOTHING;

-- ── RPG Equipment: Shield ─────────────────────────────────────────────────────

INSERT INTO shop_items (id, name, description, price, icon, category, stock, max_per_user, sort_order, is_equipment, equipment_slot, stat_bonuses, required_level, rarity)
VALUES
    ('e0000006-0000-0000-0000-000000000001', 'Holzschild', 'Ein einfacher Schild aus massiver Eiche.', 45, 'pi pi-stop-circle', 'Ausrüstung', NULL, 1, 60, TRUE, 'shield', '{"endurance": 2}', 1, 'common'),
    ('e0000006-0000-0000-0000-000000000002', 'Aegis-Schild', 'Ein mythischer Schild, der die Macht der Götter kanalisiert.', 2000, 'pi pi-stop-circle', 'Ausrüstung', 3, 1, 61, TRUE, 'shield', '{"endurance": 10, "strength": 3, "charisma": 4}', 8, 'legendary')
ON CONFLICT (id) DO NOTHING;

-- ── RPG Equipment: Accessory ──────────────────────────────────────────────────

INSERT INTO shop_items (id, name, description, price, icon, category, stock, max_per_user, sort_order, is_equipment, equipment_slot, stat_bonuses, required_level, rarity)
VALUES
    ('e0000007-0000-0000-0000-000000000001', 'Kupferring', 'Ein schlichter Ring mit leichter magischer Aura.', 60, 'pi pi-circle', 'Ausrüstung', NULL, 1, 70, TRUE, 'accessory', '{"luck": 2}', 1, 'common'),
    ('e0000007-0000-0000-0000-000000000002', 'Amulett der Weisen', 'Ein uraltes Amulett, das die geistige Klarheit des Trägers verstärkt.', 450, 'pi pi-star', 'Ausrüstung', 15, 1, 71, TRUE, 'accessory', '{"intelligence": 4, "charisma": 3}', 3, 'rare'),
    ('e0000007-0000-0000-0000-000000000003', 'Ring des Schicksals', 'Wer diesen Ring trägt, wird vom Glück begünstigt. Oder verflucht.', 1500, 'pi pi-circle', 'Ausrüstung', 5, 1, 72, TRUE, 'accessory', '{"luck": 10, "charisma": 5}', 7, 'epic')
ON CONFLICT (id) DO NOTHING;
