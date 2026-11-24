const { createClient } = require('@supabase/supabase-js');
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

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function inspectAll16() {
  const { data: docs, error } = await supabaseAdmin
    .from('legal_documents')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error:', error);
    return;
  }

  const { data: chunks } = await supabaseAdmin.from('legal_document_chunks').select('id, document_id, chunk_index');
  const chunkMap = {};
  (chunks || []).forEach(c => {
    chunkMap[c.document_id] = (chunkMap[c.document_id] || 0) + 1;
  });

  const { data: auditLogs } = await supabaseAdmin.from('judgment_audit_logs').select('*');
  const auditMap = {};
  (auditLogs || []).forEach(a => {
    if (!auditMap[a.document_id]) auditMap[a.document_id] = [];
    auditMap[a.document_id].push(a);
  });

  console.log(`Auditing ${docs.length} Supabase documents:\n`);

  docs.forEach((d, idx) => {
    const cCount = chunkMap[d.id] || 0;
    const aLogs = auditMap[d.id] || [];
    console.log(`[#${idx + 1}] ID: ${d.id}`);
    console.log(`    Title:            ${d.title}`);
    console.log(`    Citation:         ${d.citation} | Case No: ${d.case_number || 'N/A'}`);
    console.log(`    Court:            ${d.court_name} (${d.court_code}) Bench: ${d.bench || 'N/A'}`);
    console.log(`    Status:           Pub: [${d.publication_status}] | Appr: [${d.approval_status}] | Verif: [${d.verification_status}]`);
    console.log(`    Approved By:      ${d.approved_by || 'NULL'} at ${d.approved_at || 'NULL'}`);
    console.log(`    Published At:     ${d.published_at || 'NULL'}`);
    console.log(`    Source URL:       ${d.original_source_url || d.document_url || 'NULL'}`);
    console.log(`    R2 Key in DB:     ${d.r2_storage_key || d.storage_path || 'NULL'}`);
    console.log(`    PDF SHA-256:      ${d.pdf_sha256 || 'NULL'}`);
    console.log(`    Text Length:      ${d.full_text ? d.full_text.length : 0} chars`);
    console.log(`    Chunk Count:      ${cCount}`);
    console.log(`    Audit Log Count:  ${aLogs.length}`);
    if (aLogs.length > 0) {
      console.log(`    Audit Actions:    ${aLogs.map(a => `${a.action} by ${a.actor_id} at ${a.created_at}`).join('; ')}`);
    }
    console.log('');
  });
}

inspectAll16().catch(console.error);
