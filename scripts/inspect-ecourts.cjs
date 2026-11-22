const https = require('https');
const fs = require('fs');

https.get('https://judgments.ecourts.gov.in/KBJ/', {
  headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
  timeout: 10000
}, (res) => {
  let chunks = [];
  res.on('data', d => chunks.push(d));
  res.on('end', () => {
    const html = Buffer.concat(chunks).toString('utf-8');
    fs.writeFileSync('C:/alwar-advocates/data/ecourts_kbj.html', html);
    console.log('Saved ecourts_kbj.html, length:', html.length);
    const forms = html.match(/<form[\s\S]*?<\/form>/gi) || [];
    console.log('Forms:', forms.length);
    const scripts = html.match(/<script[\s\S]*?<\/script>/gi) || [];
    console.log('Scripts:', scripts.length);
    console.log('Snippet:', html.slice(0, 1000));
  });
});
