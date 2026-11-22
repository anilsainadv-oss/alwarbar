const fs = require('fs');

const raw = JSON.parse(fs.readFileSync('data/local-db.json', 'utf8'));
const docs = raw.legal_documents || [];

const otherDocs = docs.filter(d => ![
  'doc-ravi-kumar-2026-hcraj', 
  'doc-21cecd00-613e-4d8b-a2d5-f576b066f922',
  'doc-bf42ad3c-9a6e-45e7-8d70-ecc96fafe05d', 
  'doc-94d84764-f1a1-433e-8b56-e35de68cae51', 
  'doc-1e5fe258-efe4-4a3e-89f2-0bc554e793a2', 
  'doc-d5512772-6b0e-4741-82f8-9b913508f39e', 
  'doc-8feec317-8c34-4cfb-a8ef-1863d7b67a64'
].includes(d.id));

console.log('Count of other docs:', otherDocs.length);
otherDocs.forEach(d => {
  console.log(`\n================== ${d.id} (${d.citation}) ==================`);
  console.log('Title:', d.title);
  console.log('Court:', d.court_name);
  console.log('Pub Status:', d.publication_status, '| Appr Status:', d.approval_status);
  console.log('Text Length:', d.full_text?.length);
  console.log('Text Start (first 300 chars):\n', d.full_text?.slice(0, 300));
  console.log('Text End (last 300 chars):\n', d.full_text?.slice(-300));
});
