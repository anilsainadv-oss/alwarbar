'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  ShieldCheck, CheckCircle2, UserCheck, Stethoscope, Award, 
  MapPin, Briefcase, Phone, Mail, FileText, Download, Printer, 
  Share2, ExternalLink, ArrowLeft, ArrowUpRight, Check, AlertCircle,
  Building2, Calendar, FileSpreadsheet, Loader2, Sparkles, Scale
} from 'lucide-react';

interface AdvocateVerificationData {
  found: boolean;
  source?: 'local_directory' | 'bcr_statutory_validation';
  name?: string;
  enrollment?: string;
  bar_association?: string;
  chamber_address?: string;
  court_practice?: string;
  experience_years?: number;
  electoral_no?: string;
  bcr_s_no?: number;
  due_subs?: string;
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
}

function VerifyAdvocateContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const queryEnrollment = searchParams.get('enrollment') || searchParams.get('check') || 'R/2268/2009';
  const [inputVal, setInputVal] = useState(queryEnrollment);
  const [data, setData] = useState<AdvocateVerificationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [verifyDate, setVerifyDate] = useState('01 November 2026');

  useEffect(() => {
    setVerifyDate(new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }));
  }, []);

  const fetchAdvocateDetails = async (enrollmentNo: string) => {
    if (!enrollmentNo.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/public/welfare/verify?enrollment=${encodeURIComponent(enrollmentNo.trim())}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      setData({
        found: false,
        enrollment: enrollmentNo,
        message: 'Network error communicating with verification server.'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (queryEnrollment) {
      setInputVal(queryEnrollment);
      fetchAdvocateDetails(queryEnrollment);
    }
  }, [queryEnrollment]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    router.push(`/verify?enrollment=${encodeURIComponent(inputVal.trim())}`);
  };

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-16">
      {/* Top Bar with Navigation */}
      <div className="bg-slate-900 text-white print:hidden border-b border-slate-800">
        <div className="max-w-5xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/welfare"
            className="inline-flex items-center space-x-1.5 text-xs text-slate-300 hover:text-white transition font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Welfare Portal</span>
          </Link>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopyLink}
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition inline-flex items-center space-x-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5 text-amber-400" />}
              <span>{copied ? 'Link Copied!' : 'Copy Direct Link'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-xs font-semibold text-white transition inline-flex items-center space-x-1.5 shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Verification Search Bar (Hidden during Print) */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm print:hidden">
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={inputVal}
                onChange={e => setInputVal(e.target.value)}
                placeholder="Enter Bar Council Enrollment No (e.g. R/2268/2009 or R/1420/2012)..."
                className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono shadow-inner"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !inputVal.trim()}
              className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-semibold transition shrink-0 inline-flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <UserCheck className="w-4 h-4 text-amber-400" />
                  <span>Verify Enrollment</span>
                </>
              )}
            </button>
          </form>

          {/* Quick chip pills */}
          <div className="flex flex-wrap items-center gap-1.5 pt-2 text-[11px] text-slate-500">
            <span className="font-semibold text-slate-400">Sample Records:</span>
            {[
              { code: 'R/2268/2009', label: 'R/2268/2009 (Adv. Anil Sain)' },
              { code: 'R/1420/2012', label: 'R/1420/2012 (Adv. Rajesh)' },
              { code: 'R/2890/2018', label: 'R/2890/2018 (Adv. Sunita)' },
              { code: 'R/1122/2008', label: 'R/1122/2008 (Adv. Rameshwar)' },
              { code: 'R/3451/2018', label: 'R/3451/2018 (Adv. Pooja)' }
            ].map(c => (
              <button
                key={c.code}
                type="button"
                onClick={() => {
                  setInputVal(c.code);
                  router.push(`/verify?enrollment=${encodeURIComponent(c.code)}`);
                }}
                className={`px-2 py-0.5 rounded font-mono text-[10px] border transition ${
                  inputVal === c.code 
                    ? 'bg-amber-100 text-amber-900 border-amber-300 font-bold' 
                    : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-600'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* LOADING STATE */}
        {(loading || !data) && (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-amber-600 animate-spin mx-auto" />
            <p className="text-sm font-semibold text-slate-700">
              Querying Bar Council of Rajasthan &amp; Alwar Bar Registers...
            </p>
          </div>
        )}

        {/* VERIFICATION REPORT CERTIFICATE */}
        {!loading && data && data.found && (
          <div className="bg-white rounded-3xl border-2 border-slate-300 shadow-xl overflow-hidden print:border-none print:shadow-none">
            {/* Top Official Header Band */}
            <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950 text-white p-6 sm:p-8 border-b-4 border-amber-600 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2 text-xs font-mono uppercase tracking-wider text-amber-400">
                    <Scale className="w-4 h-4" />
                    <span>Bar Council of Rajasthan • Alwar Judicial District</span>
                  </div>
                  <h1 className="font-serif font-bold text-2xl sm:text-3xl text-white tracking-wide">
                    Official Advocate Verification &amp; Statutory Welfare Dossier
                  </h1>
                  <p className="text-xs text-slate-300">
                    Verified under the Advocates Act, 1961 &amp; Rajasthan Advocates Welfare Fund Act, 1987 (Act No. 15 of 1987 as amended)
                  </p>
                </div>

                <div className="flex flex-col items-start sm:items-end shrink-0">
                  <span className="font-mono text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 px-3 py-1 rounded-full font-bold flex items-center space-x-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Active Verified Standing</span>
                  </span>
                  <span className="text-[10px] text-slate-400 mt-1 font-mono">
                    Ref: VER-RAWF-{data.enrollment?.replace(/[\/\s]/g, '-')}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-8 space-y-8">
              {/* Advocate Identity Profile Card */}
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-slate-200">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200">
                      Advocate at Law
                    </span>
                    <span className="text-xs font-bold font-mono px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-900 border border-blue-200">
                      Sanad No: {data.enrollment}
                    </span>
                    {data.electoral_no && (
                      <span className="text-xs font-bold font-mono px-2.5 py-0.5 rounded-md bg-purple-100 text-purple-900 border border-purple-200">
                        Electoral Roll No: {data.electoral_no}
                      </span>
                    )}
                    {data.bcr_s_no && (
                      <span className="text-xs font-bold font-mono px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200">
                        BCR Register S.No: #{data.bcr_s_no}
                      </span>
                    )}
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700">
                      {data.experience_years} Years Legal Practice
                    </span>
                  </div>

                  <h2 className="font-serif font-bold text-2xl sm:text-3xl text-slate-900">
                    {data.name}
                  </h2>

                  <div className="space-y-1 text-xs text-slate-600">
                    <div className="flex items-center space-x-1.5">
                      <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                      <span><strong>Bar Association:</strong> {data.bar_association}</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                      <span><strong>Chamber &amp; Complex:</strong> {data.chamber_address} • {data.court_practice}</span>
                    </div>
                  </div>
                </div>

                {/* Right Badge Box */}
                <div className="w-full md:w-auto p-4 rounded-2xl bg-amber-50/70 border border-amber-200 shrink-0 space-y-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-amber-900 flex items-center space-x-1.5">
                    <ShieldCheck className="w-4 h-4 text-amber-700" />
                    <span>Statutory Certification</span>
                  </div>
                  <div className="text-xs text-slate-700 space-y-1 font-medium">
                    <div>• Verified by: <strong>Bar Council Records</strong></div>
                    <div>• Life Continuity: <strong className="text-emerald-700">{data.welfare_validity}</strong></div>
                    <div>• Vakalatnama Stamp: <strong className="text-slate-900">₹140 Order Compliant</strong></div>
                  </div>
                </div>
              </div>

              {/* 4-Pillar Statutory Welfare Entitlement Grid */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif font-bold text-lg text-slate-900 flex items-center space-x-2">
                    <Award className="w-5 h-5 text-amber-700" />
                    <span>Statutory Welfare Entitlements (RAWF Act, 1987)</span>
                  </h3>
                  <span className="text-xs text-slate-500 font-mono">
                    Amended up to Act No. 13 of 2022
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Pillar 1: Retirement / Demise Benefit */}
                  <div className="bg-gradient-to-br from-blue-50 to-white p-4 rounded-2xl border border-blue-200 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 block">
                      Retirement &amp; Demise Benefit
                    </span>
                    <div className="font-serif font-bold text-xl text-blue-950">
                      {data.calculated_slab}
                    </div>
                    <p className="text-[11px] text-slate-600 leading-snug">
                      Statutory lump sum compassionate disbursement under Section 17 &amp; Schedule for {data.experience_years} completed years of active practice.
                    </p>
                  </div>

                  {/* Pillar 2: Cashless Mediclaim */}
                  <div className="bg-gradient-to-br from-rose-50 to-white p-4 rounded-2xl border border-rose-200 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 block">
                      Annual Cashless Health Cover
                    </span>
                    <div className="font-serif font-bold text-xl text-rose-950">
                      ₹5,00,000 / Year
                    </div>
                    <p className="text-[11px] text-slate-600 leading-snug">
                      {data.cashless_cover}. Valid across 10 network hospitals in Alwar, Bhiwadi, Behror &amp; Jaipur referral centers.
                    </p>
                  </div>

                  {/* Pillar 3: Accidental Insurance */}
                  <div className="bg-gradient-to-br from-emerald-50 to-white p-4 rounded-2xl border border-emerald-200 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
                      Accidental Demise &amp; Disability
                    </span>
                    <div className="font-serif font-bold text-xl text-emerald-950">
                      ₹10,00,000 Lump Sum
                    </div>
                    <p className="text-[11px] text-slate-600 leading-snug">
                      {data.accidental_cover}. Round-the-clock compensation for vehicular accidents or mishaps while on professional duties.
                    </p>
                  </div>

                  {/* Pillar 4: Vakalatnama Stamp Compliance */}
                  <div className="bg-gradient-to-br from-amber-50 to-white p-4 rounded-2xl border border-amber-200 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">
                      Court Stamp Rule (₹140)
                    </span>
                    <div className="font-serif font-bold text-xl text-amber-950">
                      Fully Compliant
                    </div>
                    <p className="text-[11px] text-slate-600 leading-snug">
                      {data.stamp_compliance}. Mandatory adherence on every Vakalatnama filed before Civil, Criminal &amp; Revenue benches in Alwar.
                    </p>
                  </div>
                </div>
              </div>

              {/* Nominee & Legal Rights Protection Card */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    Statutory Nominee Protection Status
                  </span>
                  <div className="font-bold text-slate-900 text-sm flex items-center space-x-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>{data.nominee_status}</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Benefits are directly disbursed to the registered nominee under Section 16 via RTGS within 45 days of Trustee Committee sanction.
                  </p>
                </div>

                <div className="shrink-0 flex items-center space-x-2 print:hidden">
                  <a
                    href="https://barcouncilofrajasthan.org/downloading.aspx?file=3.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 transition inline-flex items-center space-x-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Nominee Form (Form 3)</span>
                  </a>
                </div>
              </div>

              {/* Official Bar Council Portals Section */}
              <div className="space-y-3 print:hidden">
                <h3 className="font-serif font-bold text-base text-slate-900">
                  Direct Live Bar Council of Rajasthan (BCR Jodhpur) Verification Portals:
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <a
                    href={data.bcr_dues_link || 'https://barcouncilofrajasthan.org/rawf/dues-list'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-4 rounded-xl bg-white border border-slate-200 hover:border-emerald-500 hover:shadow-md transition group flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-bold text-emerald-800 flex items-center space-x-1">
                        <span>Check Live RAWF Dues Status</span>
                        <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Verify subscription balance directly on official Bar Council of Rajasthan server.
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md shrink-0">
                      Open Portal →
                    </span>
                  </a>

                  <a
                    href={data.bcr_portal_link || 'https://barcouncilofrajasthan.org/Advocate/'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-4 rounded-xl bg-white border border-slate-200 hover:border-blue-500 hover:shadow-md transition group flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-bold text-blue-800 flex items-center space-x-1">
                        <span>BCR Online Advocate Portal Login</span>
                        <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Apply online for Ex-Gratia claims, Death claims, and Retirement Cessation.
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md shrink-0">
                      Login →
                    </span>
                  </a>
                </div>
              </div>

              {/* Statutory Claim Forms 1-Click Downloads */}
              <div className="space-y-3 print:hidden">
                <h3 className="font-serif font-bold text-base text-slate-900">
                  Official Statutory Claim Formats (Direct PDF Downloads):
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  <a
                    href="https://barcouncilofrajasthan.org/downloading.aspx?file=11.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-xl bg-white border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/30 transition flex items-center justify-between"
                  >
                    <div className="space-y-0.5">
                      <span className="font-bold text-slate-900 block">Form 11 (Demise Claim)</span>
                      <span className="text-[10px] text-slate-500">Compassionate Death Grant</span>
                    </div>
                    <Download className="w-4 h-4 text-indigo-700" />
                  </a>

                  <a
                    href="https://barcouncilofrajasthan.org/downloading.aspx?file=12.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-xl bg-white border border-slate-200 hover:border-rose-400 hover:bg-rose-50/30 transition flex items-center justify-between"
                  >
                    <div className="space-y-0.5">
                      <span className="font-bold text-slate-900 block">Form 12 (Critical Illness)</span>
                      <span className="text-[10px] text-slate-500">₹2,00,000 Emergency Grant</span>
                    </div>
                    <Download className="w-4 h-4 text-rose-700" />
                  </a>

                  <a
                    href="https://barcouncilofrajasthan.org/downloading.aspx?file=39.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-xl bg-white border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/30 transition flex items-center justify-between"
                  >
                    <div className="space-y-0.5">
                      <span className="font-bold text-slate-900 block">RAWF Act 1987 (Full Act)</span>
                      <span className="text-[10px] text-slate-500">Updated with 2022 Amendment</span>
                    </div>
                    <Download className="w-4 h-4 text-emerald-700" />
                  </a>
                </div>
              </div>

              {/* Official Seal Footer */}
              <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Digitally verified via Alwar Advocates Judicial Portal &amp; Bar Council of Rajasthan Repository.</span>
                </div>
                <span className="font-mono text-[11px] text-slate-400">
                  Verification Date: {verifyDate}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* NOT FOUND STATE */}
        {!loading && data && !data.found && (
          <div className="bg-amber-50 p-8 rounded-3xl border border-amber-200 text-center space-y-4">
            <AlertCircle className="w-10 h-10 text-amber-600 mx-auto" />
            <div className="space-y-1">
              <h2 className="font-serif font-bold text-xl text-amber-950">
                {data.message || `No record found for "${inputVal}"`}
              </h2>
              <p className="text-xs text-amber-800 max-w-md mx-auto leading-relaxed">
                Please verify your Bar Council Sanad number format. Example format: <code className="bg-amber-200/80 px-2 py-0.5 rounded font-mono font-bold">R/2268/2009</code> or <code className="bg-amber-200/80 px-2 py-0.5 rounded font-mono font-bold">R/1420/2012</code>.
              </p>
            </div>

            <div className="pt-2 flex justify-center gap-3">
              <a
                href="https://barcouncilofrajasthan.org/rawf/dues-list"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-amber-800 hover:bg-amber-900 text-white rounded-xl text-xs font-semibold shadow-sm inline-flex items-center space-x-1.5"
              >
                <span>Check Directly on BCR Dues Portal</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyAdvocatePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
      </div>
    }>
      <VerifyAdvocateContent />
    </Suspense>
  );
}
