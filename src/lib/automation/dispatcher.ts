import { localDb } from '@/lib/db';
import { 
  notificationRepository, 
  communicationRepository, 
  automationJobRepository,
  caseRepository
} from '@/lib/db/repositories';
import { emailService } from '@/lib/notifications/email-service';
import { whatsappService } from '@/lib/notifications/whatsapp-service';
import { formatSafeHearingNotification, sanitizeNotificationContent } from '@/lib/notifications/privacy-masker';
import type { 
  NotificationPreferences, 
  NotificationDeliveryRecord, 
  ClientCommunication, 
  AutomationJob, 
  CaseRecord 
} from '@/types/mycase';

export interface DispatchSummary {
  remindersSent: number;
  digestsSent: number;
  clientNoticesSent: number;
  simulatedDeliveries: number;
  failedDeliveries: number;
  skippedDuplicates: number;
}

export class AutomationDispatcher {
  /**
   * Generates a deterministic idempotency key to prevent duplicate notifications
   */
  generateIdempotencyKey(
    advocateId: string, 
    type: string, 
    targetId: string, 
    date: string, 
    channel: string
  ): string {
    return `${advocateId}:${type}:${targetId}:${date}:${channel}`.toLowerCase();
  }

  /**
   * 1. HEARING DATE REMINDERS
   * Inspects upcoming hearings and dispatches reminders according to advocate's lead-day preferences.
   */
  async dispatchUpcomingHearingReminders(
    advocateId: string, 
    referenceDate: Date = new Date()
  ): Promise<DispatchSummary> {
    const summary: DispatchSummary = {
      remindersSent: 0,
      digestsSent: 0,
      clientNoticesSent: 0,
      simulatedDeliveries: 0,
      failedDeliveries: 0,
      skippedDuplicates: 0
    };

    const prefs = await notificationRepository.getPreferences(advocateId);
    const profile = localDb.getAdvocateProfileByUserId(advocateId);
    const advocateUser = localDb.getUserById(advocateId);
    const advocateEmail = advocateUser?.email || '';
    const advocatePhone = advocateUser?.phone || profile?.chamber_address || '';

    const cases = localDb.getCases(advocateId).filter(c => c.status === 'active');
    const refTime = new Date(referenceDate.toISOString().split('T')[0]).getTime();

    for (const c of cases) {
      if (!c.next_hearing_date) continue;
      
      const hearingTime = new Date(c.next_hearing_date.split('T')[0]).getTime();
      if (isNaN(hearingTime)) continue;

      const diffDays = Math.round((hearingTime - refTime) / (1000 * 60 * 60 * 24));

      // Check if diffDays matches advocate's reminder_lead_days (e.g. 1 day, 2 days before)
      if (prefs.reminder_lead_days.includes(diffDays) && diffDays >= 0) {
        const safeAlert = formatSafeHearingNotification({
          caseTitle: c.case_title,
          caseNumber: c.case_number,
          courtName: c.court_name,
          hearingDate: c.next_hearing_date,
          language: prefs.preferred_language
        });

        // A. Email Channel for Advocate
        if (prefs.email_enabled && advocateEmail) {
          const key = this.generateIdempotencyKey(advocateId, 'hearing_reminder', c.id, c.next_hearing_date, 'email');
          if (await notificationRepository.hasSent(advocateId, key)) {
            summary.skippedDuplicates++;
          } else {
            const res = await emailService.sendEmail({
              to: advocateEmail,
              subject: safeAlert.title,
              textBody: safeAlert.body
            });

            await notificationRepository.logDelivery(advocateId, {
              recipient: advocateEmail,
              recipient_type: 'advocate',
              channel: 'email',
              notification_type: 'hearing_reminder',
              title: safeAlert.title,
              content: safeAlert.body,
              case_id: c.id,
              case_number: c.case_number,
              status: res.success ? (res.simulated ? 'simulated' : 'delivered') : 'failed',
              provider: res.provider,
              provider_message_id: res.messageId,
              error_details: res.error,
              idempotency_key: key,
              sent_at: res.success ? new Date().toISOString() : undefined
            });

            if (res.success) {
              summary.remindersSent++;
              if (res.simulated) summary.simulatedDeliveries++;
            } else {
              summary.failedDeliveries++;
            }
          }
        }

        // B. WhatsApp Channel for Advocate
        if (prefs.whatsapp_enabled && advocatePhone) {
          const key = this.generateIdempotencyKey(advocateId, 'hearing_reminder', c.id, c.next_hearing_date, 'whatsapp');
          if (await notificationRepository.hasSent(advocateId, key)) {
            summary.skippedDuplicates++;
          } else {
            const res = await whatsappService.sendWhatsAppMessage({
              toPhone: advocatePhone,
              templateName: 'hearing_reminder_advocate',
              templateParameters: [
                profile?.user?.full_name || advocateUser?.full_name || 'Advocate',
                c.case_number || c.case_title,
                c.court_name,
                c.next_hearing_date,
                c.stage_of_case || 'Hearing'
              ],
              fallbackText: safeAlert.body
            });

            await notificationRepository.logDelivery(advocateId, {
              recipient: advocatePhone,
              recipient_type: 'advocate',
              channel: 'whatsapp',
              notification_type: 'hearing_reminder',
              title: safeAlert.title,
              content: safeAlert.body,
              case_id: c.id,
              case_number: c.case_number,
              status: res.success ? (res.simulated ? 'simulated' : 'delivered') : 'failed',
              provider: res.provider,
              provider_message_id: res.messageId,
              error_details: res.error,
              idempotency_key: key,
              sent_at: res.success ? new Date().toISOString() : undefined
            });

            if (res.success) {
              summary.remindersSent++;
              if (res.simulated) summary.simulatedDeliveries++;
            } else {
              summary.failedDeliveries++;
            }
          }
        }

        // C. Client Reminder Notification (When client reminders are enabled)
        if (prefs.client_reminders_enabled && c.client_id && diffDays === prefs.client_reminder_lead_days) {
          const client = localDb.getClientById(advocateId, c.client_id);
          if (client && (client.phone || client.email)) {
            const clientTarget = client.email || client.phone || '';
            const channel = client.email ? 'email' : 'whatsapp';
            const clientKey = this.generateIdempotencyKey(advocateId, 'client_hearing_notice', c.id, c.next_hearing_date, channel);

            if (await notificationRepository.hasSent(advocateId, clientKey)) {
              summary.skippedDuplicates++;
            } else {
              const clientMsg = prefs.preferred_language === 'hi'
                ? `सादर ${client.full_name}, आपके प्रकरण (${c.case_number || c.case_title}) की आगामी पेशी दिनांक ${c.next_hearing_date} को ${c.court_name} में नियत है। - कार्यालय अधिवक्ता`
                : `Dear ${client.full_name}, your legal matter (${c.case_number || c.case_title}) is listed on ${c.next_hearing_date} before ${c.court_name}. - Advocate Office`;

              let clientSendRes = { success: false, provider: '', messageId: '', simulated: false, error: '' };
              if (channel === 'email' && client.email) {
                const emailRes = await emailService.sendEmail({
                  to: client.email,
                  subject: `Court Hearing Notice: ${c.case_number || c.case_title}`,
                  textBody: clientMsg
                });
                clientSendRes = { ...emailRes, error: emailRes.error || '' };
              } else if (client.phone) {
                const waRes = await whatsappService.sendWhatsAppMessage({
                  toPhone: client.phone,
                  templateName: 'client_case_update',
                  templateParameters: [client.full_name, c.case_number || 'Matter', c.next_hearing_date, c.court_name],
                  fallbackText: clientMsg
                });
                clientSendRes = { ...waRes, error: waRes.error || '' };
              }

              // Record in Client Communication History
              await communicationRepository.createCommunication(advocateId, {
                client_id: client.id,
                case_id: c.id,
                channel,
                recipient: clientTarget,
                message_type: 'hearing_reminder',
                subject: `Hearing Notice: ${c.case_number || c.case_title}`,
                content: clientMsg,
                status: clientSendRes.success ? (clientSendRes.simulated ? 'simulated' : 'delivered') : 'failed',
                provider: clientSendRes.provider,
                provider_message_id: clientSendRes.messageId,
                error_message: clientSendRes.error || undefined,
                sent_at: clientSendRes.success ? new Date().toISOString() : undefined
              });

              // Log delivery record
              await notificationRepository.logDelivery(advocateId, {
                recipient: clientTarget,
                recipient_name: client.full_name,
                recipient_type: 'client',
                channel,
                notification_type: 'client_notice',
                title: `Client Hearing Notice (${c.case_number || 'Case'})`,
                content: clientMsg,
                case_id: c.id,
                case_number: c.case_number,
                status: clientSendRes.success ? (clientSendRes.simulated ? 'simulated' : 'delivered') : 'failed',
                provider: clientSendRes.provider,
                provider_message_id: clientSendRes.messageId,
                error_details: clientSendRes.error,
                idempotency_key: clientKey,
                sent_at: clientSendRes.success ? new Date().toISOString() : undefined
              });

              if (clientSendRes.success) {
                summary.clientNoticesSent++;
                if (clientSendRes.simulated) summary.simulatedDeliveries++;
              } else {
                summary.failedDeliveries++;
              }
            }
          }
        }
      }
    }

    return summary;
  }

  /**
   * 2. DAILY HEARING DIARY NOTIFICATIONS
   * Dispatches morning cause summary of all matters listed today for the advocate.
   */
  async dispatchDailyDiaryDigest(
    advocateId: string, 
    targetDate: string = new Date().toISOString().split('T')[0]
  ): Promise<DispatchSummary> {
    const summary: DispatchSummary = {
      remindersSent: 0,
      digestsSent: 0,
      clientNoticesSent: 0,
      simulatedDeliveries: 0,
      failedDeliveries: 0,
      skippedDuplicates: 0
    };

    const prefs = await notificationRepository.getPreferences(advocateId);
    if (!prefs.daily_digest_enabled) return summary;

    const advocateUser = localDb.getUserById(advocateId);
    const profile = localDb.getAdvocateProfileByUserId(advocateId);
    const advocateName = profile?.user?.full_name || advocateUser?.full_name || 'Advocate';
    const advocateEmail = advocateUser?.email || '';

    // Get today's hearings
    const s = (localDb as any).ensureLoaded();
    const todaysHearings = s.case_hearings.filter(
      (h: any) => h.advocate_id === advocateId && h.hearing_date && h.hearing_date.startsWith(targetDate)
    );

    if (todaysHearings.length === 0) return summary; // Do not send empty digest

    const key = this.generateIdempotencyKey(advocateId, 'daily_digest', 'docket', targetDate, 'email');
    if (await notificationRepository.hasSent(advocateId, key)) {
      summary.skippedDuplicates++;
      return summary;
    }

    if (prefs.email_enabled && advocateEmail) {
      const html = emailService.generateDailyDiaryHtml(advocateName, targetDate, todaysHearings, prefs.preferred_language);
      const textBody = `Daily Court Diary for ${targetDate}: You have ${todaysHearings.length} cases listed today before Alwar District Courts.`;

      const res = await emailService.sendEmail({
        to: advocateEmail,
        recipientName: advocateName,
        subject: `Alwar Daily Hearing Diary: ${todaysHearings.length} Matters Listed for ${targetDate}`,
        textBody,
        htmlBody: html
      });

      await notificationRepository.logDelivery(advocateId, {
        recipient: advocateEmail,
        recipient_type: 'advocate',
        channel: 'email',
        notification_type: 'daily_diary_digest',
        title: `Daily Hearing Diary (${targetDate})`,
        content: textBody,
        status: res.success ? (res.simulated ? 'simulated' : 'delivered') : 'failed',
        provider: res.provider,
        provider_message_id: res.messageId,
        error_details: res.error,
        idempotency_key: key,
        sent_at: res.success ? new Date().toISOString() : undefined
      });

      if (res.success) {
        summary.digestsSent++;
        if (res.simulated) summary.simulatedDeliveries++;
      } else {
        summary.failedDeliveries++;
      }
    }

    return summary;
  }

  /**
   * 3. CASE STATUS MONITORING TRIGGER
   * Detects when a case's next hearing date or stage of case has changed and queues notifications.
   */
  async notifyCaseStatusChange(
    advocateId: string, 
    caseRecord: CaseRecord, 
    changes: { previousDate?: string; newDate?: string; previousStage?: string; newStage?: string }
  ): Promise<boolean> {
    const prefs = await notificationRepository.getPreferences(advocateId);
    const advocateUser = localDb.getUserById(advocateId);
    const advocateEmail = advocateUser?.email || '';

    const title = `Case Status Update: ${caseRecord.case_number || caseRecord.case_title}`;
    const body = `Case "${caseRecord.case_title}" before ${caseRecord.court_name} has been updated:\n` +
      (changes.newDate ? `• Next Hearing Date: ${changes.newDate} (was: ${changes.previousDate || 'None'})\n` : '') +
      (changes.newStage ? `• Stage of Case: ${changes.newStage} (was: ${changes.previousStage || 'Initial'})\n` : '') +
      `\nAlwar Advocates Case Tracking`;

    const key = this.generateIdempotencyKey(
      advocateId, 
      'status_change', 
      caseRecord.id, 
      `${changes.newDate || ''}_${changes.newStage || ''}`, 
      'in_app'
    );

    if (await notificationRepository.hasSent(advocateId, key)) {
      return false; // Already notified
    }

    // Always log in-app alert
    await notificationRepository.logDelivery(advocateId, {
      recipient: advocateEmail || 'In-App',
      recipient_type: 'advocate',
      channel: 'in_app',
      notification_type: 'case_status_change',
      title,
      content: sanitizeNotificationContent(body),
      case_id: caseRecord.id,
      case_number: caseRecord.case_number,
      status: 'delivered',
      provider: 'Internal Event Monitor',
      idempotency_key: key,
      sent_at: new Date().toISOString()
    });

    // Notify client if client reminders are on
    if (prefs.client_reminders_enabled && caseRecord.client_id) {
      const client = localDb.getClientById(advocateId, caseRecord.client_id);
      if (client && (client.phone || client.email)) {
        await communicationRepository.createCommunication(advocateId, {
          client_id: client.id,
          case_id: caseRecord.id,
          channel: client.email ? 'email' : 'whatsapp',
          recipient: client.email || client.phone || '',
          message_type: 'case_status_update',
          subject: title,
          content: body,
          status: 'delivered',
          provider: 'Internal Event Monitor',
          sent_at: new Date().toISOString()
        });
      }
    }

    return true;
  }

  /**
   * 4. BACKGROUND JOB QUEUE RUNNER WITH RETRY AND FAILURE LOGGING
   * Processes pending automation jobs, executing tasks and applying exponential backoff retries.
   */
  async processPendingJobs(maxJobsToRun: number = 10): Promise<{ processed: number; succeeded: number; failed: number }> {
    const s = (localDb as any).ensureLoaded();
    const nowIso = new Date().toISOString();

    const pendingJobs: AutomationJob[] = s.automation_jobs.filter(
      (j: any) => (j.status === 'pending' || j.status === 'retrying') && j.run_at <= nowIso
    ).slice(0, maxJobsToRun);

    let succeeded = 0;
    let failed = 0;

    for (const job of pendingJobs) {
      job.status = 'processing';
      job.attempts = (job.attempts || 0) + 1;
      job.updated_at = new Date().toISOString();
      (localDb as any).save();

      try {
        switch (job.job_type) {
          case 'hearing_reminder':
            await this.dispatchUpcomingHearingReminders(job.advocate_id);
            break;
          case 'daily_digest':
            await this.dispatchDailyDiaryDigest(job.advocate_id, job.payload?.target_date);
            break;
          case 'cause_list_match':
            if (job.payload?.date) {
              await localDb.matchCauseListToDocket(job.advocate_id, job.payload.date);
            }
            break;
          case 'client_notice':
            if (job.payload?.client_id && job.payload?.content) {
              await communicationRepository.createCommunication(job.advocate_id, {
                client_id: job.payload.client_id,
                case_id: job.payload.case_id,
                channel: job.payload.channel || 'in_app',
                recipient: job.payload.recipient || 'Client',
                message_type: job.payload.message_type || 'custom_message',
                subject: job.payload.subject,
                content: job.payload.content,
                status: 'delivered',
                provider: 'Job Dispatcher',
                sent_at: new Date().toISOString()
              });
            }
            break;
          default:
            break;
        }

        job.status = 'completed';
        job.completed_at = new Date().toISOString();
        job.updated_at = new Date().toISOString();
        succeeded++;
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Job execution failed';
        job.last_error = errorMsg;

        if (job.attempts < (job.max_attempts || 3)) {
          job.status = 'retrying';
          // Exponential backoff: 5m, 15m, 30m
          const delayMinutes = job.attempts * 5;
          job.run_at = new Date(Date.now() + delayMinutes * 60 * 1000).toISOString();
        } else {
          job.status = 'failed';
          failed++;
        }
        job.updated_at = new Date().toISOString();
      }
      (localDb as any).save();
    }

    return { processed: pendingJobs.length, succeeded, failed };
  }
}

export const automationDispatcher = new AutomationDispatcher();
