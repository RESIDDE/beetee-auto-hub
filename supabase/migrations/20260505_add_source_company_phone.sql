-- Add phone number field for the company the vehicle is from
ALTER TABLE vehicles
  ADD COLUMN IF NOT EXISTS source_company_phone TEXT DEFAULT NULL;
