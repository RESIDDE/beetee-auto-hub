const { Client } = require('pg');

const passwords = ['#Samcuzzy39', '#Samcuzzy09099'];
const projectRef = 'fxpkkrpnyecqlxbvekpb';

async function run() {
  const sql = `ALTER TABLE repairs ADD COLUMN IF NOT EXISTS bank_account TEXT DEFAULT 'servicing';`;

  for (const pw of passwords) {
    const encodedPw = encodeURIComponent(pw);
    const connStr2 = `postgresql://postgres:${encodedPw}@db.${projectRef}.supabase.co:5432/postgres`;
    const connStr3 = `postgresql://postgres.${projectRef}:${encodedPw}@aws-0-eu-central-1.pooler.supabase.com:6543/postgres`;
    const connStr4 = `postgresql://postgres.${projectRef}:${encodedPw}@aws-0-us-west-1.pooler.supabase.com:6543/postgres`;
    
    const tryUrl = async (url) => {
      console.log('Trying URL:', url.replace(encodedPw, '***').replace(pw, '***'));
      const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false }});
      try {
        await client.connect();
        console.log('Connected natively! Executing SQL...');
        await client.query(sql);
        console.log('Column added successfully!');
        await client.end();
        process.exit(0);
      } catch (err) {
        console.error('Error with this URL:', err.message);
        if (client) await client.end().catch(()=>{});
      }
    };
    
    await tryUrl(connStr2);
    await tryUrl(connStr3);
    await tryUrl(connStr4);
  }
  
  console.error("Failed to connect using all passwords.");
}

run().catch(err => {
  console.error('Fatal:', err);
});
