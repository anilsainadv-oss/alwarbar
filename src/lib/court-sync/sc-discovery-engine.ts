/**
 * Supreme Court Dynamic Judgment Discovery Engine
 * Discovers newly published Supreme Court of India judgments from official public portals
 * and stages candidates into the persistent court_discovery_queue.
 *
 * Rules:
 * - Zero CAPTCHA bypass.
 * - Zero hardcoded fallback judgments in production discovery.
 * - Reject unrelated handbooks, circulars, or non-judgment PDFs.
 * - Polite 2,000ms delay between page requests.
 * - Deterministic deduplication via (court_code, diary_number, judgment_date).
 */

import https from 'https';
import http from 'http';
import { URL } from 'url';
import { legalResearchRepository } from '@/lib/db/repositories/legal-research';

export interface ScDiscoveredCandidate {
  court_code: 'INSC';
  diary_number: string;
  judgment_date: string; // YYYY-MM-DD
  case_number: string;
  citation: string;
  official_pdf_url: string;
  official_viewer_url?: string;
  title: string;
  bench?: string;
  judge_names?: string[];
  parties?: string[];
  legal_subjects?: string[];
  statutes?: string[];
  summary?: string;
  reportable_status?: boolean;
  raw_metadata: Record<string, any>;
}

export interface DiscoveryScanResult {
  courtCode: 'INSC';
  sourceUrl: string;
  status: 'completed' | 'challenged' | 'failed' | 'empty';
  totalDiscovered: number;
  enqueuedCount: number;
  duplicateCount: number;
  fromDate: string | null;
  toDate: string | null;
  candidates: ScDiscoveredCandidate[];
  errorMessage?: string | null;
}

const DEFAULT_SCI_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 (Alwar Advocates Legal Portal Indexer)';
const SCI_LANDMARK_LISTING_URL = 'https://www.sci.gov.in/landmark-judgment-summaries/';

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function fetchCourtPage(targetUrl: string, timeoutMs = 15000, maxRedirects = 5): Promise<{
  statusCode: number;
  finalUrl: string;
  html: string;
  isCaptcha: boolean;
  error?: string;
}> {
  return new Promise((resolve) => {
    try {
      const parsed = new URL(targetUrl);
      const transport = parsed.protocol === 'https:' ? https : http;

      const req = transport.get(targetUrl, {
        family: 4,
        timeout: timeoutMs,
        headers: {
          'User-Agent': DEFAULT_SCI_USER_AGENT,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9,hi;q=0.8'
        }
      }, (res) => {
        if (res.statusCode && [301, 302, 307, 308].includes(res.statusCode) && res.headers.location && maxRedirects > 0) {
          const redirectUrl = new URL(res.headers.location, targetUrl).toString();
          req.destroy();
          fetchCourtPage(redirectUrl, timeoutMs, maxRedirects - 1).then(resolve);
          return;
        }

        const chunks: Buffer[] = [];
        res.on('data', chunk => chunks.push(chunk));
        res.on('end', () => {
          const body = Buffer.concat(chunks).toString('utf8');
          const isCaptcha = (
            /g-recaptcha|cf-challenge|challenge-running|captcha/i.test(body) ||
            (res.statusCode === 403 && body.toLowerCase().includes('access denied'))
          );

          resolve({
            statusCode: res.statusCode || 200,
            finalUrl: targetUrl,
            html: body,
            isCaptcha
          });
        });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({ statusCode: 408, finalUrl: targetUrl, html: '', isCaptcha: false, error: 'Connection timed out' });
      });

      req.on('error', (err) => {
        resolve({ statusCode: 0, finalUrl: targetUrl, html: '', isCaptcha: false, error: err.message });
      });
    } catch (e: any) {
      resolve({ statusCode: 0, finalUrl: targetUrl, html: '', isCaptcha: false, error: e?.message || 'Invalid URL' });
    }
  });
}

/**
 * Extracts genuine Supreme Court judgment entries from official SCI HTML listing.
 * Supports:
 * 1) https://www.sci.gov.in/landmark-judgment-summaries/ (view-pdf/?diary_no=...&type=j&order_date=...)
 * 2) Standard SCI judgment table rows with explicit diary numbers & judgment PDFs
 * Rejects unrelated s3waas circulars/handbooks.
 */
export function parseSupremeCourtHtml(html: string): ScDiscoveredCandidate[] {
  const candidates: ScDiscoveredCandidate[] = [];
  if (!html || typeof html !== 'string') return candidates;

  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let match: RegExpExecArray | null;

  while ((match = rowRegex.exec(html)) !== null) {
    const rowContent = match[1];

    // Pattern A: Official SCI view-pdf/?diary_no=...&type=j&order_date=...
    const viewPdfMatch = rowContent.match(/href=["'](https?:\/\/www\.sci\.gov\.in\/view-pdf\/\?[^"']+)["']/i);
    if (viewPdfMatch) {
      const viewerUrl = viewPdfMatch[1].replace(/&amp;/g, '&');
      let diaryNumber = '';
      let orderDate = '';
      let docType = '';
      try {
        const u = new URL(viewerUrl);
        diaryNumber = (u.searchParams.get('diary_no') || '').trim();
        orderDate = (u.searchParams.get('order_date') || '').trim();
        docType = (u.searchParams.get('type') || '').trim().toLowerCase();
      } catch {
        continue;
      }

      if (!diaryNumber || !/^\d{4}-\d{2}-\d{2}$/.test(orderDate)) continue;
      if (docType && docType !== 'j') continue; // Strictly judgments, not notices/orders

      const tdMatches = [...rowContent.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map(m =>
        m[1].replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
      );

      const causeTitleMatch = rowContent.match(/id=["']causeTitle\d*["'][^>]*>([\s\S]*?)<\/span>/i);
      const ncMatch = rowContent.match(/id=["']ncDetails\d*["'][^>]*>([\s\S]*?)<\/span>/i) ||
                      rowContent.match(/(\d{4}\s+INSC\s+\d+)/i);

      const rawCol2 = tdMatches[2] || '';
      const caseMatch = rawCol2.match(/((?:C\.A\.|Crl\.A\.|W\.P\.\([A-Za-z]+\)|SLP\([A-Za-z]+\)|MA|Civil\s+Appeal|Criminal\s+Appeal|Writ\s+Petition)\s*(?:No\.?)?\s*[\d\/\-]+)/i);
      const caseNumber = caseMatch ? caseMatch[1].trim() : `Diary No. ${diaryNumber}`;

      let title = causeTitleMatch
        ? causeTitleMatch[1].replace(/<[^>]+>/g, '').trim()
        : rawCol2.replace(caseNumber, '').trim();
      if (!title) title = `${caseNumber} (Diary No. ${diaryNumber})`;

      const citation = ncMatch ? ncMatch[1].replace(/<[^>]+>/g, '').trim() : '';
      const subject = (tdMatches[3] || '').trim();
      const parties = title.split(/\s+(?:vs\.?|v\.?)\s+/i).map(p => p.trim()).filter(Boolean);

      const pdfUrl = `https://www.sci.gov.in/sci-get-pdf/?diary_no=${encodeURIComponent(diaryNumber)}&type=j&order_date=${encodeURIComponent(orderDate)}&from=latest_judgements_order`;

      candidates.push({
        court_code: 'INSC',
        diary_number: diaryNumber,
        judgment_date: orderDate,
        case_number: caseNumber,
        citation,
        official_pdf_url: pdfUrl,
        official_viewer_url: viewerUrl,
        title,
        parties,
        legal_subjects: subject ? [subject] : [],
        summary: subject || undefined,
        raw_metadata: {
          discovered_via: 'sci_landmark_judgment_summaries',
          subject
        }
      });
      continue;
    }

    // Pattern B: Direct PDF links on sci.gov.in (reject generic s3waas circulars/handbooks)
    const pdfLinkMatch = rowContent.match(/href=["'](https?:\/\/www\.sci\.gov\.in\/[^"']+\.pdf|\/[^"']+\.pdf)["']/i);
    if (!pdfLinkMatch) continue;

    let pdfUrl = pdfLinkMatch[1];
    if (pdfUrl.startsWith('/')) {
      pdfUrl = `https://www.sci.gov.in${pdfUrl}`;
    }

    const diaryMatch = rowContent.match(/diary\s*(?:no\.?|number)?\s*[:\-]?\s*(\d{4,12})/i);
    if (!diaryMatch) continue; // Reject rows without an explicit diary number

    const dateMatch = rowContent.match(/(\d{2})[-/](\d{2})[-/](\d{4})/) || rowContent.match(/(\d{4})[-/](\d{2})[-/](\d{2})/);
    if (!dateMatch) continue; // Reject rows without an explicit judgment date

    const judgmentDate = dateMatch[1].length === 4
      ? `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`
      : `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`;

    const diaryNumber = diaryMatch[1];
    const caseMatch = rowContent.match(/((?:Civil|Criminal|Special Leave|Writ)\s+(?:Appeal|Petition|Review|Misc)\s*(?:No\.?)?\s*[\d\/\s\(\)]+)/i);
    const caseNumber = caseMatch ? caseMatch[1].trim() : `Diary No. ${diaryNumber}`;
    const citationMatch = rowContent.match(/(\d{4}\s+INSC\s+\d+)/i);
    const citation = citationMatch ? citationMatch[1].trim() : '';

    const titleMatch = rowContent.match(/<td[^>]*>([\s\S]*?)v(?:ersus|\.|\/)\s*([\s\S]*?)<\/td>/i);
    let title = `${caseNumber}`;
    let parties: string[] = [];
    if (titleMatch) {
      const p1 = titleMatch[1].replace(/<[^>]+>/g, '').trim();
      const p2 = titleMatch[2].replace(/<[^>]+>/g, '').trim();
      if (p1 && p2) {
        title = `${p1} v. ${p2}`;
        parties = [p1, p2];
      }
    }

    candidates.push({
      court_code: 'INSC',
      diary_number: diaryNumber,
      judgment_date: judgmentDate,
      case_number: caseNumber,
      citation,
      official_pdf_url: pdfUrl,
      official_viewer_url: pdfUrl,
      title,
      parties,
      raw_metadata: {
        discovered_via: 'sci_html_parser'
      }
    });
  }

  return candidates;
}

export class SupremeCourtDiscoveryEngine {
  /**
   * Scans official Supreme Court portals for newly published judgments,
   * extracts real candidates, and enqueues them atomically into public.court_discovery_queue.
   * Never falls back to hardcoded sample judgments.
   */
  static async scanAndEnqueue(options: {
    maxPages?: number;
    workerId?: string;
  } = {}): Promise<DiscoveryScanResult> {
    const maxPages = options.maxPages || 1;
    const allDiscovered: ScDiscoveredCandidate[] = [];
    let isChallenged = false;
    let errorMessage: string | null = null;

    const checkpoint = await legalResearchRepository.getCourtSyncCheckpoint('INSC');
    const lastScannedDate = checkpoint?.last_scanned_judgment_date || null;

    for (let page = 1; page <= maxPages; page++) {
      const targetUrl = page === 1 ? SCI_LANDMARK_LISTING_URL : `${SCI_LANDMARK_LISTING_URL}page/${page}/`;
      if (page > 1) await delay(2000);

      const fetchResult = await fetchCourtPage(targetUrl);

      if (fetchResult.isCaptcha) {
        isChallenged = true;
        errorMessage = 'Anti-bot / CAPTCHA challenge encountered on official Supreme Court portal. Automated bypass strictly prohibited.';
        break;
      }

      if (fetchResult.statusCode === 200 && fetchResult.html) {
        const parsed = parseSupremeCourtHtml(fetchResult.html);
        if (parsed.length > 0) {
          allDiscovered.push(...parsed);
        } else {
          break;
        }
      } else if (fetchResult.error || fetchResult.statusCode >= 400) {
        errorMessage = fetchResult.error || `HTTP ${fetchResult.statusCode} from ${targetUrl}`;
        break;
      }
    }

    if (allDiscovered.length === 0) {
      return {
        courtCode: 'INSC',
        sourceUrl: SCI_LANDMARK_LISTING_URL,
        status: isChallenged ? 'challenged' : (errorMessage ? 'failed' : 'empty'),
        totalDiscovered: 0,
        enqueuedCount: 0,
        duplicateCount: 0,
        fromDate: lastScannedDate,
        toDate: null,
        candidates: [],
        errorMessage: errorMessage || 'No valid judgment entries extracted from official Supreme Court listing.'
      };
    }

    let eligibleCandidates = allDiscovered;
    if (lastScannedDate) {
      eligibleCandidates = allDiscovered.filter(c => c.judgment_date >= lastScannedDate);
    }

    const queueItemsToEnqueue = eligibleCandidates.map(c => ({
      court_code: c.court_code,
      diary_number: c.diary_number,
      judgment_date: c.judgment_date,
      case_number: c.case_number,
      citation: c.citation || null,
      official_pdf_url: c.official_pdf_url,
      official_viewer_url: c.official_viewer_url || null,
      raw_metadata: {
        title: c.title,
        bench: c.bench || null,
        judge_names: c.judge_names || [],
        parties: c.parties || [],
        legal_subjects: c.legal_subjects || [],
        statutes: c.statutes || [],
        summary: c.summary || null,
        reportable_status: c.reportable_status ?? true,
        ...c.raw_metadata
      }
    }));

    const enqueueResult = await legalResearchRepository.enqueueDiscoveryCandidates(queueItemsToEnqueue);

    return {
      courtCode: 'INSC',
      sourceUrl: SCI_LANDMARK_LISTING_URL,
      status: isChallenged ? 'challenged' : 'completed',
      totalDiscovered: eligibleCandidates.length,
      enqueuedCount: enqueueResult.enqueued,
      duplicateCount: enqueueResult.duplicates,
      fromDate: lastScannedDate,
      toDate: eligibleCandidates.length > 0 ? eligibleCandidates[0].judgment_date : null,
      candidates: eligibleCandidates,
      errorMessage
    };
  }
}
