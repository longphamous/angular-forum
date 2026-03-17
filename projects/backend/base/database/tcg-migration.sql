-- =============================================================================
-- TCG (Trading Card Game) – Schema Migration
-- Run as aniverse_app against aniverse_base:
--
--   psql -h localhost -p 5432 -U aniverse_app -d aniverse_base -f tcg-migration.sql
--
-- Idempotent – safe to re-run.
-- =============================================================================

CREATE TABLE IF NOT EXISTS tcg_cards (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name           VARCHAR(100)  NOT NULL,
    description    TEXT,
    image_url      TEXT,
    rarity         VARCHAR(20)   NOT NULL,
    series         VARCHAR(100)  NOT NULL,
    element        VARCHAR(50),
    attack         INTEGER       NOT NULL DEFAULT 0,
    defense        INTEGER       NOT NULL DEFAULT 0,
    hp             INTEGER       NOT NULL DEFAULT 0,
    artist_credit  VARCHAR(100),
    flavor_text    TEXT,
    is_active      BOOLEAN       NOT NULL DEFAULT TRUE,
    sort_order     INTEGER       NOT NULL DEFAULT 0,
    created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tcg_booster_packs (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                  VARCHAR(100)  NOT NULL,
    description           TEXT,
    image_url             TEXT,
    price                 INTEGER       NOT NULL,
    cards_per_pack        INTEGER       NOT NULL DEFAULT 5,
    guaranteed_rarity     VARCHAR(20),
    series                VARCHAR(100)  NOT NULL,
    available_from        TIMESTAMPTZ,
    available_until       TIMESTAMPTZ,
    max_purchases_per_user INTEGER,
    is_active             BOOLEAN       NOT NULL DEFAULT TRUE,
    sort_order            INTEGER       NOT NULL DEFAULT 0,
    created_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tcg_booster_pack_cards (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booster_pack_id UUID        NOT NULL REFERENCES tcg_booster_packs(id) ON DELETE CASCADE,
    card_id         UUID        NOT NULL REFERENCES tcg_cards(id) ON DELETE CASCADE,
    drop_weight     INTEGER     NOT NULL DEFAULT 100
);

CREATE TABLE IF NOT EXISTS tcg_user_cards (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    card_id          UUID        NOT NULL REFERENCES tcg_cards(id) ON DELETE CASCADE,
    quantity         INTEGER     NOT NULL DEFAULT 1,
    first_obtained_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_favorite      BOOLEAN     NOT NULL DEFAULT FALSE,
    UNIQUE (user_id, card_id)
);

CREATE TABLE IF NOT EXISTS tcg_user_boosters (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    booster_pack_id UUID        NOT NULL REFERENCES tcg_booster_packs(id) ON DELETE CASCADE,
    is_opened       BOOLEAN     NOT NULL DEFAULT FALSE,
    purchased_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    opened_at       TIMESTAMPTZ
);
