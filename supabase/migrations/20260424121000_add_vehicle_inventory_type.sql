-- Migration: Add inventory_type to vehicles
ALTER TABLE public.vehicles
ADD COLUMN IF NOT EXISTS inventory_type text DEFAULT 'beetee';

-- Update existing records to 'beetee'
UPDATE public.vehicles SET inventory_type = 'beetee' WHERE inventory_type IS NULL;
