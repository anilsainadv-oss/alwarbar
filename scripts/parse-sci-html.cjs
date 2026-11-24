const https = require('https');

function parsePdfPage(url) {
  return new Promise((resolve) => {
    const u = new URL(url);
    const req = https.request({
      hostname: u.hostname,
      port: 443,
      path: u.pathname + u.search,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      timeout: 15000
    }, (res) => {
      let chunks = [];
      res.on('data', d => chunks.push(d));
      res.on('end', () => {
        const html = Buffer.concat(chunks).toString('utf-8');
        const iframes = html.match(/<iframe[^>]*>/gi) || [];
        const embeds = html.match(/<embed[^>]*>/gi) || [];
        const objects = html.match(/<object[^>]*>/gi) || [];
        const pdfMatches = html.match(/https?:\/\/[^"'\s]+\.pdf/gi) || [];
        console.log('Iframes:', iframes);
        console.log('Embeds:', embeds);
        console.log('Objects:', objects);
        console.log('PDF matches:', Array.from(new Set(pdfMatches)));
        resolve();
      });
    });
    req.on('error', (err) => { console.error('Error:', err); resolve(); });
    req.end();
  });
}

parsePdfPage('https://www.sci.gov.in/view-pdf/?diary_no=465272026&type=j&order_date=2026-11-20&from=latest_judgements_order');
