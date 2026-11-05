import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

interface AdvocateDuesRecord {
  s_no: number;
  enrol_no: string;
  elc_no: string;
  name: string;
  due_subs: string;
  ltm_subs: string;
  category: 'ltm' | 'dues_pending' | 'na' | 'termi' | 'other';
  bar?: string;
}

interface DuesFileStructure {
  title?: string;
  issuing_authority?: string;
  judgeship?: string;
  bar_name: string;
  bar_slug?: string;
  report_date: string;
  total_advocates?: number;
  summary: {
    total: number;
    ltm_count: number;
    na_count: number;
    dues_pending_count: number;
    termi_count: number;
  };
  pdf_download_url?: string;
  records: AdvocateDuesRecord[];
}

const barCache: Record<string, DuesFileStructure> = {};
let cachedMasterSummary: Record<string, {
  bar_name: string;
  bar_slug: string;
  total_advocates: number;
  ltm_count: number;
  dues_pending_count: number;
  na_count: number;
  termi_count: number;
  pdf_download_url: string;
}> | null = null;

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function loadMasterSummary() {
  if (cachedMasterSummary) return cachedMasterSummary;
  const candidatePaths = [
    path.join(process.cwd(), 'data', 'alwar-bars-dues-summary.json'),
    'C:\\alwar-advocates\\data\\alwar-bars-dues-summary.json'
  ];
  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      try {
        const raw = fs.readFileSync(p, 'utf-8');
        cachedMasterSummary = JSON.parse(raw);
        return cachedMasterSummary;
      } catch (e) {
        console.error('Error loading master summary from', p, e);
      }
    }
  }
  return null;
}

function loadBarDuesData(barName: string): DuesFileStructure | null {
  const normBar = barName.trim().toUpperCase();
  const slug = slugify(normBar);

  if (barCache[slug]) return barCache[slug];

  const candidatePaths = [
    path.join(process.cwd(), 'data', 'bars', `${slug}.json`),
    `C:\\alwar-advocates\\data\\bars\\${slug}.json`,
    path.join(process.cwd(), 'data', 'bcr-alwar-dues.json'),
    'C:\\alwar-advocates\\data\\bcr-alwar-dues.json'
  ];

  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      try {
        const raw = fs.readFileSync(p, 'utf-8');
        const parsed = JSON.parse(raw);
        barCache[slug] = parsed;
        return parsed;
      } catch (e) {
        console.error(`Error loading bar dues from ${p}:`, e);
      }
    }
  }

  return null;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || '').trim().toLowerCase();
    const category = (searchParams.get('category') || 'ALL').toLowerCase();
    const bar = (searchParams.get('bar') || 'ALWAR').trim().toUpperCase();
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(10, parseInt(searchParams.get('limit') || '25', 10)));

    const masterSummary = loadMasterSummary();
    const duesData = loadBarDuesData(bar);

    if (!duesData) {
      return NextResponse.json(
        { error: `BCR Dues data for ${bar} is currently unavailable.` },
        { status: 404 }
      );
    }

    // Filter records
    let filtered = duesData.records || [];

    // Category filter
    if (category && category !== 'all') {
      filtered = filtered.filter((r) => r.category.toLowerCase() === category);
    }

    // Text search filter (Sanad / Enrol No, Electoral Roll No, Name)
    if (q) {
      filtered = filtered.filter((r) => {
        const enrol = (r.enrol_no || '').toLowerCase();
        const name = (r.name || '').toLowerCase();
        const elc = (r.elc_no || '').toLowerCase();
        return enrol.includes(q) || name.includes(q) || elc.includes(q);
      });
    }

    const totalMatching = filtered.length;
    const totalPages = Math.ceil(totalMatching / limit) || 1;
    const currentPage = Math.min(page, totalPages);
    const startIndex = (currentPage - 1) * limit;
    const paginatedRecords = filtered.slice(startIndex, startIndex + limit);

    const slug = slugify(bar);
    const pdfUrl = duesData.pdf_download_url || 
      (fs.existsSync(path.join(process.cwd(), 'public', 'downloads', `bcr-dues-${slug}.pdf`))
        ? `/downloads/bcr-dues-${slug}.pdf`
        : (bar === 'ALWAR' ? '/downloads/bcr-alwar-rawf-dues-list.pdf' : '/downloads/bcr-alwar-rawf-dues-list.pdf'));

    return NextResponse.json({
      success: true,
      judgeship: 'ALWAR',
      bar_name: bar,
      bar_slug: slug,
      is_alwar_central: bar === 'ALWAR',
      report_title: duesData.title || `Complete List of Advocates Due Subscription of R.A.W.F. at ${bar} in Alwar Judgeship`,
      issuing_authority: duesData.issuing_authority || 'Bar Council of Rajasthan, High Court Campus, Jodhpur',
      report_date: duesData.report_date || '01-11-2026',
      summary: duesData.summary,
      all_bars_summary: masterSummary,
      total_matching: totalMatching,
      page: currentPage,
      total_pages: totalPages,
      limit: limit,
      records: paginatedRecords,
      pdf_download_url: pdfUrl
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
