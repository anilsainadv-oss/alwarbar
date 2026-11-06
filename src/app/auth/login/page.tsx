'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Scale, Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/context';

export default function LoginPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [email, setEmail] = useState('advocate.rajesh@alwarbar.in');
  const [password, setPassword] = useState('Password@r1234');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      if (data.user?.role === 'public_admin') {
        router.push('/public-admin/dashboard');
      } else if (data.user?.role === 'case_admin') {
        router.push('/case-admin/dashboard');
      } else {
        router.push('/my-case/dashboard');
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
            {t.navLogin}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Access My Case AI Legal Office or Bar Administration
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
              Registered Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                placeholder="name@alwarbar.in"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-lg bg-legal-navy hover:bg-slate-800 text-amber-300 font-semibold text-sm transition flex items-center justify-center space-x-2 shadow"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="flex items-center justify-between pt-1 text-xs">
            <Link 
              href="/auth/change-password" 
              className="text-amber-800 hover:text-amber-900 hover:underline font-medium flex items-center space-x-1"
            >
              <span>🔐 पासवर्ड बदलें (Change Password)</span>
            </Link>
            <Link 
              href="/auth/bootstrap" 
              className="text-slate-500 hover:text-slate-700 hover:underline text-[11px]"
            >
              Bootstrap Admin Token →
            </Link>
          </div>
        </form>

        {/* Quick Demo Credentials Guide */}
        <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-500">
          <p className="font-semibold text-slate-700 mb-2">त्वरित लॉगिन (Click to Fill Preset Accounts):</p>
          <div className="grid grid-cols-2 gap-1.5 text-[11px]">
            <button
              type="button"
              onClick={() => {
                setEmail('anilsain.adv@gmail.com');
                setPassword('Password@r1234');
              }}
              className="text-left px-2 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded text-amber-900 transition font-medium"
            >
              👑 Anil Sain (Admin)
            </button>
            <button
              type="button"
              onClick={() => {
                setEmail('public.admin@alwaradvocates.org');
                setPassword('Password@r1234');
              }}
              className="text-left px-2 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-slate-800 transition font-medium"
            >
              🏛️ Bar Admin
            </button>
            <button
              type="button"
              onClick={() => {
                setEmail('advocate.rajesh@alwarbar.in');
                setPassword('Password@r1234');
              }}
              className="text-left px-2 py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded text-blue-900 transition font-medium"
            >
              ⚖️ Adv. Rajesh Sharma
            </button>
            <button
              type="button"
              onClick={() => {
                setEmail('case.admin@alwaradvocates.org');
                setPassword('Password@r1234');
              }}
              className="text-left px-2 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded text-emerald-900 transition font-medium"
            >
              🛡️ Case Admin
            </button>
          </div>
          <div className="mt-2 text-[10px] text-slate-500 text-center font-mono font-medium">
            वर्तमान पासवर्ड (All Users): <span className="bg-amber-100 text-amber-950 px-1 py-0.5 rounded font-bold">Password@r1234</span>
          </div>
          <div className="mt-2 text-center">
            <Link href="/auth/bootstrap" className="text-amber-700 hover:underline text-[11px]">
              Bootstrap Super-Admin Token →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
