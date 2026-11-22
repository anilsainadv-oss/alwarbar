const https = require('https');

https.get('https://judgments.ecourts.gov.in/', {
  headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
  timeout: 10000
}, (res) => {
  console.log('Status:', res.statusCode);
  console.log('Location:', res.headers.location);
  let chunks = [];
  res.on('data', d => chunks.push(d));
  res.on('end', () => {
    const html = Buffer.concat(chunks).toString('utf-8');
    console.log('Length:', html.length);
    console.log('Snippet:', html.slice(0, 500));
  });
}).on('error', err => console.log('Error:', err.message));
