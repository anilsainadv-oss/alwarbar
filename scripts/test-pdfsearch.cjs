const https = require('https');

https.get('https://judgments.ecourts.gov.in/pdfsearch/index.php', {
  headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
  timeout: 10000
}, (res) => {
  console.log('Status:', res.statusCode);
  let chunks = [];
  res.on('data', d => chunks.push(d));
  res.on('end', () => {
    const html = Buffer.concat(chunks).toString('utf-8');
    console.log('Length:', html.length);
    const hasCaptcha = /captcha/i.test(html);
    console.log('Has Captcha?', hasCaptcha);
    const captchas = html.match(/[^\n]*captcha[^\n]*/gi) || [];
    console.log('Captcha occurrences:', captchas.slice(0, 5));
  });
}).on('error', err => console.log('Error:', err.message));
