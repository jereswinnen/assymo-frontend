-- Make product_slug nullable in configurator_pricing table
-- This allows pricing rules to be associated with categories instead of products

ALTER TABLE configurator_pricing ALTER COLUMN product_slug DROP NOT NULL;
