-- Enable Supabase Realtime on app_settings so permission changes
-- broadcast immediately to all connected clients.
-- Run this in the Supabase SQL editor if you haven't already.

-- 1. Add the table to the supabase_realtime publication
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename  = 'app_settings'
  ) then
    alter publication supabase_realtime add table public.app_settings;
  end if;
end
$$;

-- 2. Ensure the permissions row always exists (idempotent upsert)
insert into public.app_settings (key, value)
values (
  'permissions',
  '{
    "admin":    { "view": ["dashboard","vehicles","customers","sales","invoices","inquiries","inspections","repairs","authority-to-sell","performance-quotes"], "edit": ["dashboard","vehicles","customers","sales","invoices","inquiries","inspections","repairs","authority-to-sell","performance-quotes"] },
    "sales":    { "view": ["dashboard","vehicles","customers","sales","invoices","inquiries","performance-quotes","authority-to-sell"], "edit": ["vehicles","customers","sales","invoices","inquiries","performance-quotes","authority-to-sell"] },
    "mechanic": { "view": ["dashboard","vehicles","repairs","inspections"], "edit": ["vehicles","repairs","inspections"] }
  }'::jsonb
)
on conflict (key) do nothing;
