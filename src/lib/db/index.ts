import { localDb } from './local-db';
import { supabase, supabaseAdmin, isSupabaseConfigured, isSupabaseAdminConfigured } from './supabase';
import {
  caseRepository,
  clientRepository,
  documentRepository,
  hearingRepository,
  billingRepository,
  advocateRepository
} from './repositories';

export {
  localDb,
  supabase,
  supabaseAdmin,
  isSupabaseConfigured,
  isSupabaseAdminConfigured,
  caseRepository,
  clientRepository,
  documentRepository,
  hearingRepository,
  billingRepository,
  advocateRepository
};

export default localDb;
