const https = require('https');
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

    const tjArrayRegex = /\[([\s\S]*?)\]\s*TJ/g;
    let tjMatch;
    while ((tjMatch = tjArrayRegex.exec(decompressed)) !== null) {
      const parts = tjMatch[1].match(/\((.*?)\)/g) || [];
      const line = parts.map(p => decodePdfString(p.slice(1, -1))).join('');
      if (line.trim().length > 1) extractedLines.push(line.trim());
    }

    const singleTjRegex = /\(([\s\S]*?)\)\s*Tj/g;
    let singleMatch;
    while ((singleMatch = singleTjRegex.exec(decompressed)) !== null) {
      const line = decodePdfString(singleMatch[1]);
      if (line.trim().length > 1) extractedLines.push(line.trim());
    }
  }
  return extractedLines.join('\n');
}

https.get('https://www.sci.gov.in/sci-get-pdf/?diary_no=465272026&type=j&order_date=2026-11-20&from=latest_judgements_order', {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36',
    'Referer': 'https://www.sci.gov.in/view-pdf/?diary_no=465272026&type=j&order_date=2026-11-20&from=latest_judgements_order'
  }
}, (res) => {
  let chunks = [];
  res.on('data', d => chunks.push(d));
  res.on('end', () => {
    let buf = Buffer.concat(chunks);
    const idx = buf.indexOf('%PDF-');
    if (idx > 0) buf = buf.slice(idx);
    const text = extractPdfText(buf);
    console.log('--- Last 2000 chars of judgment ---');
    console.log(text.slice(-2000));
  });
});
