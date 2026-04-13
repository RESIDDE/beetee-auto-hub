
-- Step 1: Fix handle_new_user to assign admin only to the first user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, phone)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'phone');

  IF (SELECT COUNT(*) FROM public.user_roles) = 0 THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'mechanic');
  END IF;

  RETURN NEW;
END;
$$;

-- Step 2: Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Step 3: Tighten RLS - vehicles
DROP POLICY IF EXISTS "Public select vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Public insert vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Public update vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Public delete vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Authenticated select vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Authenticated insert vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Authenticated update vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Authenticated delete vehicles" ON public.vehicles;
CREATE POLICY "Authenticated select vehicles" ON public.vehicles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert vehicles" ON public.vehicles FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update vehicles" ON public.vehicles FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated delete vehicles" ON public.vehicles FOR DELETE TO authenticated USING (true);

-- customers
DROP POLICY IF EXISTS "Public select customers" ON public.customers;
DROP POLICY IF EXISTS "Public insert customers" ON public.customers;
DROP POLICY IF EXISTS "Public update customers" ON public.customers;
DROP POLICY IF EXISTS "Public delete customers" ON public.customers;
DROP POLICY IF EXISTS "Authenticated select customers" ON public.customers;
DROP POLICY IF EXISTS "Authenticated insert customers" ON public.customers;
DROP POLICY IF EXISTS "Authenticated update customers" ON public.customers;
DROP POLICY IF EXISTS "Authenticated delete customers" ON public.customers;
CREATE POLICY "Authenticated select customers" ON public.customers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert customers" ON public.customers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update customers" ON public.customers FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated delete customers" ON public.customers FOR DELETE TO authenticated USING (true);

-- sales
DROP POLICY IF EXISTS "Public select sales" ON public.sales;
DROP POLICY IF EXISTS "Public insert sales" ON public.sales;
DROP POLICY IF EXISTS "Public update sales" ON public.sales;
DROP POLICY IF EXISTS "Public delete sales" ON public.sales;
DROP POLICY IF EXISTS "Authenticated select sales" ON public.sales;
DROP POLICY IF EXISTS "Authenticated insert sales" ON public.sales;
DROP POLICY IF EXISTS "Authenticated update sales" ON public.sales;
DROP POLICY IF EXISTS "Authenticated delete sales" ON public.sales;
CREATE POLICY "Authenticated select sales" ON public.sales FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert sales" ON public.sales FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update sales" ON public.sales FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated delete sales" ON public.sales FOR DELETE TO authenticated USING (true);

-- repairs
DROP POLICY IF EXISTS "Public select repairs" ON public.repairs;
DROP POLICY IF EXISTS "Public insert repairs" ON public.repairs;
DROP POLICY IF EXISTS "Public update repairs" ON public.repairs;
DROP POLICY IF EXISTS "Public delete repairs" ON public.repairs;
DROP POLICY IF EXISTS "Authenticated select repairs" ON public.repairs;
DROP POLICY IF EXISTS "Authenticated insert repairs" ON public.repairs;
DROP POLICY IF EXISTS "Authenticated update repairs" ON public.repairs;
DROP POLICY IF EXISTS "Authenticated delete repairs" ON public.repairs;
CREATE POLICY "Authenticated select repairs" ON public.repairs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert repairs" ON public.repairs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update repairs" ON public.repairs FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated delete repairs" ON public.repairs FOR DELETE TO authenticated USING (true);

-- invoices
DROP POLICY IF EXISTS "Public select invoices" ON public.invoices;
DROP POLICY IF EXISTS "Public insert invoices" ON public.invoices;
DROP POLICY IF EXISTS "Public update invoices" ON public.invoices;
DROP POLICY IF EXISTS "Public delete invoices" ON public.invoices;
DROP POLICY IF EXISTS "Authenticated select invoices" ON public.invoices;
DROP POLICY IF EXISTS "Authenticated insert invoices" ON public.invoices;
DROP POLICY IF EXISTS "Authenticated update invoices" ON public.invoices;
DROP POLICY IF EXISTS "Authenticated delete invoices" ON public.invoices;
CREATE POLICY "Authenticated select invoices" ON public.invoices FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert invoices" ON public.invoices FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update invoices" ON public.invoices FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated delete invoices" ON public.invoices FOR DELETE TO authenticated USING (true);

-- inspections
DROP POLICY IF EXISTS "Public select inspections" ON public.inspections;
DROP POLICY IF EXISTS "Public insert inspections" ON public.inspections;
DROP POLICY IF EXISTS "Public update inspections" ON public.inspections;
DROP POLICY IF EXISTS "Public delete inspections" ON public.inspections;
DROP POLICY IF EXISTS "Authenticated select inspections" ON public.inspections;
DROP POLICY IF EXISTS "Authenticated insert inspections" ON public.inspections;
DROP POLICY IF EXISTS "Authenticated update inspections" ON public.inspections;
DROP POLICY IF EXISTS "Authenticated delete inspections" ON public.inspections;
CREATE POLICY "Authenticated select inspections" ON public.inspections FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert inspections" ON public.inspections FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update inspections" ON public.inspections FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated delete inspections" ON public.inspections FOR DELETE TO authenticated USING (true);

-- inquiries
DROP POLICY IF EXISTS "Public select inquiries" ON public.inquiries;
DROP POLICY IF EXISTS "Public insert inquiries" ON public.inquiries;
DROP POLICY IF EXISTS "Public update inquiries" ON public.inquiries;
DROP POLICY IF EXISTS "Public delete inquiries" ON public.inquiries;
DROP POLICY IF EXISTS "Authenticated select inquiries" ON public.inquiries;
DROP POLICY IF EXISTS "Authenticated insert inquiries" ON public.inquiries;
DROP POLICY IF EXISTS "Authenticated update inquiries" ON public.inquiries;
DROP POLICY IF EXISTS "Authenticated delete inquiries" ON public.inquiries;
CREATE POLICY "Authenticated select inquiries" ON public.inquiries FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert inquiries" ON public.inquiries FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update inquiries" ON public.inquiries FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated delete inquiries" ON public.inquiries FOR DELETE TO authenticated USING (true);

-- vehicle_images
DROP POLICY IF EXISTS "Public select vehicle_images" ON public.vehicle_images;
DROP POLICY IF EXISTS "Public insert vehicle_images" ON public.vehicle_images;
DROP POLICY IF EXISTS "Public update vehicle_images" ON public.vehicle_images;
DROP POLICY IF EXISTS "Public delete vehicle_images" ON public.vehicle_images;
DROP POLICY IF EXISTS "Authenticated select vehicle_images" ON public.vehicle_images;
DROP POLICY IF EXISTS "Authenticated insert vehicle_images" ON public.vehicle_images;
DROP POLICY IF EXISTS "Authenticated update vehicle_images" ON public.vehicle_images;
DROP POLICY IF EXISTS "Authenticated delete vehicle_images" ON public.vehicle_images;
CREATE POLICY "Authenticated select vehicle_images" ON public.vehicle_images FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert vehicle_images" ON public.vehicle_images FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update vehicle_images" ON public.vehicle_images FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated delete vehicle_images" ON public.vehicle_images FOR DELETE TO authenticated USING (true);

-- invoice_repairs
DROP POLICY IF EXISTS "Public select invoice_repairs" ON public.invoice_repairs;
DROP POLICY IF EXISTS "Public insert invoice_repairs" ON public.invoice_repairs;
DROP POLICY IF EXISTS "Public update invoice_repairs" ON public.invoice_repairs;
DROP POLICY IF EXISTS "Public delete invoice_repairs" ON public.invoice_repairs;
DROP POLICY IF EXISTS "Authenticated select invoice_repairs" ON public.invoice_repairs;
DROP POLICY IF EXISTS "Authenticated insert invoice_repairs" ON public.invoice_repairs;
DROP POLICY IF EXISTS "Authenticated update invoice_repairs" ON public.invoice_repairs;
DROP POLICY IF EXISTS "Authenticated delete invoice_repairs" ON public.invoice_repairs;
CREATE POLICY "Authenticated select invoice_repairs" ON public.invoice_repairs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert invoice_repairs" ON public.invoice_repairs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update invoice_repairs" ON public.invoice_repairs FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated delete invoice_repairs" ON public.invoice_repairs FOR DELETE TO authenticated USING (true);
