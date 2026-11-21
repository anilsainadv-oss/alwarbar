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

const draftIds = [
  'doc-8a983296-0771-4b37-802c-74fac6082949', // 2026 (1) WLC (Raj) 214
  'doc-daf515fd-1407-41b6-bff2-80bb7a3a5ce6', // 2026 (1) RLR 488
  'doc-8169c79e-407c-4f20-a1d1-b53de1210a62', // 2026 (1) RajCriC 320
  'doc-1cca7d96-278d-48ad-b299-80a80e8cc824', // 2026 INSC 412
  'doc-47d80f6b-1d3c-4c55-a298-e4c3999efe5e', // 2026 (1) RLR 602
  'doc-b30e825d-b8f7-4491-a727-5a346b44ee46'  // 2026 (1) RajCriC 440
];

async function revert() {
  console.log('Restoring 6 draft judgments to publication_status = draft and published_at = null...');
  for (const id of draftIds) {
    const { data, error } = await client
      .from('legal_documents')
      .update({
        publication_status: 'draft',
        published_at: null,
        approval_status: 'approved',
        approved_by: null,
        approved_at: null
      })
      .eq('id', id)
      .select('id, citation, publication_status, approval_status, approved_by');
    if (error) console.error(`Error reverting ${id}:`, error.message);
    else console.log(`✓ Reverted ${data[0]?.citation} to publication_status: draft, approved_by: null`);
  }
}

revert().catch(console.error);
