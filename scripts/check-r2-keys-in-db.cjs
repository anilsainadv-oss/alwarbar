const fs = require('fs');

const raw = JSON.parse(fs.readFileSync('data/local-db.json', 'utf8'));
const docs = raw.legal_documents || [];
console.log('Total docs in local-db.json:', docs.length);
docs.forEach(d => {
  console.log(`ID: ${d.id} | Citation: ${d.citation}`);
  console.log('  Keys related to r2/storage/pdf:');
  for (const k of Object.keys(d)) {
    if (/r2|storage|pdf|file|key/i.test(k)) {
      console.log(`    ${k}: ${d[k]}`);
    }
  }
});
