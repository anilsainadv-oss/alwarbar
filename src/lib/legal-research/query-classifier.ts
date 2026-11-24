import type { CourtLevel, SearchFilters } from '../../types/legal-research';

export type QueryIntent = 'citation_lookup' | 'statute_search' | 'case_name_search' | 'conceptual_semantic';

export interface ClassifiedQuery {
  raw_query: string;
  clean_query: string;
  intent: QueryIntent;
  detected_citation?: string;
  detected_statute?: string;
  detected_court?: CourtLevel;
  suggested_filters: SearchFilters;
  search_terms: string[];
}

const CITATION_REGEX = /\[?(\d{4}):RJ-(JP|JD):(\d+)-(DB|SB)\]?|\((\d{4})\)\s+(\d+)\s+SCC\s+(\d+)|AIR\s+(\d{4})\s+([A-Za-z\s]+)\s+(\d+)|(\d{4})\s+SCC\s+OnLine\s+([A-Za-z\s]+)\s+(\d+)|(\d{4})\s+LiveLaw\s+\(([A-Za-z\s]+)\)\s+(\d+)|(\d{4})\s*\(\d+\)\s*RLR\s+(\d+)|(\d{4})\s*\(\d+\)\s*WLC(\s*\([A-Za-z\s]+\))?\s+(\d+)|(\d{4})\s+INSC\s+(\d+)|ILR\s*\((\d{4})\)\s+([A-Za-z\s]+)\s+(\d+)/i;

const STATUTE_KEYWORDS = [
  'section', 'sec', 'sec.', 'u/s', 'under section', 'dhara', 'धारा',
  'bnss', 'bns', 'bsa', 'crpc', 'ipc', 'cpc', 'evidence act',
  'rajasthan tenancy act', 'rta', 'ni act', 'pocso', 'mact'
];

/**
 * Classifies legal query intent and extracts structured parameters
 */
export function classifyLegalQuery(query: string): ClassifiedQuery {
  const clean = (query || '').trim();
  const lower = clean.toLowerCase();

  const suggestedFilters: SearchFilters = {};

  // Court jurisdiction check across all intents
  let detectedCourt: CourtLevel | undefined;
  if (lower.includes('supreme court') || lower.includes('apex court')) {
    detectedCourt = 'Supreme Court';
    suggestedFilters.court_level = 'Supreme Court';
  } else if (lower.includes('high court') || lower.includes('hcraj') || lower.includes('jaipur bench') || lower.includes('jodhpur bench')) {
    detectedCourt = 'High Court';
    suggestedFilters.court_level = 'High Court';
  } else if (lower.includes('district court') || lower.includes('sessions court') || lower.includes('alwar')) {
    detectedCourt = 'District Court';
    suggestedFilters.court_level = 'District Court';
  }

  // 1. Check for Direct Citation Lookup
  const citMatch = clean.match(CITATION_REGEX);
  if (citMatch) {
    const primary = citMatch[0].trim();
    if (/RJ-(JP|JD)/i.test(primary)) {
      detectedCourt = 'High Court';
      suggestedFilters.court_level = 'High Court';
    } else if (/INSC/i.test(primary)) {
      detectedCourt = 'Supreme Court';
      suggestedFilters.court_level = 'Supreme Court';
    }
    return {
      raw_query: query,
      clean_query: clean,
      intent: 'citation_lookup',
      detected_citation: primary,
      detected_court: detectedCourt,
      suggested_filters: suggestedFilters,
      search_terms: [primary.toLowerCase()]
    };
  }

  // 2. Check for Statute / Section Search
  const hasStatuteKeyword = STATUTE_KEYWORDS.some(kw => lower.includes(kw));
  const sectionMatch = clean.match(/(?:Section|Sec\.?|Dhara|धारा|u\/s)\s*([0-9A-Za-z]+)\s*(?:of\s+)?([A-Za-z\s]+)?/i);
  if (hasStatuteKeyword && sectionMatch) {
    const secNum = sectionMatch[1];
    const actName = sectionMatch[2]?.trim() || '';
    const detectedStatute = `Section ${secNum}${actName ? ' ' + actName : ''}`;
    suggestedFilters.statute = detectedStatute;

    return {
      raw_query: query,
      clean_query: clean,
      intent: 'statute_search',
      detected_statute: detectedStatute,
      detected_court: detectedCourt,
      suggested_filters: suggestedFilters,
      search_terms: clean.split(/\s+/).filter(t => t.length > 2)
    };
  }

  // 3. Check for Case Name Search (e.g. "Party A v. Party B" or "In re ...")
  if (/(?:\s+(?:v\.|vs\.?|versus|v)\s+|^in\s+re\b)/i.test(clean)) {
    return {
      raw_query: query,
      clean_query: clean,
      intent: 'case_name_search',
      detected_court: detectedCourt,
      suggested_filters: suggestedFilters,
      search_terms: clean.replace(/(?:\s+(?:v\.|vs\.?|versus|v)\s+|^in\s+re\b)/gi, ' ').split(/\s+/).filter(t => t.length > 2)
    };
  }

  // 4. Conceptual Semantic Search (General Legal Query)
  return {
    raw_query: query,
    clean_query: clean,
    intent: 'conceptual_semantic',
    detected_court: detectedCourt,
    suggested_filters: suggestedFilters,
    search_terms: clean.split(/[\s,.;:()\[\]{}"'\-]+/).filter(t => t.length > 2)
  };
}

/**
 * Highlights search terms within text snippet using HTML <mark> tags
 */
export function highlightMatchedSnippet(snippet: string, queryTerms: string[]): string {
  if (!snippet || queryTerms.length === 0) return snippet;

  const validTerms = queryTerms
    .map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .filter(t => t.length > 2);

  if (validTerms.length === 0) return snippet;

  const regex = new RegExp(`\\b(${validTerms.join('|')})\\b`, 'gi');
  return snippet.replace(regex, '<mark class="bg-amber-100 text-amber-900 font-semibold px-0.5 rounded">$1</mark>');
}
