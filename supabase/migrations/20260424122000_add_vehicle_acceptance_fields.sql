-- Migration: Add acceptance tracking fields to vehicles
ALTER TABLE public.vehicles
ADD COLUMN IF NOT EXISTS accepted_by_name text,
ADD COLUMN IF NOT EXISTS accepted_date date,
ADD COLUMN IF NOT EXISTS accepted_signature text;
