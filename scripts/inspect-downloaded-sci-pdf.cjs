const https = require('https');
const crypto = require('crypto');
const pdfParse = require('pdf-parse');

function downloadPdf(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.sci.gov.in/view-pdf/?diary_no=465272026&type=j&order_date=2026-11-20&from=latest_judgements_order'
      }
    }, (res) => {
      let chunks = [];
      res.on('data', d => chunks.push(d));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    });
  });
}

async function main() {
  console.log('Downloading official Supreme Court PDF...');
  const rawBuf = await downloadPdf('https://www.sci.gov.in/sci-get-pdf/?diary_no=465272026&type=j&order_date=2026-11-20&from=latest_judgements_order');

  // Check if buffer has leading whitespace/newlines before %PDF-
  let pdfBuf = rawBuf;
  const pdfHeaderIndex = rawBuf.indexOf('%PDF-');
  console.log('PDF header index:', pdfHeaderIndex);
  if (pdfHeaderIndex > 0) {
    console.log(`Trimming ${pdfHeaderIndex} leading bytes before %PDF-`);
    pdfBuf = rawBuf.slice(pdfHeaderIndex);
  }

  const sha = crypto.createHash('sha256').update(pdfBuf).digest('hex');
  console.log('Total bytes:', pdfBuf.length);
  console.log('SHA-256:', sha);
  console.log('Magic bytes:', pdfBuf.slice(0, 8).toString('ascii'));

  // Parse PDF
  const parsed = await pdfParse(pdfBuf);
  console.log('Page count:', parsed.numpages);
  console.log('Extracted text length:', parsed.text.length);
  console.log('Text preview (first 500 chars):');
  console.log(parsed.text.slice(0, 500));
}

main().catch(console.error);
