-- Add replacement_parts_list JSONB column to repairs table
ALTER TABLE public.repairs 
ADD COLUMN IF NOT EXISTS replacement_parts_list JSONB DEFAULT '[]'::jsonb;

-- Comment on the column for clarity
COMMENT ON COLUMN public.repairs.replacement_parts_list IS 'List of replacement parts with names and prices';
