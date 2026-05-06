-- Create repair_payments table mirroring sale_payments
CREATE TABLE IF NOT EXISTS repair_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repair_id UUID REFERENCES repairs(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  payment_date TIMESTAMPTZ DEFAULT NOW(),
  payment_method TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE repair_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all access for authenticated users" ON repair_payments
  FOR ALL USING (auth.role() = 'authenticated');
