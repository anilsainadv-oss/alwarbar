import { NextResponse } from 'next/server';
import { localDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = (searchParams.get('enrollment') || searchParams.get('q') || 'R/331/1977').trim();

    const normalize = (e: string) => e.toLowerCase().replace(/[\s\-_]/g, '/');
    const target = normalize(query);

    // Look for matching profile
    const profiles = localDb.getAdvocateProfiles();
    const matchedProfile = profiles.find(p => {
      if (p.bar_council_enrollment_no && normalize(p.bar_council_enrollment_no) === target) return true;
      if (p.user?.full_name && p.user.full_name.toLowerCase().includes(target)) return true;
      return false;
    });

    const enrollment = matchedProfile?.bar_council_enrollment_no || query;
    const cases = localDb.getCasesByEnrollment(enrollment);

    const courts = Array.from(new Set(cases.map(c => c.court_name)));

    return NextResponse.json({
      success: true,
      advocate: {
        name: matchedProfile?.user?.full_name || 'Sh. Rohitashwa Sain',
        enrollment: enrollment,
        bar_association: matchedProfile?.bar_association_name || 'District & Sessions Bar Association, Alwar (Judgeship: ALWAR)',
        chamber_address: matchedProfile?.chamber_address || 'Chamber No. 15, Senior Advocates Wing, District Court Campus, Alwar - 301001',
        court_practice_complex: matchedProfile?.court_practice_complex || 'District & Sessions Court, ADJ Courts, POCSO & Subordinate Courts, Alwar',
        experience_years: matchedProfile?.experience_years || 49
      },
      summary: {
        total_cases: cases.length,
        active_cases: cases.filter(c => c.status === 'active').length,
        courts_represented: courts.length,
        court_names: courts
      },
      cases: cases.map(c => ({
        id: c.id,
        case_title: c.case_title,
        case_number: c.case_number,
        cnr_number: c.cnr_number,
        court_name: c.court_name,
        case_type: c.case_type,
        petitioner_parties: c.petitioner_parties,
        respondent_parties: c.respondent_parties,
        filing_date: c.filing_date,
        next_hearing_date: c.next_hearing_date,
        stage_of_case: c.stage_of_case,
        status: c.status,
        official_ecourts_cnr_link: c.cnr_number
          ? `https://services.ecourts.gov.in/ecourtindia_v6/?p=casestatus/cnr_search&cnr=${encodeURIComponent(c.cnr_number.replace(/-/g, ''))}`
          : 'https://alwar.dcourts.gov.in/case-status-search-by-advocate/',
        official_alwar_search_link: 'https://alwar.dcourts.gov.in/case-status-search-by-advocate/'
      })),
      official_portal_info: {
        portal_name: 'District Court Alwar e-Courts Services',
        portal_url: 'https://alwar.dcourts.gov.in/case-status-search-by-advocate/',
        cause_list_url: 'https://alwar.dcourts.gov.in/cause-list/',
        court_orders_url: 'https://alwar.dcourts.gov.in/court-orders/'
      }
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error retrieving cases';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
