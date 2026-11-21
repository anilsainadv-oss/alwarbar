import { NextResponse } from 'next/server';
import { getCurrentUser, assertPublicAdmin } from '@/lib/auth/guards';
import { 
  searchRajasthanHighCourt, 
  importRajasthanJudgmentByUrl, 
  importRajasthanJudgmentFromBuffer 
} from '@/lib/court-scrapers/rajasthan-high-court';
import { 
  searchSupremeCourt, 
  importSupremeCourtJudgmentByUrl, 
  importSupremeCourtJudgmentFromBuffer 
} from '@/lib/court-scrapers/supreme-court';
import { runAutomatedCourtIngestion } from '@/lib/legal-research/court-crawler';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const searchSchema = z.object({
  court: z.enum(['rajasthan_high_court', 'supreme_court']),
  // Rajasthan HC params
  bench: z.enum(['Jaipur', 'Jodhpur', 'All']).optional(),
  caseType: z.string().optional(),
  partyName: z.string().optional(),
  advocateName: z.string().optional(),
  judgeName: z.string().optional(),
  decisionType: z.enum(['Judgment', 'Order', 'All']).optional(),
  reportableOnly: z.boolean().optional(),
  citationNumber: z.string().optional(),
  rjjpNumber: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  // Supreme Court params
  diaryNumber: z.string().optional(),
  caseNumber: z.string().optional(),
  freeText: z.string().optional(),
  neutralCitation: z.string().optional(),
  limit: z.number().optional()
});

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    assertPublicAdmin(user);

    const contentType = req.headers.get('content-type') || '';

    // Handle Multipart PDF File Upload directly from Admin
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      const court = String(formData.get('court') || 'rajasthan_high_court');
      const title = String(formData.get('title') || '').trim();
      const citation = String(formData.get('citation') || '').trim();
      const caseNumber = String(formData.get('case_number') || '').trim();
      const judgmentDate = String(formData.get('judgment_date') || '').trim();
      const bench = (formData.get('bench') as any) || 'Jaipur';
      const judgeNamesStr = String(formData.get('judge_names') || '').trim();
      const partiesStr = String(formData.get('parties') || '').trim();

      if (!file) {
        return NextResponse.json({ error: 'Original PDF file is required' }, { status: 400 });
      }

      if (!title || !citation) {
        return NextResponse.json({ error: 'Case title and citation are required' }, { status: 400 });
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const judgeNames = judgeNamesStr ? judgeNamesStr.split(',').map(s => s.trim()) : undefined;
      const parties = partiesStr ? partiesStr.split(' v. ').map(s => s.trim()) : undefined;

      let doc;
      if (court === 'supreme_court') {
        doc = await importSupremeCourtJudgmentFromBuffer({
          buffer,
          filename: file.name,
          title,
          citation,
          caseNumber,
          judgmentDate,
          judgeNames,
          parties,
          adminUserId: user.id
        });
      } else {
        doc = await importRajasthanJudgmentFromBuffer({
          buffer,
          filename: file.name,
          title,
          citation,
          caseNumber,
          bench: bench === 'Jodhpur' ? 'Jodhpur' : 'Jaipur',
          judgmentDate,
          judgeNames,
          parties,
          adminUserId: user.id
        });
      }

      return NextResponse.json({
        success: true,
        message: `Original PDF successfully verified, uploaded to Cloudflare R2, text extracted, and queued in Pending Admin Approval.`,
        document: doc
      });
    }

    // Handle JSON search or URL import queries
    const body = await req.json();

    // 1. Search Action
    if (body.action === 'search_court') {
      const parseResult = searchSchema.safeParse(body.params || {});
      if (!parseResult.success) {
        return NextResponse.json(
          { error: parseResult.error.errors[0]?.message || 'Invalid search parameters' },
          { status: 400 }
        );
      }

      const params = parseResult.data;
      if (params.court === 'supreme_court') {
        const results = await searchSupremeCourt({
          diaryNumber: params.diaryNumber,
          caseNumber: params.caseNumber,
          judgeName: params.judgeName,
          judgmentDateFrom: params.dateFrom,
          judgmentDateTo: params.dateTo,
          freeText: params.freeText,
          neutralCitation: params.neutralCitation,
          limit: params.limit || 20
        });
        return NextResponse.json({ ...results });
      } else {
        const results = await searchRajasthanHighCourt({
          bench: params.bench || 'Jaipur',
          dateFrom: params.dateFrom,
          dateTo: params.dateTo,
          caseType: params.caseType,
          partyName: params.partyName,
          advocateName: params.advocateName,
          judgeName: params.judgeName,
          decisionType: params.decisionType,
          reportableOnly: params.reportableOnly,
          citationNumber: params.citationNumber,
          rjjpNumber: params.rjjpNumber,
          limit: params.limit || 20
        });
        return NextResponse.json({ ...results });
      }
    }

    // 2. URL Import Action
    if (body.action === 'import_by_url') {
      const { court, pdfUrl, title, citation, caseNumber, bench, judgmentDate, judgeNames } = body;
      if (!pdfUrl || !title || !citation) {
        return NextResponse.json(
          { error: 'pdfUrl, title, and citation are required for URL import' },
          { status: 400 }
        );
      }

      let doc;
      if (court === 'supreme_court') {
        doc = await importSupremeCourtJudgmentByUrl({
          pdfUrl,
          title,
          citation,
          caseNumber,
          judgmentDate,
          judgeNames,
          adminUserId: user.id
        });
      } else {
        doc = await importRajasthanJudgmentByUrl({
          pdfUrl,
          title,
          citation,
          caseNumber,
          bench: bench === 'Jodhpur' ? 'Jodhpur' : 'Jaipur',
          judgmentDate,
          judgeNames,
          adminUserId: user.id
        });
      }

      return NextResponse.json({
        success: true,
        message: `Retrieved court copy from URL, verified SHA-256, uploaded to R2, extracted text, and placed in Pending Approval.`,
        document: doc
      });
    }

    // 3. Automated Daily Court Ingestion Action
    if (body.action === 'auto_sync_daily') {
      const autoPublish = body.autoPublish === true; // Mandatory default: FALSE. No automatic publication permitted!
      const court = body.court || 'all';
      const syncResult = await runAutomatedCourtIngestion({
        court,
        autoPublish,
        autoVerify: autoPublish,
        triggeredBy: user.email
      });
      return NextResponse.json(syncResult);
    }

    return NextResponse.json({ error: 'Unrecognized action' }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Court collection failed';
    const statusCode = message.includes('Unauthorized') || message.includes('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}
