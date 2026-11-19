const fs = require('fs');

function checkSql(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  console.log(`\nChecking: ${filePath} (${(Buffer.byteLength(content) / 1024).toFixed(2)} KB)`);

  // Count statements
  const statements = content.split(';\n').map(s => s.trim()).filter(Boolean);
  console.log(`Total SQL Statements: ${statements.length}`);

  // Check dollar-quotes balance ($$)
  const dollarMatches = content.match(/\$\$/g) || [];
  console.log(`Dollar-quotes count ($$): ${dollarMatches.length} (Even: ${dollarMatches.length % 2 === 0})`);

  // Check parenthetical balance in DDL
  let openParen = 0;
  let inString = false;
  let stringChar = '';

  for (let i = 0; i < content.length; i++) {
    const c = content[i];
    if (inString) {
      if (c === stringChar) {
        if (content[i + 1] === stringChar) {
          i++; // escaped quote
        } else {
          inString = false;
        }
      }
    } else {
      if (c === "'" || c === '"') {
        inString = true;
        stringChar = c;
      } else if (c === '(') {
        openParen++;
      } else if (c === ')') {
        openParen--;
      }
    }
  }
  console.log(`Parenthesis balance: ${openParen} (0 = perfectly balanced)`);
}

checkSql('C:/alwar-advocates/migrations/010_precedent_engine_schema.sql');
checkSql('C:/alwar-advocates/migrations/010_complete_precedent_engine_migration.sql');
