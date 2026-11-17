import crypto from 'crypto';

export const EMBEDDING_DIMENSION = 1536;

/**
 * Generates a unit-normalized deterministic 1536-dimensional vector
 * from text using multi-hash token projection.
 * Used for offline execution, automated tests, and zero-cost baseline.
 */
export function generateDeterministicEmbedding(text: string, dimensions = EMBEDDING_DIMENSION): number[] {
  const clean = (text || '').toLowerCase().trim();
  const vector = new Float64Array(dimensions);
  
  if (!clean) {
    vector[0] = 1.0;
    return Array.from(vector);
  }

  // Tokenize by words and character n-grams (3-grams and 4-grams)
  const tokens = clean.split(/[\s,.;:()\[\]{}"'\-]+/).filter(t => t.length > 1);
  const ngrams: string[] = [];
  for (let i = 0; i < clean.length - 3; i++) {
    ngrams.push(clean.substring(i, i + 3));
  }

  const allTokens = [...tokens, ...ngrams];

  for (const tok of allTokens) {
    const hash = crypto.createHash('sha256').update(tok).digest();
    // Project across dimensions
    for (let i = 0; i < 8; i++) {
      const idx = hash.readUInt16LE(i * 2) % dimensions;
      const weight = (hash.readInt8(16 + i) / 128.0);
      vector[idx] += weight;
    }
  }

  // Calculate L2 norm for unit normalization
  let sumSq = 0;
  for (let i = 0; i < dimensions; i++) {
    sumSq += vector[i] * vector[i];
  }

  const norm = Math.sqrt(sumSq) || 1.0;
  const normalized = new Array<number>(dimensions);
  for (let i = 0; i < dimensions; i++) {
    normalized[i] = Number((vector[i] / norm).toFixed(6));
  }

  return normalized;
}

/**
 * Computes Cosine Similarity between two numeric vectors.
 * Returns value between -1.0 and 1.0 (typically 0.0 to 1.0 for normalized text vectors).
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  if (denom === 0) return 0;
  return dotProduct / denom;
}

export class EmbeddingService {
  private apiKey: string;
  private model: string;

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || '';
    this.model = process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small';
  }

  get isExternalConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.startsWith('sk-'));
  }

  async generateEmbedding(text: string): Promise<number[]> {
    if (this.isExternalConfigured) {
      try {
        const res = await fetch('https://api.openai.com/v1/embeddings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          },
          body: JSON.stringify({
            model: this.model,
            input: text.slice(0, 8000)
          })
        });

        if (res.ok) {
          const data = await res.json();
          if (data?.data?.[0]?.embedding) {
            return data.data[0].embedding;
          }
        }
        console.warn('OpenAI embedding API returned non-OK status, falling back to deterministic embedding.');
      } catch (err) {
        console.warn('OpenAI embedding fetch failed, using deterministic embedding:', err);
      }
    }

    return generateDeterministicEmbedding(text, EMBEDDING_DIMENSION);
  }

  async generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
    if (this.isExternalConfigured && texts.length > 0) {
      try {
        const res = await fetch('https://api.openai.com/v1/embeddings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          },
          body: JSON.stringify({
            model: this.model,
            input: texts.map(t => t.slice(0, 8000))
          })
        });

        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data?.data)) {
            return data.data.map((item: any) => item.embedding);
          }
        }
      } catch (err) {
        console.warn('Batch OpenAI embedding failed, using deterministic fallback:', err);
      }
    }

    return texts.map(t => generateDeterministicEmbedding(t, EMBEDDING_DIMENSION));
  }
}

export const embeddingService = new EmbeddingService();
