const fs = require('fs');

const raw = JSON.parse(fs.readFileSync('data/local-db.json', 'utf8'));
const docs = raw.legal_documents || [];
const existingChunks = raw.legal_document_chunks || [];

// Re-implement the same chunkLegalDocument logic in standalone test script
function cleanLegalText(text) {
  if (!text) return '';
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[\t ]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function splitIntoParagraphs(text) {
  return text
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(p => p.length > 0);
}

function chunkLegalDocument(fullText, options = {}) {
  const maxWords = options.maxWordsPerChunk || 500;
  const overlapWords = options.overlapWords || 100;
  const minWords = options.minWordsPerChunk || 40;

  const cleaned = cleanLegalText(fullText);
  if (!cleaned) return [];
  const paragraphs = splitIntoParagraphs(cleaned);
  if (paragraphs.length === 0) return [];

  const chunks = [];
  let currentWords = [];
  let currentChunkParagraphStart = 1;
  let cumulativeWordCount = 0;

  for (let pIdx = 0; pIdx < paragraphs.length; pIdx++) {
    const p = paragraphs[pIdx];
    const pWords = p.split(/\s+/).filter(Boolean);
    if (pWords.length === 0) continue;

    if (currentWords.length + pWords.length > maxWords && currentWords.length >= minWords) {
      const content = currentWords.join(' ');
      chunks.push({
        chunk_index: chunks.length,
        wordCount: currentWords.length,
        charCount: content.length
      });
      const overlapCount = Math.min(overlapWords, currentWords.length);
      const overlapSlice = currentWords.slice(currentWords.length - overlapCount);
      currentWords = [...overlapSlice, ...pWords];
      currentChunkParagraphStart = pIdx + 1;
    } else {
      currentWords.push(...pWords);
    }
    cumulativeWordCount += pWords.length;
  }

  if (currentWords.length > 0) {
    const content = currentWords.join(' ');
    chunks.push({
      chunk_index: chunks.length,
      wordCount: currentWords.length,
      charCount: content.length
    });
  }

  return chunks;
}

console.log('Comparing Existing Chunks vs Natural Chunks from Full Text:\n');
docs.forEach((d, idx) => {
  const currentChunks = existingChunks.filter(c => c.document_id === d.id);
  const naturalChunks = chunkLegalDocument(d.full_text);
  const wordCount = (d.full_text || '').split(/\s+/).filter(Boolean).length;
  console.log(`[#${idx + 1}] ${d.id}`);
  console.log(`    Title:            ${d.title}`);
  console.log(`    Citation:         ${d.citation}`);
  console.log(`    Text Chars:       ${d.full_text ? d.full_text.length : 0} | Words: ${wordCount}`);
  console.log(`    Existing Chunks:  ${currentChunks.length}`);
  console.log(`    Natural Chunks:   ${naturalChunks.length}`);
  if (naturalChunks.length !== currentChunks.length) {
    console.log(`    NOTE: Existing chunks (${currentChunks.length}) differs from natural re-chunk (${naturalChunks.length})`);
  }
  console.log('');
});
