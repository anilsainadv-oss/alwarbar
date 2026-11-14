import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const rootDir = process.cwd();
const srcDbPath = path.join(rootDir, 'data', 'local-db.json');
const backupDir = path.join(rootDir, 'data', 'backups');

if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

if (!fs.existsSync(srcDbPath)) {
  console.error('Error: Source database data/local-db.json does not exist.');
  process.exit(1);
}

const raw = fs.readFileSync(srcDbPath, 'utf8');
const data = JSON.parse(raw);

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupFile = path.join(backupDir, `backup-${timestamp}.json`);

fs.writeFileSync(backupFile, JSON.stringify(data, null, 2), 'utf8');

const hash = crypto.createHash('sha256').update(raw).digest('hex');

console.log('===============================================================');
console.log('LOCAL DATABASE BACKUP COMPLETED SUCCESSFULLY');
console.log('===============================================================');
console.log(`Source File:       ${srcDbPath}`);
console.log(`Backup File:       ${backupFile}`);
console.log(`File Size:         ${Buffer.byteLength(raw)} bytes`);
console.log(`SHA-256 Checksum:  ${hash}`);
console.log('Tables & Entity Counts:');
for (const [key, val] of Object.entries(data)) {
  if (Array.isArray(val)) {
    console.log(`  - ${key.padEnd(22)} : ${val.length} records`);
  }
}
console.log('===============================================================\n');
