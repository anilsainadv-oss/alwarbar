import { legalResearchRepository } from '@/lib/db/repositories/legal-research';
import { localDb } from '@/lib/db';
import { 
  uploadPdfToR2, 
  generateR2StorageKey, 
  validatePdfIntegrity, 
  isR2Configured 
} from '@/lib/storage/r2-client';
import { ingestAndIndexLegalDocument } from '@/lib/legal-research/indexing-pipeline';
import { extractDocumentText } from '@/lib/ai/document-parser';
import { cleanLegalText } from '@/lib/legal-research/chunking';
import {
  discoverLatestSciJudgments,
  downloadSciPdf,
  buildSciMetadata
} from '@/lib/court-sync/live-sci-source';
import crypto from 'crypto';
import https from 'https';

export interface CourtSyncMetrics {
  courtCode: 'INSC' | 'HCRAJ';
  courtName: string;
  sourceUrl: string;
  status: 'idle' | 'running' | 'completed' | 'failed' | 'challenged';
  lastSyncAttemptAt: string | null;
  lastSuccessfulSyncAt: string | null;
  newJudgmentsFound: number;
  successfullyDownloaded: number;
  duplicateRecords: number;
  failedDownloads: number;
  captchaDetected: boolean;
  lastErrorMessage?: string | null;
}

export interface SyncDashboardState {
  supremeCourt: CourtSyncMetrics;
  rajasthanHighCourt: CourtSyncMetrics;
  global: {
    totalPendingApproval: number;
    totalPublished: number;
    totalDocuments: number;
    lastSyncTime: string | null;
    scheduleInterval: string;
    nextScheduledSyncAt: string;
    rateLimitCooldownSeconds: number;
  };
  recentJobs: Array<{
    id: string;
    source_name?: string | null;
    status: string;
    total_documents: number;
    successful_documents: number;
    failed_documents: number;
    started_at?: string | null;
    completed_at?: string | null;
    created_at: string;
  }>;
}

// In-Memory Persistent State across warm runtime invocations
let scSyncState: CourtSyncMetrics = {
  courtCode: 'INSC',
  courtName: 'Supreme Court of India',
  sourceUrl: 'https://www.sci.gov.in',
  status: 'idle',
  lastSyncAttemptAt: null,
  lastSuccessfulSyncAt: null,
  newJudgmentsFound: 0,
  successfullyDownloaded: 0,
  duplicateRecords: 0,
  failedDownloads: 0,
  captchaDetected: false,
  lastErrorMessage: null
};

let hcSyncState: CourtSyncMetrics = {
  courtCode: 'HCRAJ',
  courtName: 'High Court of Judicature for Rajasthan (Jaipur & Jodhpur)',
  sourceUrl: 'https://hcraj.nic.in',
  status: 'idle',
  lastSyncAttemptAt: null,
  lastSuccessfulSyncAt: null,
  newJudgmentsFound: 0,
  successfullyDownloaded: 0,
  duplicateRecords: 0,
  failedDownloads: 0,
  captchaDetected: false,
  lastErrorMessage: null
};

let lastSyncTimestamp = Date.now() - 300000; // 5 mins ago initially
const RATE_LIMIT_COOLDOWN_MS = 60 * 1000; // 60 seconds minimum between sync executions

/**
 * Real HTTPS Network Fetcher with Timeout and Redirects
 */
function probeHttps(url: string, timeoutMs = 8000): Promise<{ reachable: boolean; status: number; hasCaptcha: boolean; timeMs: number; buffer?: Buffer }> {
  return new Promise((resolve) => {
    const start = Date.now();
    const req = https.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AlwarBarJudgmentSync/1.0' },
      timeout: timeoutMs
    }, (res) => {
      let chunks: Buffer[] = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const buf = Buffer.concat(chunks);
        const str = buf.toString('utf8');
        resolve({
          reachable: res.statusCode === 200,
          status: res.statusCode || 0,
          hasCaptcha: /captcha/i.test(str),
          timeMs: Date.now() - start,
          buffer: buf
        });
      });
    });
    req.on('error', () => resolve({ reachable: false, status: 0, hasCaptcha: false, timeMs: Date.now() - start }));
    req.on('timeout', () => { req.destroy(); resolve({ reachable: false, status: 408, hasCaptcha: false, timeMs: Date.now() - start }); });
  });
}

export class CourtSyncService {
  /**
   * Retrieves aggregated sync telemetry for the admin panel and monitoring APIs
   */
  static async getDashboardState(): Promise<SyncDashboardState> {
    const allDocs = await legalResearchRepository.getDocuments({});
    const totalPendingApproval = allDocs.filter(d => (d.approval_status || d.verification_status) === 'pending').length;
    const totalPublished = allDocs.filter(d => d.publication_status === 'published').length;

    let recentJobs: any[] = [];
    try {
      recentJobs = await legalResearchRepository.getIngestionJobs();
    } catch {
      recentJobs = [];
    }

    const elapsed = Date.now() - lastSyncTimestamp;
    const remainingCooldown = Math.max(0, Math.ceil((RATE_LIMIT_COOLDOWN_MS - elapsed) / 1000));

    // Next scheduled cron is 6 hours from last successful sync
    const lastSyncDate = new Date(scSyncState.lastSuccessfulSyncAt || new Date().toISOString());
    const nextCronDate = new Date(lastSyncDate.getTime() + 6 * 3600 * 1000);

    return {
      supremeCourt: { ...scSyncState },
      rajasthanHighCourt: { ...hcSyncState },
      global: {
        totalPendingApproval,
        totalPublished,
        totalDocuments: allDocs.length,
        lastSyncTime: scSyncState.lastSuccessfulSyncAt,
        scheduleInterval: 'Every 6 hours (0 */6 * * *)',
        nextScheduledSyncAt: nextCronDate.toISOString(),
        rateLimitCooldownSeconds: remainingCooldown
      },
      recentJobs: recentJobs.slice(0, 10)
    };
  }

  /**
   * Executes the 6-hour automated court judgment sync or manual Admin "Sync Now"
   */
  static async executeSync(options: {
    court?: 'all' | 'supreme_court' | 'rajasthan_high_court';
    dryRun?: boolean;
    triggeredBy?: string;
    force?: boolean;
  } = {}) {
    const startTime = Date.now();
    const courtChoice = options.court || 'all';
    const isDryRun = options.dryRun === true;
    const triggeredBy = options.triggeredBy || 'system-court-cron';
    const nowIso = new Date().toISOString();

    // 1. Rate Limiting Check (enforce cooldown between live sync operations)
    if (!options.force && !isDryRun) {
      const elapsed = Date.now() - lastSyncTimestamp;
      if (elapsed < RATE_LIMIT_COOLDOWN_MS) {
        const waitSec = Math.ceil((RATE_LIMIT_COOLDOWN_MS - elapsed) / 1000);
        throw new Error(`Rate limit active: Please wait ${waitSec}s before triggering another court sync.`);
      }
    }
    if (!isDryRun) {
      lastSyncTimestamp = Date.now();
    }

    // 2. Fetch Existing Documents for Quadruple Deduplication
    const existingDocs = await legalResearchRepository.getDocuments({});
    const existingCitations = new Set(existingDocs.map(d => (d.citation || '').toLowerCase().trim()));
    const existingCaseNumbers = new Set(existingDocs.map(d => `${d.court_code || ''}:${(d.case_number || '').toLowerCase().trim()}`));
    const existingSourceUrls = new Set(existingDocs.map(d => (d.original_source_url || d.document_url || '').toLowerCase().trim()).filter(Boolean));
    const existingSha256 = new Set(existingDocs.map(d => (d.pdf_sha256 || '').toLowerCase().trim()).filter(Boolean));

    // 3. Create Ingestion Job Record in Supabase PostgreSQL
    let job: any = null;
    if (!isDryRun) {
      try {
        job = await legalResearchRepository.createIngestionJob({
          collection_method: 'automatic',
          source_name: courtChoice === 'supreme_court' 
            ? 'Supreme Court of India (sci.gov.in & e-SCR)' 
            : courtChoice === 'rajasthan_high_court' 
              ? 'Rajasthan High Court (Jaipur & Jodhpur)' 
              : 'Supreme Court & Rajasthan High Court 6-Hour Sync',
          source_url: 'https://www.sci.gov.in & https://hcraj.nic.in',
          status: 'running',
          total_documents: 0,
          successful_documents: 0,
          failed_documents: 0,
          started_at: nowIso
        });
      } catch (err) {
        console.warn('Failed to insert initial ingestion job record:', err);
      }
    }

    const newlyIngested: Array<{ id: string; title: string; citation: string; court: string }> = [];
    const skippedDuplicates: string[] = [];
    const failedDownloads: Array<{ citation: string; reason: string }> = [];

    // -------------------------------------------------------------------------
    // SYNC SUPREME COURT OF INDIA (INSC)
    // -------------------------------------------------------------------------
    if (courtChoice === 'all' || courtChoice === 'supreme_court') {
      scSyncState.status = 'running';
      scSyncState.lastSyncAttemptAt = nowIso;

      try {
        // LIVE discovery from the official sci.gov.in "latest judgements" links
        const discovery = await discoverLatestSciJudgments({ limit: Number(process.env.COURT_SYNC_MAX_PER_RUN) || 10 });
        if (discovery.error) throw new Error(discovery.error);

        const scCandidates = discovery.candidates;
        scSyncState.newJudgmentsFound = scCandidates.length;
        let scIngested = 0;
        let scDuplicates = 0;
        let scFailed = 0;

        // Vercel functions have a max duration; stop early and let the next run continue.
        // (Already-saved judgments are skipped by deduplication.)
        const MAX_RUN_MS = (Number(process.env.COURT_SYNC_MAX_RUN_SECONDS) || 240) * 1000;

        for (const candidate of scCandidates) {
          if (Date.now() - startTime > MAX_RUN_MS) {
            scSyncState.lastErrorMessage = 'Stopped early to stay within time limit; remaining judgments will sync on the next run.';
            break;
          }
          const label = `SCI Diary ${candidate.diaryNo} (${candidate.orderDate})`;

          // Dedup 1: source URL
          if (existingSourceUrls.has(candidate.viewUrl.toLowerCase().trim())) {
            skippedDuplicates.push(label);
            scDuplicates++;
            continue;
          }

          // Download the REAL PDF from sci.gov.in (never generated locally)
          let pdfBuffer: Buffer;
          try {
            pdfBuffer = await downloadSciPdf(candidate);
          } catch (e: any) {
            failedDownloads.push({ citation: label, reason: e?.message || 'Download failed' });
            scFailed++;
            continue;
          }

          const integrity = validatePdfIntegrity(pdfBuffer);
          if (!integrity.valid) {
            failedDownloads.push({ citation: label, reason: integrity.error || 'Invalid PDF' });
            scFailed++;
            continue;
          }

          // Dedup 2: binary SHA-256
          if (existingSha256.has(integrity.sha256.toLowerCase())) {
            skippedDuplicates.push(label);
            scDuplicates++;
            continue;
          }

          // Extract text from the real PDF and derive metadata
          let text = '';
          try {
            const extraction = await extractDocumentText(pdfBuffer, 'application/pdf', 'judgment.pdf');
            text = cleanLegalText(extraction.text || '');
          } catch {
            text = '';
          }
          const meta = buildSciMetadata(candidate, text);

          // Dedup 3 & 4: citation and court+case number
          const cleanCitation = meta.citation.toLowerCase().trim();
          const cleanCaseKey = `INSC:${meta.caseNumber.toLowerCase().trim()}`;
          if (existingCitations.has(cleanCitation) || existingCaseNumbers.has(cleanCaseKey)) {
            skippedDuplicates.push(meta.citation);
            scDuplicates++;
            continue;
          }

          if (isDryRun) {
            newlyIngested.push({
              id: `dry-run-${candidate.diaryNo}`,
              title: meta.title || label,
              citation: meta.citation,
              court: 'Supreme Court of India'
            });
            scIngested++;
            continue;
          }

          try {
            // Ingest with MANDATORY PENDING APPROVAL and DRAFT PUBLICATION STATUS
            const result = await ingestAndIndexLegalDocument({
              buffer: pdfBuffer,
              filename: `INSC_${candidate.diaryNo}_${candidate.orderDate}.pdf`,
              title: meta.title,
              citation: meta.citation,
              case_number: meta.caseNumber,
              diary_number: candidate.diaryNo,
              court_level: 'Supreme Court',
              court_name: 'Supreme Court of India',
              court_code: 'INSC',
              bench: null,
              judgment_date: meta.judgmentDate,
              source_type: 'automatic',
              document_url: candidate.viewUrl,
              // STRICT GUARANTEE: Never automatically publish
              approval_status: 'pending',
              verification_status: 'pending',
              publication_status: 'draft',
              userId: triggeredBy
            });

            if (result && result.document) {
              newlyIngested.push({
                id: result.document.id,
                title: result.document.title,
                citation: result.document.citation,
                court: result.document.court_name
              });
              scIngested++;
              existingCitations.add(cleanCitation);
              existingCaseNumbers.add(cleanCaseKey);
              existingSourceUrls.add(candidate.viewUrl.toLowerCase().trim());
              existingSha256.add(integrity.sha256.toLowerCase());
            }
          } catch (e: any) {
            failedDownloads.push({ citation: meta.citation, reason: e?.message || 'Ingestion failed' });
            scFailed++;
          }

          // Be polite to the court server
          await new Promise(r => setTimeout(r, 1500));
        }

        const allFailed = scCandidates.length > 0 && scFailed === scCandidates.length && scIngested === 0 && scDuplicates === 0;
        scSyncState.status = allFailed ? 'failed' : 'completed';
        if (!allFailed) scSyncState.lastSuccessfulSyncAt = nowIso;
        scSyncState.successfullyDownloaded = scIngested;
        scSyncState.duplicateRecords = scDuplicates;
        scSyncState.failedDownloads = scFailed;
        if (allFailed) {
          scSyncState.lastErrorMessage = `All ${scFailed} downloads failed. First reason: ${failedDownloads[0]?.reason || 'unknown'}`;
        } else if (!scSyncState.lastErrorMessage?.startsWith('Stopped early')) {
          scSyncState.lastErrorMessage = null;
        }
      } catch (scErr: any) {
        scSyncState.status = 'failed';
        scSyncState.lastErrorMessage = scErr?.message || 'Supreme Court sync failed';
      }
    }

    // -------------------------------------------------------------------------
    // SYNC RAJASTHAN HIGH COURT (HCRAJ-JP / HCRAJ-JD)
    // -------------------------------------------------------------------------
    if (courtChoice === 'all' || courtChoice === 'rajasthan_high_court') {
      hcSyncState.status = 'running';
      hcSyncState.lastSyncAttemptAt = nowIso;

      try {
        // Probe official portal. We never bypass or "solve" its CAPTCHA.
        const hcProbe = await probeHttps('https://hcraj.nic.in/cishcraj-jp/');
        hcSyncState.captchaDetected = hcProbe.hasCaptcha;
        hcSyncState.newJudgmentsFound = 0;
        hcSyncState.successfullyDownloaded = 0;
        hcSyncState.duplicateRecords = 0;
        hcSyncState.failedDownloads = 0;

        if (hcProbe.hasCaptcha) {
          hcSyncState.status = 'challenged';
          hcSyncState.lastErrorMessage =
            'Rajasthan High Court portal requires CAPTCHA. Automatic fetch is not possible; use Admin > Legal Library > manual PDF import.';
        } else if (!hcProbe.reachable) {
          hcSyncState.status = 'failed';
          hcSyncState.lastErrorMessage = 'Rajasthan High Court portal not reachable.';
        } else {
          // No live HC connector is implemented yet. Do NOT fabricate judgments.
          hcSyncState.status = 'idle';
          hcSyncState.lastErrorMessage =
            'No automatic High Court source configured yet. Use manual PDF import.';
        }
      } catch (hcErr: any) {
        hcSyncState.status = 'failed';
        hcSyncState.lastErrorMessage = hcErr?.message || 'Rajasthan High Court sync failed';
      }
    }

    // 4. Update Job Telemetry in Database
    if (job && !isDryRun) {
      try {
        await legalResearchRepository.updateIngestionJob(job.id, {
          status: 'completed',
          total_documents: newlyIngested.length + skippedDuplicates.length + failedDownloads.length,
          successful_documents: newlyIngested.length,
          failed_documents: failedDownloads.length,
          completed_at: new Date().toISOString()
        });
      } catch (err) {
        console.warn('Failed to update ingestion job completion:', err);
      }
    }

    const durationMs = Date.now() - startTime;

    return {
      success: scSyncState.status !== 'failed' || courtChoice === 'rajasthan_high_court',
      dryRun: isDryRun,
      jobId: job?.id || 'dry-run-job',
      summary: {
        newlyIngestedCount: newlyIngested.length,
        skippedDuplicatesCount: skippedDuplicates.length,
        failedDownloadsCount: failedDownloads.length,
        durationMs
      },
      documents: newlyIngested,
      duplicates: skippedDuplicates,
      failures: failedDownloads,
      supremeCourtStatus: { ...scSyncState },
      rajasthanHighCourtStatus: { ...hcSyncState },
      timestamp: new Date().toISOString()
    };
  }
}
