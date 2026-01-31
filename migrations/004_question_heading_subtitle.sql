-- Migration: Add heading_level and subtitle to configurator_questions
-- Also adds 'text' to the question type enum

-- Add heading_level column with default 'h2'
ALTER TABLE configurator_questions
ADD COLUMN IF NOT EXISTS heading_level VARCHAR(10) DEFAULT 'h2';

-- Add subtitle column (nullable, for rich text)
ALTER TABLE configurator_questions
ADD COLUMN IF NOT EXISTS subtitle TEXT;

-- Update the type check constraint to include 'text' type
-- First drop the existing constraint if it exists
ALTER TABLE configurator_questions
DROP CONSTRAINT IF EXISTS configurator_questions_type_check;

-- Add the new constraint with 'text' included
ALTER TABLE configurator_questions
ADD CONSTRAINT configurator_questions_type_check
CHECK (type IN ('single-select', 'multi-select', 'text', 'number', 'dimensions'));
