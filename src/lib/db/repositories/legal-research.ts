import crypto from 'crypto';
import { localDb } from '@/lib/db';
import { supabase, supabaseAdmin, isSupabaseConfigured } from '@/lib/db/supabase';
import { embeddingService, cosineSimilarity } from '@/lib/ai/embeddings';
import type { 
  LegalDocument, 
  LegalDocumentChunk, 
  LegalResearchHistory, 
  SavedResearch, 
  LegalDocumentSource,
  LegalDocumentProcessing,
  LegalIngestionJob,
  LegalDocumentCitation,
  LegalSearchResult,
  SearchFilters,
  RAGLegalResponse,
  JudgmentAuditAction,
  JudgmentAuditLog,
  CourtDiscoveryQueueItem,
  CourtDiscoveryQueueStatus,
  CourtSyncCheckpoint
} from '@/types/legal-research';

export const legalResearchRepository = {
  /**
   * Guard against silent localDb fallback when Supabase is configured or in production.
   */
  _throwIfSupabaseRequired(operation: string, err: unknown): void {
    const msg = err instanceof Error ? err.message : (typeof err === 'object' && err && 'message' in err ? String((err as any).message) : String(err));
    if (process.env.NODE_ENV === 'production' || isSupabaseConfigured) {
      throw new Error(`Supabase ${operation} failed: ${msg}`);
    }
  },

  /**
   * Hybrid Search: Combines vector semantic similarity + full-text keyword matching
   * using Reciprocal Rank Fusion (RRF) with exact citation boosting.
   */
  async searchHybrid(
    query: string,
    filters: SearchFilters = {},
    limit = 15
  ): Promise<LegalSearchResult[]> {
    const cleanQuery = (query || '').trim();
    if (!cleanQuery) return [];

    // 1. Generate query embedding (1536-dim)
    const queryEmbedding = await embeddingService.generateEmbedding(cleanQuery);

    // 2. Try Supabase pgvector RPC functions if configured
    if (isSupabaseConfigured && supabase) {
      try {
        // Fetch candidate chunks from Supabase RPC with a wide match window for deduplication
        const { data: chunksData, error: chunksErr } = await supabase.rpc('search_legal_chunks', {
          query_embedding: queryEmbedding,
          query_text: cleanQuery,
          match_count: 50,
          court_filter: filters.court_name || null,
          bench_filter: null,
          year_filter: filters.year ? parseInt(filters.year, 10) : null
        });

        // Query published & approved documents from Supabase (Double-Lock Enforced)
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

        const { data: docsData, error: docsErr } = await docQuery;

        if (!docsErr && Array.isArray(docsData) && docsData.length > 0) {
          // Document-Level Chunk Deduplication: map each document to its BEST matching chunk
          const bestChunkPerDoc = new Map<string, any>();
          if (!chunksErr && Array.isArray(chunksData)) {
            for (const c of chunksData) {
              const existing = bestChunkPerDoc.get(c.document_id);
              if (!existing || c.relevance_score > existing.relevance_score) {
                bestChunkPerDoc.set(c.document_id, c);
              }
            }
          }

          const lowerQuery = cleanQuery.toLowerCase();
          const queryTokens = lowerQuery.split(/[\s,.;:()\[\]{}"'\-]+/).filter(t => t.length > 2);
          const scoredResults: LegalSearchResult[] = [];

          for (const doc of docsData) {
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

            // Exact or substring citation match (+0.85)
            if (docCitation && (docCitation.includes(lowerQuery) || lowerQuery.includes(docCitation))) {
              kwScore += 0.85;
            }

            // Exact or partial case number match (+0.75)
            if (docCaseNo && (docCaseNo.includes(lowerQuery) || lowerQuery.includes(docCaseNo))) {
              kwScore += 0.75;
            }

            // Party names matching (+0.60)
            if (partiesStr && (partiesStr.includes(lowerQuery) || lowerQuery.includes(partiesStr))) {
              kwScore += 0.60;
            }

            // Token-based matching across metadata (+0.40 max)
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
                court_level: doc.court_level || (doc.court_name?.toLowerCase().includes('supreme') ? 'Supreme Court' : 'High Court'),
                bench: doc.bench,
                judgment_date: doc.judgment_date,
                legal_subject: doc.legal_subject,
                statutes: Array.isArray(doc.statutes) ? doc.statutes.join(', ') : doc.statutes,
                page_number: chunk?.page_number || 1,
                paragraph_number: chunk?.paragraph_number || '1',
                snippet,
                semantic_score: Number(semScore.toFixed(4)),
                keyword_score: Number(Math.min(kwScore, 1.0).toFixed(4)),
                hybrid_score: hybridScore
              });
            }
          }

          scoredResults.sort((a, b) => b.hybrid_score - a.hybrid_score);
          if (scoredResults.length > 0) {
            return scoredResults.slice(0, limit);
          }
        }
      } catch (err) {
        console.warn('Supabase hybrid search failed, falling back to local hybrid engine:', err);
      }
    }

    // 3. High-Performance Local Hybrid Engine Fallback
    return localDb.hybridSearchLegalDocuments(cleanQuery, queryEmbedding, limit, filters);
  },

  /**
   * Reciprocal Rank Fusion Chunk Search (006_legal_hybrid_search.sql)
   */
  async searchLegalChunks(
    query: string,
    matchCount = 10,
    courtFilter: string | null = null,
    benchFilter: string | null = null,
    yearFilter: number | null = null
  ): Promise<LegalSearchResult[]> {
    const cleanQuery = (query || '').trim();
    if (!cleanQuery) return [];
    const queryEmbedding = await embeddingService.generateEmbedding(cleanQuery);
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.rpc('search_legal_chunks', {
          query_embedding: queryEmbedding,
          query_text: cleanQuery,
          match_count: matchCount,
          court_filter: courtFilter,
          bench_filter: benchFilter,
          year_filter: yearFilter
        });
        if (!error && Array.isArray(data) && data.length > 0) {
          return data.map((r: any) => ({
            chunk_id: r.chunk_id,
            document_id: r.document_id,
            title: r.title,
            citation: r.citation,
            court_name: r.court_name,
            court_level: r.court_name?.toLowerCase().includes('supreme') ? 'Supreme Court' : 'High Court',
            bench: r.bench,
            judgment_date: r.judgment_date,
            page_number: r.page_number,
            paragraph_number: r.paragraph_number,
            snippet: r.content,
            hybrid_score: r.relevance_score
          })) as LegalSearchResult[];
        }
      } catch {
        // Fallback
      }
    }

    return localDb.searchLegalChunks(queryEmbedding, cleanQuery, matchCount, courtFilter, benchFilter, yearFilter);
  },

  /**
   * Pure Semantic Vector Search across document chunks
   */
  async searchSemantic(
    queryEmbedding: number[],
    threshold = 0.60,
    limit = 10,
    filters: SearchFilters = {}
  ): Promise<LegalSearchResult[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.rpc('match_legal_documents', {
          query_embedding: queryEmbedding,
          match_threshold: threshold,
          match_count: limit,
          filter_criteria: filters
        });
        if (!error && Array.isArray(data)) {
          return data as LegalSearchResult[];
        }
      } catch (err) {
        console.warn('match_legal_documents RPC failed, using local semantic fallback:', err);
      }
    }

    return localDb.searchChunksByVector(queryEmbedding, limit, threshold, filters);
  },

  /**
   * Get complete document record with all chunks
   */
  async getDocumentById(id: string): Promise<(LegalDocument & { chunks: LegalDocumentChunk[] }) | null> {
    const client = supabaseAdmin || supabase;
    if (isSupabaseConfigured && client) {
      try {
        const { data: doc, error: docError } = await client
          .from('legal_documents')
          .select('*')
          .eq('id', id)
          .single();

        if (!docError && doc) {
          const { data: chunks } = await client
            .from('legal_document_chunks')
            .select('*')
            .eq('document_id', id)
            .order('chunk_index', { ascending: true });

          return { ...doc, chunks: chunks || [] };
        }
      } catch {
        // Fallback
      }
    }

    const doc = localDb.getLegalDocumentById(id);
    if (!doc) return null;
    const chunks = localDb.getLegalDocumentChunks(id);
    return { ...doc, chunks };
  },

  /**
   * List legal documents (Admin / Public search)
   */
  async getDocuments(filter?: { 
    status?: string; 
    court_level?: string; 
    limit?: number;
    approval_status?: string;
    publication_status?: string;
    court_code?: string;
  }): Promise<LegalDocument[]> {
    const client = supabaseAdmin || supabase;
    if (isSupabaseConfigured && client) {
      try {
        let q = client.from('legal_documents').select('*');
        if (filter?.status) q = q.eq('verification_status', filter.status);
        if (filter?.approval_status && filter.approval_status !== 'ALL') q = q.eq('approval_status', filter.approval_status);
        if (filter?.publication_status && filter.publication_status !== 'ALL') q = q.eq('publication_status', filter.publication_status);
        if (filter?.court_code && filter.court_code !== 'ALL') q = q.eq('court_code', filter.court_code);
        if (filter?.court_level && filter.court_level !== 'ALL') q = q.eq('court_level', filter.court_level);
        if (filter?.limit) q = q.limit(filter.limit);
        const { data, error } = await q.order('created_at', { ascending: false });
        if (!error && data) return data as LegalDocument[];
      } catch {
        // Fallback
      }
    }

    return localDb.getLegalDocuments(filter);
  },

  /**
   * Fetch judgment audit history
   */
  async getAuditLogs(documentId?: string) {
    const client = supabaseAdmin || supabase;
    if (isSupabaseConfigured && client) {
      try {
        let q = client.from('judgment_audit_logs').select('*');
        if (documentId) q = q.eq('document_id', documentId);
        const { data, error } = await q.order('created_at', { ascending: false });
        if (!error && data) return data;
      } catch {
        // Fallback
      }
    }
    return localDb.getJudgmentAuditLogs(documentId);
  },

  /**
   * Record a judgment audit entry
   */
  async recordAuditLog(log: {
    document_id: string;
    action: any;
    performed_by?: string;
    actor_id?: string;
    actor_name?: string;
    actor_role?: string;
    notes?: string;
    details?: Record<string, any>;
    metadata_snapshot?: Record<string, any>;
  }) {
    const client = supabaseAdmin || supabase;
    const actorId = log.actor_id || log.performed_by || 'admin-user-alwar-0001';
    const auditRow = {
      id: `aud-${crypto.randomUUID()}`,
      document_id: log.document_id,
      actor_id: actorId,
      actor_name: log.actor_name || (actorId.includes('@') ? actorId.split('@')[0] : 'Alwar Bar Admin'),
      actor_role: log.actor_role || 'public_admin',
      action: log.action as JudgmentAuditAction,
      entity_type: 'legal_document',
      entity_id: log.document_id,
      details: log.details || null,
      notes: log.notes || null,
      metadata_snapshot: log.metadata_snapshot || null,
      created_at: new Date().toISOString()
    };
    if (isSupabaseConfigured && client) {
      const { data, error } = await client.from('judgment_audit_logs').insert(auditRow).select().single();
      if (error) {
        console.error('Supabase recordAuditLog insert error:', error.message);
        this._throwIfSupabaseRequired('recordAuditLog', error);
      }
      if (data) return data;
    } else {
      this._throwIfSupabaseRequired('recordAuditLog', 'Supabase client not configured');
    }
    return localDb.addJudgmentAuditLog(auditRow);
  },

  /**
   * Ingest and create a new legal document with semantic chunks
   */
  async createDocument(
    doc: Omit<LegalDocument, 'id' | 'created_at' | 'updated_at'> & { id?: string },
    chunks: (Omit<LegalDocumentChunk, 'id' | 'document_id' | 'created_at'> & { id?: string })[]
  ): Promise<LegalDocument> {
    const client = supabaseAdmin || supabase;
    if (isSupabaseConfigured && client) {
      const generatedId =
        doc.id ||
        `doc-${(doc.court_code || 'legal').toLowerCase().replace(/[^a-z0-9]/g, '-')}-${crypto.randomUUID().slice(0, 12)}`;
      const docRow = {
        ...doc,
        id: generatedId
      };

      const { data: newDoc, error: docErr } = await client
        .from('legal_documents')
        .insert(docRow)
        .select()
        .single();

      if (docErr || !newDoc) {
        this._throwIfSupabaseRequired('createDocument', docErr || 'Empty insert response');
      }

      if (newDoc) {
        if (chunks.length > 0) {
          const chunkRows = chunks.map(c => ({
            ...c,
            id: c.id || `chk-${newDoc.id}-${c.chunk_index}`,
            document_id: newDoc.id
          }));
          const { error: chunkErr } = await client.from('legal_document_chunks').insert(chunkRows);
          if (chunkErr) {
            // Compensating cleanup: remove orphan legal_documents row if chunk insertion failed
            await client.from('legal_documents').delete().eq('id', newDoc.id);
            this._throwIfSupabaseRequired('createDocument.chunks', chunkErr);
          }
        }
        return newDoc as LegalDocument;
      }
    } else {
      this._throwIfSupabaseRequired('createDocument', 'Supabase client not configured');
    }

    return localDb.createLegalDocument(doc, chunks);
  },

  /**
   * Update legal document metadata or verification status (Admin)
   */
  async updateDocument(id: string, updates: Partial<LegalDocument>): Promise<LegalDocument | null> {
    const client = supabaseAdmin || supabase;
    if (isSupabaseConfigured && client) {
      const { data, error } = await client
        .from('legal_documents')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) {
        this._throwIfSupabaseRequired('updateDocument', error);
      }
      if (data) return data as LegalDocument;
      return null;
    } else {
      this._throwIfSupabaseRequired('updateDocument', 'Supabase client not configured');
    }

    return localDb.updateLegalDocument(id, updates);
  },

  /**
   * Delete legal document and cascading chunks (Admin)
   */
  async deleteDocument(id: string): Promise<boolean> {
    const client = supabaseAdmin || supabase;
    if (isSupabaseConfigured && client) {
      const { error } = await client
        .from('legal_documents')
        .delete()
        .eq('id', id);
      if (error) {
        this._throwIfSupabaseRequired('deleteDocument', error);
      }
      return true;
    } else {
      this._throwIfSupabaseRequired('deleteDocument', 'Supabase client not configured');
    }

    return localDb.deleteLegalDocument(id);
  },

  /**
   * Record legal research history for authenticated lawyer
   */
  async recordHistory(
    userId: string,
    query: string,
    aiResponse: RAGLegalResponse | string,
    retrievedDocumentIds: string[] = [],
    modelName = 'gpt-4o'
  ): Promise<LegalResearchHistory> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('legal_research_history')
          .insert({
            user_id: userId,
            query,
            ai_response: typeof aiResponse === 'string' ? aiResponse : JSON.stringify(aiResponse),
            retrieved_document_ids: retrievedDocumentIds,
            model_name: modelName
          })
          .select()
          .single();
        if (!error && data) return data as LegalResearchHistory;
      } catch {
        // Fallback
      }
    }

    return localDb.createLegalResearchHistory(userId, query, aiResponse, retrievedDocumentIds, modelName);
  },

  /**
   * Get research history for an advocate
   */
  async getHistory(userId: string, limit = 20): Promise<LegalResearchHistory[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('legal_research_history')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(limit);
        if (!error && data) return data as LegalResearchHistory[];
      } catch {
        // Fallback
      }
    }

    return localDb.getLegalResearchHistory(userId, limit);
  },

  /**
   * Save a precedent or research memo (optionally linked to a case)
   */
  async saveResearch(
    userId: string,
    documentId: string,
    caseId?: string | null,
    notes?: string
  ): Promise<SavedResearch> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('saved_research')
          .insert({
            user_id: userId,
            document_id: documentId,
            case_id: caseId || null,
            notes: notes || ''
          })
          .select('*, legal_documents(*)')
          .single();

        if (!error && data) {
          return {
            ...data,
            document: (data as any).legal_documents
          } as SavedResearch;
        }
      } catch {
        // Fallback
      }
    }

    return localDb.createSavedResearch(userId, documentId, caseId, notes);
  },

  /**
   * Get saved research for an advocate (optionally filtered by case)
   */
  async getSavedResearch(userId: string, caseId?: string | null): Promise<SavedResearch[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        let q = supabase
          .from('saved_research')
          .select('*, legal_documents(*)')
          .eq('user_id', userId);

        if (caseId) {
          q = q.eq('case_id', caseId);
        }

        const { data, error } = await q.order('created_at', { ascending: false });
        if (!error && data) {
          return data.map((d: any) => ({
            ...d,
            document: d.legal_documents
          })) as SavedResearch[];
        }
      } catch {
        // Fallback
      }
    }

    return localDb.getSavedResearch(userId, caseId);
  },

  /**
   * Delete saved research entry
   */
  async deleteSavedResearch(userId: string, id: string): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('saved_research')
          .delete()
          .eq('id', id)
          .eq('user_id', userId);
        if (!error) return true;
      } catch {
        // Fallback
      }
    }

    return localDb.deleteSavedResearch(userId, id);
  },

  /**
   * Get official legal document sources
   */
  async getSources(documentId?: string): Promise<LegalDocumentSource[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        let q = supabase
          .from('legal_document_sources')
          .select('*');
        if (documentId) {
          q = q.eq('document_id', documentId);
        }
        const { data, error } = await q.order('source_name', { ascending: true });
        if (!error && data) return data as LegalDocumentSource[];
      } catch {
        // Fallback
      }
    }

    return localDb.getLegalDocumentSources(documentId);
  },

  /**
   * Add a source provenance record (003_legal_sources_processing.sql)
   */
  async createSource(source: Omit<LegalDocumentSource, 'id' | 'created_at'>): Promise<LegalDocumentSource> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('legal_document_sources')
          .insert(source)
          .select()
          .single();
        if (!error && data) return data as LegalDocumentSource;
      } catch (err) {
        console.warn('Supabase createSource failed, falling back to localDb:', err);
      }
    }

    return localDb.addLegalDocumentSource(source);
  },

  /**
   * Get background ingestion & OCR processing telemetry (003_legal_sources_processing.sql)
   */
  async getProcessingStatus(documentId: string): Promise<LegalDocumentProcessing | null> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('legal_document_processing')
          .select('*')
          .eq('document_id', documentId)
          .single();
        if (!error && data) return data as LegalDocumentProcessing;
      } catch {
        // Fallback
      }
    }

    return localDb.getLegalDocumentProcessing(documentId);
  },

  /**
   * Record or update processing status for a legal document
   */
  async recordProcessing(
    proc: Omit<LegalDocumentProcessing, 'id' | 'created_at'>
  ): Promise<LegalDocumentProcessing> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('legal_document_processing')
          .upsert(proc)
          .select()
          .single();
        if (!error && data) return data as LegalDocumentProcessing;
      } catch (err) {
        console.warn('Supabase recordProcessing failed, falling back to localDb:', err);
      }
    }

    return localDb.updateLegalDocumentProcessing(proc.document_id, proc);
  },

  /**
   * Update processing status
   */
  async updateProcessingStatus(
    documentId: string,
    updates: Partial<LegalDocumentProcessing>
  ): Promise<LegalDocumentProcessing | null> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('legal_document_processing')
          .update(updates)
          .eq('document_id', documentId)
          .select()
          .single();
        if (!error && data) return data as LegalDocumentProcessing;
      } catch (err) {
        console.warn('Supabase updateProcessingStatus failed, falling back to localDb:', err);
      }
    }

    return localDb.updateLegalDocumentProcessing(documentId, updates);
  },

  /**
   * Precedent Citation Graph (004_legal_ingestion_jobs.sql)
   */
  async getCitations(docId?: string): Promise<LegalDocumentCitation[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        let q = supabase.from('legal_document_citations').select('*');
        if (docId) {
          q = q.or(`document_id.eq.${docId},cited_document_id.eq.${docId}`);
        }
        const { data, error } = await q.order('created_at', { ascending: false });
        if (!error && data) return data as LegalDocumentCitation[];
      } catch {
        // Fallback
      }
    }

    return localDb.getLegalDocumentCitations(docId);
  },

  async addCitation(
    citation: Omit<LegalDocumentCitation, 'id' | 'created_at'>
  ): Promise<LegalDocumentCitation> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('legal_document_citations')
          .insert(citation)
          .select()
          .single();
        if (!error && data) return data as LegalDocumentCitation;
      } catch (err) {
        console.warn('Supabase addCitation failed, falling back to localDb:', err);
      }
    }

    return localDb.addLegalDocumentCitation(citation);
  },

  /**
   * Ingestion Batch Jobs (004_legal_ingestion_jobs.sql)
   */
  async getIngestionJobs(): Promise<LegalIngestionJob[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('legal_ingestion_jobs')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && data) return data as LegalIngestionJob[];
      } catch {
        // Fallback
      }
    }

    return localDb.getIngestionJobs();
  },

  async createIngestionJob(
    job: Omit<LegalIngestionJob, 'id' | 'created_at'>
  ): Promise<LegalIngestionJob> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('legal_ingestion_jobs')
          .insert(job)
          .select()
          .single();
        if (!error && data) return data as LegalIngestionJob;
      } catch (err) {
        console.warn('Supabase createIngestionJob failed, falling back to localDb:', err);
      }
    }

    return localDb.createIngestionJob(job);
  },

  async updateIngestionJob(
    id: string,
    updates: Partial<LegalIngestionJob>
  ): Promise<LegalIngestionJob | null> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('legal_ingestion_jobs')
          .update(updates)
          .eq('id', id)
          .select()
          .single();
        if (!error && data) return data as LegalIngestionJob;
      } catch (err) {
        console.warn('Supabase updateIngestionJob failed, falling back to localDb:', err);
      }
    }

    return localDb.updateIngestionJob(id, updates);
  },

  /**
   * Court Sync Checkpoints & Persistent Discovery Queue (011)
   */
  async getCourtSyncCheckpoint(courtCode: string): Promise<CourtSyncCheckpoint | null> {
    if (isSupabaseConfigured && supabaseAdmin) {
      const { data, error } = await supabaseAdmin
        .from('court_sync_checkpoints')
        .select('*')
        .eq('court_code', courtCode)
        .maybeSingle();
      if (error) this._throwIfSupabaseRequired('getCourtSyncCheckpoint', error);
      return (data as CourtSyncCheckpoint) || null;
    }
    this._throwIfSupabaseRequired('getCourtSyncCheckpoint', 'Supabase client not configured');
    return localDb.getCourtSyncCheckpoint(courtCode);
  },

  async acquireCourtSyncLock(
    courtCode: string,
    courtName: string,
    workerId: string,
    leaseSeconds: number = 300
  ): Promise<{
    acquired: boolean;
    court_code: string;
    locked_at: string | null;
    locked_by: string | null;
    lock_generation: number;
    last_scanned_date: string | null;
  }> {
    if (isSupabaseConfigured && supabaseAdmin) {
      const { data, error } = await supabaseAdmin.rpc('acquire_court_sync_lock', {
        p_court_code: courtCode,
        p_court_name: courtName,
        p_worker_id: workerId,
        p_lease_seconds: leaseSeconds
      });
      if (error) this._throwIfSupabaseRequired('acquire_court_sync_lock', error);
      if (Array.isArray(data) && data.length > 0) {
        return {
          acquired: true,
          court_code: data[0].court_code,
          locked_at: data[0].locked_at,
          locked_by: data[0].locked_by,
          lock_generation: Number(data[0].lock_generation),
          last_scanned_date: data[0].last_scanned_date
        };
      }
      return {
        acquired: false,
        court_code: courtCode,
        locked_at: null,
        locked_by: null,
        lock_generation: 0,
        last_scanned_date: null
      };
    }
    this._throwIfSupabaseRequired('acquire_court_sync_lock', 'Supabase client not configured');
    return localDb.acquireCourtSyncLock(courtCode, courtName, workerId, leaseSeconds);
  },

  async renewCourtSyncLock(
    courtCode: string,
    workerId: string,
    lockGeneration: number,
    additionalSeconds: number = 300
  ): Promise<boolean> {
    if (isSupabaseConfigured && supabaseAdmin) {
      const { data, error } = await supabaseAdmin.rpc('renew_court_sync_lock', {
        p_court_code: courtCode,
        p_worker_id: workerId,
        p_lock_generation: lockGeneration,
        p_additional_seconds: additionalSeconds
      });
      if (error) this._throwIfSupabaseRequired('renew_court_sync_lock', error);
      return Boolean(data);
    }
    this._throwIfSupabaseRequired('renew_court_sync_lock', 'Supabase client not configured');
    return localDb.renewCourtSyncLock(courtCode, workerId, lockGeneration, additionalSeconds);
  },

  async claimDiscoveryQueueBatch(
    courtCode: string,
    workerId: string,
    lockGeneration: number,
    batchSize: number = 5,
    leaseSeconds: number = 300
  ): Promise<CourtDiscoveryQueueItem[]> {
    if (isSupabaseConfigured && supabaseAdmin) {
      const { data, error } = await supabaseAdmin.rpc('claim_discovery_queue_batch', {
        p_court_code: courtCode,
        p_worker_id: workerId,
        p_lock_generation: lockGeneration,
        p_batch_size: batchSize,
        p_lease_seconds: leaseSeconds
      });
      if (error) this._throwIfSupabaseRequired('claim_discovery_queue_batch', error);
      return (Array.isArray(data) ? data : []) as CourtDiscoveryQueueItem[];
    }
    this._throwIfSupabaseRequired('claim_discovery_queue_batch', 'Supabase client not configured');
    return localDb.claimDiscoveryQueueBatch(courtCode, workerId, lockGeneration, batchSize, leaseSeconds);
  },

  async renewQueueItemLease(
    queueId: string,
    courtCode: string,
    workerId: string,
    lockGeneration: number
  ): Promise<boolean> {
    if (isSupabaseConfigured && supabaseAdmin) {
      const { data, error } = await supabaseAdmin.rpc('renew_queue_item_lease', {
        p_queue_id: queueId,
        p_court_code: courtCode,
        p_worker_id: workerId,
        p_lock_generation: lockGeneration
      });
      if (error) this._throwIfSupabaseRequired('renew_queue_item_lease', error);
      return Boolean(data);
    }
    this._throwIfSupabaseRequired('renew_queue_item_lease', 'Supabase client not configured');
    return localDb.renewQueueItemLease(queueId, courtCode, workerId, lockGeneration);
  },

  async completeQueueItem(
    queueId: string,
    courtCode: string,
    workerId: string,
    lockGeneration: number,
    documentId: string
  ): Promise<boolean> {
    if (isSupabaseConfigured && supabaseAdmin) {
      const { data, error } = await supabaseAdmin.rpc('complete_queue_item', {
        p_queue_id: queueId,
        p_court_code: courtCode,
        p_worker_id: workerId,
        p_lock_generation: lockGeneration,
        p_document_id: documentId
      });
      if (error) this._throwIfSupabaseRequired('complete_queue_item', error);
      return Boolean(data);
    }
    this._throwIfSupabaseRequired('complete_queue_item', 'Supabase client not configured');
    return localDb.completeQueueItem(queueId, courtCode, workerId, lockGeneration, documentId);
  },

  async failQueueItem(
    queueId: string,
    courtCode: string,
    workerId: string,
    lockGeneration: number,
    error: string
  ): Promise<string> {
    if (isSupabaseConfigured && supabaseAdmin) {
      const { data, error: rpcErr } = await supabaseAdmin.rpc('fail_queue_item', {
        p_queue_id: queueId,
        p_court_code: courtCode,
        p_worker_id: workerId,
        p_lock_generation: lockGeneration,
        p_error: error
      });
      if (rpcErr) this._throwIfSupabaseRequired('fail_queue_item', rpcErr);
      return typeof data === 'string' ? data : 'failed';
    }
    this._throwIfSupabaseRequired('fail_queue_item', 'Supabase client not configured');
    return localDb.failQueueItem(queueId, courtCode, workerId, lockGeneration, error);
  },

  async releaseCourtSyncLock(
    courtCode: string,
    workerId: string,
    lockGeneration: number,
    success: boolean,
    newJudgmentDate?: string | null,
    newDiaryNo?: string | null,
    error?: string | null
  ): Promise<boolean> {
    if (isSupabaseConfigured && supabaseAdmin) {
      const { data, error: rpcErr } = await supabaseAdmin.rpc('release_court_sync_lock', {
        p_court_code: courtCode,
        p_worker_id: workerId,
        p_lock_generation: lockGeneration,
        p_success: success,
        p_new_judgment_date: newJudgmentDate || null,
        p_new_diary_no: newDiaryNo || null,
        p_error: error || null
      });
      if (rpcErr) this._throwIfSupabaseRequired('release_court_sync_lock', rpcErr);
      return Boolean(data);
    }
    this._throwIfSupabaseRequired('release_court_sync_lock', 'Supabase client not configured');
    return localDb.releaseCourtSyncLock(courtCode, workerId, lockGeneration, success, newJudgmentDate, newDiaryNo, error);
  },

  async enqueueDiscoveryCandidates(
    items: Array<Omit<CourtDiscoveryQueueItem, 'id' | 'status' | 'retry_count' | 'max_retries' | 'created_at' | 'updated_at'>>
  ): Promise<{ enqueued: number; duplicates: number }> {
    if (isSupabaseConfigured && supabaseAdmin) {
      if (items.length === 0) return { enqueued: 0, duplicates: 0 };
      const { data, error } = await supabaseAdmin
        .from('court_discovery_queue')
        .upsert(
          items.map(item => ({
            court_code: item.court_code,
            diary_number: item.diary_number,
            judgment_date: item.judgment_date,
            case_number: item.case_number || null,
            citation: item.citation || null,
            official_pdf_url: item.official_pdf_url,
            official_viewer_url: item.official_viewer_url || null,
            raw_metadata: item.raw_metadata || {},
            status: 'pending',
            retry_count: 0,
            max_retries: 3
          })),
          {
            onConflict: 'court_code,diary_number,judgment_date',
            ignoreDuplicates: true
          }
        )
        .select('id');

      if (error) this._throwIfSupabaseRequired('enqueueDiscoveryCandidates', error);
      const enqueuedCount = Array.isArray(data) ? data.length : 0;
      return {
        enqueued: enqueuedCount,
        duplicates: items.length - enqueuedCount
      };
    }
    this._throwIfSupabaseRequired('enqueueDiscoveryCandidates', 'Supabase client not configured');
    return localDb.enqueueDiscoveryCandidates(items);
  },

  async getDiscoveryQueue(courtCode?: string, status?: CourtDiscoveryQueueStatus): Promise<CourtDiscoveryQueueItem[]> {
    if (isSupabaseConfigured && supabaseAdmin) {
      let q = supabaseAdmin.from('court_discovery_queue').select('*');
      if (courtCode) q = q.eq('court_code', courtCode);
      if (status) q = q.eq('status', status);
      const { data, error } = await q.order('judgment_date', { ascending: false });
      if (error) this._throwIfSupabaseRequired('getDiscoveryQueue', error);
      return (Array.isArray(data) ? data : []) as CourtDiscoveryQueueItem[];
    }
    this._throwIfSupabaseRequired('getDiscoveryQueue', 'Supabase client not configured');
    return localDb.getDiscoveryQueue(courtCode, status);
  }
};
