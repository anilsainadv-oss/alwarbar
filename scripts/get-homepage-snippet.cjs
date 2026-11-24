const https = require('https');

function getHomepageSnippet() {
  return new Promise((resolve) => {
    https.get('https://www.sci.gov.in/', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    }, (res) => {
      let chunks = [];
      res.on('data', d => chunks.push(d));
      res.on('end', () => {
        const html = Buffer.concat(chunks).toString('utf-8');
        // Find where view-pdf is used
        let idx = 0;
        while ((idx = html.indexOf('view-pdf', idx)) !== -1) {
          console.log('--- Context around view-pdf ---');
          console.log(html.slice(Math.max(0, idx - 150), Math.min(html.length, idx + 250)));
          idx += 8;
        }
        resolve();
      });
    });
  });
}

getHomepageSnippet();
