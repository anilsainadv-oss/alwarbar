import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import vm from 'vm';

const DB_PATH = path.join(process.cwd(), 'data', 'local-db.json');
const EMBEDDING_DIMENSION = 1536;

function generateDeterministicEmbedding(text, dimensions = EMBEDDING_DIMENSION) {
  const clean = (text || '').toLowerCase().trim();
  const vector = new Float64Array(dimensions);
  if (!clean) {
    vector[0] = 1.0;
    return Array.from(vector);
  }

  const tokens = clean.split(/[\s,.;:()\[\]{}"'\-]+/).filter(t => t.length > 1);
  const ngrams = [];
  for (let i = 0; i < clean.length - 3; i++) {
    ngrams.push(clean.substring(i, i + 3));
  }

  const allTokens = [...tokens, ...ngrams];
  for (const tok of allTokens) {
    const hash = crypto.createHash('sha256').update(tok).digest();
    for (let i = 0; i < 8; i++) {
      const idx = hash.readUInt16LE(i * 2) % dimensions;
      const weight = (hash.readInt8(16 + i) / 128.0);
      vector[idx] += weight;
    }
  }

  let sumSq = 0;
  for (let i = 0; i < dimensions; i++) {
    sumSq += vector[i] * vector[i];
  }
  const norm = Math.sqrt(sumSq) || 1.0;
  const normalized = new Array(dimensions);
  for (let i = 0; i < dimensions; i++) {
    normalized[i] = Number((vector[i] / norm).toFixed(6));
  }
  return normalized;
}

function chunkText(text, maxWords = 450, overlapWords = 80) {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) {
    return [text];
  }

  const chunks = [];
  let start = 0;
  while (start < words.length) {
    const end = Math.min(start + maxWords, words.length);
    const chunkWords = words.slice(start, end);
    chunks.push(chunkWords.join(' '));
    if (end >= words.length) break;
    start += (maxWords - overlapWords);
  }
  return chunks;
}

// Read DAILY_COURT_FEEDS from src/app/api/cron/court-ingestion/route.ts
function loadDailyCourtFeeds() {
  const routePath = path.join(process.cwd(), 'src', 'app', 'api', 'cron', 'court-ingestion', 'route.ts');
  const code = fs.readFileSync(routePath, 'utf8');
  const feedMatch = code.match(/export const DAILY_COURT_FEEDS: CourtFeedCandidate\[\] = (\[[\s\S]*?\]);\n\nexport async function POST/);
  if (!feedMatch) {
    throw new Error('Could not extract DAILY_COURT_FEEDS from route.ts');
  }
  const sandbox = {};
  vm.createContext(sandbox);
  vm.runInContext(`var feeds = ${feedMatch[1]}`, sandbox);
  return sandbox.feeds;
}

const OLD_INCOMPLETE_IDS = new Set([
  'doc-satender-antil-2022',
  'doc-arnesh-kumar-2014',
  'doc-dalpat-kumar-1992',
  'doc-bk-meena-1996',
  'doc-arjun-khotkar-2020',
  'doc-bhanwar-lal-2024',
  'doc-gurbaksh-sibbia-1980',
  'doc-lalita-kumari-2014'
]);

async function runCleanupAndUpgrade() {
  console.log('===============================================================');
  console.log('PURGING OLD INCOMPLETE JUDGMENTS & UPGRADING TO 100% FULL TEXT');
  console.log('===============================================================');

  const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  const dailyFeeds = loadDailyCourtFeeds();

  // 1. Purge old incomplete judgments
  const initialDocCount = db.legal_documents.length;
  const initialChunkCount = db.legal_document_chunks.length;

  db.legal_documents = db.legal_documents.filter(d => !OLD_INCOMPLETE_IDS.has(d.id));
  db.legal_document_chunks = db.legal_document_chunks.filter(c => !OLD_INCOMPLETE_IDS.has(c.document_id));
  if (db.legal_document_sources) {
    db.legal_document_sources = db.legal_document_sources.filter(s => !OLD_INCOMPLETE_IDS.has(s.document_id));
  }
  if (db.legal_document_processing) {
    db.legal_document_processing = db.legal_document_processing.filter(p => !OLD_INCOMPLETE_IDS.has(p.document_id));
  }

  console.log(`✓ Deleted ${initialDocCount - db.legal_documents.length} old incomplete judgments.`);
  console.log(`✓ Deleted ${initialChunkCount - db.legal_document_chunks.length} obsolete chunks.`);

  // 2. Upgrade the 5 newly added judgments to complete full texts with multiple chunks
  for (const candidate of dailyFeeds) {
    const existingDoc = db.legal_documents.find(
      d => d.citation.toLowerCase().trim() === candidate.citation.toLowerCase().trim()
    );

    if (existingDoc) {
      console.log(`\nUpgrading ${existingDoc.citation} to full judicial transcript...`);
      existingDoc.full_text = candidate.full_text;
      existingDoc.summary = candidate.full_text.slice(0, 350) + '...';
      existingDoc.content_hash = crypto.createHash('sha256').update(candidate.full_text).digest('hex');
      existingDoc.statutes = candidate.statutes;
      existingDoc.legal_subjects = candidate.legal_subjects;
      existingDoc.parties = candidate.parties;
      existingDoc.judge_names = candidate.judge_names;

      // Remove existing chunks for this doc
      db.legal_document_chunks = db.legal_document_chunks.filter(c => c.document_id !== existingDoc.id);

      // Create new multi-chunk vectors
      const chunkStrings = chunkText(candidate.full_text);
      chunkStrings.forEach((chunkStr, idx) => {
        const chunkId = `chk-full-${existingDoc.id.replace('doc-', '')}-${idx}`;
        const emb = generateDeterministicEmbedding(chunkStr);
        const tokenCount = Math.round(chunkStr.split(/\s+/).length * 1.3);

        db.legal_document_chunks.push({
          id: chunkId,
          document_id: existingDoc.id,
          chunk_index: idx,
          content: chunkStr,
          page_number: Math.floor(idx / 2) + 1,
          paragraph_number: String(idx + 1),
          token_count: tokenCount,
          embedding: emb,
          created_at: new Date().toISOString()
        });
      });

      const words = candidate.full_text.split(/\s+/).length;
      console.log(`  -> Full Words: ${words} | Characters: ${candidate.full_text.length} | Chunks Created: ${chunkStrings.length}`);
    }
  }

  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');

  console.log('\n===============================================================');
  console.log(`UPGRADE COMPLETED!`);
  console.log(`Total Judgments in Database: ${db.legal_documents.length}`);
  console.log(`Total Vector Chunks in Database: ${db.legal_document_chunks.length}`);
  console.log(`Pending Review Judgments: ${db.legal_documents.filter(d => d.verification_status === 'pending').length}`);
  console.log(`Verified Judgments: ${db.legal_documents.filter(d => d.verification_status === 'verified').length}`);
  console.log('===============================================================');
}

runCleanupAndUpgrade().catch(console.error);
