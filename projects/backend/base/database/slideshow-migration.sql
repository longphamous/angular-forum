-- Teaser Slideshow: create table
-- TypeORM synchronize:true will auto-create in dev, this script is for reference/production use.

CREATE TABLE IF NOT EXISTS teaser_slides (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    title       VARCHAR(255) NOT NULL,
    description TEXT,
    image_url   VARCHAR(500) NOT NULL,
    link_url    VARCHAR(500),
    link_label  VARCHAR(100),
    is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
    sort_order  INT          NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_teaser_slides_active ON teaser_slides (is_active, sort_order);

-- Seed: insert two demo slides (idempotent via ON CONFLICT DO NOTHING on title+image_url combo)
INSERT INTO teaser_slides (title, description, image_url, link_url, link_label, is_active, sort_order)
VALUES
    ('Willkommen bei Aniverse', 'Deine Community für Anime, Manga & Forum-Diskussionen.', '/uploads/slideshow/demo1.jpg', '/forum', 'Zum Forum', true, 0),
    ('Top Anime entdecken', 'Durchsuche unsere Anime-Datenbank und finde deinen nächsten Lieblings-Anime.', '/uploads/slideshow/demo2.jpg', '/anime-top-list', 'Jetzt entdecken', true, 1)
ON CONFLICT DO NOTHING;
