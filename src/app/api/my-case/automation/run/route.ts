import { NextResponse } from 'next/server';
import { getCurrentUser, assertAuthenticated } from '@/lib/auth/guards';
import { automationDispatcher } from '@/lib/automation/dispatcher';
import { runAutomationSchema } from '@/lib/validation/schemas';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    assertAuthenticated(user);

    let jobType = 'all';
    let targetDateStr = new Date().toISOString().split('T')[0];

    try {
      const json = await req.json();
      const parseResult = runAutomationSchema.safeParse(json);
      if (parseResult.success) {
        jobType = parseResult.data.job_type || 'all';
        if (parseResult.data.target_date) {
          targetDateStr = parseResult.data.target_date;
        }
      }
    } catch {
      // Body is optional; default to 'all'
    }

    const refDate = new Date(`${targetDateStr}T08:00:00.000Z`);

    let reminderSummary = { remindersSent: 0, digestsSent: 0, clientNoticesSent: 0, simulatedDeliveries: 0, failedDeliveries: 0, skippedDuplicates: 0 };
    let digestSummary = { remindersSent: 0, digestsSent: 0, clientNoticesSent: 0, simulatedDeliveries: 0, failedDeliveries: 0, skippedDuplicates: 0 };

    if (jobType === 'all' || jobType === 'hearing_reminders') {
      reminderSummary = await automationDispatcher.dispatchUpcomingHearingReminders(user.id, refDate);
    }

    if (jobType === 'all' || jobType === 'daily_digest') {
      digestSummary = await automationDispatcher.dispatchDailyDiaryDigest(user.id, targetDateStr);
    }

    // Process queued background jobs
    const jobsResult = await automationDispatcher.processPendingJobs(10);

    return NextResponse.json({
      success: true,
      executionDate: targetDateStr,
      remindersSent: reminderSummary.remindersSent,
      digestsSent: digestSummary.digestsSent,
      clientNoticesSent: reminderSummary.clientNoticesSent,
      simulatedDeliveries: reminderSummary.simulatedDeliveries + digestSummary.simulatedDeliveries,
      skippedDuplicates: reminderSummary.skippedDuplicates + digestSummary.skippedDuplicates,
      queuedJobsProcessed: jobsResult.processed,
      queuedJobsSucceeded: jobsResult.succeeded,
      queuedJobsFailed: jobsResult.failed
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Automation execution failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
