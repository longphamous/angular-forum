-- Quest Seed Data
-- Run after quest-migration.sql

-- ── Daily Quests ──────────────────────────────────────────────────────────────

INSERT INTO quests (id, name, description, icon, quest_type, trigger_type, required_count, rewards, glory_reward, sort_order)
VALUES
    ('d0000000-0000-0000-0000-000000000001', 'Schreibe 3 Beiträge', 'Verfasse heute 3 Beiträge im Forum', 'pi pi-pencil', 'daily', 'create_post', 3, '[{"type":"xp","amount":15},{"type":"coins","amount":10}]', 1, 0),
    ('d0000000-0000-0000-0000-000000000002', 'Reagiere auf 5 Beiträge', 'Gib heute 5 Reaktionen', 'pi pi-heart', 'daily', 'give_reaction', 5, '[{"type":"xp","amount":10},{"type":"coins","amount":5}]', 1, 1),
    ('d0000000-0000-0000-0000-000000000003', 'Täglicher Login', 'Melde dich heute an', 'pi pi-sign-in', 'daily', 'login', 1, '[{"type":"coins","amount":3}]', 0, 2)
ON CONFLICT (id) DO NOTHING;

-- ── Weekly Quests ─────────────────────────────────────────────────────────────

INSERT INTO quests (id, name, description, icon, quest_type, trigger_type, required_count, rewards, glory_reward, required_level, sort_order)
VALUES
    ('a1000000-0000-0000-0000-000000000001', 'Erstelle 2 Themen', 'Eröffne diese Woche 2 neue Diskussionen', 'pi pi-comments', 'weekly', 'create_thread', 2, '[{"type":"xp","amount":50},{"type":"coins","amount":30}]', 5, 2, 0),
    ('a1000000-0000-0000-0000-000000000002', 'Erhalte 10 Reaktionen', 'Sammle diese Woche 10 Reaktionen auf deine Beiträge', 'pi pi-thumbs-up', 'weekly', 'receive_reaction', 10, '[{"type":"xp","amount":40},{"type":"glory","amount":10}]', 10, 3, 1),
    ('a1000000-0000-0000-0000-000000000003', 'Sende eine Nachricht', 'Schreibe jemandem eine private Nachricht', 'pi pi-envelope', 'weekly', 'send_message', 1, '[{"type":"xp","amount":20},{"type":"coins","amount":15}]', 3, 1, 2)
ON CONFLICT (id) DO NOTHING;

-- ── Monthly Quests ────────────────────────────────────────────────────────────

INSERT INTO quests (id, name, description, icon, quest_type, trigger_type, required_count, rewards, glory_reward, required_level, sort_order)
VALUES
    ('a2000000-0000-0000-0000-000000000001', 'Community Champion', 'Schreibe diesen Monat 50 Beiträge', 'pi pi-trophy', 'monthly', 'create_post', 50, '[{"type":"xp","amount":200},{"type":"coins","amount":100}]', 25, 3, 0),
    ('a2000000-0000-0000-0000-000000000002', 'Galerie-Künstler', 'Lade diesen Monat 5 Bilder in die Galerie hoch', 'pi pi-images', 'monthly', 'upload_gallery', 5, '[{"type":"xp","amount":100},{"type":"coins","amount":50}]', 15, 2, 1)
ON CONFLICT (id) DO NOTHING;

-- ── Story Quests ──────────────────────────────────────────────────────────────

INSERT INTO quests (id, name, description, icon, quest_type, trigger_type, required_count, rewards, glory_reward, sort_order)
VALUES
    ('a3000000-0000-0000-0000-000000000001', 'Der erste Schritt', 'Erstelle deinen ersten Beitrag im Forum', 'pi pi-flag', 'story', 'create_post', 1, '[{"type":"xp","amount":25},{"type":"coins","amount":20}]', 5, 0),
    ('a3000000-0000-0000-0000-000000000002', 'Freundschaft schließen', 'Füge deinen ersten Freund hinzu', 'pi pi-users', 'story', 'add_friend', 1, '[{"type":"xp","amount":30},{"type":"coins","amount":15}]', 5, 1),
    ('a3000000-0000-0000-0000-000000000003', 'Erster Einkauf', 'Kaufe deinen ersten Gegenstand im Shop', 'pi pi-shopping-bag', 'story', 'buy_item', 1, '[{"type":"xp","amount":20},{"type":"coins","amount":25}]', 5, 2),
    ('a3000000-0000-0000-0000-000000000004', 'Rüste dich aus!', 'Rüste dein erstes Equipment aus', 'pi pi-shield', 'story', 'equip_item', 1, '[{"type":"xp","amount":30}]', 10, 3),
    ('a3000000-0000-0000-0000-000000000005', 'Content Creator', 'Schreibe deinen ersten Blog-Beitrag', 'pi pi-file-edit', 'story', 'create_blog_post', 1, '[{"type":"xp","amount":40},{"type":"coins","amount":30}]', 10, 4)
ON CONFLICT (id) DO NOTHING;

-- ── Event Quest ───────────────────────────────────────────────────────────────

INSERT INTO quests (id, name, description, icon, quest_type, trigger_type, required_count, rewards, glory_reward, sort_order, event_starts_at, event_ends_at)
VALUES
    ('e0000000-0000-0000-0000-000000000001', 'Frühlings-Festival', 'Schreibe 20 Beiträge während des Frühlings-Events und gewinne exklusive Belohnungen!', 'pi pi-sun', 'event', 'create_post', 20, '[{"type":"xp","amount":500},{"type":"coins","amount":200},{"type":"glory","amount":50}]', 50, 0, NOW() - INTERVAL '3 days', NOW() + INTERVAL '11 days')
ON CONFLICT (id) DO NOTHING;
