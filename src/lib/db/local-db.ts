import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import type { 
  User, AdvocateProfile, WelfareScheme, WelfareBulletin, LegalUpdate, LegalForm, NoticeEvent, AuditLog 
} from '@/types/database';
import type { 
  CaseRecord, CaseDocument, CaseHearing, CaseTask, Client, Invoice, LegalDraft, PersonalLibraryItem 
} from '@/types/mycase';
import type { 
  ForumCategory, ForumPost, ForumReply, ForumReport 
} from '@/types/forum';

interface DatabaseState {
  users: User[];
  advocate_profiles: AdvocateProfile[];
  welfare_schemes: WelfareScheme[];
  welfare_bulletins: WelfareBulletin[];
  legal_updates: LegalUpdate[];
  legal_forms: LegalForm[];
  notices_events: NoticeEvent[];
  forum_categories: ForumCategory[];
  forum_posts: ForumPost[];
  forum_replies: ForumReply[];
  forum_reports: ForumReport[];
  cases: CaseRecord[];
  case_documents: CaseDocument[];
  case_hearings: CaseHearing[];
  tasks: CaseTask[];
  clients: Client[];
  invoices: Invoice[];
  drafts: LegalDraft[];
  personal_library: PersonalLibraryItem[];
  audit_logs: AuditLog[];
}

const DB_FILE = path.join(process.cwd(), 'data', 'local-db.json');

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + '_alwar_salt_2026').digest('hex');
}

function getInitialState(): DatabaseState {
  const initialAdminId = 'admin-user-alwar-0001';
  const demoAdvocateId = 'advocate-user-alwar-0002';
  const demoAdvocate2Id = 'advocate-user-alwar-0003';
  const demoClientId = 'client-alwar-0001';
  const demoCaseId = 'case-alwar-0001';

  return {
    users: [
      {
        id: initialAdminId,
        email: 'public.admin@alwaradvocates.org',
        password_hash: hashPassword('AdminPass@2026'),
        full_name: 'Alwar Bar Admin',
        role: 'public_admin',
        phone: '0144-2334455',
        is_active: true,
        created_at: '2026-01-01T10:00:00.000Z',
        updated_at: '2026-01-01T10:00:00.000Z'
      },
      {
        id: 'case-admin-0001',
        email: 'case.admin@alwaradvocates.org',
        password_hash: hashPassword('CaseAdmin@2026'),
        full_name: 'My Case System Operator',
        role: 'case_admin',
        phone: '0144-2339900',
        is_active: true,
        created_at: '2026-01-01T10:00:00.000Z',
        updated_at: '2026-01-01T10:00:00.000Z'
      },
      {
        id: demoAdvocateId,
        email: 'advocate.rajesh@alwarbar.in',
        password_hash: hashPassword('Advocate@2026'),
        full_name: 'Advocate Rajesh Sharma',
        role: 'registered_advocate',
        phone: '9829012345',
        is_active: true,
        created_at: '2026-01-05T11:00:00.000Z',
        updated_at: '2026-01-05T11:00:00.000Z'
      },
      {
        id: demoAdvocate2Id,
        email: 'advocate.meena@alwarbar.in',
        password_hash: hashPassword('Advocate@2026'),
        full_name: 'Advocate Sunita Meena',
        role: 'registered_advocate',
        phone: '9829054321',
        is_active: true,
        created_at: '2026-02-01T10:00:00.000Z',
        updated_at: '2026-02-01T10:00:00.000Z'
      }
    ],
    advocate_profiles: [
      {
        id: 'prof-001',
        user_id: demoAdvocateId,
        bar_council_enrollment_no: 'R/1420/2012',
        bar_association_name: 'District & Sessions Bar Association, Alwar',
        chamber_address: 'Chamber No. 42, Civil Wing, District Court Campus, Alwar',
        court_practice_complex: 'District & Sessions Court, Alwar',
        practice_areas: ['Criminal Defense', 'Civil Writs', 'Bail Matters'],
        experience_years: 14,
        bio_hindi: 'अलवर सत्र न्यायालय एवं अधीनस्थ न्यायालयों में 14 वर्षों से नियमित दांडिक एवं दीवानी वकालत।',
        bio_english: '14 years of dedicated practice before District Courts Alwar specializing in Criminal defense, BNSS bail, and trial jurisprudence.',
        is_verified: true,
        verified_by: initialAdminId,
        verified_at: '2026-01-10T12:00:00.000Z',
        is_publicly_listed: true
      },
      {
        id: 'prof-002',
        user_id: demoAdvocate2Id,
        bar_council_enrollment_no: 'R/2890/2018',
        bar_association_name: 'District Bar Association, Alwar',
        chamber_address: 'Chamber No. 19, Revenue Bar Section, Alwar',
        court_practice_complex: 'Revenue Courts & Commercial Court, Alwar',
        practice_areas: ['Revenue Law', 'Property Partition', 'MACT Claims'],
        experience_years: 8,
        bio_hindi: 'राजस्व न्यायालय, संभागीय आयुक्त एवं वाणिज्यिक न्यायालय अलवर में भूमि विवाद विशेषज्ञ।',
        bio_english: 'Specialist in Rajasthan Tenancy Act, Land Revenue appeals, and Commercial arbitration in Alwar.',
        is_verified: true,
        verified_by: initialAdminId,
        verified_at: '2026-02-05T14:00:00.000Z',
        is_publicly_listed: true
      },
      {
        id: 'prof-anil-sain-2268',
        user_id: 'usr-d354868f-4df8-4017-8a69-776412906265',
        bar_council_enrollment_no: 'R/2268/2009',
        bar_association_name: 'District & Sessions Bar Association, Alwar',
        chamber_address: 'Chamber No. 24, Sessions Court Block, District Court Campus, Alwar - 301001',
        court_practice_complex: 'District & Sessions Court, Alwar (Civil, Criminal & Revenue Wings)',
        practice_areas: ['Civil Litigation & Writs', 'Criminal Defense & Bail', 'Revenue Law & Land Appeals', 'MACT Claims & Consumer Law'],
        experience_years: 17,
        bio_hindi: 'अलवर जिला एवं सत्र न्यायालय तथा अधीनस्थ न्यायालयों में वर्ष 2009 से निरंतर 17 वर्षों से विधि व्यवसाय। राजस्थान अधिवक्ता कल्याण कोष के आजीवन नियमित सदस्य।',
        bio_english: 'Senior practicing advocate at District & Sessions Court Alwar since 2009 (17 years of active practice) specializing in Civil writs, Criminal defense, and Revenue litigation. Continuous lifetime member of Rajasthan Advocates Welfare Fund.',
        is_verified: true,
        verified_by: initialAdminId,
        verified_at: '2026-01-15T10:00:00.000Z',
        is_publicly_listed: true
      }
    ],
    welfare_schemes: [
      {
        id: 'welfare-001',
        title_en: 'Rajasthan Advocates Welfare Fund — Retirement & Death Benefit',
        title_hi: 'राजस्थान अधिवक्ता कल्याण कोष — सेवानिवृत्ति एवं मृत्यु सहायता योजना',
        issuing_authority: 'Bar Council of Rajasthan (Welfare Fund Trustee Committee)',
        official_source_url: 'https://barcouncilofrajasthan.org/downloads/rajasthan-advocates-welfare-fund',
        category: 'retirement',
        max_benefit_amount: 'Up to ₹10,00,000',
        status_badge: 'Active Statutory Scheme',
        eligibility_criteria: 'Advocate enrolled with Bar Council of Rajasthan with regular verification stamp adherence under Act No. 15 of 1987.',
        benefits_summary: 'Lump sum compassionate assistance up to ₹10,00,000 on retirement (30 years practice) or demise, payable directly to designated family nominees.',
        application_process: 'Submit Form A through President/Secretary of Alwar Bar Association to Trustee Committee, High Court Campus, Jodhpur.',
        document_checklist: ['Enrolment Certificate Copy', 'Bar Continuity Certificate', 'Nominee Verification Form', 'Cancelled Cheque', 'Life Certificate'],
        deadline: 'Annual Renewal: 31st March',
        last_verified_date: '2026-10-15',
        is_published: true,
        created_at: '2026-08-15T00:00:00.000Z'
      },
      {
        id: 'welfare-002',
        title_en: 'Advocates Group Mediclaim & Cashless Health Assistance Scheme',
        title_hi: 'अधिवक्ता समूह स्वास्थ्य बीमा एवं कैशलेस अस्पताल भर्ती योजना',
        issuing_authority: 'Bar Council of Rajasthan & State Government of Rajasthan',
        official_source_url: 'http://barcouncilofrajasthan.org',
        category: 'medical',
        max_benefit_amount: '₹5,00,000 / Year',
        status_badge: 'Annual Enrollment Active',
        eligibility_criteria: 'All active advocates up to 70 years on the active electoral roll of Bar Council of Rajasthan and spouse.',
        benefits_summary: 'Cashless hospitalization up to ₹5,00,000 per year across 1,200+ empanelled hospitals including SMS Medical College Jaipur, District Hospital Alwar, and private multi-specialty network hospitals.',
        application_process: 'Online submission through Bar Council portal with Bar Association verification and digital e-Card generation.',
        document_checklist: ['Bar Council Sanad ID', 'Aadhaar Card', 'Family details & photograph', 'Previous Policy Number (if renewal)'],
        deadline: 'Annual renewal enrollment: 31st October',
        last_verified_date: '2026-10-20',
        is_published: true,
        created_at: '2026-09-01T00:00:00.000Z'
      },
      {
        id: 'welfare-003',
        title_en: 'Young Advocate Monthly Financial Stipend Scheme',
        title_hi: 'युवा अधिवक्ता मासिक वृत्ति (स्टाइपेंड) योजना',
        issuing_authority: 'Department of Law & Legal Affairs, Government of Rajasthan',
        official_source_url: 'https://law.rajasthan.gov.in',
        category: 'stipend',
        max_benefit_amount: '₹5,000 / Month',
        status_badge: 'Govt Sanctioned',
        eligibility_criteria: 'Newly enrolled advocates below 30 years of age within first 3 years of enrollment practicing regularly in District Courts.',
        benefits_summary: 'Monthly professional development stipend of ₹5,000 for initial 2 years of legal practice to support early career establishment and library setup.',
        application_process: 'Apply online through RajSSO portal with recommendation from District & Sessions Bar Association Alwar and forwarding by District Judge.',
        document_checklist: ['Enrollment Sanad', 'Bar Membership Proof', 'Senior Chamber Attachment Undertaking', 'Bank Account Details with IFSC'],
        deadline: 'Quarterly application cycle (Next: 30th November)',
        last_verified_date: '2026-10-18',
        is_published: true,
        created_at: '2026-07-20T00:00:00.000Z'
      },
      {
        id: 'welfare-004',
        title_en: 'Critical Illness Emergency Compassionate Relief Grant',
        title_hi: 'गंभीर बीमारी (कैंसर, बायपास, किडनी) आपातकालीन अनुग्रह सहायता',
        issuing_authority: 'Trustee Committee, Rajasthan Advocates Welfare Fund',
        official_source_url: 'https://barcouncilofrajasthan.org/downloading.aspx?file=12.pdf',
        category: 'emergency',
        max_benefit_amount: 'Up to ₹2,00,000',
        status_badge: 'Immediate Priority (14 Days)',
        eligibility_criteria: 'Any regular member of the Welfare Fund who has completed at least 3 years of continuous membership diagnosed with life-threatening ailments.',
        benefits_summary: 'Immediate non-refundable ex-gratia financial grant up to ₹2,00,000 for Cancer therapy, Open Heart bypass surgery, Kidney transplantation/dialysis, and Brain surgery.',
        application_process: 'Submit medical diagnostic reports, hospital admission bills, attending specialist doctor certificate along with Form B through Bar Association Alwar. Sanctioned on fast-track priority within 14 days.',
        document_checklist: ['Form B Medical Aid Application', 'Original Hospital Discharge Summary', 'Doctor Diagnosis Certificate', 'Bar Council Verification'],
        deadline: 'Immediate upon occurrence of medical crisis',
        last_verified_date: '2026-10-22',
        is_published: true,
        created_at: '2026-08-01T00:00:00.000Z'
      },
      {
        id: 'welfare-005',
        title_en: 'Accidental Death & Permanent Total Disability Insurance',
        title_hi: 'दुर्घटना मृत्यु एवं पूर्ण स्थाई दिव्यांगता मुआवजा बीमा',
        issuing_authority: 'Trustee Committee & National Insurance Co-underwriter',
        official_source_url: 'http://barcouncilofrajasthan.org',
        category: 'disability',
        max_benefit_amount: '₹10,00,000 Lump Sum',
        status_badge: 'Round-the-Clock Coverage',
        eligibility_criteria: 'All enrolled practicing advocates in Rajasthan holding valid Welfare Fund membership cards.',
        benefits_summary: 'Lump sum compensation of ₹10,00,000 in the unfortunate event of accidental demise or 100% permanent disability resulting from vehicular accidents or mishaps while traveling for professional court assignments.',
        application_process: 'Lodge intimation within 90 days with FIR certified copy, post-mortem / civil surgeon permanent disability certificate, and nominee claim form.',
        document_checklist: ['Police FIR Copy', 'Post-Mortem / Medical Board Certificate', 'Nominee Bank Proof', 'Bar Association Certificate'],
        deadline: 'Within 90 days of accident',
        last_verified_date: '2026-10-10',
        is_published: true,
        created_at: '2026-08-01T00:00:00.000Z'
      },
      {
        id: 'welfare-006',
        title_en: 'Alwar Bar Association Benevolent Immediate Distress Relief Fund',
        title_hi: 'अलवर जिला बार एसोसिएशन बेनेवोलेंट आकस्मिक सहायता कोष',
        issuing_authority: 'Executive Committee, District & Sessions Bar Association, Alwar',
        official_source_url: 'https://alwarbar.in',
        category: 'local_benevolent',
        max_benefit_amount: 'Up to ₹50,000',
        status_badge: 'Disbursed within 48 Hours',
        eligibility_criteria: 'Active regular practicing members of District & Sessions Bar Association Alwar facing sudden acute personal distress or funeral exigency.',
        benefits_summary: 'Direct local emergency grant up to ₹50,000 sanctioned immediately without bureaucratic delay to provide solace during bereavement, accidental trauma, or immediate ICU admission.',
        application_process: 'Immediate verbal or written requisition submitted by colleagues or family directly to President or General Secretary of Alwar Bar Association.',
        document_checklist: ['Alwar Bar Identity Card', 'Hospital admission slip or death certificate', 'Nominee declaration'],
        deadline: 'Immediate emergency relief',
        last_verified_date: '2026-10-25',
        is_published: true,
        created_at: '2026-09-15T00:00:00.000Z'
      },
      {
        id: 'welfare-007',
        title_en: 'Maternity Financial Assistance for Practicing Women Advocates',
        title_hi: 'महिला अधिवक्ताओं हेतु मातृत्व विधिक सहायता योजना',
        issuing_authority: 'Bar Council of Rajasthan (Welfare Fund Trustee Committee)',
        official_source_url: 'https://barcouncilofrajasthan.org/circular/rajasthan-advocates-welfare-fund',
        category: 'maternity',
        max_benefit_amount: '₹50,000 Lump Sum',
        status_badge: 'Special Women Advocate Support',
        eligibility_criteria: 'Enrolled female advocate with minimum 2 years of active practice before Rajasthan subordinate or high courts.',
        benefits_summary: 'Lump sum compassionate grant of ₹50,000 for child delivery (up to two surviving children) to support female advocates during the mandatory rest and maternity recess.',
        application_process: 'Submit application through Alwar Bar Association with birth certificate and hospital records within 6 months of child birth.',
        document_checklist: ['Municipal Birth Certificate', 'Hospital Delivery Discharge Card', 'BCR Sanad Copy', 'Bar Continuity Certificate'],
        deadline: 'Within 6 months of delivery',
        last_verified_date: '2026-10-20',
        is_published: true,
        created_at: '2026-09-15T00:00:00.000Z'
      }
    ],
    welfare_bulletins: [
      {
        id: 'wb-001',
        title_en: 'Statutory ₹140 RAWF Stamp Mandatory on Every Vakalatnama in Alwar Courts',
        title_hi: 'अलवर अदालतों में प्रत्येक वकालतनामे पर ₹140 का वैधानिक कल्याण कोष स्टाम्प लगाना अनिवार्य',
        date: '2026-06-09',
        authority: 'Trustee Committee, Bar Council of Rajasthan (Circular 40443)',
        category: 'stamp_rate',
        important: true,
        summary_en: 'Official Gazette & BCR Circular: Value of Rajasthan Advocates Welfare Fund Stamp increased from ₹130 to ₹140 w.e.f. 01/07/2026. Affixing is mandatory on every Vakalatnama in District & Sessions Court, CJM, ACJM, SDO, and Revenue Courts in Alwar.',
        summary_hi: 'बार कौंसिल ऑफ राजस्थान का आधिकारिक परिपत्र: 01/07/2026 से कल्याण कोष स्टाम्प का मूल्य ₹130 से बढ़ाकर ₹140 किया गया है। अलवर की सत्र व अधीनस्थ अदालतों में प्रस्तुत वकालतनामे पर यह स्टाम्प अनिवार्य है।',
        official_link: 'https://barcouncilofrajasthan.org/downloading.aspx?file=Circular/40443.pdf'
      },
      {
        id: 'wb-002',
        title_en: 'Annual Life & Continuity Verification Deadline Extended to November 30',
        title_hi: 'वार्षिक जीवन एवं निरंतरता सत्यापन की अंतिम तिथि 30 नवंबर तक बढ़ाई गई',
        date: '2026-10-25',
        authority: 'Bar Council of Rajasthan, Jodhpur',
        category: 'deadline',
        important: true,
        summary_en: 'Trustee Committee has extended the annual continuity certificate window. Advocates who have not submitted their verification stamps may submit through Alwar Bar office without penalty.',
        summary_hi: 'ट्रस्टी कमेटी द्वारा सत्यापन की तिथि बढ़ाई गई। जिन अधिवक्ताओं ने सत्यापन स्टाम्प जमा नहीं किया है, वे बिना विलंब शुल्क अलवर बार कार्यालय में जमा कर सकते हैं।',
        official_link: 'https://barcouncilofrajasthan.org/circular/rajasthan-advocates-welfare-fund'
      },
      {
        id: 'wb-003',
        title_en: 'Section 25 Fund Disbursement Guidelines & Claim Settlement',
        title_hi: 'धारा 25 कल्याण कोष भुगतान दिशानिर्देश एवं क्लेम निस्तारण रिपोर्ट',
        date: '2026-05-12',
        authority: 'Welfare Fund Trustee Committee, Rajasthan (Circular 40418)',
        category: 'disbursement',
        important: false,
        summary_en: 'Committee report on disbursement under Section 25 of the RAWF Act 1987 to claimants with prior motor accident claims or financial schemes.',
        summary_hi: 'अधिनियम की धारा 25 के तहत पूर्व में बीमा या वित्तीय योजनाओं से क्लेम प्राप्त करने वाले दावेदारों के भुगतान संबंधी ट्रस्टी कमेटी की विस्तृत रिपोर्ट।',
        official_link: 'https://barcouncilofrajasthan.org/downloading.aspx?file=Circular/40418.pdf'
      },
      {
        id: 'wb-004',
        title_en: 'Digital Cashless Mediclaim E-Card Download Activated',
        title_hi: 'डिजिटल कैशलेस मेडिक्लेम ई-कार्ड डाउनलोड प्रारंभ',
        date: '2026-10-18',
        authority: 'Health Insurance Nodal Desk',
        category: 'circular',
        important: false,
        summary_en: 'Advocates enrolled under the 2026-27 Group Mediclaim scheme can now download their digital health card using their BCR enrollment number on the mobile portal.',
        summary_hi: 'ग्रुप मेडिक्लेम में पंजीकृत अधिवक्ता अब अपनी सनद संख्या दर्ज करके डिजिटल स्वास्थ्य कार्ड तुरंत डाउनलोड कर सकते हैं।',
        official_link: 'http://barcouncilofrajasthan.org'
      },
      {
        id: 'wb-005',
        title_en: 'Young Advocate Library & E-Courts Grant Window Announced',
        title_hi: 'युवा अधिवक्ताओं हेतु ₹10,000 डिजिटल ई-कोर्ट्स एवं विधिक लाइब्रेरी अनुदान',
        date: '2026-10-12',
        authority: 'Law Department, Govt of Rajasthan',
        category: 'circular',
        important: false,
        summary_en: 'State Government introduces ₹10,000 one-time technological assistance for newly enrolled advocates to procure bare act libraries and e-filing digital signature tokens.',
        summary_hi: 'नवीन नामांकित अधिवक्ताओं को विधिक पुस्तकें एवं डिजिटल सिग्नेचर टोकन क्रय करने हेतु ₹10,000 का एकमुश्त तकनीकी अनुदान।',
        official_link: 'https://law.rajasthan.gov.in'
      }
    ],
    legal_updates: [
      {
        id: 'update-001',
        title_en: 'Bharatiya Nagarik Suraksha Sanhita, 2023 (BNSS) — New Criminal Procedure Code',
        title_hi: 'भारतीय नागरिक सुरक्षा संहिता, 2023 (बीएनएसएस) — नवीन दांडिक प्रक्रिया संहिता',
        category: 'central_law',
        act_or_case_name: 'Bharatiya Nagarik Suraksha Sanhita, 2023 (Act No. 46 of 2023)',
        citation: 'Act No. 46 of 2023',
        court_name: 'Parliament of India',
        decision_or_commencement_date: '2024-07-01',
        summary_en: 'Replaces CrPC 1973. Mandates audio-video electronic recording of search and seizure, forensic examination for 7+ year offences, formalizes Zero FIR under Section 173, and defines bail conditions under Sections 480 and 482.',
        summary_hi: 'दंड प्रक्रिया संहिता 1973 का स्थान लिया। जब्ती की वीडियोग्राफी अनिवार्य, 7 वर्ष से अधिक सजा वाले मामलों में फोरेंसिक परीक्षण, धारा 173 में जीरो एफआईआर तथा धारा 480 (नियमित जमानत) व धारा 482 (अग्रिम जमानत) के नवीन मानक।',
        key_sections: ['Section 480 (Bail non-bailable)', 'Section 482 (Anticipatory bail)', 'Section 173 (Information / Zero FIR)', 'Section 105 (Seizure videography)', 'Section 35 (Notice of appearance)'],
        official_source_url: 'https://www.indiacode.nic.in/handle/123456789/20120',
        is_verified: true,
        last_verified_at: '2026-08-01T00:00:00.000Z',
        is_published: true,
        created_at: '2026-08-01T00:00:00.000Z'
      },
      {
        id: 'update-002',
        title_en: 'Bharatiya Nyaya Sanhita, 2023 (BNS) — Substantive Criminal Law',
        title_hi: 'भारतीय न्याय संहिता, 2023 (बीएनएस) — मौलिक दांडिक विधि',
        category: 'central_law',
        act_or_case_name: 'Bharatiya Nyaya Sanhita, 2023 (Act No. 45 of 2023)',
        citation: 'Act No. 45 of 2023',
        court_name: 'Parliament of India',
        decision_or_commencement_date: '2024-07-01',
        summary_en: 'Replaces Indian Penal Code 1860. Introduces community service for minor offences, categorizes organized crime, and consolidates child and women protection provisions.',
        summary_hi: 'भारतीय दंड संहिता 1860 का स्थान लिया। छोटे अपराधों में सामुदायिक सेवा का दंड, संगठित अपराध की परिभाषा एवं महिला अपराधों पर सख्त प्रावधान।',
        key_sections: ['Section 103 (Punishment for murder)', 'Section 115 (Voluntarily causing hurt)', 'Section 318 (Cheating)', 'Section 4 (Community service)', 'Section 111 (Organized crime)'],
        official_source_url: 'https://www.indiacode.nic.in/handle/123456789/20119',
        is_verified: true,
        last_verified_at: '2026-08-01T00:00:00.000Z',
        is_published: true,
        created_at: '2026-08-01T00:00:00.000Z'
      },
      {
        id: 'update-004',
        title_en: 'Bharatiya Sakshya Adhiniyam, 2023 (BSA) — New Evidence Law',
        title_hi: 'भारतीय साक्ष्य अधिनियम, 2023 (बीएसए) — नवीन साक्ष्य विधि',
        category: 'central_law',
        act_or_case_name: 'Bharatiya Sakshya Adhiniyam, 2023 (Act No. 47 of 2023)',
        citation: 'Act No. 47 of 2023',
        court_name: 'Parliament of India',
        decision_or_commencement_date: '2024-07-01',
        summary_en: 'Replaces Indian Evidence Act 1872. Recognizes electronic and digital records as primary evidence, establishes certificate requirement for digital devices under Section 63, and modernizes secondary evidence rules.',
        summary_hi: 'भारतीय साक्ष्य अधिनियम 1872 का स्थान लिया। इलेक्ट्रॉनिक और डिजिटल अभिलेखों को प्राथमिक साक्ष्य की मान्यता, धारा 63 के तहत डिजिटल साक्ष्य प्रमाण पत्र तथा द्वितीयक साक्ष्य के आधुनिक नियम।',
        key_sections: ['Section 61 (Admissibility of electronic records)', 'Section 63 (Certificate for electronic evidence)', 'Section 24 (Confessions in custody)', 'Section 116 (Presumption dowry death)'],
        official_source_url: 'https://www.indiacode.nic.in/handle/123456789/20121',
        is_verified: true,
        last_verified_at: '2026-08-01T00:00:00.000Z',
        is_published: true,
        created_at: '2026-08-01T00:00:00.000Z'
      },
      {
        id: 'update-005',
        title_en: 'Rajasthan Tenancy Act, 1955 — Primary Agricultural Land Law',
        title_hi: 'राजस्थान काश्तकारी अधिनियम, 1955 — प्रमुख कृषि भूमि कानून',
        category: 'rajasthan_act',
        act_or_case_name: 'Rajasthan Tenancy Act, 1955 (Act No. 3 of 1955)',
        citation: 'Act No. 3 of 1955 (Raj)',
        court_name: 'Rajasthan Legislative Assembly',
        decision_or_commencement_date: '1955-10-15',
        summary_en: 'Governs agricultural tenancy, Khatedari title rights, devolution, statutory restrictions on SC/ST land alienation under Section 42, partition of agricultural holdings under Section 53, and temporary injunctions by Revenue Courts under Section 212.',
        summary_hi: 'राजस्थान में कृषि काश्तकारी, खातेदारी अधिकार, धारा 42 के तहत अ.जा./अ.ज.जा. भूमि विक्रय पर वैधानिक रोक, धारा 53 के तहत कृषि भूमि का सह-खातेदारों में बंटवारा तथा धारा 212 के तहत उपखंड अधिकारी द्वारा स्थगन आदेश।',
        key_sections: ['Section 15 (Khatedari rights)', 'Section 42 (Protection of SC/ST land)', 'Section 53 (Division of holding)', 'Section 212 (Injunction by Revenue Court)'],
        official_source_url: 'https://law.rajasthan.gov.in',
        is_verified: true,
        last_verified_at: '2026-09-01T00:00:00.000Z',
        is_published: true,
        created_at: '2026-09-01T00:00:00.000Z'
      },
      {
        id: 'update-006',
        title_en: 'Rajasthan Land Revenue Act, 1956 — Revenue Administration & Demarcation',
        title_hi: 'राजस्थान भू-राजस्व अधिनियम, 1956 — राजस्व प्रशासन एवं सीमा ज्ञान (डिमार्केशन)',
        category: 'rajasthan_act',
        act_or_case_name: 'Rajasthan Land Revenue Act, 1956 (Act No. 15 of 1956)',
        citation: 'Act No. 15 of 1956 (Raj)',
        court_name: 'Rajasthan Legislative Assembly',
        decision_or_commencement_date: '1956-07-01',
        summary_en: 'Governs revenue authorities, mutation entries, demarcation and boundary dispute settlements under Section 111, summary eviction of unauthorized encroachers on pasture/government land under Section 91, and appellate powers of the Board of Revenue Ajmer.',
        summary_hi: 'राजस्व प्रशासन, म्यूटेशन (नामांतरण), धारा 111 के तहत तहसीलदार द्वारा सीमा ज्ञान (डिमार्केशन), धारा 91 के तहत चारागाह व सिवायचक भूमि से अतिक्रमणकारियों की बेदखली तथा राजस्व मंडल अजमेर के अपीलीय क्षेत्राधिकार।',
        key_sections: ['Section 91 (Encroachment removal)', 'Section 111 (Boundary demarcation)', 'Section 75 (Appeals to RAA & Board of Revenue)'],
        official_source_url: 'https://landrevenue.rajasthan.gov.in',
        is_verified: true,
        last_verified_at: '2026-09-01T00:00:00.000Z',
        is_published: true,
        created_at: '2026-09-01T00:00:00.000Z'
      },
      {
        id: 'update-007',
        title_en: 'Negotiable Instruments Act, 1881 — Section 138 Cheque Dishonour',
        title_hi: 'परक्राम्य लिखत अधिनियम, 1881 — धारा 138 चेक अनादर (चेक बाउंस)',
        category: 'central_law',
        act_or_case_name: 'Negotiable Instruments Act, 1881 (Act No. 26 of 1881)',
        citation: 'Act No. 26 of 1881',
        court_name: 'Parliament of India',
        decision_or_commencement_date: '1882-03-01',
        summary_en: 'Regulates criminal liability for dishonour of cheques for insufficiency of funds. Imposes strict 30-day statutory notice requirement, Section 139 statutory presumption of debt, vicarious corporate liability under Section 141, and Section 143A interim compensation.',
        summary_hi: 'खाते में अपर्याप्त राशि के कारण चेक अनादर पर दांडिक दायित्व। 30 दिवस में विधिक मांग नोटिस की वैधानिक अनिवार्यता, धारा 139 के तहत ऋण की उपधारणा, धारा 141 में कंपनी निदेशकों का दायित्व तथा धारा 143A में 20% तक अंतरिम क्षतिपूर्ति।',
        key_sections: ['Section 138 (Dishonour for funds)', 'Section 139 (Presumption for holder)', 'Section 141 (Company offences)', 'Section 143A (Interim compensation)'],
        official_source_url: 'https://www.indiacode.nic.in/handle/123456789/2189',
        is_verified: true,
        last_verified_at: '2026-09-10T00:00:00.000Z',
        is_published: true,
        created_at: '2026-09-10T00:00:00.000Z'
      },
      {
        id: 'update-008',
        title_en: 'Rajasthan Court Fees and Suits Valuation Act, 1961',
        title_hi: 'राजस्थान न्यायालय फीस एवं वाद मूल्यांकन अधिनियम, 1961',
        category: 'rajasthan_act',
        act_or_case_name: 'Rajasthan Court Fees and Suits Valuation Act, 1961',
        citation: 'Act No. 23 of 1961 (Raj)',
        court_name: 'Rajasthan Legislative Assembly',
        decision_or_commencement_date: '1961-09-01',
        summary_en: 'Prescribes mandatory ad-valorem and fixed court fees payable on plaints, written statements, injunction applications, partition suits, and appeals instituted before civil and revenue courts in Alwar district.',
        summary_hi: 'अलवर जिले की दीवानी एवं राजस्व अदालतों में प्रस्तुत वादपत्र, शपथ पत्र, निषेधाज्ञा प्रार्थना पत्र, बंटवारा वाद एवं अपीलों पर देय वैधानिक न्याय शुल्क की दरें एवं गणना विधि।',
        key_sections: ['Section 24 (Declaration & injunction fee)', 'Section 35 (Partition suit valuation)', 'Section 48 (Appeals fee)'],
        official_source_url: 'https://law.rajasthan.gov.in',
        is_verified: true,
        last_verified_at: '2026-09-15T00:00:00.000Z',
        is_published: true,
        created_at: '2026-09-15T00:00:00.000Z'
      },
      {
        id: 'update-009',
        title_en: 'Code of Civil Procedure, 1908 (CPC) — Injunctions & Trial Practice',
        title_hi: 'सिविल प्रक्रिया संहिता, 1908 (सीपीसी) — निषेधाज्ञा एवं दीवानी प्रक्रिया',
        category: 'central_law',
        act_or_case_name: 'Code of Civil Procedure, 1908 (Act No. 5 of 1908)',
        citation: 'Act No. 5 of 1908',
        court_name: 'Parliament of India',
        decision_or_commencement_date: '1909-01-01',
        summary_en: 'Procedural foundation for civil litigation: Order 39 Rules 1 & 2 for temporary injunctions (prima facie case, balance of convenience, irreparable injury), Order 7 Rule 11 rejection of plaint, Section 9 jurisdiction, and Section 100 Second Appeals.',
        summary_hi: 'दीवानी वाद प्रक्रिया: आदेश 39 नियम 1 व 2 (अस्थायी निषेधाज्ञा हेतु प्रथम दृष्टया मामला, सुविधा का संतुलन एवं अपूरणीय क्षति), आदेश 7 नियम 11 (वादपत्र निरस्तीकरण) तथा धारा 100 द्वितीय अपील।',
        key_sections: ['Order 39 Rules 1 & 2 (Injunctions)', 'Order 7 Rule 11 (Plaint rejection)', 'Section 9 (Civil court jurisdiction)', 'Section 100 (Second appeal)'],
        official_source_url: 'https://www.indiacode.nic.in/handle/123456789/2191',
        is_verified: true,
        last_verified_at: '2026-09-20T00:00:00.000Z',
        is_published: true,
        created_at: '2026-09-20T00:00:00.000Z'
      },
      {
        id: 'update-003',
        title_en: 'Rajasthan High Court: Khatedari Rights and Summary Revenue Partition',
        title_hi: 'राजस्थान उच्च न्यायालय: खातेदारी अधिकार एवं त्वरित राजस्व बंटवारा वाद',
        category: 'hc_judgment',
        act_or_case_name: 'Ramhet & Ors. v. State of Rajasthan & Ors.',
        citation: '2025 (1) RLR 342 (HC)',
        court_name: 'Rajasthan High Court, Jaipur Bench',
        decision_or_commencement_date: '2025-02-14',
        summary_en: 'Division Bench held that continuous recorded agricultural possession prior to 1955 vests protected Khatedari rights under Section 15 of Rajasthan Tenancy Act, and revenue courts must conclude summary partition mandates strictly within 6 months.',
        summary_hi: 'माननीय खंडपीठ द्वारा निर्णय: 1955 से पूर्व का दर्ज कृषि कब्जा राजस्थान काश्तकारी अधिनियम धारा 15 के तहत वैधानिक खातेदारी अधिकार प्रदान करता है एवं राजस्व अदालतों को 6 माह में बंटवारा वाद का निस्तारण करना होगा।',
        key_sections: ['Section 15 Rajasthan Tenancy Act', 'Section 53 Partition Rules'],
        official_source_url: 'https://hcraj.nic.in',
        is_verified: true,
        last_verified_at: '2026-02-20T00:00:00.000Z',
        is_published: true,
        created_at: '2026-02-20T00:00:00.000Z'
      },
      {
        id: 'update-010',
        title_en: 'Supreme Court of India: Comprehensive Bail Directives under New Criminal Codes',
        title_hi: 'सर्वोच्च न्यायालय: नवीन दांडिक विधियों में जमानत एवं गिरफ्तारी पर मार्गदर्शक सिद्धांत',
        category: 'sc_judgment',
        act_or_case_name: 'Satender Kumar Antil v. Central Bureau of Investigation & Anr.',
        citation: '(2022) 10 SCC 51 / 2024 INSC 582',
        court_name: 'Supreme Court of India',
        decision_or_commencement_date: '2024-05-10',
        summary_en: 'Landmark constitutional bench precedent mandating that for offences punishable with imprisonment of 7 years or less, routine arrest is unlawful without strict compliance with Section 35 BNSS notice. Established Category A-D bail matrix directing trial courts to decide bail applications on the same day or within 2 weeks.',
        summary_hi: 'सर्वोच्च न्यायालय का ऐतिहासिक फैसला: 7 वर्ष तक की सजा वाले अपराधों में धारा 35 बीएनएसएस (पूर्व धारा 41A) नोटिस का पालन किए बिना गिरफ्तारी वर्जित। ट्रायल कोर्ट्स को उसी दिन अथवा अधिकतम दो सप्ताह में जमानत प्रार्थना पत्रों का निस्तारण करने का आदेश।',
        key_sections: ['Section 480 BNSS (Regular bail)', 'Section 482 BNSS (Anticipatory bail)', 'Section 35 BNSS (Notice of appearance)'],
        official_source_url: 'https://sci.gov.in',
        is_verified: true,
        last_verified_at: '2026-09-01T00:00:00.000Z',
        is_published: true,
        created_at: '2026-09-01T00:00:00.000Z'
      },
      {
        id: 'update-011',
        title_en: 'Supreme Court of India: Mandatory Checks Before Remand & Matrimonial Arrests',
        title_hi: 'सर्वोच्च न्यायालय: न्यायिक रिमांड एवं वैवाहिक विवादों में मनमानी गिरफ्तारी पर रोक',
        category: 'sc_judgment',
        act_or_case_name: 'Arnesh Kumar v. State of Bihar & Anr.',
        citation: '(2014) 8 SCC 273 (Reaffirmed 2024)',
        court_name: 'Supreme Court of India',
        decision_or_commencement_date: '2014-07-02',
        summary_en: 'Police officers must not arrest automatically when a case under Section 85 BNS (dowry cruelty / 498A IPC) is registered. Magistrates authorizing detention must record satisfaction with specific objective reasons; failure renders officer and magistrate liable to disciplinary and contempt action.',
        summary_hi: 'दहेज प्रताड़ना (धारा 85 बीएनएस) मामलों में स्वतः गिरफ्तारी पर पूर्ण रोक। न्यायिक मजिस्ट्रेट को रिमांड देने से पूर्व पुलिस द्वारा प्रस्तुत कारणों की संतुष्टि दर्ज करना अनिवार्य।',
        key_sections: ['Section 35 BNSS', 'Section 85 BNS', 'Section 86 BNS'],
        official_source_url: 'https://sci.gov.in',
        is_verified: true,
        last_verified_at: '2026-09-01T00:00:00.000Z',
        is_published: true,
        created_at: '2026-09-01T00:00:00.000Z'
      },
      {
        id: 'update-012',
        title_en: 'Rajasthan High Court: Concurrent Bail Jurisdiction under Section 480/482 BNSS',
        title_hi: 'राजस्थान उच्च न्यायालय: धारा 480 व 482 बीएनएसएस के तहत समवर्ती क्षेत्राधिकार',
        category: 'hc_judgment',
        act_or_case_name: 'Bhanwar Lal & Ors. v. State of Rajasthan',
        citation: '2024 (3) WLC (Raj) 489',
        court_name: 'Rajasthan High Court, Jodhpur Bench',
        decision_or_commencement_date: '2024-09-18',
        summary_en: 'Held that while High Court and Sessions Court have concurrent statutory jurisdiction for bail under Sections 480 and 482 BNSS, established judicial discipline in Rajasthan requires that the litigant must first approach the District & Sessions Judge Alwar before invoking High Court jurisdiction, absent compelling grounds.',
        summary_hi: 'माननीय उच्च न्यायालय: धारा 480 व 482 बीएनएसएस में सत्र न्यायालय व उच्च न्यायालय को समवर्ती अधिकार प्राप्त हैं, परंतु न्यायिक अनुशासन के तहत पक्षकार को पहले सत्र न्यायालय में ही आवेदन करना आवश्यक है।',
        key_sections: ['Section 480 BNSS', 'Section 482 BNSS'],
        official_source_url: 'https://hcraj.nic.in',
        is_verified: true,
        last_verified_at: '2026-09-20T00:00:00.000Z',
        is_published: true,
        created_at: '2026-09-20T00:00:00.000Z'
      },
      {
        id: 'update-013',
        title_en: 'Rajasthan High Court: Restraining Co-sharer from Unilateral Construction',
        title_hi: 'राजस्थान उच्च न्यायालय: सह-खातेदार द्वारा बिना बंटवारा पक्के निर्माण पर रोक',
        category: 'hc_judgment',
        act_or_case_name: 'Prem Chand v. Jagdish & Ors.',
        citation: '2021 (3) RLR 512 (HC)',
        court_name: 'Rajasthan High Court, Jaipur Bench',
        decision_or_commencement_date: '2021-04-12',
        summary_en: 'Reiterated settled Rajasthan property jurisprudence: An undivided co-sharer in joint agricultural land has no legal authority to raise permanent construction or change land character without partition decree or consent of all recorded co-owners; interim injunction under Order 39 Rules 1 & 2 CPC is warranted.',
        summary_hi: 'संयुक्त कृषि भूमि में कोई भी सह-खातेदार अन्य सह-खातेदारों की सहमति या सक्षम न्यायालय से अंतिम बंटवारा डिक्री के बिना एकतरफा पक्का निर्माण नहीं कर सकता। आदेश 39 नियम 1 व 2 सीपीसी के तहत स्थगन न्यायोचित है।',
        key_sections: ['Section 53 Rajasthan Tenancy Act', 'Order 39 Rules 1 & 2 CPC'],
        official_source_url: 'https://hcraj.nic.in',
        is_verified: true,
        last_verified_at: '2026-09-25T00:00:00.000Z',
        is_published: true,
        created_at: '2026-09-25T00:00:00.000Z'
      },
      {
        id: 'update-014',
        title_en: 'Supreme Court of India: Mandatory Presumption in Cheque Dishonour under Section 139',
        title_hi: 'सर्वोच्च न्यायालय: चेक बाउंस में धारा 139 के तहत ऋण दायित्व की वैधानिक उपधारणा',
        category: 'sc_judgment',
        act_or_case_name: 'Bir Singh v. Mukesh Kumar',
        citation: '(2019) 4 SCC 197',
        court_name: 'Supreme Court of India',
        decision_or_commencement_date: '2019-02-06',
        summary_en: 'Held that a blank cheque leaf voluntarily signed and handed over by the drawer creates a binding statutory presumption under Section 139 NI Act that it was issued towards discharge of debt or liability. The burden of rebutting this presumption lies squarely on the accused drawer with cogent evidence.',
        summary_hi: 'सर्वोच्च न्यायालय का निर्णय: यदि खाताधारक ने हस्ताक्षर कर ब्लैंक चेक सौंपा है, तो धारा 139 परक्राम्य लिखत अधिनियम के तहत यह माना जाएगा कि चेक वैध ऋण के भुगतान हेतु दिया गया था। इसे गलत सिद्ध करने का भार अभियुक्त पर होगा।',
        key_sections: ['Section 138 NI Act', 'Section 139 NI Act'],
        official_source_url: 'https://sci.gov.in',
        is_verified: true,
        last_verified_at: '2026-09-28T00:00:00.000Z',
        is_published: true,
        created_at: '2026-09-28T00:00:00.000Z'
      }
    ],
    legal_forms: [
      {
        id: 'form-001',
        title_en: 'Regular Bail Application under Section 480 BNSS, 2023',
        title_hi: 'नियमित जमानत प्रार्थना पत्र — धारा 480 बीएनएसएस, 2023',
        category: 'criminal',
        description_en: 'Standard format for Sessions Court and Judicial Magistrate Alwar for bail in non-bailable cases.',
        description_hi: 'अलवर सत्र न्यायालय एवं न्यायिक मजिस्ट्रेट हेतु धारा 480 के तहत नियमित जमानत का प्रामाणिक प्रारूप।',
        file_format: 'docx',
        file_path: '/templates/bail_application_sec_480_bnss.docx',
        source_name: 'District & Sessions Court Alwar Bar Practice',
        is_mandatory_prescribed: false,
        disclaimer: 'This practice template must be adapted to individual case facts and custody dates.',
        downloads_count: 245,
        created_at: '2026-03-01T00:00:00.000Z'
      },
      {
        id: 'form-002',
        title_en: 'Temporary Injunction Application under Order 39 Rules 1 & 2 CPC',
        title_hi: 'अस्थायी निषेधाज्ञा प्रार्थना पत्र — आदेश 39 नियम 1 व 2 सिविल प्रक्रिया संहिता',
        category: 'civil',
        description_en: 'Application with supporting affidavit to protect land possession and restrain alienation.',
        description_hi: 'भूमि विवाद में कब्जा संरक्षण एवं बेचान पर रोक हेतु शपथ पत्र सहित आवेदन।',
        file_format: 'docx',
        file_path: '/templates/injunction_order_39_rules_1_2_cpc.docx',
        source_name: 'Civil Court Practice Guide',
        is_mandatory_prescribed: false,
        disclaimer: 'Verify prima facie case, balance of convenience, and irreparable injury grounds.',
        downloads_count: 189,
        created_at: '2026-03-01T00:00:00.000Z'
      },
      {
        id: 'form-003',
        title_en: 'Statutory Demand Notice under Section 138 NI Act',
        title_hi: 'वैधानिक मांग सूचना पत्र — धारा 138 परक्राम्य लिखत अधिनियम (चेक बाउंस)',
        category: 'commercial',
        description_en: '15-day statutory demand notice sent via registered post within 30 days of bank return memo.',
        description_hi: 'चेक अनादर के मामले में बैंक वापसी मेमो के 30 दिवस में भेजी जाने वाली विधिक सूचना।',
        file_format: 'docx',
        file_path: '/templates/legal_notice_sec_138_ni_act.docx',
        source_name: 'Negotiable Instruments Practice',
        is_mandatory_prescribed: false,
        disclaimer: 'Strict statutory timelines apply. Calculate 30-day notice window accurately.',
        downloads_count: 312,
        created_at: '2026-03-01T00:00:00.000Z'
      }
    ],
    notices_events: [
      {
        id: 'notice-001',
        title_en: 'Alwar District Court Annual Winter Recess & Urgent Roster Notice',
        title_hi: 'जिला एवं सत्र न्यायालय अलवर वार्षिक शीतकालीन अवकाश एवं आवश्यक रोस्टर सूचना',
        category: 'court_notice',
        content_en: 'The District & Sessions Court and all subordinate courts in Alwar district will observe scheduled recess. Designated Vacation Judges will hear urgent bail and injunction matters between 10:30 AM to 1:30 PM.',
        content_hi: 'जिला एवं सत्र न्यायालय अलवर तथा अधीनस्थ न्यायालयों में घोषित अवकाश रहेगा। इस अवधि में आवश्यक जमानत व निषेधाज्ञा प्रार्थना पत्रों की सुनवाई नामित अवकाशकालीन न्यायाधीशों द्वारा प्रातः 10:30 से 1:30 बजे तक की जाएगी।',
        event_date: '2026-12-25T10:00:00.000Z',
        expiry_date: '2027-01-02T17:00:00.000Z',
        venue: 'District Court Complex, Alwar',
        organizer: 'Office of District & Sessions Judge, Alwar',
        official_source_url: 'https://districts.ecourts.gov.in/alwar',
        is_published: true,
        created_at: '2026-10-01T00:00:00.000Z'
      },
      {
        id: 'notice-002',
        title_en: 'Workshop on Practical Implementation of BNSS, BNS & BSA for Alwar Advocates',
        title_hi: 'अलवर अधिवक्ताओं हेतु नवीन दांडिक विधियों (बीएनएसएस, बीएनएस व बीएसए) पर कार्यशाला',
        category: 'training',
        content_en: 'One-day Continuing Legal Education workshop focusing on Section 480 bail drafting, digital evidence certificates under Section 63 BSA, and e-summons verification.',
        content_hi: 'एक दिवसीय सतत विधिक शिक्षा कार्यशाला: धारा 480 जमानत प्रारूपण, धारा 63 बीएसए के तहत डिजिटल साक्ष्य प्रमाण पत्र तथा इलेक्ट्रॉनिक सम्मन की विधिक बारीकियों पर विचार-विमर्श।',
        event_date: '2026-11-15T10:00:00.000Z',
        expiry_date: '2026-11-15T18:00:00.000Z',
        venue: 'Bar Association Auditorium, Alwar',
        organizer: 'Alwar District Bar Association',
        official_source_url: 'https://alwarbar.in',
        is_published: true,
        created_at: '2026-10-10T00:00:00.000Z'
      },
      {
        id: 'notice-003',
        title_en: 'Bar Council of Rajasthan: Mandatory Welfare Fund Stamp Compliance Circular',
        title_hi: 'बार काउंसिल ऑफ राजस्थान: अधिवक्ता कल्याण कोष स्टाम्प अनिवार्यता परिपत्र',
        category: 'bar_notice',
        content_en: 'Strict compliance notification issued to all advocates practicing in Alwar: Every Vakalatnama submitted across Civil, Criminal, and Revenue Courts must affix the prescribed ₹25 Rajasthan Advocates Welfare Fund Stamp to maintain active nominee death and medical benefits.',
        content_hi: 'अलवर के समस्त अधिवक्ताओं हेतु आवश्यक परिपत्र: दीवानी, दांडिक एवं राजस्व अदालतों में प्रस्तुत प्रत्येक वकालतनामे पर ₹25 का राजस्थान अधिवक्ता कल्याण कोष स्टाम्प लगाना अनिवार्य है जिससे अधिवक्ताओं व उनके नामांकित परिजनों को कल्याण कोष की सहायता सुनिश्चित हो सके।',
        event_date: '2026-10-18T10:00:00.000Z',
        venue: 'All Court Wings, District Alwar',
        organizer: 'Bar Council of Rajasthan, Trustee Committee',
        official_source_url: 'https://barcouncilofrajasthan.org/circular/rajasthan-advocates-welfare-fund',
        is_published: true,
        created_at: '2026-10-18T00:00:00.000Z'
      },
      {
        id: 'notice-004',
        title_en: 'eCourts 3.0: Digital Bail Release Order Transmission via FASTER System',
        title_hi: 'ई-कोर्ट्स 3.0: फॉस्टर प्रणाली द्वारा डिजिटल जमानत रिहाई आदेश प्रेषण',
        category: 'tech_update',
        content_en: 'National e-Committee and Rajasthan High Court have activated the electronic FASTER workflow for Alwar Sessions Court. Digitally signed bail release orders are now transmitted instantly to Alwar Central Jail superintendent, eliminating manual release delays.',
        content_hi: 'माननीय उच्च न्यायालय एवं ई-कमेटी द्वारा अलवर सत्र न्यायालय में फॉस्टर प्रणाली प्रारंभ। डिजिटल हस्ताक्षरित जमानत रिहाई आदेश अब तुरंत अलवर केंद्रीय कारागृह को ऑनलाइन भेजे जा रहे हैं, जिससे बंदियों की रिहाई में कागजी विलंब समाप्त हो गया है।',
        event_date: '2026-10-20T10:00:00.000Z',
        venue: 'Sessions Court & Central Jail, Alwar',
        organizer: 'e-Committee Supreme Court of India & High Court of Rajasthan',
        official_source_url: 'https://districts.ecourts.gov.in/alwar',
        is_published: true,
        created_at: '2026-10-20T00:00:00.000Z'
      },
      {
        id: 'notice-005',
        title_en: 'Mandatory Pre-Institution Mediation SOP under Commercial Courts Act',
        title_hi: 'वाणिज्यिक न्यायालय अधिनियम के तहत वाद-पूर्व मध्यस्थता (PIM) मानक प्रक्रिया',
        category: 'legal_reform',
        content_en: 'District Legal Services Authority (DLSA) Alwar notifies standard operating procedure for pre-institution mediation in commercial disputes. Advocates may file mediation requests online without physical visits to initiate the 3-month statutory window.',
        content_hi: 'जिला विधिक सेवा प्राधिकरण (डीएलएसए) अलवर द्वारा वाणिज्यिक विवादों में वाद-पूर्व मध्यस्थता हेतु मानक संचालन प्रक्रिया जारी। अधिवक्ता अब वाणिज्यिक वाद दायर करने से पूर्व ऑनलाइन आवेदन कर सकते हैं।',
        event_date: '2026-10-22T10:00:00.000Z',
        venue: 'DLSA Office, ADR Centre, District Court Campus, Alwar',
        organizer: 'District Legal Services Authority, Alwar',
        official_source_url: 'https://districts.ecourts.gov.in/alwar',
        is_published: true,
        created_at: '2026-10-22T00:00:00.000Z'
      },
      {
        id: 'notice-006',
        title_en: 'Rajasthan High Court: Online Certified Copies Portal Activated for Alwar Courts',
        title_hi: 'राजस्थान उच्च न्यायालय: अलवर अधीनस्थ अदालतों हेतु ऑनलाइन प्रमाणित प्रतिलिपि पोर्टल',
        category: 'court_notice',
        content_en: 'Advocates and parties can now apply for certified copies of orders, pleadings, and decree sheets online through the unified Rajasthan Judicial portal, pay statutory copying fees via e-Gras, and receive digitally attested PDFs.',
        content_hi: 'अलवर जिले की सभी अधीनस्थ अदालतों के आदेशों, प्रार्थना पत्रों व डिक्री शीट की प्रमाणित प्रतिलिपि (सर्टिफाइड कॉपी) हेतु ऑनलाइन पोर्टल प्रारंभ। ई-ग्रास द्वारा कोर्ट फीस का भुगतान कर डिजिटल हस्ताक्षरित प्रतिलिपि प्राप्त की जा सकती है।',
        event_date: '2026-10-24T10:00:00.000Z',
        venue: 'Copying Section, District Court, Alwar',
        organizer: 'High Court of Rajasthan, Jodhpur',
        official_source_url: 'https://hcraj.nic.in',
        is_published: true,
        created_at: '2026-10-24T00:00:00.000Z'
      }
    ],
    forum_categories: [
      {
        id: 'cat-001',
        slug: 'civil-property',
        name_en: 'Civil & Property Law',
        name_hi: 'दीवानी एवं संपत्ति कानून',
        description_en: 'Title suits, injunctions, specific performance, and property disputes',
        description_hi: 'स्वामित्व वाद, निषेधाज्ञा, विशिष्ट अनुतोष एवं संपत्ति विवाद',
        icon: 'scale',
        sort_order: 1,
        post_count: 1
      },
      {
        id: 'cat-002',
        slug: 'criminal-practice',
        name_en: 'Criminal Law & Procedure',
        name_hi: 'दांडिक विधि एवं प्रक्रिया',
        description_en: 'BNSS bail, trials, revisions, appeals, and police station procedures',
        description_hi: 'बीएनएसएस जमानत, विचारण, निगरानी, अपील एवं थाना प्रक्रिया',
        icon: 'gavel',
        sort_order: 2,
        post_count: 1
      },
      {
        id: 'cat-003',
        slug: 'revenue-land',
        name_en: 'Revenue & Land Matters',
        name_hi: 'राजस्व एवं भूमि विधि',
        description_en: 'Rajasthan Tenancy Act, Land Revenue Act, mutation, and partition',
        description_hi: 'राजस्थान काश्तकारी अधिनियम, भू-राजस्व, नामांतरण एवं विभाजन',
        icon: 'landmark',
        sort_order: 3,
        post_count: 0
      },
      {
        id: 'cat-004',
        slug: 'young-advocates',
        name_en: 'Young Advocates & Mentoring',
        name_hi: 'नवप्रवेशी अधिवक्ता एवं मार्गदर्शन',
        description_en: 'Practice orientation, chamber etiquette, and senior guidance',
        description_hi: 'वकालत प्रारंभ, चैंबर परंपराएं एवं वरिष्ठ मार्गदर्शन',
        icon: 'graduation-cap',
        sort_order: 4,
        post_count: 0
      }
    ],
    forum_posts: [
      {
        id: 'post-001',
        category_id: 'cat-002',
        category_slug: 'criminal-practice',
        category_name_en: 'Criminal Law & Procedure',
        category_name_hi: 'दांडिक विधि एवं प्रक्रिया',
        user_id: demoAdvocateId,
        author_name: 'Advocate Rajesh Sharma',
        author_enrollment: 'R/1420/2012',
        author_verified: true,
        title: 'Application of Section 480 BNSS vs Old 437 CrPC in pending FIRs registered prior to July 2024',
        content: 'Colleagues practicing in Alwar Sessions Court, what has been the judicial approach regarding bail applications where the alleged incident/FIR dates back to May 2024 but arrest and remand occurred after July 1, 2024? Under Section 531 of BNSS (repeal and savings), investigations initiated under CrPC continue under the old code, but what caption are the magistrates accepting for bail petitions?',
        language: 'mixed',
        upvotes: 18,
        replies_count: 1,
        is_pinned: true,
        is_hidden: false,
        created_at: '2026-09-10T14:30:00.000Z'
      }
    ],
    forum_replies: [
      {
        id: 'reply-001',
        post_id: 'post-001',
        user_id: demoAdvocate2Id,
        author_name: 'Advocate Sunita Meena',
        author_enrollment: 'R/2890/2018',
        author_verified: true,
        content: 'In Alwar CJM and Sessions courts, it is standard practice to caption the petition under Section 480 BNSS read with Section 437 CrPC. Sessions courts are emphasizing that procedural law applies from the date of presentation of the bail application, so citing BNSS with reference to old CrPC provides safe practice.',
        is_accepted_answer: true,
        upvotes: 12,
        created_at: '2026-09-10T16:15:00.000Z'
      }
    ],
    forum_reports: [],
    // 8. PRIVATE MY CASE ADVOCATE WORKSPACE (ISOLATED TO demoAdvocateId)
    clients: [
      {
        id: demoClientId,
        advocate_id: demoAdvocateId,
        full_name: 'Mukesh Kumar Saini',
        phone: '9414011223',
        email: 'mukesh.saini@alwarmail.com',
        address: 'Ward No. 12, Shivaji Park, Alwar, Rajasthan',
        confidential_notes: 'Client is an agricultural landowner. Retained for partition suit before SDO Alwar.',
        created_at: '2026-02-10T10:00:00.000Z'
      }
    ],
    cases: [
      {
        id: demoCaseId,
        advocate_id: demoAdvocateId,
        client_id: demoClientId,
        case_title: 'Mukesh Kumar Saini v. Rameshwar Dayal & Ors.',
        case_number: 'Revenue Suit 88/2025',
        cnr_number: 'RJAL01-002491-2025',
        court_name: 'Court of Sub-Divisional Officer (SDO), Alwar',
        case_type: 'Revenue Partition & Injunction (Sec 53 & 212 Rajasthan Tenancy Act)',
        petitioner_parties: 'Mukesh Kumar Saini s/o Lt. Ram Lal Saini',
        respondent_parties: 'Rameshwar Dayal & Tehsildar Alwar',
        filing_date: '2025-04-12',
        next_hearing_date: '2026-11-04',
        stage_of_case: 'Arguments on Temporary Injunction (Order 39 R 1 & 2 / Sec 212 RTA)',
        status: 'active',
        private_notes: 'Respondents filed reply. Need to emphasize revenue jamabandi showing undivided co-sharer status.',
        created_at: '2026-02-10T11:00:00.000Z',
        updated_at: '2026-10-15T09:30:00.000Z'
      }
    ],
    case_documents: [
      {
        id: 'doc-001',
        case_id: demoCaseId,
        advocate_id: demoAdvocateId,
        title: 'Certified Jamabandi Nakal Samvat 2081 — Khasra No. 412/1',
        category: 'evidence',
        file_path: '/vault/mukesh_saini_jamabandi_khasra_412.pdf',
        file_size_bytes: 1420500,
        mime_type: 'application/pdf',
        extracted_text: 'नकल जमाबंदी सम्बत 2081 तहसील अलवर, ग्राम विजय नगर। खसरा संख्या 412/1 रकबा 2 बीघा 4 बिस्वा। खातेदार: मुकेश कुमार सैनी व रमेशवर दयाल पुत्रगण रामलाल सैनी। हिस्सा: बराबर (1/2 प्रत्येक)।',
        page_count: 2,
        ocr_status: 'completed',
        created_at: '2026-02-11T12:00:00.000Z'
      }
    ],
    case_hearings: [
      {
        id: 'hearing-001',
        case_id: demoCaseId,
        advocate_id: demoAdvocateId,
        hearing_date: '2026-11-04',
        court_room: 'Court No. 2, SDO Campus, Alwar',
        judge_name: 'Sub-Divisional Magistrate, Alwar',
        business_recorded: 'Previous order: Reply to stay application taken on record. Matter posted for final arguments on stay.',
        previous_order_summary: 'Notices served. Parties directed to maintain status quo on agricultural boundaries till next date.',
        next_action: 'Prepare citation compilation on co-sharer right to maintain possession before actual partition.',
        next_hearing_date: '2026-11-04',
        attended: true,
        case_title: 'Mukesh Kumar Saini v. Rameshwar Dayal & Ors.',
        created_at: '2026-10-10T10:00:00.000Z'
      }
    ],
    tasks: [
      {
        id: 'task-001',
        advocate_id: demoAdvocateId,
        case_id: demoCaseId,
        title: 'Submit certified rejoinder and copy of Khasra map in SDO Court',
        due_date: '2026-11-02',
        priority: 'urgent',
        status: 'pending',
        case_title: 'Mukesh Kumar Saini v. Rameshwar Dayal & Ors.',
        created_at: '2026-10-15T10:00:00.000Z'
      }
    ],
    invoices: [
      {
        id: 'inv-001',
        advocate_id: demoAdvocateId,
        client_id: demoClientId,
        case_id: demoCaseId,
        invoice_number: 'INV-2026-0042',
        total_amount: 15000,
        paid_amount: 10000,
        status: 'partially_paid',
        issue_date: '2026-02-12',
        due_date: '2026-11-04',
        notes: 'Initial drafting fee and interim stay argument fee. Balance ₹5,000 payable upon stay order disposal.',
        client_name: 'Mukesh Kumar Saini',
        case_title: 'Mukesh Kumar Saini v. Rameshwar Dayal & Ors.',
        created_at: '2026-02-12T14:00:00.000Z'
      }
    ],
    drafts: [
      {
        id: 'draft-001',
        advocate_id: demoAdvocateId,
        case_id: demoCaseId,
        draft_type: 'written_statement',
        title: 'Rejoinder to Reply in SDO Revenue Partition Suit 88/2025',
        content_text: 'BEFORE THE COURT OF SUB-DIVISIONAL OFFICER, ALWAR\nRevenue Suit No. 88/2025\n\nMukesh Kumar Saini ...Plaintiff\nVersus\nRameshwar Dayal & Anr. ...Respondents\n\nREJOINDER ON BEHALF OF PLAINTIFF TO THE REPLY OF RESPONDENT NO. 1\n\nMOST RESPECTFULLY SHOWETH:\n1. That the contents of preliminary objection No. 1 are false, fabricated, and emphatically denied.\n2. That the revenue record (Jamabandi Samvat 2081) conclusively establishes that Khasra No. 412/1 is undivided ancestral agricultural land wherein the Plaintiff holds an undisputed 1/2 share.\n3. That the Respondent No. 1 has unlawfully attempted to change the nature of the agricultural land by initiating unpermitted construction without formal metes-and-bounds partition.\n\nPRAYER:\nIt is therefore respectfully prayed that the interim injunction under Section 212 Rajasthan Tenancy Act be confirmed till final disposal of the partition suit.',
        language: 'en',
        version: 1,
        created_at: '2026-10-16T15:00:00.000Z',
        updated_at: '2026-10-16T15:00:00.000Z'
      }
    ],
    personal_library: [
      {
        id: 'lib-001',
        advocate_id: demoAdvocateId,
        title: 'Rajasthan High Court on Co-sharer Partition: Prem Chand v. Jagdish',
        category: 'Revenue Tenancy',
        citation: '2021 (3) RLR 512',
        notes: 'Supreme principle: No co-sharer in exclusive possession of a portion can raise permanent construction to the detriment of other co-sharers until final decree.',
        source_url: 'https://hcraj.nic.in',
        created_at: '2026-03-01T10:00:00.000Z'
      }
    ],
    audit_logs: [
      {
        id: 'audit-001',
        actor_id: initialAdminId,
        actor_name: 'Alwar Bar Admin',
        actor_role: 'public_admin',
        action: 'VERIFY_ADVOCATE_PROFILE',
        entity_type: 'advocate_profile',
        entity_id: 'prof-001',
        ip_address: '127.0.0.1',
        details: { enrollment_no: 'R/1420/2012', status: 'verified' },
        created_at: '2026-01-10T12:00:00.000Z'
      }
    ]
  };
}

class LocalDatabase {
  private state: DatabaseState | null = null;
  private lastMtime: number = 0;

  private ensureLoaded(): DatabaseState {
    const stat = fs.existsSync(DB_FILE) ? fs.statSync(DB_FILE) : null;
    if (this.state && stat && stat.mtimeMs === this.lastMtime) return this.state;
    if (stat) this.lastMtime = stat.mtimeMs;

    const dir = path.dirname(DB_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (!fs.existsSync(DB_FILE)) {
      const initial = getInitialState();
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
      this.state = initial;
      return this.state;
    }

    try {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      const loaded = JSON.parse(data);
      const initial = getInitialState();
      let changed = false;

      // Merge advocate profiles so initial profiles (including R/2268/2009) are always present
      const profilesMap = new Map<string, AdvocateProfile>();
      for (const p of initial.advocate_profiles) {
        profilesMap.set(p.id, p);
      }
      if (Array.isArray(loaded.advocate_profiles)) {
        for (const p of loaded.advocate_profiles) {
          profilesMap.set(p.id, { ...(profilesMap.get(p.id) || {}), ...p });
        }
      }
      const mergedProfiles = Array.from(profilesMap.values());
      if (mergedProfiles.length !== (loaded.advocate_profiles?.length || 0)) changed = true;

      // Merge legal updates so all default verified acts and precedents are always available
      const legalUpdatesMap = new Map<string, LegalUpdate>();
      for (const u of initial.legal_updates) {
        legalUpdatesMap.set(u.id, u);
      }
      if (Array.isArray(loaded.legal_updates)) {
        for (const u of loaded.legal_updates) {
          legalUpdatesMap.set(u.id, { ...(legalUpdatesMap.get(u.id) || {}), ...u });
        }
      }
      const mergedLegalUpdates = Array.from(legalUpdatesMap.values());
      if (mergedLegalUpdates.length !== (loaded.legal_updates?.length || 0)) changed = true;

      // Merge notices & events
      const noticesMap = new Map<string, NoticeEvent>();
      for (const n of initial.notices_events) {
        noticesMap.set(n.id, n);
      }
      if (Array.isArray(loaded.notices_events)) {
        for (const n of loaded.notices_events) {
          noticesMap.set(n.id, { ...(noticesMap.get(n.id) || {}), ...n });
        }
      }
      const mergedNotices = Array.from(noticesMap.values());
      if (mergedNotices.length !== (loaded.notices_events?.length || 0)) changed = true;

      // Merge welfare schemes so all authentic statutory funds are present
      const welfareMap = new Map<string, WelfareScheme>();
      for (const w of initial.welfare_schemes) {
        welfareMap.set(w.id, w);
      }
      if (Array.isArray(loaded.welfare_schemes)) {
        for (const w of loaded.welfare_schemes) {
          welfareMap.set(w.id, { ...(welfareMap.get(w.id) || {}), ...w });
        }
      }
      const mergedWelfare = Array.from(welfareMap.values());
      if (mergedWelfare.length !== (loaded.welfare_schemes?.length || 0)) changed = true;

      // Merge welfare bulletins
      const bulletinsMap = new Map<string, WelfareBulletin>();
      for (const b of initial.welfare_bulletins || []) {
        bulletinsMap.set(b.id, b);
      }
      if (Array.isArray(loaded.welfare_bulletins)) {
        for (const b of loaded.welfare_bulletins) {
          bulletinsMap.set(b.id, { ...(bulletinsMap.get(b.id) || {}), ...b });
        }
      }
      const mergedBulletins = Array.from(bulletinsMap.values());
      if (mergedBulletins.length !== (loaded.welfare_bulletins?.length || 0)) changed = true;

      // Merge and ensure all collections exist
      const merged: DatabaseState = {
        users: Array.isArray(loaded.users) ? loaded.users : [],
        advocate_profiles: mergedProfiles,
        welfare_schemes: mergedWelfare,
        welfare_bulletins: mergedBulletins,
        legal_updates: mergedLegalUpdates,
        legal_forms: Array.isArray(loaded.legal_forms) && loaded.legal_forms.length > 0 ? loaded.legal_forms : initial.legal_forms,
        notices_events: mergedNotices,
        forum_categories: Array.isArray(loaded.forum_categories) && loaded.forum_categories.length > 0 ? loaded.forum_categories : initial.forum_categories,
        forum_posts: Array.isArray(loaded.forum_posts) && loaded.forum_posts.length > 0 ? loaded.forum_posts : initial.forum_posts,
        forum_replies: Array.isArray(loaded.forum_replies) && loaded.forum_replies.length > 0 ? loaded.forum_replies : initial.forum_replies,
        forum_reports: Array.isArray(loaded.forum_reports) ? loaded.forum_reports : [],
        cases: Array.isArray(loaded.cases) && loaded.cases.length > 0 ? loaded.cases : initial.cases,
        case_documents: Array.isArray(loaded.case_documents) && loaded.case_documents.length > 0 ? loaded.case_documents : initial.case_documents,
        case_hearings: Array.isArray(loaded.case_hearings) && loaded.case_hearings.length > 0 ? loaded.case_hearings : initial.case_hearings,
        tasks: Array.isArray(loaded.tasks) && loaded.tasks.length > 0 ? loaded.tasks : initial.tasks,
        clients: Array.isArray(loaded.clients) && loaded.clients.length > 0 ? loaded.clients : initial.clients,
        invoices: Array.isArray(loaded.invoices) && loaded.invoices.length > 0 ? loaded.invoices : initial.invoices,
        drafts: Array.isArray(loaded.drafts) && loaded.drafts.length > 0 ? loaded.drafts : initial.drafts,
        personal_library: Array.isArray(loaded.personal_library) && loaded.personal_library.length > 0 ? loaded.personal_library : initial.personal_library,
        audit_logs: Array.isArray(loaded.audit_logs) && loaded.audit_logs.length > 0 ? loaded.audit_logs : initial.audit_logs,
      };

      // Ensure preset users exist with valid password hashes
      for (const defaultUser of initial.users) {
        const existingIdx = merged.users.findIndex(u => u.email.toLowerCase() === defaultUser.email.toLowerCase());
        if (existingIdx === -1) {
          merged.users.unshift(defaultUser);
          changed = true;
        } else if (!merged.users[existingIdx].password_hash) {
          merged.users[existingIdx] = {
            ...defaultUser,
            ...merged.users[existingIdx],
            password_hash: defaultUser.password_hash,
            role: defaultUser.role,
            is_active: true
          };
          changed = true;
        }
      }

      this.state = merged;
      if (changed || !loaded.advocate_profiles) {
        this.save();
      }
      return this.state;
    } catch {
      const fallback = getInitialState();
      this.state = fallback;
      this.save();
      return fallback;
    }
  }

  private save(): void {
    if (!this.state) return;
    const dir = path.dirname(DB_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(this.state, null, 2), 'utf-8');
  }

  // --- USERS & AUTH ---
  getUsers(): User[] {
    return this.ensureLoaded().users;
  }

  getUserById(id: string): User | undefined {
    return this.ensureLoaded().users.find(u => u.id === id);
  }

  getUserByEmail(email: string): User | undefined {
    return this.ensureLoaded().users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  createUser(user: Omit<User, 'id' | 'created_at' | 'updated_at'>): User {
    const s = this.ensureLoaded();
    const newUser: User = {
      ...user,
      id: 'usr-' + crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    s.users.push(newUser);
    this.save();
    return newUser;
  }

  updateUserPassword(userId: string, newPasswordHash: string): boolean {
    const s = this.ensureLoaded();
    const user = s.users.find(u => u.id === userId);
    if (!user) return false;
    user.password_hash = newPasswordHash;
    user.updated_at = new Date().toISOString();
    this.save();
    return true;
  }

  updateUserPasswordByEmail(email: string, newPasswordHash: string): boolean {
    const s = this.ensureLoaded();
    const user = s.users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
    if (!user) return false;
    user.password_hash = newPasswordHash;
    user.updated_at = new Date().toISOString();
    this.save();
    return true;
  }

  // --- ADVOCATE PROFILES ---
  getAdvocateProfiles(): AdvocateProfile[] {
    const s = this.ensureLoaded();
    return s.advocate_profiles.map(p => ({
      ...p,
      user: s.users.find(u => u.id === p.user_id)
    }));
  }

  getAdvocateProfileByUserId(userId: string): AdvocateProfile | undefined {
    const s = this.ensureLoaded();
    const p = s.advocate_profiles.find(prof => prof.user_id === userId);
    if (!p) return undefined;
    return {
      ...p,
      user: s.users.find(u => u.id === p.user_id)
    };
  }

  updateAdvocateVerification(profileId: string, isVerified: boolean, verifiedBy: string): boolean {
    const s = this.ensureLoaded();
    const p = s.advocate_profiles.find(prof => prof.id === profileId);
    if (!p) return false;
    p.is_verified = isVerified;
    p.verified_by = verifiedBy;
    p.verified_at = new Date().toISOString();
    this.save();
    return true;
  }

  bulkUpsertAdvocates(
    records: Array<{
      full_name: string;
      email?: string;
      phone?: string;
      bar_council_enrollment_no: string;
      bar_association_name?: string;
      chamber_address?: string;
      court_practice_complex?: string;
      practice_areas?: string[] | string;
      experience_years?: number | string;
      bio_hindi?: string;
      bio_english?: string;
      is_verified?: boolean | string;
    }>,
    adminId?: string
  ): { added: number; updated: number; total: number; errors: string[] } {
    const s = this.ensureLoaded();
    let added = 0;
    let updated = 0;
    const errors: string[] = [];

    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      const rowNum = i + 1;

      const fullName = (row.full_name || '').trim();
      const enrollmentNo = (row.bar_council_enrollment_no || '').trim();

      if (!fullName) {
        errors.push(`Row ${rowNum}: Advocate Name is required.`);
        continue;
      }
      if (!enrollmentNo) {
        errors.push(`Row ${rowNum}: Bar Council Enrollment Number is required for "${fullName}".`);
        continue;
      }

      // Format practice areas
      let areas: string[] = [];
      if (Array.isArray(row.practice_areas)) {
        areas = row.practice_areas.map(a => a.trim()).filter(Boolean);
      } else if (typeof row.practice_areas === 'string') {
        areas = row.practice_areas.split(',').map(a => a.trim()).filter(Boolean);
      }
      if (areas.length === 0) {
        areas = ['General Legal Practice', 'Civil & Criminal'];
      }

      const experienceYears = typeof row.experience_years === 'number' 
        ? row.experience_years 
        : (parseInt(String(row.experience_years || '5')) || 5);

      const isVerified = typeof row.is_verified === 'boolean'
        ? row.is_verified
        : (String(row.is_verified).toLowerCase() === 'true' || String(row.is_verified) === '1');

      // Sanitized email
      let email = (row.email || '').trim().toLowerCase();
      if (!email) {
        const cleanNo = enrollmentNo.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        email = `advocate.${cleanNo}@alwarbar.in`;
      }

      // Check existing profile by enrollment or user email
      const existingProfile = s.advocate_profiles.find(
        p => p.bar_council_enrollment_no.toLowerCase() === enrollmentNo.toLowerCase()
      );

      let targetUser = s.users.find(u => u.email.toLowerCase() === email);

      if (existingProfile) {
        // Update existing profile
        existingProfile.bar_council_enrollment_no = enrollmentNo;
        if (row.bar_association_name) existingProfile.bar_association_name = row.bar_association_name.trim();
        if (row.chamber_address) existingProfile.chamber_address = row.chamber_address.trim();
        if (row.court_practice_complex) existingProfile.court_practice_complex = row.court_practice_complex.trim();
        existingProfile.practice_areas = areas;
        existingProfile.experience_years = experienceYears;
        if (row.bio_hindi) existingProfile.bio_hindi = row.bio_hindi.trim();
        if (row.bio_english) existingProfile.bio_english = row.bio_english.trim();
        if (typeof row.is_verified !== 'undefined') existingProfile.is_verified = isVerified;
        existingProfile.is_publicly_listed = true;

        if (targetUser) {
          targetUser.full_name = fullName;
          if (row.phone) targetUser.phone = String(row.phone).trim();
          targetUser.updated_at = new Date().toISOString();
        }

        updated++;
      } else {
        // Create or bind user
        if (!targetUser) {
          targetUser = {
            id: 'usr-' + crypto.randomUUID(),
            email,
            password_hash: hashPassword('Advocate@2026'),
            full_name: fullName,
            role: 'registered_advocate',
            phone: row.phone ? String(row.phone).trim() : undefined,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          s.users.push(targetUser);
        } else {
          targetUser.full_name = fullName;
          if (row.phone) targetUser.phone = String(row.phone).trim();
        }

        const newProfile: AdvocateProfile = {
          id: 'prof-' + crypto.randomUUID(),
          user_id: targetUser.id,
          bar_council_enrollment_no: enrollmentNo,
          bar_association_name: (row.bar_association_name || 'District & Sessions Bar Association, Alwar').trim(),
          chamber_address: row.chamber_address ? row.chamber_address.trim() : 'District Court Complex, Alwar',
          court_practice_complex: (row.court_practice_complex || 'District & Sessions Court, Alwar').trim(),
          practice_areas: areas,
          experience_years: experienceYears,
          bio_hindi: row.bio_hindi ? row.bio_hindi.trim() : `${fullName} अलवर न्यायालय में नियमित वकालत कर रहे हैं।`,
          bio_english: row.bio_english ? row.bio_english.trim() : `Practicing advocate at District Courts Alwar specializing in ${areas.slice(0, 2).join(', ')}.`,
          is_verified: isVerified,
          verified_by: isVerified ? (adminId || 'admin-user-alwar-0001') : undefined,
          verified_at: isVerified ? new Date().toISOString() : undefined,
          is_publicly_listed: true
        };

        s.advocate_profiles.push(newProfile);
        added++;
      }
    }

    this.save();

    if (adminId) {
      this.createAuditLog({
        actor_id: adminId,
        actor_name: 'Portal Administrator',
        actor_role: 'public_admin',
        action: 'BULK_IMPORT_ADVOCATES',
        entity_type: 'advocate_profile',
        details: { added, updated, total: records.length, errorsCount: errors.length }
      });
    }

    return { added, updated, total: records.length, errors };
  }

  // --- WELFARE SCHEMES ---
  getWelfareSchemes(): WelfareScheme[] {
    return this.ensureLoaded().welfare_schemes;
  }

  createWelfareScheme(scheme: Omit<WelfareScheme, 'id' | 'created_at'>): WelfareScheme {
    const s = this.ensureLoaded();
    const newScheme: WelfareScheme = {
      ...scheme,
      id: 'welf-' + crypto.randomUUID(),
      created_at: new Date().toISOString()
    };
    s.welfare_schemes.push(newScheme);
    this.save();
    return newScheme;
  }

  updateWelfareScheme(id: string, updates: Partial<WelfareScheme>): boolean {
    const s = this.ensureLoaded();
    const idx = s.welfare_schemes.findIndex(w => w.id === id);
    if (idx === -1) return false;
    s.welfare_schemes[idx] = { ...s.welfare_schemes[idx], ...updates };
    this.save();
    return true;
  }

  deleteWelfareScheme(id: string): boolean {
    const s = this.ensureLoaded();
    const lenBefore = s.welfare_schemes.length;
    s.welfare_schemes = s.welfare_schemes.filter(w => w.id !== id);
    this.save();
    return s.welfare_schemes.length < lenBefore;
  }

  // --- WELFARE BULLETINS & LIVE UPDATES ---
  getWelfareBulletins(): WelfareBulletin[] {
    return this.ensureLoaded().welfare_bulletins || [];
  }

  createWelfareBulletin(bulletin: Omit<WelfareBulletin, 'id' | 'date'>): WelfareBulletin {
    const s = this.ensureLoaded();
    const newB: WelfareBulletin = {
      ...bulletin,
      id: 'wb-' + crypto.randomUUID(),
      date: new Date().toISOString().split('T')[0]
    };
    if (!s.welfare_bulletins) s.welfare_bulletins = [];
    s.welfare_bulletins.unshift(newB);
    this.save();
    return newB;
  }

  // --- LEGAL UPDATES & LAWS ---
  getLegalUpdates(): LegalUpdate[] {
    return this.ensureLoaded().legal_updates;
  }

  createLegalUpdate(update: Omit<LegalUpdate, 'id' | 'created_at'>): LegalUpdate {
    const s = this.ensureLoaded();
    const newUpdate: LegalUpdate = {
      ...update,
      id: 'upd-' + crypto.randomUUID(),
      created_at: new Date().toISOString()
    };
    s.legal_updates.push(newUpdate);
    this.save();
    return newUpdate;
  }

  // --- LEGAL FORMS ---
  getLegalForms(): LegalForm[] {
    return this.ensureLoaded().legal_forms;
  }

  createLegalForm(form: Omit<LegalForm, 'id' | 'created_at' | 'downloads_count'>): LegalForm {
    const s = this.ensureLoaded();
    const newForm: LegalForm = {
      ...form,
      id: 'form-' + crypto.randomUUID(),
      downloads_count: 0,
      created_at: new Date().toISOString()
    };
    s.legal_forms.push(newForm);
    this.save();
    return newForm;
  }

  incrementFormDownload(id: string): void {
    const s = this.ensureLoaded();
    const f = s.legal_forms.find(x => x.id === id);
    if (f) {
      f.downloads_count += 1;
      this.save();
    }
  }

  // --- NOTICES & EVENTS ---
  getNotices(): NoticeEvent[] {
    return this.ensureLoaded().notices_events;
  }

  createNotice(notice: Omit<NoticeEvent, 'id' | 'created_at'>): NoticeEvent {
    const s = this.ensureLoaded();
    const newNotice: NoticeEvent = {
      ...notice,
      id: 'notice-' + crypto.randomUUID(),
      created_at: new Date().toISOString()
    };
    s.notices_events.push(newNotice);
    this.save();
    return newNotice;
  }

  // --- FORUM ---
  getForumCategories(): ForumCategory[] {
    return this.ensureLoaded().forum_categories;
  }

  getForumPosts(): ForumPost[] {
    return this.ensureLoaded().forum_posts.filter(p => !p.is_hidden);
  }

  getAllForumPostsAdmin(): ForumPost[] {
    return this.ensureLoaded().forum_posts;
  }

  getForumPostById(id: string): ForumPost | undefined {
    return this.ensureLoaded().forum_posts.find(p => p.id === id);
  }

  createForumPost(post: Omit<ForumPost, 'id' | 'upvotes' | 'replies_count' | 'is_pinned' | 'is_hidden' | 'created_at'>): ForumPost {
    const s = this.ensureLoaded();
    const cat = s.forum_categories.find(c => c.id === post.category_id);
    const newPost: ForumPost = {
      ...post,
      id: 'post-' + crypto.randomUUID(),
      category_slug: cat?.slug,
      category_name_en: cat?.name_en,
      category_name_hi: cat?.name_hi,
      upvotes: 0,
      replies_count: 0,
      is_pinned: false,
      is_hidden: false,
      created_at: new Date().toISOString()
    };
    s.forum_posts.unshift(newPost);
    if (cat) cat.post_count = (cat.post_count || 0) + 1;
    this.save();
    return newPost;
  }

  getForumReplies(postId: string): ForumReply[] {
    return this.ensureLoaded().forum_replies.filter(r => r.post_id === postId);
  }

  createForumReply(reply: Omit<ForumReply, 'id' | 'is_accepted_answer' | 'upvotes' | 'created_at'>): ForumReply {
    const s = this.ensureLoaded();
    const newReply: ForumReply = {
      ...reply,
      id: 'reply-' + crypto.randomUUID(),
      is_accepted_answer: false,
      upvotes: 0,
      created_at: new Date().toISOString()
    };
    s.forum_replies.push(newReply);
    const post = s.forum_posts.find(p => p.id === reply.post_id);
    if (post) post.replies_count += 1;
    this.save();
    return newReply;
  }

  createForumReport(report: Omit<ForumReport, 'id' | 'status' | 'created_at'>): ForumReport {
    const s = this.ensureLoaded();
    const newReport: ForumReport = {
      ...report,
      id: 'rep-' + crypto.randomUUID(),
      status: 'pending',
      created_at: new Date().toISOString()
    };
    s.forum_reports.push(newReport);
    this.save();
    return newReport;
  }

  getForumReports(): ForumReport[] {
    return this.ensureLoaded().forum_reports;
  }

  updateForumReportStatus(id: string, status: 'pending' | 'reviewed' | 'dismissed'): boolean {
    const s = this.ensureLoaded();
    const r = s.forum_reports.find(x => x.id === id);
    if (!r) return false;
    r.status = status;
    this.save();
    return true;
  }

  // --- MY CASE: STRICT TENANT-ISOLATED DATA ACCESS ---

  getCases(advocateId: string): CaseRecord[] {
    const s = this.ensureLoaded();
    return s.cases
      .filter(c => c.advocate_id === advocateId)
      .map(c => ({
        ...c,
        client: s.clients.find(cl => cl.id === c.client_id)
      }));
  }

  getCaseById(advocateId: string, caseId: string): CaseRecord | undefined {
    const s = this.ensureLoaded();
    const c = s.cases.find(x => x.id === caseId && x.advocate_id === advocateId);
    if (!c) return undefined;
    return {
      ...c,
      client: s.clients.find(cl => cl.id === c.client_id)
    };
  }

  createCase(advocateId: string, caseData: Omit<CaseRecord, 'id' | 'advocate_id' | 'created_at' | 'updated_at'>): CaseRecord {
    const s = this.ensureLoaded();
    const newCase: CaseRecord = {
      ...caseData,
      id: 'case-' + crypto.randomUUID(),
      advocate_id: advocateId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    s.cases.unshift(newCase);
    this.save();
    return newCase;
  }

  updateCase(advocateId: string, caseId: string, updates: Partial<CaseRecord>): CaseRecord | null {
    const s = this.ensureLoaded();
    const idx = s.cases.findIndex(c => c.id === caseId && c.advocate_id === advocateId);
    if (idx === -1) return null;
    s.cases[idx] = {
      ...s.cases[idx],
      ...updates,
      advocate_id: advocateId, // Prevent tampering with ownership
      updated_at: new Date().toISOString()
    };
    this.save();
    return s.cases[idx];
  }

  deleteCase(advocateId: string, caseId: string): boolean {
    const s = this.ensureLoaded();
    const before = s.cases.length;
    s.cases = s.cases.filter(c => !(c.id === caseId && c.advocate_id === advocateId));
    // Also cascade delete related docs & hearings for this advocate
    s.case_documents = s.case_documents.filter(d => !(d.case_id === caseId && d.advocate_id === advocateId));
    s.case_hearings = s.case_hearings.filter(h => !(h.case_id === caseId && h.advocate_id === advocateId));
    s.tasks = s.tasks.filter(t => !(t.case_id === caseId && t.advocate_id === advocateId));
    this.save();
    return s.cases.length < before;
  }

  getCaseDocuments(advocateId: string, caseId?: string): CaseDocument[] {
    const s = this.ensureLoaded();
    return s.case_documents.filter(d => {
      if (d.advocate_id !== advocateId) return false;
      if (caseId && d.case_id !== caseId) return false;
      return true;
    });
  }

  createCaseDocument(advocateId: string, doc: Omit<CaseDocument, 'id' | 'advocate_id' | 'created_at'>): CaseDocument {
    const s = this.ensureLoaded();
    const newDoc: CaseDocument = {
      ...doc,
      id: 'doc-' + crypto.randomUUID(),
      advocate_id: advocateId,
      created_at: new Date().toISOString()
    };
    s.case_documents.push(newDoc);
    this.save();
    return newDoc;
  }

  deleteCaseDocument(advocateId: string, docId: string): boolean {
    const s = this.ensureLoaded();
    const before = s.case_documents.length;
    s.case_documents = s.case_documents.filter(d => !(d.id === docId && d.advocate_id === advocateId));
    this.save();
    return s.case_documents.length < before;
  }

  getHearings(advocateId: string): CaseHearing[] {
    const s = this.ensureLoaded();
    return s.case_hearings.filter(h => h.advocate_id === advocateId);
  }

  createHearing(advocateId: string, hearing: Omit<CaseHearing, 'id' | 'advocate_id' | 'created_at'>): CaseHearing {
    const s = this.ensureLoaded();
    const linkedCase = s.cases.find(c => c.id === hearing.case_id && c.advocate_id === advocateId);
    const newHearing: CaseHearing = {
      ...hearing,
      id: 'hrg-' + crypto.randomUUID(),
      advocate_id: advocateId,
      case_title: linkedCase?.case_title,
      created_at: new Date().toISOString()
    };
    s.case_hearings.push(newHearing);
    if (linkedCase && hearing.next_hearing_date) {
      linkedCase.next_hearing_date = hearing.next_hearing_date;
      linkedCase.updated_at = new Date().toISOString();
    }
    this.save();
    return newHearing;
  }

  getTasks(advocateId: string): CaseTask[] {
    const s = this.ensureLoaded();
    return s.tasks.filter(t => t.advocate_id === advocateId);
  }

  createTask(advocateId: string, task: Omit<CaseTask, 'id' | 'advocate_id' | 'created_at'>): CaseTask {
    const s = this.ensureLoaded();
    const linkedCase = task.case_id ? s.cases.find(c => c.id === task.case_id && c.advocate_id === advocateId) : undefined;
    const newTask: CaseTask = {
      ...task,
      id: 'tsk-' + crypto.randomUUID(),
      advocate_id: advocateId,
      case_title: linkedCase?.case_title,
      created_at: new Date().toISOString()
    };
    s.tasks.push(newTask);
    this.save();
    return newTask;
  }

  updateTaskStatus(advocateId: string, taskId: string, status: 'pending' | 'completed'): boolean {
    const s = this.ensureLoaded();
    const t = s.tasks.find(x => x.id === taskId && x.advocate_id === advocateId);
    if (!t) return false;
    t.status = status;
    this.save();
    return true;
  }

  getClients(advocateId: string): Client[] {
    const s = this.ensureLoaded();
    return s.clients.filter(c => c.advocate_id === advocateId);
  }

  createClient(advocateId: string, client: Omit<Client, 'id' | 'advocate_id' | 'created_at'>): Client {
    const s = this.ensureLoaded();
    const newClient: Client = {
      ...client,
      id: 'clt-' + crypto.randomUUID(),
      advocate_id: advocateId,
      created_at: new Date().toISOString()
    };
    s.clients.push(newClient);
    this.save();
    return newClient;
  }

  getInvoices(advocateId: string): Invoice[] {
    const s = this.ensureLoaded();
    return s.invoices.filter(i => i.advocate_id === advocateId);
  }

  createInvoice(advocateId: string, inv: Omit<Invoice, 'id' | 'advocate_id' | 'created_at'>): Invoice {
    const s = this.ensureLoaded();
    const client = s.clients.find(c => c.id === inv.client_id && c.advocate_id === advocateId);
    const linkedCase = inv.case_id ? s.cases.find(c => c.id === inv.case_id && c.advocate_id === advocateId) : undefined;
    const newInv: Invoice = {
      ...inv,
      id: 'inv-' + crypto.randomUUID(),
      advocate_id: advocateId,
      client_name: client?.full_name,
      case_title: linkedCase?.case_title,
      created_at: new Date().toISOString()
    };
    s.invoices.push(newInv);
    this.save();
    return newInv;
  }

  getDrafts(advocateId: string): LegalDraft[] {
    const s = this.ensureLoaded();
    return s.drafts.filter(d => d.advocate_id === advocateId);
  }

  createDraft(advocateId: string, draft: Omit<LegalDraft, 'id' | 'advocate_id' | 'created_at' | 'updated_at'>): LegalDraft {
    const s = this.ensureLoaded();
    const newDraft: LegalDraft = {
      ...draft,
      id: 'drf-' + crypto.randomUUID(),
      advocate_id: advocateId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    s.drafts.push(newDraft);
    this.save();
    return newDraft;
  }

  updateDraft(advocateId: string, draftId: string, content: string, title?: string): LegalDraft | null {
    const s = this.ensureLoaded();
    const d = s.drafts.find(x => x.id === draftId && x.advocate_id === advocateId);
    if (!d) return null;
    d.content_text = content;
    if (title) d.title = title;
    d.version += 1;
    d.updated_at = new Date().toISOString();
    this.save();
    return d;
  }

  getPersonalLibrary(advocateId: string): PersonalLibraryItem[] {
    const s = this.ensureLoaded();
    return s.personal_library.filter(p => p.advocate_id === advocateId);
  }

  createPersonalLibraryItem(advocateId: string, item: Omit<PersonalLibraryItem, 'id' | 'advocate_id' | 'created_at'>): PersonalLibraryItem {
    const s = this.ensureLoaded();
    const newItem: PersonalLibraryItem = {
      ...item,
      id: 'lib-' + crypto.randomUUID(),
      advocate_id: advocateId,
      created_at: new Date().toISOString()
    };
    s.personal_library.push(newItem);
    this.save();
    return newItem;
  }

  // --- MY CASE ADMIN OPERATIONAL TELEMETRY (ZERO KNOWLEDGE OF CASE CONTENTS) ---
  getMyCaseServiceTelemetry(): {
    totalAdvocates: number;
    activeTenants: number;
    totalCasesAggregate: number;
    totalDocumentsAggregate: number;
    totalStorageBytes: number;
    systemHealth: string;
  } {
    const s = this.ensureLoaded();
    const totalStorageBytes = s.case_documents.reduce((acc, d) => acc + (d.file_size_bytes || 0), 0);
    const advocates = s.users.filter(u => u.role === 'registered_advocate');

    return {
      totalAdvocates: advocates.length,
      activeTenants: advocates.filter(a => a.is_active).length,
      totalCasesAggregate: s.cases.length,
      totalDocumentsAggregate: s.case_documents.length,
      totalStorageBytes,
      systemHealth: 'OPERATIONAL'
    };
  }

  // --- AUDIT LOGS ---
  getAuditLogs(): AuditLog[] {
    return this.ensureLoaded().audit_logs;
  }

  createAuditLog(log: Omit<AuditLog, 'id' | 'created_at'>): AuditLog {
    const s = this.ensureLoaded();
    const newLog: AuditLog = {
      ...log,
      id: 'aud-' + crypto.randomUUID(),
      created_at: new Date().toISOString()
    };
    s.audit_logs.unshift(newLog);
    this.save();
    return newLog;
  }
}

// Singleton export
export const localDb = new LocalDatabase();
