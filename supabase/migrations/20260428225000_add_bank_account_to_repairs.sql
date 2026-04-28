-- Add bank_account column to repairs table
ALTER TABLE repairs ADD COLUMN IF NOT EXISTS bank_account TEXT DEFAULT 'servicing';
