-- Allow manual vehicle entry in proforma quotes
-- vehicle_id is already nullable; add a free-text description field
ALTER TABLE public.performance_quote_items
ADD COLUMN IF NOT EXISTS vehicle_description text;
