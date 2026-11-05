import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length < 2) return [];

  const delimiter = lines[0].includes('\t') ? '\t' : ',';

  const parseLine = (line) => {
    const entries = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        entries.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    entries.push(current.trim());
    return entries;
  };

  const headers = parseLine(lines[0]).map(h => h.toLowerCase().replace(/[^a-z0-9_]/g, '_'));
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i]);
    const row = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx] || '';
    });
    rows.push(row);
  }

  return rows;
}

function hashPassword(password) {
  return crypto.createHash('sha256').update(password + '_alwar_salt_2026').digest('hex');
}

async function runBulkImport() {
  const args = process.argv.slice(2);
  const targetFile = args[0] || path.join(process.cwd(), 'data', 'sample-advocates.csv');

  console.log(`\n======================================================`);
  console.log(`ALWAR ADVOCATES PORTAL — BULK ADVOCATE IMPORTER`);
  console.log(`======================================================`);
  console.log(`Source File: ${targetFile}`);

  if (!fs.existsSync(targetFile)) {
    console.error(`Error: File not found: ${targetFile}`);
    process.exit(1);
  }

  const rawContent = fs.readFileSync(targetFile, 'utf-8');
  let records = [];

  if (targetFile.endsWith('.json')) {
    records = JSON.parse(rawContent);
  } else {
    records = parseCSV(rawContent);
  }

  console.log(`Found ${records.length} records in source file.`);

  const dbPath = path.join(process.cwd(), 'data', 'local-db.json');
  if (!fs.existsSync(dbPath)) {
    console.error(`Error: Database file not found at ${dbPath}`);
    process.exit(1);
  }

  const db = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
  if (!Array.isArray(db.users)) db.users = [];
  if (!Array.isArray(db.advocate_profiles)) db.advocate_profiles = [];

  let added = 0;
  let updated = 0;
  const errors = [];

  for (let i = 0; i < records.length; i++) {
    const row = records[i];
    const fullName = (row.full_name || row.name || row.advocate_name || '').trim();
    const enrollmentNo = (row.bar_council_enrollment_no || row.enrollment_no || row.sanad_no || '').trim();

    if (!fullName || !enrollmentNo) {
      errors.push(`Row ${i + 1}: Skipping due to missing Name or Enrollment Number.`);
      continue;
    }

    let areas = [];
    if (Array.isArray(row.practice_areas)) {
      areas = row.practice_areas;
    } else if (typeof row.practice_areas === 'string' && row.practice_areas.trim()) {
      areas = row.practice_areas.split(',').map(a => a.trim()).filter(Boolean);
    }
    if (areas.length === 0) {
      areas = ['General Legal Practice', 'Civil & Criminal'];
    }

    const experienceYears = parseInt(String(row.experience_years || '5')) || 5;
    const isVerified = String(row.is_verified || 'true').toLowerCase() === 'true';

    let email = (row.email || '').trim().toLowerCase();
    if (!email) {
      const cleanNo = enrollmentNo.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      email = `advocate.${cleanNo}@alwarbar.in`;
    }

    const existingProfile = db.advocate_profiles.find(
      p => p.bar_council_enrollment_no.toLowerCase() === enrollmentNo.toLowerCase()
    );

    let user = db.users.find(u => u.email.toLowerCase() === email);

    if (existingProfile) {
      existingProfile.bar_council_enrollment_no = enrollmentNo;
      if (row.bar_association_name) existingProfile.bar_association_name = row.bar_association_name.trim();
      if (row.chamber_address) existingProfile.chamber_address = row.chamber_address.trim();
      if (row.court_practice_complex) existingProfile.court_practice_complex = row.court_practice_complex.trim();
      existingProfile.practice_areas = areas;
      existingProfile.experience_years = experienceYears;
      if (row.bio_hindi) existingProfile.bio_hindi = row.bio_hindi.trim();
      if (row.bio_english) existingProfile.bio_english = row.bio_english.trim();
      existingProfile.is_verified = isVerified;
      existingProfile.is_publicly_listed = true;

      if (user) {
        user.full_name = fullName;
        if (row.phone) user.phone = String(row.phone).trim();
      }

      console.log(`  [UPDATE] ${fullName} (${enrollmentNo})`);
      updated++;
    } else {
      if (!user) {
        user = {
          id: 'usr-' + crypto.randomUUID(),
          email,
          password_hash: hashPassword('Advocate@2026'),
          full_name: fullName,
          role: 'registered_advocate',
          phone: row.phone ? String(row.phone).trim() : undefined,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        db.users.push(user);
      }

      const newProfile = {
        id: 'prof-' + crypto.randomUUID(),
        user_id: user.id,
        bar_council_enrollment_no: enrollmentNo,
        bar_association_name: (row.bar_association_name || 'District & Sessions Bar Association, Alwar').trim(),
        chamber_address: row.chamber_address ? row.chamber_address.trim() : 'District Court Complex, Alwar',
        court_practice_complex: (row.court_practice_complex || 'District & Sessions Court, Alwar').trim(),
        practice_areas: areas,
        experience_years: experienceYears,
        bio_hindi: row.bio_hindi ? row.bio_hindi.trim() : `${fullName} अलवर न्यायालय में नियमित वकालत कर रहे हैं।`,
        bio_english: row.bio_english ? row.bio_english.trim() : `Practicing advocate at District Courts Alwar specializing in ${areas.slice(0, 2).join(', ')}.`,
        is_verified: isVerified,
        verified_by: 'admin-user-alwar-0001',
        verified_at: isVerified ? new Date().toISOString() : undefined,
        is_publicly_listed: true
      };

      db.advocate_profiles.push(newProfile);
      console.log(`  [INSERT] ${fullName} (${enrollmentNo})`);
      added++;
    }
  }

  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf-8');

  console.log(`\n------------------------------------------------------`);
  console.log(`IMPORT COMPLETE:`);
  console.log(`  Total Processed : ${records.length}`);
  console.log(`  Newly Added     : ${added}`);
  console.log(`  Updated Existing: ${updated}`);
  if (errors.length > 0) {
    console.log(`  Errors/Skipped  : ${errors.length}`);
    errors.forEach(e => console.log(`    - ${e}`));
  }
  console.log(`Database saved successfully to data/local-db.json.`);
  console.log(`======================================================\n`);
}

runBulkImport().catch(console.error);
