const fs = require('fs');
const path = require('path');

const backupDir = path.join(process.cwd(), 'data', 'backups');
const files = fs.readdirSync(backupDir).filter(f => f.startsWith('quarantine-audit-backup-'));
const latestBackup = path.join(backupDir, files[files.length - 1]);
const data = JSON.parse(fs.readFileSync(latestBackup, 'utf8'));

console.log('Total documents in backup:', data.documents.length);
data.documents.forEach((d, i) => {
  console.log(`\n--- Document #${i + 1} ---`);
  console.log('ID:', d.id);
  console.log('Title:', d.title);
  console.log('Citation:', d.citation);
  console.log('Court:', d.court_name, '| Level:', d.court_level, '| Code:', d.court_code);
  console.log('Case Number:', d.case_number);
  console.log('Date:', d.judgment_date);
  console.log('Publication Status:', d.publication_status);
  console.log('Approval Status:', d.approval_status);
  console.log('Approved By:', d.approved_by, '| Approved At:', d.approved_at);
  console.log('Published At:', d.published_at);
  console.log('Storage Path:', d.storage_path);
  console.log('Document URL:', d.document_url);
  console.log('Original Source URL:', d.original_source_url);
  console.log('PDF SHA256:', d.pdf_sha256);
  console.log('Text Length:', d.full_text ? d.full_text.length : 0);
  console.log('Text Preview:', d.full_text ? d.full_text.slice(0, 200).replace(/\n/g, ' ') : 'EMPTY');
});
