import { localDb } from '@/lib/db';
import { supabase, supabaseAdmin, isSupabaseConfigured, isSupabaseAdminConfigured } from '@/lib/db/supabase';
import type { 
  CaseRecord, Client, CaseDocument, CaseHearing, Invoice, LegalDraft, PersonalLibraryItem, 
  AIChatSession, AIChatMessage,
  NotificationPreferences, NotificationDeliveryRecord, ClientCommunication, AutomationJob, CauseListEntry,
  AdvocateSubscription, SubscriptionInvoice, Chamber, ChamberMember, ChamberInvitation, ChamberMemberRole, ChamberMemberStatus
} from '@/types/mycase';
import type { AdvocateProfile } from '@/types/database';

/**
 * Universal Database Repository Layer for Alwar Advocates Platform.
 * Supports dual-mode persistence:
 *  1. Remote PostgreSQL / Supabase cluster with Row Level Security (RLS) when active.
 *  2. Local transactional persistence with strict advocate tenancy scoping as fallback.
 */

export const caseRepository = {
  async getCases(advocateId: string): Promise<CaseRecord[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('cases')
          .select('*')
          .eq('advocate_id', advocateId)
          .order('created_at', { ascending: false });
        if (!error && data) return data as CaseRecord[];
      } catch {
        // Fallback to local persistence
      }
    }
    return localDb.getCases(advocateId);
  },

  async getCaseById(advocateId: string, caseId: string): Promise<CaseRecord | null> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('cases')
          .select('*')
          .eq('id', caseId)
          .eq('advocate_id', advocateId)
          .single();
        if (!error && data) return data as CaseRecord;
      } catch {
        // Fallback
      }
    }
    return localDb.getCaseById(advocateId, caseId) || null;
  },

  async createCase(advocateId: string, caseData: Omit<CaseRecord, 'id' | 'advocate_id' | 'created_at' | 'updated_at'>): Promise<CaseRecord> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('cases')
          .insert({
            ...caseData,
            advocate_id: advocateId
          })
          .select()
          .single();
        if (!error && data) {
          // Sync locally as well
          localDb.createCase(advocateId, caseData);
          return data as CaseRecord;
        }
      } catch {
        // Fallback
      }
    }
    return localDb.createCase(advocateId, caseData);
  },

  async updateCase(advocateId: string, caseId: string, updates: Partial<CaseRecord>): Promise<CaseRecord | null> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('cases')
          .update(updates)
          .eq('id', caseId)
          .eq('advocate_id', advocateId)
          .select()
          .single();
        if (!error && data) {
          localDb.updateCase(advocateId, caseId, updates);
          return data as CaseRecord;
        }
      } catch {
        // Fallback
      }
    }
    return localDb.updateCase(advocateId, caseId, updates) || null;
  },

  async deleteCase(advocateId: string, caseId: string): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('cases')
          .delete()
          .eq('id', caseId)
          .eq('advocate_id', advocateId);
        if (!error) {
          localDb.deleteCase(advocateId, caseId);
          return true;
        }
      } catch {
        // Fallback
      }
    }
    return localDb.deleteCase(advocateId, caseId);
  }
};

export const clientRepository = {
  async getClients(advocateId: string): Promise<Client[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .eq('advocate_id', advocateId);
        if (!error && data) return data as Client[];
      } catch {}
    }
    return localDb.getClients(advocateId);
  },

  async getClientById(advocateId: string, clientId: string): Promise<Client | null> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .eq('id', clientId)
          .eq('advocate_id', advocateId)
          .single();
        if (!error && data) return data as Client;
      } catch {}
    }
    return localDb.getClientById(advocateId, clientId) || null;
  },

  async createClient(advocateId: string, clientData: Omit<Client, 'id' | 'advocate_id' | 'created_at'>): Promise<Client> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('clients')
          .insert({ ...clientData, advocate_id: advocateId })
          .select()
          .single();
        if (!error && data) {
          localDb.createClient(advocateId, clientData);
          return data as Client;
        }
      } catch {}
    }
    return localDb.createClient(advocateId, clientData);
  },

  async updateClient(advocateId: string, clientId: string, updates: Partial<Client>): Promise<Client | null> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('clients')
          .update(updates)
          .eq('id', clientId)
          .eq('advocate_id', advocateId)
          .select()
          .single();
        if (!error && data) {
          localDb.updateClient(advocateId, clientId, updates);
          return data as Client;
        }
      } catch {}
    }
    return localDb.updateClient(advocateId, clientId, updates);
  },

  async deleteClient(advocateId: string, clientId: string): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('clients')
          .delete()
          .eq('id', clientId)
          .eq('advocate_id', advocateId);
        if (!error) {
          localDb.deleteClient(advocateId, clientId);
          return true;
        }
      } catch {}
    }
    return localDb.deleteClient(advocateId, clientId);
  }
};

export const documentRepository = {
  async getDocuments(advocateId: string, caseId?: string): Promise<CaseDocument[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        let q = supabase.from('case_documents').select('*').eq('advocate_id', advocateId);
        if (caseId) q = q.eq('case_id', caseId);
        const { data, error } = await q;
        if (!error && data) return data as CaseDocument[];
      } catch {}
    }
    return localDb.getCaseDocuments(advocateId, caseId);
  },

  async getDocumentById(advocateId: string, docId: string): Promise<CaseDocument | null> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('case_documents')
          .select('*')
          .eq('id', docId)
          .eq('advocate_id', advocateId)
          .single();
        if (!error && data) return data as CaseDocument;
      } catch {}
    }
    return localDb.getCaseDocumentById(advocateId, docId) || null;
  },

  async createDocument(advocateId: string, docData: Omit<CaseDocument, 'id' | 'advocate_id' | 'created_at'>): Promise<CaseDocument> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('case_documents')
          .insert({ ...docData, advocate_id: advocateId })
          .select()
          .single();
        if (!error && data) {
          localDb.createCaseDocument(advocateId, docData);
          return data as CaseDocument;
        }
      } catch {}
    }
    return localDb.createCaseDocument(advocateId, docData);
  },

  async deleteDocument(advocateId: string, docId: string): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('case_documents')
          .delete()
          .eq('id', docId)
          .eq('advocate_id', advocateId);
        if (!error) {
          localDb.deleteCaseDocument(advocateId, docId);
          return true;
        }
      } catch {}
    }
    return localDb.deleteCaseDocument(advocateId, docId);
  }
};

export const hearingRepository = {
  async getHearings(advocateId: string): Promise<CaseHearing[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('case_hearings')
          .select('*')
          .eq('advocate_id', advocateId);
        if (!error && data) return data as CaseHearing[];
      } catch {}
    }
    return localDb.getHearings(advocateId);
  },

  async createHearing(advocateId: string, hearingData: Omit<CaseHearing, 'id' | 'advocate_id' | 'created_at'>): Promise<CaseHearing> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('case_hearings')
          .insert({ ...hearingData, advocate_id: advocateId })
          .select()
          .single();
        if (!error && data) {
          localDb.createHearing(advocateId, hearingData);
          return data as CaseHearing;
        }
      } catch {}
    }
    return localDb.createHearing(advocateId, hearingData);
  },

  async getHearingById(advocateId: string, hearingId: string): Promise<CaseHearing | null> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('case_hearings')
          .select('*')
          .eq('id', hearingId)
          .eq('advocate_id', advocateId)
          .single();
        if (!error && data) return data as CaseHearing;
      } catch {}
    }
    return localDb.getHearingById(advocateId, hearingId) || null;
  },

  async updateHearing(advocateId: string, hearingId: string, updates: Partial<CaseHearing>): Promise<CaseHearing | null> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('case_hearings')
          .update(updates)
          .eq('id', hearingId)
          .eq('advocate_id', advocateId)
          .select()
          .single();
        if (!error && data) {
          localDb.updateHearing(advocateId, hearingId, updates);
          return data as CaseHearing;
        }
      } catch {}
    }
    return localDb.updateHearing(advocateId, hearingId, updates);
  },

  async deleteHearing(advocateId: string, hearingId: string): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('case_hearings')
          .delete()
          .eq('id', hearingId)
          .eq('advocate_id', advocateId);
        if (!error) {
          localDb.deleteHearing(advocateId, hearingId);
          return true;
        }
      } catch {}
    }
    return localDb.deleteHearing(advocateId, hearingId);
  }
};

export const billingRepository = {
  async getInvoices(advocateId: string): Promise<Invoice[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('invoices')
          .select('*')
          .eq('advocate_id', advocateId);
        if (!error && data) return data as Invoice[];
      } catch {}
    }
    return localDb.getInvoices(advocateId);
  },

  async createInvoice(advocateId: string, invData: Omit<Invoice, 'id' | 'advocate_id' | 'created_at'>): Promise<Invoice> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('invoices')
          .insert({ ...invData, advocate_id: advocateId })
          .select()
          .single();
        if (!error && data) {
          localDb.createInvoice(advocateId, invData);
          return data as Invoice;
        }
      } catch {}
    }
    return localDb.createInvoice(advocateId, invData);
  }
};

export const advocateRepository = {
  async getAdvocateProfiles(): Promise<AdvocateProfile[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('advocate_profiles')
          .select('*')
          .eq('is_publicly_listed', true);
        if (!error && data) return data as AdvocateProfile[];
      } catch {}
    }
    return localDb.getAdvocateProfiles();
  },

  async getAdvocateProfileByUserId(userId: string): Promise<AdvocateProfile | null> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('advocate_profiles')
          .select('*')
          .eq('user_id', userId)
          .single();
        if (!error && data) return data as AdvocateProfile;
      } catch {}
    }
    return localDb.getAdvocateProfileByUserId(userId) || null;
  },

  async updateAdvocateProfile(
    userId: string, 
    updates: Partial<AdvocateProfile>, 
    userUpdates?: { full_name?: string; phone?: string }
  ): Promise<AdvocateProfile | null> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('advocate_profiles')
          .update(updates)
          .eq('user_id', userId)
          .select()
          .single();
        if (!error && data) {
          localDb.updateAdvocateProfile(userId, updates, userUpdates);
          return data as AdvocateProfile;
        }
      } catch {}
    }
    return localDb.updateAdvocateProfile(userId, updates, userUpdates);
  }
};

export const chatRepository = {
  async getSessions(advocateId: string, caseId?: string): Promise<AIChatSession[]> {
    return localDb.getChatSessions(advocateId, caseId);
  },
  async getSessionById(advocateId: string, sessionId: string): Promise<AIChatSession | null> {
    return localDb.getChatSessionById(advocateId, sessionId) || null;
  },
  async createSession(
    advocateId: string, 
    data: { case_id?: string; title?: string; initialMessage?: AIChatMessage }
  ): Promise<AIChatSession> {
    return localDb.createChatSession(advocateId, data);
  },
  async appendMessage(advocateId: string, sessionId: string, message: AIChatMessage): Promise<AIChatSession | null> {
    return localDb.appendChatMessage(advocateId, sessionId, message);
  },
  async deleteSession(advocateId: string, sessionId: string): Promise<boolean> {
    return localDb.deleteChatSession(advocateId, sessionId);
  },
  async getUsage(advocateId: string): Promise<{ totalTokens: number; totalCostINR: number; queryCount: number }> {
    return localDb.getAdvocateAIUsage(advocateId);
  }
};

export const notificationRepository = {
  async getPreferences(advocateId: string): Promise<NotificationPreferences> {
    return localDb.getNotificationPreferences(advocateId);
  },
  async updatePreferences(advocateId: string, updates: Partial<NotificationPreferences>): Promise<NotificationPreferences> {
    return localDb.updateNotificationPreferences(advocateId, updates);
  },
  async getHistory(advocateId: string, options?: { limit?: number; channel?: string; status?: string }): Promise<NotificationDeliveryRecord[]> {
    return localDb.getNotificationHistory(advocateId, options);
  },
  async hasSent(advocateId: string, idempotencyKey: string): Promise<boolean> {
    return localDb.hasSentIdempotentNotification(advocateId, idempotencyKey);
  },
  async logDelivery(advocateId: string, record: Omit<NotificationDeliveryRecord, 'id' | 'advocate_id' | 'created_at'>): Promise<NotificationDeliveryRecord> {
    return localDb.createNotificationRecord(advocateId, record);
  }
};

export const communicationRepository = {
  async getCommunications(advocateId: string, clientId?: string): Promise<ClientCommunication[]> {
    return localDb.getClientCommunications(advocateId, clientId);
  },
  async createCommunication(advocateId: string, comm: Omit<ClientCommunication, 'id' | 'advocate_id' | 'created_at'>): Promise<ClientCommunication> {
    return localDb.createClientCommunication(advocateId, comm);
  }
};

export const automationJobRepository = {
  async getJobs(advocateId?: string, status?: string): Promise<AutomationJob[]> {
    return localDb.getAutomationJobs(advocateId, status);
  },
  async createJob(job: Omit<AutomationJob, 'id' | 'attempts' | 'status' | 'created_at' | 'updated_at'>): Promise<AutomationJob> {
    return localDb.createAutomationJob(job);
  },
  async updateJob(id: string, updates: Partial<AutomationJob>): Promise<AutomationJob | null> {
    return localDb.updateAutomationJob(id, updates);
  }
};

export const causeListRepository = {
  async getEntries(advocateId?: string, date?: string): Promise<CauseListEntry[]> {
    return localDb.getCauseListEntries(advocateId, date);
  },
  async saveEntries(entries: Omit<CauseListEntry, 'id' | 'created_at'>[]): Promise<CauseListEntry[]> {
    return localDb.saveCauseListEntries(entries);
  },
  async matchToDocket(advocateId: string, date: string): Promise<{ matched: number; matches: { entry: CauseListEntry; caseRecord: CaseRecord }[] }> {
    return localDb.matchCauseListToDocket(advocateId, date);
  }
};

export const subscriptionRepository = {
  async getSubscription(advocateId: string): Promise<AdvocateSubscription> {
    return localDb.getSubscription(advocateId);
  },
  async saveSubscription(subscription: AdvocateSubscription): Promise<AdvocateSubscription> {
    return localDb.saveSubscription(subscription);
  },
  async createInvoice(invoice: Omit<SubscriptionInvoice, 'id' | 'created_at'>): Promise<SubscriptionInvoice> {
    return localDb.createSubscriptionInvoice(invoice);
  },
  async getInvoices(advocateId: string): Promise<SubscriptionInvoice[]> {
    return localDb.getSubscriptionInvoices(advocateId);
  }
};

export const chamberRepository = {
  async getChamber(advocateId: string): Promise<{ chamber: Chamber | null; membership: ChamberMember | null }> {
    return localDb.getChamberForAdvocate(advocateId);
  },
  async createChamber(advocateId: string, data: { name: string; court_complex?: string; chamber_number?: string }): Promise<Chamber> {
    return localDb.createChamber(advocateId, data);
  },
  async getMembers(chamberId: string): Promise<ChamberMember[]> {
    return localDb.getChamberMembers(chamberId);
  },
  async addMember(chamberId: string, member: Omit<ChamberMember, 'id' | 'joined_at' | 'created_at'>): Promise<ChamberMember> {
    return localDb.addChamberMember(chamberId, member);
  },
  async updateMemberRole(chamberId: string, memberId: string, role: ChamberMemberRole, status?: ChamberMemberStatus): Promise<ChamberMember | null> {
    return localDb.updateChamberMemberRole(chamberId, memberId, role, status);
  },
  async removeMember(chamberId: string, memberId: string): Promise<boolean> {
    return localDb.removeChamberMember(chamberId, memberId);
  },
  async createInvitation(data: {
    chamber_id: string;
    chamber_name: string;
    invited_by_advocate_id: string;
    invitee_email: string;
    role: ChamberMemberRole;
  }): Promise<ChamberInvitation> {
    return localDb.createChamberInvitation(data);
  },
  async getInvitations(chamberId: string): Promise<ChamberInvitation[]> {
    return localDb.getChamberInvitations(chamberId);
  },
  async getInvitationByToken(token: string): Promise<ChamberInvitation | null> {
    return localDb.getInvitationByToken(token);
  },
  async acceptInvitation(token: string, userId: string, fullName: string, email: string): Promise<ChamberMember | null> {
    return localDb.acceptChamberInvitation(token, userId, fullName, email);
  },
  async revokeInvitation(chamberId: string, invitationId: string): Promise<boolean> {
    return localDb.revokeChamberInvitation(chamberId, invitationId);
  }
};

export { legalResearchRepository } from './legal-research';

