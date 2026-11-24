const fs = require('fs');

const content = fs.readFileSync('C:/alwar-advocates/migrations/010_complete_precedent_engine_migration.sql', 'utf8');

// Check single quotes balance across entire file outside of comments
let inQuote = false;
let quoteChar = '';
let quoteCount = 0;
let errors = [];

for (let i = 0; i < content.length; i++) {
  const c = content[i];
  if (c === "'") {
    // Check if it's an escaped quote ''
    if (inQuote && content[i + 1] === "'") {
      i++; // skip next quote
      continue;
    }
    inQuote = !inQuote;
    quoteCount++;
  }
}

console.log('Single quote open state at EOF:', inQuote ? 'STILL OPEN (ERROR!)' : 'CLOSED (VALID)');
console.log('Total single quotes counted:', quoteCount);
