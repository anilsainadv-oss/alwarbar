'use client';

import React from 'react';
import { useLanguage } from '@/lib/i18n/context';
import { Briefcase, ExternalLink, Calendar, MapPin, FileCheck, Calculator, Clock, ShieldCheck } from 'lucide-react';

export default function CourtResourcesPage() {
  const { t, locale } = useLanguage();

  const alwarCourts = [
    { name: 'District & Sessions Court, Alwar', location: 'Station Road, Court Campus, Alwar', jurisdiction: 'Principal civil and criminal jurisdiction, Sessions trials, Commercial suits, SC/ST trials' },
    { name: 'Commercial Court, Alwar', location: 'District Court Complex, Alwar', jurisdiction: 'Commercial disputes above ₹3,00,000, Arbitration matters, Specific contract enforcement' },
    { name: 'Family Court, Alwar', location: 'Court Campus, Alwar', jurisdiction: 'Matrimonial disputes, Hindu Marriage Act petitions, Maintenance under Sec 144 BNSS / 125 CrPC' },
    { name: 'Motor Accident Claims Tribunal (MACT), Alwar', location: 'Court Campus, Alwar', jurisdiction: 'Claims under Motor Vehicles Act for fatal and non-fatal road accidents' },
    { name: 'Revenue Courts / Sub-Divisional Officer (SDO)', location: 'Mini Secretariat / Collectorate Campus, Alwar', jurisdiction: 'Partition suits (Sec 53 RTA), Khatedari declarations (Sec 88), Injunctions (Sec 212)' },
  ];

  return (
    <div className="container mx-auto px-4 py-10 max-w-5xl space-y-12">
      {/* Title */}
      <div className="border-b pb-6 border-slate-200">
        <div className="inline-flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-amber-700 mb-1">
          <Briefcase className="w-4 h-4" />
          <span>Litigation Practice Support</span>
        </div>
        <h1 className="font-serif font-bold text-3xl sm:text-4xl text-slate-900">
          {locale === 'hi' ? 'न्यायालयी संसाधन एवं दैनिक वकालत मार्गदर्शिका' : 'Court Resources & Daily Litigation Practice'}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-3xl">
          Practical links and verified guidance for eCourts cause lists, certified copies, court fees, and court complex registries across Alwar district.
        </p>
      </div>

      {/* Quick Action Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <a
          href="https://districts.ecourts.gov.in/alwar"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-amber-500 transition group space-y-2"
        >
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
            <Clock className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-sm text-slate-900 group-hover:text-amber-700 transition flex items-center justify-between">
            <span>Alwar Cause Lists</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Daily cause lists for District Judge, CJM, ACJM, and Subordinate Courts Alwar.
          </p>
        </a>

        <a
          href="https://services.ecourts.gov.in/ecourtindia_v6/"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-amber-500 transition group space-y-2"
        >
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
            <FileCheck className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-sm text-slate-900 group-hover:text-amber-700 transition flex items-center justify-between">
            <span>CNR & Case Status</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            National judicial database CNR search for Rajasthan case tracking.
          </p>
        </a>

        <a
          href="https://efiling.ecourts.gov.in"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-amber-500 transition group space-y-2"
        >
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-sm text-slate-900 group-hover:text-amber-700 transition flex items-center justify-between">
            <span>e-Filing Portal 3.0</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Electronic filing for civil suits, writ petitions, and bail applications.
          </p>
        </a>

        <a
          href="https://epay.ecourts.gov.in"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-amber-500 transition group space-y-2"
        >
          <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
            <Calculator className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-sm text-slate-900 group-hover:text-amber-700 transition flex items-center justify-between">
            <span>e-Court Fees</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Official Rajasthan judicial stamps and court fees online payment gateway.
          </p>
        </a>
      </div>

      {/* Practical Litigation Guides */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Guide 1: Certified Copy Procedure */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-3">
          <h3 className="font-serif font-bold text-base text-slate-900 flex items-center space-x-2">
            <FileCheck className="w-5 h-5 text-amber-700" />
            <span>Certified Copies (Nakal) Procedure in Alwar</span>
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-xs text-slate-700 leading-relaxed">
            <li>Obtain Form No. 12 (Application for Certified Copy) from Copying Agency, District Court.</li>
            <li>Affix ₹5 court fee stamp and verify case number, court name, and exact order date.</li>
            <li>Urgent applications (Dasti nakal) require ₹10 court fee and justification endorsement.</li>
            <li>Submit before 1:00 PM at the Copying Section counter in the Civil Wing.</li>
            <li>Track delivery slip number; standard copies issued within 3-5 working days.</li>
          </ol>
        </div>

        {/* Guide 2: Bail & Surety Verification Rules */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-3">
          <h3 className="font-serif font-bold text-base text-slate-900 flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-emerald-700" />
            <span>Bail Bond & Surety Verification Rules</span>
          </h3>
          <ul className="list-disc list-inside space-y-2 text-xs text-slate-700 leading-relaxed">
            <li>Solvent surety must produce original registered sale deed or Jamabandi nakal within 6 months.</li>
            <li>Patwari valuation certificate required if property value exceeds ₹50,000.</li>
            <li>Surety must submit two passport photographs and Aadhaar card verification.</li>
            <li>Identification of surety must be affirmed on oath by an enrolled advocate.</li>
          </ul>
        </div>
      </div>

      {/* Alwar Court Complexes Directory */}
      <div className="space-y-4">
        <h2 className="font-serif font-bold text-xl text-slate-900">
          Court Complexes & Jurisdictions in Alwar District
        </h2>
        <div className="grid grid-cols-1 gap-4">
          {alwarCourts.map((c, idx) => (
            <div key={idx} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="font-bold text-sm text-slate-900">{c.name}</h3>
                <div className="text-xs text-slate-500 flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                  <span>{c.location}</span>
                </div>
                <p className="text-xs text-slate-600 mt-1">{c.jurisdiction}</p>
              </div>
              <span className="text-[11px] font-mono bg-slate-100 text-slate-700 px-2.5 py-1 rounded self-start md:self-auto">
                Alwar District Roster
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
