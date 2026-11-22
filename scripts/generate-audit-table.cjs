const fs = require('fs');
const path = require('path');

const backupPath = path.join(process.cwd(), 'data', 'backups', 'latest-audit-results.json');
const results = JSON.parse(fs.readFileSync(backupPath, 'utf8'));

console.log('| # | ID | Citation | Court | Pub | Appr | Approved By | Chunks | Text Chars | R2 PDF | Classification |');
console.log('|---|---|---|---|---|---|---|---|---|---|---|');

results.forEach(r => {
  const r2Desc = r.id === 'doc-ravi-kumar-2026-hcraj' ? 'YES (383 KB)' :
                 r.id === 'doc-21cecd00-613e-4d8b-a2d5-f576b066f922' ? 'YES (21.8 KB)' : 'NO';
  
  let classification = 'Authentic';
  if (['doc-bf42ad3c-9a6e-45e7-8d70-ecc96fafe05d', 'doc-94d84764-f1a1-433e-8b56-e35de68cae51', 'doc-1e5fe258-efe4-4a3e-89f2-0bc554e793a2', 'doc-d5512772-6b0e-4741-82f8-9b913508f39e', 'doc-8feec317-8c34-4cfb-a8ef-1863d7b67a64'].includes(r.id)) {
    classification = 'Synthetic / Seed Snippet';
  } else if (r.id === 'doc-ravi-kumar-2026-hcraj' || r.id === 'doc-21cecd00-613e-4d8b-a2d5-f576b066f922') {
    classification = 'Authentic & R2 Preserved';
  } else {
    classification = 'Authentic Text (No R2 PDF)';
  }

  console.log(`| ${r.index} | \`${r.id}\` | ${r.citation} | ${r.court_code || r.court_level} | ${r.publication_status} | ${r.approval_status} | ${r.approved_by || 'NONE'} | ${r.chunk_count} | ${r.text_length} | ${r2Desc} | ${classification} |`);
});
