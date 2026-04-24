-- Migration: Add Performance Quotes tables

CREATE TABLE IF NOT EXISTS public.performance_quotes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
    total_amount numeric NOT NULL DEFAULT 0,
    quote_date date NOT NULL DEFAULT CURRENT_DATE,
    status text NOT NULL DEFAULT 'Draft',
    notes text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.performance_quote_items (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    quote_id uuid REFERENCES public.performance_quotes(id) ON DELETE CASCADE,
    vehicle_id uuid REFERENCES public.vehicles(id) ON DELETE SET NULL,
    base_price numeric NOT NULL DEFAULT 0,
    has_duty boolean NOT NULL DEFAULT false,
    duty_price numeric DEFAULT 0,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.performance_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_quote_items ENABLE ROW LEVEL SECURITY;

-- Create policies (assuming similar to sales: authenticated users can do everything)
CREATE POLICY "Enable read access for all authenticated users" ON public.performance_quotes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert access for all authenticated users" ON public.performance_quotes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update access for all authenticated users" ON public.performance_quotes FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Enable delete access for all authenticated users" ON public.performance_quotes FOR DELETE TO authenticated USING (true);

CREATE POLICY "Enable read access for all authenticated users" ON public.performance_quote_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert access for all authenticated users" ON public.performance_quote_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update access for all authenticated users" ON public.performance_quote_items FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Enable delete access for all authenticated users" ON public.performance_quote_items FOR DELETE TO authenticated USING (true);
