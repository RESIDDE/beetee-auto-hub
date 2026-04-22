-- Migration: Fix customer deletion by allowing NULL on referencing columns and setting ON DELETE SET NULL

-- 1. Inquiries
ALTER TABLE public.inquiries 
DROP CONSTRAINT IF EXISTS inquiries_customer_id_fkey,
ADD CONSTRAINT inquiries_customer_id_fkey 
  FOREIGN KEY (customer_id) 
  REFERENCES public.customers(id) 
  ON DELETE SET NULL;

-- 2. Repairs
ALTER TABLE public.repairs 
DROP CONSTRAINT IF EXISTS repairs_customer_id_fkey,
ADD CONSTRAINT repairs_customer_id_fkey 
  FOREIGN KEY (customer_id) 
  REFERENCES public.customers(id) 
  ON DELETE SET NULL;

-- 3. Sales
ALTER TABLE public.sales 
DROP CONSTRAINT IF EXISTS sales_customer_id_fkey,
ADD CONSTRAINT sales_customer_id_fkey 
  FOREIGN KEY (customer_id) 
  REFERENCES public.customers(id) 
  ON DELETE SET NULL;

-- 4. Invoices (Needs NULL allowed first)
ALTER TABLE public.invoices 
ALTER COLUMN customer_id DROP NOT NULL;

ALTER TABLE public.invoices 
DROP CONSTRAINT IF EXISTS invoices_customer_id_fkey,
ADD CONSTRAINT invoices_customer_id_fkey 
  FOREIGN KEY (customer_id) 
  REFERENCES public.customers(id) 
  ON DELETE SET NULL;
