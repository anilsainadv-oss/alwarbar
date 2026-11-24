const https = require('https');
const crypto = require('crypto');

function fetchUrl(url) {
  return new Promise((resolve) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AlwarBarAudit/4.1' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        let loc = res.headers.location;
        if (!loc.startsWith('http')) {
          loc = new URL(loc, url).href;
        }
        return resolve(fetchUrl(loc));
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

async function testDownloadHcraj() {
  const url = 'https://hcraj.nic.in/hcraj/Allfiles/handbook_2026.pdf';
  console.log(`Downloading Rajasthan High Court PDF from: ${url}`);
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

testDownloadHcraj().catch(console.error);
