/**
 * READ-ONLY: Fetch audit logs from Supabase
 */
const { createClient } = require('@supabase/supabase-js');
const { loadLocalEnv } = require('./load-env.cjs');

async function main() {
  const env = loadLocalEnv();
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_KEY);

  const { data: logs, count, error } = await supabase
    .from('judgment_audit_logs')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: true });

  if (error) {
    console.log('Error:', error.message);
    return;
  }

  console.log('Total audit log entries:', count);
  console.log('\n--- AUDIT LOG ENTRIES ---');
  for (const log of logs) {
    const details = typeof log.details === 'object' ? JSON.stringify(log.details) : (log.details || '');
    console.log(`[${log.created_at}] action="${log.action}" doc="${(log.document_id || '').substring(0,8)}" by="${log.performed_by || 'system'}" details=${details.substring(0, 150)}`);
  }
}

main().catch(console.error);
