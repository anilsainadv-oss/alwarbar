-- ==============================================================================
-- 004_seed_users_and_profiles.sql
-- Seed Initial Admin & Verified Advocates into Supabase users and advocate_profiles
-- ==============================================================================

-- Allow public read on users table if RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view active users" ON users;
CREATE POLICY "Public can view active users" ON users FOR SELECT USING (is_active = true);

-- Insert Users
INSERT INTO users (id, email, password_hash, full_name, role, phone, is_active) VALUES
(
  'baacdf37-d6f3-46a2-a1ad-dbef260ae6ce'::uuid,
  'case.admin@alwaradvocates.org',
  '4184a10cf12471f072d5e39cd1a5d04cb4f7cbf7f0950495049cc5f14d462815',
  'My Case System Operator',
  'case_admin'::user_role,
  '0144-2339900',
  true
),
(
  'ac07aec6-4798-49ce-a0d5-9d3e0540e941'::uuid,
  'public.admin@alwaradvocates.org',
  'a3ec7c15f1dcdd44010e23899e0ccd0fae84903a6a4a2f3e63b5cbae8f433d22',
  'Alwar Bar Admin',
  'public_admin'::user_role,
  '0144-2334455',
  true
),
(
  '6ccfcfc0-b5bd-42ac-af31-6d638b446fd4'::uuid,
  'advocate.rajesh@alwarbar.in',
  '145fd2537298bff984776118eb3d8e76e8f10b08c110228009551ac35f8821b1',
  'Advocate Rajesh Sharma',
  'registered_advocate'::user_role,
  '9829012345',
  true
),
(
  '7bc195b8-2f07-43d7-ad54-0622feb8b175'::uuid,
  'advocate.meena@alwarbar.in',
  '145fd2537298bff984776118eb3d8e76e8f10b08c110228009551ac35f8821b1',
  'Advocate Sunita Meena',
  'registered_advocate'::user_role,
  '9829054321',
  true
),
(
  'b735a5f4-31fb-406f-aba7-a86354f798d5'::uuid,
  'anilsain.adv@gmail.com',
  '4af7e203fea31e9bdac4754f8e2ffaac10997d3438011059637eda5a22df6561',
  'Advocate Anil Sain',
  'public_admin'::user_role,
  '9829012268',
  true
),
(
  'a50ace9c-e509-4872-aadd-dae1627dd43f'::uuid,
  'rameshwar.adv@alwarbar.in',
  '145fd2537298bff984776118eb3d8e76e8f10b08c110228009551ac35f8821b1',
  'Advocate Rameshwar Dayal Sharma',
  'registered_advocate'::user_role,
  '9829011223',
  true
),
(
  'a980b20c-b126-4510-a294-4f74c12d0116'::uuid,
  'pooja.adv@alwarbar.in',
  '145fd2537298bff984776118eb3d8e76e8f10b08c110228009551ac35f8821b1',
  'Advocate Pooja Yadav',
  'registered_advocate'::user_role,
  '9829044556',
  true
),
(
  'c197e7b2-8043-47c9-a8ff-71e244a8ad5f'::uuid,
  'surendra.rathore@alwarbar.in',
  '145fd2537298bff984776118eb3d8e76e8f10b08c110228009551ac35f8821b1',
  'Advocate Surendra Singh Rathore',
  'registered_advocate'::user_role,
  '9414022334',
  true
),
(
  '318fba7f-1413-40b4-aa0e-7972488c5b86'::uuid,
  'anita.choudhary@alwarbar.in',
  '145fd2537298bff984776118eb3d8e76e8f10b08c110228009551ac35f8821b1',
  'Advocate Anita Choudhary',
  'registered_advocate'::user_role,
  '9829155667',
  true
),
(
  '35564264-d14c-47ac-ae25-0de235c44bff'::uuid,
  'vikram.meena@alwarbar.in',
  '145fd2537298bff984776118eb3d8e76e8f10b08c110228009551ac35f8821b1',
  'Advocate Vikramaditya Meena',
  'registered_advocate'::user_role,
  '9784033445',
  true
),
(
  'dda8eac1-0467-464d-aec8-928053662637'::uuid,
  'bhupendra.adv@alwarbar.in',
  '145fd2537298bff984776118eb3d8e76e8f10b08c110228009551ac35f8821b1',
  'Advocate Bhupendra Singh',
  'registered_advocate'::user_role,
  '9829988776',
  true
)
ON CONFLICT (email) DO NOTHING;

-- Insert Advocate Profiles
INSERT INTO advocate_profiles (
  id, user_id, bar_council_enrollment_no, bar_association_name, chamber_address,
  court_practice_complex, practice_areas, experience_years, bio_hindi, bio_english,
  is_verified, is_publicly_listed
) VALUES
(
  '27536d99-5701-496f-a2c3-cc47b81ccd57'::uuid,
  '6ccfcfc0-b5bd-42ac-af31-6d638b446fd4'::uuid,
  'R/1420/2012',
  'District & Sessions Bar Association, Alwar',
  'Chamber No. 42, Civil Wing, District Court Campus, Alwar',
  'District & Sessions Court, Alwar',
  ARRAY['Criminal Defense', 'Civil Writs', 'Bail Matters']::text[],
  14,
  'अलवर सत्र न्यायालय एवं अधीनस्थ न्यायालयों में 14 वर्षों से नियमित दांडिक एवं दीवानी वकालत।',
  '14 years of dedicated practice before District Courts Alwar specializing in Criminal defense, BNSS bail, and trial jurisprudence.',
  true,
  true
),
(
  '4142625f-517e-4977-a562-2c91f8a487d5'::uuid,
  '7bc195b8-2f07-43d7-ad54-0622feb8b175'::uuid,
  'R/2890/2018',
  'District Bar Association, Alwar',
  'Chamber No. 19, Revenue Bar Section, Alwar',
  'Revenue Courts & Commercial Court, Alwar',
  ARRAY['Revenue Law', 'Property Partition', 'MACT Claims']::text[],
  8,
  'राजस्व न्यायालय, संभागीय आयुक्त एवं वाणिज्यिक न्यायालय अलवर में भूमि विवाद विशेषज्ञ।',
  'Specialist in Rajasthan Tenancy Act, Land Revenue appeals, and Commercial arbitration in Alwar.',
  true,
  true
),
(
  '369cedd9-244b-4eac-a738-ed52e5b6c2fb'::uuid,
  'a50ace9c-e509-4872-aadd-dae1627dd43f'::uuid,
  'R/1122/2008',
  'District & Sessions Bar Association Alwar',
  'Chamber No. 12, Civil Wing',
  'District & Sessions Court Alwar',
  ARRAY['Criminal Defense', 'Regular Bail', 'BNSS Trials']::text[],
  17,
  'अलवर सत्र न्यायालय में 17 वर्षों से आपराधिक मामलों के वरिष्ठ अधिवक्ता।',
  'Senior trial counsel with 17 years practice in Alwar criminal courts.',
  true,
  true
),
(
  'bff81ca7-82a9-4978-a1a7-b6e7b6253b44'::uuid,
  'a980b20c-b126-4510-a294-4f74c12d0116'::uuid,
  'R/3451/2018',
  'District Bar Association Alwar',
  'Chamber No. 5, Revenue Section',
  'Revenue Courts & SDO Alwar',
  ARRAY['Revenue Tenancy', 'Agricultural Land Partition', 'Civil Writs']::text[],
  8,
  'राजस्व मंडल एवं एसडीओ न्यायालय अलवर में काश्तकारी भूमि विशेषज्ञ।',
  'Specialist in Rajasthan Tenancy Act, partition and mutation appeals.',
  true,
  true
),
(
  'dcab172b-ed9f-441a-abdb-5aa62746f0de'::uuid,
  'c197e7b2-8043-47c9-a8ff-71e244a8ad5f'::uuid,
  'R/982/2012',
  'District & Sessions Bar Association Alwar',
  'Chamber No. 27, Sessions Block',
  'District Court Alwar & Commercial Court',
  ARRAY['Commercial Disputes', 'Section 138 NI Act', 'Arbitration']::text[],
  14,
  'चेक अनादर एवं वाणिज्यिक विवादों के अनुभवी अधिवक्ता।',
  'Extensive practice in negotiable instruments litigation and commercial arbitration.',
  true,
  true
),
(
  '7843e540-d84a-4bf7-ae3c-52ba8269338b'::uuid,
  '318fba7f-1413-40b4-aa0e-7972488c5b86'::uuid,
  'R/4120/2020',
  'District Bar Association Alwar',
  'Chamber No. 18, Family Court Section',
  'Family Court & CJM Court Alwar',
  ARRAY['Family Law', 'Matrimonial Maintenance', 'Domestic Violence']::text[],
  6,
  'पारिवारिक एवं भरण-पोषण वादों में विधिक परामर्श एवं पैरवी।',
  'Counsel for matrimonial matters, maintenance under BNSS, and family disputes.',
  true,
  true
),
(
  '947efa3e-e2c7-441c-a477-14cf8fd2f211'::uuid,
  '35564264-d14c-47ac-ae25-0de235c44bff'::uuid,
  'R/2290/2015',
  'District & Sessions Bar Association Alwar',
  'Chamber No. 34, Collectorate Wing',
  'SDO Court & Revenue Appellate Authority (RAA)',
  ARRAY['Land Revenue Demarcation', 'Section 91 Encroachment', 'Boundary Suits']::text[],
  11,
  'भू-राजस्व एवं सिवायचक भूमि सीमांकन मामलों के विशेषज्ञ।',
  'Specialized in Rajasthan Land Revenue Act and demarcation appeals.',
  true,
  true
),
(
  'ba141bf4-c4bd-4398-ade9-ae8bea690559'::uuid,
  'dda8eac1-0467-464d-aec8-928053662637'::uuid,
  'R/780/2016',
  'District & Sessions Bar Association, Alwar',
  'District Court Complex, Alwar',
  'District & Sessions Court, Alwar',
  ARRAY['Criminal Law', 'Bail Matters']::text[],
  10,
  'Advocate Bhupendra Singh अलवर न्यायालय में नियमित वकालत कर रहे हैं।',
  'Practicing advocate at District Courts Alwar specializing in Criminal Law, Bail Matters.',
  true,
  true
),
(
  'f8d28bb8-d28b-43c0-ab0b-ad4ddd11ff43'::uuid,
  'b735a5f4-31fb-406f-aba7-a86354f798d5'::uuid,
  'R/2268/2009',
  'District & Sessions Bar Association, Alwar',
  'Chamber No. 24, Sessions Court Block, District Court Campus, Alwar - 301001',
  'District & Sessions Court, Alwar (Civil, Criminal & Revenue Wings)',
  ARRAY['Civil Litigation & Writs', 'Criminal Defense & Bail', 'Revenue Law & Land Appeals', 'MACT Claims & Consumer Law']::text[],
  17,
  'अलवर जिला एवं सत्र न्यायालय तथा अधीनस्थ न्यायालयों में वर्ष 2009 से निरंतर 17 वर्षों से विधि व्यवसाय। राजस्थान अधिवक्ता कल्याण कोष के आजीवन नियमित सदस्य।',
  'Senior practicing advocate at District & Sessions Court Alwar since 2009 (17 years of active practice) specializing in Civil writs, Criminal defense, and Revenue litigation. Continuous lifetime member of Rajasthan Advocates Welfare Fund.',
  true,
  true
)
ON CONFLICT (user_id) DO NOTHING;
