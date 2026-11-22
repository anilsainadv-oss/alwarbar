const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const crypto = require('crypto');
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

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY
  }
});

const BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET_NAME || 'alwar-advocates-judgements';

async function streamToBuffer(stream) {
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks);
}

function getPdfPageCount(buffer) {
  const content = buffer.toString('binary');
  // First attempt: search /Type /Pages ... /Count X
  const countMatches = content.match(/\/Type\s*\/Pages[^>]*\/Count\s+(\d+)/);
  if (countMatches && countMatches[1]) {
    return parseInt(countMatches[1], 10);
  }
  // Fallback: count /Type /Page (excluding /Pages)
  const pageMatches = content.match(/\/Type\s*\/Page\b/g);
  if (pageMatches) {
    return pageMatches.length;
  }
  return 1;
}

async function inspectR2Pdfs() {
  const keys = [
    'official-judgments/HCRAJ-JP/2026/CREF-2-2026_2026_RJ_JP_44204_DB_5b6b4b96.pdf',
    'INSC/2026/CRL-A-1945-2026_abe47c9c.pdf'
  ];

  for (const key of keys) {
    console.log(`\n================== KEY: ${key} ==================`);
    const cmd = new GetObjectCommand({ Bucket: BUCKET_NAME, Key: key });
    const res = await r2.send(cmd);
    const buf = await streamToBuffer(res.Body);
    const sha = crypto.createHash('sha256').update(buf).digest('hex');
    const pages = getPdfPageCount(buf);
    console.log(`  Size: ${buf.length} bytes`);
    console.log(`  SHA-256: ${sha}`);
    console.log(`  Header: ${buf.subarray(0, 10).toString('ascii')}`);
    console.log(`  Page Count: ${pages}`);
  }
}

inspectR2Pdfs().catch(console.error);
