const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');
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

async function listR2() {
  console.log('Listing objects in R2 bucket:', BUCKET_NAME);
  try {
    const cmd = new ListObjectsV2Command({ Bucket: BUCKET_NAME });
    const res = await r2.send(cmd);
    console.log('Total Objects Found in R2:', res.KeyCount || 0);
    if (res.Contents && res.Contents.length > 0) {
      res.Contents.forEach((item, idx) => {
        console.log(`[${idx + 1}] Key: ${item.Key} | Size: ${item.Size} bytes | LastModified: ${item.LastModified}`);
      });
    } else {
      console.log('No objects found in bucket.');
    }
  } catch (err) {
    console.error('Failed to list R2:', err);
  }
}

listR2();
