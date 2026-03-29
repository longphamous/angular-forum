-- Migration: Featured & Discounts storefront system
-- Run as aniverse_app or superuser against aniverse_base

-- Add discount fields to shop_items
ALTER TABLE shop_items ADD COLUMN IF NOT EXISTS original_price INT;
ALTER TABLE shop_items ADD COLUMN IF NOT EXISTS discount_percent INT;
ALTER TABLE shop_items ADD COLUMN IF NOT EXISTS discount_until TIMESTAMPTZ;

-- Add discount fields to booster_packs
ALTER TABLE booster_packs ADD COLUMN IF NOT EXISTS original_price INT;
ALTER TABLE booster_packs ADD COLUMN IF NOT EXISTS discount_percent INT;
ALTER TABLE booster_packs ADD COLUMN IF NOT EXISTS discount_until TIMESTAMPTZ;

-- Featured items table
CREATE TABLE IF NOT EXISTS featured_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section VARCHAR(30) NOT NULL DEFAULT 'featured',
  source_type VARCHAR(30) NOT NULL DEFAULT 'custom',
  source_id UUID,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  image_url VARCHAR(500),
  link_url VARCHAR(500),
  badge_text VARCHAR(50),
  badge_color VARCHAR(20) DEFAULT '#EF4444',
  original_price INT,
  discount_price INT,
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_featured_items_section ON featured_items(section);
