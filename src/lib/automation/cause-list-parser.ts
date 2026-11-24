import type { CauseListEntry } from '@/types/mycase';

export interface ParsedCauseList {
  courtName: string;
  judgeName?: string;
  causeListDate: string;
  totalEntries: number;
  entries: Omit<CauseListEntry, 'id' | 'created_at'>[];
}

/**
 * Robust Cause List Text & Dump Parser for District & Sessions Court, Alwar.
 * Supports:
 *  1. e-Courts Tabular copy-paste dumps
 *  2. Standard text format: Item No, Case Type/Number, Parties, Advocates, Stage
 *  3. CNR number detection (e.g., RJAL010012342026 or RJAL01-001234-2026)
 */
export function parseCauseListText(rawText: string, defaultCourtName: string = 'District & Sessions Court, Alwar', defaultDate?: string): ParsedCauseList {
  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
  
  // 1. Detect Court Name & Date if in header
  let detectedCourt = defaultCourtName;
  let detectedDate = defaultDate || new Date().toISOString().split('T')[0];
  let detectedJudge = '';

  for (let i = 0; i < Math.min(10, lines.length); i++) {
    const l = lines[i];
    if (l.toUpperCase().includes('COURT OF') || l.toUpperCase().includes('JUDGESHIP')) {
      detectedCourt = l;
    }
    if (l.toUpperCase().includes('SH.') || l.toUpperCase().includes('SRI') || l.toUpperCase().includes('JUSTICE') || l.toUpperCase().includes('JUDGE:')) {
      detectedJudge = l.replace(/.*(?:JUDGE|OFFICER):?\s*/i, '');
    }
    const dateMatch = l.match(/(\d{1,2}[./-]\d{1,2}[./-]\d{4}|\d{4}-\d{2}-\d{2})/);
    if (dateMatch) {
      // Normalize to YYYY-MM-DD
      const rawDate = dateMatch[1];
      if (rawDate.includes('-') && rawDate.length === 10 && rawDate.startsWith('20')) {
        detectedDate = rawDate;
      } else {
        const parts = rawDate.split(/[./-]/);
        if (parts.length === 3) {
          const day = parts[0].padStart(2, '0');
          const month = parts[1].padStart(2, '0');
          const year = parts[2];
          detectedDate = `${year}-${month}-${day}`;
        }
      }
    }
  }

  const entries: Omit<CauseListEntry, 'id' | 'created_at'>[] = [];
  let currentItemNo = 1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if line starts with an item number e.g. "1.", "1)", "1\t" or contains case pattern
    const itemMatch = line.match(/^(\d+)[\.\)\s\t]+(.*)/);
    const caseMatch = line.match(/(?:CIS|Suit|Case|App|FIR|BAIL|Cr|Civ|Rev)\s*(?:No\.?)?\s*[:\s]?\s*([A-Za-z0-9\/\-_]+)/i);
    const cnrMatch = line.match(/\b([A-Z]{4}\d{12}|[A-Z]{4}\d{2}-\d{6}-\d{4})\b/i);

    if (itemMatch || caseMatch || line.toLowerCase().includes(' vs ') || line.toLowerCase().includes(' बनाम ')) {
      let itemNum = currentItemNo;
      let lineRemainder = line;

      if (itemMatch) {
        itemNum = parseInt(itemMatch[1], 10);
        lineRemainder = itemMatch[2];
      }

      // Extract CNR if available
      const cnr = cnrMatch ? cnrMatch[1] : undefined;

      // Extract parties (e.g. "Mukesh vs State" or "A Vs. B")
      let parties = 'State / Contesting Parties';
      const vsMatch = lineRemainder.match(/(.*?)\s+(?:vs\.?|versus|बनाम)\s+(.*)/i);
      if (vsMatch) {
        parties = `${vsMatch[1].trim()} v. ${vsMatch[2].trim()}`;
      } else {
        parties = lineRemainder.slice(0, 100);
      }

      // Extract case number
      let caseNum = `Matter ${itemNum}/${new Date().getFullYear()}`;
      if (caseMatch) {
        caseNum = caseMatch[1];
      } else if (cnr) {
        caseNum = `CNR: ${cnr}`;
      }

      // Extract purpose / stage
      let stage = 'Hearing / Regular Proceedings';
      const stageKeywords = ['Bail', 'Stay', 'Arguments', 'Evidence', 'Framing of Issues', 'Reply', 'Order', 'Judgment', 'Summons', 'Appearance'];
      for (const kw of stageKeywords) {
        if (lineRemainder.toLowerCase().includes(kw.toLowerCase())) {
          stage = kw;
          break;
        }
      }

      // Extract advocate name if present
      let petAdv = '';
      let respAdv = '';
      if (lineRemainder.toLowerCase().includes('adv')) {
        const advMatch = lineRemainder.match(/adv[:\s]+([A-Za-z\s]+)/i);
        if (advMatch) petAdv = advMatch[1].trim();
      }

      entries.push({
        court_name: detectedCourt,
        judge_name: detectedJudge || undefined,
        cause_list_date: detectedDate,
        item_number: itemNum,
        case_number: caseNum,
        cnr_number: cnr,
        case_type: caseNum.includes('Bail') ? 'Bail Matter' : (caseNum.includes('Civil') ? 'Civil Suit' : 'Regular Trial'),
        parties,
        petitioner_advocate: petAdv || undefined,
        respondent_advocate: respAdv || undefined,
        stage_or_purpose: stage
      });

      currentItemNo = itemNum + 1;
    }
  }

  // If no lines matched strict pattern, provide a clean fallback entry if raw text exists
  if (entries.length === 0 && rawText.trim().length > 10) {
    entries.push({
      court_name: detectedCourt,
      judge_name: detectedJudge || undefined,
      cause_list_date: detectedDate,
      item_number: 1,
      case_number: 'Imported Docket Entry 1',
      case_type: 'Court Cause List',
      parties: rawText.slice(0, 80),
      stage_or_purpose: 'Regular Hearing'
    });
  }

  return {
    courtName: detectedCourt,
    judgeName: detectedJudge || undefined,
    causeListDate: detectedDate,
    totalEntries: entries.length,
    entries
  };
}
