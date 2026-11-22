import { createHash, createHmac } from 'node:crypto';
function hmac(key: Buffer | string, value: string): Buffer { return createHmac('sha256', key).update(value, 'utf8').digest(); }
function sha256(value: Buffer | string): string { return createHash('sha256').update(value).digest('hex'); }
function required(name: string): string { const value = process.env[name]; if (!value) throw new Error(`Missing server environment variable: ${name}`); return value; }
function awsEncode(value: string): string { return encodeURIComponent(value).replace(/[!'()*]/g, c => `%${c.charCodeAt(0).toString(16).toUpperCase()}`); }

/** Upload immutable original PDF bytes to a private Cloudflare R2 bucket using S3 SigV4. */
export async function uploadOriginalPdfToR2(key: string, bytes: Buffer): Promise<string> {
  const accountId = required('R2_ACCOUNT_ID'), accessKey = required('R2_ACCESS_KEY_ID'), secretKey = required('R2_SECRET_ACCESS_KEY'), bucket = required('R2_BUCKET_NAME');
  const host = `${accountId}.r2.cloudflarestorage.com`, path = `/${bucket}/${key.split('/').map(encodeURIComponent).join('/')}`;
  const amzDate = new Date().toISOString().replace(/[:-]/g, '').replace(/\.\d{3}Z$/, 'Z'), date = amzDate.slice(0, 8), payloadHash = sha256(bytes);
  const canonicalHeaders = `content-type:application/pdf\nhost:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}\n`;
  const signedHeaders = 'content-type;host;x-amz-content-sha256;x-amz-date';
  const canonicalRequest = ['PUT', path, '', canonicalHeaders, signedHeaders, payloadHash].join('\n');
  const scope = `${date}/auto/s3/aws4_request`, stringToSign = ['AWS4-HMAC-SHA256', amzDate, scope, sha256(canonicalRequest)].join('\n');
  const kSigning = hmac(hmac(hmac(hmac(`AWS4${secretKey}`, date), 'auto'), 's3'), 'aws4_request');
  const signature = createHmac('sha256', kSigning).update(stringToSign).digest('hex');
  const response = await fetch(`https://${host}${path}`, { method: 'PUT', headers: { Authorization: `AWS4-HMAC-SHA256 Credential=${accessKey}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`, 'Content-Type': 'application/pdf', 'x-amz-content-sha256': payloadHash, 'x-amz-date': amzDate }, body: new Uint8Array(bytes), cache: 'no-store' });
  if (!response.ok) throw new Error(`R2 upload failed (${response.status}): ${(await response.text().catch(() => '')).slice(0, 500)}`);
  return `r2://${bucket}/${key}`;
}
export function sha256Buffer(bytes: Buffer): string { return sha256(bytes); }

/** A short-lived signed URL for a published original PDF in a private R2 bucket. */
export function createPresignedR2GetUrl(key: string, expiresSeconds = 300): string {
  const accountId = required('R2_ACCOUNT_ID'), accessKey = required('R2_ACCESS_KEY_ID'), secretKey = required('R2_SECRET_ACCESS_KEY'), bucket = required('R2_BUCKET_NAME');
  const host = `${accountId}.r2.cloudflarestorage.com`, path = `/${bucket}/${key.split('/').map(encodeURIComponent).join('/')}`;
  const amzDate = new Date().toISOString().replace(/[:-]/g, '').replace(/\.\d{3}Z$/, 'Z'), date = amzDate.slice(0, 8), scope = `${date}/auto/s3/aws4_request`;
  const params: Record<string, string> = { 'X-Amz-Algorithm': 'AWS4-HMAC-SHA256', 'X-Amz-Credential': `${accessKey}/${scope}`, 'X-Amz-Date': amzDate, 'X-Amz-Expires': String(Math.min(Math.max(expiresSeconds, 1), 900)), 'X-Amz-SignedHeaders': 'host' };
  const canonicalQuery = Object.keys(params).sort().map(k => `${awsEncode(k)}=${awsEncode(params[k])}`).join('&');
  const canonicalRequest = ['GET', path, canonicalQuery, `host:${host}\n`, 'host', 'UNSIGNED-PAYLOAD'].join('\n');
  const stringToSign = ['AWS4-HMAC-SHA256', amzDate, scope, sha256(canonicalRequest)].join('\n');
  const kSigning = hmac(hmac(hmac(hmac(`AWS4${secretKey}`, date), 'auto'), 's3'), 'aws4_request');
  params['X-Amz-Signature'] = createHmac('sha256', kSigning).update(stringToSign).digest('hex');
  const query = Object.keys(params).sort().map(k => `${awsEncode(k)}=${awsEncode(params[k])}`).join('&');
  return `https://${host}${path}?${query}`;
}
