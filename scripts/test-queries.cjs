const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');
const { loadLocalEnv } = require('./load-env.cjs');

const env = loadLocalEnv();
const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_KEY);

const EMBEDDING_DIM = 1536;

function generateDeterministicEmbedding(text, dimensions = EMBEDDING_DIM) {
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
  for (let i = 0; i < dimensions; i++) sumSq += vector[i] * vector[i];
  const norm = Math.sqrt(sumSq) || 1.0;
  const normalized = new Array(dimensions);
  for (let i = 0; i < dimensions; i++) normalized[i] = Number((vector[i] / norm).toFixed(6));
  return normalized;
}

async function testQuery(q) {
  const qVec = generateDeterministicEmbedding(q, EMBEDDING_DIM);
  const { data: chunks } = await supabase.from('legal_document_chunks').select('chunk_index, content, embedding');
  let best = -1;
  let bestChunk = null;
  for (const c of chunks) {
    const vec = typeof c.embedding === 'string' ? JSON.parse(c.embedding) : c.embedding;
    let dot = 0;
    for (let i = 0; i < EMBEDDING_DIM; i++) dot += (vec[i] || 0) * (qVec[i] || 0);
    if (dot > best) { best = dot; bestChunk = c; }
  }
  console.log('\nQuery: "' + q + '"');
  console.log('Similarity: ' + best.toFixed(4));
  console.log('Best Chunk #: ' + (bestChunk ? bestChunk.chunk_index : 'none'));
  console.log('Snippet: "' + (bestChunk ? bestChunk.content.slice(0, 150) : '') + '..."');
}

async function main() {
  await testQuery('State of Tamil Nadu vs State of Karnataka Cauvery Water Disputes');
  await testQuery('release of waters from reservoirs at Kabini and KRS CWMA');
  await testQuery('Dravida Munnetra Kazhagam Civil Appeal No. 2453 of 2007');
}
main().catch(console.error);
