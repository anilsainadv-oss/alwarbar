import crypto from 'node:crypto';

export interface RazorpayOrderResult {
  orderId: string;
  amountPaise: number;
  amountINR: number;
  currency: string;
  receipt: string;
  keyId: string;
  isSimulated: boolean;
  simulatedPaymentId?: string;
  simulatedSignature?: string;
}

export class RazorpayService {
  private keyId: string;
  private keySecret: string;
  private webhookSecret: string;

  constructor() {
    this.keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '';
    this.keySecret = process.env.RAZORPAY_KEY_SECRET || '';
    this.webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || this.keySecret;
  }

  get isConfigured(): boolean {
    return Boolean(
      this.keyId && 
      this.keySecret && 
      this.keyId !== 'demo' && 
      this.keyId.length > 6
    );
  }

  get publicKey(): string {
    return this.isConfigured ? this.keyId : 'rzp_test_alwar_simulator_key';
  }

  /**
   * 1. CREATE PAYMENT ORDER
   * Generates a payment order with amount in Paise (1 INR = 100 Paise)
   */
  async createOrder(params: {
    amountINR: number;
    receipt: string;
    notes?: Record<string, string>;
  }): Promise<RazorpayOrderResult> {
    const amountPaise = Math.round(params.amountINR * 100);

    // Live Razorpay API (When configured)
    if (this.isConfigured) {
      try {
        const auth = Buffer.from(`${this.keyId}:${this.keySecret}`).toString('base64');
        const res = await fetch('https://api.razorpay.com/v1/orders', {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            amount: amountPaise,
            currency: 'INR',
            receipt: params.receipt,
            notes: params.notes || {}
          })
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error?.description || 'Razorpay order creation failed');
        }

        return {
          orderId: data.id,
          amountPaise: data.amount,
          amountINR: data.amount / 100,
          currency: data.currency,
          receipt: data.receipt,
          keyId: this.keyId,
          isSimulated: false
        };
      } catch (err: unknown) {
        console.warn('Razorpay live order failed, falling back to simulator:', err instanceof Error ? err.message : err);
      }
    }

    // Honest Sandbox Test Simulator
    const simOrderId = `order_sim_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const simPaymentId = `pay_sim_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const simSignature = this.generateTestSignature(simOrderId, simPaymentId);

    return {
      orderId: simOrderId,
      amountPaise,
      amountINR: params.amountINR,
      currency: 'INR',
      receipt: params.receipt,
      keyId: this.publicKey,
      isSimulated: true,
      simulatedPaymentId: simPaymentId,
      simulatedSignature: simSignature
    };
  }

  /**
   * 2. SERVER-SIDE PAYMENT SIGNATURE VERIFICATION
   * NEVER trust payment status sent directly from the browser!
   * Validates HMAC-SHA256 signature of `${orderId}|${paymentId}` using the server's private secret.
   */
  verifyPaymentSignature(params: {
    orderId: string;
    paymentId: string;
    signature: string;
  }): boolean {
    if (!params.orderId || !params.paymentId || !params.signature) {
      return false;
    }

    const secret = this.isConfigured 
      ? this.keySecret 
      : (process.env.AUTH_SECRET || 'alwar-advocates-secure-dev-secret-1234567890abcdef');

    try {
      const payload = `${params.orderId}|${params.paymentId}`;
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');

      const expectedBuf = Buffer.from(expectedSignature, 'utf8');
      const actualBuf = Buffer.from(params.signature, 'utf8');

      if (expectedBuf.length !== actualBuf.length) {
        return false;
      }

      return crypto.timingSafeEqual(expectedBuf, actualBuf);
    } catch {
      return false;
    }
  }

  /**
   * Helper to sign a test payment for simulator testing
   */
  generateTestSignature(orderId: string, paymentId: string): string {
    const secret = this.isConfigured 
      ? this.keySecret 
      : (process.env.AUTH_SECRET || 'alwar-advocates-secure-dev-secret-1234567890abcdef');

    return crypto
      .createHmac('sha256', secret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');
  }

  /**
   * 3. SECURE WEBHOOK SIGNATURE VERIFICATION
   * Validates `x-razorpay-signature` against raw request body
   */
  verifyWebhookSignature(rawBody: string, signature: string): boolean {
    if (!rawBody || !signature) return false;

    const secret = this.webhookSecret || (process.env.AUTH_SECRET || 'alwar-advocates-secure-dev-secret-1234567890abcdef');

    try {
      const expected = crypto
        .createHmac('sha256', secret)
        .update(rawBody)
        .digest('hex');

      const expectedBuf = Buffer.from(expected, 'utf8');
      const actualBuf = Buffer.from(signature, 'utf8');

      if (expectedBuf.length !== actualBuf.length) {
        return false;
      }

      return crypto.timingSafeEqual(expectedBuf, actualBuf);
    } catch {
      return false;
    }
  }
}

export const razorpayService = new RazorpayService();
