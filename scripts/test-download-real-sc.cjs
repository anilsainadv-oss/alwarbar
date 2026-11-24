const https = require('https');
const crypto = require('crypto');

function fetchUrl(url) {
  return new Promise((resolve) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AlwarBarAudit/4.1' } }, (res) => {
      // Handle redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(fetchUrl(res.headers.location));
      }
      let data = [];
      res.on('data', c => data.push(c));
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          buffer: Buffer.concat(data)
        });
      });
    }).on('error', err => resolve({ error: err.message }));
  });
}

async function testDownload() {
  const url = 'https://cdnbbsr.s3waas.gov.in/s3ec0490f1f4972d133619a60c30f3559e/uploads/2026/11/2026112098.pdf';
  console.log(`Downloading real Supreme Court PDF from: ${url}`);
  const res = await fetchUrl(url);
  if (res.error) {
    console.error('Download error:', res.error);
    return;
  }
  console.log('HTTP Status:', res.status);
  console.log('Buffer size:', res.buffer.length, 'bytes');
  const magic = res.buffer.slice(0, 5).toString('ascii');
  console.log('Magic bytes:', magic);
  const hash = crypto.createHash('sha256').update(res.buffer).digest('hex');
  console.log('SHA-256:', hash);
}

testDownload().catch(console.error);
