-- Configurator categories migration
-- Replaces hardcoded CONFIGURATOR_PRODUCTS with admin-managed categories
-- Run this migration manually via Neon console or psql

-- =============================================================================
-- Create configurator categories table
-- =============================================================================

CREATE TABLE IF NOT EXISTS configurator_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  order_rank INTEGER DEFAULT 0,
  site_id TEXT REFERENCES sites(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(slug, site_id)
);

-- Indexes for configurator_categories
CREATE INDEX IF NOT EXISTS idx_configurator_categories_site ON configurator_categories(site_id);
CREATE INDEX IF NOT EXISTS idx_configurator_categories_order ON configurator_categories(order_rank);
CREATE INDEX IF NOT EXISTS idx_configurator_categories_slug ON configurator_categories(slug);

-- =============================================================================
-- Add category_id to questions (keep product_slug temporarily for migration)
-- =============================================================================

ALTER TABLE configurator_questions
  ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES configurator_categories(id) ON DELETE CASCADE;

-- Index for faster question lookups by category
CREATE INDEX IF NOT EXISTS idx_configurator_questions_category ON configurator_questions(category_id);

-- =============================================================================
-- Add category_id to pricing (keep product_slug temporarily for migration)
-- =============================================================================

ALTER TABLE configurator_pricing
  ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES configurator_categories(id) ON DELETE CASCADE;

-- Index for faster pricing lookups by category
CREATE INDEX IF NOT EXISTS idx_configurator_pricing_category ON configurator_pricing(category_id);

-- =============================================================================
-- Add configurator_category_id to solutions
-- =============================================================================

ALTER TABLE solutions
  ADD COLUMN IF NOT EXISTS configurator_category_id UUID REFERENCES configurator_categories(id) ON DELETE SET NULL;

-- Index for faster solution lookups by configurator category
CREATE INDEX IF NOT EXISTS idx_solutions_configurator_category ON solutions(configurator_category_id);

-- =============================================================================
-- Migration helpers (optional - run manually to migrate existing data)
-- =============================================================================

-- To migrate existing product_slug data to categories:
-- 1. First create categories for each unique product_slug
-- 2. Then update questions/pricing to reference those categories
--
-- Example:
-- INSERT INTO configurator_categories (name, slug, site_id)
-- SELECT DISTINCT
--   INITCAP(REPLACE(product_slug, '-', ' ')),
--   product_slug,
--   site_id
-- FROM configurator_questions
-- WHERE product_slug IS NOT NULL
-- ON CONFLICT (slug, site_id) DO NOTHING;
--
-- UPDATE configurator_questions q
-- SET category_id = c.id
-- FROM configurator_categories c
-- WHERE q.product_slug = c.slug AND q.site_id = c.site_id;
