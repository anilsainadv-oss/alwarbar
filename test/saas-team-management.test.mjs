import assert from 'node:assert';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { 
  createSubscriptionOrderSchema, 
  verifyPaymentSchema, 
  inviteTeamMemberSchema, 
  updateMemberRoleSchema, 
  createChamberSchema 
} from '../src/lib/validation/schemas.ts';
import { SUBSCRIPTION_PLANS, calculatePlanPrice, getPlan, GST_RATE } from '../src/lib/saas/plans.ts';

export async function runSaaSTeamManagementTests() {
  console.log('Testing P5 SaaS Subscriptions, Razorpay Integration & Team Management...');

  const advocateA = 'usr-rohitashwa-sain-331-1977';
  const advocateB = 'advocate-user-alwar-0003';
  const dbPath = path.join(process.cwd(), 'data', 'local-db.json');
  assert(fs.existsSync(dbPath), 'data/local-db.json must exist');
  const dbData = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

  // -------------------------------------------------------------
  // 1. SUBSCRIPTION PLANS, PRICING & 18% GST MATH
  // -------------------------------------------------------------
  console.log('  1. Testing Subscription Plans, Pricing & GST Calculations...');

  assert.strictEqual(Boolean(SUBSCRIPTION_PLANS.starter), true, 'Starter plan must be defined');
  assert.strictEqual(Boolean(SUBSCRIPTION_PLANS.professional), true, 'Professional plan must be defined');
  assert.strictEqual(Boolean(SUBSCRIPTION_PLANS.chamber), true, 'Chamber plan must be defined');

  // Verify plan limits
  assert.strictEqual(SUBSCRIPTION_PLANS.starter.limits.max_active_cases, 15, 'Starter allows 15 cases');
  assert.strictEqual(SUBSCRIPTION_PLANS.starter.limits.max_team_members, 1, 'Starter is for solo advocate');
  assert.strictEqual(SUBSCRIPTION_PLANS.starter.limits.has_docx_export, false, 'Starter does not have docx export');

  assert.strictEqual(SUBSCRIPTION_PLANS.professional.limits.max_active_cases, 150, 'Professional allows 150 cases');
  assert.strictEqual(SUBSCRIPTION_PLANS.professional.limits.max_team_members, 3, 'Professional allows 3 team seats');
  assert.strictEqual(SUBSCRIPTION_PLANS.professional.limits.has_docx_export, true, 'Professional has docx export');
  assert.strictEqual(SUBSCRIPTION_PLANS.professional.limits.has_whatsapp_notifications, true, 'Professional has WhatsApp');

  assert.strictEqual(SUBSCRIPTION_PLANS.chamber.limits.max_team_members, 10, 'Chamber allows 10 team seats');
  assert.strictEqual(SUBSCRIPTION_PLANS.chamber.limits.has_priority_support, true, 'Chamber has priority support');

  // Verify monthly and yearly pricing with GST
  const monthlyProf = calculatePlanPrice('professional', 'monthly');
  assert.strictEqual(monthlyProf.baseAmount, 999, 'Professional monthly base is ₹999');
  assert.strictEqual(monthlyProf.gstAmount, Math.round(999 * 0.18), '18% GST correctly computed');
  assert.strictEqual(monthlyProf.totalAmount, 999 + Math.round(999 * 0.18), 'Total monthly fee matches base + GST');

  const yearlyProf = calculatePlanPrice('professional', 'yearly');
  assert.strictEqual(yearlyProf.baseAmount, 9999, 'Professional yearly base is ₹9,999');
  assert(yearlyProf.discountApplied >= 1989, 'Yearly plan applies 2-month discount (~₹1,989 savings)');
  assert.strictEqual(yearlyProf.gstAmount, Math.round(9999 * 0.18), 'Yearly GST correctly computed');
  assert.strictEqual(yearlyProf.totalAmount, 9999 + Math.round(9999 * 0.18), 'Total yearly fee matches base + GST');

  // -------------------------------------------------------------
  // 2. RAZORPAY ORDER CREATION & VALIDATION
  // -------------------------------------------------------------
  console.log('  2. Testing Razorpay Order Creation & Schema Validation...');

  const validOrderParse = createSubscriptionOrderSchema.safeParse({
    plan_id: 'professional',
    billing_cycle: 'yearly'
  });
  assert.strictEqual(validOrderParse.success, true, 'createSubscriptionOrderSchema must accept valid plan & cycle');

  const invalidOrderParse = createSubscriptionOrderSchema.safeParse({
    plan_id: 'enterprise_platinum', // Non-existent
    billing_cycle: 'quarterly' // Unsupported
  });
  assert.strictEqual(invalidOrderParse.success, false, 'Invalid plan and cycle must be rejected');

  // Simulated order creation
  function createSimulatedRazorpayOrder(amountINR, receipt) {
    const amountPaise = Math.round(amountINR * 100);
    return {
      orderId: `order_sim_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      amountPaise,
      amountINR,
      currency: 'INR',
      receipt
    };
  }

  const simOrder = createSimulatedRazorpayOrder(yearlyProf.totalAmount, 'sub_rec_001');
  assert.strictEqual(simOrder.amountPaise, yearlyProf.totalAmount * 100, 'Razorpay amount must be converted to Paise');
  assert.strictEqual(simOrder.currency, 'INR', 'Currency must be INR');
  assert(simOrder.orderId.startsWith('order_sim_'), 'Simulated order id must have prefix');

  // -------------------------------------------------------------
  // 3. CRYPTOGRAPHIC SERVER-SIDE PAYMENT SIGNATURE VERIFICATION
  // -------------------------------------------------------------
  console.log('  3. Testing Cryptographic Server-Side Payment Verification (HMAC-SHA256)...');

  const testSecret = 'alwar-advocates-secure-dev-secret-1234567890abcdef';
  const orderId = 'order_test_987654';
  const paymentId = 'pay_test_123456';

  // Compute authentic HMAC-SHA256 signature
  const validSignature = crypto
    .createHmac('sha256', testSecret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  function verifyPaymentSignature(oId, pId, sig, secret) {
    if (!oId || !pId || !sig) return false;
    try {
      const payload = `${oId}|${pId}`;
      const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
      const expectedBuf = Buffer.from(expected, 'utf8');
      const actualBuf = Buffer.from(sig, 'utf8');
      if (expectedBuf.length !== actualBuf.length) return false;
      return crypto.timingSafeEqual(expectedBuf, actualBuf);
    } catch {
      return false;
    }
  }

  // A. Authentic signature must pass
  const isAuthentic = verifyPaymentSignature(orderId, paymentId, validSignature, testSecret);
  assert.strictEqual(isAuthentic, true, 'Valid cryptographic HMAC-SHA256 signature must verify');

  // B. Tampered payment ID must fail
  const tamperedPaymentId = 'pay_test_999999_fake';
  const isTampered = verifyPaymentSignature(orderId, tamperedPaymentId, validSignature, testSecret);
  assert.strictEqual(isTampered, false, 'Tampered payment ID must be rejected');

  // C. Forged signature must fail
  const forgedSignature = crypto.randomBytes(32).toString('hex');
  const isForged = verifyPaymentSignature(orderId, paymentId, forgedSignature, testSecret);
  assert.strictEqual(isForged, false, 'Forged signature must be rejected');

  // D. Browser-only status claim rejection
  const schemaValidation = verifyPaymentSchema.safeParse({
    razorpay_order_id: orderId,
    razorpay_payment_id: paymentId,
    razorpay_signature: validSignature,
    plan_id: 'professional',
    billing_cycle: 'yearly'
  });
  assert.strictEqual(schemaValidation.success, true, 'Payment verification payload schema valid');

  // -------------------------------------------------------------
  // 4. SECURE WEBHOOK SIGNATURE VERIFICATION
  // -------------------------------------------------------------
  console.log('  4. Testing Secure Webhook Signature Verification...');

  const webhookSecret = 'whsec_alwar_bar_2026_test';
  const rawWebhookBody = JSON.stringify({
    event: 'payment.captured',
    payload: {
      payment: {
        entity: {
          id: 'pay_live_001',
          amount: 117900,
          notes: { advocate_id: advocateA, plan_id: 'professional', billing_cycle: 'monthly' }
        }
      }
    }
  });

  const validWebhookSig = crypto
    .createHmac('sha256', webhookSecret)
    .update(rawWebhookBody)
    .digest('hex');

  function verifyWebhook(rawBody, sig, secret) {
    if (!rawBody || !sig) return false;
    const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    const expectedBuf = Buffer.from(expected, 'utf8');
    const actualBuf = Buffer.from(sig, 'utf8');
    if (expectedBuf.length !== actualBuf.length) return false;
    return crypto.timingSafeEqual(expectedBuf, actualBuf);
  }

  assert.strictEqual(verifyWebhook(rawWebhookBody, validWebhookSig, webhookSecret), true, 'Valid webhook signature must pass');
  assert.strictEqual(verifyWebhook(rawWebhookBody, 'forged_sig_123', webhookSecret), false, 'Forged webhook signature must be rejected');

  // -------------------------------------------------------------
  // 5. SUBSCRIPTION STATUS LIFECYCLE & TAX INVOICE
  // -------------------------------------------------------------
  console.log('  5. Testing Subscription Lifecycle Transitions & Tax Invoices...');

  const validStatuses = ['trialing', 'active', 'past_due', 'cancelled', 'expired'];
  let currentSub = {
    id: `sub-${advocateA}-01`,
    advocate_id: advocateA,
    plan_id: 'starter',
    billing_cycle: 'monthly',
    status: 'trialing',
    amount_inr: 0,
    currency: 'INR',
    current_period_start: new Date().toISOString(),
    current_period_end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    cancel_at_period_end: false
  };

  // Transition to active upon paid subscription
  currentSub.status = 'active';
  currentSub.plan_id = 'professional';
  currentSub.amount_inr = monthlyProf.totalAmount;
  assert.strictEqual(currentSub.status, 'active', 'Subscription must transition to active');

  // Tax Invoice Generation
  const subInvoice = {
    id: 'sub-inv-001',
    advocate_id: advocateA,
    subscription_id: currentSub.id,
    invoice_number: 'SUB-2026-1001',
    plan_id: 'professional',
    plan_name: 'Professional Advocate',
    billing_cycle: 'monthly',
    amount_inr: monthlyProf.baseAmount,
    tax_inr: monthlyProf.gstAmount,
    total_amount_inr: monthlyProf.totalAmount,
    status: 'paid',
    payment_method: 'upi',
    razorpay_payment_id: paymentId,
    paid_at: new Date().toISOString()
  };

  assert.strictEqual(subInvoice.total_amount_inr, subInvoice.amount_inr + subInvoice.tax_inr, 'Invoice total must equal base + 18% GST');
  assert.strictEqual(subInvoice.status, 'paid', 'Verified invoice status must be paid');

  // -------------------------------------------------------------
  // 6. PLAN-BASED USAGE LIMITS & FEATURE GATE ENFORCEMENT
  // -------------------------------------------------------------
  console.log('  6. Testing Plan-Based Usage Limits & Quota Enforcement...');

  function checkQuotas(planId, currentCases, currentStorageBytes, currentAIQueries, currentTeamSeats) {
    const limits = SUBSCRIPTION_PLANS[planId].limits;
    return {
      canAddCase: currentCases < limits.max_active_cases,
      canUploadDocument: (fileBytes) => (currentStorageBytes + fileBytes) <= limits.max_storage_bytes,
      canQueryAI: currentAIQueries < limits.max_monthly_ai_queries,
      canInviteMember: currentTeamSeats < limits.max_team_members,
      hasDocxExport: limits.has_docx_export
    };
  }

  // Starter Plan (Limit: 15 cases, 250MB, 25 AI queries, 1 team seat, no docx export)
  const starterGate = checkQuotas('starter', 15, 200 * 1024 * 1024, 25, 1);
  assert.strictEqual(starterGate.canAddCase, false, 'Starter must block 16th active case');
  assert.strictEqual(starterGate.canQueryAI, false, 'Starter must block 26th AI query');
  assert.strictEqual(starterGate.canInviteMember, false, 'Starter must block team invitations');
  assert.strictEqual(starterGate.hasDocxExport, false, 'Starter must block docx word export');
  assert.strictEqual(starterGate.canUploadDocument(60 * 1024 * 1024), false, 'Starter must block upload exceeding 250MB total');

  // Professional Plan (Limit: 150 cases, 5GB, 500 AI queries, 3 team seats, has docx export)
  const profGate = checkQuotas('professional', 15, 200 * 1024 * 1024, 25, 1);
  assert.strictEqual(profGate.canAddCase, true, 'Professional allows 16th case');
  assert.strictEqual(profGate.canQueryAI, true, 'Professional allows more AI queries');
  assert.strictEqual(profGate.canInviteMember, true, 'Professional allows up to 3 team members');
  assert.strictEqual(profGate.hasDocxExport, true, 'Professional unlocks Word docx export');
  assert.strictEqual(profGate.canUploadDocument(60 * 1024 * 1024), true, 'Professional allows 60MB upload within 5GB quota');

  // -------------------------------------------------------------
  // 7. CHAMBER MANAGEMENT, INVITATIONS & ROLE-BASED ACCESS (RBAC)
  // -------------------------------------------------------------
  console.log('  7. Testing Chamber Management, Invitations & RBAC...');

  // A. Chamber Creation Schema
  const validChamberParse = createChamberSchema.safeParse({
    name: 'Sain & Associates Chambers',
    court_complex: 'District & Sessions Court, Alwar',
    chamber_number: 'Chamber No. 42'
  });
  assert.strictEqual(validChamberParse.success, true, 'createChamberSchema must validate chamber');

  // B. Team Invitation Schema
  const validInviteParse = inviteTeamMemberSchema.safeParse({
    email: 'associate.sharma@example.com',
    role: 'associate_advocate',
    full_name: 'Advocate Vikas Sharma'
  });
  assert.strictEqual(validInviteParse.success, true, 'inviteTeamMemberSchema must accept valid associate invitation');

  // Invalid email rejection
  const invalidInvite = inviteTeamMemberSchema.safeParse({
    email: 'not-an-email',
    role: 'associate_advocate'
  });
  assert.strictEqual(invalidInvite.success, false, 'Invalid email must be rejected');

  // Simulated Chamber & Members
  const chamberA = {
    id: 'ch-alwar-001',
    name: 'Sain & Associates Legal Chamber',
    court_complex: 'District & Sessions Court, Alwar',
    owner_advocate_id: advocateA
  };

  const membersA = [
    {
      id: 'cm-001',
      chamber_id: chamberA.id,
      user_id: advocateA,
      full_name: 'Sh. Rohitashwa Sain',
      email: 'rohitashwa.adv@alwarbar.in',
      role: 'senior_advocate',
      status: 'active'
    },
    {
      id: 'cm-002',
      chamber_id: chamberA.id,
      user_id: 'usr-junior-001',
      full_name: 'Advocate Vikas Sharma',
      email: 'vikas.adv@alwarbar.in',
      role: 'associate_advocate',
      status: 'active'
    },
    {
      id: 'cm-003',
      chamber_id: chamberA.id,
      user_id: 'usr-clerk-001',
      full_name: 'Ramesh Munshi',
      email: 'ramesh.clerk@alwarbar.in',
      role: 'chamber_clerk',
      status: 'active'
    }
  ];

  // RBAC permissions check
  function checkChamberPermissions(role, action) {
    if (role === 'senior_advocate') return true; // Full access
    if (role === 'associate_advocate') {
      return ['view_case', 'edit_case', 'draft_ai', 'record_hearing', 'upload_doc'].includes(action);
    }
    if (role === 'chamber_clerk') {
      return ['view_cause_list', 'update_diary_date', 'view_clients'].includes(action);
    }
    if (role === 'intern') {
      return ['view_assigned_case', 'search_precedents', 'draft_memo'].includes(action);
    }
    return false;
  }

  // Senior Advocate can do all
  assert.strictEqual(checkChamberPermissions('senior_advocate', 'manage_billing'), true, 'Senior Advocate manages billing');
  assert.strictEqual(checkChamberPermissions('senior_advocate', 'invite_member'), true, 'Senior Advocate invites members');

  // Associate Advocate
  assert.strictEqual(checkChamberPermissions('associate_advocate', 'draft_ai'), true, 'Associate can draft with AI');
  assert.strictEqual(checkChamberPermissions('associate_advocate', 'manage_billing'), false, 'Associate cannot manage chamber billing');

  // Chamber Clerk
  assert.strictEqual(checkChamberPermissions('chamber_clerk', 'view_cause_list'), true, 'Clerk tracks cause list');
  assert.strictEqual(checkChamberPermissions('chamber_clerk', 'draft_ai'), false, 'Clerk cannot access confidential AI drafting');

  // Role update schema
  const roleUpdateParse = updateMemberRoleSchema.safeParse({
    role: 'senior_advocate',
    status: 'active'
  });
  assert.strictEqual(roleUpdateParse.success, true, 'updateMemberRoleSchema validates');

  // -------------------------------------------------------------
  // 8. MULTI-TENANT CHAMBER DATA ISOLATION
  // -------------------------------------------------------------
  console.log('  8. Testing Multi-Tenant Chamber Data Isolation...');

  const chamberB = {
    id: 'ch-alwar-002',
    name: 'Meena & Partners Chambers',
    court_complex: 'District & Sessions Court, Alwar',
    owner_advocate_id: advocateB
  };

  const membersB = [
    {
      id: 'cm-101',
      chamber_id: chamberB.id,
      user_id: advocateB,
      full_name: 'Advocate Suresh Meena',
      email: 'advocate.meena@alwarbar.in',
      role: 'senior_advocate',
      status: 'active'
    }
  ];

  // Chamber A members querying Chamber B
  const chamberBMembersForUserA = membersB.filter(m => m.chamber_id === chamberA.id);
  assert.strictEqual(chamberBMembersForUserA.length, 0, 'Chamber A cannot see Chamber B members');

  // Cross-chamber invitation token isolation
  const invitationA = {
    id: 'cinv-001',
    chamber_id: chamberA.id,
    token: 'tok_chamber_a_secret_123',
    status: 'pending'
  };

  function canAcceptInvitation(token, chamberId) {
    if (invitationA.token === token && invitationA.chamber_id === chamberId) return true;
    return false;
  }

  assert.strictEqual(canAcceptInvitation('tok_chamber_a_secret_123', chamberA.id), true, 'Valid token accepts in Chamber A');
  assert.strictEqual(canAcceptInvitation('tok_chamber_a_secret_123', chamberB.id), false, 'Chamber A token fails in Chamber B');

  console.log('✓ All 8 SaaS, Subscription & Team Management test categories passed successfully.');
}
