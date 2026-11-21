const crypto = require('crypto');
const fs = require('fs');

if (fs.existsSync('.env.local')) {
  const content = fs.readFileSync('.env.local', 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const k = trimmed.substring(0, idx).trim();
      let v = trimmed.substring(idx + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      process.env[k] = v;
    }
  }
}

const AUTH_SECRET = process.env.AUTH_SECRET || 'alwar-advocates-secure-dev-secret-1234567890abcdef';
const COOKIE_NAME = process.env.SESSION_COOKIE_NAME || 'alwar_law_session';

function signSession(user) {
  const payload = Buffer.from(JSON.stringify(user)).toString('base64');
  const signature = crypto.createHmac('sha256', AUTH_SECRET).update(payload).digest('hex');
  return `${payload}.${signature}`;
}

const token = signSession({
  id: 'usr-adv-test-001',
  email: 'advocate.test@alwarbar.in',
  full_name: 'Test Advocate',
  role: 'registered_advocate'
});

async function run() {
  const q = process.argv[2] || '2026 INSC 485';
  console.log(`Testing Query: "${q}"`);
  const t0 = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const res = await fetch(`http://localhost:3001/api/my-case/research/search?q=${encodeURIComponent(q)}`, {
      headers: {
        'Cookie': `${COOKIE_NAME}=${token}`
      },
      signal: controller.signal
    });
    clearTimeout(timeout);
    console.log(`HTTP Status: ${res.status} (${Date.now() - t0}ms)`);
    const json = await res.json();
    if (res.status === 200) {
      console.log(`Total Results: ${json.total_results}, Intent: ${json.intent}`);
      if (json.results && json.results.length > 0) {
        json.results.slice(0, 10).forEach((r, idx) => {
          console.log(`  [${idx + 1}] Citation: ${r.citation} | Score: ${r.hybrid_score} | DocID: ${r.document_id} | Page: ${r.page_number} | Para: ${r.paragraph_number}`);
        });
        const uniqueDocs = new Set(json.results.map(r => r.document_id));
        console.log(`  Unique documents in results: ${uniqueDocs.size} / ${json.results.length}`);
      }
    } else {
      console.log('Error payload:', json);
    }
  } catch (err) {
    console.error(`Request failed after ${Date.now() - t0}ms:`, err.message);
  }
}

run();
