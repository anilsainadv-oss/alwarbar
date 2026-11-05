import { NextResponse } from 'next/server';
import { localDb } from '@/lib/db';
import { getCurrentUser, assertPublicAdmin } from '@/lib/auth/guards';

export const dynamic = 'force-dynamic';

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length < 2) return [];

  const headerLine = lines[0];
  const delimiter = headerLine.includes('\t') ? '\t' : ',';

  const parseLine = (line: string): string[] => {
    const entries: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        entries.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    entries.push(current.trim());
    return entries;
  };

  const headers = parseLine(lines[0]).map(h => h.toLowerCase().replace(/[^a-z0-9_]/g, '_'));
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx] || '';
    });
    rows.push(row);
  }

  return rows;
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    assertPublicAdmin(user);

    const body = await req.json();
    let records: Array<{
      full_name: string;
      email?: string;
      phone?: string;
      bar_council_enrollment_no: string;
      bar_association_name?: string;
      chamber_address?: string;
      court_practice_complex?: string;
      practice_areas?: string[] | string;
      experience_years?: number | string;
      bio_hindi?: string;
      bio_english?: string;
      is_verified?: boolean | string;
    }> = [];

    if (Array.isArray(body.advocates)) {
      records = body.advocates;
    } else if (typeof body.csv_text === 'string' && body.csv_text.trim()) {
      const parsed = parseCSV(body.csv_text);
      records = parsed.map(r => ({
        full_name: r.full_name || r.name || r.advocate_name || '',
        bar_council_enrollment_no: r.bar_council_enrollment_no || r.enrollment_no || r.sanad_no || '',
        email: r.email || '',
        phone: r.phone || r.mobile || '',
        bar_association_name: r.bar_association_name || r.bar_association || '',
        chamber_address: r.chamber_address || r.chamber || '',
        court_practice_complex: r.court_practice_complex || r.court || '',
        practice_areas: r.practice_areas || r.specialization || '',
        experience_years: r.experience_years || r.experience || '5',
        bio_hindi: r.bio_hindi || '',
        bio_english: r.bio_english || '',
        is_verified: r.is_verified || r.verified || 'true'
      }));
    }

    if (records.length === 0) {
      return NextResponse.json({ 
        error: 'No valid advocate rows found. Please provide CSV data or JSON array of advocates.' 
      }, { status: 400 });
    }

    const result = localDb.bulkUpsertAdvocates(records, user.id);

    return NextResponse.json({
      success: true,
      message: `Successfully processed ${result.total} records: ${result.added} added, ${result.updated} updated.`,
      ...result
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unauthorized or Import Failed';
    return NextResponse.json({ error: message }, { status: 403 });
  }
}
