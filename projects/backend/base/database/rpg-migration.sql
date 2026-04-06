-- RPG Character System migration
-- Run as aniverse_app or superuser after shop-migration.sql

-- ── Extend shop_items with RPG equipment fields ──────────────────────────────

ALTER TABLE shop_items ADD COLUMN IF NOT EXISTS is_equipment    BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE shop_items ADD COLUMN IF NOT EXISTS equipment_slot  VARCHAR(30);
ALTER TABLE shop_items ADD COLUMN IF NOT EXISTS stat_bonuses    JSONB;
ALTER TABLE shop_items ADD COLUMN IF NOT EXISTS required_level  INTEGER;
ALTER TABLE shop_items ADD COLUMN IF NOT EXISTS rarity          VARCHAR(20);

CREATE INDEX IF NOT EXISTS idx_shop_items_equipment ON shop_items(is_equipment) WHERE is_equipment = TRUE;

-- ── User characters ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_characters (
    user_id         UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    name            VARCHAR(50) NOT NULL DEFAULT 'Held',
    character_class VARCHAR(20) NOT NULL DEFAULT 'warrior',
    strength        INTEGER NOT NULL DEFAULT 1,
    dexterity       INTEGER NOT NULL DEFAULT 1,
    intelligence    INTEGER NOT NULL DEFAULT 1,
    charisma        INTEGER NOT NULL DEFAULT 1,
    endurance       INTEGER NOT NULL DEFAULT 1,
    luck            INTEGER NOT NULL DEFAULT 1,
    unspent_points  INTEGER NOT NULL DEFAULT 0,
    slot_head       UUID REFERENCES user_inventory(id) ON DELETE SET NULL,
    slot_chest      UUID REFERENCES user_inventory(id) ON DELETE SET NULL,
    slot_legs       UUID REFERENCES user_inventory(id) ON DELETE SET NULL,
    slot_feet       UUID REFERENCES user_inventory(id) ON DELETE SET NULL,
    slot_weapon     UUID REFERENCES user_inventory(id) ON DELETE SET NULL,
    slot_shield     UUID REFERENCES user_inventory(id) ON DELETE SET NULL,
    slot_accessory  UUID REFERENCES user_inventory(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
