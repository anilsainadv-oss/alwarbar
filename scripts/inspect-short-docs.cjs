const fs = require('fs');

const raw = JSON.parse(fs.readFileSync('data/local-db.json', 'utf8'));
const docs = raw.legal_documents || [];

const shortDocs = docs.filter(d => ['doc-bf42ad3c-9a6e-45e7-8d70-ecc96fafe05d', 'doc-94d84764-f1a1-433e-8b56-e35de68cae51', 'doc-1e5fe258-efe4-4a3e-89f2-0bc554e793a2', 'doc-d5512772-6b0e-4741-82f8-9b913508f39e', 'doc-8feec317-8c34-4cfb-a8ef-1863d7b67a64'].includes(d.id));

shortDocs.forEach(d => {
  console.log(`\n================== ${d.id} (${d.citation}) ==================`);
  console.log('Title:', d.title);
  console.log('Text Length:', d.full_text?.length);
  console.log('FULL TEXT:\n', d.full_text);
});
