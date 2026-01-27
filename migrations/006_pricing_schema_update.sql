-- Migration: Update pricing schema
-- 1. Add per-m² pricing to category pricing (configurator_pricing)
-- 2. Add catalogue_item_id to questions for number type pricing
-- 3. Remove price_per_m2 from questions (moved to category level)

-- Add per-m² fields to configurator_pricing
ALTER TABLE configurator_pricing
ADD COLUMN IF NOT EXISTS price_per_m2_min INTEGER,
ADD COLUMN IF NOT EXISTS price_per_m2_max INTEGER;

-- Add catalogue_item_id to questions for number type
ALTER TABLE configurator_questions
ADD COLUMN IF NOT EXISTS catalogue_item_id UUID REFERENCES configurator_price_catalogue(id) ON DELETE SET NULL;

-- Drop price_per_m2 columns from questions (now on category pricing)
ALTER TABLE configurator_questions
DROP COLUMN IF EXISTS price_per_m2_min,
DROP COLUMN IF EXISTS price_per_m2_max;
