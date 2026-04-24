ALTER TABLE public.performance_quote_items 
ADD COLUMN IF NOT EXISTS quantity integer NOT NULL DEFAULT 1;
