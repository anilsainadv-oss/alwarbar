import { NextResponse } from 'next/server';
import { getCurrentUser, assertAuthenticated } from '@/lib/auth/guards';
import { rateLimiter } from '@/lib/security/rate-limit';
import { aiChatSchema } from '@/lib/validation/schemas';
import { chatRepository, caseRepository } from '@/lib/db/repositories';
import { legalAI } from '@/lib/ai/provider';
import { featureGate } from '@/lib/saas/feature-gate';
import type { AIChatMessage } from '@/types/mycase';

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    assertAuthenticated(user);

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');
    const caseId = searchParams.get('caseId') || undefined;

    if (sessionId) {
      const session = await chatRepository.getSessionById(user.id, sessionId);
      if (!session) {
        return NextResponse.json({ error: 'Chat session not found' }, { status: 404 });
      }
      return NextResponse.json({ session });
    }

    const sessions = await chatRepository.getSessions(user.id, caseId);
    const usage = await chatRepository.getUsage(user.id);

    return NextResponse.json({ sessions, usage });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unauthorized';
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    assertAuthenticated(user);

    // AI rate limiting: 15 queries per minute per advocate
    const limitCheck = rateLimiter.check(`ai_query_${user.id}`, 15, 60);
    if (!limitCheck.allowed) {
      return NextResponse.json(
        { error: 'AI दर सीमा पार (Rate limit exceeded: 15 queries per minute). कृपया 1 मिनट बाद प्रयास करें।' },
        { status: 429, headers: { 'Retry-After': String(limitCheck.resetSeconds) } }
      );
    }

    // SaaS Plan AI Quota Check
    const planQuota = featureGate.canRunAIQuery(user.id);
    if (!planQuota.allowed) {
      return NextResponse.json({ error: planQuota.reason }, { status: 403 });
    }

    // Usage budget limit check (500,000 tokens per advocate)
    const currentUsage = await chatRepository.getUsage(user.id);
    const MAX_MONTHLY_TOKENS = 500000;
    if (currentUsage.totalTokens >= MAX_MONTHLY_TOKENS) {
      return NextResponse.json(
        { 
          error: `मासिक एआई टोकन कोटा समाप्त (Monthly token limit of ${MAX_MONTHLY_TOKENS.toLocaleString()} tokens reached). To prevent unexpected charges, consultation is throttled.`,
          usage: currentUsage 
        },
        { status: 429 }
      );
    }

    const json = await req.json();
    const parseResult = aiChatSchema.safeParse(json);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.errors[0]?.message || 'Invalid chat parameters' },
        { status: 400 }
      );
    }

    const { sessionId, caseId, message, language = 'en' } = parseResult.data;

    let activeSession = sessionId ? await chatRepository.getSessionById(user.id, sessionId) : null;
    
    // If no existing session or invalid ID, create a new one
    if (!activeSession) {
      const title = message.length > 40 ? `${message.slice(0, 40)}...` : message;
      activeSession = await chatRepository.createSession(user.id, {
        case_id: caseId,
        title
      });
    }

    // Retrieve case context if attached
    let caseContext;
    const targetCaseId = caseId || activeSession.case_id;
    if (targetCaseId) {
      const caseRecord = await caseRepository.getCaseById(user.id, targetCaseId);
      if (caseRecord) {
        caseContext = {
          caseTitle: caseRecord.case_title,
          caseType: caseRecord.case_type,
          court: caseRecord.court_name,
          facts: caseRecord.private_notes
        };
      }
    }

    // Construct full multi-turn conversation history
    const conversationHistory = [
      ...activeSession.messages.map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: message }
    ];

    // Call Legal AI Service
    const aiResult = await legalAI.chatConsultation(conversationHistory, caseContext, language);

    // Save user message
    const userMessage: AIChatMessage = {
      id: 'msg-' + crypto.randomUUID(),
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
      tokens: aiResult.tokens.promptTokens
    };
    await chatRepository.appendMessage(user.id, activeSession.id, userMessage);

    // Save assistant message
    const assistantMessage: AIChatMessage = {
      id: 'msg-' + crypto.randomUUID(),
      role: 'assistant',
      content: aiResult.content,
      timestamp: new Date().toISOString(),
      tokens: aiResult.tokens.completionTokens,
      costEstimateINR: aiResult.costEstimateINR
    };
    const updatedSession = await chatRepository.appendMessage(user.id, activeSession.id, assistantMessage);

    return NextResponse.json({
      success: true,
      session: updatedSession,
      userMessage,
      assistantMessage,
      result: aiResult
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'AI Chat consultation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getCurrentUser();
    assertAuthenticated(user);

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    const deleted = await chatRepository.deleteSession(user.id, sessionId);
    return NextResponse.json({ success: deleted });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Delete failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
