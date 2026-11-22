const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
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

async function main() {
  const docId = 'doc-insc-2026-1257-b5196aff';

  // 1. Insert audit log
  const { data: existingAudit } = await supabase
    .from('judgment_audit_logs')
    .select('id')
    .eq('document_id', docId);

  if (!existingAudit || existingAudit.length === 0) {
    const auditRecord = {
      id: `aud-${crypto.randomUUID()}`,
      document_id: docId,
      actor_id: 'system',
      actor_name: 'Automated Judicial Crawler',
      actor_role: 'system',
      action: 'INGEST_LEGAL_DOCUMENT',
      entity_type: 'legal_document',
      entity_id: docId,
      details: {
        title: 'State of Tamil Nadu v. State of Karnataka & Ors.',
        citation: '2026 INSC 1257',
        court: 'Supreme Court of India',
        totalChars: 15009,
        chunksIndexed: 7,
        r2_key: 'official-judgments/INSC/2026/MA-2445-2026_2026_INSC_1257_b5196aff.pdf',
        sha256: 'b5196aff61c240bb5ae0b398bc9751d750ac00f1f3add2a9fce2617c5781d6f3',
        source: 'sci.gov.in (Official Portal)'
      },
      created_at: new Date().toISOString()
    };

    const { error: insErr } = await supabase.from('judgment_audit_logs').insert([auditRecord]);
    console.log('Audit log insert error:', insErr);
  }

  const { count: auditCount } = await supabase.from('judgment_audit_logs').select('*', { count: 'exact', head: true });
  console.log('Total audit logs in Supabase:', auditCount);

  // 2. Test semantic search
  const query = 'Cauvery water dispute Tamil Nadu Karnataka release reservoirs CWMA';
  const queryEmbedding = generateDeterministicEmbedding(query, EMBEDDING_DIM);

  const { data: chunks } = await supabase
    .from('legal_document_chunks')
    .select('chunk_index, content, embedding')
    .eq('document_id', docId);

  let bestSim = -1;
  let bestSnippet = '';
  let bestIdx = -1;

  for (const c of chunks) {
    const vec = typeof c.embedding === 'string' ? JSON.parse(c.embedding) : c.embedding;
    let dot = 0;
    for (let i = 0; i < EMBEDDING_DIM; i++) {
      dot += (vec[i] || 0) * (queryEmbedding[i] || 0);
    }
    if (dot > bestSim) {
      bestSim = dot;
      bestSnippet = c.content;
      bestIdx = c.chunk_index;
    }
  }

  console.log('--- SEMANTIC SEARCH TEST ---');
  console.log('Query:', query);
  console.log('Best chunk index:', bestIdx);
  console.log('Best similarity:', bestSim.toFixed(4));
  console.log('Snippet:', bestSnippet.substring(0, 200) + '...');
  console.log('AI retrieval confidence:', bestSim > 0.4 ? '✅ HIGH CONFIDENCE' : '⚠️ LOW');
}

main().catch(console.error);
