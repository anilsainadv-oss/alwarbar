'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Scale, Lock, Mail, ArrowRight, AlertCircle, ShieldCheck } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/context';

export default function LoginPage() {
  const router = useRouter();
  const { t, locale } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('ईमेल अथवा सनद संख्या एवं पासवर्ड दर्ज करना अनिवार्य है।');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password: password.trim() })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'प्रमाणीकरण विफल (Authentication failed)');
      }

      if (data.user?.role === 'public_admin') {
        window.location.href = '/public-admin/dashboard';
      } else if (data.user?.role === 'case_admin') {
        window.location.href = '/case-admin/dashboard';
      } else {
        window.location.href = '/my-case/dashboard';
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-legal-navy text-amber-400 rounded-xl flex items-center justify-center mx-auto mb-3 shadow">
            <Scale className="w-6 h-6" />
          </div>
          <h1 className="font-serif font-bold text-2xl text-legal-navy">
            {t.navLogin || 'अधिवक्ता लॉगिन'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            My Case AI Legal Office & Bar Portal
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              ईमेल अथवा सनद संख्या (Email / Enrollment No.)
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="username"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                placeholder="advocate@alwarbar.in अथवा R/..."
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              पासवर्ड (Password)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                placeholder="••••••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-lg bg-legal-navy hover:bg-slate-800 text-amber-300 font-semibold text-sm transition flex items-center justify-center space-x-2 shadow"
          >
            <span>{loading ? 'सत्यापन हो रहा है...' : 'सुरक्षित लॉगिन करें (Sign In) →'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="text-center pt-1 text-xs">
            <span className="text-slate-500">
              {locale === 'hi' ? 'नवीन अधिवक्ता हैं? ' : 'New Advocate? '}
            </span>
            <Link 
              href="/auth/register" 
              className="text-amber-800 hover:text-amber-900 font-bold hover:underline"
            >
              {locale === 'hi' ? 'यहाँ नया खाता पंजीकृत करें (Register Here) →' : 'Register New Account →'}
            </Link>
          </div>

          <div className="flex items-center justify-between pt-2 text-xs border-t border-slate-100">
            <Link 
              href="/auth/change-password" 
              className="text-amber-800 hover:text-amber-900 hover:underline font-medium flex items-center space-x-1"
            >
              <span>🔐 पासवर्ड बदलें (Change Password)</span>
            </Link>
            <div className="flex items-center space-x-1 text-slate-400 text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>256-Bit SSL Secured</span>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
