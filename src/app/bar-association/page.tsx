'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/context';
import { 
  Building2, Landmark, Users, Award, BookOpen, Scale, 
  FileText, Shield, Download, Phone, Mail, MapPin, Clock, 
  CheckCircle2, ExternalLink, Calendar, Search, Trophy, 
  Coffee, Laptop, UserCheck, ChevronRight, AlertCircle, Stamp, HeartHandshake
} from 'lucide-react';

export default function BarAssociationPage() {
  const { locale } = useLanguage();
  const [activeTab, setActiveTab] = useState<'office-bearers' | 'history' | 'constitution' | 'judges' | 'senior-advocates' | 'welfare-amenities' | 'downloads'>('office-bearers');
  const [judgeSearch, setJudgeSearch] = useState('');
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  // Office Bearers Data
  const officeBearers = [
    {
      positionHi: 'अध्यक्ष (President)',
      positionEn: 'President',
      name: 'Advocate Anil Sain',
      experience: '22+ Years Practice',
      chamber: 'Chamber No. 12, Civil Wing, Alwar',
      phone: '0144-2334455 / 98290XXXXX',
      email: 'president@alwarbar.org',
      roleDescription: 'Leading Bar administrative decisions, state bar liaison, advocate protection act advocacy, and judicial coordination.'
    },
    {
      positionHi: 'उपाध्यक्ष (Vice President)',
      positionEn: 'Vice President',
      name: 'Advocate Rajesh Sharma',
      experience: '18+ Years Practice',
      chamber: 'Chamber No. 24, Criminal Wing, Alwar',
      phone: '0144-2334456',
      email: 'vp@alwarbar.org',
      roleDescription: 'Overseeing junior advocate welfare, chamber infrastructure, and dispute mediation.'
    },
    {
      positionHi: 'महासचिव (General Secretary)',
      positionEn: 'General Secretary',
      name: 'Advocate Mukesh Kumar Meena',
      experience: '16+ Years Practice',
      chamber: 'Chamber No. 18, Main Court Wing',
      phone: '0144-2334457',
      email: 'secretary@alwarbar.org',
      roleDescription: 'General Bar administration, executive meetings, daily notices, and member coordination.'
    },
    {
      positionHi: 'संयुक्त सचिव (Joint Secretary)',
      positionEn: 'Joint Secretary',
      name: 'Advocate Sunita Gupta',
      experience: '12+ Years Practice',
      chamber: 'Chamber No. 31, Family Court Wing',
      phone: '0144-2334458',
      email: 'jointsecretary@alwarbar.org',
      roleDescription: 'Cultural events, continuing legal education workshops, and women advocates wing.'
    },
    {
      positionHi: 'कोषाध्यक्ष (Treasurer)',
      positionEn: 'Treasurer',
      name: 'Advocate Dinesh Chand Yadav',
      experience: '15+ Years Practice',
      chamber: 'Chamber No. 08, Ground Floor',
      phone: '0144-2334459',
      email: 'treasurer@alwarbar.org',
      roleDescription: 'Financial accounting, bar membership fee collection, welfare fund disbursements, and annual audit.'
    },
    {
      positionHi: 'पुस्तकालय सचिव (Library Secretary)',
      positionEn: 'Library Secretary',
      name: 'Advocate Hemant Singhal',
      experience: '11+ Years Practice',
      chamber: 'Chamber No. 42, Library Block',
      phone: '0144-2334460',
      email: 'library@alwarbar.org',
      roleDescription: 'Digital e-library supervision, law reporters (AIR/SCC), bare acts procurement, and study rooms.'
    }
  ];

  // Executive Members
  const executiveMembers = [
    { name: 'Advocate Vikram Singh Choudhary', wing: 'Criminal Wing Representative', term: '2024-2026' },
    { name: 'Advocate Suman Lata Sharma', wing: 'Women Advocates Representative', term: '2024-2026' },
    { name: 'Advocate Imran Khan', wing: 'Civil & Commercial Wing', term: '2024-2026' },
    { name: 'Advocate Rameshwar Prasad Saini', wing: 'Revenue Courts & Mini Secretariat', term: '2024-2026' },
    { name: 'Advocate Arvind Kaushik', wing: 'Young Lawyers Wing (0-7 Yrs)', term: '2024-2026' },
    { name: 'Advocate Surendra Kumar Jain', wing: 'Tribunals & Motor Accident Claims', term: '2024-2026' },
  ];

  // Roll of Past Presidents
  const pastPresidents = [
    { tenure: '2022 – 2024', name: 'Advocate R. K. Sharma', tenureHighlight: 'Constructed New Digital e-Library and High-Speed Wi-Fi Zone' },
    { tenure: '2020 – 2022', name: 'Advocate Bharat Bhushan Yadav', tenureHighlight: 'Facilitated COVID-19 Advocate Relief Fund & Virtual Court Setup' },
    { tenure: '2018 – 2020', name: 'Advocate S. N. Mathur', tenureHighlight: 'Renovated Central Air-Conditioned Bar Auditorium' },
    { tenure: '2016 – 2018', name: 'Advocate Mahendra Pal Gupta', tenureHighlight: 'Established 18 Regional Tehsils Bar Mutual Aid Committee' },
    { tenure: '2014 – 2016', name: 'Advocate Govind Narayan Saxena', tenureHighlight: 'Organized Rajasthan State Level Judicial Conference at Alwar' },
    { tenure: '2012 – 2014', name: 'Advocate Devendra Kumar Sharma', tenureHighlight: 'Automated Advocate Welfare Stamp Passbook & Registry' }
  ];

  // Judicial Officers Roster (Alwar Judgeship)
  const judicialOfficers = [
    { courtName: 'District & Sessions Judge', roomNo: 'Court Room No. 1', officerName: 'Hon’ble District & Sessions Judge', jurisdiction: 'Judgeship Head, Sessions Trials, Civil Appeals, Revisions', ecourtsUrl: 'https://districts.ecourts.gov.in/alwar' },
    { courtName: 'Special Court (POCSO Act Cases No. 1)', roomNo: 'Court Room No. 2', officerName: 'Special Judge, POCSO Act', jurisdiction: 'Offences under Protection of Children from Sexual Offences Act', ecourtsUrl: 'https://districts.ecourts.gov.in/alwar' },
    { courtName: 'Special Court (SC/ST Prevention of Atrocities)', roomNo: 'Court Room No. 3', officerName: 'Special Judge, SC/ST Act', jurisdiction: 'Trials under Scheduled Castes and Scheduled Tribes Act', ecourtsUrl: 'https://districts.ecourts.gov.in/alwar' },
    { courtName: 'Family Court No. 1', roomNo: 'Court Room No. 4', officerName: 'Principal Judge, Family Court', jurisdiction: 'Matrimonial disputes, maintenance, guardianship, custody', ecourtsUrl: 'https://districts.ecourts.gov.in/alwar' },
    { courtName: 'Family Court No. 2', roomNo: 'Court Room No. 5', officerName: 'Judge, Family Court No. 2', jurisdiction: 'Domestic relations, divorce petitions, Hindu Marriage Act', ecourtsUrl: 'https://districts.ecourts.gov.in/alwar' },
    { courtName: 'Motor Accident Claims Tribunal (MACT)', roomNo: 'Court Room No. 6', officerName: 'Judge, MACT Alwar', jurisdiction: 'Motor vehicle compensation claims and insurance matters', ecourtsUrl: 'https://districts.ecourts.gov.in/alwar' },
    { courtName: 'Commercial Court, Alwar', roomNo: 'Court Room No. 7', officerName: 'Judge, Commercial Court', jurisdiction: 'Commercial disputes, contracts, arbitration enforcement', ecourtsUrl: 'https://districts.ecourts.gov.in/alwar' },
    { courtName: 'Additional District & Sessions Judge No. 1', roomNo: 'Court Room No. 8', officerName: 'ADJ Court No. 1', jurisdiction: 'Sessions trials, criminal appeals, civil suits above threshold', ecourtsUrl: 'https://districts.ecourts.gov.in/alwar' },
    { courtName: 'Additional District & Sessions Judge No. 2', roomNo: 'Court Room No. 9', officerName: 'ADJ Court No. 2', jurisdiction: 'Civil appeals, NDPS trials, bail applications', ecourtsUrl: 'https://districts.ecourts.gov.in/alwar' },
    { courtName: 'Additional District & Sessions Judge No. 3', roomNo: 'Court Room No. 10', officerName: 'ADJ Court No. 3', jurisdiction: 'Special criminal trials, civil original jurisdiction', ecourtsUrl: 'https://districts.ecourts.gov.in/alwar' },
    { courtName: 'Chief Judicial Magistrate (CJM)', roomNo: 'Court Room No. 11', officerName: 'CJM Alwar', jurisdiction: 'Judicial magistrate superintendence, remand, police investigations', ecourtsUrl: 'https://districts.ecourts.gov.in/alwar' },
    { courtName: 'Additional Chief Judicial Magistrate No. 1', roomNo: 'Court Room No. 12', officerName: 'ACJM Court No. 1', jurisdiction: 'Criminal trial, Section 138 NI Act, CrPC inquiries', ecourtsUrl: 'https://districts.ecourts.gov.in/alwar' },
    { courtName: 'Additional Chief Judicial Magistrate No. 2', roomNo: 'Court Room No. 13', officerName: 'ACJM Court No. 2', jurisdiction: 'Criminal trial, cyber crime, IPC/BNS matters', ecourtsUrl: 'https://districts.ecourts.gov.in/alwar' },
    { courtName: 'Civil Judge & Judicial Magistrate No. 1', roomNo: 'Court Room No. 14', officerName: 'Civil Judge & JM No. 1', jurisdiction: 'Civil suits, injunctions, rent control, summary trials', ecourtsUrl: 'https://districts.ecourts.gov.in/alwar' }
  ];

  // Bar Association Downloads
  const barDownloads = [
    {
      id: 'alwar-bar-membership-form',
      titleEn: 'Bar Association Membership Application Form',
      titleHi: 'अलवर जिला बार एसोसिएशन नवीन सदस्यता आवेदन प्रपत्र',
      category: 'Membership',
      fileSize: '245 KB (PDF/DOCX)',
      description: 'Prescribed statutory form for newly enrolled advocates to apply for ordinary or life membership of District & Sessions Bar Association Alwar.',
      fileName: 'Alwar_Bar_Membership_Application_Form_2026.docx'
    },
    {
      id: 'alwar-bar-standard-vakalatnama',
      titleEn: 'Standard Alwar Bar Vakalatnama Form',
      titleHi: 'अलवर जिला एवं सत्र न्यायालय अधिकृत वकालतनामा प्रपत्र',
      category: 'Court Form',
      fileSize: '180 KB (Bilingual Format)',
      description: 'Standard court-accepted Vakalatnama with welfare stamp docket, advocate registration details, and client declaration.',
      fileName: 'Alwar_District_Court_Standard_Vakalatnama_Bilingual.docx'
    },
    {
      id: 'alwar-bar-vehicle-sticker',
      titleEn: 'Advocate Vehicle Parking Sticker Application Form',
      titleHi: 'अधिवक्ता वाहन पार्किंग स्टीकर आवेदन प्रपत्र',
      category: 'Parking & Security',
      fileSize: '150 KB (PDF/DOCX)',
      description: 'Official application for high-security barcode vehicle sticker for authorized entry into District Court parking zones.',
      fileName: 'Alwar_Bar_Vehicle_Sticker_Application.docx'
    },
    {
      id: 'alwar-bar-chamber-allotment',
      titleEn: 'Chamber Allotment & Transfer Form',
      titleHi: 'अधिवक्ता चैंबर आवंटन एवं हस्तांतरण आवेदन प्रपत्र',
      category: 'Chamber Committee',
      fileSize: '210 KB (PDF/DOCX)',
      description: 'Application for allocation of chamber cubicle in the Civil or Criminal Wings under Bar Chamber Allotment Rules.',
      fileName: 'Alwar_Bar_Chamber_Allocation_Rules_Form.docx'
    },
    {
      id: 'alwar-bar-no-dues-certificate',
      titleEn: 'Bar Association No-Dues Application Form',
      titleHi: 'बार एसोसिएशन अदेयता प्रमाण पत्र (No-Dues) आवेदन',
      category: 'Clearance',
      fileSize: '120 KB (PDF/DOCX)',
      description: 'Clearance certificate required for judicial service examinations (RJS/ADJ), notary appointments, or inter-bar transfer.',
      fileName: 'Alwar_Bar_No_Dues_Clearance_Form.docx'
    },
    {
      id: 'alwar-bar-constitution-pdf',
      titleEn: 'Constitution & By-Laws of District Bar Association Alwar',
      titleHi: 'अलवर जिला बार एसोसिएशन संविधान एवं उप-नियम (पूरी नियमावली)',
      category: 'Constitution',
      fileSize: '540 KB (Full Text PDF)',
      description: 'Complete official Constitution, election rules, One Bar One Vote code, disciplinary proceedings, and general body procedures.',
      fileName: 'Alwar_Bar_Association_Constitution_Rules_Full.docx'
    },
    {
      id: 'alwar-bar-welfare-trust-nomination',
      titleEn: 'Bar Mutual Welfare Trust Nomination Form (Form C)',
      titleHi: 'अधिवक्ता कल्याण न्यास नॉमिनी घोषणा प्रपत्र (फॉर्म "सी")',
      category: 'Welfare',
      fileSize: '165 KB (PDF/DOCX)',
      description: 'Statutory declaration of nominee for death benefits and emergency medical ex-gratia assistance under Alwar Bar Trust.',
      fileName: 'Alwar_Bar_Welfare_Trust_Nomination_Form_C.docx'
    },
    {
      id: 'alwar-bar-annual-audit-report',
      titleEn: 'Annual Financial Audit Report & Balance Sheet',
      titleHi: 'बार एसोसिएशन वार्षिक ऑडिट रिपोर्ट एवं आय-व्यय विवरण',
      category: 'Accounts',
      fileSize: '410 KB (Audited Report)',
      description: 'Statutory chartered accountant audited financial statements, revenue from welfare tickets, library fund, and member fees.',
      fileName: 'Alwar_Bar_Annual_Audit_Report_Balance_Sheet.docx'
    }
  ];

  const handleDownloadFile = (doc: typeof barDownloads[0]) => {
    // Generate text/docx simulation
    const content = `================================================================================
DISTRICT & SESSIONS BAR ASSOCIATION, ALWAR (RAJASTHAN)
Est. 1948 • Court Complex, Station Road, Alwar - 301001
Official Web Portal: http://localhost:3001/bar-association
================================================================================

DOCUMENT TITLE: ${doc.titleEn.toUpperCase()}
(${doc.titleHi})

CATEGORY: ${doc.category}
DATE GENERATED: ${new Date().toLocaleDateString('hi-IN')}

PRESCRIBED FORM INSTRUCTIONS:
${doc.description}

--------------------------------------------------------------------------------
PARTICULARS OF APPLICANT ADVOCATE:
1. Full Name of Advocate: ____________________________________________________
2. Father's / Husband's Name: ________________________________________________
3. Bar Council of Rajasthan Enrolment No: R / ______ / ________
4. Alwar Bar Association Registration No: ALW / ______ / ________
5. Permanent Residential Address: ____________________________________________
6. Chamber / Office Address at Alwar: ________________________________________
7. Contact Mobile No: ____________________ Email: ___________________________
8. Blood Group: ______ Emergency Contact Person: _____________________________

DECLARATION & VERIFICATION:
I hereby solemnly declare that I am an enrolled practicing advocate on the live roll 
of the Bar Council of Rajasthan and actively practicing at District & Sessions Court, 
Alwar and its affiliated 18 sub-divisional courts. All details submitted herein are 
true and correct to the best of my knowledge.

Date: ____________________
Place: Alwar (Rajasthan)

Signature of Advocate: ________________________

--------------------------------------------------------------------------------
FOR OFFICE USE ONLY (DISTRICT & SESSIONS BAR ASSOCIATION, ALWAR):
Verification by Scrutiny Committee: [ APPROVED / PENDING / REJECTED ]
Receipt No: ________________________ Prescribed Fee: _________________________
President Signature: __________________ General Secretary Signature: __________
Office Seal & Stamp:
================================================================================`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = doc.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setDownloadSuccess(doc.titleHi);
    setTimeout(() => setDownloadSuccess(null), 4000);
  };

  const filteredJudges = judicialOfficers.filter(j => 
    j.courtName.toLowerCase().includes(judgeSearch.toLowerCase()) ||
    j.officerName.toLowerCase().includes(judgeSearch.toLowerCase()) ||
    j.jurisdiction.toLowerCase().includes(judgeSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      
      {/* 1. HERO & BRANDING BANNER */}
      <div className="bg-gradient-to-r from-legal-navyDark via-legal-navy to-legal-navyLight text-white py-12 px-4 border-b border-legal-gold/30">
        <div className="container mx-auto max-w-6xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center text-white shadow-xl font-serif font-bold text-3xl border border-amber-400/40">
                अ
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 px-3 py-1 rounded-full border border-amber-400/30">
                  Apex District Bar Association • Matsya Region
                </span>
                <h1 className="font-serif font-extrabold text-2xl sm:text-4xl text-white mt-1 leading-tight">
                  जिला एवं सत्र बार एसोसिएशन, अलवर
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 font-light mt-0.5">
                  District & Sessions Bar Association, Alwar (Est. 1948) — न्याय, गरिमा, विधिक स्वावलंबन एवं अधिवक्ता कल्याण
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 text-xs">
              <div className="bg-white/10 px-3.5 py-2 rounded-xl border border-white/20 text-slate-200 space-y-0.5 text-right sm:text-left">
                <div className="text-[10px] text-amber-300 uppercase font-semibold">बार कार्यालय हेल्पलाइन:</div>
                <div className="font-mono font-bold text-white flex items-center space-x-1.5">
                  <Phone className="w-3.5 h-3.5 text-amber-400" />
                  <span>0144-2334455 / 2334456</span>
                </div>
              </div>
              <Link
                href="/advocates"
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl transition shadow flex items-center space-x-1.5"
              >
                <Users className="w-4 h-4" />
                <span>अधिवक्ता डायरेक्टरी (1100+)</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 2. SUB-NAVIGATION TABS (Matches Jaipur Bar & RHCBA Navigation Options) */}
      <div className="bg-[#0b172a] text-white border-b border-slate-800 sticky top-14 z-40 shadow-lg">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto text-xs uppercase font-bold tracking-wider py-1.5 scrollbar-none">
            
            <button
              onClick={() => setActiveTab('office-bearers')}
              className={`px-3.5 py-2.5 rounded-lg transition whitespace-nowrap flex items-center space-x-1.5 ${
                activeTab === 'office-bearers'
                  ? 'bg-amber-500 text-slate-950 font-extrabold shadow'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>कार्यकारिणी व पदाधिकारी</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`px-3.5 py-2.5 rounded-lg transition whitespace-nowrap flex items-center space-x-1.5 ${
                activeTab === 'history'
                  ? 'bg-amber-500 text-slate-950 font-extrabold shadow'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Landmark className="w-4 h-4" />
              <span>अलवर बार का इतिहास</span>
            </button>

            <button
              onClick={() => setActiveTab('constitution')}
              className={`px-3.5 py-2.5 rounded-lg transition whitespace-nowrap flex items-center space-x-1.5 ${
                activeTab === 'constitution'
                  ? 'bg-amber-500 text-slate-950 font-extrabold shadow'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>संविधान एवं नियमावली</span>
            </button>

            <button
              onClick={() => setActiveTab('judges')}
              className={`px-3.5 py-2.5 rounded-lg transition whitespace-nowrap flex items-center space-x-1.5 ${
                activeTab === 'judges'
                  ? 'bg-amber-500 text-slate-950 font-extrabold shadow'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Scale className="w-4 h-4" />
              <span>न्यायिक अधिकारी रोस्टर</span>
            </button>

            <button
              onClick={() => setActiveTab('senior-advocates')}
              className={`px-3.5 py-2.5 rounded-lg transition whitespace-nowrap flex items-center space-x-1.5 ${
                activeTab === 'senior-advocates'
                  ? 'bg-amber-500 text-slate-950 font-extrabold shadow'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>वरिष्ठ अधिवक्ता एवं BCR</span>
            </button>

            <button
              onClick={() => setActiveTab('welfare-amenities')}
              className={`px-3.5 py-2.5 rounded-lg transition whitespace-nowrap flex items-center space-x-1.5 ${
                activeTab === 'welfare-amenities'
                  ? 'bg-amber-500 text-slate-950 font-extrabold shadow'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>कल्याण, ई-लाइब्रेरी व खेल</span>
            </button>

            <button
              onClick={() => setActiveTab('downloads')}
              className={`px-3.5 py-2.5 rounded-lg transition whitespace-nowrap flex items-center space-x-1.5 ${
                activeTab === 'downloads'
                  ? 'bg-amber-500 text-slate-950 font-extrabold shadow'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Download className="w-4 h-4" />
              <span>डाउनलोड केंद्र (8 प्रपत्र)</span>
            </button>

          </div>
        </div>
      </div>

      {/* SUCCESS TOAST FOR DOWNLOAD */}
      {downloadSuccess && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-700 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-2 text-xs font-semibold animate-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          <span>सफलतापूर्वक डाउनलोड प्रारंभ: {downloadSuccess}</span>
        </div>
      )}

      {/* 3. MAIN CONTENT CONTAINER */}
      <div className="container mx-auto max-w-6xl px-4 py-8">

        {/* ========================================================================= */}
        {/* TAB 1: OFFICE BEARERS & EXECUTIVE COMMITTEE (Matches Jaipur Bar & RHCBA) */}
        {/* ========================================================================= */}
        {activeTab === 'office-bearers' && (
          <div className="space-y-10">
            
            {/* President & Secretary Message Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* President Message */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-bl-full pointer-events-none" />
                <div className="flex items-start space-x-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-600 to-amber-800 text-white flex items-center justify-center font-serif font-bold text-2xl shadow shrink-0">
                    अ.सै
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                      President Message • अध्यक्षीय संदेश
                    </span>
                    <h2 className="font-serif font-bold text-lg text-slate-900 mt-1">
                      Advocate Anil Sain
                    </h2>
                    <p className="text-xs text-slate-500">
                      अध्यक्ष, जिला एवं सत्र बार एसोसिएशन, अलवर
                    </p>
                  </div>
                </div>

                <div className="text-xs text-slate-700 leading-relaxed space-y-2 border-t pt-3 border-slate-100">
                  <p>
                    "प्रिय विद्वान अधिवक्ता साथियों, अलवर बार एसोसिएशन का इतिहास न्याय, निष्ठा और विधिक गरिमा का अनुपम प्रतीक है। हमारा संकल्प है कि युवा अधिवक्ताओं को मजबूत संबल, सीनियर साथियों को सम्मान, और न्यायालय परिसर में आधुनिक ई-लाइब्रेरी, वातानुकूलित चैंबर्स व पारदर्शी कल्याण योजनाओं का लाभ मिले।"
                  </p>
                  <p className="font-medium text-amber-900">
                    "अधिवक्ता सुरक्षा कानून (Advocate Protection Act) का कड़ाई से क्रियान्वयन और 18 तहसीलों के बार संघों का आपसी समन्वय हमारी सर्वोच्च प्राथमिकता है।"
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 text-[11px] text-slate-400">
                  <span>चैंबर नं. 12, सिविल विंग, अलवर</span>
                  <span className="font-mono text-amber-800 font-semibold">फोन: 0144-2334455</span>
                </div>
              </div>

              {/* General Secretary Message */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-bl-full pointer-events-none" />
                <div className="flex items-start space-x-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 text-white flex items-center justify-center font-serif font-bold text-2xl shadow shrink-0">
                    म.मी
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                      General Secretary Message • महासचिव संदेश
                    </span>
                    <h2 className="font-serif font-bold text-lg text-slate-900 mt-1">
                      Advocate Mukesh Kumar Meena
                    </h2>
                    <p className="text-xs text-slate-500">
                      महासचिव, जिला एवं सत्र बार एसोसिएशन, अलवर
                    </p>
                  </div>
                </div>

                <div className="text-xs text-slate-700 leading-relaxed space-y-2 border-t pt-3 border-slate-100">
                  <p>
                    "अलवर बार एसोसिएशन के सभी सम्मानित सदस्यों के दैनिक विधिक कार्यों को सुगम बनाने हेतु यह डिजिटल पोर्टल व हेल्पलाइन समर्पित है। कॉज लिस्ट, ई-फाइलिंग, नए आपराधिक कानूनों (BNS/BNSS) की कार्यशालाएं, और बार रूम सुविधाओं का निरंतर उन्नयन किया जा रहा है।"
                  </p>
                  <p className="font-medium text-blue-900">
                    "किसी भी साथी को विधिक, प्रशासनिक अथवा कल्याण कोष संबंधी समस्या हो, बार कार्यालय सदैव आपके सहयोग के लिए तत्पर है।"
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 text-[11px] text-slate-400">
                  <span>चैंबर नं. 18, मुख्य विंग, अलवर</span>
                  <span className="font-mono text-blue-800 font-semibold">फोन: 0144-2334457</span>
                </div>
              </div>

            </div>

            {/* List of Main Office Bearers */}
            <div className="space-y-4">
              <div className="border-b pb-3 border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="font-serif font-bold text-xl text-slate-900">
                    वर्तमान कार्यकारिणी पदाधिकारी (Executive Office Bearers 2024–2026)
                  </h3>
                  <p className="text-xs text-slate-500">
                    अलवर जिला एवं सत्र बार एसोसिएशन के निर्वाचित प्रमुख पदाधिकारी
                  </p>
                </div>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  Active Tenure
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {officeBearers.map((ob, idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded-xl border border-slate-200 hover:border-amber-400 p-5 shadow-sm hover:shadow-md transition space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        {ob.positionHi}
                      </span>
                      <h4 className="font-serif font-bold text-base text-slate-900">
                        {ob.name}
                      </h4>
                      <p className="text-xs text-slate-600 leading-snug">
                        {ob.roleDescription}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
                      <div className="flex items-center space-x-1.5">
                        <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span className="truncate">{ob.chamber}</span>
                      </div>
                      <div className="flex items-center space-x-1.5 font-mono">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{ob.phone}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Executive Committee Members (Wing Representatives) */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <h3 className="font-serif font-bold text-lg text-slate-900 flex items-center space-x-2">
                <Users className="w-5 h-5 text-amber-600" />
                <span>कार्यकारिणी सदस्यगण (Executive Committee Members)</span>
              </h3>
              <p className="text-xs text-slate-500">
                विभिन्न न्यायालयी विंग्स एवं युवा/महिला अधिवक्ताओं के अधिकृत प्रतिनिधि
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                {executiveMembers.map((m, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-900">{m.name}</div>
                      <div className="text-[11px] text-slate-500">{m.wing}</div>
                    </div>
                    <span className="text-[10px] font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-600">
                      {m.term}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Roll of Past Presidents (Roll of Honour - पूर्व अध्यक्षों की नामावली) */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b pb-3 border-slate-200">
                <div>
                  <h3 className="font-serif font-bold text-lg text-slate-900 flex items-center space-x-2">
                    <Award className="w-5 h-5 text-amber-600" />
                    <span>पूर्व अध्यक्षों की गौरवशाली नामावली (Roll of Past Presidents)</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    अलवर बार एसोसिएशन के विकास में ऐतिहासिक योगदान देने वाले पूर्व अध्यक्षगण
                  </p>
                </div>
                <span className="text-xs text-amber-800 font-semibold font-mono">
                  1948 – वर्तमान
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {pastPresidents.map((p, idx) => (
                  <div key={idx} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div className="flex items-center space-x-3">
                      <span className="w-24 shrink-0 font-mono font-bold text-amber-800 bg-amber-50 px-2 py-1 rounded text-center border border-amber-200">
                        {p.tenure}
                      </span>
                      <span className="font-serif font-bold text-sm text-slate-900">
                        {p.name}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-600 italic">
                      "{p.tenureHighlight}"
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: ALWAR BAR HISTORY & HERITAGE (Matches Jaipur Bar History) */}
        {/* ========================================================================= */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-8 text-xs text-slate-700 leading-relaxed">
            
            <div className="border-b pb-4 border-slate-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                Heritage & Legacy of Matsya Region
              </span>
              <h2 className="font-serif font-bold text-2xl text-slate-900 mt-2">
                अलवर जिला एवं सत्र बार एसोसिएशन का गौरवशाली इतिहास
              </h2>
              <p className="text-slate-500 text-xs mt-1">
                स्वतंत्रता संग्राम से लेकर आधुनिक ई-कोर्ट युग तक न्याय और जनसेवा की अनूठी 75+ वर्षों की गाथा
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div className="md:col-span-2 space-y-4">
                <h3 className="font-serif font-bold text-base text-slate-900">
                  1. 1948 में मत्स्य संघ एवं जिला न्यायपालिका का गठन
                </h3>
                <p>
                  18 मार्च 1948 को जब अलवर, भरतपुर, धौलपुर और करौली रियासतों को मिलाकर ऐतिहासिक <strong>मत्स्य संघ (Matsya Union)</strong> का गठन हुआ, तब अलवर को विधिक और प्रशासनिक केंद्र के रूप में मान्यता प्राप्त हुई। इसी ऐतिहासिक पृष्ठभूमि में अलवर जिला एवं सत्र न्यायालय की विधिवत स्थापना हुई और अलवर बार एसोसिएशन का जन्म हुआ।
                </p>
                <p>
                  रियासतकालीन 'इजलास खास' और दीवानी अदालतों की पुरानी परंपराओं को त्यागकर भारतीय संविधान के मूल्यों पर आधारित एक स्वतंत्र, सशक्त और जागरूक अधिवक्ता समुदाय ने यहाँ वकालत प्रारंभ की।
                </p>

                <h3 className="font-serif font-bold text-base text-slate-900 pt-3 border-t border-slate-100">
                  2. 18 अधीनस्थ बार संघों का मातृ संगठन (Apex Bar of 18 Tehsils)
                </h3>
                <p>
                  अलवर बार एसोसिएशन केवल जिला मुख्यालय तक सीमित नहीं है, बल्कि यह जिले की समस्त 18 उपखंडीय एवं तहसील बार एसोसिएशनों (बहरोड़, तिजारा, किशनगढ़ बास, राजगढ़, लक्ष्मणगढ़, कठूमर, बानसूर, थानागाजी, रामगढ़, खैरथल, कोटकासिम, मुंडावर, नीमराणा, मालाखेड़ा, टपूकड़ा, गोविंदगढ़, रैणी आदि) का संरक्षक एवं शीर्ष मातृ संगठन है।
                </p>
                <p>
                  बार काउंसिल ऑफ राजस्थान के साथ मिलकर यह एसोसिएशन अधिवक्ताओं के अधिकारों, न्यायिक सुधारों तथा राजस्थान अधिवक्ता कल्याण कोष के पारदर्शी संचालन में अग्रणी भूमिका निभाती रही है।
                </p>

                <h3 className="font-serif font-bold text-base text-slate-900 pt-3 border-t border-slate-100">
                  3. ऐतिहासिक न्यायालय भवन एवं स्वतंत्रता सेनानी अधिवक्ता
                </h3>
                <p>
                  स्टेशन रोड पर स्थित अलवर जिला न्यायालय का ऐतिहासिक लाल पत्थर का भवन अपनी स्थापत्य कला और न्याय के मंदिर के रूप में प्रसिद्ध है। इस बार से ऐसे अनेक मूर्धन्य अधिवक्ता साथी हुए हैं जिन्होंने न केवल राजस्थान उच्च न्यायालय एवं भारत के सर्वोच्च न्यायालय में अलवर का नाम रोशन किया, बल्कि संविधान सभा, स्वतंत्रता आंदोलन और राजस्थान विधानसभा में भी ऐतिहासिक योगदान दिया।
                </p>
              </div>

              {/* Side Highlights Card */}
              <div className="space-y-4">
                <div className="bg-legal-navy text-white p-5 rounded-2xl shadow-md space-y-3">
                  <h4 className="font-serif font-bold text-sm text-amber-300 flex items-center space-x-1.5">
                    <Landmark className="w-4 h-4" />
                    <span>ऐतिहासिक प्रमुख तथ्य</span>
                  </h4>
                  <ul className="space-y-2 text-[11px] text-slate-300">
                    <li className="flex items-start space-x-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span>स्थापना वर्ष: <strong>1948 (मत्स्य संघ काल)</strong></span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span>पंजीकृत सदस्य संख्या: <strong>1,100+ नियमित अधिवक्ता</strong></span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span>संबद्ध तहसील बार संघ: <strong>18 उपखंडीय न्यायालय</strong></span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span>बार भवन: <strong>कोर्ट कैंपस, स्टेशन रोड, अलवर</strong></span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span>ई-लाइब्रेरी ग्रंथालय: <strong>10,000+ विधि पुस्तकें व जर्नल्स</strong></span>
                    </li>
                  </ul>
                </div>

                <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl text-xs text-amber-900 space-y-2">
                  <div className="font-bold flex items-center space-x-1">
                    <Scale className="w-4 h-4 text-amber-700" />
                    <span>अलवर बार का आदर्श वाक्य</span>
                  </div>
                  <p className="italic text-[11px] leading-relaxed text-slate-700">
                    "सत्यमेव जयते नानृतम् — निष्पक्ष न्याय, निर्भीक वकालत, एवं मुवक्किल के संवैधानिक अधिकारों की रक्षा।"
                  </p>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: CONSTITUTION & BY-LAWS (Matches Jaipur Bar Constitution) */}
        {/* ========================================================================= */}
        {activeTab === 'constitution' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-6 text-xs text-slate-700 leading-relaxed">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-4 border-slate-200 gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Statutory Constitution & By-Laws
                </span>
                <h2 className="font-serif font-bold text-2xl text-slate-900 mt-1">
                  बार एसोसिएशन अलवर का संविधान एवं उप-नियम
                </h2>
                <p className="text-slate-500 text-xs">
                  The Constitution, Enrolment Rules, One Bar One Vote Policy & Code of Professional Ethics
                </p>
              </div>

              <button
                onClick={() => handleDownloadFile(barDownloads.find(d => d.id === 'alwar-bar-constitution-pdf')!)}
                className="px-4 py-2 bg-legal-navy hover:bg-slate-800 text-amber-300 font-bold rounded-xl transition flex items-center space-x-1.5 shrink-0 shadow text-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>संविधान PDF डाउनलोड करें</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Clause 1 & 2 */}
              <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="font-serif font-bold text-sm text-slate-900 flex items-center space-x-2">
                  <span className="w-6 h-6 rounded-full bg-amber-600 text-white flex items-center justify-center text-xs">1</span>
                  <span>संज्ञा, क्षेत्र एवं उद्देश्य (Name & Objectives)</span>
                </div>
                <p className="text-[11px] text-slate-600">
                  इस संस्था का नाम <strong>"जिला एवं सत्र बार एसोसिएशन, अलवर"</strong> है। इसका मुख्य उद्देश्य न्याय प्रशासन में सहयोग, अधिवक्ताओं के पेशेवर सम्मान व अधिकारों का संरक्षण, कमजोर वर्गों को निःशुल्क विधिक सहायता, और विधि शिक्षा का प्रसार है।
                </p>
              </div>

              {/* Clause 3 */}
              <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="font-serif font-bold text-sm text-slate-900 flex items-center space-x-2">
                  <span className="w-6 h-6 rounded-full bg-amber-600 text-white flex items-center justify-center text-xs">2</span>
                  <span>सदस्यता पात्रता एवं श्रेणियां (Membership Categories)</span>
                </div>
                <p className="text-[11px] text-slate-600">
                  बार काउंसिल ऑफ राजस्थान में पंजीकृत कोई भी अधिवक्ता, जो अलवर न्यायक्षेत्र में नियमित वकालत कर रहा हो, साधारण सदस्य बन सकता है। इसके अतिरिक्त आजीवन सदस्यता (Life Member) एवं मानद सदस्यता (Honorary Member) का भी विधान है।
                </p>
              </div>

              {/* Clause 4 */}
              <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="font-serif font-bold text-sm text-slate-900 flex items-center space-x-2">
                  <span className="w-6 h-6 rounded-full bg-amber-600 text-white flex items-center justify-center text-xs">3</span>
                  <span>'एक बार - एक वोट' नीति एवं चुनाव (One Bar One Vote)</span>
                </div>
                <p className="text-[11px] text-slate-600">
                  सुप्रीम कोर्ट के निर्देशानुसार कोई भी अधिवक्ता राजस्थान में केवल एक ही बार एसोसिएशन में मताधिकार का प्रयोग कर सकता है। वार्षिक चुनाव हेतु एक स्वतंत्र मुख्य चुनाव अधिकारी एवं समिति नियुक्त की जाती है जो निष्पक्ष बैलेट प्रक्रिया सुनिश्चित करती है।
                </p>
              </div>

              {/* Clause 5 */}
              <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="font-serif font-bold text-sm text-slate-900 flex items-center space-x-2">
                  <span className="w-6 h-6 rounded-full bg-amber-600 text-white flex items-center justify-center text-xs">4</span>
                  <span>आचार संहिता एवं अनुशासन समिति (Ethics & Discipline)</span>
                </div>
                <p className="text-[11px] text-slate-600">
                  अधिवक्ताओं के परस्पर अथवा न्यायालय के प्रति अमर्यादित आचरण की शिकायतों के निवारण हेतु 5 वरिष्ठ अधिवक्ताओं की एक स्वतंत्र अनुशासन समिति गठित होती है, जो निष्पक्ष जांच उपरांत कार्यकारिणी को रिपोर्ट प्रस्तुत करती है।
                </p>
              </div>

              {/* Clause 6 */}
              <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="font-serif font-bold text-sm text-slate-900 flex items-center space-x-2">
                  <span className="w-6 h-6 rounded-full bg-amber-600 text-white flex items-center justify-center text-xs">5</span>
                  <span>चैंबर आवंटन एवं पार्किंग नीति (Chambers & Facilities)</span>
                </div>
                <p className="text-[11px] text-slate-600">
                  न्यायालय परिसर में चैंबर्स का आवंटन केवल वरिष्ठता एवं नियमित वकालत की निरंतरता के आधार पर 'चैंबर आवंटन समिति' द्वारा किया जाता है। चैंबर की सब-लेटिंग पूर्णतः प्रतिबंधित है।
                </p>
              </div>

              {/* Clause 7 */}
              <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="font-serif font-bold text-sm text-slate-900 flex items-center space-x-2">
                  <span className="w-6 h-6 rounded-full bg-amber-600 text-white flex items-center justify-center text-xs">6</span>
                  <span>वार्षिक आम सभा एवं ऑडिट (AGM & Financial Audit)</span>
                </div>
                <p className="text-[11px] text-slate-600">
                  प्रत्येक वित्तीय वर्ष के समापन पर साधारण सभा (General Body) की बैठक आयोजित कर चार्टर्ड अकाउंटेंट द्वारा परीक्षित वार्षिक आय-व्यय लेखा (Balance Sheet) प्रस्तुत किया जाना अनिवार्य है।
                </p>
              </div>

            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: JUDICIAL OFFICERS ROSTER (Matches RHCBA High Court Judges) */}
        {/* ========================================================================= */}
        {activeTab === 'judges' && (
          <div className="space-y-6">
            
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                  Judgeship Roster • Alwar District Courts
                </span>
                <h2 className="font-serif font-bold text-2xl text-slate-900 mt-1">
                  अलवर न्यायक्षेत्र के पीठासीन न्यायिक अधिकारी
                </h2>
                <p className="text-slate-500 text-xs">
                  District & Sessions Judge, Special Courts (POCSO/SC-ST), ADJ, Family, CJM & JM Courts
                </p>
              </div>

              <div className="relative w-full md:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={judgeSearch}
                  onChange={e => setJudgeSearch(e.target.value)}
                  placeholder="अदालत अथवा कोर्ट रूम खोजें..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/80 text-slate-700 font-bold uppercase text-[11px] border-b border-slate-200">
                    <tr>
                      <th className="px-5 py-3.5">न्यायालय का नाम (Court Name)</th>
                      <th className="px-4 py-3.5">कोर्ट रूम सं.</th>
                      <th className="px-4 py-3.5">पीठासीन अधिकारी</th>
                      <th className="px-4 py-3.5">विधिक क्षेत्राधिकार (Jurisdiction)</th>
                      <th className="px-4 py-3.5 text-right">ई-कोर्ट कॉज लिस्ट</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredJudges.map((j, idx) => (
                      <tr key={idx} className="hover:bg-amber-50/40 transition">
                        <td className="px-5 py-3 font-semibold text-slate-900">
                          {j.courtName}
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-amber-800 whitespace-nowrap">
                          {j.roomNo}
                        </td>
                        <td className="px-4 py-3 text-slate-800">
                          {j.officerName}
                        </td>
                        <td className="px-4 py-3 text-slate-600 text-[11px]">
                          {j.jurisdiction}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <a
                            href={j.ecourtsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-1 text-amber-800 hover:text-amber-950 font-semibold text-[11px] bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-lg border border-amber-200 transition"
                          >
                            <span>Cause List</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-blue-700 shrink-0" />
                <span>
                  <strong>ई-कोर्ट्स वाद सूची:</strong> जिला एवं सत्र न्यायालय अलवर की दैनिक कॉज लिस्ट व केस स्टेटस की लाइव जानकारी सीधे डिस्ट्रिक्ट कोर्ट पोर्टल पर उपलब्ध है।
                </span>
              </div>
              <a
                href="https://districts.ecourts.gov.in/alwar"
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-bold text-xs transition"
              >
                अलवर ई-कोर्ट्स खोलें ↗
              </a>
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: SENIOR ADVOCATES & BCR MEMBERS (Matches RHCBA Senior Adv & BCR) */}
        {/* ========================================================================= */}
        {activeTab === 'senior-advocates' && (
          <div className="space-y-8">
            
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                Eminent Jurists & Statutory Council
              </span>
              <h2 className="font-serif font-bold text-2xl text-slate-900 mt-1">
                वरिष्ठ अधिवक्ता एवं बार काउंसिल ऑफ राजस्थान में अलवर का प्रतिनिधित्व
              </h2>
              <p className="text-slate-500 text-xs">
                अलवर न्यायक्षेत्र के वरिष्ठतम अधिवक्तागण एवं राज्य विधिक परिषद (BCR Jodhpur) में प्रतिनिधित्व
              </p>
            </div>

            {/* Senior Advocates Roster */}
            <div className="space-y-4">
              <h3 className="font-serif font-bold text-lg text-slate-900 flex items-center space-x-2">
                <Award className="w-5 h-5 text-amber-600" />
                <span>ख्यातिनाम वरिष्ठ अधिवक्तागण (Designated & Senior Advocates of Alwar)</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {[
                  { name: 'Senior Advocate R. P. Sharma', standing: '42+ वर्ष निरंतर वकालत', specialty: 'दीवानी, राजस्व एवं संवैधानिक मामले', chamber: 'Chamber 01, Senior Block' },
                  { name: 'Senior Advocate B. L. Gupta', standing: '38+ वर्ष निरंतर वकालत', specialty: 'फौजदारी ट्रायल, मर्डर केसेस एवं एनडीपीएस', chamber: 'Chamber 04, Civil Wing' },
                  { name: 'Senior Advocate H. N. Mathur', standing: '35+ वर्ष निरंतर वकालत', specialty: 'पारिवारिक एवं कंपनी लॉ विशेषज्ञ', chamber: 'Chamber 09, Senior Block' },
                  { name: 'Senior Advocate V. K. Jain', standing: '32+ वर्ष निरंतर वकालत', specialty: 'मोटर दुर्घटना दावा एवं बीमा अधिकरण', chamber: 'Chamber 15, Criminal Wing' },
                  { name: 'Senior Advocate Kailash Chand Yadav', standing: '30+ वर्ष निरंतर वकालत', specialty: 'राजस्व वाद, काश्तकारी अधिनियम व अपील', chamber: 'Chamber 21, Revenue Wing' },
                  { name: 'Senior Advocate Smt. Kanta Devi', standing: '28+ वर्ष निरंतर वकालत', specialty: 'महिला अधिकार, भरण-पोषण एवं वैवाहिक वाद', chamber: 'Chamber 27, Family Wing' }
                ].map((s, idx) => (
                  <div key={idx} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-xl bg-slate-900 text-amber-400 font-serif font-bold text-lg flex items-center justify-center shrink-0">
                        व.अ
                      </div>
                      <div>
                        <h4 className="font-serif font-bold text-sm text-slate-900">
                          {s.name}
                        </h4>
                        <span className="text-[11px] font-mono text-amber-800 font-semibold block">
                          {s.standing}
                        </span>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-slate-100 text-xs text-slate-600 space-y-1">
                      <div><strong>विशेषज्ञता:</strong> {s.specialty}</div>
                      <div className="text-[11px] text-slate-500">{s.chamber}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* BCR Representation Box */}
            <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md border border-amber-500/30 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-serif font-bold text-lg text-amber-300">
                    बार काउंसिल ऑफ राजस्थान (BCR, High Court Premises Jodhpur) संपर्क सेल
                  </h3>
                  <p className="text-xs text-slate-300">
                    अलवर जिले के अधिवक्ताओं के सनद नवीनीकरण, कल्याण कोष दावे एवं अनुशासनात्मक समन्वय
                  </p>
                </div>
                <Link
                  href="/bcr-services"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs transition"
                >
                  14 BCR सेवाएं खोलें →
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 text-xs">
                <div className="p-3 bg-white/5 rounded-xl border border-white/10 space-y-1">
                  <span className="text-amber-400 font-semibold block">कल्याण कोष ट्रस्टी कमेटी संपर्क:</span>
                  <span className="text-slate-300">जोधपुर हेड ऑफिस हेल्पडेस्क: 0291-2545066</span>
                </div>
                <div className="p-3 bg-white/5 rounded-xl border border-white/10 space-y-1">
                  <span className="text-amber-400 font-semibold block">अलवर बार काउंसिल लाइजन:</span>
                  <span className="text-slate-300">अलवर बार एसोसिएशन ऑफिस रूम नं. 02</span>
                </div>
                <div className="p-3 bg-white/5 rounded-xl border border-white/10 space-y-1">
                  <span className="text-amber-400 font-semibold block">सीओपी सत्यापन (COP Cell):</span>
                  <span className="text-slate-300">बीना फीस सत्यापन एवं डिजिटल आईडी कार्ड</span>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 6: WELFARE, AMENITIES, LIBRARY & SPORTS (Matches RHCBA Facilities) */}
        {/* ========================================================================= */}
        {activeTab === 'welfare-amenities' && (
          <div className="space-y-8">
            
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-800 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
                Advocate Amenities, Facilities & Sports
              </span>
              <h2 className="font-serif font-bold text-2xl text-slate-900 mt-1">
                बार कल्याण न्यास, आधुनिक ई-लाइब्रेरी एवं खेलकूद सुविधाएं
              </h2>
              <p className="text-slate-500 text-xs">
                सेंट्रलाइज्ड एसी बार रूम्स, कानूनी डेटाबेस, कैंटीन, लॉयर्स प्रीमियर लीग एवं सांस्कृतिक गतिविधियां
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* Amenity 1: Air Conditioned Bar Rooms */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                  <Building2 className="w-6 h-6" />
                </div>
                <h3 className="font-serif font-bold text-base text-slate-900">
                  वातानुकूलित बार रूम (Civil & Criminal)
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  सिविल और क्रिमिनल विंग्स में विशाल, पूर्णतः वातानुकूलित सेंट्रल हॉल। हाई-स्पीड वाई-फाई, बैठने की आरामदायक कुर्सियां, एवं वाद सूची सूचना डिस्प्ले बोर्ड।
                </p>
                <div className="text-[11px] font-semibold text-blue-700 pt-2 border-t border-slate-100">
                  क्षमता: 250+ अधिवक्ता एक साथ
                </div>
              </div>

              {/* Amenity 2: Digital e-Library */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
                <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                  <Laptop className="w-6 h-6" />
                </div>
                <h3 className="font-serif font-bold text-base text-slate-900">
                  आधुनिक ई-लाइब्रेरी व डेटाबेस
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  SCC Online, AIR All India Reporter, Manupatra एवं लाइव कानून डेटाबेस युक्त 12 कंप्यूटर टर्मिनल्स। 10,000+ प्रामाणिक विधि पुस्तकें व कमेंट्रीज।
                </p>
                <div className="text-[11px] font-semibold text-amber-700 pt-2 border-t border-slate-100">
                  समय: प्रातः 9:30 AM से सायं 6:00 PM
                </div>
              </div>

              {/* Amenity 3: Welfare Trust Fund */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <HeartHandshake className="w-6 h-6" />
                </div>
                <h3 className="font-serif font-bold text-base text-slate-900">
                  अलवर बार अधिवक्ता कल्याण न्यास
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  अधिवक्ता के असामयिक निधन पर परिजनों को तुरंत आर्थिक सहायता, गंभीर बीमारी में आपातकालीन चिकित्सा अनुदान तथा कनिष्ठ अधिवक्ताओं हेतु विधिक छात्रवृत्ति।
                </p>
                <div className="text-[11px] font-semibold text-emerald-700 pt-2 border-t border-slate-100">
                  मृत्यु दावा: ₹10,00,000 तक • चिकित्सा: ₹2,00,000 तक
                </div>
              </div>

              {/* Amenity 4: Bar Canteen & Dining */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
                <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-700 flex items-center justify-center">
                  <Coffee className="w-6 h-6" />
                </div>
                <h3 className="font-serif font-bold text-base text-slate-900">
                  हाईजीनिक कैंटीन व डाइनिंग हॉल
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  अधिवक्ताओं एवं उनके मुवक्किलों हेतु शुद्ध शाकाहारी भोजन, चाय-नाश्ता एवं पेय जल की रियायती दर पर स्वच्छ व्यवस्था। नियमित खाद्य गुणवत्ता जांच।
                </p>
                <div className="text-[11px] font-semibold text-orange-700 pt-2 border-t border-slate-100">
                  स्थान: कोर्ट कैंपस बैक लॉन विंग
                </div>
              </div>

              {/* Amenity 5: Sports & APL Cricket */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
                <div className="w-12 h-12 rounded-xl bg-red-50 text-red-700 flex items-center justify-center">
                  <Trophy className="w-6 h-6" />
                </div>
                <h3 className="font-serif font-bold text-base text-slate-900">
                  लॉयर्स प्रीमियर लीग (APL Cricket)
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  प्रत्येक वर्ष आयोजित होने वाली अंतर-बार क्रिकेट एवं बैडमिंटन प्रतियोगिता। 18 तहसीलों व न्यायिक अधिकारियों के बीच मैत्रीपूर्ण खेलकूद महोत्सव।
                </p>
                <div className="text-[11px] font-semibold text-red-700 pt-2 border-t border-slate-100">
                  वार्षिक आयोजन: दिसंबर – जनवरी
                </div>
              </div>

              {/* Amenity 6: Mediation & Conference Hall */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
                <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
                  <Landmark className="w-6 h-6" />
                </div>
                <h3 className="font-serif font-bold text-base text-slate-900">
                  कॉन्फ्रेंस व मध्यस्थता सभागार
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  विधिक संगोष्ठियों, मध्यस्थता वार्ताओं (ADR/Mediation), एवं राष्ट्रीय लोक अदालत की पूर्व बैठकों हेतु 150 सीटर अत्याधुनिक ऑडियो-विजुअल सभागार।
                </p>
                <div className="text-[11px] font-semibold text-teal-700 pt-2 border-t border-slate-100">
                  सुविधा: प्रोजेक्टर, पीए सिस्टम एवं वीसी स्क्रीन
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 7: DOWNLOADS HUB (Matches Jaipur Bar & RHCBA Downloads) */}
        {/* ========================================================================= */}
        {activeTab === 'downloads' && (
          <div className="space-y-6">
            
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Official Prescribed Downloads Hub
                </span>
                <h2 className="font-serif font-bold text-2xl text-slate-900 mt-1">
                  अलवर बार एसोसिएशन डाउनलोड केंद्र
                </h2>
                <p className="text-slate-500 text-xs">
                  नवीन सदस्यता, अधिकृत वकालतनामा, पार्किंग स्टीकर, चैंबर आवंटन, नो-ड्यूज एवं ऑडिट रिपोर्ट
                </p>
              </div>

              <span className="text-xs bg-amber-50 text-amber-900 border border-amber-200 px-3 py-1.5 rounded-xl font-bold font-mono">
                8 आधिकारिक प्रपत्र उपलब्ध
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {barDownloads.map(doc => (
                <div
                  key={doc.id}
                  className="bg-white rounded-xl border border-slate-200 hover:border-amber-400 p-5 shadow-sm hover:shadow-md transition space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {doc.category}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {doc.fileSize}
                      </span>
                    </div>

                    <h3 className="font-serif font-bold text-base text-slate-900 leading-snug">
                      {doc.titleHi}
                    </h3>
                    <p className="text-xs text-amber-900/80 font-medium font-mono">
                      {doc.titleEn}
                    </p>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {doc.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 font-mono truncate max-w-[200px]">
                      {doc.fileName}
                    </span>
                    <button
                      onClick={() => handleDownloadFile(doc)}
                      className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold rounded-lg text-xs transition shadow flex items-center space-x-1.5 shrink-0"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>प्रपत्र डाउनलोड</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

      </div>

    </div>
  );
}
