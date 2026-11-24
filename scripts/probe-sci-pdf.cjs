const https = require('https');

function fetchUrl(url) {
  return new Promise((resolve) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AlwarBarAudit/4.1' } }, (res) => {
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

async function probe() {
  console.log('Probing https://www.sci.gov.in for public judgment/order PDFs...');
  const res = await fetchUrl('https://www.sci.gov.in');
  if (res.error) {
    console.log('Error:', res.error);
    return;
  }
  console.log('SCI Status:', res.status);
  const html = res.buffer.toString('utf8');
  const pdfMatches = html.match(/https?:\/\/[^\s"'<>]+\.pdf/gi) || [];
  const relativePdfs = (html.match(/href=["'](\/[^"']+\.pdf)["']/gi) || []).map(m => m.replace(/href=["']/i, '').replace(/["']/, ''));
  console.log('Absolute PDF URLs found:', pdfMatches.length);
  pdfMatches.slice(0, 5).forEach(u => console.log('  Absolute:', u));
  console.log('Relative PDF URLs found:', relativePdfs.length);
  relativePdfs.slice(0, 5).forEach(u => console.log('  Relative:', u));
}

probe().catch(console.error);
