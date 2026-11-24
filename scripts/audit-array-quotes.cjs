const fs = require('fs');
const content = fs.readFileSync('C:/alwar-advocates/migrations/010_complete_precedent_engine_migration.sql', 'utf8');

// An array literal looks like: '{"..."}'::text[]
// Inside the single quotes, any single quote must be doubled ('')
const arrayRegex = /'\{[^}]*\}'::text\[\]/g;
let match;
let issues = 0;

while ((match = arrayRegex.exec(content)) !== null) {
  const literal = match[0];
  // check if there's an unescaped single quote inside (between the outer quotes)
  const inner = literal.slice(1, literal.lastIndexOf("'"));
  // In a valid SQL string literal, any single quote inside must appear as ''
  // If we replace all '' with nothing, and there is still a ' left, then it's unescaped!
  const cleaned = inner.replace(/''/g, '');
  if (cleaned.includes("'")) {
    issues++;
    console.log(`Issue ${issues}: unescaped single quote in array literal: ${literal.slice(0, 80)}...`);
  }
}

console.log(`Total array literals with unescaped single quotes: ${issues}`);
