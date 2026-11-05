'use client';

import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('General Query');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl space-y-8">
      <div className="border-b pb-6 border-slate-200">
        <h1 className="font-serif font-bold text-3xl text-slate-900">
          Contact & Legal Inquiry
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Have an inquiry, report outdated information, or submit a profile correction request.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="space-y-4 text-xs text-slate-600">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="font-bold text-sm text-slate-900 font-serif">Chamber Liaison</h3>
            <div className="flex items-start space-x-2">
              <MapPin className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <span>District Court Campus, Station Road, Alwar, Rajasthan 301001</span>
            </div>
            <div className="flex items-center space-x-2">
              <Phone className="w-4 h-4 text-amber-700 shrink-0" />
              <span>Helpline: 0144-2334455</span>
            </div>
            <div className="flex items-center space-x-2">
              <Mail className="w-4 h-4 text-amber-700 shrink-0" />
              <span>contact@alwaradvocates.org</span>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          {submitted ? (
            <div className="p-6 text-center space-y-2 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <h3 className="font-bold text-sm">Message Recorded Successfully</h3>
              <p className="text-xs text-emerald-700">
                Your communication has been logged in the portal administration queue. We will review your submission shortly.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Your Name</label>
                  <input
                    required
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full p-2.5 border rounded-lg"
                    placeholder="Advocate / Visitor Name"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Your Email</label>
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full p-2.5 border rounded-lg"
                    placeholder="email@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Subject</label>
                <select
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  className="w-full p-2.5 border rounded-lg bg-white"
                >
                  <option>General Query</option>
                  <option>Advocate Profile Correction</option>
                  <option>Report Outdated Law / Notice</option>
                  <option>Welfare Scheme Inaccuracy</option>
                  <option>My Case Technical Support</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Detailed Message</label>
                <textarea
                  required
                  rows={4}
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  className="w-full p-2.5 border rounded-lg"
                  placeholder="Please state details, citation references, or profile correction specifics..."
                />
              </div>

              <button
                type="submit"
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold text-xs transition flex items-center space-x-1.5 shadow"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit Communication</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
