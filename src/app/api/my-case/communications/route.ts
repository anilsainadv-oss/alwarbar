import { NextResponse } from 'next/server';
import { getCurrentUser, assertAuthenticated } from '@/lib/auth/guards';
import { communicationRepository, notificationRepository } from '@/lib/db/repositories';
import { localDb } from '@/lib/db';
import { sendCommunicationSchema } from '@/lib/validation/schemas';
import { emailService } from '@/lib/notifications/email-service';
import { whatsappService } from '@/lib/notifications/whatsapp-service';
import { sanitizeNotificationContent } from '@/lib/notifications/privacy-masker';

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    assertAuthenticated(user);

    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get('clientId') || undefined;

    const communications = await communicationRepository.getCommunications(user.id, clientId);
    return NextResponse.json({ communications });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unauthorized';
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    assertAuthenticated(user);

    const json = await req.json();
    const parseResult = sendCommunicationSchema.safeParse(json);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.errors[0]?.message || 'Invalid communication payload' },
        { status: 400 }
      );
    }

    const { client_id, case_id, channel, message_type, subject, content } = parseResult.data;

    // Verify advocate owns this client
    const client = localDb.getClientById(user.id, client_id);
    if (!client) {
      return NextResponse.json({ error: 'Client not found or access denied' }, { status: 404 });
    }

    const cleanContent = sanitizeNotificationContent(content);
    const recipient = channel === 'email' ? (client.email || '') : (client.phone || '');

    if (!recipient) {
      return NextResponse.json(
        { error: `Client does not have a registered ${channel === 'email' ? 'email address' : 'phone number'}` },
        { status: 400 }
      );
    }

    let dispatchResult = { success: false, provider: 'In-App Direct', messageId: '', simulated: false, error: '' };

    if (channel === 'email') {
      const emailRes = await emailService.sendEmail({
        to: recipient,
        recipientName: client.full_name,
        subject: subject || `Legal Notice from Advocate Office`,
        textBody: cleanContent
      });
      dispatchResult = { ...emailRes, error: emailRes.error || '' };
    } else if (channel === 'whatsapp') {
      const waRes = await whatsappService.sendWhatsAppMessage({
        toPhone: recipient,
        recipientName: client.full_name,
        templateName: 'general_notice',
        templateParameters: [client.full_name, cleanContent],
        fallbackText: cleanContent
      });
      dispatchResult = { ...waRes, error: waRes.error || '' };
    } else {
      // In-app or SMS
      dispatchResult = {
        success: true,
        provider: 'In-App Secure Portal',
        messageId: 'inapp-' + crypto.randomUUID(),
        simulated: false,
        error: ''
      };
    }

    const status = dispatchResult.success ? (dispatchResult.simulated ? 'simulated' : 'delivered') : 'failed';

    // 1. Record in Client Communication History
    const comm = await communicationRepository.createCommunication(user.id, {
      client_id,
      case_id,
      channel,
      recipient,
      message_type,
      subject,
      content: cleanContent,
      status,
      provider: dispatchResult.provider,
      provider_message_id: dispatchResult.messageId,
      error_message: dispatchResult.error || undefined,
      sent_at: dispatchResult.success ? new Date().toISOString() : undefined
    });

    // 2. Log in Notification Delivery History
    await notificationRepository.logDelivery(user.id, {
      recipient,
      recipient_name: client.full_name,
      recipient_type: 'client',
      channel,
      notification_type: 'client_notice',
      title: subject || `Notice to ${client.full_name}`,
      content: cleanContent,
      case_id,
      status,
      provider: dispatchResult.provider,
      provider_message_id: dispatchResult.messageId,
      error_details: dispatchResult.error || undefined,
      idempotency_key: `${user.id}:client_notice:${comm.id}:${channel}`,
      sent_at: dispatchResult.success ? new Date().toISOString() : undefined
    });

    return NextResponse.json({
      success: dispatchResult.success,
      communication: comm,
      deliveryStatus: status,
      provider: dispatchResult.provider
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to dispatch communication';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
