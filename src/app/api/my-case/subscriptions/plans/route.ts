import { NextResponse } from 'next/server';
import { getCurrentUser, assertAuthenticated } from '@/lib/auth/guards';
import { SUBSCRIPTION_PLANS } from '@/lib/saas/plans';
import { featureGate } from '@/lib/saas/feature-gate';
import { razorpayService } from '@/lib/saas/razorpay';

export async function GET() {
  try {
    const user = await getCurrentUser();
    assertAuthenticated(user);

    const subscription = featureGate.getSubscription(user.id);
    const usage = featureGate.getUsageMetrics(user.id);

    return NextResponse.json({
      plans: Object.values(SUBSCRIPTION_PLANS),
      subscription,
      usage,
      razorpayPublicKey: razorpayService.publicKey,
      isTestMode: !razorpayService.isConfigured
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unauthorized';
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
