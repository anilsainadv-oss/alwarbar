const https = require('https');

function testSciGetPdf(url) {
  const u = new URL(url);
  const req = https.request({
    hostname: u.hostname,
    port: 443,
    path: u.pathname + u.search,
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Referer': 'https://www.sci.gov.in/view-pdf/?diary_no=465272026&type=j&order_date=2026-11-20&from=latest_judgements_order',
      'Accept': 'application/pdf,*/*'
    },
    timeout: 15000
  }, (res) => {
    console.log('Status:', res.statusCode);
    console.log('Headers:', res.headers);
    let chunks = [];
    res.on('data', d => chunks.push(d));
    res.on('end', () => {
      const buf = Buffer.concat(chunks);
      console.log('Total bytes:', buf.length);
      console.log('Magic bytes:', buf.slice(0, 10).toString('ascii'));
      if (buf.slice(0, 5).toString('ascii') === '%PDF-') {
        console.log('🎉 SUCCESS: AUTHENTIC SUPREME COURT PDF DOWNLOADED DIRECTLY FROM SCI.GOV.IN!');
      } else {
        console.log('Snippet:', buf.slice(0, 300).toString('utf-8'));
      }
    });
  });
  req.on('error', err => console.error(err));
  req.end();
}

testSciGetPdf('https://www.sci.gov.in/sci-get-pdf/?diary_no=465272026&type=j&order_date=2026-11-20&from=latest_judgements_order');
