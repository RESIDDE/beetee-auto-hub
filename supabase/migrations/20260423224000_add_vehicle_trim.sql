-- Add trim column to vehicles table
ALTER TABLE public.vehicles 
ADD COLUMN IF NOT EXISTS trim TEXT;

-- Comment on the column for clarity
COMMENT ON COLUMN public.vehicles.trim IS 'Vehicle trim level (e.g., LE, XLE, Sport)';
