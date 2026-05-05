import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY // Need service role to bypass RLS if necessary, or just anon if it's public
)

async function fixVehicles() {
  console.log('Fixing vehicles created via repairs...')
  
  // Update vehicles that have status 'Customer Car' or condition 'Customer Vehicle'
  const { data, error } = await supabase
    .from('vehicles')
    .update({ inventory_type: 'service' })
    .or('status.eq."Customer Car",condition.eq."Customer Vehicle"')
    .eq('inventory_type', 'beetee')

  if (error) {
    console.error('Error fixing vehicles:', error)
  } else {
    console.log('Successfully updated vehicles.')
  }
}

fixVehicles()
