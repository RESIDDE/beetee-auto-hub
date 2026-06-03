-- Migration: Create cloud-synced documents table

CREATE TABLE IF NOT EXISTS public.documents (
  id           text PRIMARY KEY,
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title        text NOT NULL DEFAULT 'Untitled Document',
  content      text NOT NULL DEFAULT '',
  letterhead   boolean NOT NULL DEFAULT false,
  watermark    boolean NOT NULL DEFAULT false,
  watermark_opacity numeric(4,3) NOT NULL DEFAULT 0.08,
  margins      text NOT NULL DEFAULT 'normal',
  orientation  text NOT NULL DEFAULT 'portrait',
  font_family  text NOT NULL DEFAULT '''Outfit'', sans-serif',
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- RLS: each user can only see and manage their own documents
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own documents"
  ON public.documents FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
