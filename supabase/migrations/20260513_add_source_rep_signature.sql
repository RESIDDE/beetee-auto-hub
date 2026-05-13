-- Add signature field for the person who brought the car (source representative)
ALTER TABLE vehicles
  ADD COLUMN IF NOT EXISTS source_rep_signature TEXT DEFAULT NULL;
