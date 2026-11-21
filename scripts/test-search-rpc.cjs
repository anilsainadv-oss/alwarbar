const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envContent = fs.readFileSync('C:/alwar-advocates/.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(l => {
  const m = l.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (m) {
    let v = (m[2] || '').trim();
    if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
    if (v.startsWith("'") && v.endsWith("'")) v = v.slice(1, -1);
    env[m[1]] = v;
  }
});

const anonClient = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const adminClient = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const fakeVector = new Array(1536).fill(0.01);

async function test() {
  console.log('Testing anonClient.rpc(search_legal_chunks)...');
  const { data: anonData, error: anonErr } = await anonClient.rpc('search_legal_chunks', {
    query_embedding: fakeVector,
    query_text: 'Bail',
    match_count: 5
  });
  console.log('Anon error:', anonErr ? anonErr.message : 'NONE');
  console.log('Anon matches:', anonData ? anonData.length : 0);

  console.log('\nTesting adminClient.rpc(search_legal_chunks)...');
  const { data: adminData, error: adminErr } = await adminClient.rpc('search_legal_chunks', {
    query_embedding: fakeVector,
    query_text: 'Bail',
    match_count: 5
  });
  console.log('Admin error:', adminErr ? adminErr.message : 'NONE');
  console.log('Admin matches:', adminData ? adminData.length : 0);
  if (adminData && adminData[0]) {
    console.log('Sample result:', adminData[0]);
  }
}

test().catch(console.error);
