-- Wallet migration (idempotent – safe to run multiple times)
-- NOTE: In development, TypeORM auto-syncs these tables from entities.
--       This script is provided for production migrations and manual seeding.

-- ── Tables ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_wallets (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    balance     INTEGER NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wallet_transactions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_user_id    UUID REFERENCES users(id) ON DELETE SET NULL,
    to_user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount          INTEGER NOT NULL,
    type            VARCHAR(50) NOT NULL,
    description     VARCHAR(255) NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wallet_transactions_to_user   ON wallet_transactions(to_user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_from_user ON wallet_transactions(from_user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created   ON wallet_transactions(created_at DESC);

-- ── Seed: create wallets for all existing users ────────────────────────────────

INSERT INTO user_wallets (user_id, balance)
SELECT id, 0 FROM users
WHERE id NOT IN (SELECT user_id FROM user_wallets)
ON CONFLICT (user_id) DO NOTHING;
