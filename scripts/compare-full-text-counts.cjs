const fs = require('fs');

const db = JSON.parse(fs.readFileSync('C:/alwar-advocates/data/local-db.json', 'utf8'));

// Check Rajasthan HC
const hcDoc = db.legal_documents.find(d => d.id === 'doc-ravi-kumar-2026-hcraj');
const hcTxtFile = fs.existsSync('C:/Users/Pranika/.gemini/antigravity/brain/4feaaed2-cdd0-4ce6-b924-97a8ef54bebe/scratch/rajasthan_hc_full_text.txt')
  ? fs.readFileSync('C:/Users/Pranika/.gemini/antigravity/brain/4feaaed2-cdd0-4ce6-b924-97a8ef54bebe/scratch/rajasthan_hc_full_text.txt', 'utf8')
  : null;

console.log('--- RAJASTHAN HIGH COURT TEXT COMPARISON ---');
console.log('hcDoc.full_text length in local-db.json:', hcDoc?.full_text?.length);
console.log('scratch/rajasthan_hc_full_text.txt length:', hcTxtFile?.length);

// Compare line breaks (\r\n vs \n)
if (hcDoc && hcTxtFile) {
  const lfCountDoc = (hcDoc.full_text.match(/\r\n/g) || []).length;
  const lfCountTxt = (hcTxtFile.match(/\r\n/g) || []).length;
  console.log('CRLF in hcDoc:', lfCountDoc, '| CRLF in hcTxtFile:', lfCountTxt);
  console.log('hcDoc with LF only:', hcDoc.full_text.replace(/\r\n/g, '\n').length);
  console.log('hcTxtFile with LF only:', hcTxtFile.replace(/\r\n/g, '\n').length);
}

// Check Supreme Court
const scDoc = db.legal_documents.find(d => d.citation === '2026 INSC 485');
console.log('\n--- SUPREME COURT TEXT COMPARISON ---');
console.log('scDoc.full_text length in local-db.json:', scDoc?.full_text?.length);
const lfCountSc = (scDoc?.full_text?.match(/\r\n/g) || []).length;
console.log('CRLF in scDoc:', lfCountSc);
console.log('scDoc with LF only:', scDoc?.full_text?.replace(/\r\n/g, '\n').length);
