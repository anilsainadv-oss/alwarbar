-- ==============================================================================
-- 002_rls_security_policies.sql
-- Strict Row-Level Security Policies for Supabase & PostgreSQL
-- Zero-Cross-Tenant-Leaking Guarantees
-- ==============================================================================

-- Enable RLS on all private advocate data tables
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_hearings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_library ENABLE ROW LEVEL SECURITY;

-- 1. CASES SECURITY POLICIES
CREATE POLICY "Advocates have full access to their own cases"
ON cases
FOR ALL
USING (auth.uid() = advocate_id)
WITH CHECK (auth.uid() = advocate_id);

-- 2. CASE DOCUMENTS SECURITY POLICIES
CREATE POLICY "Advocates have full access to their own case documents"
ON case_documents
FOR ALL
USING (auth.uid() = advocate_id)
WITH CHECK (auth.uid() = advocate_id);

-- 3. CASE HEARINGS SECURITY POLICIES
CREATE POLICY "Advocates have full access to their own hearings"
ON case_hearings
FOR ALL
USING (auth.uid() = advocate_id)
WITH CHECK (auth.uid() = advocate_id);

-- 4. TASKS SECURITY POLICIES
CREATE POLICY "Advocates have full access to their own tasks"
ON tasks
FOR ALL
USING (auth.uid() = advocate_id)
WITH CHECK (auth.uid() = advocate_id);

-- 5. CLIENTS SECURITY POLICIES
CREATE POLICY "Advocates have full access to their own clients"
ON clients
FOR ALL
USING (auth.uid() = advocate_id)
WITH CHECK (auth.uid() = advocate_id);

-- 6. INVOICES SECURITY POLICIES
CREATE POLICY "Advocates have full access to their own invoices"
ON invoices
FOR ALL
USING (auth.uid() = advocate_id)
WITH CHECK (auth.uid() = advocate_id);

-- 7. DRAFTS SECURITY POLICIES
CREATE POLICY "Advocates have full access to their own drafts"
ON drafts
FOR ALL
USING (auth.uid() = advocate_id)
WITH CHECK (auth.uid() = advocate_id);

-- 8. PERSONAL LIBRARY POLICIES
CREATE POLICY "Advocates have full access to their own library"
ON personal_library
FOR ALL
USING (auth.uid() = advocate_id)
WITH CHECK (auth.uid() = advocate_id);

-- 9. PUBLIC RESOURCES READ-ONLY FOR VISITORS
ALTER TABLE welfare_schemes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read published welfare schemes"
ON welfare_schemes FOR SELECT
USING (is_published = true);

ALTER TABLE legal_updates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read published legal updates"
ON legal_updates FOR SELECT
USING (is_published = true);

ALTER TABLE legal_forms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read legal forms"
ON legal_forms FOR SELECT
USING (true);

ALTER TABLE notices_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read published notices and events"
ON notices_events FOR SELECT
USING (is_published = true);

-- 10. FORUM POLICIES
ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read unhidden forum posts"
ON forum_posts FOR SELECT
USING (is_hidden = false);

CREATE POLICY "Authenticated users can create posts"
ON forum_posts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authors can update their own posts"
ON forum_posts FOR UPDATE
USING (auth.uid() = user_id);
