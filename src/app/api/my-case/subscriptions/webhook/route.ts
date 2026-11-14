import { NextResponse } from 'next/server';
import { razorpayService } from '@/lib/saas/razorpay';
import { subscriptionRepository } from '@/lib/db/repositories';

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature') || '';

    // Verify webhook signature
    const isValid = razorpayService.verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;
    const paymentEntity = payload.payload?.payment?.entity;

    // Handle payment capture / subscription charge
    if (event === 'payment.captured' || event === 'order.paid') {
      const advocateId = paymentEntity?.notes?.advocate_id;
      const planId = paymentEntity?.notes?.plan_id;
      const billingCycle = paymentEntity?.notes?.billing_cycle || 'monthly';

      if (advocateId && planId) {
        const sub = await subscriptionRepository.getSubscription(advocateId);
        const durationDays = billingCycle === 'yearly' ? 365 : 30;
        const startDate = new Date();
        const endDate = new Date(startDate.getTime() + durationDays * 24 * 60 * 60 * 1000);

        await subscriptionRepository.saveSubscription({
          ...sub,
          plan_id: planId,
          billing_cycle: billingCycle,
          status: 'active',
          razorpay_payment_id: paymentEntity.id,
          amount_inr: (paymentEntity.amount || 0) / 100,
          current_period_start: startDate.toISOString(),
          current_period_end: endDate.toISOString(),
          updated_at: new Date().toISOString()
        });
      }
    } else if (event === 'subscription.cancelled' || event === 'subscription.halted') {
      const advocateId = paymentEntity?.notes?.advocate_id;
      if (advocateId) {
        const sub = await subscriptionRepository.getSubscription(advocateId);
        await subscriptionRepository.saveSubscription({
          ...sub,
          status: 'cancelled',
          updated_at: new Date().toISOString()
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Webhook error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
