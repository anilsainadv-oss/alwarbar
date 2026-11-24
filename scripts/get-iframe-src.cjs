const https = require('https');

function getIframeSrc(url) {
  https.get(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
  }, (res) => {
    let chunks = [];
    res.on('data', d => chunks.push(d));
    res.on('end', () => {
      const html = Buffer.concat(chunks).toString('utf-8');
      const idx = html.indexOf('<iframe');
      if (idx !== -1) {
        console.log('Iframe tag:', html.slice(idx, idx + 400));
      } else {
        console.log('No iframe found');
      }
    });
  });
}

getIframeSrc('https://www.sci.gov.in/view-pdf/?diary_no=465272026&type=j&order_date=2026-11-20&from=latest_judgements_order');
