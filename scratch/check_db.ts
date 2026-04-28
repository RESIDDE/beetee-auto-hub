import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://fxpkkrpnyecqlxbvekpb.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4cGtrcnBueWVjcWx4YnZla3BiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NjU2MzMsImV4cCI6MjA5MTI0MTYzM30.d4MlIbajUB2bIgzMY5VejyJ2akxltYJbL8137mqZslw"

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkColumns() {
  const { data, error } = await supabase
    .from('repairs')
    .select('*')
    .limit(1)
  
  if (error) {
    console.error('Error fetching repairs:', error)
  } else {
    console.log('Columns in repairs table:', Object.keys(data[0] || {}))
  }
}

checkColumns()
