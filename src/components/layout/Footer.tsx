'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/context';
import { Scale, ExternalLink, ShieldAlert, Phone, Mail, MapPin } from 'lucide-react';

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="bg-legal-navy text-slate-300 border-t border-legal-gold/30 mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Col 1: Identity & Legal Mandate */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Scale className="w-6 h-6 text-amber-400" />
              <span className="font-serif font-bold text-lg text-white">
                {t.siteName}
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              A comprehensive legal technology initiative engineered for practicing advocates in Alwar, Rajasthan. Combining verified statutory repositories, an advocate community forum, and an encrypted AI legal office.
            </p>
            <div className="pt-2 text-xs text-slate-400 space-y-1">
              <div className="flex items-center space-x-2">
                <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>District Court Campus, Alwar, Rajasthan 301001</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Legal Aid Helpline: 15100 / DLSA Alwar</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>help@alwaradvocates.org</span>
              </div>
            </div>
          </div>

          {/* Col 2: Official Court & Statutory Resources */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-amber-300 font-serif">
              Official Portals
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a
                  href="https://districts.ecourts.gov.in/alwar"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-amber-300 transition flex items-center space-x-1"
                >
                  <span>eCourts Services — Alwar District</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
              <li>
                <a
                  href="https://hcraj.nic.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-amber-300 transition flex items-center space-x-1"
                >
                  <span>Rajasthan High Court (Jaipur & Jodhpur)</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.indiacode.nic.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-amber-300 transition flex items-center space-x-1"
                >
                  <span>India Code — Central Legislative Repository</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
              <li>
                <a
                  href="http://barcouncilofrajasthan.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-amber-300 transition flex items-center space-x-1"
                >
                  <span>Bar Council of Rajasthan (Welfare Fund)</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
              <li>
                <a
                  href="https://efiling.ecourts.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-amber-300 transition flex items-center space-x-1"
                >
                  <span>National e-Filing Portal 3.0</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: Portal Modules */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-amber-300 font-serif">
              Platform Modules
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/advocates" className="hover:text-amber-300 transition">
                  Verified Advocate Directory
                </Link>
              </li>
              <li>
                <Link href="/welfare" className="hover:text-amber-300 transition">
                  Advocate Welfare Schemes & Benefits
                </Link>
              </li>
              <li>
                <Link href="/laws" className="hover:text-amber-300 transition">
                  BNS, BNSS, BSA & Rajasthan Acts
                </Link>
              </li>
              <li>
                <Link href="/forms" className="hover:text-amber-300 transition">
                  Downloadable Legal Forms & Formats
                </Link>
              </li>
              <li>
                <Link href="/forum" className="hover:text-amber-300 transition">
                  Advocates Professional Forum
                </Link>
              </li>
              <li>
                <Link href="/my-case" className="text-amber-400 font-medium hover:underline">
                  My Case — Private AI Legal Office
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Governance & Separate Admin Panels */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-amber-300 font-serif">
              Governance & Admin
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/public-admin/login" className="hover:text-blue-300 transition flex items-center space-x-1">
                  <span>Public Portal Administration</span>
                </Link>
              </li>
              <li>
                <Link href="/case-admin/login" className="hover:text-red-300 transition flex items-center space-x-1">
                  <span>My Case Service Admin (Zero-Knowledge)</span>
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-amber-300 transition">
                  About the Platform
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-amber-300 transition">
                  Privacy Policy & Professional Privilege
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-amber-300 transition">
                  Terms of Practice Service
                </Link>
              </li>
              <li>
                <Link href="/disclaimer" className="hover:text-amber-300 transition">
                  Non-Affiliation Disclaimer
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Independence Disclaimer & Copyright */}
        <div className="mt-10 pt-6 border-t border-slate-700/60 flex flex-col md:flex-row items-center justify-between text-[11px] text-slate-400 gap-4">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Disclaimer: This platform is an independent legal resource initiative for advocates practicing in Alwar and Rajasthan. It is not an official organ of the Bar Council of Rajasthan or the District Bar Association unless formal notification is issued.
            </span>
          </div>
          <div className="shrink-0 text-slate-500">
            © {new Date().getFullYear()} Alwar Advocates Portal. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
