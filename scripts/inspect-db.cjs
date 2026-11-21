const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

if (fs.existsSync('.env.local')) {
  for (const line of fs.readFileSync('.env.local', 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const k = trimmed.substring(0, idx).trim();
      let v = trimmed.substring(idx + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      process.env[k] = v;
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase
    .from('legal_documents')
    .select('id, title, citation, case_number, parties, court_level, judgment_date, publication_status, approval_status');
  
  if (error) {
    console.error('Supabase error:', error);
    return;
  }

  console.log(`Total legal_documents in Supabase: ${data.length}`);
  const published = data.filter(d => d.publication_status === 'published' && d.approval_status === 'approved');
  console.log(`Published & Approved: ${published.length}`);
  published.forEach((d, i) => {
    console.log(`[${i+1}] ID: ${d.id} | Citation: ${d.citation} | CaseNo: ${d.case_number} | Parties: ${JSON.stringify(d.parties)} | Court: ${d.court_level} | Date: ${d.judgment_date}`);
  });
}

run();
