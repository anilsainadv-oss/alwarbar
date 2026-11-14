import { localDb } from '@/lib/db';
import { getPlan, getPlanLimits } from './plans';
import type { 
  SubscriptionPlanId, 
  PlanFeatureLimits, 
  ChamberUsageMetrics, 
  AdvocateSubscription 
} from '@/types/mycase';

export class FeatureGateService {
  /**
   * Retrieves active subscription for advocate, defaulting to 'starter' trial
   */
  getSubscription(advocateId: string): AdvocateSubscription {
    const s = (localDb as any).ensureLoaded();
    const existing = (s.subscriptions || []).find(
      (sub: any) => sub.advocate_id === advocateId && (sub.status === 'active' || sub.status === 'trialing')
    );

    if (existing) {
      return existing;
    }

    // Default starter plan
    return {
      id: `sub-starter-${advocateId}`,
      advocate_id: advocateId,
      plan_id: 'starter',
      billing_cycle: 'monthly',
      status: 'active',
      amount_inr: 0,
      currency: 'INR',
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      cancel_at_period_end: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  /**
   * Calculates comprehensive chamber usage metrics against plan quotas
   */
  getUsageMetrics(advocateId: string): ChamberUsageMetrics {
    const sub = this.getSubscription(advocateId);
    const plan = getPlan(sub.plan_id);
    const limits = plan.limits;

    const s = (localDb as any).ensureLoaded();

    // 1. Cases count
    const activeCases = (s.cases || []).filter(
      (c: any) => c.advocate_id === advocateId && c.status === 'active'
    ).length;

    // 2. Clients count
    const clients = (s.clients || []).filter(
      (cl: any) => cl.advocate_id === advocateId
    ).length;

    // 3. Document storage bytes used
    const docs = (s.case_documents || []).filter(
      (d: any) => d.advocate_id === advocateId
    );
    const storageBytesUsed = docs.reduce((acc: number, d: any) => acc + (Number(d.file_size_bytes) || 0), 0);

    // 4. AI queries this month
    const currentMonthPrefix = new Date().toISOString().slice(0, 7); // YYYY-MM
    let aiQueriesCount = 0;
    if (s.ai_chat_sessions) {
      const advocateSessions = s.ai_chat_sessions.filter((cs: any) => cs.advocate_id === advocateId);
      for (const sess of advocateSessions) {
        if (sess.messages) {
          const userMsgsThisMonth = sess.messages.filter(
            (m: any) => m.role === 'user' && m.timestamp && m.timestamp.startsWith(currentMonthPrefix)
          );
          aiQueriesCount += userMsgsThisMonth.length;
        }
      }
    }

    // 5. Team members count
    let teamCount = 1; // Solo advocate
    if (s.chambers && s.chamber_members) {
      const chamber = s.chambers.find((ch: any) => ch.owner_advocate_id === advocateId);
      if (chamber) {
        const members = s.chamber_members.filter((m: any) => m.chamber_id === chamber.id && m.status === 'active');
        teamCount = Math.max(1, members.length);
      }
    }

    return {
      plan_id: sub.plan_id,
      plan_name: plan.name,
      active_cases_count: activeCases,
      max_cases: limits.max_active_cases,
      clients_count: clients,
      max_clients: limits.max_clients,
      storage_bytes_used: storageBytesUsed,
      max_storage_bytes: limits.max_storage_bytes,
      ai_queries_used: aiQueriesCount,
      max_ai_queries: limits.max_monthly_ai_queries,
      team_members_count: teamCount,
      max_team_members: limits.max_team_members
    };
  }

  /**
   * Checks whether advocate can create an additional case
   */
  canCreateCase(advocateId: string): { allowed: boolean; current: number; max: number; reason?: string } {
    const metrics = this.getUsageMetrics(advocateId);
    if (metrics.active_cases_count >= metrics.max_cases) {
      return {
        allowed: false,
        current: metrics.active_cases_count,
        max: metrics.max_cases,
        reason: `Case limit reached (${metrics.active_cases_count}/${metrics.max_cases}). Please upgrade your practice plan to add more active cases.`
      };
    }
    return { allowed: true, current: metrics.active_cases_count, max: metrics.max_cases };
  }

  /**
   * Checks whether advocate can upload a new document without exceeding storage quota
   */
  canUploadDocument(advocateId: string, newFileSizeBytes: number): { allowed: boolean; usedBytes: number; maxBytes: number; reason?: string } {
    const metrics = this.getUsageMetrics(advocateId);
    if ((metrics.storage_bytes_used + newFileSizeBytes) > metrics.max_storage_bytes) {
      const usedMB = Math.round(metrics.storage_bytes_used / (1024 * 1024));
      const maxMB = Math.round(metrics.max_storage_bytes / (1024 * 1024));
      return {
        allowed: false,
        usedBytes: metrics.storage_bytes_used,
        maxBytes: metrics.max_storage_bytes,
        reason: `Vault storage quota exceeded (${usedMB} MB / ${maxMB} MB used). Please upgrade to Professional or Chamber plan for additional document storage.`
      };
    }
    return { allowed: true, usedBytes: metrics.storage_bytes_used, maxBytes: metrics.max_storage_bytes };
  }

  /**
   * Checks whether advocate can run an additional AI consultation query
   */
  canRunAIQuery(advocateId: string): { allowed: boolean; used: number; max: number; reason?: string } {
    const metrics = this.getUsageMetrics(advocateId);
    if (metrics.ai_queries_used >= metrics.max_ai_queries) {
      return {
        allowed: false,
        used: metrics.ai_queries_used,
        max: metrics.max_ai_queries,
        reason: `Monthly AI query allowance reached (${metrics.ai_queries_used}/${metrics.max_ai_queries} queries this month). Upgrade to Professional or Chamber for higher AI quotas.`
      };
    }
    return { allowed: true, used: metrics.ai_queries_used, max: metrics.max_ai_queries };
  }

  /**
   * Checks whether advocate can invite an additional team member
   */
  canInviteTeamMember(advocateId: string): { allowed: boolean; current: number; max: number; reason?: string } {
    const metrics = this.getUsageMetrics(advocateId);
    if (metrics.team_members_count >= metrics.max_team_members) {
      return {
        allowed: false,
        current: metrics.team_members_count,
        max: metrics.max_team_members,
        reason: `Team member limit reached (${metrics.team_members_count}/${metrics.max_team_members} seats). Upgrade to Chamber & Firm Partner plan to add up to 10 colleagues.`
      };
    }
    return { allowed: true, current: metrics.team_members_count, max: metrics.max_team_members };
  }

  /**
   * Checks whether a specific boolean feature is enabled for the advocate's plan
   */
  hasFeatureAccess(advocateId: string, feature: keyof PlanFeatureLimits): { allowed: boolean; reason?: string } {
    const sub = this.getSubscription(advocateId);
    const limits = getPlanLimits(sub.plan_id);

    if (!limits[feature]) {
      return {
        allowed: false,
        reason: `Feature '${String(feature)}' is available on the Professional or Chamber plan. Upgrade your practice subscription to unlock.`
      };
    }
    return { allowed: true };
  }
}

export const featureGate = new FeatureGateService();
