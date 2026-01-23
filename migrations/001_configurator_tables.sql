-- Configurator tables for quote wizard
-- Run this migration manually via Neon console or psql

-- Configurator questions (admin-manageable per product)
CREATE TABLE IF NOT EXISTS configurator_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_slug TEXT, -- NULL = applies to all products
  question_key TEXT NOT NULL,
  label TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('single-select', 'multi-select', 'number', 'dimensions')),
  options JSONB, -- For select types: [{value, label, priceModifier?}]
  required BOOLEAN DEFAULT true,
  order_rank INTEGER DEFAULT 0,
  site_id TEXT REFERENCES sites(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for configurator_questions
CREATE INDEX IF NOT EXISTS idx_configurator_questions_product ON configurator_questions(product_slug);
CREATE INDEX IF NOT EXISTS idx_configurator_questions_site ON configurator_questions(site_id);
CREATE INDEX IF NOT EXISTS idx_configurator_questions_order ON configurator_questions(order_rank);

-- Base prices per product
CREATE TABLE IF NOT EXISTS configurator_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_slug TEXT NOT NULL,
  base_price_min INTEGER NOT NULL, -- in cents
  base_price_max INTEGER NOT NULL, -- in cents
  price_modifiers JSONB, -- [{questionKey, optionValue, modifier}]
  site_id TEXT REFERENCES sites(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(product_slug, site_id)
);

-- Indexes for configurator_pricing
CREATE INDEX IF NOT EXISTS idx_configurator_pricing_site ON configurator_pricing(site_id);

-- Quote submissions (for analytics/follow-up)
CREATE TABLE IF NOT EXISTS quote_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  configuration JSONB NOT NULL, -- Full wizard answers
  price_estimate_min INTEGER,
  price_estimate_max INTEGER,
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  contact_address TEXT,
  appointment_id INTEGER REFERENCES appointments(id),
  site_id TEXT REFERENCES sites(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for quote_submissions
CREATE INDEX IF NOT EXISTS idx_quote_submissions_site ON quote_submissions(site_id);
CREATE INDEX IF NOT EXISTS idx_quote_submissions_email ON quote_submissions(contact_email);
CREATE INDEX IF NOT EXISTS idx_quote_submissions_created ON quote_submissions(created_at DESC);
