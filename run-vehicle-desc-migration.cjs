const { Client } = require('pg');

const passwords = ['#Samcuzzy39', '#Samcuzzy09099'];
const projectRef = 'fxpkkrpnyecqlxbvekpb';

const SQL = `
ALTER TABLE public.performance_quote_items
ADD COLUMN IF NOT EXISTS vehicle_description text;
`;

async function run() {
  for (const pw of passwords) {
    const encodedPw = encodeURIComponent(pw);
    const urls = [
      `postgresql://postgres:${encodedPw}@db.${projectRef}.supabase.co:5432/postgres`,
      `postgresql://postgres.${projectRef}:${encodedPw}@aws-0-eu-central-1.pooler.supabase.com:6543/postgres`,
      `postgresql://postgres.${projectRef}:${encodedPw}@aws-0-us-west-1.pooler.supabase.com:6543/postgres`,
    ];

    for (const url of urls) {
      const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
      try {
        await client.connect();
        console.log('Connected! Running migration...');
        await client.query(SQL);
        console.log('✅ Migration applied: vehicle_description column added to performance_quote_items');
        await client.end();
        process.exit(0);
      } catch (err) {
        if (client) await client.end().catch(() => {});
      }
    }
  }
  console.error('❌ Failed to connect. Run this SQL manually in Supabase SQL editor:');
  console.log('https://supabase.com/dashboard/project/fxpkkrpnyecqlxbvekpb/sql/new');
  console.log('\n' + SQL);
}

run().catch(err => console.error('Fatal:', err));
