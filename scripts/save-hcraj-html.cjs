const https = require('https');
const fs = require('fs');

https.get('https://hcraj.nic.in/cishcraj-jp/', {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36'
  }
}, (res) => {
  let chunks = [];
  res.on('data', d => chunks.push(d));
  res.on('end', () => {
    const html = Buffer.concat(chunks).toString('utf-8');
    fs.writeFileSync('C:/alwar-advocates/data/hcraj_home.html', html);
    console.log('Saved hcraj_home.html, size:', html.length);

    // Extract all form actions and input names
    const forms = html.match(/<form[\s\S]*?<\/form>/gi) || [];
    console.log('Forms found:', forms.length);
    for (const f of forms) {
      const action = f.match(/action="([^"]*)"/i);
      const inputs = f.match(/name="([^"]*)"/gi);
      console.log('Form action:', action ? action[1] : 'none');
      console.log('Inputs:', inputs);
    }
  });
});
