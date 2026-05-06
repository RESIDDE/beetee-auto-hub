-- Fix: The RLS UPDATE policy on profiles was checking auth.uid() = id (random UUID PK),
-- which NEVER matches. The correct check is auth.uid() = user_id (FK to auth.users).
-- This caused all profile update attempts to be silently blocked by RLS.

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Also add updated_at column (was referenced in code but missing from DB)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

UPDATE public.profiles SET updated_at = now() WHERE updated_at IS NULL;
