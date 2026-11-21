const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
const fs = require('fs');

if (fs.existsSync('.env.local')) {
  for (const line of fs.readFileSync('.env.local', 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const k = trimmed.substring(0, idx).trim();
      let v = trimmed.substring(idx + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      process.env[k] = v;
    }
  }
}

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const testId = 'aud-test-' + crypto.randomUUID();
  const auditRow = {
    id: testId,
    document_id: 'doc-21cecd00-613e-4d8b-a2d5-f576b066f922',
    actor_id: 'admin@alwarbar.org',
    actor_name: 'Alwar Bar Administrator',
    actor_role: 'public_admin',
    action: 'TEST_AUDIT_LOG_FORMAT',
    entity_type: 'legal_document',
    entity_id: 'doc-21cecd00-613e-4d8b-a2d5-f576b066f922',
    notes: 'Test verifying correct audit log schema insertion',
    metadata_snapshot: { test: true },
    created_at: new Date().toISOString()
  };

  const { data, error } = await supabaseAdmin.from('judgment_audit_logs').insert(auditRow).select().single();
  console.log('Insert error:', error);
  console.log('Inserted row id:', data?.id);

  if (data?.id) {
    const { error: delErr } = await supabaseAdmin.from('judgment_audit_logs').delete().eq('id', testId);
    console.log('Cleanup error:', delErr || 'None (Cleaned up)');
  }
}

run();
