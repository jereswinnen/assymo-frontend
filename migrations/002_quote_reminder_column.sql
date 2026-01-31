-- Add reminder tracking column to quote_submissions
-- Run this migration manually via Neon console or psql

ALTER TABLE quote_submissions ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ;

-- Index to efficiently find submissions needing reminders
CREATE INDEX IF NOT EXISTS idx_quote_submissions_reminder ON quote_submissions(reminder_sent_at)
  WHERE reminder_sent_at IS NULL;
