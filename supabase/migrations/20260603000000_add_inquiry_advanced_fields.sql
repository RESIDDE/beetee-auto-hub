-- Migration: Add advanced inquiry fields

ALTER TABLE public.inquiries
ADD COLUMN IF NOT EXISTS taken_by text,
ADD COLUMN IF NOT EXISTS advanced_questionnaire jsonb DEFAULT '{}'::jsonb;
