-- Create app_settings table for configurable system settings
CREATE TABLE IF NOT EXISTS public.app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed default service interval (3 months)
INSERT INTO public.app_settings (key, value)
VALUES ('service_interval_months', '3')
ON CONFLICT (key) DO NOTHING;

-- RLS: anyone authenticated can read; only authenticated can update
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read app_settings"
  ON public.app_settings FOR SELECT USING (true);

CREATE POLICY "Auth users update app_settings"
  ON public.app_settings FOR UPDATE USING (auth.role() = 'authenticated');
