import { NextResponse } from 'next/server';
import { getCurrentUser, assertAuthenticated } from '@/lib/auth/guards';
import { rateLimiter } from '@/lib/security/rate-limit';
import { askLegalResearchAssistant, type ChatMessage } from '@/lib/legal-research/rag-engine';
import { legalResearchRepository } from '@/lib/db/repositories/legal-research';
import { z } from 'zod';
import type { CourtLevel, SearchFilters } from '@/types/legal-research';

const chatMessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().max(4000)
});

const assistantRequestSchema = z.object({
  query: z.string().min(2, 'प्रश्न कम से कम 2 अक्षरों का होना चाहिए (Query must be at least 2 characters)').max(2000),
  language: z.enum(['en', 'hi']).optional().default('en'),
  conversation_history: z.array(chatMessageSchema).optional(),
  case_id: z.string().optional().nullable(),
  court_level: z.enum(['Supreme Court', 'High Court', 'District Court', 'Tribunal', 'ALL']).optional(),
  year: z.string().regex(/^\d{4}$/).optional(),
  legal_subject: z.string().max(200).optional(),
  statute: z.string().max(200).optional()
});

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    assertAuthenticated(user);

    // Rate Limiting: 15 consultations per minute per advocate
    const limitCheck = rateLimiter.check(`ai_assistant_${user.id}`, 15, 60);
    if (!limitCheck.allowed) {
      return NextResponse.json(
        { error: 'एआई परामर्श दर सीमा पार (AI Assistant rate limit exceeded: 15 per minute). कृपया 1 मिनट बाद प्रयास करें।' },
        { status: 429, headers: { 'Retry-After': String(limitCheck.resetSeconds) } }
      );
    }

    const body = await req.json();
    const validated = assistantRequestSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0]?.message || 'Invalid request payload' },
        { status: 400 }
      );
    }

    const { query, language, conversation_history, court_level, year, legal_subject, statute } = validated.data;

    const filters: SearchFilters = {};
    if (court_level && court_level !== 'ALL') filters.court_level = court_level as CourtLevel;
    if (year) filters.year = year;
    if (legal_subject) filters.legal_subject = legal_subject;
    if (statute) filters.statute = statute;

    // Execute Ground-Truth RAG Assistant Pipeline
    const response = await askLegalResearchAssistant(query, {
      language,
      filters,
      conversationHistory: conversation_history as ChatMessage[]
    });

    // Record research history for authenticated lawyer (005_legal_research.sql)
    try {
      const retrievedIds = (response.relevant_judgments || []).map(j => j.id).filter((id): id is string => Boolean(id));
      await legalResearchRepository.recordHistory(
        user.id,
        query,
        response,
        retrievedIds,
        response.provider || 'gpt-4o'
      );
    } catch (histErr) {
      console.warn('Failed to record research history:', histErr);
    }

    return NextResponse.json({
      success: true,
      data: response
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Legal research assistant failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
