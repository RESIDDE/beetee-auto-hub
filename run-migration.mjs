// One-off migration script: adds updated_at to profiles & fixes handle_new_user trigger
// Run with: node run-migration.mjs
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://fxpkkrpnyecqlxbvekpb.supabase.co";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error("❌  Set SUPABASE_SERVICE_ROLE_KEY environment variable first.");
  console.error("    Find it in: Supabase Dashboard → Project Settings → API → service_role key");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

const SQL = `
-- 1. Add updated_at column (was missing — caused silent update failures)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- 2. Backfill existing rows
UPDATE public.profiles SET updated_at = now() WHERE updated_at IS NULL;

-- 3. Fix handle_new_user: insert into 'id' (not 'user_id' which doesn't exist)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, phone)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'phone')
  ON CONFLICT (id) DO NOTHING;

  IF (SELECT COUNT(*) FROM public.user_roles) = 0 THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'mechanic');
  END IF;

  RETURN NEW;
END;
$$;
`;

try {
  const { error } = await supabase.rpc('exec_sql', { sql: SQL }).single();
  // rpc may not exist — fall back to raw query via REST if needed
  if (error) throw error;
  console.log("✅ Migration applied successfully!");
} catch (err) {
  // Fallback: use the Supabase management API approach
  console.log("ℹ️  Direct RPC not available. Trying management API...");

  const res = await fetch(
    `https://api.supabase.com/v1/projects/${SUPABASE_URL.split('//')[1].split('.')[0]}/database/query`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ query: SQL }),
    }
  );

  if (!res.ok) {
    const body = await res.text();
    console.error("❌ Migration failed:", body);
    console.log("\n📋 Run this SQL manually in the Supabase SQL Editor:");
    console.log("   https://supabase.com/dashboard/project/fxpkkrpnyecqlxbvekpb/sql/new\n");
    console.log(SQL);
    process.exit(1);
  }

  console.log("✅ Migration applied successfully!");
}
