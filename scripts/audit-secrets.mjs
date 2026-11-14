import fs from 'fs';
import path from 'path';

const SRC_DIR = 'C:/alwar-advocates/src';
const suspiciousPatterns = [
  { name: 'Hardcoded Supabase Service Role Key', regex: /service_role/i },
  { name: 'Hardcoded JWT Secret', regex: /jwt_secret\s*=\s*['"][a-zA-Z0-9_\-]{8,}['"]/i },
  { name: 'Hardcoded Password Literal', regex: /(?:password|passwd)\s*[:=]\s*['"][^'"]{6,}['"]/i },
  { name: 'Hardcoded OpenAI/Gemini Key', regex: /(?:sk-[a-zA-Z0-9]{20,}|AIza[0-9A-Za-z\-_]{35})/ },
  { name: 'Hardcoded Razorpay Secret', regex: /rzp_(?:live|test)_[a-zA-Z0-9]{10,}/i },
  { name: 'Hardcoded Auth Bearer', regex: /Bearer\s+[a-zA-Z0-9\._\-]{20,}/i }
];

const ignorePatterns = [
  /DEFAULT_JWT_SECRET/, // Fallback secret with warning
  /data:image/,
  /\.test\./
];

const findings = [];

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    // Skip comments
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('*')) return;

    for (const pat of suspiciousPatterns) {
      if (pat.regex.test(line)) {
        // check if ignored
        const isIgnored = ignorePatterns.some(ig => ig.test(line));
        if (!isIgnored) {
          findings.push({
            file: path.relative('C:/alwar-advocates', filePath),
            line: idx + 1,
            issue: pat.name,
            snippet: trimmed.substring(0, 100)
          });
        }
      }
    }
  });
}

function traverse(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      traverse(full);
    } else if (/\.(ts|tsx|js|jsx)$/.test(ent.name)) {
      scanFile(full);
    }
  }
}

traverse(SRC_DIR);

console.log(JSON.stringify(findings, null, 2));
