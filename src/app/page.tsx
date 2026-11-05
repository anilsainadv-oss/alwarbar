'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/context';
import { 
  Search, Shield, BookOpen, FileText, ArrowRight, CheckCircle, 
  ExternalLink, Calendar, MapPin, Download, Lock, Bell, Scale
} from 'lucide-react';
import type { WelfareScheme, LegalUpdate, LegalForm, NoticeEvent } from '@/types/database';

export default function HomePage() {
  const { t, locale } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [welfareSchemes, setWelfareSchemes] = useState<WelfareScheme[]>([]);
  const [legalUpdates, setLegalUpdates] = useState<LegalUpdate[]>([]);
  const [legalForms, setLegalForms] = useState<LegalForm[]>([]);
  const [notices, setNotices] = useState<NoticeEvent[]>([]);

  useEffect(() => {
    fetch('/api/public/laws?limit=8')
      .then(res => res.json())
      .then(data => {
        if (data.laws) setLegalUpdates(data.laws);
      })
      .catch(console.error);

    fetch('/api/public/news?limit=4')
      .then(res => res.json())
      .then(data => {
        if (data.news) setNotices(data.news);
      })
      .catch(console.error);

    fetch('/api/public/search')
      .then(res => res.json())
      .then(data => {
        if (data.welfare) setWelfareSchemes(data.welfare);
        if (data.forms) setLegalForms(data.forms);
      })
      .catch(console.error);
  }, []);

  return (
    <div className="space-y-12 pb-16">
      {/* 1. HERO SECTION */}
      <section className="bg-gradient-to-b from-legal-navy via-legal-navy to-legal-navyLight text-white py-16 px-4 border-b border-legal-gold/30">
        <div className="container mx-auto max-w-5xl text-center space-y-6">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold">
            <span>🏛️ Alwar District Legal Information & Practice Platform</span>
          </div>

          <h1 className="font-serif font-extrabold text-3xl sm:text-5xl lg:text-6xl text-white tracking-tight leading-tight">
            {locale === 'hi' ? 'अलवर अधिवक्ता पोर्टल एवं विधिक कार्यालय' : 'Alwar Advocates Portal & Legal Tech Office'}
          </h1>

          <p className="max-w-3xl mx-auto text-sm sm:text-lg text-slate-300 font-light leading-relaxed">
            {locale === 'hi'
              ? 'अलवर एवं राजस्थान के अधिवक्ताओं हेतु प्रामाणिक विधिक सूचना, कल्याण योजनाएं, विधिक प्रारूप, पेशेवर विचार मंच तथा निजी माय केस एआई ऑफिस।'
              : 'Verified statutory updates, Rajasthan advocate welfare schemes, court practice formats, community forum, and an encrypted AI legal office for practicing advocates.'}
          </p>

          {/* Global Search Bar */}
          <div className="max-w-2xl mx-auto relative pt-4">
            <div className="flex items-center bg-white rounded-xl shadow-2xl p-1.5 border-2 border-legal-gold/50 focus-within:border-amber-400">
              <Search className="w-5 h-5 text-slate-400 ml-3 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="w-full px-3 py-2 text-slate-900 text-sm focus:outline-none placeholder-slate-400"
              />
              <Link
                href={`/laws?q=${encodeURIComponent(searchQuery)}`}
                className="px-5 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white rounded-lg text-xs font-semibold shadow transition shrink-0"
              >
                {locale === 'hi' ? 'खोजें' : 'Search'}
              </Link>
            </div>
          </div>

          {/* Quick Court Links Bar */}
          <div className="pt-6 flex flex-wrap items-center justify-center gap-3 text-xs">
            <span className="text-amber-200/80 font-medium">{t.quickActions}:</span>
            <a
              href="https://districts.ecourts.gov.in/alwar"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg border border-white/20 text-slate-200 hover:text-white transition flex items-center space-x-1"
            >
              <span>{t.causeLists}</span>
              <ExternalLink className="w-3 h-3 text-amber-300" />
            </a>
            <a
              href="https://services.ecourts.gov.in/ecourtindia_v6/"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg border border-white/20 text-slate-200 hover:text-white transition flex items-center space-x-1"
            >
              <span>{t.caseStatus}</span>
              <ExternalLink className="w-3 h-3 text-amber-300" />
            </a>
            <a
              href="https://efiling.ecourts.gov.in"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg border border-white/20 text-slate-200 hover:text-white transition flex items-center space-x-1"
            >
              <span>{t.efiling}</span>
              <ExternalLink className="w-3 h-3 text-amber-300" />
            </a>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 max-w-6xl space-y-16">
        {/* 2. ADVOCATE WELFARE HIGHLIGHTS */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b pb-4 border-slate-200">
            <div>
              <div className="flex items-center space-x-2 text-amber-700 font-bold text-xs uppercase tracking-wider">
                <Shield className="w-4 h-4" />
                <span>Advocate Welfare Fund Centre</span>
              </div>
              <h2 className="font-serif font-bold text-2xl text-slate-900 mt-1">
                {t.welfareHeading}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {t.welfareSub}
              </p>
            </div>
            <Link
              href="/welfare"
              className="text-xs font-semibold text-amber-800 hover:text-amber-900 flex items-center space-x-1 mt-2 sm:mt-0"
            >
              <span>{locale === 'hi' ? 'सभी कल्याण योजनाएं देखें' : 'View All Welfare Schemes'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {welfareSchemes.slice(0, 3).map(scheme => (
              <div
                key={scheme.id}
                className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between hover:shadow-md transition"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono bg-amber-50 text-amber-800 px-2 py-0.5 rounded border border-amber-200">
                      {scheme.issuing_authority.split('(')[0]}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Verified: {scheme.last_verified_date}
                    </span>
                  </div>

                  <h3 className="font-serif font-bold text-base text-slate-900 leading-snug">
                    {locale === 'hi' ? scheme.title_hi : scheme.title_en}
                  </h3>

                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                    {scheme.benefits_summary}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-amber-700 font-medium">
                    {scheme.deadline || 'Ongoing Scheme'}
                  </span>
                  <Link
                    href={`/welfare#${scheme.id}`}
                    className="text-amber-800 font-semibold hover:underline"
                  >
                    {t.viewDetails} →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 2.5 LATEST COURT NOTICES & CIRCULARS */}
        {notices.length > 0 && (
          <section className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b pb-4 border-slate-200">
              <div>
                <div className="flex items-center space-x-2 text-amber-800 font-bold text-xs uppercase tracking-wider">
                  <Bell className="w-4 h-4 text-amber-700" />
                  <span>District Court Circulars & Bar Notices</span>
                </div>
                <h2 className="font-serif font-bold text-2xl text-slate-900 mt-1">
                  {locale === 'hi' ? 'नवीनतम न्यायालयी परिपत्र एवं विधिक सूचनाएं' : 'Latest Court Notices, Recess Schedules & CLE'}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Official announcements from District & Sessions Court Alwar, Bar Council of Rajasthan, and eCourts
                </p>
              </div>
              <Link
                href="/news"
                className="text-xs font-semibold text-amber-900 hover:text-amber-950 flex items-center space-x-1 mt-2 sm:mt-0"
              >
                <span>{locale === 'hi' ? 'समस्त सूचनाएं देखें' : 'View All Notices & News'}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {notices.slice(0, 4).map(notice => (
                <div
                  key={notice.id}
                  className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between hover:border-amber-400 transition"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        notice.category === 'court_notice' ? 'bg-red-50 text-red-800 border border-red-200' :
                        notice.category === 'bar_notice' ? 'bg-amber-50 text-amber-900 border border-amber-200' :
                        'bg-blue-50 text-blue-900 border border-blue-200'
                      }`}>
                        {notice.category.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-slate-500 flex items-center space-x-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{notice.event_date ? new Date(notice.event_date).toLocaleDateString() : 'Active'}</span>
                      </span>
                    </div>

                    <h3 className="font-serif font-bold text-base text-slate-900">
                      {locale === 'hi' ? notice.title_hi : notice.title_en}
                    </h3>

                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                      {locale === 'hi' ? notice.content_hi : notice.content_en}
                    </p>

                    {notice.venue && (
                      <div className="flex items-center space-x-1.5 text-xs text-slate-500 bg-slate-50 p-2 rounded">
                        <MapPin className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                        <span className="truncate">{notice.venue}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span className="truncate max-w-[200px]">By: {notice.organizer}</span>
                    {notice.official_source_url && (
                      <a
                        href={notice.official_source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-700 font-semibold hover:underline flex items-center space-x-1"
                      >
                        <span>Official Circular</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 3. NEW LAWS & VERIFIED JUDGMENTS */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b pb-4 border-slate-200">
            <div>
              <div className="flex items-center space-x-2 text-blue-700 font-bold text-xs uppercase tracking-wider">
                <BookOpen className="w-4 h-4" />
                <span>Statutory Updates & High Court Rulings</span>
              </div>
              <h2 className="font-serif font-bold text-2xl text-slate-900 mt-1">
                {locale === 'hi' ? 'नवीन कानून एवं न्यायिक निर्णय' : 'New Central Laws (BNSS/BNS/BSA) & Landmark Judgments'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Verified summaries, statutory sections, and authentic case citations
              </p>
            </div>
            <div className="flex items-center space-x-2 mt-2 sm:mt-0">
              <Link
                href="/laws"
                className="text-xs font-semibold px-3 py-1.5 bg-blue-50 text-blue-800 hover:bg-blue-100 rounded-lg flex items-center space-x-1 border border-blue-200"
              >
                <span>{locale === 'hi' ? 'बरे एक्ट्स (कानून)' : 'Bare Acts'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/judgments"
                className="text-xs font-semibold px-3 py-1.5 bg-amber-50 text-amber-900 hover:bg-amber-100 rounded-lg flex items-center space-x-1 border border-amber-200"
              >
                <span>{locale === 'hi' ? 'न्यायिक निर्णय' : 'Precedents'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {legalUpdates.slice(0, 4).map(law => (
              <div
                key={law.id}
                className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between hover:border-amber-400 transition"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 bg-blue-50 text-blue-800 rounded">
                      {law.category.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] text-emerald-700 font-medium flex items-center space-x-1">
                      <CheckCircle className="w-3 h-3" />
                      <span>Verified Statute</span>
                    </span>
                  </div>

                  <h3 className="font-serif font-bold text-base text-slate-900">
                    {locale === 'hi' ? law.title_hi : law.title_en}
                  </h3>

                  <div className="text-xs font-mono text-slate-500">
                    {law.citation || law.act_or_case_name}
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                    {locale === 'hi' ? law.summary_hi : law.summary_en}
                  </p>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {law.key_sections.map((sec, idx) => (
                      <span key={idx} className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                        {sec}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400">
                    Enacted: {law.decision_or_commencement_date || 'In Force'}
                  </span>
                  <a
                    href={law.official_source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-700 font-medium hover:underline flex items-center space-x-1"
                  >
                    <span>{t.officialSource}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 4. DOWNLOADABLE LEGAL FORMS & FORMATS */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b pb-4 border-slate-200">
            <div>
              <div className="flex items-center space-x-2 text-emerald-700 font-bold text-xs uppercase tracking-wider">
                <FileText className="w-4 h-4" />
                <span>Court Practice Repository</span>
              </div>
              <h2 className="font-serif font-bold text-2xl text-slate-900 mt-1">
                {locale === 'hi' ? 'मानक विधिक प्रारूप एवं आवेदन पत्र' : 'Downloadable Legal Forms & Practice Templates'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Bail petitions, interim stay applications, affidavits, and demand notices
              </p>
            </div>
            <Link
              href="/forms"
              className="text-xs font-semibold text-emerald-800 hover:text-emerald-900 flex items-center space-x-1 mt-2 sm:mt-0"
            >
              <span>{locale === 'hi' ? 'सभी प्रारूप देखें' : 'View All Formats'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {legalForms.slice(0, 3).map(form => (
              <div
                key={form.id}
                className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between hover:shadow-md transition"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-semibold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded">
                      {form.category}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {form.downloads_count} downloads
                    </span>
                  </div>

                  <h3 className="font-serif font-bold text-base text-slate-900">
                    {locale === 'hi' ? form.title_hi : form.title_en}
                  </h3>

                  <p className="text-xs text-slate-600 line-clamp-2">
                    {locale === 'hi' ? form.description_hi : form.description_en}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-mono">Format: .DOCX</span>
                  <Link
                    href={`/forms#${form.id}`}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium shadow-sm transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 5. MY CASE AI LEGAL OFFICE BANNER */}
        <section className="bg-gradient-to-r from-legal-navy via-slate-900 to-legal-navyDark text-white rounded-2xl p-8 sm:p-12 shadow-xl border border-legal-gold/40 flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold">
              <Lock className="w-3.5 h-3.5" />
              <span>Confidential • Zero-Knowledge Architecture</span>
            </div>

            <h2 className="font-serif font-bold text-2xl sm:text-4xl text-white">
              {locale === 'hi'
                ? 'माई केस — अधिवक्ताओं हेतु निजी एआई लीगल ऑफिस'
                : 'My Case — Private AI Legal Office for Advocates'}
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-light">
              Manage your case files, daily cause lists, confidential documents, client fee notes, and AI drafting studio in complete privacy. Strictly isolated multi-tenant architecture ensures no third party or administrator can view your privileged case dossiers.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-xs text-amber-200">
              <div className="flex items-center space-x-1.5">
                <CheckCircle className="w-4 h-4 text-amber-400" />
                <span>CNR & Hearing Diary</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <CheckCircle className="w-4 h-4 text-amber-400" />
                <span>AI Drafting Studio</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <CheckCircle className="w-4 h-4 text-amber-400" />
                <span>Fee Ledger & Invoices</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0 w-full sm:w-auto">
            <Link
              href="/my-case"
              className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-sm shadow-lg transition text-center flex items-center justify-center space-x-2"
            >
              <span>{locale === 'hi' ? 'माई केस ऑफिस खोलें' : 'Launch My Case Office'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/auth/login"
              className="px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs text-center border border-white/20 transition"
            >
              Advocate Sign In / Register
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
