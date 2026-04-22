-- Migration: Add manual entry fields to inquiries
ALTER TABLE public.inquiries
ADD COLUMN manual_customer_name text,
ADD COLUMN manual_customer_phone text,
ADD COLUMN manual_customer_email text,
ADD COLUMN manual_vehicle_make text,
ADD COLUMN manual_vehicle_model text,
ADD COLUMN manual_vehicle_year text;
