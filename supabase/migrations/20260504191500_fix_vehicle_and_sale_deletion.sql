-- Migration: Fix vehicle and sale deletion by updating foreign key constraints

-- 1. VEHICLES references

-- Sales
ALTER TABLE public.sales 
DROP CONSTRAINT IF EXISTS sales_vehicle_id_fkey,
ADD CONSTRAINT sales_vehicle_id_fkey 
  FOREIGN KEY (vehicle_id) 
  REFERENCES public.vehicles(id) 
  ON DELETE SET NULL;

-- Sale Vehicles (join table)
ALTER TABLE public.sale_vehicles 
DROP CONSTRAINT IF EXISTS sale_vehicles_vehicle_id_fkey,
ADD CONSTRAINT sale_vehicles_vehicle_id_fkey 
  FOREIGN KEY (vehicle_id) 
  REFERENCES public.vehicles(id) 
  ON DELETE CASCADE;

-- Repairs
ALTER TABLE public.repairs 
DROP CONSTRAINT IF EXISTS repairs_vehicle_id_fkey,
ADD CONSTRAINT repairs_vehicle_id_fkey 
  FOREIGN KEY (vehicle_id) 
  REFERENCES public.vehicles(id) 
  ON DELETE SET NULL;

-- Inspections
ALTER TABLE public.inspections 
DROP CONSTRAINT IF EXISTS inspections_vehicle_id_fkey,
ADD CONSTRAINT inspections_vehicle_id_fkey 
  FOREIGN KEY (vehicle_id) 
  REFERENCES public.vehicles(id) 
  ON DELETE CASCADE;

-- Inquiries
ALTER TABLE public.inquiries 
DROP CONSTRAINT IF EXISTS inquiries_vehicle_id_fkey,
ADD CONSTRAINT inquiries_vehicle_id_fkey 
  FOREIGN KEY (vehicle_id) 
  REFERENCES public.vehicles(id) 
  ON DELETE SET NULL;

-- Performance Quote Items
ALTER TABLE public.performance_quote_items 
DROP CONSTRAINT IF EXISTS performance_quote_items_vehicle_id_fkey,
ADD CONSTRAINT performance_quote_items_vehicle_id_fkey 
  FOREIGN KEY (vehicle_id) 
  REFERENCES public.vehicles(id) 
  ON DELETE SET NULL;


-- 2. SALES references

-- Sale Vehicles (join table)
ALTER TABLE public.sale_vehicles 
DROP CONSTRAINT IF EXISTS sale_vehicles_sale_id_fkey,
ADD CONSTRAINT sale_vehicles_sale_id_fkey 
  FOREIGN KEY (sale_id) 
  REFERENCES public.sales(id) 
  ON DELETE CASCADE;

-- Invoices
ALTER TABLE public.invoices 
DROP CONSTRAINT IF EXISTS invoices_sale_id_fkey,
ADD CONSTRAINT invoices_sale_id_fkey 
  FOREIGN KEY (sale_id) 
  REFERENCES public.sales(id) 
  ON DELETE SET NULL;
