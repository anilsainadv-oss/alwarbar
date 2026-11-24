import { NextResponse } from 'next/server';
import { getCurrentUser, assertAuthenticated } from '@/lib/auth/guards';
import { verifyPaymentSchema } from '@/lib/validation/schemas';
import { razorpayService } from '@/lib/saas/razorpay';
import { calculatePlanPrice, getPlan } from '@/lib/saas/plans';
import { subscriptionRepository } from '@/lib/db/repositories';
import type { AdvocateSubscription } from '@/types/mycase';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    assertAuthenticated(user);

    const json = await req.json();
    const parseResult = verifyPaymentSchema.safeParse(json);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.errors[0]?.message || 'Invalid payment verification payload' },
        { status: 400 }
      );
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan_id, billing_cycle } = parseResult.data;

    // 1. CRITICAL SERVER-SIDE SIGNATURE VERIFICATION
    const isValidSignature = razorpayService.verifyPaymentSignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature
    });

    if (!isValidSignature) {
      return NextResponse.json(
        { error: 'Payment signature verification failed. Untrusted or tampered transaction.' },
        { status: 400 }
      );
    }

    // 2. CALCULATE PRICING & DURATION
    const plan = getPlan(plan_id);
    const price = calculatePlanPrice(plan_id, billing_cycle);
    const durationDays = billing_cycle === 'yearly' ? 365 : 30;

    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + durationDays * 24 * 60 * 60 * 1000);

    // 3. ACTIVATE / RENEW SUBSCRIPTION
    const updatedSub: AdvocateSubscription = {
      id: `sub-${user.id}-${Date.now().toString().slice(-6)}`,
      advocate_id: user.id,
      plan_id,
      billing_cycle,
      status: 'active',
      amount_inr: price.totalAmount,
      currency: 'INR',
      current_period_start: startDate.toISOString(),
      current_period_end: endDate.toISOString(),
      razorpay_order_id,
      razorpay_payment_id,
      cancel_at_period_end: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    await subscriptionRepository.saveSubscription(updatedSub);

    // 4. GENERATE OFFICIAL TAX INVOICE RECEIPT (18% GST SAC 9982)
    const invoiceNumber = `SUB-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const invoice = await subscriptionRepository.createInvoice({
      advocate_id: user.id,
      subscription_id: updatedSub.id,
      invoice_number: invoiceNumber,
      plan_id,
      plan_name: plan.name,
      billing_cycle,
      amount_inr: price.baseAmount,
      tax_inr: price.gstAmount,
      total_amount_inr: price.totalAmount,
      status: 'paid',
      payment_method: razorpayService.isConfigured ? 'upi' : 'test_gateway',
      razorpay_payment_id,
      paid_at: new Date().toISOString(),
      receipt_url: `/api/my-case/subscriptions/invoices`
    });

    return NextResponse.json({
      success: true,
      subscription: updatedSub,
      invoice,
      message: `Your ${plan.name} subscription has been activated successfully until ${endDate.toLocaleDateString('en-IN')}.`
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Payment verification failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
