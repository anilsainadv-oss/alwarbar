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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: docs, error: docErr } = await supabase
    .from('legal_documents')
    .select('id, title, citation, court_level, approval_status, publication_status, approved_by, approved_at, published_at, verified_by, verified_at, created_at')
    .order('created_at', { ascending: true });

  if (docErr) {
    console.error('Error fetching docs:', docErr);
    return;
  }

  const { data: logs, error: logErr } = await supabase
    .from('judgment_audit_logs')
    .select('*')
    .order('created_at', { ascending: true });

  if (logErr) {
    console.error('Error fetching logs:', logErr);
    return;
  }

  console.log(`\n========================================================================`);
  console.log(`ADMIN APPROVAL & PUBLICATION AUDIT REPORT (Total Documents: ${docs.length})`);
  console.log(`========================================================================\n`);

  const report = [];

  for (const d of docs) {
    const docLogs = logs.filter(l => l.document_id === d.id || l.entity_id === d.id);
    const approvalLog = docLogs.find(l => l.action === 'APPROVE' || l.action === 'APPROVED' || l.action === 'approve_judgment');
    const publishLog = docLogs.find(l => l.action === 'PUBLISH' || l.action === 'PUBLISHED' || l.action === 'publish_judgment');
    const verifyLog = docLogs.find(l => l.action === 'VERIFY' || l.action === 'VERIFIED' || l.action === 'bulk_seed_verified');

    const isPublished = d.publication_status === 'published';
    const isApproved = d.approval_status === 'approved';

    let auditStatus = 'CLEAN';
    const flags = [];

    if (isPublished && !isApproved) {
      auditStatus = 'VIOLATION_DOUBLE_LOCK';
      flags.push('Published without being approved');
    }

    if (isApproved && !d.approved_by && !approvalLog && !verifyLog) {
      auditStatus = 'FLAGGED_FOR_REVIEW';
      flags.push('Approved status lacks admin signing record');
    }

    report.push({
      id: d.id,
      citation: d.citation,
      court: d.court_level,
      approval_status: d.approval_status,
      publication_status: d.publication_status,
      approved_by: d.approved_by || approvalLog?.actor_id || (verifyLog ? `${verifyLog.actor_id} (batch verify)` : 'NONE'),
      approved_at: d.approved_at || approvalLog?.created_at || (verifyLog ? verifyLog.created_at : 'NONE'),
      published_at: d.published_at || publishLog?.created_at || (isPublished ? d.created_at : 'UNPUBLISHED'),
      audit_log_count: docLogs.length,
      audit_status: auditStatus,
      flags: flags.join('; ') || 'None (Compliant)'
    });
  }

  console.table(report);

  console.log('\n--- AUDIT SUMMARY ---');
  console.log(`Total Judgments: ${report.length}`);
  console.log(`Published & Approved: ${report.filter(r => r.publication_status === 'published' && r.approval_status === 'approved').length}`);
  console.log(`Drafts (Strictly Unpublished): ${report.filter(r => r.publication_status === 'draft').length}`);
  console.log(`Double-Lock Violations: ${report.filter(r => r.audit_status === 'VIOLATION_DOUBLE_LOCK').length}`);
  console.log(`Flagged for Review: ${report.filter(r => r.audit_status === 'FLAGGED_FOR_REVIEW').length}`);
}

run();
