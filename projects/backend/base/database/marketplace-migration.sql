-- Marketplace Module Migration

CREATE TABLE IF NOT EXISTS market_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES market_categories(id) ON DELETE SET NULL,
    icon VARCHAR(50) DEFAULT 'pi pi-tag',
    sort_order INT DEFAULT 0,
    requires_approval BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS market_listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL(12,2),
    currency VARCHAR(10) NOT NULL DEFAULT 'EUR',
    type VARCHAR(20) NOT NULL CHECK (type IN ('sell','buy','trade','gift')),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('draft','pending','active','sold','closed','expired','archived')),
    category_id UUID NOT NULL REFERENCES market_categories(id),
    author_id UUID NOT NULL,
    images TEXT[] NOT NULL DEFAULT '{}',
    custom_fields JSONB,
    tags TEXT[] NOT NULL DEFAULT '{}',
    expires_at TIMESTAMPTZ,
    view_count INT NOT NULL DEFAULT 0,
    offer_count INT NOT NULL DEFAULT 0,
    comment_count INT NOT NULL DEFAULT 0,
    best_offer_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS market_offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES market_listings(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL,
    amount DECIMAL(12,2),
    message TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected','withdrawn','countered')),
    counter_amount DECIMAL(12,2),
    counter_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS market_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES market_listings(id) ON DELETE CASCADE,
    author_id UUID NOT NULL,
    content TEXT NOT NULL,
    parent_id UUID REFERENCES market_comments(id) ON DELETE CASCADE,
    is_edited BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS market_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES market_listings(id),
    offer_id UUID NOT NULL REFERENCES market_offers(id),
    rater_id UUID NOT NULL,
    rated_user_id UUID NOT NULL,
    score INT NOT NULL CHECK (score BETWEEN 1 AND 5),
    text TEXT,
    reply TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS market_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES market_listings(id) ON DELETE CASCADE,
    reporter_id UUID NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','reviewed','dismissed','actioned')),
    moderator_note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed categories
INSERT INTO market_categories (name, description, icon, sort_order) VALUES
('Allgemein', 'Allgemeine Artikel', 'pi pi-tag', 0),
('Anime & Manga', 'Anime, Manga, Figuren, Poster', 'pi pi-star', 1),
('Spiele', 'Videospiele, Brettspiele, Karten', 'pi pi-desktop', 2),
('Kleidung', 'Cosplay, Merchandise, Mode', 'pi pi-user', 3),
('Elektronik', 'Geräte, Zubehör, Technik', 'pi pi-bolt', 4),
('Bücher & Medien', 'Bücher, DVDs, CDs', 'pi pi-book', 5)
ON CONFLICT DO NOTHING;
