const https = require('https');
const http = require('http');

function fetchFollow(url, maxRedirects = 5) {
  return new Promise((resolve) => {
    if (maxRedirects <= 0) return resolve({ error: 'Too many redirects' });
    const u = new URL(url);
    const client = u.protocol === 'https:' ? https : http;
    const req = client.request({
      hostname: u.hostname,
      port: u.port || (u.protocol === 'https:' ? 443 : 80),
      path: u.pathname + u.search,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      timeout: 12000
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        let nextUrl = res.headers.location;
        if (nextUrl.startsWith('/')) {
          nextUrl = `${u.protocol}//${u.hostname}${nextUrl}`;
        }
        console.log(`Redirecting [${res.statusCode}] from ${url} -> ${nextUrl}`);
        return resolve(fetchFollow(nextUrl, maxRedirects - 1));
      }

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
  console.log('=== CHECKING SCI REDIRECTS & JUDGMENTS ===');
  const res = await fetchFollow('https://www.sci.gov.in/judgments/');
  console.log('Final URL:', res.url);
  console.log('Status:', res.status);
  console.log('Body length:', res.body ? res.body.length : 0);
  if (res.body) {
    const pdfLinks = res.body.match(/href="([^"]*\.pdf)"/gi);
    console.log('PDF links found on sci.gov.in/judgments/:', (pdfLinks || []).slice(0, 10));

    // Look for any table links or judgment links
    const links = res.body.match(/href="([^"]*judg[^"]*)"/gi);
    console.log('Judgment links:', (links || []).slice(0, 10));
  }

  // Also check main sci.gov.in page menu
  console.log('\n=== CHECKING SCI HOMEPAGE LINKS ===');
  const home = await fetchFollow('https://www.sci.gov.in/');
  if (home.body) {
    const allLinks = home.body.match(/href="https:\/\/[^"]+"/gi) || [];
    const judLinks = allLinks.filter(l => /judg|order|e-scr|case/i.test(l));
    console.log('Unique judgment-related links on homepage:', Array.from(new Set(judLinks)).slice(0, 20));
  }
}

main().catch(console.error);
