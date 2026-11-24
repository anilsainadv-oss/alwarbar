const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
const fs = require('fs');

if (fs.existsSync('.env.local')) {
  for (const line of fs.readFileSync('.env.local', 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const k = trimmed.substring(0, idx).trim();
      let v = trimmed.substring(idx + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      process.env[k] = v;
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

function generateDeterministicEmbedding(text, dimensions = 1536) {
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

async function hybridSearch(query, filters = {}, limit = 15) {
  const cleanQuery = (query || '').trim();
  const lowerQuery = cleanQuery.toLowerCase();
  const queryTokens = lowerQuery.split(/[\s,.;:()\[\]{}"'\-]+/).filter(t => t.length > 2);
  const queryEmbedding = generateDeterministicEmbedding(cleanQuery);

  // 1. Fetch published & approved documents from Supabase
  let docQuery = supabase
    .from('legal_documents')
    .select('id, title, citation, case_number, parties, court_name, court_level, bench, judgment_date, legal_subject, statutes, summary, full_text')
    .eq('approval_status', 'approved')
    .eq('publication_status', 'published');

  if (filters.court_level && filters.court_level !== 'ALL') {
    docQuery = docQuery.eq('court_level', filters.court_level);
  }
  if (filters.court_name) {
    docQuery = docQuery.ilike('court_name', `%${filters.court_name}%`);
  }
  if (filters.year) {
    docQuery = docQuery.gte('judgment_date', `${filters.year}-01-01`).lte('judgment_date', `${filters.year}-12-31`);
  }

  const { data: docs, error: docError } = await docQuery;
  if (docError || !docs || docs.length === 0) {
    console.error('Document query error:', docError);
    return [];
  }

  // 2. Fetch candidate chunks from Supabase RPC
  let chunks = [];
  try {
    const { data: rpcChunks, error: rpcError } = await supabase.rpc('search_legal_chunks', {
      query_embedding: queryEmbedding,
      query_text: cleanQuery,
      match_count: 50,
      court_filter: filters.court_name || null,
      bench_filter: null,
      year_filter: filters.year ? parseInt(filters.year, 10) : null
    });
    if (!rpcError && Array.isArray(rpcChunks)) {
      chunks = rpcChunks;
    }
  } catch (err) {
    console.warn('RPC chunk error:', err.message);
  }

  // 3. Document-Level Chunk Deduplication: map each document to its BEST matching chunk
  const bestChunkPerDoc = new Map();
  for (const c of chunks) {
    const existing = bestChunkPerDoc.get(c.document_id);
    if (!existing || c.relevance_score > existing.relevance_score) {
      bestChunkPerDoc.set(c.document_id, c);
    }
  }

  // 4. Score each document combining semantic score + keyword & citation boosts
  const scoredResults = [];
  for (const doc of docs) {
    if (filters.legal_subject && doc.legal_subject && !doc.legal_subject.toLowerCase().includes(filters.legal_subject.toLowerCase())) {
      continue;
    }

    const chunk = bestChunkPerDoc.get(doc.id);
    const semScore = chunk ? Math.max(0, chunk.relevance_score) : 0;

    let kwScore = 0;
    const docCitation = (doc.citation || '').toLowerCase();
    const docCaseNo = (doc.case_number || '').toLowerCase();
    const docTitle = (doc.title || '').toLowerCase();
    const partiesStr = Array.isArray(doc.parties) ? doc.parties.join(' ').toLowerCase() : '';
    const statutesStr = Array.isArray(doc.statutes) ? doc.statutes.join(' ').toLowerCase() : (doc.statutes || '').toLowerCase();
    const subjectStr = (doc.legal_subject || '').toLowerCase();

    // Exact or substring citation match
    if (docCitation && (docCitation.includes(lowerQuery) || lowerQuery.includes(docCitation))) {
      kwScore += 0.85;
    }

    // Exact or partial case number match
    if (docCaseNo && (docCaseNo.includes(lowerQuery) || lowerQuery.includes(docCaseNo))) {
      kwScore += 0.75;
    }

    // Party names matching
    if (partiesStr && (partiesStr.includes(lowerQuery) || lowerQuery.includes(partiesStr))) {
      kwScore += 0.60;
    }

    // Token-based matching across all metadata
    const fullMeta = `${docTitle} ${docCitation} ${docCaseNo} ${partiesStr} ${statutesStr} ${subjectStr} ${doc.court_name}`;
    let matchedTokenCount = 0;
    for (const token of queryTokens) {
      if (fullMeta.includes(token)) {
        matchedTokenCount++;
      }
    }
    if (queryTokens.length > 0) {
      kwScore += (matchedTokenCount / queryTokens.length) * 0.40;
    }

    const hybridScore = Number((semScore * 0.50 + Math.min(kwScore, 1.0) * 0.50).toFixed(4));
    
    // Include if either semantic or keyword matched
    if (hybridScore > 0.05 || kwScore > 0.2) {
      const snippet = chunk?.content 
        ? chunk.content.slice(0, 450)
        : (doc.summary || doc.full_text.slice(0, 450));

      scoredResults.push({
        document_id: doc.id,
        chunk_id: chunk?.chunk_id,
        title: doc.title,
        citation: doc.citation,
        court_name: doc.court_name,
        court_level: doc.court_level,
        judgment_date: doc.judgment_date,
        page_number: chunk?.page_number || 1,
        paragraph_number: chunk?.paragraph_number || '1',
        snippet,
        semantic_score: Number(semScore.toFixed(4)),
        keyword_score: Number(Math.min(kwScore, 1.0).toFixed(4)),
        hybrid_score: hybridScore
      });
    }
  }

  // Sort descending by hybrid_score
  scoredResults.sort((a, b) => b.hybrid_score - a.hybrid_score);
  return scoredResults.slice(0, limit);
}

async function runTests() {
  const testCases = [
    { name: 'Case Number Search', q: 'Criminal Appeal No. 1945' },
    { name: 'Citation Search', q: '2026 INSC 485' },
    { name: 'Citation Search 2', q: '2026:RJ-JP:44204-DB' },
    { name: 'Party Name Search 1', q: 'Mahesh Kumar' },
    { name: 'Party Name Search 2', q: 'Ravi Kumar' },
    { name: 'Semantic Legal Search', q: 'quashing criminal proceedings breach of contract agreement to sell' },
    { name: 'Filter by Court Level (Supreme Court)', q: 'compensation motor accident', filters: { court_level: 'Supreme Court' } },
    { name: 'Filter by Court Level (High Court)', q: 'arbitration contract', filters: { court_level: 'High Court' } }
  ];

  for (const tc of testCases) {
    console.log(`\n======================================================`);
    console.log(`TEST: ${tc.name} | Query: "${tc.q}"`);
    console.log(`======================================================`);
    const results = await hybridSearch(tc.q, tc.filters || {}, 5);
    console.log(`Returned: ${results.length} results`);
    const docIds = new Set();
    let hasDuplicate = false;
    results.forEach((r, idx) => {
      if (docIds.has(r.document_id)) hasDuplicate = true;
      docIds.add(r.document_id);
      console.log(`  [${idx + 1}] Citation: ${r.citation} | Score: ${r.hybrid_score} (kw: ${r.keyword_score}, sem: ${r.semantic_score})`);
      console.log(`      Title: ${r.title.slice(0, 60)}...`);
      console.log(`      Page: ${r.page_number} | Para: ${r.paragraph_number} | Court: ${r.court_level}`);
    });
    console.log(`  Document Deduplication Check: ${hasDuplicate ? 'FAILED - DUPLICATES PRESENT' : 'PASSED - 100% UNIQUE'}`);
  }
}

runTests();
