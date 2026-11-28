/**
 * Live Supreme Court of India source (official sci.gov.in only).
 *
 * How it works (based on the endpoints your own probe scripts verified):
 *   1. The sci.gov.in homepage lists "latest judgements" as links like
 *      /view-pdf/?diary_no=465272026&type=j&order_date=2026-11-20&from=latest_judgements_order
 *   2. The real PDF stream for that link is
 *      /sci-get-pdf/?diary_no=...&type=j&order_date=...&from=latest_judgements_order
 *      (needs the view-pdf URL as Referer).
 *
 * Nothing here is invented: if the site changes or is unreachable we return an
 * error and ingest NOTHING. No CAPTCHA handling, no bypass.
 */

const SCI_ORIGIN = 'https://www.sci.gov.in';
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

export interface LiveSciCandidate {
  diaryNo: string;
  orderDate: string; // YYYY-MM-DD
  viewUrl: string; // human page (used as source_url + dedupe key)
  pdfUrl: string; // direct PDF stream
  linkText: string;
}

export interface LiveSciDiscovery {
  candidates: LiveSciCandidate[];
  error?: string;
}

function decodeHtml(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&#038;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function discoverLatestSciJudgments(
  options: { limit?: number; pages?: string[] } = {}
): Promise<LiveSciDiscovery> {
  const limit = options.limit ?? 10;
  const pages = options.pages ?? [`${SCI_ORIGIN}/`];
  const found = new Map<string, LiveSciCandidate>();

  for (const page of pages) {
    let html = '';
    try {
      const res = await fetch(page, {
        headers: { 'User-Agent': UA, Accept: 'text/html,*/*' },
        signal: AbortSignal.timeout(20000)
      });
      if (!res.ok) return { candidates: [], error: `sci.gov.in returned HTTP ${res.status}` };
      html = await res.text();
    } catch (e: any) {
      return { candidates: [], error: `sci.gov.in not reachable: ${e?.message || e}` };
    }

    const anchorRe = /<a\b[^>]*href\s*=\s*["']([^"']*view-pdf[^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi;
    let m: RegExpExecArray | null;
    while ((m = anchorRe.exec(html)) !== null) {
      try {
        const href = decodeHtml(m[1]).replace(/ /g, '');
        const u = new URL(href, SCI_ORIGIN);
        const diaryNo = u.searchParams.get('diary_no') || '';
        const type = (u.searchParams.get('type') || '').toLowerCase();
        const orderDate = u.searchParams.get('order_date') || '';
        // type=j -> judgment (type=o would be an order). Only judgments are wanted.
        if (!diaryNo || type !== 'j' || !/^\d{4}-\d{2}-\d{2}$/.test(orderDate)) continue;

        const viewUrl = u.toString();
        const pdf = new URL(`${SCI_ORIGIN}/sci-get-pdf/`);
        for (const [k, v] of u.searchParams.entries()) pdf.searchParams.set(k, v);

        if (!found.has(viewUrl)) {
          found.set(viewUrl, {
            diaryNo,
            orderDate,
            viewUrl,
            pdfUrl: pdf.toString(),
            linkText: decodeHtml(m[2]).slice(0, 300)
          });
        }
      } catch {
        /* skip malformed link */
      }
    }
  }

  const candidates = Array.from(found.values())
    .sort((a, b) => b.orderDate.localeCompare(a.orderDate))
    .slice(0, limit);

  if (candidates.length === 0) {
    return {
      candidates: [],
      error:
        'No judgment links (type=j) found on sci.gov.in homepage. The page layout may have changed; run scripts/get-homepage-snippet.cjs to inspect.'
    };
  }
  return { candidates };
}

/**
 * The PDF spec allows junk/whitespace before the "%PDF-" header (within the first 1024 bytes).
 * Returns the PDF bytes starting at the header, or null if this is not a PDF.
 */
function extractPdfBytes(buf: Buffer): Buffer | null {
  const idx = buf.subarray(0, 1024).indexOf('%PDF-');
  if (idx < 0) return null;
  return idx === 0 ? buf : buf.subarray(idx);
}

function cookieHeaderFrom(res: Response): string {
  const h: any = res.headers;
  const list: string[] =
    typeof h.getSetCookie === 'function'
      ? h.getSetCookie()
      : res.headers.get('set-cookie')
        ? [res.headers.get('set-cookie') as string]
        : [];
  return list.map(c => c.split(';')[0]).filter(Boolean).join('; ');
}

/** Find a direct .pdf link inside an HTML/JSON wrapper page. */
function findPdfUrl(text: string): string | null {
  const cleaned = text.replace(/\\\//g, '/').replace(/&amp;/g, '&');
  const abs = cleaned.match(/https?:\/\/[^"'\s<>\\]+?\.pdf(?:\?[^"'\s<>\\]*)?/i);
  if (abs) return abs[0];
  const rel = cleaned.match(/["'(](\/[^"'\s<>\\]+?\.pdf(?:\?[^"'\s<>\\]*)?)["')]/i);
  if (rel) return new URL(rel[1], SCI_ORIGIN).toString();
  return null;
}

interface PdfAttempt {
  ok: boolean;
  buf: Buffer;
  status: number;
  ctype: string;
  text: string;
}

async function tryPdfUrl(url: string, referer: string, cookie: string): Promise<PdfAttempt> {
  const res = await fetch(url, {
    headers: {
      'User-Agent': UA,
      'Accept-Language': 'en-IN,en;q=0.9',
      Referer: referer,
      Accept: 'application/pdf,*/*',
      ...(cookie ? { Cookie: cookie } : {})
    },
    signal: AbortSignal.timeout(60000)
  });
  const raw = Buffer.from(await res.arrayBuffer());
  const pdf = extractPdfBytes(raw);
  const ctype = res.headers.get('content-type') || '';
  const text = pdf ? '' : raw.subarray(0, 200000).toString('utf8');
  return { ok: res.ok && !!pdf, buf: pdf || raw, status: res.status, ctype, text };
}

/**
 * Download the real PDF like a normal browser would:
 *   1. open the judgment page (collect cookies, look for a direct PDF link),
 *   2. try the direct link, then the sci-get-pdf stream,
 *   3. if a wrapper page/JSON mentions a .pdf link, follow it.
 * Throws unless the final response is a genuine %PDF- file. A CAPTCHA/challenge page
 * is never bypassed: we stop and report it.
 */
export async function downloadSciPdf(c: LiveSciCandidate): Promise<Buffer> {
  let cookie = '';
  let direct: string | null = null;
  try {
    const vres = await fetch(c.viewUrl, {
      headers: { 'User-Agent': UA, 'Accept-Language': 'en-IN,en;q=0.9', Accept: 'text/html,*/*' },
      signal: AbortSignal.timeout(30000)
    });
    cookie = cookieHeaderFrom(vres);
    direct = findPdfUrl(await vres.text());
  } catch {
    /* continue with the stream URL */
  }

  const urls = [direct, c.pdfUrl].filter((u, i, arr): u is string => !!u && arr.indexOf(u) === i);
  let lastReason = 'no attempt made';

  for (const url of urls) {
    let attempt: PdfAttempt;
    try {
      attempt = await tryPdfUrl(url, c.viewUrl, cookie);
    } catch (e: any) {
      lastReason = `network error: ${e?.message || e}`;
      continue;
    }
    if (attempt.ok) return attempt.buf;

    if (/captcha/i.test(attempt.text)) {
      throw new Error(
        'sci.gov.in returned a CAPTCHA/challenge page. Automatic download is not possible for this file.'
      );
    }

    const inner = findPdfUrl(attempt.text);
    if (inner && inner !== url) {
      try {
        const second = await tryPdfUrl(inner, c.viewUrl, cookie);
        if (second.ok) return second.buf;
        lastReason = `linked PDF failed: HTTP ${second.status}, content-type "${second.ctype}", ${second.buf.length} bytes`;
        continue;
      } catch (e: any) {
        lastReason = `linked PDF network error: ${e?.message || e}`;
        continue;
      }
    }

    const preview = attempt.text.slice(0, 120).replace(/\s+/g, ' ').trim();
    lastReason = `HTTP ${attempt.status}, content-type "${attempt.ctype}", ${attempt.buf.length} bytes, starts with: ${preview || '(empty)'}`;
  }

  throw new Error(`Response was not a PDF (${lastReason}).`);
}

export interface SciMetadata {
  citation: string;
  caseNumber: string;
  title?: string;
  judgmentDate: string;
}

/** Derive metadata from the real PDF text. Falls back to stable, honest identifiers. */
export function buildSciMetadata(c: LiveSciCandidate, text: string): SciMetadata {
  const head = text.slice(0, 6000);

  const neutral = head.match(/\b(20\d{2})\s+INSC\s+(\d{1,5})\b/i);
  const citation = neutral
    ? `${neutral[1]} INSC ${neutral[2]}`
    : `SCI Diary No. ${c.diaryNo} (${c.orderDate})`;

  const caseNo = head.match(
    /\b((?:CRIMINAL|CIVIL)\s+APPEAL|SPECIAL\s+LEAVE\s+PETITION[^\n]{0,30}|WRIT\s+PETITION[^\n]{0,30}|TRANSFER\s+PETITION[^\n]{0,30})\s+NO[S]?\.?\s*([\d,\s\-/]+(?:OF|of)?\s*\d{4})/i
  );
  const caseNumber = caseNo
    ? `${caseNo[1].replace(/\s+/g, ' ').trim()} No. ${caseNo[2].replace(/\s+/g, ' ').trim()}`
    : `Diary No. ${c.diaryNo}`;

  const cleanedLink = (c.linkText || '').replace(/\s*\(Uploaded On[^)]*\)\s*$/i, '').trim();
  const title =
    cleanedLink.length > 5 && !/view|download|pdf/i.test(cleanedLink) ? cleanedLink : undefined;

  return { citation, caseNumber, title, judgmentDate: c.orderDate };
}
