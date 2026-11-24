import type { CourtLevel } from '../../types/legal-research';

export interface ExtractedLegalMetadata {
  title?: string;
  case_number?: string;
  case_type?: string;
  bench?: 'Jodhpur' | 'Jaipur';
  citation?: string;
  alternate_citations: string[];
  court_name: string;
  court_level: CourtLevel;
  judgment_date?: string;
  judge_names?: string;
  parties?: string;
  legal_subject?: string;
  statutes?: string;
  summary?: string;
}

// Regex patterns for Indian legal citations
const CITATION_PATTERNS = [
  /\[?(\d{4}):RJ-(JP|JD):(\d+)-(DB|SB)\]?/i,               // [2026:RJ-JP:44204-DB] Official Rajasthan High Court Neutral Citation
  /\((\d{4})\)\s+(\d+)\s+SCC\s+(\d+)/i,                     // (2022) 10 SCC 51
  /AIR\s+(\d{4})\s+([A-Za-z\s]+)\s+(\d+)/i,                 // AIR 2022 SC 3386
  /(\d{4})\s+SCC\s+OnLine\s+([A-Za-z\s]+)\s+(\d+)/i,        // 2022 SCC OnLine SC 825
  /(\d{4})\s+LiveLaw\s+\(([A-Za-z\s]+)\)\s+(\d+)/i,         // 2022 LiveLaw (SC) 577
  /(\d{4})\s*\(\d+\)\s*RLR\s+(\d+)/i,                       // 2021 (3) RLR 512
  /(\d{4})\s*\(\d+\)\s*WLC(\s*\([A-Za-z\s]+\))?\s+(\d+)/i, // 2021 (1) WLC (Raj) 45
  /(\d{4})\s+INSC\s+(\d+)/i,                                // 2026 INSC 412
  /ILR\s*\((\d{4})\)\s+([A-Za-z\s]+)\s+(\d+)/i,             // ILR (2020) RAJ 88
  /(\d{4})\s+Cri\s*LJ\s+(\d+)/i,                            // 2020 Cri LJ 1234
  /Act\s+No\.\s+(\d+)\s+of\s+(\d{4})/i                      // Act No. 46 of 2023
];

// Month name map for Indian date formats
const MONTH_MAP: Record<string, string> = {
  jan: '01', january: '01',
  feb: '02', february: '02',
  mar: '03', march: '03',
  apr: '04', april: '04',
  may: '05',
  jun: '06', june: '06',
  jul: '07', july: '07',
  aug: '08', august: '08',
  sep: '09', september: '09',
  oct: '10', october: '10',
  nov: '11', november: '11',
  dec: '12', december: '12'
};

/**
 * Normalizes Indian date representations (e.g., "11th July, 2022", "11/07/2022", "2022-07-11") to ISO format YYYY-MM-DD
 */
export function normalizeIndianDate(rawDateStr: string): string | undefined {
  if (!rawDateStr) return undefined;
  const clean = rawDateStr.trim().replace(/(st|nd|rd|th),?/gi, '');

  // 1. ISO YYYY-MM-DD
  const isoMatch = clean.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (isoMatch) {
    const [, y, m, d] = isoMatch;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // 2. DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = clean.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (dmyMatch) {
    const [, d, m, y] = dmyMatch;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // 3. DD Month YYYY (e.g. 11 July 2022)
  const textDateMatch = clean.match(/(\d{1,2})\s+([A-Za-z]+)\s*,?\s*(\d{4})/);
  if (textDateMatch) {
    const [, d, monStr, y] = textDateMatch;
    const m = MONTH_MAP[monStr.toLowerCase().slice(0, 3)];
    if (m) {
      return `${y}-${m}-${d.padStart(2, '0')}`;
    }
  }

  return undefined;
}

/**
 * Scans text and extracts all matching legal citations
 */
export function extractCitations(text: string): { primary?: string; alternates: string[] } {
  const found: string[] = [];
  const seen = new Set<string>();

  for (const regex of CITATION_PATTERNS) {
    const globalRegex = new RegExp(regex.source, 'gi');
    let match: RegExpExecArray | null;
    while ((match = globalRegex.exec(text)) !== null) {
      const cit = match[0].trim();
      const norm = cit.replace(/\s+/g, ' ');
      if (!seen.has(norm.toLowerCase())) {
        seen.add(norm.toLowerCase());
        found.push(norm);
      }
    }
  }

  return {
    primary: found[0],
    alternates: found.slice(1)
  };
}

/**
 * Identifies court hierarchy and jurisdiction
 */
export function identifyCourt(text: string): { court_name: string; court_level: CourtLevel } {
  const lower = text.slice(0, 3000).toLowerCase();

  if (lower.includes('supreme court of india') || lower.includes('in the supreme court')) {
    return { court_name: 'Supreme Court of India', court_level: 'Supreme Court' };
  }

  if (
    lower.includes('rajasthan high court') ||
    lower.includes('high court of judicature for rajasthan') ||
    lower.includes('jaipur bench') ||
    lower.includes('jodhpur bench')
  ) {
    const bench = lower.includes('jaipur') ? ' (Jaipur Bench)' : lower.includes('jodhpur') ? ' (Jodhpur Bench)' : '';
    return { court_name: `High Court of Judicature for Rajasthan${bench}`, court_level: 'High Court' };
  }

  if (lower.includes('high court')) {
    const m = text.slice(0, 3000).match(/(High Court of [A-Za-z\s]+|High Court at [A-Za-z\s]+)/i);
    return { court_name: m ? m[0].trim() : 'High Court', court_level: 'High Court' };
  }

  if (lower.includes('district & sessions') || lower.includes('district and sessions') || lower.includes('district court')) {
    if (lower.includes('alwar')) {
      return { court_name: 'District & Sessions Court, Alwar', court_level: 'District Court' };
    }
    return { court_name: 'District & Sessions Court', court_level: 'District Court' };
  }

  if (lower.includes('tribunal') || lower.includes('nclt') || lower.includes('nclat') || lower.includes('mact')) {
    return { court_name: 'Special Tribunal / Appellate Tribunal', court_level: 'Tribunal' };
  }

  return { court_name: 'District & Sessions Court, Alwar', court_level: 'District Court' };
}

/**
 * Extracts judge names / Coram
 */
export function extractJudges(text: string): string | undefined {
  const slice = text.slice(0, 2500);

  // Look for Coram / Bench line
  const coramMatch = slice.match(/(?:CORAM|BENCH|BEFORE):\s*([^\n\r]+)/i);
  if (coramMatch && coramMatch[1].trim().length > 3) {
    return coramMatch[1].trim();
  }

  // Look for Hon'ble Justice patterns
  const justiceMatches = slice.match(/(?:Hon'ble\s+(?:Mr\.|Mrs\.|Ms\.|Justice)\s+[A-Za-z\s.,]+(?:\s+and\s+Hon'ble\s+[A-Za-z\s.,]+)?)/gi);
  if (justiceMatches && justiceMatches[0]) {
    return justiceMatches[0].trim().replace(/\s+/g, ' ');
  }

  return undefined;
}

/**
 * Extracts case title / adversarial parties
 */
export function extractCaseTitle(text: string): string | undefined {
  const slice = text.slice(0, 2000);

  // 1. Explicit Case Title line
  const explicit = slice.match(/(?:CASE TITLE|CAUSE TITLE):\s*([^\n\r]+)/i);
  if (explicit && explicit[1].trim().length > 5) {
    return explicit[1].trim();
  }

  // 2. Line-based search for "Party A ...Petitioner/Appellant" VERSUS "Party B ...Respondent/Defendant"
  const lines = slice.split('\n').map(l => l.trim()).filter(Boolean);
  let vsIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/^(?:VERSUS|Vs\.?|V\.)\s*$/i.test(lines[i]) || /^\.{2,}\s*(?:VERSUS|Vs\.?|V\.)/i.test(lines[i])) {
      vsIndex = i;
      break;
    }
  }

  if (vsIndex > 0 && vsIndex < lines.length - 1) {
    let p1 = lines[vsIndex - 1]
      .replace(/\.{2,}.*$/, '')
      .replace(/\s*(?:Appellants?|Petitioners?|Plaintiffs?|Applicants?|Accused)\s*$/i, '')
      .trim();
    let p2 = lines[vsIndex + 1]
      .replace(/\.{2,}.*$/, '')
      .replace(/\s*(?:Respondents?|Defendants?|Opposite\s+Part(?:y|ies))\s*$/i, '')
      .trim();

    // If p1 or p2 starts with non-party tokens (like CORAM or Date), clean them
    p1 = p1.replace(/^(?:CORAM|BENCH|BEFORE|DATED?|DECIDED ON):.*$/i, '').trim();

    if (p1.length > 2 && p2.length > 2) {
      return `${p1} v. ${p2}`;
    }
  }

  // 3. Multiline regex fallback
  const vsMatch = slice.match(/([A-Z][A-Za-z0-9\s.,&'\-()]+?)\s+(?:\.{2,}|\s+)(?:Appellant|Petitioner|Plaintiff|Applicant)?\s+(?:VERSUS|Vs\.?|V\.)\s+([A-Z][A-Za-z0-9\s.,&'\-()]+?)(?:\s+\.{2,}|\s+)(?:Respondent|Defendant|Opposite Party|State)/i);
  if (vsMatch) {
    const rawP1 = vsMatch[1].replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
    const rawP2 = vsMatch[2].replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
    const p1Lines = rawP1.split(/\s{2,}/);
    const p1 = p1Lines[p1Lines.length - 1].trim();
    if (p1.length > 2 && rawP2.length > 2) {
      return `${p1} v. ${rawP2}`;
    }
  }

  return undefined;
}

/**
 * Extracts key statutory provisions cited
 */
export function extractStatutes(text: string): string {
  const statutesFound = new Set<string>();

  // Look for section citations
  const secRegex = /(?:Section|Sec\.|Sections)\s+([0-9A-Za-z,\s\-and]+)\s+(?:of\s+the\s+)?(Bharatiya Nagarik Suraksha Sanhita|Bharatiya Nyaya Sanhita|Bharatiya Sakshya Adhiniyam|BNSS|BNS|BSA|Code of Criminal Procedure|CrPC|Indian Penal Code|IPC|Code of Civil Procedure|CPC|Indian Evidence Act|Evidence Act|Rajasthan Tenancy Act|Negotiable Instruments Act|NI Act|POCSO Act)/gi;
  let match: RegExpExecArray | null;

  while ((match = secRegex.exec(text)) !== null) {
    const sec = match[1].trim().replace(/\s+/g, ' ');
    const act = match[2].trim();
    statutesFound.add(`Section ${sec} of ${act}`);
  }

  // Standalone frequent Indian legal codes
  const standaloneCodes = [
    'Bharatiya Nagarik Suraksha Sanhita, 2023',
    'Bharatiya Nyaya Sanhita, 2023',
    'Bharatiya Sakshya Adhiniyam, 2023',
    'Rajasthan Tenancy Act, 1955',
    'Negotiable Instruments Act, 1881',
    'Protection of Children from Sexual Offences (POCSO) Act, 2012'
  ];
  for (const code of standaloneCodes) {
    if (text.toLowerCase().includes(code.toLowerCase())) {
      statutesFound.add(code);
    }
  }

  return Array.from(statutesFound).slice(0, 8).join('; ');
}

/**
 * Determines primary legal subject / category
 */
export function inferLegalSubject(text: string): string {
  const lower = text.toLowerCase();

  if (lower.includes('bail') || lower.includes('438 crpc') || lower.includes('439 crpc') || lower.includes('482 bnss') || lower.includes('anticipatory')) {
    return 'Criminal Law — Bail & Personal Liberty';
  }
  if (lower.includes('tenancy') || lower.includes('khatedar') || lower.includes('jamabandi') || lower.includes('rajasthan tenancy act') || lower.includes('partition')) {
    return 'Revenue & Land Law — Rajasthan Tenancy Act';
  }
  if (lower.includes('electronic evidence') || lower.includes('section 65b') || lower.includes('section 63') || lower.includes('bsa') || lower.includes('admissibility')) {
    return 'Law of Evidence — Electronic & Digital Records';
  }
  if (lower.includes('cheque') || lower.includes('dishonour') || lower.includes('138 ni act') || lower.includes('139 ni act')) {
    return 'Commercial & Banking — Cheque Dishonour (NI Act)';
  }
  if (lower.includes('injunction') || lower.includes('order 39') || lower.includes('cpc') || lower.includes('civil suit')) {
    return 'Civil Procedure — Temporary Injunctions & Original Suits';
  }
  if (lower.includes('motor accident') || lower.includes('mact') || lower.includes('compensation') || lower.includes('tribunal')) {
    return 'Torts & Motor Accident Claims (MACT)';
  }
  if (lower.includes('pocso') || lower.includes('sexual offences')) {
    return 'Criminal Law — POCSO & Child Protection';
  }

  return 'General Legal Jurisprudence';
}

/**
 * Unified Automated Metadata Extractor
 */
export function extractLegalMetadata(rawText: string): ExtractedLegalMetadata {
  const citations = extractCitations(rawText);
  const court = identifyCourt(rawText);
  const judges = extractJudges(rawText);
  const title = extractCaseTitle(rawText);
  const statutes = extractStatutes(rawText);
  const subject = inferLegalSubject(rawText);

  // Bench detection
  let bench: 'Jodhpur' | 'Jaipur' | undefined;
  if (/RJ-JP|Jaipur\s*Bench/i.test(rawText.slice(0, 2000))) {
    bench = 'Jaipur';
  } else if (/RJ-JD|Jodhpur|Principal\s*Seat/i.test(rawText.slice(0, 2000))) {
    bench = 'Jodhpur';
  }

  // Case Number & Case Type regex
  let caseNumber: string | undefined;
  let caseType: string | undefined;
  const caseNoMatch = rawText.slice(0, 3000).match(/(Criminal\s*Appeal|Bail\s*Application|Civil\s*Writ\s*Petition|Special\s*Leave\s*Petition|Criminal\s*Revision|S\.B\.\s*Civil\s*Writ\s*Petition|D\.B\.\s*Civil\s*Writ\s*Petition|D\.B\.\s*Civil\s*Reference|Civil\s*Reference|Suit|Execution\s*Petition)\s*(?:No\.?|Number)?\s*([0-9\/\-]+(?:\s*of\s*\d{4})?)/i);
  if (caseNoMatch) {
    caseType = caseNoMatch[1].trim();
    caseNumber = caseNoMatch[0].trim();
  }

  // Look for decision date
  let judgmentDate: string | undefined;
  const dateLineMatch = rawText.slice(0, 3000).match(/(?:Dated|Date of Decision|Decided on|Judgment Date):\s*([^\n\r]+)/i);
  if (dateLineMatch) {
    judgmentDate = normalizeIndianDate(dateLineMatch[1]);
  }

  return {
    title: title || 'In re Legal Proceedings',
    case_number: caseNumber,
    case_type: caseType,
    bench,
    citation: citations.primary || 'Unreported Legal Precedent',
    alternate_citations: citations.alternates,
    court_name: court.court_name,
    court_level: court.court_level,
    judgment_date: judgmentDate || new Date().toISOString().slice(0, 10),
    judge_names: judges,
    legal_subject: subject,
    statutes: statutes || undefined
  };
}
