const https = require('https');
const crypto = require('crypto');
const zlib = require('zlib');

function decodePdfString(str) {
  return str
    .replace(/\\([0-7]{1,3})/g, (_, oct) => String.fromCharCode(parseInt(oct, 8)))
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\b/g, '\b')
    .replace(/\\f/g, '\f')
    .replace(/\\\(/g, '(')
    .replace(/\\\)/g, ')')
    .replace(/\\\\/g, '\\');
}

function extractPdfText(buf) {
  const binaryStr = buf.toString('binary');
  const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  let match;
  const extractedLines = [];

  while ((match = streamRegex.exec(binaryStr)) !== null) {
    const rawData = Buffer.from(match[1], 'binary');
    let decompressed = '';

    try {
      decompressed = zlib.inflateSync(rawData).toString('utf8');
    } catch {
      try {
        decompressed = zlib.inflateRawSync(rawData).toString('utf8');
      } catch {
        decompressed = rawData.toString('utf8');
      }
    }

    // A. TJ Array Operator: [ (chunk1) -100 (chunk2) ] TJ
    const tjArrayRegex = /\[([\s\S]*?)\]\s*TJ/g;
    let tjMatch;
    while ((tjMatch = tjArrayRegex.exec(decompressed)) !== null) {
      const parts = tjMatch[1].match(/\((.*?)\)/g) || [];
      const line = parts.map(p => decodePdfString(p.slice(1, -1))).join('');
      if (line.trim().length > 1) {
        extractedLines.push(line.trim());
      }
    }

    // B. Tj Single Operator: (chunk) Tj
    const singleTjRegex = /\(([\s\S]*?)\)\s*Tj/g;
    let singleMatch;
    while ((singleMatch = singleTjRegex.exec(decompressed)) !== null) {
      const line = decodePdfString(singleMatch[1]);
      if (line.trim().length > 1) {
        extractedLines.push(line.trim());
      }
    }
  }

  // Count /Page objects for pageCount
  const pageMatches = binaryStr.match(/\/Type\s*\/Page\b/g) || [];
  const pageCount = Math.max(1, pageMatches.length);
  const text = extractedLines.join('\n');
  const isScanned = text.trim().length < 50;

  return { text, pageCount, isScanned };
}

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
  console.log('Downloading SCI PDF...');
  const rawBuf = await downloadPdf('https://www.sci.gov.in/sci-get-pdf/?diary_no=465272026&type=j&order_date=2026-11-20&from=latest_judgements_order');

  let pdfBuf = rawBuf;
  const headerIdx = rawBuf.indexOf('%PDF-');
  if (headerIdx > 0) pdfBuf = rawBuf.slice(headerIdx);

  const sha = crypto.createHash('sha256').update(pdfBuf).digest('hex');
  console.log('PDF bytes:', pdfBuf.length);
  console.log('SHA-256:', sha);

  const result = extractPdfText(pdfBuf);
  console.log('Page count:', result.pageCount);
  console.log('Is scanned?', result.isScanned);
  console.log('Extracted text length:', result.text.length);
  console.log('\n--- Text Preview (first 1000 chars) ---');
  console.log(result.text.slice(0, 1000));
}

main().catch(console.error);
