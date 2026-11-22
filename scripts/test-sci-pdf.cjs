const https = require('https');

function testPdfView(url) {
  return new Promise((resolve) => {
    const u = new URL(url);
    const req = https.request({
      hostname: u.hostname,
      port: 443,
      path: u.pathname + u.search,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml,application/pdf;q=0.9,*/*;q=0.8'
      },
      timeout: 15000
    }, (res) => {
      console.log('Status:', res.statusCode);
      console.log('Headers:', res.headers);
      let chunks = [];
      res.on('data', d => chunks.push(d));
      res.on('end', () => {
        const buf = Buffer.concat(chunks);
        console.log('Downloaded bytes:', buf.length);
        const magic = buf.slice(0, 8).toString('ascii');
        console.log('Magic bytes (ascii):', magic);
        if (magic.startsWith('%PDF-')) {
          console.log('✅ DIRECT PDF STREAM!');
        } else {
          console.log('HTML Snippet:', buf.slice(0, 500).toString('utf-8'));
        }
        resolve(buf);
      });
    });
    req.on('error', (err) => { console.error('Error:', err); resolve(null); });
    req.end();
  });
}

testPdfView('https://www.sci.gov.in/view-pdf/?diary_no=465272026&type=j&order_date=2026-11-20&from=latest_judgements_order');
