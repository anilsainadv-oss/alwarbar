import { sanitizeNotificationContent } from './privacy-masker';

export interface EmailDispatchResult {
  success: boolean;
  provider: string;
  messageId: string;
  simulated: boolean;
  error?: string;
}

export interface EmailMessagePayload {
  to: string;
  recipientName?: string;
  subject: string;
  textBody: string;
  htmlBody?: string;
}

export class EmailNotificationService {
  private apiKey: string;
  private fromEmail: string;
  private providerName: string;

  constructor() {
    this.apiKey = process.env.RESEND_API_KEY || process.env.EMAIL_API_KEY || '';
    this.fromEmail = process.env.EMAIL_FROM || 'alerts@alwaradvocates.org';
    this.providerName = process.env.EMAIL_PROVIDER || 'resend';
  }

  get isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey !== 'demo' && this.apiKey.length > 5);
  }

  async sendEmail(payload: EmailMessagePayload): Promise<EmailDispatchResult> {
    const cleanSubject = sanitizeNotificationContent(payload.subject);
    const cleanText = sanitizeNotificationContent(payload.textBody);

    // 1. LIVE RESEND DISPATCH (When configured)
    if (this.isConfigured && this.providerName.toLowerCase() === 'resend') {
      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: this.fromEmail,
            to: payload.to,
            subject: cleanSubject,
            text: cleanText,
            html: payload.htmlBody || `<div style="font-family:sans-serif;line-height:1.6;color:#1e293b;">${cleanText.replace(/\n/g, '<br/>')}</div>`
          })
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || 'Resend API rejected transmission');
        }

        return {
          success: true,
          provider: 'Resend Official API',
          messageId: data.id || `resend-${Date.now()}`,
          simulated: false
        };
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Email delivery failed';
        console.warn('Resend live dispatch failed, falling back to simulated ledger record:', errorMsg);
        return {
          success: false,
          provider: 'Resend Official API',
          messageId: '',
          simulated: false,
          error: errorMsg
        };
      }
    }

    // 2. HONEST SIMULATION MODE (Safe offline/test execution)
    // Strictly records transmission with 'simulated: true' and transparent provider labeling
    const simulatedId = 'sim-eml-' + crypto.randomUUID();
    return {
      success: true,
      provider: 'Email Delivery Simulator (Offline Mode)',
      messageId: simulatedId,
      simulated: true
    };
  }

  generateDailyDiaryHtml(advocateName: string, date: string, hearings: any[], language: 'hi' | 'en' = 'en'): string {
    const isHi = language === 'hi';
    const rows = hearings.map((h, i) => `
      <tr style="border-bottom:1px solid #e2e8f0;">
        <td style="padding:10px;font-weight:bold;">${i + 1}</td>
        <td style="padding:10px;">${h.case_title || 'Case Matter'}</td>
        <td style="padding:10px;font-family:monospace;">${h.court_room || h.court_name || 'Alwar Court'}</td>
        <td style="padding:10px;">${h.judge_name || 'Presiding Officer'}</td>
        <td style="padding:10px;color:#d97706;font-weight:bold;">${h.next_action || 'Hearing / Arguments'}</td>
      </tr>
    `).join('');

    return `
      <div style="font-family:serif,sans-serif;max-width:650px;margin:auto;padding:24px;border:1px solid #cbd5e1;border-radius:12px;background:#ffffff;">
        <div style="border-bottom:2px solid #b45309;padding-bottom:12px;margin-bottom:16px;">
          <h2 style="color:#1e293b;margin:0;">${isHi ? 'दैनिक पेशी डायरी सूचना' : 'Daily Court Hearing Diary Alert'}</h2>
          <p style="color:#64748b;font-size:12px;margin:4px 0 0 0;">District & Sessions Bar Association, Alwar (Rajasthan) • Date: ${date}</p>
        </div>
        <p style="color:#334155;font-size:14px;">Respected <strong>${advocateName}</strong>, here is your listed court schedule for today:</p>
        <table style="width:100%;border-collapse:collapse;font-size:12px;text-align:left;margin-top:12px;">
          <thead>
            <tr style="background:#f8fafc;border-bottom:2px solid #cbd5e1;color:#475569;">
              <th style="padding:8px;">#</th>
              <th style="padding:8px;">Case / Parties</th>
              <th style="padding:8px;">Court Room</th>
              <th style="padding:8px;">Judge</th>
              <th style="padding:8px;">Purpose</th>
            </tr>
          </thead>
          <tbody>
            ${rows.length > 0 ? rows : '<tr><td colspan="5" style="padding:16px;text-align:center;color:#94a3b8;">No hearings listed for today.</td></tr>'}
          </tbody>
        </table>
        <div style="margin-top:24px;border-top:1px solid #e2e8f0;padding-top:12px;font-size:11px;color:#94a3b8;">
          Sent by Alwar Advocates SaaS Platform • Automated Notification Engine
        </div>
      </div>
    `;
  }
}

export const emailService = new EmailNotificationService();
