const fs = require('fs');
const lines = fs.readFileSync('C:/alwar-advocates/migrations/010_complete_precedent_engine_migration.sql', 'utf8').split('\n');
const line320 = lines[319];
console.log('Snippet around Honble in line 320:');
const idx = line320.indexOf('ble');
console.log(line320.substring(idx - 20, idx + 20));
