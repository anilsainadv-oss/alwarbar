const fs = require('fs');
const path = require('path');

function loadLocalEnv() {
  const envPath = path.resolve(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    for (const rawLine of content.split('\n')) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;
      const eqIdx = line.indexOf('=');
      if (eqIdx <= 0) continue;
      const key = line.slice(0, eqIdx).trim();
      let val = line.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
  return {
    SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    R2_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID,
    R2_ACCESS_KEY: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    R2_SECRET_KEY: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
    R2_BUCKET: process.env.CLOUDFLARE_R2_BUCKET_NAME || 'alwar-advocates-judgements'
  };
}

module.exports = { loadLocalEnv };
