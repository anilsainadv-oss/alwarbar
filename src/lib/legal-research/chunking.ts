/**
 * Semantic Text Cleaning & Sliding Window Chunking Engine for Indian Legal Documents
 * 
 * Specifically optimized for:
 * - Supreme Court & High Court judgments (SC e-SCR, SCC, AIR, RLR, ILR)
 * - Central & Rajasthan statutory acts (BNSS, BNS, BSA, CPC, CrPC, IPC, RTA)
 * - District court petitions, written statements, and bail applications
 */

export interface ChunkDescriptor {
  chunk_index: number;
  content: string;
  page_number: number;
  paragraph_number: number;
  token_count: number;
}

export interface ChunkingOptions {
  maxWordsPerChunk?: number;     // Target size: 400-600 words (~1500-2500 chars)
  overlapWords?: number;         // Overlap: 75-125 words (~300-500 chars)
  minWordsPerChunk?: number;     // Minimum chunk threshold to prevent noise
}

const DEFAULT_OPTIONS: Required<ChunkingOptions> = {
  maxWordsPerChunk: 500,
  overlapWords: 100,
  minWordsPerChunk: 50
};

/**
 * Cleans extracted legal text:
 * - Strips page footers / watermarks / repetitive court stamps
 * - Normalizes quotes, dashes, and whitespace
 * - Preserves statutory section references and paragraph structure
 */
export function cleanLegalText(rawText: string): string {
  if (!rawText || typeof rawText !== 'string') return '';

  return rawText
    // Normalize newlines
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Remove typical PDF footer / header noise
    .replace(/Page\s+\d+\s+of\s+\d+/gi, '')
    .replace(/\[\s*Page\s*\d+\s*\]/gi, '')
    .replace(/Indian Kanoon\s*-\s*http[s]?:\/\/\S+/gi, '')
    .replace(/VERDICTUM\.IN/gi, '')
    .replace(/LiveLaw\s*\(SC\)/gi, '')
    // Normalize curly quotes and symbols
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    // Clean excessive spaces per line
    .split('\n')
    .map(line => line.trim())
    .filter((line, idx, arr) => {
      // Remove lines that are just lone numbers (often page numbers)
      if (/^\d{1,4}$/.test(line)) return false;
      // Allow blank lines for paragraph separation, but not 3+ in a row
      if (line === '' && arr[idx - 1] === '') return false;
      return true;
    })
    .join('\n')
    // Collapse 3+ consecutive newlines to 2
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Estimates token count based on English/Hindi word structure
 * Standard rule of thumb: ~1.3 tokens per word for English, ~1.8 for Hindi legal terms
 */
export function estimateTokenCount(text: string): number {
  if (!text) return 0;
  const words = text.trim().split(/\s+/).filter(Boolean);
  return Math.ceil(words.length * 1.35);
}

/**
 * Splits text into paragraphs preserving structure
 */
function splitIntoParagraphs(text: string): string[] {
  // First split by double newlines
  const rawParagraphs = text.split(/\n\s*\n+/);
  const result: string[] = [];

  for (const p of rawParagraphs) {
    const trimmed = p.trim();
    if (!trimmed) continue;
    // If a paragraph is excessively long (> 700 words), sub-split by sentence boundaries
    const words = trimmed.split(/\s+/);
    if (words.length > 700) {
      const sentenceRegex = /([.?!।]\s+)/;
      const parts = trimmed.split(sentenceRegex);
      let cur = '';
      for (let i = 0; i < parts.length; i += 2) {
        const sentence = parts[i] + (parts[i + 1] || '');
        if ((cur + ' ' + sentence).split(/\s+/).length > 500) {
          if (cur.trim()) result.push(cur.trim());
          cur = sentence;
        } else {
          cur = cur ? cur + ' ' + sentence : sentence;
        }
      }
      if (cur.trim()) result.push(cur.trim());
    } else {
      result.push(trimmed);
    }
  }

  return result;
}

/**
 * Splits legal document into overlapping sliding-window chunks
 */
export function chunkLegalDocument(
  fullText: string,
  options: ChunkingOptions = {}
): ChunkDescriptor[] {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const cleaned = cleanLegalText(fullText);
  if (!cleaned) return [];

  const paragraphs = splitIntoParagraphs(cleaned);
  if (paragraphs.length === 0) return [];

  const chunks: ChunkDescriptor[] = [];
  let currentWords: string[] = [];
  let currentChunkParagraphStart = 1;
  let estimatedPage = 1;
  let cumulativeWordCount = 0;

  for (let pIdx = 0; pIdx < paragraphs.length; pIdx++) {
    const p = paragraphs[pIdx];
    const pWords = p.split(/\s+/).filter(Boolean);
    if (pWords.length === 0) continue;

    // Check if adding this paragraph exceeds target chunk size
    if (currentWords.length + pWords.length > opts.maxWordsPerChunk && currentWords.length >= opts.minWordsPerChunk) {
      // Finalize current chunk
      const content = currentWords.join(' ');
      chunks.push({
        chunk_index: chunks.length,
        content,
        page_number: Math.max(1, Math.floor(cumulativeWordCount / 300) + 1),
        paragraph_number: currentChunkParagraphStart,
        token_count: estimateTokenCount(content)
      });

      // Prepare overlap for next chunk
      const overlapCount = Math.min(opts.overlapWords, currentWords.length);
      const overlapSlice = currentWords.slice(currentWords.length - overlapCount);
      currentWords = [...overlapSlice, ...pWords];
      currentChunkParagraphStart = pIdx + 1;
    } else {
      currentWords.push(...pWords);
    }

    cumulativeWordCount += pWords.length;
  }

  // Push remainder if it meets minimum threshold or is the only chunk
  if (currentWords.length > 0) {
    const content = currentWords.join(' ');
    // If remainder is very short and we already have chunks, append to previous chunk if feasible
    if (currentWords.length < opts.minWordsPerChunk && chunks.length > 0) {
      const last = chunks[chunks.length - 1];
      const merged = last.content + '\n\n' + content;
      last.content = merged;
      last.token_count = estimateTokenCount(merged);
    } else {
      chunks.push({
        chunk_index: chunks.length,
        content,
        page_number: Math.max(1, Math.floor(cumulativeWordCount / 300) + 1),
        paragraph_number: currentChunkParagraphStart,
        token_count: estimateTokenCount(content)
      });
    }
  }

  return chunks;
}
