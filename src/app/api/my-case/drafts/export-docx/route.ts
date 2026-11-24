import { NextResponse } from 'next/server';
import { getCurrentUser, assertAuthenticated } from '@/lib/auth/guards';
import { exportDocxSchema } from '@/lib/validation/schemas';
import { generateLegalWordDocument } from '@/lib/docx/generator';
import { localDb } from '@/lib/db';
import { featureGate } from '@/lib/saas/feature-gate';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    assertAuthenticated(user);

    const json = await req.json();
    const parseResult = exportDocxSchema.safeParse(json);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.errors[0]?.message || 'Invalid export parameters' },
        { status: 400 }
      );
    }

    const { draftId, draftType, title, contentText, courtName, parties, language } = parseResult.data;

    // SaaS Feature Gate: Word export is available on Professional and Chamber plans
    const featureCheck = featureGate.hasFeatureAccess(user.id, 'has_docx_export');
    if (!featureCheck.allowed) {
      return NextResponse.json({ error: featureCheck.reason }, { status: 403 });
    }

    // Get advocate profile for formal signatures
    const profile = localDb.getAdvocateProfileByUserId(user.id);
    const advocateName = profile?.user?.full_name || user.full_name || 'Advocate';
    const enrollmentNo = profile?.bar_council_enrollment_no || 'R/_____/_____';
    const chamberAddress = profile?.chamber_address || 'Chamber No. ___, Bar Association, District Court, Alwar';

    const buffer = await generateLegalWordDocument({
      draftType,
      title,
      courtName: courtName || 'IN THE COURT OF DISTRICT & SESSIONS JUDGE, ALWAR (RAJ.)',
      petitioner: parties?.petitioner || 'Applicant / Accused',
      respondent: parties?.respondent || 'State of Rajasthan',
      contentText,
      language: language || 'en',
      advocateName,
      enrollmentNo,
      chamberAddress
    });

    const safeFilename = `${draftType.toLowerCase().replace(/[^a-z0-9_-]/g, '_')}_${Date.now()}.docx`;

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${safeFilename}"`,
        'Content-Length': String(buffer.length),
        'Cache-Control': 'no-store, max-age=0'
      }
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'DOCX Generation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
