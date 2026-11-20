import { NextResponse } from 'next/server';
import { getCurrentUser, assertAuthenticated } from '@/lib/auth/guards';
import { rateLimiter } from '@/lib/security/rate-limit';
import { legalResearchRepository } from '@/lib/db/repositories/legal-research';
import { searchLegalDocumentsSchema } from '@/lib/validation/schemas';
import { classifyLegalQuery, highlightMatchedSnippet } from '@/lib/legal-research/query-classifier';
import type { CourtLevel, SearchFilters } from '@/types/legal-research';

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    assertAuthenticated(user);

    // Rate Limiting: 30 searches per minute per advocate
    const limitCheck = rateLimiter.check(`search_${user.id}`, 30, 60);
    if (!limitCheck.allowed) {
      return NextResponse.json(
        { error: 'खोज दर सीमा पार (Search rate limit exceeded: 30 per minute). कृपया थोड़ी देर प्रतीक्षा करें।' },
        { status: 429, headers: { 'Retry-After': String(limitCheck.resetSeconds) } }
      );
    }

    const { searchParams } = new URL(req.url);
    const rawQuery = searchParams.get('q') || searchParams.get('query') || '';
    if (!rawQuery || rawQuery.trim().length < 2) {
      return NextResponse.json(
        { error: 'खोज प्रश्न कम से कम 2 अक्षरों का होना चाहिए (Query must be at least 2 characters).' },
        { status: 400 }
      );
    }

    const court_level = searchParams.get('court_level') as CourtLevel | 'ALL' | undefined;
    const court_name = searchParams.get('court_name') || undefined;
    const year = searchParams.get('year') || undefined;
    const legal_subject = searchParams.get('legal_subject') || undefined;
    const statute = searchParams.get('statute') || undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 15;

    const validated = searchLegalDocumentsSchema.safeParse({
      query: rawQuery,
      court_level: court_level || undefined,
      court_name,
      year,
      legal_subject,
      statute,
      limit
    });

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0]?.message || 'अमान्य खोज फ़िल्टर (Invalid search filters)' },
        { status: 400 }
      );
    }

    // 1. Query Intent Classification
    const classified = classifyLegalQuery(validated.data.query);

    // 2. Merge Filters
    const mergedFilters: SearchFilters = {
      ...classified.suggested_filters,
      ...(validated.data.court_level && validated.data.court_level !== 'ALL' ? { court_level: validated.data.court_level } : {}),
      ...(validated.data.court_name ? { court_name: validated.data.court_name } : {}),
      ...(validated.data.year ? { year: validated.data.year } : {}),
      ...(validated.data.legal_subject ? { legal_subject: validated.data.legal_subject } : {}),
      ...(validated.data.statute ? { statute: validated.data.statute } : {})
    };

    // 3. Execute Hybrid Vector + Keyword Search
    const results = await legalResearchRepository.searchHybrid(
      classified.clean_query,
      mergedFilters,
      validated.data.limit
    );

    // 4. Enrich results with highlighted snippets
    const enrichedResults = results.map(r => ({
      ...r,
      highlighted_snippet: highlightMatchedSnippet(r.snippet, classified.search_terms)
    }));

    // 5. Facet Aggregations
    const courtLevels: Record<string, number> = {};
    const years: Record<string, number> = {};
    const subjects: Record<string, number> = {};

    for (const r of results) {
      if (r.court_level) {
        courtLevels[r.court_level] = (courtLevels[r.court_level] || 0) + 1;
      }
      if (r.judgment_date) {
        const y = r.judgment_date.slice(0, 4);
        years[y] = (years[y] || 0) + 1;
      }
      if (r.legal_subject) {
        subjects[r.legal_subject] = (subjects[r.legal_subject] || 0) + 1;
      }
    }

    return NextResponse.json({
      success: true,
      query: classified.clean_query,
      intent: classified.intent,
      detected_citation: classified.detected_citation,
      detected_statute: classified.detected_statute,
      total_results: enrichedResults.length,
      filters: mergedFilters,
      facets: {
        court_levels: courtLevels,
        years,
        subjects
      },
      results: enrichedResults
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Legal research search failed';
    if (message.includes('UNAUTHORIZED')) {
      return NextResponse.json({ error: 'अनधिकृत पहुंच (Unauthorized): कृपया अधिवक्ता खाते में लॉगिन करें।' }, { status: 401 });
    }
    if (message.includes('FORBIDDEN')) {
      return NextResponse.json({ error: 'निषिद्ध पहुंच (Forbidden): केवल पंजीकृत अधिवक्ताओं के लिए उपलब्ध।' }, { status: 403 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    assertAuthenticated(user);

    const limitCheck = rateLimiter.check(`search_${user.id}`, 30, 60);
    if (!limitCheck.allowed) {
      return NextResponse.json(
        { error: 'खोज दर सीमा पार (Search rate limit exceeded). कृपया थोड़ी देर प्रतीक्षा करें।' },
        { status: 429, headers: { 'Retry-After': String(limitCheck.resetSeconds) } }
      );
    }

    const body = await req.json();
    const validated = searchLegalDocumentsSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0]?.message || 'अमान्य खोज पैरामीटर' },
        { status: 400 }
      );
    }

    const classified = classifyLegalQuery(validated.data.query);

    const mergedFilters: SearchFilters = {
      ...classified.suggested_filters,
      ...(validated.data.court_level && validated.data.court_level !== 'ALL' ? { court_level: validated.data.court_level } : {}),
      ...(validated.data.court_name ? { court_name: validated.data.court_name } : {}),
      ...(validated.data.year ? { year: validated.data.year } : {}),
      ...(validated.data.legal_subject ? { legal_subject: validated.data.legal_subject } : {}),
      ...(validated.data.statute ? { statute: validated.data.statute } : {})
    };

    const results = await legalResearchRepository.searchHybrid(
      classified.clean_query,
      mergedFilters,
      validated.data.limit
    );

    const enrichedResults = results.map(r => ({
      ...r,
      highlighted_snippet: highlightMatchedSnippet(r.snippet, classified.search_terms)
    }));

    const courtLevels: Record<string, number> = {};
    const years: Record<string, number> = {};
    const subjects: Record<string, number> = {};

    for (const r of results) {
      if (r.court_level) {
        courtLevels[r.court_level] = (courtLevels[r.court_level] || 0) + 1;
      }
      if (r.judgment_date) {
        const y = r.judgment_date.slice(0, 4);
        years[y] = (years[y] || 0) + 1;
      }
      if (r.legal_subject) {
        subjects[r.legal_subject] = (subjects[r.legal_subject] || 0) + 1;
      }
    }

    return NextResponse.json({
      success: true,
      query: classified.clean_query,
      intent: classified.intent,
      detected_citation: classified.detected_citation,
      detected_statute: classified.detected_statute,
      total_results: enrichedResults.length,
      filters: mergedFilters,
      facets: {
        court_levels: courtLevels,
        years,
        subjects
      },
      results: enrichedResults
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Legal research search failed';
    if (message.includes('UNAUTHORIZED')) {
      return NextResponse.json({ error: 'अनधिकृत पहुंच (Unauthorized): कृपया अधिवक्ता खाते में लॉगिन करें।' }, { status: 401 });
    }
    if (message.includes('FORBIDDEN')) {
      return NextResponse.json({ error: 'निषिद्ध पहुंच (Forbidden): केवल पंजीकृत अधिवक्ताओं के लिए उपलब्ध।' }, { status: 403 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
