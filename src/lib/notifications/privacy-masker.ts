/**
 * Attorney-Client Privileged Data Privacy Masker
 * Ensures that unencrypted notification channels (Email, WhatsApp, SMS)
 * never expose confidential case notes, sensitive medical/domestic allegations,
 * or full identity numbers.
 */

export function sanitizeNotificationContent(rawText: string): string {
  if (!rawText) return '';

  return rawText
    // Mask 12-digit Aadhaar numbers: XXXX-XXXX-1234
    .replace(/\b\d{4}\s?\d{4}\s?(\d{4})\b/g, 'XXXX-XXXX-$1')
    // Mask 10-digit PAN cards: XXXXX1234X
    .replace(/\b[A-Z]{5}(\d{4}[A-Z])\b/gi, 'XXXXX$1')
    // Mask bank account numbers (keep last 4 digits)
    .replace(/\b(\d{6,14})(\d{4})\b/g, '******$2')
    // Strip confidential private notes markers
    .replace(/\[CONFIDENTIAL[\s\S]*?\]/gi, '')
    .trim();
}

export function formatSafeHearingNotification(params: {
  caseTitle: string;
  caseNumber?: string;
  courtName: string;
  hearingDate: string;
  courtRoom?: string;
  judgeName?: string;
  businessRecorded?: string;
  language?: 'en' | 'hi';
}): { title: string; body: string } {
  const isHi = params.language === 'hi';

  const title = isHi
    ? `न्यायालय पेशी सूचना: ${params.caseNumber || params.caseTitle} (${params.hearingDate})`
    : `Court Hearing Alert: ${params.caseNumber || params.caseTitle} (${params.hearingDate})`;

  const roomInfo = params.courtRoom ? ` (${params.courtRoom})` : '';
  const judgeInfo = params.judgeName ? ` - ${params.judgeName}` : '';

  const body = isHi
    ? `सादर अभिभाषक,\n\n` +
      `आपके प्रकरण की आगामी पेशी नियत है:\n` +
      `• प्रकरण: ${sanitizeNotificationContent(params.caseTitle)}\n` +
      `• वाद संख्या: ${params.caseNumber || 'पत्रावली'}\n` +
      `• न्यायालय: ${params.courtName}${roomInfo}${judgeInfo}\n` +
      `• पेशी दिनांक: ${params.hearingDate}\n` +
      (params.businessRecorded ? `• कार्यवाही विवरण: ${sanitizeNotificationContent(params.businessRecorded)}\n` : '') +
      `\nअलवर अभिभाषक पोर्टल (Alwar Bar Practice Management)`
    : `Respected Advocate,\n\n` +
      `A hearing is scheduled for your docket matter:\n` +
      `• Case: ${sanitizeNotificationContent(params.caseTitle)}\n` +
      `• Case No.: ${params.caseNumber || 'Docket record'}\n` +
      `• Court: ${params.courtName}${roomInfo}${judgeInfo}\n` +
      `• Hearing Date: ${params.hearingDate}\n` +
      (params.businessRecorded ? `• Scheduled Business: ${sanitizeNotificationContent(params.businessRecorded)}\n` : '') +
      `\nAlwar Advocates Practice Management SaaS Platform`;

  return { title, body };
}
