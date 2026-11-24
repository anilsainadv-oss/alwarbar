'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Scale, Lock, Mail, User, Phone, Briefcase, ArrowRight, AlertCircle, ShieldCheck, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/context';

export default function RegisterPage() {
  const router = useRouter();
  const { locale } = useLanguage();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [enrollmentNo, setEnrollmentNo] = useState('');
  const [phone, setPhone] = useState('');
  const [courtComplex, setCourtComplex] = useState('District & Sessions Court, Alwar');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError(locale === 'hi' ? 'पासवर्ड और पुष्टि पासवर्ड मेल नहीं खाते।' : 'Password and confirm password do not match.');
      return;
    }

    if (password.length < 6) {
      setError(locale === 'hi' ? 'पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।' : 'Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password,
          full_name: fullName.trim(),
          phone: phone.trim() || undefined,
          bar_council_enrollment_no: enrollmentNo.trim() || undefined,
          court_practice_complex: courtComplex
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'पंजीयन विफल (Registration failed)');
      }

      setSuccess(true);
      setTimeout(() => {
        window.location.href = '/my-case/dashboard';
      }, 1000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-8 space-y-6">
        <div className="text-center">
          <div className="w-12 h-12 bg-legal-navy text-amber-400 rounded-xl flex items-center justify-center mx-auto mb-3 shadow">
            <Scale className="w-6 h-6" />
          </div>
          <h1 className="font-serif font-bold text-2xl text-legal-navy">
            {locale === 'hi' ? 'अधिवक्ता नवीन पंजीयन' : 'Advocate Registration'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {locale === 'hi'
              ? 'अलवर अधिवक्ता पोर्टल एवं माय केस वर्कस्पेस पर अपना आधिकारिक खाता बनाएं।'
              : 'Create your official advocate account on Alwar Advocates Portal & My Case Workspace.'}
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>
              {locale === 'hi' 
                ? 'खाता सफलतापूर्वक बनाया गया! वर्कस्पेस लोड हो रहा है...' 
                : 'Account created successfully! Loading your legal workspace...'}
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              {locale === 'hi' ? 'अधिवक्ता का पूरा नाम' : 'Advocate Full Name'} *
            </label>
            <div className="relative">
              <input
                required
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Adv. Rajesh Kumar Sharma"
                className="w-full pl-9 pr-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              />
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {locale === 'hi' ? 'ईमेल पता' : 'Email Address'} *
              </label>
              <div className="relative">
                <input
                  required
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="advocate@example.com"
                  className="w-full pl-9 pr-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {locale === 'hi' ? 'मोबाइल नंबर' : 'Phone / Mobile'}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="94140XXXXX"
                  className="w-full pl-9 pr-3 py-2.5 border rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                />
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {locale === 'hi' ? 'बार काउंसिल सनद संख्या' : 'Bar Council Enrollment No.'}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={enrollmentNo}
                  onChange={e => setEnrollmentNo(e.target.value)}
                  placeholder="e.g. R/331/1977"
                  className="w-full pl-9 pr-3 py-2.5 border rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                />
                <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {locale === 'hi' ? 'प्राथमिक न्यायालय परिसर' : 'Primary Court Complex'}
              </label>
              <select
                value={courtComplex}
                onChange={e => setCourtComplex(e.target.value)}
                className="w-full p-2.5 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              >
                <option>District & Sessions Court, Alwar</option>
                <option>Court of CJM / ACJM, Alwar</option>
                <option>Commercial Court, Alwar</option>
                <option>Family Court No. 1, Alwar</option>
                <option>Motor Accident Claims Tribunal, Alwar</option>
                <option>Sub-Divisional Officer (SDO Revenue Court), Alwar</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {locale === 'hi' ? 'गुप्त पासवर्ड (Password)' : 'Password'} *
              </label>
              <div className="relative">
                <input
                  required
                  type={showPassword ? 'text' : 'password'}
                  minLength={6}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="न्यूनतम 6 अक्षर"
                  className="w-full pl-9 pr-9 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {locale === 'hi' ? 'पासवर्ड पुष्टि' : 'Confirm Password'} *
              </label>
              <div className="relative">
                <input
                  required
                  type={showPassword ? 'text' : 'password'}
                  minLength={6}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="पुनः दर्ज करें"
                  className="w-full pl-9 pr-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 space-y-1">
            <span className="font-bold text-slate-800 block">सत्यापन सूचना (Verification Notice):</span>
            <p>
              खाता पंजीयन उपरांत बार काउंसिल सत्यापन की प्रक्रिया आरंभ होगी। आप तुरंत अपनी वाद पंजिका एवं क्लाइंट डायरेक्टरी का उपयोग आरंभ कर सकते हैं।
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-legal-navy hover:bg-slate-800 text-amber-300 font-semibold rounded-lg shadow-sm transition flex items-center justify-center space-x-2 disabled:opacity-50 text-sm"
          >
            <span>{loading ? 'पंजीयन हो रहा है...' : (locale === 'hi' ? 'अधिवक्ता खाता पंजीकृत करें' : 'Create Advocate Account')}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="text-center pt-2 text-xs border-t border-slate-100">
            <span className="text-slate-500">
              {locale === 'hi' ? 'पहले से पंजीकृत हैं? ' : 'Already have an account? '}
            </span>
            <Link
              href="/auth/login"
              className="text-amber-800 hover:text-amber-900 font-semibold hover:underline"
            >
              {locale === 'hi' ? 'लॉगिन करें (Sign In)' : 'Sign In Here'}
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
