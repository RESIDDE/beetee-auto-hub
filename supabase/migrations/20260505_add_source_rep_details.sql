-- Add representative details for the person sent by the source company
ALTER TABLE vehicles
  ADD COLUMN IF NOT EXISTS source_rep_name TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS source_rep_phone TEXT DEFAULT NULL;
