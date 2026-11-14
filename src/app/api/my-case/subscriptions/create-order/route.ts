import { NextResponse } from 'next/server';
import { getCurrentUser, assertAuthenticated } from '@/lib/auth/guards';
import { createSubscriptionOrderSchema } from '@/lib/validation/schemas';
import { calculatePlanPrice, getPlan } from '@/lib/saas/plans';
import { razorpayService } from '@/lib/saas/razorpay';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    assertAuthenticated(user);

    const json = await req.json();
    const parseResult = createSubscriptionOrderSchema.safeParse(json);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.errors[0]?.message || 'Invalid subscription selection' },
        { status: 400 }
      );
    }

    const { plan_id, billing_cycle } = parseResult.data;
    const plan = getPlan(plan_id);

    // Starter plan is free (no payment required)
    if (plan.id === 'starter' || plan.monthly_price_inr === 0) {
      return NextResponse.json({
        freePlan: true,
        plan_id: 'starter',
        message: 'Starter plan does not require payment.'
      });
    }

    const price = calculatePlanPrice(plan_id, billing_cycle);
    const receipt = `sub_${user.id.slice(-6)}_${Date.now().toString().slice(-6)}`;

    const order = await razorpayService.createOrder({
      amountINR: price.totalAmount,
      receipt,
      notes: {
        advocate_id: user.id,
        advocate_email: user.email,
        plan_id,
        billing_cycle,
        base_amount: String(price.baseAmount),
        gst_amount: String(price.gstAmount)
      }
    });

    return NextResponse.json({
      success: true,
      orderId: order.orderId,
      amountPaise: order.amountPaise,
      amountINR: order.amountINR,
      baseAmount: price.baseAmount,
      gstAmount: price.gstAmount,
      gstRate: price.gstRate,
      discountApplied: price.discountApplied,
      currency: order.currency,
      keyId: order.keyId,
      planName: plan.name,
      billingCycle: billing_cycle,
      isSimulated: order.isSimulated,
      simulatedPaymentId: order.simulatedPaymentId,
      simulatedSignature: order.simulatedSignature
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Order creation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
