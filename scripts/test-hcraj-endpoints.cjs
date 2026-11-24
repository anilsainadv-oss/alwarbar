const https = require('https');

async function testEndpoint(path) {
  return new Promise((resolve) => {
    https.get(`https://hcraj.nic.in${path}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36'
      },
      timeout: 10000
    }, (res) => {
      let chunks = [];
      res.on('data', d => chunks.push(d));
      res.on('end', () => {
        const body = Buffer.concat(chunks).toString('utf-8');
        resolve({
          path,
          status: res.statusCode,
          length: body.length,
          hasCaptcha: /captcha/i.test(body),
          location: res.headers.location
        });
      });
    }).on('error', err => resolve({ path, error: err.message }));
  });
}

async function main() {
  console.log('Testing Rajasthan High Court endpoints...');
  const paths = [
    '/cishcraj-jp/JudgementFilters/judgement_date',
    '/cishcraj-jp/JudgementFilters/order_date',
    '/cishcraj-jp/JudgementFilters/free_text',
    '/cishcraj-jp/JudgementFilters/case_no',
    '/cishcraj-jp/JudgementFilters/party_name',
    '/cishcraj-jod/JudgementFilters/judgement_date',
    '/hcraj/judgments',
    '/hcraj/orders',
    '/hcraj/case-status',
    '/cishcraj-jp/captcha/image',
    '/cishcraj-jp/JudgementFilters/view?id=4812',
    '/cishcraj-jp/JudgementFilters/view?id=44204'
  ];

  for (const p of paths) {
    const res = await testEndpoint(p);
    console.log(res);
  }
}

main().catch(console.error);
