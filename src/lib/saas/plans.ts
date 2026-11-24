import type { SubscriptionPlan, SubscriptionPlanId, BillingCycle, PlanFeatureLimits } from '@/types/mycase';

export const SUBSCRIPTION_PLANS: Record<SubscriptionPlanId, SubscriptionPlan> = {
  starter: {
    id: 'starter',
    name: 'Starter Practice',
    name_hi: 'प्रारंभिक अभ्यास (स्टार्टर)',
    description: 'Essential digital office tools for junior advocates and solo practitioners.',
    monthly_price_inr: 0,
    yearly_price_inr: 0,
    limits: {
      max_active_cases: 15,
      max_clients: 20,
      max_storage_bytes: 250 * 1024 * 1024, // 250 MB
      max_monthly_ai_queries: 25,
      max_team_members: 1, // Solo advocate
      has_docx_export: false,
      has_whatsapp_notifications: false,
      has_cause_list_matcher: true,
      has_custom_letterhead: false,
      has_priority_support: false
    }
  },
  professional: {
    id: 'professional',
    name: 'Professional Advocate',
    name_hi: 'व्यावसायिक अधिवक्ता (प्रोफेशनल)',
    description: 'Comprehensive practice suite with AI legal research, Word drafting, and WhatsApp client alerts.',
    monthly_price_inr: 999,
    yearly_price_inr: 9999, // ~₹833/month (Save ~₹2,000 / 2 months free)
    highlight: true,
    limits: {
      max_active_cases: 150,
      max_clients: 250,
      max_storage_bytes: 5 * 1024 * 1024 * 1024, // 5 GB
      max_monthly_ai_queries: 500,
      max_team_members: 3, // Advocate + 2 Juniors / Clerks
      has_docx_export: true,
      has_whatsapp_notifications: true,
      has_cause_list_matcher: true,
      has_custom_letterhead: true,
      has_priority_support: false
    }
  },
  chamber: {
    id: 'chamber',
    name: 'Chamber & Firm Partner',
    name_hi: 'चेम्बर एवं फर्म पार्टनर',
    description: 'Full multi-user team management, multi-advocate docket routing, and 50 GB document vault.',
    monthly_price_inr: 2499,
    yearly_price_inr: 24999, // ~₹2,083/month (Save ~₹5,000 / 2 months free)
    limits: {
      max_active_cases: 2000,
      max_clients: 5000,
      max_storage_bytes: 50 * 1024 * 1024 * 1024, // 50 GB
      max_monthly_ai_queries: 2500,
      max_team_members: 10, // Full legal chamber team
      has_docx_export: true,
      has_whatsapp_notifications: true,
      has_cause_list_matcher: true,
      has_custom_letterhead: true,
      has_priority_support: true
    }
  }
};

export const GST_RATE = 0.18; // 18% GST (SAC 9982 - Legal Support & Software Services)

export function getPlan(planId: SubscriptionPlanId): SubscriptionPlan {
  return SUBSCRIPTION_PLANS[planId] || SUBSCRIPTION_PLANS.starter;
}

export function getPlanLimits(planId: SubscriptionPlanId): PlanFeatureLimits {
  return getPlan(planId).limits;
}

export function calculatePlanPrice(planId: SubscriptionPlanId, cycle: BillingCycle): {
  baseAmount: number;
  gstAmount: number;
  totalAmount: number;
  gstRate: number;
  discountApplied: number;
} {
  const plan = getPlan(planId);
  const baseAmount = cycle === 'yearly' ? plan.yearly_price_inr : plan.monthly_price_inr;
  const standardYearlyIfMonthly = plan.monthly_price_inr * 12;
  const discountApplied = cycle === 'yearly' && standardYearlyIfMonthly > 0 ? (standardYearlyIfMonthly - plan.yearly_price_inr) : 0;

  const gstAmount = Math.round(baseAmount * GST_RATE);
  const totalAmount = baseAmount + gstAmount;

  return {
    baseAmount,
    gstAmount,
    totalAmount,
    gstRate: GST_RATE,
    discountApplied
  };
}
