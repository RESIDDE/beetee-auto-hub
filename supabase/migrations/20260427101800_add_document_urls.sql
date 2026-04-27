-- Add document URL columns to track generated PDFs
ALTER TABLE repairs ADD COLUMN IF NOT EXISTS bill_url TEXT;
ALTER TABLE repairs ADD COLUMN IF NOT EXISTS job_card_url TEXT;

ALTER TABLE sales ADD COLUMN IF NOT EXISTS receipt_url TEXT;

ALTER TABLE performance_quotes ADD COLUMN IF NOT EXISTS quote_url TEXT;
