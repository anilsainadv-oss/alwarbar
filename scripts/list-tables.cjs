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

async function checkTables() {
  const tables = [
    'legal_documents',
    'legal_document_chunks',
    'judgment_audit_logs',
    'legal_ingestion_jobs',
    'court_sync_status',
    'court_sync_logs'
  ];
  for (const t of tables) {
    const { count, error } = await client.from(t).select('*', { count: 'exact', head: true });
    if (error) {
      console.log(`  Table '${t}': NOT FOUND or ERROR: ${error.message}`);
    } else {
      console.log(`  Table '${t}': EXISTS (count: ${count})`);
    }
  }
}

checkTables().catch(console.error);
