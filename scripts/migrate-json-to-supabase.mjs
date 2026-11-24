import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const rootDir = process.cwd();
const dbPath = path.join(rootDir, 'data', 'local-db.json');
const backupDir = path.join(rootDir, 'data', 'backups');

if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

const envPath = path.join(rootDir, '.env.local');
const env = {};
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const m = line.match(/^([A-Za-z0-9_]+)=(.*)$/);
    if (m) env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
  });
}

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const raw = fs.readFileSync(dbPath, 'utf8');
const data = JSON.parse(raw);

console.log('===============================================================');
console.log('SUPABASE MIGRATION & SQL SEED EXPORT UTILITY');
console.log('===============================================================');
console.log('Target URL:', supabaseUrl ? new URL(supabaseUrl).host : 'None configured');

function escapeSql(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
  if (typeof val === 'number') return String(val);
  if (Array.isArray(val)) {
    const escapedItems = val.map(v => `"${String(v).replace(/"/g, '""')}"`);
    return `'${escapedItems.join(',')}'::text[]`;
  }
  if (typeof val === 'object') {
    return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`;
  }
  return `'${String(val).replace(/'/g, "''")}'`;
}

function generateTableSql(tableName, rows) {
  if (!rows || rows.length === 0) return `-- No records for ${tableName}\n`;
  const columns = Object.keys(rows[0]).filter(c => c !== 'user' && c !== 'client_name' && c !== 'case_title');
  let sql = `-- ${tableName.toUpperCase()} (${rows.length} records)\n`;
  rows.forEach(r => {
    const colList = columns.join(', ');
    const valList = columns.map(c => escapeSql(r[c])).join(', ');
    sql += `INSERT INTO ${tableName} (${colList}) VALUES (${valList}) ON CONFLICT DO NOTHING;\n`;
  });
  return sql + '\n';
}

// Generate complete migration SQL dump
let fullSql = `-- ==============================================================================\n`;
fullSql += `-- ALWAR ADVOCATES PORTAL — MIGRATION DATA DUMP\n`;
fullSql += `-- Generated: ${new Date().toISOString()}\n`;
fullSql += `-- Source: data/local-db.json\n`;
fullSql += `-- ==============================================================================\n\n`;

fullSql += generateTableSql('users', data.users);
fullSql += generateTableSql('advocate_profiles', data.advocate_profiles);
fullSql += generateTableSql('welfare_schemes', data.welfare_schemes);
fullSql += generateTableSql('legal_updates', data.legal_updates);
fullSql += generateTableSql('legal_forms', data.legal_forms);
fullSql += generateTableSql('notices_events', data.notices_events);
fullSql += generateTableSql('forum_categories', data.forum_categories);
fullSql += generateTableSql('forum_posts', data.forum_posts);
fullSql += generateTableSql('forum_replies', data.forum_replies);
fullSql += generateTableSql('clients', data.clients);
fullSql += generateTableSql('cases', data.cases);
fullSql += generateTableSql('case_documents', data.case_documents);
fullSql += generateTableSql('case_hearings', data.case_hearings);
fullSql += generateTableSql('tasks', data.tasks);
fullSql += generateTableSql('invoices', data.invoices);
fullSql += generateTableSql('drafts', data.drafts);
fullSql += generateTableSql('personal_library', data.personal_library);
fullSql += generateTableSql('audit_logs', data.audit_logs);

const sqlExportPath = path.join(backupDir, 'migration-seed.sql');
fs.writeFileSync(sqlExportPath, fullSql, 'utf8');
console.log(`✓ Standalone SQL seed script written to: ${sqlExportPath}`);
console.log(`  (Can be executed directly in Supabase SQL Editor if remote cluster is active)\n`);

async function runLiveMigration() {
  if (!supabaseUrl || !supabaseKey) {
    console.log('Notice: Supabase URL or Service Key not configured in .env.local.');
    console.log('Skipping direct API sync. Use data/backups/migration-seed.sql when database is ready.');
    return;
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('Pinging Supabase cluster...');
    const { error: pingErr } = await supabase.from('users').select('id', { head: true, count: 'exact' });
    if (pingErr) {
      console.log('Supabase API error / unreachable:', pingErr.message);
      console.log('Safe fallback active: Local data preserved; migration-seed.sql ready for manual import.');
      return;
    }
    console.log('✓ Successfully connected to live Supabase cluster.');
  } catch (err) {
    console.log('Direct network connection failed:', err.message);
    console.log('Local data preserved safely.');
  }
}

runLiveMigration().catch(console.error);
