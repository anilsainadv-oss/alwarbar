const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(l => {
  const m = l.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (m) {
    let v = (m[2] || '').trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    env[m[1]] = v;
  }
});

const client = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function checkDetails() {
  const { data, error } = await client.from('court_sync_status').select('*').limit(1);
  console.log('court_sync_status error:', error);
  console.log('court_sync_status data:', data);

  const { data: jobData, error: jobErr } = await client.from('legal_ingestion_jobs').select('*').limit(1);
  console.log('legal_ingestion_jobs error:', jobErr);
  console.log('legal_ingestion_jobs data:', jobData);
}

checkDetails().catch(console.error);
