-- Add phone number field for the person who brought the resale vehicle
ALTER TABLE vehicles
  ADD COLUMN IF NOT EXISTS accepted_by_phone TEXT DEFAULT NULL;
