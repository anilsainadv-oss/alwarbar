const https = require('https');

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

async function probeHcraj() {
  console.log('Probing https://hcraj.nic.in/ for public PDFs...');
  const res = await fetchUrl('https://hcraj.nic.in/hcraj/');
  if (res.error) {
    console.log('Error:', res.error);
    return;
  }
  console.log('HCRAJ Status:', res.status);
  const html = res.buffer.toString('utf8');
  const pdfMatches = html.match(/https?:\/\/[^\s"'<>]+\.pdf/gi) || [];
  const relativePdfs = (html.match(/href=["']([^"']+\.pdf)["']/gi) || []).map(m => m.replace(/href=["']/i, '').replace(/["']/, ''));
  console.log('Absolute PDF URLs found:', pdfMatches.length);
  pdfMatches.slice(0, 5).forEach(u => console.log('  Absolute:', u));
  console.log('Relative PDF URLs found:', relativePdfs.length);
  relativePdfs.slice(0, 5).forEach(u => console.log('  Relative:', u));
}

probeHcraj().catch(console.error);
