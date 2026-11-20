const fs = require('fs');
const http = require('http');
const crypto = require('crypto');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');

const envContent = fs.readFileSync('C:/alwar-advocates/.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(l => {
  const m = l.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (m) {
    let v = (m[2] || '').trim();
    if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
    if (v.startsWith("'") && v.endsWith("'")) v = v.slice(1, -1);
    env[m[1]] = v;
  }
});

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    secretAccessKey: env.CLOUDFLARE_R2_SECRET_ACCESS_KEY
  }
});

async function downloadFromR2(key) {
  const cmd = new GetObjectCommand({
    Bucket: env.CLOUDFLARE_R2_BUCKET_NAME,
    Key: key
  });
  const res = await r2.send(cmd);
  const chunks = [];
  for await (const chunk of res.Body) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

function downloadFromEndpoint(urlPath) {
  return new Promise((resolve, reject) => {
    http.get({
      hostname: 'localhost',
      port: 3001,
      path: urlPath
    }, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve({
        statusCode: res.statusCode,
        headers: res.headers,
        buffer: Buffer.concat(chunks)
      }));
    }).on('error', reject);
  });
}

function sha256(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

async function verify() {
  console.log('================================================================');
  console.log('TASK 5: ORIGINAL PDF SHA-256 INTEGRITY AUDIT (R2 vs APP ENDPOINT)');
  console.log('================================================================');

  // Test 1: Supreme Court (2026 INSC 485)
  console.log('\n[1] SUPREME COURT JUDGMENT (2026 INSC 485):');
  const scR2Key = 'INSC/2026/CRL-A-1945-2026_abe47c9c.pdf';
  console.log(`  Downloading direct from R2 bucket [${scR2Key}]...`);
  const scR2Buf = await downloadFromR2(scR2Key);
  const scR2Hash = sha256(scR2Buf);
  console.log(`    R2 Size:         ${scR2Buf.length} bytes`);
  console.log(`    R2 SHA-256:      ${scR2Hash}`);

  console.log(`  Downloading from App Endpoint [/api/public/judgments/download?citation=2026%20INSC%20485&format=pdf]...`);
  const scHttp = await downloadFromEndpoint('/api/public/judgments/download?citation=2026%20INSC%20485&format=pdf');
  const scHttpHash = sha256(scHttp.buffer);
  console.log(`    HTTP Status:     ${scHttp.statusCode}`);
  console.log(`    HTTP Size:       ${scHttp.buffer.length} bytes`);
  console.log(`    HTTP SHA-256:    ${scHttpHash}`);
  const scMatch = (scR2Hash === scHttpHash && scR2Buf.length === scHttp.buffer.length);
  console.log(`    MATCH RESULT:    ${scMatch ? '✓ IDENTICAL (100% BIT-FOR-BIT MATCH)' : '❌ MISMATCH'}`);

  // Test 2: Rajasthan High Court (2026:RJ-JP:44204-DB)
  console.log('\n[2] RAJASTHAN HIGH COURT JUDGMENT (2026:RJ-JP:44204-DB):');
  const hcR2Key = 'official-judgments/HCRAJ-JP/2026/CREF-2-2026_2026_RJ_JP_44204_DB_5b6b4b96.pdf';
  console.log(`  Downloading direct from R2 bucket [${hcR2Key}]...`);
  const hcR2Buf = await downloadFromR2(hcR2Key);
  const hcR2Hash = sha256(hcR2Buf);
  console.log(`    R2 Size:         ${hcR2Buf.length} bytes`);
  console.log(`    R2 SHA-256:      ${hcR2Hash}`);

  console.log(`  Downloading from App Endpoint [/api/public/judgments/download?citation=2026:RJ-JP:44204-DB&format=pdf]...`);
  const hcHttp = await downloadFromEndpoint('/api/public/judgments/download?citation=2026:RJ-JP:44204-DB&format=pdf');
  const hcHttpHash = sha256(hcHttp.buffer);
  console.log(`    HTTP Status:     ${hcHttp.statusCode}`);
  console.log(`    HTTP Size:       ${hcHttp.buffer.length} bytes`);
  console.log(`    HTTP SHA-256:    ${hcHttpHash}`);
  const hcMatch = (hcR2Hash === hcHttpHash && hcR2Buf.length === hcHttp.buffer.length);
  console.log(`    MATCH RESULT:    ${hcMatch ? '✓ IDENTICAL (100% BIT-FOR-BIT MATCH)' : '❌ MISMATCH'}`);

  console.log('\n================================================================');
  console.log(`SUMMARY: Supreme Court match: ${scMatch} | Rajasthan High Court match: ${hcMatch}`);
  console.log('================================================================');
}

verify().catch(console.error);
