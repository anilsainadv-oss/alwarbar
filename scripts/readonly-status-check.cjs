/**
 * READ-ONLY: Check current publication_status vs audit log published actions
 */
const { createClient } = require('@supabase/supabase-js');
const { loadLocalEnv } = require('./load-env.cjs');

async function main() {
  const env = loadLocalEnv();
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_KEY);

  // Get all docs with their status
  const { data: docs } = await supabase
    .from('legal_documents')
    .select('id, citation, publication_status, approval_status, approved_by, approved_at, updated_at')
    .order('created_at', { ascending: true });

  console.log('=== CURRENT STATUS vs AUDIT HISTORY ===\n');

  // Get audit logs
  const { data: logs } = await supabase
    .from('judgment_audit_logs')
    .select('*')
    .order('created_at', { ascending: true });

  for (const doc of docs) {
    const docLogs = logs.filter(l => l.document_id && l.document_id.startsWith(doc.id.substring(0, 8)));
    console.log(`\n${doc.id.substring(0,8)} | ${doc.citation}`);
    console.log(`  Current: pub=${doc.publication_status}, appr=${doc.approval_status}, approved_by=${doc.approved_by || 'NULL'}, approved_at=${doc.approved_at ? doc.approved_at.substring(0,19) : 'NULL'}`);
    console.log(`  Updated at: ${doc.updated_at}`);
    console.log(`  Audit log actions: ${docLogs.map(l => `${l.action}@${l.created_at.substring(0,19)}`).join(' | ') || 'NONE'}`);
  }

  // Summary
  console.log('\n\n=== SUMMARY ===');
  console.log('Total docs:', docs.length);
  console.log('Published:', docs.filter(d => d.publication_status === 'published').length);
  console.log('Draft:', docs.filter(d => d.publication_status === 'draft').length);
  console.log('With approved_by set:', docs.filter(d => d.approved_by).length);
  console.log('Without approved_by (flagged):', docs.filter(d => !d.approved_by).length);

  // Anomaly detection: published actions in audit but current status is draft
  console.log('\n=== ANOMALIES ===');
  const publishedActions = logs.filter(l => l.action === 'published');
  for (const action of publishedActions) {
    const doc = docs.find(d => d.id.startsWith(action.document_id.substring(0,8)) || action.document_id.startsWith(d.id.substring(0,8)));
    if (doc && doc.publication_status === 'draft') {
      console.log(`ANOMALY: ${doc.id.substring(0,8)} (${doc.citation}) was "published" at ${action.created_at} but is currently "draft"`);
    }
  }
}

main().catch(console.error);
