const https = require('https');
const fs = require('fs');

function fetchPage(url, headers = {}) {
  return new Promise((resolve) => {
    const u = new URL(url);
    const req = https.request({
      hostname: u.hostname,
      port: u.port || 443,
      path: u.pathname + u.search,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        ...headers
      },
      timeout: 12000
    }, (res) => {
      let chunks = [];
      res.on('data', d => chunks.push(d));
      res.on('end', () => {
        const body = Buffer.concat(chunks).toString('utf-8');
        resolve({ url, status: res.statusCode, headers: res.headers, body });
      });
    });
    req.on('error', (err) => resolve({ url, error: err.message }));
    req.on('timeout', () => { req.destroy(); resolve({ url, error: 'TIMEOUT' }); });
    req.end();
  });
}

async function main() {
  console.log('=== PROBING OFFICIAL COURT PORTALS ===\n');

  // 1. Rajasthan High Court Jaipur CIS
  console.log('1. Checking Rajasthan High Court Jaipur...');
  const hcRes = await fetchPage('https://hcraj.nic.in/cishcraj-jp/');
  if (hcRes.error) {
    console.log('HCRAJ Error:', hcRes.error);
  } else {
    console.log('HCRAJ Status:', hcRes.status);
    console.log('HCRAJ Body length:', hcRes.body.length);
    const captchas = hcRes.body.match(/captcha/gi);
    console.log('Captcha occurrences:', captchas ? captchas.length : 0);

    // Look for judgment filters or endpoints
    const filterMatches = hcRes.body.match(/href="([^"]*(?:judgement|filter|order)[^"]*)"/gi);
    console.log('Filter/Judgment links found:', filterMatches);
  }

  // 2. Check JudgmentFilters/judgement_date on HCRAJ
  console.log('\n2. Checking HCRAJ JudgmentFilters...');
  const jFilter = await fetchPage('https://hcraj.nic.in/cishcraj-jp/JudgementFilters/judgement_date');
  console.log('JudgmentFilters status:', jFilter.status, jFilter.error || '');
  if (jFilter.body) {
    const hasCaptcha = /captcha/i.test(jFilter.body);
    console.log('Has Captcha?', hasCaptcha);
    const captchaImgs = jFilter.body.match(/<img[^>]*captcha[^>]*>/gi);
    console.log('Captcha img tags:', captchaImgs);
  }

  // 3. Supreme Court of India
  console.log('\n3. Checking Supreme Court of India judgments page...');
  const scRes = await fetchPage('https://www.sci.gov.in/judgments/');
  console.log('SCI /judgments/ status:', scRes.status, scRes.error || '');
  if (scRes.body) {
    const pdfLinks = scRes.body.match(/href="([^"]*\.pdf)"/gi);
    console.log('PDF links found on sci.gov.in/judgments/:', (pdfLinks || []).slice(0, 10));
  }

  // 4. Supreme Court Daily Orders / Latest Judgments
  console.log('\n4. Checking Supreme Court latest updates / daily orders...');
  const scLatest = await fetchPage('https://www.sci.gov.in/daily-order/');
  console.log('SCI /daily-order/ status:', scLatest.status, scLatest.error || '');
  if (scLatest.body) {
    const pdfLinks2 = scLatest.body.match(/href="([^"]*\.pdf)"/gi);
    console.log('PDF links found on sci.gov.in/daily-order/:', (pdfLinks2 || []).slice(0, 10));
  }
}

main().catch(console.error);
