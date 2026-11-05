'use client';

import React from 'react';
import { Scale, Users, MapPin, Phone, Mail, Award, Clock } from 'lucide-react';

export default function BarAssociationPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl space-y-8">
      <div className="border-b pb-6 border-slate-200">
        <h1 className="font-serif font-bold text-3xl text-slate-900">
          District & Sessions Bar Association, Alwar
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Historical overview, executive committee contact information, chamber allocation, and welfare trustee liaison.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6 text-xs text-slate-700 leading-relaxed bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="font-serif font-bold text-base text-legal-navy">
            Bar Association Overview
          </h2>
          <p>
            The District & Sessions Bar Association of Alwar represents enrolled advocates practicing across the District and Sessions Court, Family Courts, Commercial Courts, MACT, and Revenue Courts of Alwar.
          </p>
          <p>
            The Association actively collaborates with the Bar Council of Rajasthan (Jodhpur) for the administration of the Advocates Welfare Fund, young advocate mentorship, and continuous legal education programs.
          </p>

          <h3 className="font-bold text-slate-900 pt-2 border-t text-sm font-serif">
            Key Practice Chambers & Facilities
          </h3>
          <ul className="list-disc list-inside space-y-1 text-slate-600">
            <li>Senior Bar Library & Law Reporter Reference Section (District Court Campus)</li>
            <li>Bar Association Auditorium & Mediation Hall</li>
            <li>Revenue Bar Wing (Mini Secretariat Campus, Alwar)</li>
            <li>Advocate Welfare & Mutual Aid Helpdesk</li>
          </ul>
        </div>

        <div className="space-y-4">
          <div className="bg-legal-navy text-white p-5 rounded-2xl space-y-3 shadow-md">
            <h3 className="font-serif font-bold text-sm text-amber-300">
              Bar Office Location
            </h3>
            <div className="text-xs text-slate-300 space-y-2">
              <div className="flex items-start space-x-2">
                <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>Bar Association Building, District Court Campus, Station Road, Alwar (Raj.) 301001</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Office Hours: 10:00 AM – 5:00 PM</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Telephone: 0144-2334455</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
