const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

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

const client = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function checkApprovals() {
  const { data: docs } = await client
    .from('legal_documents')
    .select('id, citation, title, approval_status, publication_status, approved_by, approved_at, verified_by, verified_at, published_at');

  const { data: logs } = await client
    .from('judgment_audit_logs')
    .select('*');

  console.log('AUDIT OF ALL 16 JUDGMENTS IN SUPABASE:\n');
  docs.forEach((d, idx) => {
    const docLogs = (logs || []).filter(l => l.document_id === d.id || (l.details && l.details.citation === d.citation));
    console.log(`[${idx + 1}] ${d.citation} (${d.id})`);
    console.log(`    Approval Status:   ${d.approval_status} | Publication Status: ${d.publication_status}`);
    console.log(`    Approved By:       ${d.approved_by || 'NONE'} | Approved At: ${d.approved_at || 'NONE'}`);
    console.log(`    Verified By:       ${d.verified_by || 'NONE'} | Verified At: ${d.verified_at || 'NONE'}`);
    console.log(`    Published At:      ${d.published_at || 'NONE'}`);
    console.log(`    Matching Logs:     ${docLogs.length} log entries`);
    if (docLogs.length > 0) {
      docLogs.forEach(l => console.log(`      * Action: ${l.action} by ${l.actor_name || l.actor_id} (${l.actor_id}) at ${l.created_at}`));
    }
    console.log('');
  });
}

checkApprovals().catch(console.error);
