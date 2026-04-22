-- Migration: Enable public access for non-authenticated signing workflows

-- 1. VEHICLES: Allow anyone to view details (needed for signing agreement context)
CREATE POLICY "Public select vehicles" ON public.vehicles FOR SELECT TO anon USING (true);

-- 2. CUSTOMERS: Allow anyone to view (to see their name on sign page) and update their signature
CREATE POLICY "Public select customers" ON public.customers FOR SELECT TO anon USING (true);
CREATE POLICY "Public update customer signature" ON public.customers FOR UPDATE TO anon
  USING (true)
  WITH CHECK (true);

-- 3. SALES: Allow public view and signature update
CREATE POLICY "Public select sales" ON public.sales FOR SELECT TO anon USING (true);
CREATE POLICY "Public update sale signature" ON public.sales FOR UPDATE TO anon
  USING (true)
  WITH CHECK (true);

-- 4. SALE_VEHICLES: Allow public view (child of sales)
CREATE POLICY "Public select sale_vehicles" ON public.sale_vehicles FOR SELECT TO anon USING (true);

-- 5. REPAIRS: Allow public view and signature update
CREATE POLICY "Public select repairs" ON public.repairs FOR SELECT TO anon USING (true);
CREATE POLICY "Public update repair signature" ON public.repairs FOR UPDATE TO anon
  USING (true)
  WITH CHECK (true);

-- 6. INSPECTIONS: Allow public view and signature update
CREATE POLICY "Public select inspections" ON public.inspections FOR SELECT TO anon USING (true);
CREATE POLICY "Public update inspection signature" ON public.inspections FOR UPDATE TO anon
  USING (true)
  WITH CHECK (true);
