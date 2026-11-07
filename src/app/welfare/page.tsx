'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useLanguage } from '@/lib/i18n/context';
import { 
  Shield, ExternalLink, Calendar, CheckSquare, FileText, 
  AlertCircle, HelpCircle, RefreshCw, Calculator, Search, 
  Award, HeartHandshake, CheckCircle2, ChevronRight, ChevronLeft, Download, 
  Clock, DollarSign, Bell, Stethoscope, Briefcase, UserCheck,
  Building2, Globe, FileCode, CheckCircle, ArrowUpRight,
  Filter, Sparkles, MapPin, Phone, Activity, Send, Check,
  HelpCircle as QuestionIcon, FileSpreadsheet, ChevronDown,
  Loader2
} from 'lucide-react';
import type { WelfareScheme, WelfareBulletin } from '@/types/database';
import type { 
  EmpanelledHospital, 
  ClaimProcedureGuide, 
  CourtStampRule, 
  WelfareFaq 
} from '@/lib/welfare-directory';

export const dynamic = 'force-dynamic';

interface BcrLiveCircular {
  id: string;
  title: string;
  date: string;
  url: string;
  authority: string;
  important: boolean;
}

interface BcrDownload {
  title: string;
  title_hi: string;
  type: string;
  url: string;
  file_type: string;
}

function WelfareContent() {
  const { t, locale } = useLanguage();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');

  const [schemes, setSchemes] = useState<WelfareScheme[]>([]);
  const [bulletins, setBulletins] = useState<WelfareBulletin[]>([]);
  const [bcrLiveCirculars, setBcrLiveCirculars] = useState<BcrLiveCircular[]>([]);
  const [bcrOfficialDownloads, setBcrOfficialDownloads] = useState<BcrDownload[]>([]);
  const [bcrOnlineServices, setBcrOnlineServices] = useState<Record<string, string>>({});
  const [alwarBars, setAlwarBars] = useState<string[]>([
    'ALWAR', 'BANSUR', 'BEHROR', 'BEHROR (BAR)', 'BHIWADI', 'KATHUMAR',
    'KHERLI MANDI', 'KISHANGARH BAS', 'KOTKASIM', 'LAXMANGARH', 'MALAKHERA',
    'MUNDAWAR', 'NEEMRANA', 'RAJGARH', 'RAMGARH', 'TAPUKARA', 'THANAGAZI', 'TIJARA'
  ]);
  const [stampInfo, setStampInfo] = useState<Record<string, string>>({});
  const [benefitSchedule, setBenefitSchedule] = useState<Array<{ years: string; amount: string; label: string }>>([]);
  const [hospitals, setHospitals] = useState<EmpanelledHospital[]>([]);
  const [claimGuides, setClaimGuides] = useState<ClaimProcedureGuide[]>([]);
  const [stampRules, setStampRules] = useState<CourtStampRule[]>([]);
  const [faqs, setFaqs] = useState<WelfareFaq[]>([]);

  const [loading, setLoading] = useState(true);
  const [activeSchemeCat, setActiveSchemeCat] = useState('ALL');
  const [search, setSearch] = useState('');
  const [circularSearch, setCircularSearch] = useState('');
  const [hospitalCityFilter, setHospitalCityFilter] = useState('ALL');
  const [hospitalSearch, setHospitalSearch] = useState('');
  const [activeFaqCat, setActiveFaqCat] = useState('ALL');
  const [selectedGuideId, setSelectedGuideId] = useState('guide-death');
  const [expandedFaqIdx, setExpandedFaqIdx] = useState<number | null>(null);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('');
  const [selectedBar, setSelectedBar] = useState('ALWAR');

  // BCR Official Dues Register State (Extracted from Official Alwar Judgeship PDF)
  const [duesRecords, setDuesRecords] = useState<Array<{
    s_no: number;
    enrol_no: string;
    elc_no: string;
    name: string;
    due_subs: string;
    ltm_subs: string;
    category: 'ltm' | 'dues_pending' | 'na' | 'termi' | 'other';
  }>>([]);
  const [duesLoading, setDuesLoading] = useState(false);
  const [duesSearch, setDuesSearch] = useState('');
  const [duesCategory, setDuesCategory] = useState('ALL');
  const [duesPage, setDuesPage] = useState(1);
  const [duesTotalPages, setDuesTotalPages] = useState(1);
  const [duesTotalMatching, setDuesTotalMatching] = useState(0);
  const [duesSummary, setDuesSummary] = useState<{
    total: number;
    ltm_count: number;
    na_count: number;
    dues_pending_count: number;
    termi_count: number;
  }>({ total: 3120, ltm_count: 802, na_count: 1998, dues_pending_count: 296, termi_count: 24 });
  const [allBarsSummary, setAllBarsSummary] = useState<Record<string, {
    bar_name: string;
    bar_slug: string;
    total_advocates: number;
    ltm_count: number;
    dues_pending_count: number;
    na_count: number;
    termi_count: number;
    pdf_download_url: string;
  }>>({});
  const [currentBarPdfUrl, setCurrentBarPdfUrl] = useState<string>('/downloads/bcr-alwar-rawf-dues-list.pdf');

  // Main Navigation View
  const [mainView, setMainView] = useState<
    'schemes' | 'bcr_live' | 'downloads' | 'hospitals' | 'guides' | 'stamps' | 'faqs' | 'dues' | 'helpdesk'
  >('schemes');

  // Interactive Benefit Calculator State
  const [practiceYears, setPracticeYears] = useState<number>(10);
  const [calculatedBenefit, setCalculatedBenefit] = useState<string>('₹3,50,000 (10–14 Years Mid-Career Slab)');

  // Live Claim & Membership Status Checker State
  const [enrollmentQuery, setEnrollmentQuery] = useState('');
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [statusResult, setStatusResult] = useState<{
    found: boolean;
    source?: 'local_directory' | 'bcr_statutory_validation';
    name?: string;
    enrollment?: string;
    bar_association?: string;
    chamber_address?: string;
    court_practice?: string;
    experience_years?: number;
    is_verified?: boolean;
    welfare_status?: string;
    welfare_validity?: string;
    stamp_compliance?: string;
    calculated_slab?: string;
    cashless_cover?: string;
    accidental_cover?: string;
    nominee_status?: string;
    bcr_dues_link?: string;
    bcr_portal_link?: string;
    sync_note?: string;
    message?: string;
    samples?: string[];
  } | null>(null);

  // Online Helpdesk Form State
  const [helpName, setHelpName] = useState('');
  const [helpEnrollment, setHelpEnrollment] = useState('');
  const [helpPhone, setHelpPhone] = useState('');
  const [helpQueryType, setHelpQueryType] = useState('Death Claim Guidance');
  const [helpMessage, setHelpMessage] = useState('');
  const [helpSubmitting, setHelpSubmitting] = useState(false);
  const [helpResponse, setHelpResponse] = useState<{ success: boolean; ticket_id?: string; message?: string } | null>(null);

  const fetchWelfareData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/public/welfare');
      const data = await res.json();
      if (data.schemes) setSchemes(data.schemes);
      if (data.bulletins) setBulletins(data.bulletins);
      if (data.bcr_live_circulars) setBcrLiveCirculars(data.bcr_live_circulars);
      if (data.bcr_official_downloads) setBcrOfficialDownloads(data.bcr_official_downloads);
      if (data.bcr_online_services) setBcrOnlineServices(data.bcr_online_services);
      if (data.alwar_judgeship_bars) setAlwarBars(data.alwar_judgeship_bars);
      if (data.stamp_info) setStampInfo(data.stamp_info);
      if (data.benefit_schedule) setBenefitSchedule(data.benefit_schedule);
      if (data.empanelled_hospitals) setHospitals(data.empanelled_hospitals);
      if (data.claim_guides) setClaimGuides(data.claim_guides);
      if (data.court_stamp_rules) setStampRules(data.court_stamp_rules);
      if (data.welfare_faqs) setFaqs(data.welfare_faqs);
      setLastSyncTime(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('Failed to load welfare schemes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWelfareData();
  }, []);

  useEffect(() => {
    if (!tabParam) return;
    if (tabParam === 'downloads') setMainView('downloads');
    else if (tabParam === 'bcr_live' || tabParam === 'circulars') setMainView('bcr_live');
    else if (tabParam === 'hospitals') setMainView('hospitals');
    else if (tabParam === 'guides') setMainView('guides');
    else if (tabParam === 'stamps') setMainView('stamps');
    else if (tabParam === 'faqs') setMainView('faqs');
    else if (tabParam === 'dues') setMainView('dues');
    else if (tabParam === 'helpdesk') setMainView('helpdesk');
    else if (tabParam === 'schemes') setMainView('schemes');
  }, [tabParam]);

  // Handle single link direct enrollment check via URL query param (?enrollment=R/2268/2009 or ?check=R/2268/2009)
  useEffect(() => {
    const enrollParam = searchParams.get('enrollment') || searchParams.get('check');
    if (enrollParam) {
      setEnrollmentQuery(enrollParam);
      handleCheckStatus(undefined, enrollParam);
      setTimeout(() => {
        const el = document.getElementById('welfare-status-checker');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 400);
    }
  }, [searchParams]);

  // Fetch official BCR dues records
  const fetchDuesData = async (
    page = duesPage,
    search = duesSearch,
    cat = duesCategory,
    bar = selectedBar
  ) => {
    setDuesLoading(true);
    try {
      const url = `/api/public/welfare/dues?bar=${encodeURIComponent(bar)}&page=${page}&limit=25&q=${encodeURIComponent(search)}&category=${encodeURIComponent(cat)}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setDuesRecords(data.records || []);
        setDuesTotalPages(data.total_pages || 1);
        setDuesTotalMatching(data.total_matching || 0);
        if (data.summary) {
          setDuesSummary(data.summary);
        }
        if (data.all_bars_summary) {
          setAllBarsSummary(data.all_bars_summary);
        }
        if (data.pdf_download_url) {
          setCurrentBarPdfUrl(data.pdf_download_url);
        }
      }
    } catch (err) {
      console.error('Failed to fetch BCR dues:', err);
    } finally {
      setDuesLoading(false);
    }
  };

  useEffect(() => {
    if (mainView === 'dues') {
      const timer = setTimeout(() => {
        fetchDuesData(duesPage, duesSearch, duesCategory, selectedBar);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [mainView, duesPage, duesSearch, duesCategory, selectedBar]);

  const handleManualSync = async () => {
    setIsRefreshing(true);
    await fetchWelfareData();
    setIsRefreshing(false);
  };

  // Calculate retirement benefit based on practice years
  const calculateRetirementSlab = (years: number) => {
    setPracticeYears(years);
    if (years < 5) {
      setCalculatedBenefit('Refund of paid subscriptions with interest (Sub-5 Yrs Rule)');
    } else if (years <= 9) {
      setCalculatedBenefit('₹1,75,000 (5–9 Years Compassionate Slab)');
    } else if (years <= 14) {
      setCalculatedBenefit('₹3,50,000 (10–14 Years Mid-Career Slab)');
    } else if (years <= 19) {
      setCalculatedBenefit('₹5,50,000 (15–19 Years Senior Practice Slab)');
    } else if (years <= 24) {
      setCalculatedBenefit('₹7,50,000 (20–24 Years Veteran Counsel Slab)');
    } else if (years <= 29) {
      setCalculatedBenefit('₹9,00,000 (25–29 Years Silver Jubilee Slab)');
    } else if (years <= 34) {
      setCalculatedBenefit('₹10,00,000 (30–34 Years Practice Milestone)');
    } else if (years <= 44) {
      setCalculatedBenefit('₹10,53,000 to ₹12,00,000 (35–44 Years Enhanced Slab)');
    } else {
      setCalculatedBenefit('₹12,50,000 to ₹15,00,000 (Maximum Statutory Ceiling under 2022 Amendment)');
    }
  };

  // Search advocate enrollment for live status
  const handleCheckStatus = async (e?: React.FormEvent, overrideQuery?: string) => {
    if (e) e.preventDefault();
    const queryToUse = (overrideQuery ?? enrollmentQuery).trim();
    if (!queryToUse) return;

    if (overrideQuery) {
      setEnrollmentQuery(overrideQuery);
    }

    setIsCheckingStatus(true);
    setStatusResult(null);

    try {
      const res = await fetch(`/api/public/welfare/verify?enrollment=${encodeURIComponent(queryToUse)}`);
      const data = await res.json();
      setStatusResult(data);
    } catch {
      setStatusResult({
        found: false,
        enrollment: queryToUse,
        message: 'Network error communicating with welfare verification server. Please try again or test using the sample chips below.',
        samples: ['R/1420/2012', 'R/2890/2018', 'R/1122/2008', 'R/3451/2018', 'R/982/2012']
      });
    } finally {
      setIsCheckingStatus(false);
    }
  };

  // Handle Helpdesk Submission
  const handleHelpdeskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!helpName || !helpPhone) return;

    setHelpSubmitting(true);
    setHelpResponse(null);
    try {
      const res = await fetch('/api/public/welfare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: helpName,
          enrollment_no: helpEnrollment,
          phone: helpPhone,
          query_type: helpQueryType,
          message: helpMessage
        })
      });
      const data = await res.json();
      if (res.ok) {
        setHelpResponse({
          success: true,
          ticket_id: data.ticket_id,
          message: locale === 'hi' ? data.message_hi : data.message_en
        });
        setHelpName('');
        setHelpEnrollment('');
        setHelpPhone('');
        setHelpMessage('');
      } else {
        setHelpResponse({
          success: false,
          message: data.error || 'Failed to submit'
        });
      }
    } catch (err) {
      setHelpResponse({
        success: false,
        message: 'Network error submitting request.'
      });
    } finally {
      setHelpSubmitting(false);
    }
  };

  const schemeCategories = [
    { id: 'ALL', label: locale === 'hi' ? 'समस्त योजनाएं' : 'All Welfare Funds' },
    { id: 'retirement', label: locale === 'hi' ? 'सेवानिवृत्ति व मृत्यु (₹15 लाख)' : 'Retirement & Demise (₹15L)' },
    { id: 'medical', label: locale === 'hi' ? 'कैशलेस मेडिक्लेम (₹5 लाख)' : 'Cashless Health (₹5L)' },
    { id: 'stipend', label: locale === 'hi' ? 'युवा अधिवक्ता स्टाइपेंड' : 'Young Advocate Stipend' },
    { id: 'emergency', label: locale === 'hi' ? 'गंभीर बीमारी सहायता' : 'Critical Illness Aid' },
    { id: 'disability', label: locale === 'hi' ? 'दुर्घटना बीमा' : 'Accident Insurance' },
    { id: 'local_benevolent', label: locale === 'hi' ? 'अलवर बार स्थानीय सहायता' : 'Alwar Local Distress Fund' },
    { id: 'maternity', label: locale === 'hi' ? 'महिला मातृत्व सहायता' : 'Women Maternity Aid' }
  ];

  const filteredSchemes = schemes.filter(s => {
    const matchesCat = activeSchemeCat === 'ALL' || s.category === activeSchemeCat;
    const matchesSearch = 
      !search ||
      s.title_en.toLowerCase().includes(search.toLowerCase()) ||
      s.title_hi.toLowerCase().includes(search.toLowerCase()) ||
      s.benefits_summary.toLowerCase().includes(search.toLowerCase()) ||
      s.eligibility_criteria.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const filteredCirculars = bcrLiveCirculars.filter(c => {
    if (!circularSearch) return true;
    const q = circularSearch.toLowerCase();
    return c.title.toLowerCase().includes(q) || c.date.includes(q);
  });

  const filteredHospitals = hospitals.filter(h => {
    const matchesCity = hospitalCityFilter === 'ALL' || h.city === hospitalCityFilter;
    const matchesSearch = 
      !hospitalSearch ||
      h.name_en.toLowerCase().includes(hospitalSearch.toLowerCase()) ||
      h.name_hi.toLowerCase().includes(hospitalSearch.toLowerCase()) ||
      h.specialties.some(sp => sp.toLowerCase().includes(hospitalSearch.toLowerCase()));
    return matchesCity && matchesSearch;
  });

  const filteredFaqs = faqs.filter(f => {
    if (activeFaqCat === 'ALL') return true;
    return f.category === activeFaqCat;
  });

  const activeGuide = claimGuides.find(g => g.id === selectedGuideId) || claimGuides[0];

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-8">
      {/* 1. Header & Live Sync Banner */}
      <div className="border-b pb-6 border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-amber-700 mb-1.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <Shield className="w-4 h-4 text-amber-600" />
              <span>Bar Council of Rajasthan (BCR) Trustee Committee Live Repository</span>
            </div>
            <h1 className="font-serif font-bold text-3xl sm:text-4xl text-slate-900 tracking-tight">
              {locale === 'hi' ? 'अधिवक्ता कल्याण केंद्र एवं लाइव विधिक योजनाएं' : 'Advocate Welfare Centre & Live Statutory Funds'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1.5 max-w-3xl leading-relaxed">
              Official statutory funds under the Rajasthan Advocates Welfare Fund Act, 1987 (Act No. 15 of 1987), live circulars, revised ₹140 Welfare Stamp compliance, cashless mediclaim, network hospitals directory, and online claim guidance.
            </p>
          </div>

          <div className="flex flex-col items-start md:items-end shrink-0 gap-1.5">
            <button
              onClick={handleManualSync}
              disabled={isRefreshing}
              className="inline-flex items-center space-x-2 px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-lg text-xs font-semibold border border-amber-300 transition shadow-sm"
              title="Sync latest circulars and notifications directly from Bar Council of Rajasthan"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-amber-700' : ''}`} />
              <span>{isRefreshing ? 'Syncing BCR...' : '🔄 BCR से लाइव सिंक करें (Live Sync)'}</span>
            </button>
            <span className="text-[11px] text-emerald-700 font-medium flex items-center space-x-1">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>Live Connected: BCR Jodhpur {lastSyncTime && `(${lastSyncTime})`}</span>
            </span>
          </div>
        </div>
      </div>

      {/* 2. STATUTORY STAMP NOTIFICATION: CURRENT ₹140 REQUIREMENT */}
      <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-l-4 border-amber-600 rounded-r-2xl p-5 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-950 bg-amber-200 px-2.5 py-0.5 rounded-full border border-amber-300">
                Statutory Mandate — Section 27, RAWF Act
              </span>
              <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                Current Rate: {stampInfo.mandatory_fee || '₹140.00'} (Effective 01/07/2026)
              </span>
            </div>
            <h2 className="font-serif font-bold text-base text-slate-900 pt-1">
              {locale === 'hi' 
                ? 'अलवर की समस्त अदालतों में प्रस्तुत वकालतनामे पर ₹140 का कल्याण कोष स्टाम्प लगाना अनिवार्य' 
                : 'Mandatory ₹140 Rajasthan Advocates Welfare Fund Stamp on Every Vakalatnama'}
            </h2>
            <p className="text-xs text-slate-700 leading-relaxed max-w-3xl">
              {stampInfo.requirement || 'Every Vakalatnama filed across District & Sessions Court, CJM, ACJM, SDO, and Revenue Courts in Alwar must affix the prescribed ₹140 RAWF Stamp.'}
            </p>
            <div className="text-[11px] text-slate-600 flex flex-wrap items-center gap-x-4 gap-y-1 pt-1">
              <span>📍 <strong>Counters in Alwar:</strong> {stampInfo.stamp_counters || 'Bar Association Office Counter No. 2, District Court Campus, Alwar'}</span>
              <span>📜 <strong>Previous Rates:</strong> ₹130 (2025–26) • ₹110 (2023–25) • ₹100 (Prior)</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 shrink-0">
            {stampInfo.circular_url && (
              <a
                href={stampInfo.circular_url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 bg-amber-800 hover:bg-amber-900 text-white rounded-lg text-xs font-semibold shadow-sm transition inline-flex items-center space-x-1.5"
              >
                <span>Official Circular (PDF)</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            )}
            <button
              onClick={() => {
                setMainView('stamps');
                const el = document.getElementById('welfare-tabs-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-lg text-xs font-semibold shadow-sm transition inline-flex items-center space-x-1.5"
            >
              <span>View Court Stamp Chart</span>
              <FileSpreadsheet className="w-3.5 h-3.5 text-amber-700" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. BCR OFFICIAL ONLINE SERVICES QUICK-BAR */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <a
          href="https://barcouncilofrajasthan.org/Advocate/"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-amber-500 hover:shadow-md transition group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between text-amber-700 mb-1.5">
              <Globe className="w-5 h-5 text-amber-600" />
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 transition" />
            </div>
            <h3 className="font-bold text-xs text-slate-900 flex items-center space-x-1.5">
              <span>BCR Advocate Portal (Login)</span>
              <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-bold">14 ऑनलाइन सेवाएं</span>
            </h3>
            <p className="text-[11px] text-slate-500 mt-1 leading-snug">
              बार काउंसिल ऑफ राजस्थान आधिकारिक लॉगिन — पहचान पत्र, COP नवीनीकरण, निरंतरता प्रमाण पत्र, वेलफेयर क्लेम सहित समस्त 14 सेवाएं।
            </p>
          </div>
          <span className="text-[10px] font-semibold text-amber-700 mt-3 block">
            ऑफिशियल BCR लॉगिन खोलें ↗
          </span>
        </a>

        <button
          type="button"
          onClick={() => {
            setMainView('hospitals');
            const el = document.getElementById('welfare-tabs-section');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
          className="text-left bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-rose-500 hover:shadow-md transition group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between text-rose-700 mb-1.5">
              <Stethoscope className="w-5 h-5 text-rose-600" />
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-rose-600 transition" />
            </div>
            <h3 className="font-bold text-xs text-slate-900">Cashless Hospitals (10 Empanelled)</h3>
            <p className="text-[11px] text-slate-500 mt-1 leading-snug">
              Approved mediclaim cashless network hospitals across Alwar, Bhiwadi, Behror & Jaipur.
            </p>
          </div>
          <span className="text-[10px] font-semibold text-rose-700 mt-3 block">
            View Hospital Directory ↓
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setMainView('downloads');
            const el = document.getElementById('welfare-tabs-section');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
          className="text-left bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-emerald-500 hover:shadow-md transition group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between text-emerald-700 mb-1.5">
              <Download className="w-5 h-5 text-emerald-600" />
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition" />
            </div>
            <h3 className="font-bold text-xs text-slate-900">Statutory Acts & Forms (8 PDFs)</h3>
            <p className="text-[11px] text-slate-500 mt-1 leading-snug">
              Download RAWF Act 1987 (amended 2022), Form A, Form B & BCI scheme files.
            </p>
          </div>
          <span className="text-[10px] font-semibold text-emerald-700 mt-3 block">
            View All 8 PDF Downloads ↓
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setMainView('guides');
            const el = document.getElementById('welfare-tabs-section');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
          className="text-left bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-blue-500 hover:shadow-md transition group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between text-blue-700 mb-1.5">
              <FileText className="w-5 h-5 text-blue-600" />
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition" />
            </div>
            <h3 className="font-bold text-xs text-slate-900">Claim Process Guides (5 Dossiers)</h3>
            <p className="text-[11px] text-slate-500 mt-1 leading-snug">
              Step-by-step procedures for Death Claim, Critical Illness, Retirement & Stipends.
            </p>
          </div>
          <span className="text-[10px] font-semibold text-blue-700 mt-3 block">
            View Step-by-Step Guides ↓
          </span>
        </button>
      </div>

      {/* 4. DUAL TOOLS: BENEFIT CALCULATOR & STATUS TRACKER */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tool A: Retirement & Demise Benefit Calculator */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center space-x-2 text-blue-700">
            <Calculator className="w-5 h-5 text-blue-600" />
            <h2 className="font-serif font-bold text-lg text-slate-900">
              {locale === 'hi' ? 'कल्याण कोष सहायता कैलकुलेटर' : 'Welfare Benefit Entitlement Calculator'}
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            Calculate your accrued retirement or nominee demise entitlement based on active verified practice years under Section 17 & the Schedule of the Rajasthan Advocates Welfare Fund Act, 1987.
          </p>

          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
              <span>Completed Years of Legal Practice:</span>
              <span className="font-mono text-base text-blue-700">{practiceYears} Years</span>
            </div>

            <input
              type="range"
              min="1"
              max="50"
              value={practiceYears}
              onChange={e => calculateRetirementSlab(parseInt(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer"
            />

            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>1 Year</span>
              <span>10 Yrs</span>
              <span>25 Yrs (Rajat Jayanti)</span>
              <span>50 Yrs (Max ₹15L)</span>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-1.5">
              <span className="text-[11px] font-semibold text-blue-900 block uppercase">
                Estimated Accrued Statutory Benefit:
              </span>
              <div className="font-serif font-bold text-2xl text-blue-950">
                {calculatedBenefit}
              </div>
              <div className="text-[11px] text-slate-600 pt-1 border-t border-blue-200/60 space-y-0.5">
                <div>⚖️ <strong>वैधानिक आधार (Statutory Base):</strong> धारा 17 एवं अनुसूची (Schedule), राजस्थान अधिवक्ता कल्याण निधि अधिनियम, 1987 (संशोधन अधिनियम सं. 13/2022 w.e.f. 20.10.2022).</div>
                <div>📋 <strong>अतिरिक्त लाभ:</strong> ₹5,00,000/वर्ष कैशलेस स्वास्थ्य बीमा + ₹10,00,000 दुर्घटना मृत्यु/दिव्यांगता कवर।</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tool B: Live Membership & Claim Status Tracker */}
        <div id="welfare-status-checker" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4 scroll-mt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-emerald-700">
              <UserCheck className="w-5 h-5 text-emerald-600" />
              <h2 className="font-serif font-bold text-lg text-slate-900">
                {locale === 'hi' ? 'सनद एवं कल्याण कोष सदस्यता जांच' : 'Check Welfare Membership & Stamp Status'}
              </h2>
            </div>
            <span className="text-[10px] font-mono bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded border border-emerald-200">
              BCR Jodhpur &amp; Alwar Bar Register
            </span>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            Enter Bar Council of Rajasthan Sanad Number (e.g. <code className="text-emerald-800 font-bold font-mono">R/2268/2009</code>) to verify welfare standing, statutory ₹140 stamp compliance, accrued retirement slab, and cashless healthcare entitlement.
          </p>

          <form onSubmit={handleCheckStatus} className="space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={enrollmentQuery}
                  onChange={e => setEnrollmentQuery(e.target.value)}
                  placeholder="Enter Sanad (e.g. R/2268/2009 or R/1420/2012)..."
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono shadow-inner"
                />
              </div>
              <button
                type="submit"
                disabled={isCheckingStatus || !enrollmentQuery.trim()}
                className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shrink-0 shadow-sm transition inline-flex items-center space-x-1.5"
              >
                {isCheckingStatus ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Verify Status</span>
                  </>
                )}
              </button>
            </div>

            {/* Quick-test sample chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] text-slate-500">
              <span className="font-semibold text-slate-400">Quick Test:</span>
              {[
                { code: 'R/2268/2009', label: 'R/2268/2009 (Adv. Anil Sain)' },
                { code: 'R/1420/2012', label: 'R/1420/2012 (Adv. Rajesh)' },
                { code: 'R/2890/2018', label: 'R/2890/2018 (Adv. Sunita)' },
                { code: 'R/1122/2008', label: 'R/1122/2008 (Adv. Rameshwar)' },
                { code: 'R/3451/2018', label: 'R/3451/2018 (Adv. Pooja)' },
                { code: 'R/982/2012', label: 'R/982/2012 (Adv. Surendra)' }
              ].map(chip => (
                <button
                  key={chip.code}
                  type="button"
                  onClick={() => handleCheckStatus(undefined, chip.code)}
                  className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-200 border border-slate-200 text-slate-600 font-mono transition text-[10px]"
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {/* Status Result Card */}
            {statusResult && (
              <div className={`p-5 rounded-2xl border text-xs space-y-3 transition-all ${
                statusResult.found 
                  ? 'bg-gradient-to-br from-emerald-50/80 via-white to-emerald-50/40 border-emerald-300 shadow-sm text-emerald-950' 
                  : 'bg-amber-50/90 border-amber-300 shadow-sm text-amber-950'
              }`}>
                {statusResult.found ? (
                  <>
                    {/* Header: Name, Enrollment & Verification Badge */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-200/80 pb-3">
                      <div>
                        <div className="flex items-center space-x-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <h3 className="font-serif font-bold text-base text-slate-900">
                            {statusResult.name}
                          </h3>
                        </div>
                        <p className="text-[11px] text-slate-500 pl-6 mt-0.5">
                          {statusResult.bar_association} • {statusResult.chamber_address}
                        </p>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        <span className="font-mono text-xs font-bold bg-emerald-100 text-emerald-900 px-2.5 py-1 rounded-md border border-emerald-300">
                          {statusResult.enrollment}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-600 text-white px-2 py-1 rounded-md shadow-xs">
                          {statusResult.source === 'local_directory' ? 'Alwar Bar Verified' : 'BCR Sanad Validated'}
                        </span>
                      </div>
                    </div>

                    {/* 4-Item Comprehensive Status Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-slate-700">
                      <div className="bg-white p-3 rounded-xl border border-emerald-100/90 space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Welfare Membership Standing
                        </span>
                        <div className="font-bold text-emerald-800 text-xs flex items-center space-x-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{statusResult.welfare_status}</span>
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {statusResult.welfare_validity}
                        </div>
                      </div>

                      <div className="bg-white p-3 rounded-xl border border-emerald-100/90 space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          RAWF Stamp Compliance (₹140 Rule)
                        </span>
                        <div className="font-bold text-slate-900 text-xs flex items-center space-x-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{statusResult.stamp_compliance}</span>
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Mandatory on Vakalatnama per BCR Cir. 40443
                        </div>
                      </div>

                      <div className="bg-white p-3 rounded-xl border border-emerald-100/90 space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Accrued Statutory Retirement Benefit
                        </span>
                        <div className="font-bold text-blue-900 text-xs">
                          {statusResult.calculated_slab}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {statusResult.experience_years} Completed Years of Legal Practice
                        </div>
                      </div>

                      <div className="bg-white p-3 rounded-xl border border-emerald-100/90 space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Healthcare &amp; Accidental Cover
                        </span>
                        <div className="font-bold text-rose-800 text-xs flex items-center space-x-1">
                          <Stethoscope className="w-3.5 h-3.5 text-rose-600" />
                          <span>{statusResult.cashless_cover}</span>
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {statusResult.accidental_cover}
                        </div>
                      </div>
                    </div>

                    {/* Nominee Record & Additional Sync Information */}
                    <div className="pt-2 border-t border-emerald-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px]">
                      <div className="text-slate-600 flex items-center space-x-1.5">
                        <Award className="w-3.5 h-3.5 text-amber-600" />
                        <span><strong>Nominee Record:</strong> {statusResult.nominee_status}</span>
                      </div>

                      {/* Official Live Verification Links */}
                      <div className="flex items-center space-x-2">
                        <a
                          href={statusResult.bcr_dues_link || 'https://barcouncilofrajasthan.org/rawf/dues-list'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-800 hover:text-emerald-950 font-semibold underline inline-flex items-center space-x-1"
                        >
                          <span>Check BCR Live Dues</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </a>
                        <span className="text-slate-300">|</span>
                        <a
                          href={statusResult.bcr_portal_link || 'https://barcouncilofrajasthan.org/Advocate/'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-800 hover:text-blue-950 font-semibold underline inline-flex items-center space-x-1"
                        >
                          <span>Advocate Portal Login</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </a>
                      </div>
                    </div>

                    {statusResult.sync_note && (
                      <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 flex items-start justify-between gap-2">
                        <span>💡 {statusResult.sync_note}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setHelpEnrollment(statusResult.enrollment || '');
                            setHelpName(statusResult.name || '');
                            setMainView('helpdesk');
                            const el = document.getElementById('welfare-tabs-section');
                            if (el) el.scrollIntoView({ behavior: 'smooth' });
                          }}
                          className="shrink-0 px-2.5 py-1 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-[10px] font-semibold"
                        >
                          Request Sync
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-amber-800 font-bold">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>{statusResult.message || `No record found for "${statusResult.enrollment}"`}</span>
                    </div>
                    <p className="text-[11px] text-amber-900 leading-relaxed">
                      Please verify your Bar Council Sanad format. Valid format example: <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono font-bold">R/1420/2012</code> or <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono font-bold">1420/2012</code>.
                    </p>

                    <div className="pt-2 border-t border-amber-200/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="text-amber-800 text-[11px]">Direct Official Bar Council Verification:</span>
                      <a
                        href="https://barcouncilofrajasthan.org/rawf/dues-list"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 bg-amber-800 hover:bg-amber-900 text-white rounded-lg text-xs font-semibold inline-flex items-center space-x-1"
                      >
                        <span>Check on BCR Dues Portal</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}
          </form>

          {/* Quick link to official BCR Dues portal */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Checking judicial dues for Alwar Bar?</span>
            <button
              onClick={() => {
                setMainView('dues');
                const el = document.getElementById('welfare-tabs-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="text-emerald-700 font-semibold hover:underline inline-flex items-center space-x-1"
            >
              <span>View 18 Alwar Bars List</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* 5. MAIN SECTION NAVIGATION TABS */}
      <div id="welfare-tabs-section" className="border-b border-slate-200 scroll-mt-6">
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          <button
            onClick={() => setMainView('schemes')}
            className={`px-3 py-2 text-xs font-semibold rounded-t-xl transition border-b-2 flex items-center space-x-1.5 ${
              mainView === 'schemes'
                ? 'border-amber-700 text-amber-900 bg-amber-50/70 font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-amber-600" />
            <span>{locale === 'hi' ? 'वैधानिक योजनाएं (7)' : 'Statutory Schemes (7)'}</span>
          </button>

          <button
            onClick={() => setMainView('bcr_live')}
            className={`px-3 py-2 text-xs font-semibold rounded-t-xl transition border-b-2 flex items-center space-x-1.5 ${
              mainView === 'bcr_live'
                ? 'border-blue-700 text-blue-900 bg-blue-50/70 font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            <Bell className="w-3.5 h-3.5 text-blue-600" />
            <span>
              {locale === 'hi' 
                ? `BCR लाइव परिपत्र (${bcrLiveCirculars.length})` 
                : `BCR Live Circulars (${bcrLiveCirculars.length})`}
            </span>
          </button>

          <button
            onClick={() => setMainView('downloads')}
            className={`px-3 py-2 text-xs font-semibold rounded-t-xl transition border-b-2 flex items-center space-x-1.5 ${
              mainView === 'downloads'
                ? 'border-emerald-700 text-emerald-900 bg-emerald-50/70 font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>{locale === 'hi' ? 'अधिनियम व फॉर्म्स (8)' : 'Official Acts & Forms (8)'}</span>
          </button>

          <button
            onClick={() => setMainView('hospitals')}
            className={`px-3 py-2 text-xs font-semibold rounded-t-xl transition border-b-2 flex items-center space-x-1.5 ${
              mainView === 'hospitals'
                ? 'border-rose-700 text-rose-900 bg-rose-50/70 font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Stethoscope className="w-3.5 h-3.5 text-rose-600" />
            <span>Cashless Hospitals (10)</span>
          </button>

          <button
            onClick={() => setMainView('guides')}
            className={`px-3 py-2 text-xs font-semibold rounded-t-xl transition border-b-2 flex items-center space-x-1.5 ${
              mainView === 'guides'
                ? 'border-indigo-700 text-indigo-900 bg-indigo-50/70 font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-indigo-600" />
            <span>Claim Procedure Guides (5)</span>
          </button>

          <button
            onClick={() => setMainView('stamps')}
            className={`px-3 py-2 text-xs font-semibold rounded-t-xl transition border-b-2 flex items-center space-x-1.5 ${
              mainView === 'stamps'
                ? 'border-amber-700 text-amber-900 bg-amber-50/70 font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-amber-600" />
            <span>{locale === 'hi' ? 'कोर्ट स्टाम्प चार्ट' : 'Court Stamp Reckoner'}</span>
          </button>

          <button
            onClick={() => setMainView('faqs')}
            className={`px-3 py-2 text-xs font-semibold rounded-t-xl transition border-b-2 flex items-center space-x-1.5 ${
              mainView === 'faqs'
                ? 'border-cyan-700 text-cyan-900 bg-cyan-50/70 font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <QuestionIcon className="w-3.5 h-3.5 text-cyan-600" />
            <span>{locale === 'hi' ? 'एफएक्यू (FAQ)' : 'Welfare FAQs'}</span>
          </button>

          <button
            onClick={() => setMainView('dues')}
            className={`px-3 py-2 text-xs font-semibold rounded-t-xl transition border-b-2 flex items-center space-x-1.5 ${
              mainView === 'dues'
                ? 'border-purple-700 text-purple-900 bg-purple-50/70 font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-purple-600" />
            <span>{locale === 'hi' ? 'अलवर बार एसोसिएशन (18)' : 'Alwar Bars (18)'}</span>
          </button>

          <button
            onClick={() => setMainView('helpdesk')}
            className={`px-3 py-2 text-xs font-semibold rounded-t-xl transition border-b-2 flex items-center space-x-1.5 ${
              mainView === 'helpdesk'
                ? 'border-teal-700 text-teal-900 bg-teal-50/70 font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Phone className="w-3.5 h-3.5 text-teal-600" />
            <span>{locale === 'hi' ? 'सहायता डेस्क / अर्जी' : 'Helpdesk Requisition'}</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: STATUTORY WELFARE SCHEMES */}
      {mainView === 'schemes' && (
        <div className="space-y-6">
          {/* Search & Category Filter */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search welfare schemes, death grant, cashless mediclaim, young advocate stipend, critical illness..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              />
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {schemeCategories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveSchemeCat(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    activeSchemeCat === cat.id
                      ? 'bg-amber-800 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Results Count */}
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Showing {filteredSchemes.length} verified statutory welfare schemes</span>
            <div className="flex items-center space-x-2 text-[11px]">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Bar Council of Rajasthan Statutory Coverage Active</span>
            </div>
          </div>

          {/* Schemes Cards List */}
          {loading ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-700" />
              <span>Fetching live welfare schemes from Trustee Committee repository...</span>
            </div>
          ) : filteredSchemes.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-3">
              <Shield className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="font-semibold text-slate-700 text-base">No welfare schemes match your search</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Try adjusting your search terms or choosing &quot;All Welfare Funds&quot;.
              </p>
              <button
                onClick={() => { setSearch(''); setActiveSchemeCat('ALL'); }}
                className="px-4 py-2 bg-amber-50 text-amber-800 text-xs rounded-lg hover:bg-amber-100 font-medium"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredSchemes.map(scheme => (
                <article
                  key={scheme.id}
                  id={scheme.id}
                  className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:border-amber-400 transition"
                >
                  {/* Card Ribbon Header */}
                  <div className="bg-gradient-to-r from-legal-navy via-slate-900 to-legal-navyLight text-white px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-mono uppercase bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">
                          {scheme.issuing_authority}
                        </span>
                        {scheme.status_badge && (
                          <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
                            {scheme.status_badge}
                          </span>
                        )}
                      </div>
                      <h2 className="font-serif font-bold text-lg sm:text-xl text-white mt-1.5 leading-snug">
                        {locale === 'hi' ? scheme.title_hi : scheme.title_en}
                      </h2>
                    </div>

                    <div className="text-left sm:text-right shrink-0">
                      {scheme.max_benefit_amount && (
                        <div className="text-sm sm:text-base font-serif font-bold text-amber-300">
                          {scheme.max_benefit_amount}
                        </div>
                      )}
                      <span className="text-[11px] text-slate-300 block">
                        Deadline: <strong>{scheme.deadline || 'Ongoing'}</strong>
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Verified: {scheme.last_verified_date}
                      </span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-6 space-y-6">
                    {/* Benefits Summary */}
                    <div className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-4">
                      <h3 className="font-bold text-xs uppercase tracking-wider text-amber-900 mb-1 flex items-center space-x-1.5">
                        <Award className="w-4 h-4 text-amber-700" />
                        <span>Statutory Financial & Medical Entitlement:</span>
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
                        {scheme.benefits_summary}
                      </p>
                    </div>

                    {/* Grid: Eligibility vs Application Procedure */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-700">
                      <div className="space-y-2 border-l-2 border-blue-500 pl-4 bg-slate-50/50 p-3 rounded-r-lg">
                        <h4 className="font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1">
                          <Briefcase className="w-3.5 h-3.5 text-blue-600" />
                          <span>Eligibility Criteria:</span>
                        </h4>
                        <p className="leading-relaxed">
                          {scheme.eligibility_criteria}
                        </p>
                      </div>

                      <div className="space-y-2 border-l-2 border-emerald-500 pl-4 bg-slate-50/50 p-3 rounded-r-lg">
                        <h4 className="font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1">
                          <FileText className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Application Process & Sanction:</span>
                        </h4>
                        <p className="leading-relaxed">
                          {scheme.application_process}
                        </p>
                      </div>
                    </div>

                    {/* Document Checklist */}
                    <div>
                      <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900 mb-2 flex items-center space-x-1.5">
                        <CheckSquare className="w-4 h-4 text-emerald-600" />
                        <span>Mandatory Document Checklist for Claim:</span>
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {scheme.document_checklist.map((doc, idx) => (
                          <div
                            key={idx}
                            className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs text-slate-700 flex items-center space-x-2"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-600 shrink-0" />
                            <span>{doc}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Footer Actions & Verification Source */}
                    <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-slate-500 gap-3">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-semibold text-slate-700">Authority:</span>
                        <span>{scheme.issuing_authority}</span>
                      </div>

                      <div className="flex items-center space-x-3">
                        <a
                          href="https://barcouncilofrajasthan.org/Advocate/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center space-x-1 text-amber-800 hover:text-amber-900 font-semibold text-xs px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-lg transition"
                        >
                          <span>Apply Online at BCR</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </a>

                        {scheme.official_source_url && (
                          <a
                            href={scheme.official_source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-1 text-blue-700 hover:text-blue-900 font-semibold hover:underline"
                          >
                            <span>Official Source</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: LIVE BCR CIRCULARS & NOTIFICATIONS */}
      {mainView === 'bcr_live' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-legal-navy text-white rounded-2xl p-6 shadow-xl border border-blue-500/30 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
              <div className="flex items-center space-x-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-300">
                  {locale === 'hi' 
                    ? 'बार कौंसिल ऑफ राजस्थान — लाइव परिपत्र व गजट अधिसूचनाएं' 
                    : 'Bar Council of Rajasthan — Live Circulars & Gazette Notifications'}
                </span>
              </div>
              <span className="text-xs text-slate-300">
                Fetched Live from `barcouncilofrajasthan.org` • {bcrLiveCirculars.length} Official Circulars
              </span>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={circularSearch}
                onChange={e => setCircularSearch(e.target.value)}
                placeholder="Search circulars by keyword (e.g. stamp, section 25, amendment, disbursement, 2026)..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-white/10 text-white placeholder-slate-400 border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>

          <div className="space-y-3">
            {filteredCirculars.map((circ, idx) => (
              <div
                key={circ.id || idx}
                className={`p-4 rounded-xl border transition flex flex-col md:flex-row items-start md:items-center justify-between gap-3 ${
                  circ.important
                    ? 'bg-amber-500/5 border-amber-300/80 hover:border-amber-500'
                    : 'bg-white border-slate-200 hover:border-blue-400'
                }`}
              >
                <div className="space-y-1 max-w-3xl">
                  <div className="flex items-center space-x-2 text-[11px]">
                    <span className="font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      📅 {circ.date}
                    </span>
                    {circ.important && (
                      <span className="font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded text-[10px] border border-rose-200">
                        Important Order
                      </span>
                    )}
                    <span className="text-slate-400">• Bar Council of Rajasthan</span>
                  </div>
                  <h3 className="font-serif font-bold text-sm text-slate-900 leading-snug">
                    {circ.title}
                  </h3>
                </div>

                <div className="shrink-0 flex items-center space-x-2">
                  <a
                    href={circ.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-blue-800 hover:bg-blue-900 text-white rounded-lg text-xs font-semibold shadow-sm transition inline-flex items-center space-x-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PDF</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 3: STATUTORY ACTS & OFFICIAL FORMS */}
      {mainView === 'downloads' && (
        <div className="space-y-6">
          <div className="bg-emerald-950 text-white rounded-2xl p-6 shadow-xl border border-emerald-500/30 space-y-2">
            <h2 className="font-serif font-bold text-xl text-white">
              {locale === 'hi' 
                ? 'राजस्थान अधिवक्ता कल्याण कोष — वैधानिक अधिनियम एवं आवेदन प्रपत्र' 
                : 'Statutory Acts, Amendments & Official Claim Formats'}
            </h2>
            <p className="text-xs text-emerald-200 max-w-3xl leading-relaxed">
              Official PDF downloads directly hosted on Bar Council of Rajasthan repository for Act No. 15 of 1987, recent 2022 amendments, serious illness claim forms, and death benefit applications.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bcrOfficialDownloads.map((dl, idx) => (
              <div
                key={idx}
                className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-emerald-500 transition flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                    <span className="font-mono uppercase bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded border border-emerald-200 text-[10px]">
                      {dl.type}
                    </span>
                    <span className="font-mono text-slate-400 font-semibold">{dl.file_type}</span>
                  </div>
                  <h3 className="font-serif font-bold text-sm text-slate-900">
                    {locale === 'hi' ? dl.title_hi : dl.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {dl.title}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">Official BCR Document</span>
                  <a
                    href={dl.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-semibold transition inline-flex items-center space-x-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download {dl.file_type}</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 4: EMPANELLED CASHLESS HOSPITALS DIRECTORY */}
      {mainView === 'hospitals' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-rose-900 text-white rounded-2xl p-6 shadow-xl border border-rose-500/30 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-rose-300 flex items-center space-x-1.5">
                  <Stethoscope className="w-4 h-4 text-rose-400" />
                  <span>Cashless Mediclaim Network Hospitals Directory</span>
                </span>
                <h2 className="font-serif font-bold text-xl text-white mt-1">
                  Empanelled Network Hospitals across Alwar, Bhiwadi, Behror, Neemrana & Jaipur
                </h2>
              </div>
              <span className="text-xs text-rose-200 bg-rose-900/60 px-3 py-1 rounded-full border border-rose-400/30 shrink-0 font-medium">
                ₹5,00,000 Annual Cashless Health Cover
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={hospitalSearch}
                  onChange={e => setHospitalSearch(e.target.value)}
                  placeholder="Search by hospital name or specialty (e.g. Cardiology, Oncology, Mittal, SMS, Orthopedics)..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-white/10 text-white placeholder-slate-400 border border-white/20 focus:outline-none focus:ring-2 focus:ring-rose-400"
                />
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {['ALL', 'Alwar', 'Bhiwadi', 'Behror', 'Neemrana', 'Jaipur'].map(city => (
                  <button
                    key={city}
                    onClick={() => setHospitalCityFilter(city)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      hospitalCityFilter === city
                        ? 'bg-rose-600 text-white shadow-sm'
                        : 'bg-white/10 text-slate-300 hover:bg-white/20'
                    }`}
                  >
                    {city === 'ALL' ? 'All Cities (10)' : city}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Standard Operating Procedure for Cashless Hospitalization */}
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 sm:p-5 text-rose-950 space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-rose-900 flex items-center space-x-1.5">
              <CheckCircle className="w-4 h-4 text-rose-700" />
              <span>Standard Operating Procedure (SOP) for Cashless Hospitalization:</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="bg-white p-3 rounded-xl border border-rose-100 space-y-1">
                <span className="font-bold text-rose-700 block">Step 1: Hospital TPA Desk</span>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Visit the hospital&apos;s TPA / Cashless desk during admission. Show your Bar Council Sanad Card and valid Aadhaar / Government ID.
                </p>
              </div>
              <div className="bg-white p-3 rounded-xl border border-rose-100 space-y-1">
                <span className="font-bold text-rose-700 block">Step 2: Pre-Authorization</span>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Hospital desk submits cashless pre-authorization form online with medical diagnosis &amp; estimated cost to the TPA.
                </p>
              </div>
              <div className="bg-white p-3 rounded-xl border border-rose-100 space-y-1">
                <span className="font-bold text-rose-700 block">Step 3: Cashless Approval</span>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Initial cashless approval is granted within 2 to 4 hours (immediate for emergency trauma &amp; ICU admissions).
                </p>
              </div>
              <div className="bg-white p-3 rounded-xl border border-rose-100 space-y-1">
                <span className="font-bold text-rose-700 block">Step 4: Cashless Discharge</span>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Hospital settles medical bills up to ₹5,00,000 directly with the insurer. Advocate pays only non-medical items.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredHospitals.map(hosp => (
              <div
                key={hosp.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-rose-400 hover:shadow-md transition space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200">
                      📍 {hosp.city}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center space-x-1">
                      <CheckCircle className="w-3 h-3 text-emerald-600" />
                      <span>{hosp.cashless_status}</span>
                    </span>
                  </div>

                  <h3 className="font-serif font-bold text-base text-slate-900 leading-snug">
                    {hosp.name_en}
                  </h3>
                  <div className="text-[11px] text-slate-500 mt-1 flex items-start space-x-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>{hosp.address}</span>
                  </div>

                  <div className="pt-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Available Specialties & Departments:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {hosp.specialties.map((sp, idx) => (
                        <span
                          key={idx}
                          className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-medium"
                        >
                          {sp}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="space-y-0.5">
                    <div className="text-[11px] text-slate-600 flex items-center space-x-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>Reception: <strong>{hosp.phone}</strong></span>
                    </div>
                    {hosp.tpa_desk_phone && (
                      <div className="text-[10px] text-rose-700 font-semibold">
                        TPA Cashless Desk: {hosp.tpa_desk_phone}
                      </div>
                    )}
                  </div>

                  <a
                    href={`tel:${hosp.tpa_desk_phone || hosp.phone}`}
                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 font-semibold rounded-lg text-xs border border-rose-200 transition inline-flex items-center space-x-1"
                  >
                    <Phone className="w-3 h-3 text-rose-700" />
                    <span>Call Hospital</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 5: STEP-BY-STEP CLAIM PROCEDURE GUIDES */}
      {mainView === 'guides' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 text-white rounded-2xl p-6 shadow-xl border border-indigo-500/30 space-y-2">
            <h2 className="font-serif font-bold text-xl text-white">
              Statutory Welfare Claim Filing Procedures & Guidelines
            </h2>
            <p className="text-xs text-indigo-200 max-w-3xl leading-relaxed">
              Step-by-step statutory filing blueprints and mandatory document checklists for advocate death grants, critical illness assistance, retirement cessation, and young advocate stipends.
            </p>
          </div>

          {/* Guide Selector Pills */}
          <div className="flex flex-wrap gap-2">
            {claimGuides.map(guide => (
              <button
                key={guide.id}
                onClick={() => setSelectedGuideId(guide.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition border ${
                  selectedGuideId === guide.id
                    ? 'bg-indigo-900 text-white border-indigo-900 shadow-md'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {guide.title_en}
              </button>
            ))}
          </div>

          {/* Active Guide Card */}
          {activeGuide && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div>
                  <span className="text-[11px] font-mono font-bold uppercase bg-indigo-50 text-indigo-800 px-2.5 py-1 rounded-md border border-indigo-200">
                    {activeGuide.form_code}
                  </span>
                  <h3 className="font-serif font-bold text-xl text-slate-900 mt-2">
                    {activeGuide.title_en}
                  </h3>
                  <div className="text-xs text-slate-500 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                    <span>⏱️ <strong>Statutory Timeline:</strong> {activeGuide.timeline}</span>
                    <span>💰 <strong>Statutory Entitlement:</strong> {activeGuide.target_benefit}</span>
                  </div>
                </div>

                <a
                  href={activeGuide.form_download_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 bg-indigo-800 hover:bg-indigo-900 text-white rounded-xl text-xs font-semibold shadow-sm transition inline-flex items-center space-x-2 shrink-0"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Form ({activeGuide.form_code})</span>
                </a>
              </div>

              {/* 4 Steps */}
              <div className="space-y-4">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900">
                  Step-by-Step Filing Procedure (4 Core Phases):
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeGuide.steps.map(step => (
                    <div
                      key={step.step_no}
                      className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/40 space-y-1.5"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="w-5 h-5 rounded-full bg-indigo-800 text-white font-mono text-xs flex items-center justify-center font-bold">
                          {step.step_no}
                        </span>
                        <strong className="text-xs text-indigo-950">{step.title}</strong>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed pl-7">
                        {step.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Checklist */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900 flex items-center space-x-1.5">
                  <CheckSquare className="w-4 h-4 text-emerald-600" />
                  <span>Mandatory Document Enclosures Checklist:</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {activeGuide.checklist.map((item, idx) => (
                    <div key={idx} className="flex items-start space-x-2 bg-white p-2.5 rounded-lg border border-slate-200 text-slate-700">
                      <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0 mt-1.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submission Address */}
              <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-950 flex items-center space-x-2">
                <Building2 className="w-4 h-4 text-amber-800 shrink-0" />
                <span><strong>Dossier Submission Office:</strong> {activeGuide.nodal_submission}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 6: COURT-WISE STAMP CHART */}
      {mainView === 'stamps' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-amber-900 text-white rounded-2xl p-6 shadow-xl border border-amber-500/30 space-y-2">
            <h2 className="font-serif font-bold text-xl text-white">
              {locale === 'hi' 
                ? 'कोर्ट-वार वकालतनामा स्टाम्प रेडी-रेकनर (Court-wise Stamp Reckoner)' 
                : 'Court-wise Vakalatnama Stamp Ready-Reckoner for Alwar Advocates'}
            </h2>
            <p className="text-xs text-amber-200 max-w-3xl leading-relaxed">
              Statutory schedule of mandatory welfare stamps, court fees, and local bar stamps to be affixed on Vakalatnamas across Civil, Criminal, Revenue, and Commercial Courts in Alwar district.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-white font-serif uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="p-4">न्यायालय का नाम (Court Name)</th>
                    <th className="p-4 text-center">RAWF स्टाम्प</th>
                    <th className="p-4 text-center">कोर्ट फीस</th>
                    <th className="p-4 text-center">बार टिकट</th>
                    <th className="p-4 text-center">कुल राशि</th>
                    <th className="p-4">विशेष विधिक टिप्पणी (Notes)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {stampRules.map((rule, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition">
                      <td className="p-4 font-semibold text-slate-900">
                        <div>{rule.court_name_hi}</div>
                        <div className="text-[10px] text-slate-500 font-normal">{rule.court_name}</div>
                      </td>
                      <td className="p-4 text-center font-bold text-rose-700 font-mono text-sm bg-rose-50/40">
                        {rule.rawf_stamp_amount}
                      </td>
                      <td className="p-4 text-center font-mono text-slate-700">
                        {rule.court_fee_amount}
                      </td>
                      <td className="p-4 text-center font-mono text-slate-700">
                        {rule.bar_stamp_amount}
                      </td>
                      <td className="p-4 text-center font-bold text-slate-900 font-mono text-sm bg-amber-50/60">
                        {rule.total_standard_cost}
                      </td>
                      <td className="p-4 text-slate-600 leading-relaxed text-[11px]">
                        {rule.notes}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Statutory Exemptions Note */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 text-xs text-slate-600 space-y-1">
              <strong className="text-slate-900 block font-semibold">वैधानिक छूट (Statutory Exemptions under Section 27 Proviso):</strong>
              <div>• जिला विधिक सेवा प्राधिकरण (DLSA) एवं निःशुल्क विधिक सहायता पैनल अधिवक्ताओं द्वारा प्रस्तुत वकालतनामे।</div>
              <div>• राज्य सरकार की ओर से प्रस्तुत होने वाले लोक अभियोजक (PP), सहायक लोक अभियोजक (APP) एवं राजकीय अधिवक्ता।</div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 7: WELFARE FAQS */}
      {mainView === 'faqs' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-cyan-950 via-slate-900 to-cyan-900 text-white rounded-2xl p-6 shadow-xl border border-cyan-500/30 space-y-3">
            <h2 className="font-serif font-bold text-xl text-white">
              {locale === 'hi' 
                ? 'अक्सर पूछे जाने वाले विधिक एवं प्रक्रियात्मक प्रश्न (Welfare FAQs)' 
                : 'Frequently Asked Questions on RAWF & Welfare Entitlements'}
            </h2>
            <p className="text-xs text-cyan-200 max-w-3xl leading-relaxed">
              Clear legal answers regarding Income Tax exemptions on claim amounts, state transfers, nominee changes, sub-5-year rules, and cashless health card procedures.
            </p>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {[
                { id: 'ALL', label: 'समस्त प्रश्न (All)' },
                { id: 'tax', label: 'आयकर / टैक्स (Tax)' },
                { id: 'eligibility', label: 'पात्रता व स्लैब (Eligibility)' },
                { id: 'nominee', label: 'नॉमिनी नियम (Nominee)' },
                { id: 'process', label: 'प्रक्रिया व ई-कार्ड (Process)' },
                { id: 'transfer', label: 'राज्य ट्रांसफर (Transfer)' }
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveFaqCat(cat.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                    activeFaqCat === cat.id
                      ? 'bg-cyan-600 text-white'
                      : 'bg-white/10 text-slate-300 hover:bg-white/20'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {filteredFaqs.map((faq, idx) => {
              const isExpanded = expandedFaqIdx === idx;
              return (
                <div
                  key={idx}
                  className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm transition hover:border-cyan-400"
                >
                  <button
                    onClick={() => setExpandedFaqIdx(isExpanded ? null : idx)}
                    className="w-full p-4 text-left font-serif font-bold text-sm text-slate-900 flex items-center justify-between gap-3"
                  >
                    <span>{locale === 'hi' ? faq.question_hi : faq.question_en}</span>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition transform ${isExpanded ? 'rotate-180 text-cyan-700' : ''}`} />
                  </button>

                  {isExpanded && (
                    <div className="p-4 pt-0 text-xs text-slate-700 border-t border-slate-100 bg-cyan-50/30 leading-relaxed space-y-2">
                      <p className="font-medium text-slate-800">
                        {locale === 'hi' ? faq.answer_hi : faq.answer_en}
                      </p>
                      <p className="text-[11px] text-slate-500 italic">
                        {locale === 'hi' ? faq.answer_en : faq.answer_hi}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 8: ALWAR JUDGESHIP BAR ASSOCIATIONS & DUES */}
      {mainView === 'dues' && (
        <div className="space-y-6">
          <div className="bg-purple-950 text-white rounded-2xl p-6 shadow-xl border border-purple-500/30 space-y-3">
            <h2 className="font-serif font-bold text-xl text-white">
              {locale === 'hi' 
                ? 'अलवर न्यायिक क्षेत्र की समस्त मान्यता प्राप्त बार एसोसिएशन (18)' 
                : 'Recognized Bar Associations under Alwar Judgeship'}
            </h2>
            <p className="text-xs text-purple-200 max-w-3xl leading-relaxed">
              Under Section 16 of the Rajasthan Advocates Welfare Fund Act, 1987, every advocate must belong to a recognized Bar Association. Below are the 18 registered Bar Associations in Alwar Judgeship with direct connection to the BCR Dues List generator.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Select Your Local Bar Association:</h3>
                <p className="text-xs text-slate-500">Choose below to verify and generate official BCR dues report</p>
              </div>

              <a
                href="https://barcouncilofrajasthan.org/rawf/dues-list"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-purple-800 hover:bg-purple-900 text-white rounded-lg text-xs font-semibold shadow-sm transition inline-flex items-center space-x-1.5 shrink-0"
              >
                <span>Generate Official Dues at BCR</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* 18 BAR ASSOCIATIONS BUTTONS WITH DUES BADGES */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 pt-2">
              {alwarBars.map(bar => {
                const info = allBarsSummary[bar];
                const isSelected = selectedBar === bar;
                return (
                  <button
                    key={bar}
                    onClick={() => {
                      setSelectedBar(bar);
                      setDuesPage(1);
                      setDuesSearch('');
                    }}
                    className={`p-3 rounded-xl border text-xs text-left sm:text-center transition flex flex-col justify-between ${
                      isSelected
                        ? 'bg-purple-900 border-purple-900 text-white font-bold shadow-md ring-2 ring-purple-400'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-purple-300 hover:bg-purple-50/50 shadow-sm'
                    }`}
                  >
                    <div>
                      <Building2 className={`w-4 h-4 mx-auto mb-1 ${isSelected ? 'text-amber-300' : 'text-slate-400'}`} />
                      <div className="font-bold text-[12px] leading-tight">{bar}</div>
                    </div>
                    {info ? (
                      <div className="mt-2 pt-1.5 border-t border-slate-100/30 flex items-center justify-between sm:justify-center gap-1.5 text-[10px]">
                        <span className={`px-1.5 py-0.5 rounded font-mono font-bold ${
                          info.dues_pending_count > 0 
                            ? (isSelected ? 'bg-amber-400 text-slate-900' : 'bg-amber-100 text-amber-900 border border-amber-300')
                            : (isSelected ? 'bg-emerald-400 text-slate-900' : 'bg-emerald-100 text-emerald-900')
                        }`}>
                          {info.dues_pending_count} Due{info.dues_pending_count === 1 ? '' : 's'}
                        </span>
                        <span className={`${isSelected ? 'text-purple-200' : 'text-slate-400'} font-mono`}>
                          ({info.total_advocates})
                        </span>
                      </div>
                    ) : (
                      <div className="mt-2 text-[10px] text-slate-400">Loading...</div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* LIVE BCR DUES REGISTER FOR THE CURRENTLY SELECTED BAR */}
            <div className="space-y-4 pt-4 border-t border-slate-200">
              {/* Official BCR Dues Header */}
              <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-5 shadow-lg border border-purple-400/20">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="inline-flex items-center space-x-1.5 bg-purple-800/80 text-purple-200 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                      <Shield className="w-3 h-3 text-purple-300" />
                      <span>बार काउंसिल ऑफ राजस्थान — राजस्थान अधिवक्ता कल्याण निधि (R.A.W.F.)</span>
                    </div>
                    <h4 className="font-serif font-bold text-lg text-white">
                      Showing Complete List of Advocates Due Subscription of R.A.W.F.
                    </h4>
                    <p className="text-xs text-purple-200">
                      Judgeship: <span className="font-bold text-white">ALWAR</span> | Bar Association: <span className="font-bold text-amber-300 text-sm">{selectedBar}</span> | Report Date: <span className="font-mono text-emerald-300 font-bold">01-11-2026</span> | Official BCR Record
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <a
                      href={currentBarPdfUrl}
                      download={`bcr-dues-${selectedBar.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pdf`}
                      target="_blank"
                      className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition inline-flex items-center space-x-2"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Official {selectedBar} PDF ({duesSummary.total} Advocates)</span>
                    </a>
                    <a
                      href="https://barcouncilofrajasthan.org/rawf/dues-list"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-medium transition inline-flex items-center space-x-1.5 border border-white/20"
                    >
                      <span>BCR Online Portal</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                {/* Summary KPI Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-4 border-t border-purple-500/20 mt-4 text-xs">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
                    <div className="text-[11px] text-purple-200">Total Registered</div>
                    <div className="text-xl font-bold font-mono text-white mt-0.5">{duesSummary.total.toLocaleString()}</div>
                    <div className="text-[10px] text-purple-300">{selectedBar} Bar Roll</div>
                  </div>
                  <div className="bg-emerald-950/60 backdrop-blur-sm rounded-xl p-3 border border-emerald-500/30">
                    <div className="text-[11px] text-emerald-300 font-medium">Life Time Members</div>
                    <div className="text-xl font-bold font-mono text-emerald-400 mt-0.5">{duesSummary.ltm_count.toLocaleString()}</div>
                    <div className="text-[10px] text-emerald-300">₹0 Dues (L.T.M.)</div>
                  </div>
                  <div className="bg-sky-950/60 backdrop-blur-sm rounded-xl p-3 border border-sky-500/30">
                    <div className="text-[11px] text-sky-300 font-medium">Subscription Cleared</div>
                    <div className="text-xl font-bold font-mono text-sky-400 mt-0.5">{duesSummary.na_count.toLocaleString()}</div>
                    <div className="text-[10px] text-sky-300">N.A.* (Current / No Dues)</div>
                  </div>
                  <div className="bg-amber-950/60 backdrop-blur-sm rounded-xl p-3 border border-amber-500/30">
                    <div className="text-[11px] text-amber-300 font-medium">Outstanding Dues</div>
                    <div className="text-xl font-bold font-mono text-amber-400 mt-0.5">{duesSummary.dues_pending_count.toLocaleString()}</div>
                    <div className="text-[10px] text-amber-300">Action Required</div>
                  </div>
                  <div className="bg-rose-950/60 backdrop-blur-sm rounded-xl p-3 border border-rose-500/30">
                    <div className="text-[11px] text-rose-300 font-medium">Terminated / Inactive</div>
                    <div className="text-xl font-bold font-mono text-rose-400 mt-0.5">{duesSummary.termi_count.toLocaleString()}</div>
                    <div className="text-[10px] text-rose-300">Termi Status</div>
                  </div>
                </div>
              </div>

              {/* Filter and Search Bar */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  {/* Live Search Input */}
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={duesSearch}
                      onChange={(e) => {
                        setDuesSearch(e.target.value);
                        setDuesPage(1);
                      }}
                      placeholder={`Search by Advocate Name, Enrolment (e.g. R/...), or Electoral Roll No in ${selectedBar}...`}
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition"
                    />
                    {duesSearch && (
                      <button
                        onClick={() => {
                          setDuesSearch('');
                          setDuesPage(1);
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full w-5 h-5 flex items-center justify-center transition"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Total Matching Badge */}
                  <div className="text-xs text-slate-600 shrink-0 font-medium px-2 py-1 bg-white rounded-lg border border-slate-200">
                    Found: <strong className="text-purple-900">{duesTotalMatching.toLocaleString()}</strong> Advocates in {selectedBar}
                  </div>
                </div>

                {/* Category Filter Pills */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {[
                    { id: 'ALL', label: `All Advocates (${duesSummary.total})` },
                    { id: 'ltm', label: `Life Time Members (${duesSummary.ltm_count})`, color: 'emerald' },
                    { id: 'dues_pending', label: `Outstanding Dues (${duesSummary.dues_pending_count})`, color: 'amber' },
                    { id: 'na', label: `Subscription Cleared (${duesSummary.na_count})`, color: 'sky' },
                    { id: 'termi', label: `Terminated (${duesSummary.termi_count})`, color: 'rose' }
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setDuesCategory(cat.id);
                        setDuesPage(1);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                        duesCategory === cat.id
                          ? 'bg-purple-900 text-white shadow-sm'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Advocates Dues Register Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm bg-white">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                      <th className="py-3 px-3 w-16 text-center">S.No.</th>
                      <th className="py-3 px-3">Enrolment No. (Sanad)</th>
                      <th className="py-3 px-3">Electoral Roll No.</th>
                      <th className="py-3 px-4">Name as on the Roll</th>
                      <th className="py-3 px-3">RAWF Due Subscription</th>
                      <th className="py-3 px-3 text-right">LTM Subs</th>
                      <th className="py-3 px-3 text-center">Verification</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {duesLoading ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-500">
                          <div className="flex flex-col items-center justify-center space-y-2">
                            <Loader2 className="w-6 h-6 text-purple-700 animate-spin" />
                            <span className="text-xs">Loading official BCR dues register for {selectedBar}...</span>
                          </div>
                        </td>
                      </tr>
                    ) : duesRecords.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-500">
                          <div className="space-y-1">
                            <AlertCircle className="w-6 h-6 text-slate-400 mx-auto" />
                            <p className="font-medium text-slate-700">No advocates found matching your query in {selectedBar}</p>
                            <p className="text-xs text-slate-400">Try searching with enrolment number (e.g. R/...) or name</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      duesRecords.map((r) => (
                        <tr key={r.s_no} className="hover:bg-purple-50/50 transition">
                          <td className="py-3 px-3 text-center font-mono text-slate-500 font-medium">
                            #{r.s_no}
                          </td>
                          <td className="py-3 px-3">
                            <Link
                              href={`/verify?enrollment=${encodeURIComponent(r.enrol_no)}`}
                              className="font-mono font-bold text-purple-700 hover:text-purple-950 hover:underline inline-flex items-center space-x-1"
                              title="Click to verify statutory status and profile"
                            >
                              <span>{r.enrol_no}</span>
                              <ExternalLink className="w-3 h-3 text-purple-400" />
                            </Link>
                          </td>
                          <td className="py-3 px-3 font-mono text-slate-600 font-semibold">
                            {r.elc_no}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900">{r.name}</div>
                            <div className="text-[10px] text-slate-400">Bar: {selectedBar} • Judgeship: Alwar</div>
                          </td>
                          <td className="py-3 px-3">
                            {r.category === 'ltm' ? (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600 shrink-0" />
                                <span>₹0 — Life Time Member (L.T.M.)</span>
                              </span>
                            ) : r.category === 'na' ? (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-sky-50 text-sky-800 border border-sky-200">
                                <Check className="w-3 h-3 mr-1 text-sky-600 shrink-0" />
                                <span>N.A.* (Current / No Dues)</span>
                              </span>
                            ) : r.category === 'dues_pending' ? (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                <AlertCircle className="w-3 h-3 mr-1 text-amber-600 shrink-0" />
                                <span>₹{r.due_subs}</span>
                              </span>
                            ) : r.category === 'termi' ? (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-800 border border-rose-200">
                                Terminated
                              </span>
                            ) : (
                              <span className="text-slate-600 font-medium">{r.due_subs}</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-medium text-slate-600">
                            {r.ltm_subs ? (
                              <span className="font-bold text-slate-800">₹{r.ltm_subs}</span>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <Link
                              href={`/verify?enrollment=${encodeURIComponent(r.enrol_no)}`}
                              className="inline-flex items-center space-x-1 px-3 py-1 bg-purple-50 hover:bg-purple-100 text-purple-800 rounded-lg text-xs font-semibold border border-purple-200 transition"
                            >
                              <span>Verify</span>
                              <ChevronRight className="w-3 h-3" />
                            </Link>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {duesTotalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200 text-xs">
                  <div className="text-slate-600 font-medium">
                    Showing{' '}
                    <strong>{((duesPage - 1) * 25) + 1}</strong> to{' '}
                    <strong>{Math.min(duesPage * 25, duesTotalMatching)}</strong> of{' '}
                    <strong>{duesTotalMatching.toLocaleString()}</strong> advocates in {selectedBar}
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => setDuesPage((p) => Math.max(1, p - 1))}
                      disabled={duesPage <= 1}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center space-x-1 font-semibold transition"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Previous</span>
                    </button>

                    {/* Quick Page Jump Buttons */}
                    <span className="px-3 py-1.5 rounded-lg bg-purple-900 text-white font-bold font-mono">
                      {duesPage} / {duesTotalPages}
                    </span>

                    <button
                      onClick={() => setDuesPage((p) => Math.min(duesTotalPages, p + 1))}
                      disabled={duesPage >= duesTotalPages}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center space-x-1 font-semibold transition"
                    >
                      <span>Next</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 9: HELPDESK REQUISITION FORM */}
      {mainView === 'helpdesk' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-teal-950 via-slate-900 to-teal-900 text-white rounded-2xl p-6 shadow-xl border border-teal-500/30 space-y-2">
            <h2 className="font-serif font-bold text-xl text-white">
              {locale === 'hi' 
                ? 'अलवर बार कल्याण सहायता डेस्क — ऑनलाइन अर्जी एवं परामर्श' 
                : 'Alwar Bar Welfare Helpdesk — Direct Assistance & Inquiry Requisition'}
            </h2>
            <p className="text-xs text-teal-200 max-w-3xl leading-relaxed">
              If you or an advocate family member requires urgent assistance with Death Claims, Critical Illness aid, Nominee Updation, or Mediclaim Card, submit your request below for prompt follow-up.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <h3 className="font-serif font-bold text-base text-slate-900">
                {locale === 'hi' ? 'कल्याण सहायता पूछताछ फॉर्म' : 'Submit Welfare Inquiry / Assistance Request'}
              </h3>

              {helpResponse && (
                <div className={`p-4 rounded-xl border text-xs space-y-1 ${
                  helpResponse.success 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-950' 
                    : 'bg-rose-50 border-rose-200 text-rose-950'
                }`}>
                  <div className="font-bold flex items-center space-x-1.5">
                    {helpResponse.success ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
                    <span>{helpResponse.success ? 'सफलतापूर्वक दर्ज (Ticket Generated)' : 'त्रुटि (Error)'}</span>
                  </div>
                  <p>{helpResponse.message}</p>
                  {helpResponse.ticket_id && (
                    <div className="font-mono text-emerald-800 font-bold pt-1">
                      ट्रैकिंग टिकट संख्या: {helpResponse.ticket_id}
                    </div>
                  )}
                </div>
              )}

              <form onSubmit={handleHelpdeskSubmit} className="space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      आपका नाम (Full Name) *
                    </label>
                    <input
                      type="text"
                      required
                      value={helpName}
                      onChange={e => setHelpName(e.target.value)}
                      placeholder="e.g. Ramesh Kumar Sharma"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      सनद / नामांकन संख्या (Sanad / Enrolment No.)
                    </label>
                    <input
                      type="text"
                      value={helpEnrollment}
                      onChange={e => setHelpEnrollment(e.target.value)}
                      placeholder="e.g. R/1420/2012 (वैकल्पिक)"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      संपर्क मोबाइल नंबर (Contact Phone) *
                    </label>
                    <input
                      type="tel"
                      required
                      value={helpPhone}
                      onChange={e => setHelpPhone(e.target.value)}
                      placeholder="e.g. 98290XXXXX"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      सहायता का प्रकार (Query Type) *
                    </label>
                    <select
                      value={helpQueryType}
                      onChange={e => setHelpQueryType(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                    >
                      <option>Death Claim Guidance (मृत्यु दावा मार्गदर्शन)</option>
                      <option>Critical Illness Aid (गंभीर बीमारी आपातकालीन सहायता)</option>
                      <option>Retirement Claim Process (सेवानिवृत्ति क्लेम)</option>
                      <option>Nominee Updation (नॉमिनी परिवर्तन/अपडेट)</option>
                      <option>Mediclaim Cashless E-Card (स्वास्थ्य बीमा ई-कार्ड)</option>
                      <option>Membership Revival (सदस्यता पुनर्जीवन/नवीनीकरण)</option>
                      <option>General Welfare Query (सामान्य पूछताछ)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    समस्या अथवा विवरण (Details / Message)
                  </label>
                  <textarea
                    rows={3}
                    value={helpMessage}
                    onChange={e => setHelpMessage(e.target.value)}
                    placeholder="कृपया अपनी समस्या या आवश्यक मार्गदर्शन का संक्षिप्त विवरण लिखें..."
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={helpSubmitting}
                  className="px-5 py-2.5 bg-teal-800 hover:bg-teal-900 text-white rounded-lg font-semibold shadow-sm transition inline-flex items-center space-x-2 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{helpSubmitting ? 'दर्ज किया जा रहा है...' : 'सहायता अर्जी सबमिट करें'}</span>
                </button>
              </form>
            </div>

            {/* Direct Contact Card */}
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 space-y-4 text-xs">
              <h3 className="font-bold text-sm text-slate-900">
                सीधे संपर्क सूत्र (Direct Contacts):
              </h3>
              <div className="space-y-3 text-slate-700">
                <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                  <strong className="text-teal-900 block font-semibold">अलवर बार वेलफेयर काउंटर</strong>
                  <div>चैंबर सं. 1, सिविल विंग, जिला कोर्ट, अलवर</div>
                  <div>📞 0144-2334455 / 9829054321</div>
                  <div>समय: 10:30 AM से 4:30 PM (अदालती दिवस)</div>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                  <strong className="text-teal-900 block font-semibold">ट्रस्टी कमेटी, जोधपुर</strong>
                  <div>राजस्थान उच्च न्यायालय भवन, जोधपुर - 342006</div>
                  <div>📞 0291-2545062 / 0291-2545064</div>
                  <div>ईमेल: secretary@barcouncilofrajasthan.org</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. NODAL HELPLINES & BAR CONTACT DESK */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 space-y-4">
        <h3 className="font-serif font-bold text-lg text-white">
          {locale === 'hi' ? 'अलवर बार एवं ट्रस्टी कमेटी कल्याण सहायता डेस्क' : 'Welfare Assistance & Grievance Desks'}
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
          For claim status inquiries, life certificate stamping, or urgent ex-gratia medical processing, advocates or family nominees may contact:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300 pt-1">
          <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-1">
            <strong className="text-amber-300 block text-sm">Alwar Bar Association Welfare Counter</strong>
            <div>Office: Chamber No. 1, Civil Wing, District Court Campus, Alwar</div>
            <div>Phone: 0144-2334455 / Email: welfare@alwarbar.in</div>
            <div>Timings: 10:30 AM to 4:30 PM (Court Working Days)</div>
          </div>

          <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-1">
            <strong className="text-amber-300 block text-sm">Trustee Committee, Bar Council of Rajasthan</strong>
            <div>High Court Building Campus, Jodhpur - 342006</div>
            <div>Phone: 0291-2545062 / Web: barcouncilofrajasthan.org</div>
            <div>Nodal Officer: Secretary, Advocates Welfare Fund Committee</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WelfarePage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-16 text-center text-slate-400 text-sm">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-700" />
        <span>Loading Advocate Welfare Schemes & Live Bulletins...</span>
      </div>
    }>
      <WelfareContent />
    </Suspense>
  );
}
