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
  const [password, setPassword] = useState('Advocate@2026');
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
        </form>

        {/* Quick Demo Credentials Guide */}
        <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-500">
          <p className="font-semibold text-slate-700 mb-2">Preset Local Accounts:</p>
          <div className="space-y-1 text-[11px] font-mono bg-slate-50 p-2.5 rounded border border-slate-200">
            <div>⚖️ <strong>Advocate:</strong> advocate.rajesh@alwarbar.in / Advocate@2026</div>
            <div>🏛️ <strong>Public Admin:</strong> public.admin@alwaradvocates.org / AdminPass@2026</div>
            <div>🛡️ <strong>Case Admin:</strong> case.admin@alwaradvocates.org / CaseAdmin@2026</div>
          </div>
          <div className="mt-3 text-center">
            <Link href="/auth/bootstrap" className="text-amber-700 hover:underline">
              Bootstrap Initial Super-Admin Token →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
