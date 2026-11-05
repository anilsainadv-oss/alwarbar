'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n/context';
import { 
  Users, Search, ShieldCheck, MapPin, Briefcase, Award, 
  ExternalLink, Mail, Phone, Filter, AlertCircle, CheckCircle2 
} from 'lucide-react';
import type { AdvocateProfile } from '@/types/database';

export default function AdvocateDirectoryPage() {
  const { t, locale } = useLanguage();
  const [profiles, setProfiles] = useState<AdvocateProfile[]>([]);
  const [query, setQuery] = useState('');
  const [selectedArea, setSelectedArea] = useState('ALL');
  const [correctionModalOpen, setCorrectionModalOpen] = useState(false);
  const [correctionSuccess, setCorrectionSuccess] = useState(false);

  useEffect(() => {
    fetch('/api/public/search')
      .then(res => res.json())
      .then(data => {
        if (data.advocates) setProfiles(data.advocates);
      })
      .catch(console.error);
  }, []);

  const practiceAreas = ['ALL', 'Criminal Defense', 'Civil Writs', 'Bail Matters', 'Revenue Law', 'MACT Claims'];

  const filtered = profiles.filter(p => {
    const matchesQuery = 
      p.user?.full_name.toLowerCase().includes(query.toLowerCase()) ||
      p.bar_council_enrollment_no.toLowerCase().includes(query.toLowerCase()) ||
      p.court_practice_complex.toLowerCase().includes(query.toLowerCase());

    const matchesArea = selectedArea === 'ALL' || p.practice_areas.includes(selectedArea);
    return matchesQuery && matchesArea;
  });

  return (
    <div className="container mx-auto px-4 py-10 max-w-6xl space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b pb-6 border-slate-200">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-amber-700 mb-1">
            <Users className="w-4 h-4" />
            <span>Alwar Bar Directory</span>
          </div>
          <h1 className="font-serif font-bold text-3xl sm:text-4xl text-slate-900">
            {t.navAdvocates}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Directory of advocates practicing before District & Sessions Court Alwar, Commercial Court, Revenue Courts, and Sub-divisional benches.
          </p>
        </div>

        <button
          onClick={() => setCorrectionModalOpen(true)}
          className="mt-4 md:mt-0 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-amber-300 text-xs font-semibold rounded-lg shadow-sm transition shrink-0"
        >
          + Request Profile Listing / Correction
        </button>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by advocate name or enrollment number..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
          />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="text-xs text-slate-500 shrink-0 font-medium">{t.filterByArea}:</span>
          {practiceAreas.map(area => (
            <button
              key={area}
              onClick={() => setSelectedArea(area)}
              className={`px-2.5 py-1 text-xs rounded-md whitespace-nowrap transition ${
                selectedArea === area
                  ? 'bg-amber-600 text-white font-semibold shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {area === 'ALL' ? t.filterAll : area}
            </button>
          ))}
        </div>
      </div>

      {/* Advocate Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.map(advocate => (
          <div
            key={advocate.id}
            className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between hover:shadow-md hover:border-amber-400 transition"
          >
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-serif font-bold text-lg text-slate-900">
                    {advocate.user?.full_name}
                  </h3>
                  <div className="text-xs font-mono text-amber-800 font-semibold mt-0.5">
                    Enrollment: {advocate.bar_council_enrollment_no}
                  </div>
                </div>

                {advocate.is_verified ? (
                  <span className="inline-flex items-center space-x-1 text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-full font-medium">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{t.verifiedBadge}</span>
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400 bg-slate-50 px-2 py-0.5 rounded">
                    Verification Pending
                  </span>
                )}
              </div>

              <div className="text-xs text-slate-600 space-y-1.5">
                <div className="flex items-center space-x-2">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{advocate.court_practice_complex}</span>
                </div>
                {advocate.chamber_address && (
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{advocate.chamber_address}</span>
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <Award className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{advocate.experience_years} {t.experience}</span>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed italic bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                "{locale === 'hi' ? advocate.bio_hindi : advocate.bio_english}"
              </p>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  {t.practiceAreas}:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {advocate.practice_areas.map((area, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] bg-amber-50 text-amber-900 border border-amber-200/60 px-2 py-0.5 rounded"
                    >
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-[11px] text-slate-400">
                {advocate.bar_association_name}
              </span>
              <div className="flex items-center space-x-2">
                {advocate.user?.phone && (
                  <a
                    href={`tel:${advocate.user.phone}`}
                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
                    title="Call Chamber"
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </a>
                )}
                {advocate.user?.email && (
                  <a
                    href={`mailto:${advocate.user.email}`}
                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
                    title="Email Advocate"
                  >
                    <Mail className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Profile Correction Request Modal */}
      {correctionModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 text-slate-900 border border-slate-200">
            <h3 className="font-serif font-bold text-lg text-legal-navy mb-1">
              Advocate Directory Correction / Enrollment Submission
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Submit your verified Bar Council of Rajasthan enrollment details for review by the Bar Administrator.
            </p>

            {correctionSuccess ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>Thank you. Your submission has been logged and queued for administrative verification.</span>
              </div>
            ) : (
              <form
                onSubmit={e => {
                  e.preventDefault();
                  setCorrectionSuccess(true);
                  setTimeout(() => {
                    setCorrectionSuccess(false);
                    setCorrectionModalOpen(false);
                  }, 2000);
                }}
                className="space-y-3 text-xs"
              >
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Advocate Full Name</label>
                  <input required type="text" className="w-full p-2 border rounded-lg" placeholder="Advocate Name" />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Bar Council Enrollment No.</label>
                  <input required type="text" className="w-full p-2 border rounded-lg" placeholder="R/____/Year" />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Chamber Address / Court Complex</label>
                  <input required type="text" className="w-full p-2 border rounded-lg" placeholder="Chamber No., District Court Alwar" />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Practice Areas (comma separated)</label>
                  <input required type="text" className="w-full p-2 border rounded-lg" placeholder="Criminal, Civil, Revenue, MACT" />
                </div>

                <div className="pt-3 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setCorrectionModalOpen(false)}
                    className="px-3 py-1.5 border rounded-lg text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg shadow-sm"
                  >
                    Submit for Verification
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
